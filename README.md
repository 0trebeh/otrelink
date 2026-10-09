# 🔗 Otrelink

Clon modular de Linktree: un dashboard para crear páginas de links súper personalizables y una página pública ligera en JavaScript vanilla.

```
otrelink/
├── packages/core/     ← TODO lo modular vive aquí (bloques, temas, paletas, fondos, botones, fuentes, redes, plantillas, planes…)
├── packages/mcp/      ← Servidor MCP: un asistente de IA crea y edita páginas con un API token (ver su README)
├── apps/web/          ← Next.js: API + dashboard + docs (/docs)
└── apps/page/         ← Página pública (vanilla JS + Vite)

../Otrelink-Admin/     ← Dashboard de administración (repo aparte)
```

El dashboard (vista previa en vivo) y la página pública usan **el mismo renderer** de `@otrelink/core`, así que lo que ves en el editor es exactamente lo que ven tus visitantes.

---

## 🚀 Puesta en marcha

Requisitos: **Node.js 22**.

```bash
npm install
cp apps/web/.env.example apps/web/.env     # en Windows: copy apps\web\.env.example apps\web\.env
npm run dev
```

- Dashboard + API → http://localhost:3000
- Página pública → http://localhost:5173/tu-usuario

**Base de datos:** si `MONGODB_URI` está vacío, se usa automáticamente un archivo JSON local (`apps/web/data/`) — ideal para desarrollar sin instalar nada. Con `MONGODB_URI` se usa MongoDB.

| Comando | Qué hace |
|---|---|
| `npm run dev` | Levanta dashboard y página pública a la vez |
| `npm run build` | Compila ambas apps |
| `npm test` | Pruebas del núcleo (renderiza todos los bloques/temas/fondos/plantillas, XSS, planes, paletas…) y del servidor MCP |
| `npm run mcp` | Arranca el servidor MCP (necesita `OTRELINK_URL` y `OTRELINK_TOKEN`) |

### Variables de entorno

`apps/web/.env` (ver `.env.example`)

| Variable | Descripción |
|---|---|
| `DB_DRIVER` | `mongo` o `file` (vacío = automático) |
| `MONGODB_URI` / `MONGODB_DB` | Conexión a MongoDB |
| `JWT_SECRET` | Secreto para las sesiones (obligatorio en producción) |
| `NEXT_PUBLIC_PAGE_URL` | URL donde se sirve la página pública |
| `APP_URL` | URL pública de esta app (detrás de un proxy; se usa en enlaces de archivos subidos y en la pantalla API) |
| `PUBLIC_CORS_ORIGINS` | Orígenes que pueden llamar a la API pública (`*` o lista separada por comas) |
| `ADMIN_API_KEY` | Clave de 24+ caracteres para Otrelink-Admin (vacío = API de admin apagada) |
| `VAPID_*` · `CRON_SECRET` · `RESEND_API_KEY` · `EMAIL_FROM` | Push, cron y correos → ver **Agenda y reservas** |
| `STRIPE_*` · `PAYPAL_*` · `BUSINESS_CONTACT_EMAIL` | Pagos → ver **Planes y pagos** |
| `BILLING_COMPANY_NAME` · `BILLING_COMPANY_DETAILS` | Tu empresa en las facturas PDF de suscripción (detalles en varias líneas con `\n`) |
| `BILLING_INVOICE_PREFIX` · `BILLING_INVOICE_FOOTER` | Prefijo del número (p. ej. `OTR-`) y pie de esas facturas |
| `STRIPE_API_BASE` · `PAYPAL_API_BASE` | Solo para pruebas: apuntar Stripe/PayPal a un servidor simulado (no definir en producción) |

`apps/page/.env`

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL de la app Next.js (obligatoria para el build) |
| `VITE_HOME_URL` | A dónde apunta el pie “Made with Otrelink” |
| `VITE_BASE` | Sub-ruta donde se sirve (`/otrelink/` en GitHub Pages, `/` con dominio propio) |

