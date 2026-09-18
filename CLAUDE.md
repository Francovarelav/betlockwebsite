# BETLOCK — Landing Page

> Pagina web de lanzamiento para la app BETLOCK

---

## Stack

- **Framework:** Vite + React
- **Styling:** Tailwind CSS v4
- **Hosting:** Vercel (gratis)
- **Analytics:** PostHog o Plausible
- **Waitlist (pre-launch):** Supabase tabla simple o Loops.so

---

## Paleta (misma que la app)

```css
--base:           #09090B;
--surface:        #18181B;
--card:           #27272A;
--accent:         #8B5CF6;
--accent-hover:   #7C3AED;
--win:            #22C55E;
--loss:           #EF4444;
--text-primary:   #FAFAFA;
--text-secondary: #A1A1AA;
--text-tertiary:  #71717A;
--border:         #3F3F46;
```

---

## Tipografia

- **Headings:** Inter Bold o Satoshi Bold
- **Body:** Inter Regular
- **Monospace (numeros):** JetBrains Mono o SF Mono
- **Tamanos:** Hero h1 = 56-72px, h2 = 36-42px, body = 16-18px

---

## Objetivo

Pagina single-page que convierte visitantes en descargas del App Store. Pre-launch funciona como waitlist, post-launch como pagina de descarga directa. Mobile-first, dark theme, debe sentirse como la app.

---

## Dominio

betlock.app (o betlock.co como alternativa)

---

## Secciones de la pagina

### 1. Hero

**Layout:** Full screen height, centrado, fondo #09090B.

