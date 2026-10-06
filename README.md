# 🔗 Otrelink

Clon modular de Linktree: un dashboard para crear páginas de links súper personalizables y una página pública ligera en JavaScript vanilla.

```
otrelink/
├── packages/core/     ← TODO lo modular vive aquí (bloques, temas, fondos, botones, fuentes, redes…)
├── apps/web/          ← Next.js: API + dashboard
└── apps/page/         ← Página pública (vanilla JS + Vite)
```

El dashboard (vista previa en vivo) y la página pública usan **el mismo renderer** de `@otrelink/core`, así que lo que ves en el editor es exactamente lo que ven tus visitantes.

---

## 🚀 Puesta en marcha

Requisitos: **Node.js 20.9+**.

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
| `npm test` | Pruebas del núcleo (renderiza todos los bloques/temas/fondos, XSS, etc.) |

### Variables de entorno

`apps/web/.env`

| Variable | Descripción |
|---|---|
| `DB_DRIVER` | `mongo` o `file` (vacío = automático) |
| `MONGODB_URI` / `MONGODB_DB` | Conexión a MongoDB |
| `JWT_SECRET` | Secreto para las sesiones (obligatorio en producción) |
| `NEXT_PUBLIC_PAGE_URL` | URL donde se sirve la página pública |
| `PUBLIC_CORS_ORIGINS` | Orígenes que pueden llamar a la API pública (`*` o lista separada por comas) |

`apps/page/.env`

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL de la app Next.js |
| `VITE_HOME_URL` | A dónde apunta el pie “Made with Otrelink” |

---

## 🧩 Sistema modular

Todo lo personalizable es un **registro**: una lista de módulos. Para **agregar** algo, creas el módulo y lo añades a la lista. Para **quitarlo**, lo borras de la lista. No hay que tocar el dashboard, la API ni la página pública: los formularios, la validación y el render salen de la declaración del módulo.

| Qué | Dónde | Notas |
|---|---|---|
| Tipos de bloque | `packages/core/src/blocks/` → `index.js` | link, header, text, image, gallery, video, music, map, contact, vcard, faq, countdown, divider, share |
| Fondos (wallpapers) | `packages/core/src/wallpapers/` → `index.js` | solid, gradient, image, pattern, aurora, grain, video |
| Estilos de botón y hover | `packages/core/src/buttons/index.js` | fill, outline, glass, hard-shadow, neon… |
| Temas | `packages/core/src/themes.js` | Presets que combinan todo lo anterior |
| Fuentes | `packages/core/src/fonts.js` | Google Fonts |
| Redes sociales | `packages/core/src/socials.js` | 39 plataformas (iconos de simple-icons) |
| Animaciones | `packages/core/src/animations.js` | De atención (por bloque) y de entrada (página) |
| Opciones del panel Style | `packages/core/src/design.js` | Grupos de campos → tarjetas automáticas en el dashboard |
| Tipos de campo | `packages/core/src/fields.js` + `apps/web/components/fields/index.js` | text, url, color, image, list, font… |
| Secciones del dashboard | `apps/web/sections/index.js` | Links, Profile, Theme, Wallpaper, Style, Settings, Analytics |
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
- **Bloques** que se arrastran para reordenar, se activan o desactivan, se duplican y se pueden programar (mostrar desde / ocultar después). Cada uno puede llevar su propia animación.
- **Perfil**: avatar (subida con redimensionado automático), insignia de verificado y 39 redes sociales que también se arrastran para reordenar.
- **Personalización**: 12 temas, 7 tipos de fondo, 8 estilos de botón, 21 fuentes, colores con transparencia, 3 layouts de cabecera, formas de avatar, animaciones de entrada, CSS personalizado y aviso cuando el texto no se lee bien sobre el fondo.
- **Ajustes**: cambiar el usuario (comprueba disponibilidad), SEO y Open Graph, ocultar el pie de página, aviso de contenido sensible, página privada, código QR, y exportar o importar en JSON.
- **Analíticas**: visitas, visitantes únicos, clics, CTR, gráfico diario, bloques y redes más clicados, referrers, dispositivos y países (estos últimos detrás de Vercel o Cloudflare).
- **Varias páginas** por cuenta (hasta 10, configurable en `lib/config.js`).

---

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

**Recordatorios con cron-job.org:** crea un job que llame cada 1–5 min a `https://TU-APP/api/cron/reminders` (GET) con la cabecera `Authorization: Bearer <CRON_SECRET>` (o `?key=<CRON_SECRET>`). Responde `{ ok, checked, reminded }`. En Render gratis, además mantiene el servicio despierto.

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

## 💳 Planes y pagos

| Plan | Qué incluye |
|---|---|
| **Free** | 1 página. Sin Embed, Booking, Reviews, Survey ni fondos de foto/video. |
| **Pro** · $10/mes | 10 páginas y todo lo anterior. |
| **Business** | Personalizado: páginas y funciones que asignas en **Otrelink-Admin**. |

- Lo que permite cada plan está en `packages/core/src/plans.js` (`PLAN_FEATURES`, `PLANS`).
- Las cuentas creadas antes de los planes (sin campo `plan`) funcionan como Pro hasta que las cambies en el admin.
- El servidor hace cumplir los límites: páginas por plan, no deja añadir bloques o fondos bloqueados, y en la página pública oculta lo que el plan del dueño no incluye (tras bajar de plan, nada se borra).
- Página de planes: `/dashboard/plan`.