---

## 🧩 Sistema modular

Todo lo personalizable es un **registro**: una lista de módulos. Para **agregar** algo, creas el módulo y lo añades a la lista. Para **quitarlo**, lo borras de la lista. No hay que tocar el dashboard, la API ni la página pública: los formularios, la validación y el render salen de la declaración del módulo.

| Qué | Dónde | Notas |
|---|---|---|
| Tipos de bloque | `packages/core/src/blocks/` → `index.js` | 30 bloques: link, copy, collection, header, text, image, banner, gallery, pdf, video, embed, html, code, music, map, contact, catalog, events, status, location, route, loyalty, booking, survey, reviews, vcard, faq, countdown, divider, share |
| Fondos (wallpapers) | `packages/core/src/wallpapers/` → `index.js` | solid, gradient, image, pattern, aurora, grain, video |
| Estilos de botón y hover | `packages/core/src/buttons/index.js` | 16 estilos (fill, outline, glass, neon, 3d, cel, pop, punk, sticker…) y 12 efectos de hover |
| Temas | `packages/core/src/themes.js` | 24 presets que combinan todo lo anterior |
| Paletas de color | `packages/core/src/palettes.js` | 20 paletas (claras y oscuras) que recolorean sin cambiar fuentes ni formas |
| Plantillas | `packages/core/src/templates.js` | 24 páginas listas (restaurante, food truck, tarjeta de presentación…) |
| Fuentes | `packages/core/src/fonts.js` | 24 Google Fonts |
| Redes sociales | `packages/core/src/socials.js` | 39 plataformas (iconos de simple-icons) |
| Animaciones | `packages/core/src/animations.js` | 14 de atención (por bloque), 14 de entrada (página o bloque) y 5 movimientos de fondo |
| Planes | `packages/core/src/plans.js` | Qué incluye cada plan (`PLAN_FEATURES`, `PLANS`) |
| Opciones del panel Style | `packages/core/src/design.js` | Grupos de campos → tarjetas automáticas en el dashboard |
| Tipos de campo | `packages/core/src/fields.js` + `apps/web/components/fields/index.js` | text, url, color, image, list, font, date, geoPoint… |
| Secciones del dashboard | `apps/web/sections/index.js` | Links, Profile, Today, Templates, Theme, Wallpaper, Style, Orders, Invoices, Agenda, Reviews, Loyalty, Responses, Analytics, Settings |
| Base de datos | `apps/web/lib/db/` | Drivers `mongo` y `file`; agrega el tuyo con la misma interfaz |

### Ejemplo: crear un tipo de bloque nuevo

`packages/core/src/blocks/quote.js`

```js
import { esc } from '../util/html.js';

export default {
  type: 'quote',                       // id guardado en la base de datos
  label: 'Quote',
  description: 'A highlighted quote.',
  icon: 'text',                        // ver icons.js
  category: 'Content',                 // agrupa en el modal "Add block"
  fields: [                            // → formulario + validación automáticos
    { key: 'text', type: 'textarea', label: 'Quote', required: true },
    { key: 'author', type: 'text', label: 'Author' },
  ],
  summary: (d) => d.author,            // línea secundaria en el dashboard
  render: (d) => `<blockquote class="ol-card ol-quote">“${esc(d.text)}”<cite>${esc(d.author)}</cite></blockquote>`,
  css: `.ol-root .ol-quote{font-style:italic}.ol-root .ol-quote cite{display:block;margin-top:8px;opacity:.7}`,
  // hydrate(el, data) { … }           // opcional: comportamiento en el navegador
};
```

Y en `packages/core/src/blocks/index.js`:

```js
import quote from './quote.js';
export const blockTypes = createRegistry('blockTypes', [link, header, /* … */ quote], 'type');
```

Listo: aparece en el modal “Add block”, tiene su formulario, se valida en la API y se renderiza en la vista previa y en la página pública.

> **Seguridad:** el renderer construye HTML como texto. Todo valor que venga del usuario debe pasar por `esc()` o `safeUrl()`.

