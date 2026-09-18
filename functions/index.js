import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { createTransport } from "nodemailer";
import { createHash } from "node:crypto";

initializeApp();
const db = getFirestore();

const SMTP_HOST = defineSecret("SMTP_HOST");
const SMTP_PORT = defineSecret("SMTP_PORT");
const SMTP_USER = defineSecret("SMTP_USER");
const SMTP_PASS = defineSecret("SMTP_PASS");

const ADMIN_UID = "5lebcavXCOfUfXwU9Xvt0UMo8883";
const FROM = '"BETLOCK" <hello@betlockapp.com>';

const allSecrets = [SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS];

// Secrets pasted through a shell often carry a trailing newline, which
// turns the host into an unresolvable name (EBADNAME) and breaks auth.
const secret = (s) => s.value().trim();

function mailer() {
  const port = Number(secret(SMTP_PORT));
  return createTransport({
    host: secret(SMTP_HOST),
    port,
    secure: port === 465,
    auth: { user: secret(SMTP_USER), pass: secret(SMTP_PASS) },
  });
}

// ── Waitlist signup (the only way in) ──
// Clients can no longer write /waitlist directly (see firestore.rules), so
// every signup passes through here, where it is rate limited by IP, by
// browser session and globally before anything is stored or emailed.

// Fixed windows. `global` is a circuit breaker: a flood that rotates IPs
// still cannot turn the confirmation email into a spam cannon.
const HOUR = 60 * 60 * 1000;
const LIMITS = {
  ip: [{ window: HOUR, max: 100 }],
  session: [{ window: HOUR, max: 100 }],
  global: [{ window: HOUR, max: 1000 }],
};

// Every signup gets the same gift; it is stored on the waitlist doc so
// launch day can honour exactly what each person was promised.
const PRIZE = "1 month free";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SESSION_RE = /^[A-Za-z0-9-]{16,64}$/;

const sha256 = (s) => createHash("sha256").update(s).digest("hex");

// On Cloud Run, Google's front end appends the address it actually saw to
// X-Forwarded-For. Anything before it was supplied by the client and can be
// forged, so only the last entry is trusted.
function clientIp(req) {
  const xff = String(req.headers["x-forwarded-for"] || "");
  const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
  return parts.at(-1) || req.ip || "unknown";
}

// The org policy forbids granting `allUsers`, so this Cloud Run service is
// made public with `--no-invoker-iam-check` instead. If a redeploy ever
// makes it return 403 again, re-run:
//   gcloud run services update joinwaitlist --no-invoker-iam-check \
//     --region=us-central1 --project=betlockapp
export const joinWaitlist = onCall(
  {
    region: "us-central1",
    maxInstances: 5,
    cors: true,
  },
  async (request) => {
    const { email: raw, session, website } = request.data || {};

    // Honeypot: a field humans never see. Bots that fill it get a fake
    // success so they have no signal to adapt to.
    if (website) return { status: "ok" };

    const email = String(raw || "").toLowerCase().trim();
    if (email.length < 5 || email.length > 254 || !EMAIL_RE.test(email)) {
      throw new HttpsError("invalid-argument", "Invalid email.");
    }

    const now = Date.now();
    const keys = [
      ...LIMITS.ip.map((l) => ({ ...l, id: `ip_${sha256(clientIp(request.rawRequest)).slice(0, 32)}_${l.window}` })),
      ...(SESSION_RE.test(String(session || ""))
        ? LIMITS.session.map((l) => ({ ...l, id: `ss_${sha256(session).slice(0, 32)}_${l.window}` }))
        : []),
      ...LIMITS.global.map((l) => ({ ...l, id: `global_${l.window}` })),
    ];
    const limitRefs = keys.map((k) => db.collection("rateLimits").doc(k.id));

    return db.runTransaction(async (tx) => {
      const snaps = await Promise.all(limitRefs.map((r) => tx.get(r)));
      const existing = await tx.get(
        db.collection("waitlist").where("email", "==", email).limit(1),
      );

      // Check every window before writing any, so a rejected attempt
      // doesn't count against the others.
      const next = keys.map((k, i) => {
        const d = snaps[i].data();
        const fresh = !d || now - d.start >= k.window;
        return { start: fresh ? now : d.start, count: fresh ? 1 : d.count + 1, k };
      });
      if (next.some((n) => n.count > n.k.max)) {
        throw new HttpsError("resource-exhausted", "Too many attempts. Try again later.");
      }

      next.forEach((n, i) => {
        tx.set(limitRefs[i], {
          start: n.start,
          count: n.count,
          // Firestore TTL policy on this field deletes stale counters.
          expiresAt: Timestamp.fromMillis(n.start + n.k.window),
        });
      });

      // A repeat signup looks exactly like a new one to the visitor, but
      // nothing is stored and no second email goes out — so the form can't
      // be used to flood someone else's inbox.
      if (!existing.empty) {
        return { status: "ok", prize: existing.docs[0].data().prize || PRIZE };
      }

      tx.create(db.collection("waitlist").doc(sha256(email).slice(0, 40)), {
        email,
        prize: PRIZE,
        createdAt: FieldValue.serverTimestamp(),
      });
      return { status: "ok", prize: PRIZE };
    });
  },
);