### Stripe
1. Crea el producto **Otrelink Pro** con un precio mensual de $10 → `STRIPE_PRICE_ID` (`price_…`).
2. `STRIPE_SECRET_KEY` (`sk_…`).
3. Webhook → `https://TU-APP/api/billing/stripe/webhook` con los eventos `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted` → `STRIPE_WEBHOOK_SECRET` (`whsec_…`).
4. Activa el **Customer portal** en Stripe (Settings → Billing → Customer portal) para que puedan cambiar tarjeta o cancelar.

### PayPal
1. En developer.paypal.com crea una app (sandbox primero) → `PAYPAL_CLIENT_ID` y `PAYPAL_CLIENT_SECRET`.
2. Crea un producto y un plan mensual de $10 → `PAYPAL_PLAN_ID` (`P-…`).
3. Webhook → `https://TU-APP/api/billing/paypal/webhook` con los eventos `BILLING.SUBSCRIPTION.*` y `PAYMENT.SALE.COMPLETED` → `PAYPAL_WEBHOOK_ID`.
4. `PAYPAL_MODE=sandbox` para probar, `live` en producción.

Si cancelan, conservan Pro hasta el final del periodo pagado; el cron (`/api/cron/reminders`) los pasa luego a su plan anterior. `BUSINESS_CONTACT_EMAIL` es el correo del botón "Contact us".

## 🛡️ Administración (Otrelink-Admin)

Dashboard aparte en la carpeta `../Otrelink-Admin`. Usa la API `/api/admin/*` de esta app, protegida con `ADMIN_API_KEY` (24+ caracteres; vacío = API apagada). Ver su README.

## 🛰️ API

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/auth/register` | — | `{ email, password, slug, name }` crea la cuenta y la primera página |
| POST | `/api/auth/login` · `/api/auth/logout` | — | Sesión en cookie httpOnly |
| GET | `/api/auth/me` | ✔ | Usuario actual |
| GET · POST | `/api/pages` | ✔ | Listar · crear páginas |
| GET · PUT · DELETE | `/api/pages/:id` | ✔ | Leer · guardar todo · borrar |
| GET | `/api/pages/:id/analytics?days=30` | ✔ | Resumen de analíticas |
| GET | `/api/slug-check?slug=` | — | Disponibilidad del usuario |
| POST | `/api/assets` | ✔ | Subir imagen (multipart `file`, máx. 3 MB) |
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
| GET · POST | `/api/cron/reminders` | `CRON_SECRET` | Enviar recordatorios pendientes y bajar de plan suscripciones terminadas |
| POST | `/api/billing/stripe/checkout` · `portal` | ✔ | Pagar Pro con tarjeta · gestionar suscripción |
| POST | `/api/billing/paypal/checkout` · `cancel` | ✔ | Pagar Pro con PayPal · cancelar |
| POST | `/api/billing/stripe/webhook` · `/api/billing/paypal/webhook` | firma | Avisos de Stripe / PayPal |
| GET | `/api/admin/stats` · `/api/admin/users` | `ADMIN_API_KEY` | Admin: estadísticas · usuarios |
| GET · PATCH · DELETE | `/api/admin/users/:id` | `ADMIN_API_KEY` | Admin: ver, cambiar plan/límites, banear, borrar |
| POST | `/api/public/survey` | — | Enviar respuestas de una encuesta (CORS, rate limit) |
| GET · DELETE | `/api/responses?pageId&blockId` · `&format=csv` | ✔ | Conteos · listar · CSV · borrar todas |
| DELETE | `/api/responses/:id` | ✔ | Borrar una respuesta |
| GET · POST | `/api/public/reviews?pageId&blockId&limit&before` | — | Reseñas publicadas + estadísticas · escribir una reseña (CORS) |
| GET | `/api/reviews?pageId&blockId&status=` · `&count=1` | ✔ | Reseñas del dueño · pendientes por aprobar |
| PATCH · DELETE | `/api/reviews/:id` | ✔ | `{ status }` (published/hidden) o `{ reply }` · borrar |

---

## 🌍 Despliegue

- **apps/web** → Vercel, Render o cualquier hosting de Node (`npm run build && npm start`). Define `JWT_SECRET`, `MONGODB_URI` y `NEXT_PUBLIC_PAGE_URL`. En hostings serverless usa Mongo, porque el driver `file` necesita disco persistente.
- **apps/page** → cualquier hosting estático (Netlify, Vercel, Cloudflare Pages). Hay que configurar el *fallback* SPA para que toda ruta sirva `index.html`, y definir `VITE_API_URL` antes de `npm run build`.

## 🗺️ Próximos pasos

- [ ] Login social (Google / GitHub)
- [ ] Roles (admin / user)
- [ ] Modo oscuro del dashboard
- [ ] Bloques con integraciones (YouTube/Spotify/Instagram feed)
- [ ] Notificaciones por email al alcanzar N clics
- [ ] API pública con tokens para terceros
- [ ] Render en servidor de la página pública para un SEO más completo