Si quitas un tipo de bloque del registro, los bloques existentes de ese tipo **no se borran**: se ocultan en la página pública y el dashboard los marca como “not installed”. Si vuelves a agregar el módulo, reaparecen.

### Ejemplo: nueva opción de estilo

En `packages/core/src/design.js` agrega un campo a un grupo y úsalo en `designCss()`:

```js
{ key: 'letterSpacing', type: 'range', label: 'Letter spacing', min: 0, max: 4, default: 0, unit: 'px' },
// …
+ `--ol-letter-spacing:${d.letterSpacing}px;`
```

El control aparece solo en el panel Style.

---

## ✨ Funcionalidades

- **Editor** con vista previa en vivo, deshacer/rehacer (`Ctrl+Z`, `Ctrl+Shift+Z`), guardar con `Ctrl+S` y aviso de cambios sin guardar.
- **Bloques** que se arrastran para reordenar, se activan o desactivan, se duplican, se agrupan en colecciones y se pueden programar (mostrar desde / ocultar después). Cada uno puede llevar su propio estilo, animación de atención y animación de entrada.
- **Plantillas**: 24 páginas listas con vista previa; se usan al crear una página o desde *Templates*.
- **Perfil**: avatar (subida con redimensionado automático), insignia de verificado y 39 redes sociales que también se arrastran para reordenar.
- **Personalización**: 24 temas, 20 paletas de color (y paletas propias guardadas en la cuenta), 7 tipos de fondo, 16 estilos de botón, 12 efectos de hover, 24 fuentes, color de acento, colores con transparencia, 3 layouts de cabecera, formas de avatar, CSS personalizado y aviso cuando el texto no se lee bien sobre el fondo.
- **Movimiento**: 14 animaciones de entrada (con velocidad, retraso entre bloques y opción de animar al hacer scroll), 14 animaciones de atención, 5 movimientos de fondo (incluido parallax) y efecto al tocar los botones. Respeta “reducir movimiento” del sistema.
- **Contenido**: catálogo de productos, calendario de eventos (banners, carrusel, grilla o mes), mapas con estilos, bloque de código con resaltado, bloque HTML (Pro), PDF, galerías, FAQ, cuenta regresiva, vCard y más.
- **Negocio de comida**: estado abierto/cerrado, ruta semanal, “dónde estamos hoy” (pestaña *Today*), menú con categorías, pedidos para recoger con seguimiento y tarjetas de fidelidad con QR.
- **Facturas**: el dueño crea facturas para sus clientes y las descarga en PDF; las suscripciones a Otrelink también generan su factura.
- **Ajustes**: cambiar el usuario (comprueba disponibilidad), SEO y Open Graph, menú de navegación para páginas largas, botón de traducción ES/EN (Google Translate), ocultar el pie de página, bloquear selección y clic derecho, aviso de contenido sensible, página privada, código QR, y exportar (sitio estático) o importar en JSON.
- **Analíticas**: visitas, visitantes únicos, clics, CTR, gráfico diario, bloques y redes más clicados, referrers, dispositivos, países, ciudades y horas/días con más visitas.
- **API tokens y MCP** (plan Business): scripts y asistentes de IA pueden crear y editar páginas.
- **Referidos**: cada cuenta tiene su link de invitación; el admin crea campañas con fechas y recompensa (ver **Referidos**).
- **Varias páginas** por cuenta según el plan (Free 1, Pro 10, Business lo que asigne el admin).
- **Docs** para usuarios en `/docs` (bloques, CSS personalizado con variables y clases, planes, API…).

## 📱 PWA (dashboard instalable)

El dashboard se puede instalar como app (Chrome/Edge en escritorio y Android; en iOS: Compartir → “Añadir a pantalla de inicio”).