// ── Waitlist confirmation ──
// Fires when a new doc is created in /waitlist/{id}.
// Sends a welcome email with "first month free" offer.

export const onWaitlistSignup = onDocumentCreated(
  { document: "waitlist/{docId}", secrets: allSecrets, region: "us-central1" },
  async (event) => {
    const data = event.data?.data();
    if (!data?.email) return;

    const email = data.email;
    const transport = mailer();

    await transport.sendMail({
      from: FROM,
      to: email,
      subject: "You're on the BETLOCK waitlist 🎰",
      html: confirmationHtml(email),
    });
  },
);

// ── Broadcast to all waitlist ──
// Admin-only callable function to send an email to every waitlist member.
// Usage: call with { subject, html } or { subject, template: "launch" }

export const sendBroadcast = onCall(
  { secrets: allSecrets, region: "us-central1", enforceAppCheck: false, cors: true },
  async (request) => {
    if (!request.auth || request.auth.uid !== ADMIN_UID) {
      throw new HttpsError("permission-denied", "Admin only.");
    }

    // Read from the Firebase-signed ID token. Looking the user up through the
    // Admin Auth API needs an IAM role the org policy doesn't grant here.
    if (request.auth.token.email_verified !== true) {
      throw new HttpsError("permission-denied", "Email not verified.");
    }

    const { subject, template, to } = request.data;
    if (!subject || typeof subject !== "string") {
      throw new HttpsError("invalid-argument", "subject is required.");
    }

    // Test send: one address, any number of times, nothing stored.
    if (to !== undefined) {
      const addr = String(to).toLowerCase().trim();
      if (!EMAIL_RE.test(addr)) throw new HttpsError("invalid-argument", "Invalid email.");
      const body = template === "launch" ? launchHtml() : confirmationHtml(addr);
      await mailer().sendMail({ from: FROM, to: addr, subject, html: body });
      return { sent: 1, failed: 0, total: 1 };
    }

    let html;
    if (template === "launch") {
      html = launchHtml();
    } else if (request.data.html && typeof request.data.html === "string") {
      html = request.data.html;
    } else {
      throw new HttpsError(
        "invalid-argument",
        'Provide template:"launch" or a custom html body.',
      );
    }

    const snap = await db.collection("waitlist").get();
    const transport = mailer();
    let sent = 0;
    let failed = 0;

    for (const doc of snap.docs) {
      const addr = doc.data().email;
      if (!addr) continue;
      try {
        await transport.sendMail({ from: FROM, to: addr, subject, html });
        sent++;
      } catch (err) {
        console.error(`Failed to send to ${addr}:`, err.message);
        failed++;
      }
    }

    return { sent, failed, total: snap.size };
  },
);

// ── Email templates ──
// Table layout + inline styles only: that is what Gmail, Outlook and Apple
// Mail all agree on. Card tilt uses `transform`, which Gmail drops — the
// cards simply sit straight there, the stagger still reads.

const SITE = "https://betlockapp.com";
const LOGO = "https://betlockapp.com/brand/appicon.png";
const FONT = "'Helvetica Neue',Helvetica,Arial,sans-serif";
const MONO = "'SF Mono',Menlo,Consolas,'Courier New',monospace";
// U+FE0E keeps iOS from turning suits into emoji.
const SUIT = { s: "&#9824;&#65038;", h: "&#9829;&#65038;", d: "&#9830;&#65038;", c: "&#9827;&#65038;" };

function playingCard(rank, suit, { tilt = 0, drop = 0 } = {}) {
  const color = suit === "h" || suit === "d" ? "#ED1E24" : "#0E1116";
  return `<td valign="top" style="padding:${drop}px 8px 0 0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="64" style="width:64px;background:#FAFAF7;border-radius:9px;transform:rotate(${tilt}deg);box-shadow:0 12px 24px rgba(0,0,0,.55);">
      <tr><td style="padding:7px 0 0 8px;height:24px;font:900 15px/15px ${FONT};color:${color};">${rank}<br>${SUIT[suit]}</td></tr>
      <tr><td align="center" style="padding:0 0 14px;height:48px;font:900 36px/40px ${FONT};color:${color};">${SUIT[suit]}</td></tr>
    </table>
  </td>`;
}