**Elementos:**
- Logo BETLOCK arriba (wordmark: BET en #8B5CF6, LOCK en #FAFAFA)
- Headline principal (h1)
- Subheadline (p)
- CTA button
- Mockup del iPhone con la app (Home screen mostrando balance)
- Badge sutil: "Disponible en iOS"

**Copy:**

```
H1: Tu screentime es tu apuesta

Subheadline: Juega blackjack con tus horas de pantalla.
Gana y usalas. Pierde y tu cel se bloquea.

CTA (pre-launch):  "Unirme a la waitlist"
CTA (post-launch): "Descargar gratis" -> link al App Store
```

**Notas de diseno:**
- El mockup del iPhone debe mostrar la pantalla Home con un balance positivo (+4:32h en verde)
- Animacion sutil: las cartas del logo se voltean al cargar
- El fondo puede tener un gradient muy sutil de #09090B a #0F0F14

---

### 2. Como funciona

**Layout:** 3 columnas (desktop) / stack vertical (mobile). Fondo #09090B.

**Copy:**

```
H2: Asi de simple

Paso 1:
Icono: cartas
Titulo: Apuesta tu tiempo
Descripcion: Elige cuantos minutos meter al blackjack,
ruleta o coin flip. Tu screentime es tu moneda.

Paso 2:
Icono: dado
Titulo: Juega y gana (o pierde)
Descripcion: Si ganas, tu balance sube. Mas horas para
usar tu cel. Si pierdes, tu saldo baja.

Paso 3:
Icono: candado
Titulo: Saldo en cero = bloqueado
Descripcion: Tu telefono se bloquea de verdad.
Nada de Instagram hasta que recuperes tu tiempo.
```

**Notas de diseno:**
- Cada paso en una card (#27272A) con border sutil
- Numeracion grande (01, 02, 03) en violet #8B5CF6
- Iconos simples, linea, estilo Tabler o Phosphor

---

### 3. Demo visual

**Layout:** Seccion ancha con mockup interactivo o video demo.

**Opcion A -- Video:**
- Grabacion de pantalla de 15-20 segundos mostrando:
  1. Home con balance
  2. Entra a blackjack
  3. Apuesta 30 minutos
  4. Juega una mano
  5. Pierde -> balance baja
- Autoplay, muted, loop
- Dentro de un frame de iPhone

**Opcion B -- Screenshots estaticos:**
- 3-4 screenshots de la app en frames de iPhone
- Scroll horizontal en mobile
- Pantallas: Home, Blackjack, Shield (bloqueado), Game Selector

**Copy:**

```
H2: No es una app de productividad. Es un casino.

Subtexto: La misma dopamina que te tiene pegado al cel,
pero trabajando a tu favor.
```

---

### 4. Features

**Layout:** 2 columnas alternadas (texto izq + visual der, luego al reves). Fondo #18181B.

**Feature 1:**
```
Titulo: Tu banco de tiempo
Descripcion: Ve tu balance subir y bajar como una cuenta bancaria.
Grafica de 7 dias, historial de apuestas, streaks.
Todo en una interfaz tipo fintech que se siente premium.

Visual: Screenshot de la pantalla Home/Banco
```

**Feature 2:**
```
Titulo: Blackjack, ruleta y mas
Descripcion: Juegos de casino reales con la adrenalina real.
Pero aqui no pierdes dinero -- pierdes TikTok.

Visual: Screenshot de la mesa de blackjack
```

**Feature 3:**
```
Titulo: El bloqueo es real
Descripcion: Si tu saldo llega a cero, tus apps se bloquean
via Screen Time de Apple. No hay trucos, no hay modo facil.
Gana tu tiempo de vuelta o espera al dia siguiente.

Visual: Screenshot del Shield (pantalla de bloqueo)
```

---

### 5. Social proof

**Layout:** Fondo #09090B, centrado. Testimonios o stats.

**Pre-launch (sin usuarios aun):**
```
H2: Unete a los primeros

Stat 1: "2,400+ personas en la waitlist" (cuando aplique)
Stat 2: "4.5 hrs promedio de screentime en Mexico"
Stat 3: "$49/mes -- menos que un cafe al dia"
```

**Post-launch (con usuarios):**
```
H2: Lo que dicen los adictos en recuperacion

Testimonio 1: "Perdi 2 horas en blackjack y me quede sin
cel toda la tarde. Nunca habia sido tan productivo."
-- @usuario, Ciudad de Mexico

Testimonio 2: "Es la unica app que QUIERO abrir para
DEJAR de usar mi telefono."
-- @usuario, Guadalajara

Testimonio 3: "Mi streak va en 14 dias. Le debo
la tesis a BETLOCK."
-- @usuario, Monterrey
```

**Notas:**
- Testimonios en cards con borde violet sutil
- Si no hay testimonios reales aun, usar los stats + un counter de waitlist

---

### 6. Pricing

**Layout:** Card centrada, fondo #09090B.

**Copy:**

```
H2: Menos de $2 pesos al dia

Plan anual (destacado):
  PLAN ANUAL -- MEJOR PRECIO
  $349/ano ($29/mes)
  Ahorras $239

Plan mensual:
  PLAN MENSUAL
  $49/mes

Features incluidas:
  - Blackjack, ruleta, coin flip
  - Bloqueo real de apps
  - Balance y estadisticas
  - Streaks y multiplicadores
  - 3 dias gratis para probar

CTA: [Descargar BETLOCK]
Nota: Cancela cuando quieras
```

**Notas de diseno:**
- Plan anual con borde accent #8B5CF6
- Plan mensual con borde #3F3F46 (mas discreto)
- El plan anual debe verse como la opcion "obvia"
- Badge "Popular" o estrella en el anual
- Features con checkmarks en #22C55E

---

### 7. FAQ

**Layout:** Acordeon expandible, fondo #18181B.

```
H2: Preguntas frecuentes

P: De verdad se bloquea mi telefono?
R: Si. BETLOCK usa el Screen Time API de Apple para bloquear
las apps que tu elijas. Si tu saldo llega a cero, aparece
una pantalla de bloqueo real. No es un honor system.

P: Es gambling real? Es legal?
R: No es gambling con dinero real. Apuestas tiempo, no pesos.
No se requiere licencia de juegos de azar. Es 100% legal.

P: Puedo hacer trampa y desbloquear mis apps?
R: Tecnicamente puedes ir a Settings y revocar el permiso,
pero eso es como ir al gym y no hacer nada.
El punto es que QUIERES el reto.

P: Funciona en Android?
R: Por ahora solo iOS. Android no tiene las mismas APIs
de bloqueo. Pero estamos evaluando una version futura.

P: Puedo perder mas tiempo del que tengo?
R: Si. Tu saldo puede quedar negativo, y se arrastra
al dia siguiente. Pero cada manana recibes tu balance
base para que puedas recuperarte.

P: Cuanto cuesta?
R: $49 MXN/mes o $349/ano (41% de ahorro).
Menos de lo que gastas en un cafe. 3 dias gratis
para que lo pruebes sin riesgo.

P: Puedo cancelar?
R: Si, cuando quieras. Directo desde tu iPhone en
Settings -> Subscriptions. Sin letras chiquitas.
```

---

### 8. CTA final

**Layout:** Full width, centrado, fondo con gradient sutil violet.

**Copy:**

```
H2: Listo para apostar tu tiempo?

Subtexto: Tu siguiente hora de TikTok podria depender
de una mano de blackjack.

CTA: "Descargar BETLOCK" (link App Store)

Debajo: "Disponible en iPhone - iOS 16+ - 3 dias gratis"
```

---

### 9. Footer

**Layout:** Minimal, fondo #09090B.

**Elementos:**
- Logo BETLOCK (wordmark pequeno)
- Links: Privacidad | Terminos | Contacto | Instagram | TikTok
- "Hecho en Monterrey"
- "2026 BETLOCK. Todos los derechos reservados."

---

## Paginas adicionales (links del footer)

### /privacidad
Politica de privacidad estandar. Incluir:
- Que datos recolectamos (Apple ID, email, datos de uso de la app)
- Que NO recolectamos (datos de Screen Time especificos -- son tokens encriptados por Apple)
- Donde se almacena (Supabase, servidores en EUA)
- Como eliminar tu cuenta
- Contacto para privacy requests

### /terminos
Terminos de servicio estandar. Incluir:
- No es gambling real (moneda virtual = tiempo)
- La app no garantiza productividad
- El usuario puede revocar permisos de Screen Time en cualquier momento
- Politica de reembolso (via Apple)
- Jurisdiccion: Mexico

---

## SEO / Metadata

```html
<title>BETLOCK -- Tu screentime es tu apuesta</title>
<meta name="description" content="Juega blackjack con tus horas de pantalla.
Gana y usalas. Pierde y tu cel se bloquea. Descarga gratis en iOS.">

<!-- Open Graph -->
<meta property="og:title" content="BETLOCK -- Tu screentime es tu apuesta">
<meta property="og:description" content="Casino de screentime. Apuesta tus
horas en blackjack, ruleta y coin flip. Si pierdes, tu cel se bloquea.">
<meta property="og:image" content="/og-image.png">
<meta property="og:url" content="https://betlock.app">
<meta property="og:type" content="website">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="BETLOCK -- Tu screentime es tu apuesta">
<meta name="twitter:description" content="Casino de screentime para iOS.
Apuesta tus horas. Gana o pierde acceso.">
<meta name="twitter:image" content="/og-image.png">

<!-- Favicon -->
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

---

## OG Image (og-image.png)

- 1200x630px
- Fondo #09090B
- Logo BETLOCK centrado
- Headline "Tu screentime es tu apuesta" debajo
- Mockup del iPhone a un lado o cartas decorativas
- Violet accents

---

## Responsividad

| Breakpoint | Layout |
|-----------|--------|
| Mobile (<768px) | Stack vertical, hero sin mockup lateral, screenshots en scroll horizontal |
| Tablet (768-1024px) | 2 columnas reducidas |
| Desktop (>1024px) | Layout completo con mockups laterales |

---

## Animaciones (sutiles)

- **Hero:** Logo fade-in, headline slide-up con 200ms delay, CTA fade-in con 400ms delay
- **Como funciona:** Cards aparecen con stagger (100ms entre cada una) al hacer scroll
- **Features:** Mockups con parallax sutil al scroll
- **Pricing card:** Hover effect con glow violet
- **CTA final:** Pulse sutil en el boton

Framework sugerido: Framer Motion (React)

---

## Waitlist flow (pre-launch)

1. Usuario llega a la pagina
2. Ve el hero con CTA "Unirme a la waitlist"
3. Click -> modal o inline input de email
4. Submit -> guarda en Supabase (tabla `waitlist`: id, email, created_at)
5. Redirect a pantalla de "Estas dentro" con:
   - "Eres el #247 en la waitlist"
   - Share buttons: "Comparte y sube de lugar"
   - Links a redes de BETLOCK

### Schema Supabase para waitlist

```sql
create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  referral_code text unique default substr(gen_random_uuid()::text, 1, 8),
  referred_by text references public.waitlist(referral_code),
  position int generated always as identity,
  created_at timestamptz default now()
);
```

---

## Checklist pre-launch

- [ ] Dominio registrado (betlock.app o betlock.co)
- [ ] Pagina desplegada en Vercel
- [ ] Tailwind CSS v4 configurado
- [ ] Waitlist funcional con Supabase
- [ ] OG image creada
- [ ] Favicon y apple-touch-icon
- [ ] PostHog o Plausible integrado
- [ ] Politica de privacidad
- [ ] Terminos de servicio
- [ ] Redes sociales creadas (Instagram, TikTok)
- [ ] 3-5 posts de pre-launch programados