- `app/manifest.js` → nombre, colores, íconos y atajos (`/manifest.webmanifest`)
- `public/sw.js` → service worker: cachea JS/CSS/fuentes/íconos e imágenes subidas; las páginas y la API siempre van a la red; sin conexión muestra `/offline`
- `components/Pwa.js` → registro del worker y botón **Install app** (aparece en “Your pages” cuando el navegador lo permite)
- `public/icons/` → íconos (normal, maskable y Apple)

El service worker **solo se registra en producción** (`npm run build && npm start`), para no interferir con la recarga en caliente de `npm run dev`. Requiere HTTPS en producción (localhost está permitido). Si cambias `sw.js`, sube `VERSION` para que los clientes descarten la caché vieja.

## 📅 Agenda y reservas

Bloque **Booking** + sección **Agenda** del dashboard: servicios, horario semanal en una zona horaria IANA, confirmación automática o manual, recordatorios, notificaciones push (PWA), feed de calendario `.ics` y correos opcionales al visitante.

Variables de entorno (en `apps/web`):

| Variable | Para qué |
|---|---|
| `VAPID_PUBLIC_KEY` · `VAPID_PRIVATE_KEY` | Notificaciones push. Generar con `npx web-push generate-vapid-keys` |
| `VAPID_SUBJECT` | `mailto:tu@correo.com` |
| `CRON_SECRET` | Clave larga aleatoria que protege `/api/cron/reminders` |
| `RESEND_API_KEY` · `EMAIL_FROM` | Opcional: correos al visitante vía [Resend](https://resend.com) |

**Recordatorios con cron-job.org:** crea un job que llame cada 1–5 min a `https://TU-APP/api/cron/reminders` (GET) con la cabecera `Authorization: Bearer <CRON_SECRET>` (o `?key=<CRON_SECRET>`). Responde `{ ok, checked, reminded, downgraded, trialsEnded }`. En Render gratis, además mantiene el servicio despierto.

Notas: las reservas se guardan en UTC y un índice único (`slotKey`) evita reservas dobles. Push solo funciona en el build de producción (el service worker no se registra en `dev`); en iOS hay que instalar la app en la pantalla de inicio (16.4+).

## 📝 Encuestas

Bloque **Survey** (categoría Contact): un botón que despliega un formulario con tus preguntas. Tipos de respuesta: texto corto, párrafo, una opción, varias opciones (checkboxes), desplegable, estrellas 1–5, escala 0–10, sí/no, email, número y fecha. Cada pregunta puede ser obligatoria.

- Las respuestas se validan en el servidor contra las preguntas actuales y se guardan en la colección `survey_responses` (con el texto de la pregunta, así no se pierden si la editas).
- Sección **Responses** del dashboard: resumen por pregunta (barras, promedio, últimas respuestas), respuestas individuales, **Download CSV** y borrar.
- Notificación push al dueño en cada respuesta (opción del bloque). Opción “una respuesta por dispositivo” (localStorage).
- En la vista previa y en sitios exportados no se puede enviar: el bloque enlaza a la página en vivo.

## ⭐ Reseñas

Bloque **Reviews** (categoría Contact): el botón muestra el promedio (★ 4.8 · 23 reviews). Al abrirlo se ven el resumen por estrellas, las reseñas publicadas (con “Show more”) y el botón **Write a review** (1–5 estrellas, comentario y nombre opcional).

- Moderación: publicar al instante o aprobar cada una. Desde la sección **Reviews** del dashboard: aprobar, ocultar, borrar y **responder** (la respuesta se ve en la página).
- Badge con reseñas por aprobar y notificación push en cada reseña nueva.
- Colección `reviews`; las ocultas y pendientes no cuentan en el promedio. Rate limit de 10 reseñas/hora por IP + honeypot.

## 🔑 API tokens y MCP (plan Business)

- **Dashboard → API** (`/dashboard/api`): crear tokens `otl_…` (lectura y escritura o solo lectura, con vencimiento), copiarlo una sola vez y revocarlo. Se guarda solo el hash SHA-256.
- Se envían como `Authorization: Bearer otl_…`. `proxy.js` solo los deja pasar a las rutas de `apps/web/lib/tokens.js` (páginas, today, analytics, slug-check, subida de archivos y lectura de pedidos); cuenta, facturación, admin y los propios tokens siguen necesitando la sesión del navegador. Límite: 120 peticiones/min por token.
- La feature `api` solo existe en Business y se puede apagar por usuario en el admin.
- **Servidor MCP** (`packages/mcp`): 27 herramientas para Claude Desktop, Claude Code, Cursor… (crear páginas desde plantillas, añadir y mover bloques, temas, paletas, analíticas, pedidos, “Today”, subir archivos). Configuración y lista completa en `packages/mcp/README.md`.

## 💳 Planes y pagos

| Plan | Qué incluye |
|---|---|
| **Free** | 1 página con los bloques básicos, más el bloque de código y el calendario de eventos. |
| **Pro** · $10/mes | 10 páginas y todas las funciones de página: embeds, bloque HTML, reservas, reseñas, encuestas, catálogo, pedidos, ubicación/ruta/estado, fidelidad, facturas, botón de traducción y fondos de foto/video. |
| **Business** | Personalizado: páginas y funciones que asignas en **Otrelink-Admin**, más **API tokens y MCP**. |

- Lo que permite cada plan está en `packages/core/src/plans.js` (`PLAN_FEATURES`, `PLANS`).
- Las cuentas creadas antes de los planes (sin campo `plan`) funcionan como Pro hasta que las cambies en el admin.
- El servidor hace cumplir los límites: páginas por plan, no deja añadir bloques o fondos bloqueados, y en la página pública oculta lo que el plan del dueño no incluye (tras bajar de plan, nada se borra).
- Página de planes: `/dashboard/plan`.

### Stripe
1. Crea el producto **Otrelink Pro** con un precio mensual de $10 → `STRIPE_PRICE_ID` (`price_…`).
2. `STRIPE_SECRET_KEY` (`sk_…`).
3. Webhook → `https://TU-APP/api/billing/stripe/webhook` con los eventos `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted` e `invoice.paid` (este último crea las facturas PDF del historial de pagos) → `STRIPE_WEBHOOK_SECRET` (`whsec_…`).
4. Activa el **Customer portal** en Stripe (Settings → Billing → Customer portal) para que puedan cambiar tarjeta o cancelar.

### PayPal
1. En developer.paypal.com crea una app (sandbox primero) → `PAYPAL_CLIENT_ID` y `PAYPAL_CLIENT_SECRET`.
2. Crea un producto y un plan mensual de $10 → `PAYPAL_PLAN_ID` (`P-…`).
3. Webhook → `https://TU-APP/api/billing/paypal/webhook` con los eventos `BILLING.SUBSCRIPTION.*` y `PAYMENT.SALE.COMPLETED` → `PAYPAL_WEBHOOK_ID`.
4. `PAYPAL_MODE=sandbox` para probar, `live` en producción.

Si cancelan, conservan Pro hasta el final del periodo pagado; el cron (`/api/cron/reminders`) los pasa luego a su plan anterior. `BUSINESS_CONTACT_EMAIL` es el correo del botón "Contact us".

## 🎁 Referidos

- Cada usuario (Free, Pro o Business) tiene un link `https://TU-APP/register?ref=CÓDIGO` en **Dashboard → Invite** (`/dashboard/referrals`). El registro guarda el código 30 días en el navegador.
- Un referido **cuenta** cuando el invitado hace su **primer pago de Pro** (webhook `invoice.paid` de Stripe o `PAYMENT.SALE.COMPLETED` de PayPal) o cuando el admin lo pasa a **Business**.
- Solo hay recompensa si se registró mientras corría una **campaña** (Otrelink-Admin → *Referrals*: fechas de inicio y fin, meses, máximo por persona, activar/apagar):
  - **Pro** → `freeMonths` meses gratis. Stripe: crédito en el saldo del cliente (precio × meses). PayPal: se reembolsan sus próximos pagos. Sin suscripción, esperan a que se suscriba.
  - **Free** → `freeUserMonths` meses de Pro gratis (1 por defecto, se acumulan). El cron lo devuelve a Free al terminar, salvo que se haya suscrito.
  - **Business** → se cuenta, sin recompensa automática.
- No cuentan las auto-invitaciones (mismo correo, con puntos o `+tag`) y cada cuenta solo puede ser invitada una vez.
- Reglas en `packages/core/src/referrals.js`; lado servidor en `apps/web/lib/referrals.js`.
- ⚠️ Para que el crédito de Stripe y los reembolsos de PayPal funcionen hacen falta las claves reales (la de PayPal debe permitir reembolsos). Probar primero en sandbox / modo test.

## 🛡️ Administración (Otrelink-Admin)

Dashboard aparte en la carpeta `../Otrelink-Admin`. Usa la API `/api/admin/*` de esta app, protegida con `ADMIN_API_KEY` (24+ caracteres; vacío = API apagada). Ver su README.

## 🛰️ API

✔ = sesión del navegador o, en las rutas permitidas, un API token (`Authorization: Bearer otl_…`).

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/auth/register` | — | `{ email, password, slug, name }` crea la cuenta y la primera página |
| POST | `/api/auth/login` · `/api/auth/logout` | — | Sesión en cookie httpOnly |
| GET | `/api/auth/me` | ✔ | Usuario actual (y `pageUrl`) |
| GET · POST | `/api/pages` | ✔ | Listar · crear páginas |
| GET · PUT · DELETE | `/api/pages/:id` | ✔ | Leer · guardar todo · borrar |
| GET | `/api/pages/:id/analytics?days=30` | ✔ | Resumen de analíticas |
| GET | `/api/slug-check?slug=` | — | Disponibilidad del usuario |
| POST | `/api/assets` | ✔ | Subir imagen (máx. 3 MB) o PDF (máx. 10 MB), multipart `file` |
| GET | `/api/assets/:id` | — | Servir imagen |
| GET | `/api/public/:slug` | — | Datos públicos de una página (CORS) |
| POST | `/api/public/track` | — | Beacon de visita/clic (CORS) |
| GET | `/api/public/booking/slots?pageId&blockId&serviceId&date` | — | Horas libres (CORS) |
| POST | `/api/public/booking` | — | Crear reserva (CORS, rate limit) |
| GET | `/api/bookings?pageId&view=` · `&count=1` | ✔ | Listar reservas · contar pendientes |
| PATCH | `/api/bookings/:id` | ✔ | `{ status }` o `{ start }` (confirmar, cancelar, reprogramar) |
| GET · POST | `/api/bookings/calendar` | ✔ | Link privado del calendario · regenerarlo |
| GET | `/api/calendar/:token` | — | Feed `.ics` |
| POST | `/api/push/subscribe` · `unsubscribe` · `test` | ✔ | Notificaciones push |
| GET · POST | `/api/cron/reminders` | `CRON_SECRET` | Enviar recordatorios pendientes, bajar de plan suscripciones terminadas y terminar el Pro gratis de referidos |
| POST | `/api/billing/stripe/checkout` · `portal` | ✔ | Pagar Pro con tarjeta · gestionar suscripción |
| POST | `/api/billing/paypal/checkout` · `cancel` | ✔ | Pagar Pro con PayPal · cancelar |
| POST | `/api/billing/stripe/webhook` · `/api/billing/paypal/webhook` | firma | Avisos de Stripe / PayPal |
| GET | `/api/admin/stats` · `/api/admin/users` | `ADMIN_API_KEY` | Admin: estadísticas · usuarios |
| GET · PATCH · DELETE | `/api/admin/users/:id` | `ADMIN_API_KEY` | Admin: ver, cambiar plan/límites, banear, borrar |
| GET | `/api/referrals` | ✔ | Link, campaña activa e invitados del usuario |
| GET | `/api/admin/referrals` | `ADMIN_API_KEY` | Admin: campañas con estadísticas y últimos referidos |
| POST | `/api/admin/referrals/campaigns` | `ADMIN_API_KEY` | Admin: crear campaña |
| PATCH · DELETE | `/api/admin/referrals/campaigns/:id` | `ADMIN_API_KEY` | Admin: editar · borrar campaña |
| POST | `/api/public/survey` | — | Enviar respuestas de una encuesta (CORS, rate limit) |
| GET · DELETE | `/api/responses?pageId&blockId` · `&format=csv` | ✔ | Conteos · listar · CSV · borrar todas |
| DELETE | `/api/responses/:id` | ✔ | Borrar una respuesta |
| GET · POST | `/api/public/reviews?pageId&blockId&limit&before` | — | Reseñas publicadas + estadísticas · escribir una reseña (CORS) |
| GET | `/api/reviews?pageId&blockId&status=` · `&count=1` | ✔ | Reseñas del dueño · pendientes por aprobar |
| PATCH · DELETE | `/api/reviews/:id` | ✔ | `{ status }` (published/hidden) o `{ reply }` · borrar |
| GET · POST | `/api/auth/verify?token=` · `/api/auth/verify/resend` | — · ✔ | Confirmar el email (enlace del correo) · reenviar el enlace |
| GET | `/api/pages/:id/export` | ✔ | Descargar la página como sitio estático (.zip) |
| GET · PATCH | `/api/pages/:id/today` | ✔ | Estado “Today”: abierto/cerrado, ubicación, agotados, pedidos pausados |
| GET · PUT | `/api/pages/:id/invoicing` | ✔ | Datos del negocio para las facturas |
| GET · PUT | `/api/palettes` | ✔ | Paletas de color guardadas en la cuenta |
| POST · GET | `/api/public/orders` · `/api/public/orders/:id` | — | Hacer un pedido para recoger · seguir su estado (CORS) |
| GET · PATCH | `/api/orders?pageId&scope=` · `/api/orders/:id` | ✔ | Pedidos del dueño · cambiar estado (los tokens solo pueden leer) |
| POST · GET | `/api/public/loyalty` · `/api/public/loyalty/:id` | — | Crear la tarjeta de fidelidad del visitante · verla (CORS) |
| GET · POST | `/api/loyalty?pageId` · `/api/loyalty/:id` | ✔ | Tarjetas del dueño · sellar, canjear o deshacer (escáner QR) |
| GET · POST | `/api/invoices` | ✔ | Facturas del dueño · crear |
| GET · PUT · POST · DELETE | `/api/invoices/:id` | ✔ | Ver · guardar · nuevo enlace para el cliente · borrar |
| GET | `/api/invoices/:id/pdf` · `/api/public/invoices/:id` | ✔ · enlace | PDF de la factura · enlace público para el cliente |
| GET | `/api/billing/invoices` · `/api/billing/invoices/:id` | ✔ | Pagos a Otrelink y su factura PDF |
| GET · POST | `/api/tokens` · DELETE `/api/tokens/:id` | ✔ (sesión) | API tokens (Business) |

---

## 🌍 Despliegue

- **apps/web** → Vercel, Render o cualquier hosting de Node (`npm run build && npm start`). Define `JWT_SECRET`, `MONGODB_URI` y `NEXT_PUBLIC_PAGE_URL`. En hostings serverless usa Mongo, porque el driver `file` necesita disco persistente.
- **apps/page** → cualquier hosting estático (Netlify, Vercel, Cloudflare Pages, Render Static Site). Hay que configurar el *fallback* SPA para que toda ruta sirva `index.html`, y definir `VITE_API_URL` antes de `npm run build`. Hoy se publica en **GitHub Pages** con `.github/workflows/static.yml` (variables `VITE_API_URL` y `VITE_HOME_URL` en *Settings → Secrets and variables → Actions → Variables*); el build copia `index.html` a `404.html` para que funcionen las rutas. Ver *Pendientes importantes* sobre la vista previa al compartir.
- **packages/mcp** → no se despliega: cada usuario lo corre en su computadora desde este repo (ver su README).
- **Otrelink-Admin** → app Next.js aparte; apunta a esta app con `OTRELINK_API_URL` y `OTRELINK_ADMIN_API_KEY`.


## 📌 Pendientes importantes (tener en mente)

### 1. Vista previa al compartir (título, descripción e imagen)
Hoy la página pública es una SPA en GitHub Pages: las etiquetas `og:*` se rellenan con JavaScript y las rutas como `/otrelink/usuario` responden **404** (las sirve `404.html`). WhatsApp, Facebook, X, LinkedIn, Telegram y Slack **no ejecutan JavaScript**, así que no ven el SEO title, la descripción ni la sharing image.

**Plan recomendado:** que `apps/web` (Render) genere la página en el servidor en `/<slug>` (SSR con `renderPage` del core + el script de `standalone.js` para la interactividad), con `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `twitter:*` y canonical ya escritos en el HTML.
- Requiere el servicio de Render **siempre despierto** (plan Starter): en el plan gratis se duerme a los 15 min y los bots se rinden antes de que despierte.
- Cambiar `NEXT_PUBLIC_PAGE_URL` a la nueva dirección y dejar GitHub Pages solo como redirección para no romper enlaces viejos.
- Alternativa gratis: Static Site en Render que genere `slug/index.html` con las etiquetas en cada build (Deploy Hook al guardar; los cambios tardan 1–3 min en verse en la vista previa).
- Imagen recomendada: 1200×630, PNG/JPG, < 300 KB. Después de cambiarla, refrescar la caché con el [Sharing Debugger de Facebook](https://developers.facebook.com/tools/debug/).

### 2. Dominios personalizados / subdominios por página
Ejemplo: `links.miempresa.com` → la página de ese cliente. GitHub Pages no sirve (un solo dominio por repo), hace falta un host que acepte cualquier dominio y emita HTTPS:

| Opción | Costo | Nota |
|---|---|---|
| **Cloudflare for SaaS** (recomendada) | 100 dominios gratis, luego $0.10/mes c/u | Solo subdominios (`links.cliente.com`); dominios raíz solo en Enterprise |
| Vercel Pro | ~$20/mes, dominios ilimitados | Admite dominio raíz |
| Render | 2–25 incluidos según plan, luego $0.25/mes c/u | Caro a escala |
| VPS + Caddy (on-demand TLS) | Solo el VPS | Tú mantienes el servidor |

Qué hay que construir en Otrelink:
- Colección `domains` `{ host, pageId, userId, status, verifyToken }` y feature de plan `customDomain` (Pro/Business, límite por plan desde el admin).
- Dashboard → Settings → *Custom domain*: el usuario escribe el dominio, ve el registro DNS a crear (`CNAME links → pages.otrelink…`) y un TXT `_otrelink.<dominio>` para verificar que es suyo; botón *Verificar* y estado (pendiente / activo / error).
- Alta y baja del dominio en el proveedor por API; cron para revisar los pendientes.
- `GET /api/public/by-host?host=…` y la página pública buscando por dominio cuando `location.hostname` no es el de Otrelink; CORS para dominios activos.
- Canonical, QR, botón de compartir y `og:url` con el dominio propio; 301 desde `otrelink/slug`.
- Se monta sobre el punto 1 (el mismo servidor busca la página por dominio en vez de por slug).


## 🗺️ Próximos pasos

- [ ] Login social (Google / GitHub)
- [ ] Bloques con integraciones (YouTube/Spotify/Instagram feed)
- [ ] Notificaciones por email al alcanzar N clics
- [ ] Dominios personalizados / subdominios por página (ver *Pendientes importantes*)
- [ ] Vista previa al compartir con SSR (ver *Pendientes importantes*)
- [ ] Probar pagos de Stripe (test mode) y PayPal (sandbox) antes de cobrar (ver *Planes y pagos*)