function chip(label, bg = "#ED1E24", { drop = 0 } = {}) {
  return `<td valign="top" style="padding:${drop}px 0 0 4px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="58" style="width:58px;height:58px;border-radius:29px;background:${bg};border:4px dashed #FAFAF7;box-shadow:0 12px 24px rgba(0,0,0,.55);">
      <tr><td align="center" valign="middle" style="height:50px;font:900 17px/17px ${FONT};color:#FFFFFF;letter-spacing:-.5px;">${label}</td></tr>
    </table>
  </td>`;
}

function eyebrow(text, color = "#71717A") {
  return `<p style="margin:0;font:600 11px/16px ${MONO};letter-spacing:2.5px;text-transform:uppercase;color:${color};">${text}</p>`;
}

function button(label, href) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td bgcolor="#ED1E24" style="border-radius:999px;">
      <a href="${href}" style="display:inline-block;padding:17px 30px;font:800 15px/15px ${FONT};letter-spacing:.5px;text-transform:uppercase;color:#FFFFFF;text-decoration:none;border-radius:999px;">${label} &nbsp;&#8599;</a>
    </td>
  </tr></table>`;
}

function steps() {
  const rows = [
    ["01", "Your minutes become chips", "Every minute of screen time is currency."],
    ["02", "You play a real hand", "Blackjack, roulette. Win and your balance climbs."],
    ["03", "Hit zero, your apps lock", "Enforced by iOS Screen Time. Not a reminder."],
  ];
  return rows.map(([n, t, d], i) => `<tr>
    <td valign="top" width="44" style="padding:${i ? 18 : 0}px 0 0;font:700 12px/20px ${MONO};color:#ED1E24;">${n}</td>
    <td valign="top" style="padding:${i ? 18 : 0}px 0 0;">
      <p style="margin:0;font:800 16px/20px ${FONT};color:#FAFAFA;letter-spacing:-.2px;">${t}</p>
      <p style="margin:4px 0 0;font:400 14px/21px ${FONT};color:#A1A1AA;">${d}</p>
    </td>
  </tr>`).join("");
}

function layout({ preheader, hero, body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>BETLOCK</title>
</head>
<body style="margin:0;padding:0;background:#08080A;" bgcolor="#08080A">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#08080A;">${preheader}&#8199;&#65279;&#847; &#8199;&#65279;&#847; &#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#08080A" style="background:#08080A;">
<tr><td align="center" style="padding:36px 16px 48px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

  <!-- header -->
  <tr><td style="padding:0 4px 28px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td valign="middle">
        <a href="${SITE}" style="text-decoration:none;">
          <img src="${LOGO}" width="40" height="40" alt="BETLOCK" style="display:inline-block;vertical-align:middle;width:40px;height:40px;border-radius:11px;border:0;">
          <span style="display:inline-block;vertical-align:middle;margin-left:10px;font:900 19px/19px ${FONT};letter-spacing:-.5px;"><span style="color:#ED1E24;">BET</span><span style="color:#FAFAFA;">LOCK</span></span>
        </a>
      </td>
      <td align="right" valign="middle">${eyebrow("Screentime casino")}</td>
    </tr></table>
  </td></tr>

  <!-- hero -->
  <tr><td bgcolor="#0E0E11" style="background:#0E0E11;border:1px solid #1E1E23;border-radius:28px;padding:34px 30px 36px;">
    ${hero}
  </td></tr>

  ${body}

  <!-- footer -->
  <tr><td style="padding:36px 4px 0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td valign="middle"><img src="${LOGO}" width="24" height="24" alt="" style="display:block;width:24px;height:24px;border-radius:7px;border:0;"></td>
      <td valign="middle" style="padding-left:9px;font:900 13px/13px ${FONT};letter-spacing:-.3px;"><span style="color:#ED1E24;">BET</span><span style="color:#A1A1AA;">LOCK</span></td>
    </tr></table>
    <p style="margin:14px 0 0;font:400 12px/19px ${FONT};color:#52525B;">
      You’re receiving this because you joined the waitlist at
      <a href="${SITE}" style="color:#71717A;text-decoration:underline;">betlockapp.com</a>.
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function confirmationHtml(email) {
  const hero = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      ${playingCard("A", "s", { tilt: -8 })}
      ${playingCard("K", "h", { tilt: 6, drop: 10 })}
      ${chip("30", "#ED1E24", { drop: 26 })}
    </tr></table>
    <div style="height:30px;line-height:30px;">&nbsp;</div>
    ${eyebrow("Waitlist confirmed", "#ED1E24")}
    <h1 style="margin:12px 0 0;font:900 46px/44px ${FONT};letter-spacing:-2px;text-transform:uppercase;color:#FAFAFA;">You’re in.<br><span style="color:#52525B;">Hand dealt.</span></h1>
    <p style="margin:18px 0 0;font:400 16px/25px ${FONT};color:#A1A1AA;">
      You’re on the list for BETLOCK — the app where your screen time is the bet.
      When we launch, you’ll be one of the first at the table.
    </p>`;

  const body = `
  <!-- gift -->
  <tr><td style="padding-top:12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ED1E24" style="background:#ED1E24;border-radius:28px;">
      <tr><td style="padding:28px 30px 30px;">
        ${eyebrow("Your waitlist gift", "#FFD6D7")}
        <p style="margin:10px 0 0;font:900 40px/40px ${FONT};letter-spacing:-1.6px;text-transform:uppercase;color:#FFFFFF;">1 month free</p>
        <p style="margin:10px 0 0;font:400 15px/22px ${FONT};color:#FFE9EA;">Applied automatically on launch day. No code, nothing to remember.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:18px;"><tr>
          <td bgcolor="#0E0E11" style="background:#0E0E11;border-radius:999px;padding:9px 14px;font:600 12px/12px ${MONO};color:#FAFAFA;">${escapeHtml(email)}</td>
        </tr></table>
      </td></tr>
    </table>
  </td></tr>

  <!-- how it works -->
  <tr><td style="padding-top:12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0E0E11" style="background:#0E0E11;border:1px solid #1E1E23;border-radius:28px;">
      <tr><td style="padding:28px 30px 30px;">
        ${eyebrow("How the house works")}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:18px;">${steps()}</table>
        <div style="height:26px;line-height:26px;">&nbsp;</div>
        ${button("Try a hand now", `${SITE}/#play`)}
      </td></tr>
    </table>
  </td></tr>`;

  return layout({ preheader: "You’re on the BETLOCK waitlist — and there’s a gift waiting for you.", hero, body });
}

function launchHtml() {
  const games = [
    ["s", "Blackjack", "Pays 3:2"],
    ["h", "Roulette", "Up to 35:1"],
    ["d", "Real app lock", "Via Screen Time"],
    ["c", "Streaks & stats", "7-day chart"],
  ];

  const hero = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      ${playingCard("A", "s", { tilt: -10 })}
      ${playingCard("Q", "d", { tilt: -2, drop: 8 })}
      ${playingCard("K", "h", { tilt: 7, drop: 16 })}
      ${chip("120", "#0E1116", { drop: 30 })}
    </tr></table>
    <div style="height:30px;line-height:30px;">&nbsp;</div>
    ${eyebrow("Now on the App Store", "#22C55E")}
    <h1 style="margin:12px 0 0;font:900 48px/46px ${FONT};letter-spacing:-2px;text-transform:uppercase;color:#FAFAFA;">We’re live.<br><span style="color:#ED1E24;">Place your bet.</span></h1>
    <p style="margin:18px 0 0;font:400 16px/25px ${FONT};color:#A1A1AA;">
      BETLOCK is out on iPhone. Bet your screen time, play a real hand,
      and win your hours back — or watch your apps lock.
    </p>
    <div style="height:26px;line-height:26px;">&nbsp;</div>
    ${button("Download BETLOCK", SITE)}`;

  const body = `
  <!-- gift -->
  <tr><td style="padding-top:12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ED1E24" style="background:#ED1E24;border-radius:28px;">
      <tr><td style="padding:28px 30px 30px;">
        ${eyebrow("Waitlist gift · unlocked", "#FFD6D7")}
        <p style="margin:10px 0 0;font:900 40px/40px ${FONT};letter-spacing:-1.6px;text-transform:uppercase;color:#FFFFFF;">Your first month is free</p>
        <p style="margin:10px 0 0;font:400 15px/22px ${FONT};color:#FFE9EA;">Download with this email and it’s already applied. No code needed.</p>
      </td></tr>
    </table>
  </td></tr>

  <!-- what's inside -->
  <tr><td style="padding-top:12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0E0E11" style="background:#0E0E11;border:1px solid #1E1E23;border-radius:28px;">
      <tr><td style="padding:26px 30px 24px;">
        ${eyebrow("On the floor")}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;">
          ${games.map(([suit, name, note]) => `<tr>
            <td width="34" style="padding:12px 0;border-top:1px solid #1E1E23;font:900 18px/18px ${FONT};color:${suit === "h" || suit === "d" ? "#ED1E24" : "#FAFAFA"};">${SUIT[suit]}</td>
            <td style="padding:12px 0;border-top:1px solid #1E1E23;font:800 15px/18px ${FONT};color:#FAFAFA;">${name}</td>
            <td align="right" style="padding:12px 0;border-top:1px solid #1E1E23;font:600 11px/18px ${MONO};letter-spacing:1px;text-transform:uppercase;color:#71717A;">${note}</td>
          </tr>`).join("")}
        </table>
      </td></tr>
    </table>
  </td></tr>`;

  return layout({ preheader: "BETLOCK is on the App Store — your first month is on us.", hero, body });
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
