Next.js full-stack y agrega MongoDB (Mongoose) como persistencia real.

Implementa tiempo real con SSE (Server-Sent Events) (simple y funciona bien en Next Route Handlers) para que los cambios del admin se vean al instante en los móviles.

Deja tu AuthContext “fake” por ahora para dev, y más adelante migras a Auth real.

Prompts para Copilot (paso a paso)
0) Dependencias y entorno

Chat a Copilot:

Instala y configura Mongoose y Zod en este proyecto Next.js 15. Agrega los scripts útiles.

Instalar: npm i mongoose zod

Crea .env.local con MONGODB_URI=mongodb://localhost:27017/chocoweb

En package.json agrega scripts:

"db:check": "node -e \\"require('mongoose').connect(process.env.MONGODB_URI).then(()=>console.log('ok')).catch(e=>console.error(e)).finally(()=>process.exit())\\""

No cambies los scripts de Next.

Aceptación: Dependencias instaladas, script agregado, .env.local ignorado por git.

1) Conexión a MongoDB (cache para dev)

Crea archivo: src/lib/mongodb.ts

Prompt a Copilot:

Crea src/lib/mongodb.ts con un helper de conexión Mongoose para Next.js (App Router), con cache global para evitar conexiones duplicadas en dev (turbopack). Exporta connectToDB() que garantice una única conexión. Usa process.env.MONGODB_URI.

Aceptación: connectToDB() idempotente, usa cache global (global.mongoose), lanza error si falta MONGODB_URI.

2) Modelos Mongoose (Product, User, Order)

Crea archivos:

src/models/Product.ts

src/models/User.ts

src/models/Order.ts

Prompt a Copilot:

Crea modelos Mongoose con estos campos mínimos y timestamps: true.
Product: slug (unique), name, description, priceCents (number), stock (number), published (boolean, default false), deletedAt (Date|null), image, tags (string[]).
User: email (unique), name, role: 'admin'|'user'.
Order: userId (ObjectId->User), items: [{ productId (ObjectId->Product), qty (number), unitPriceCents (number) }], status: 'pending'|'paid'|'shipped'.
Exporta getProductModel(), getUserModel(), getOrderModel() para evitar recompilar modelos en hot reload.

Aceptación: Archivos exportan funciones getXModel() y schemas correctos.

3) Capa de acceso a datos (repositorio)

Crea archivo: src/server/repositories/products.ts

Prompt a Copilot:

Implementa funciones usando Mongoose y connectToDB():

listProducts({ includeDeleted = false } = {})

createProduct(input) valida slug único.

updateProduct(idOrSlug, patch) (no permitir stock negativo).

softDeleteProduct(idOrSlug) pone deletedAt=now.

togglePublish(idOrSlug, published: boolean).
Valida entrada con Zod. Devuelve objetos planos (sin metadata Mongoose) con .toJSON().

Aceptación: Funciones CRUD listas; usan queries atómicas ($inc para stock donde aplique).

(Repite patrón para users.ts y orders.ts si lo necesitas ahora o después.)

4) APIs de productos (App Router)

Edita: src/app/api/products/route.ts y crea src/app/api/products/[id]/route.ts

Prompt a Copilot:

Reescribe GET /api/products para listar desde Mongo.
Implementa POST /api/products para crear producto (Zod).
Crea ruta dinámica [id]/route.ts con GET, PATCH y DELETE (soft delete).
En PATCH, permite cambiar published, stock, name, description, priceCents, tags, image.
Maneja errores con NextResponse.json({error}, {status}).

Aceptación: Endpoints devuelven JSON real desde Mongo y ya no tocan src/utils/storage.ts.

5) Eventos en tiempo real con SSE

Crea archivos:

src/lib/events.ts

src/app/api/events/route.ts

Prompt a Copilot:

Implementa un “bus” en memoria para SSE:

En src/lib/events.ts, exporta publish(event: {type:string; payload:any}) y subscribe() que devuelve { stream, unsubscribe }. Usa un Set global para mantener suscriptores.

En src/app/api/events/route.ts, implementa GET que devuelve text/event-stream con ReadableStream. Al suscribirse, envía un “hello” inicial y reenvía todo lo que publique publish. Implementa heartbeat cada 25s.

Exporta un helper send(event) que formatee como data: <json>\n\n.

Aceptación: Un GET a /api/events mantiene la conexión abierta y recibe heartbeats.

Integración con CRUD (muy importante):
En cada mutación de productos (POST, PATCH, DELETE), después de guardar en Mongo, llama:

publish({ type: 'product.changed', payload: { action: 'create|update|delete', product } })

6) Frontend: catálogo y panel admin con fetch + SSE

Edita: src/components/ProductCatalog.tsx

Prompt a Copilot:

Reemplaza el array hardcodeado por fetch('/api/products') al montar.
Añade suscripción SSE a /api/events (EventSource). Cuando llegue type === 'product.changed':

si action==='create' agrega/actualiza el producto en estado si published===true.

si action==='update' sincroniza campos (y si published===false, quítalo de la lista pública).

si action==='delete' remuévelo del estado.
Usa useEffect para EventSource y limpia al desmontar.

Aceptación: Al abrir dos móviles, cambios del admin se reflejan en tiempo real sin recargar.

Edita (ejemplo): src/app/admin/products/page.tsx y src/app/admin/stock/page.tsx

Reemplaza el uso de utils/storage por llamadas fetch a /api/products y /api/products/[id] (PATCH/DELETE).
Tras cada acción, no fuerces refetch: confía en el evento SSE que llegará desde el servidor para actualizar la UI.

7) Control de stock y reglas simples

Prompt a Copilot (aplica en repo de productos y API):

En updateProduct, si stock se reduce, usa operación atómica y nunca permitas valores negativos.
En createOrder (si lo implementas ahora), valida que todos los qty tengan stock suficiente y descuéntalo con $inc: { stock: -qty }.
Emite publish({type:'product.changed', payload:{action:'update', product}}) tras actualizar stock.

Aceptación: No hay stock negativo y las vistas se sincronizan por SSE.

8) Semilla de datos (opcional, útil para tus pruebas)

Crea archivo: scripts/seed.ts

Prompt a Copilot:

Crea scripts/seed.ts que conecte a Mongo y cree 8–12 productos demo (distintos slug, stock, published:true, imágenes dummy). Añade script "seed": "tsx scripts/seed.ts".

Aceptación: npm run seed llena la DB y el catálogo público los muestra.

9) Limpieza del mock

Prompt a Copilot:

Deja src/utils/storage.ts deprecado con un comentario: “solo para demos”. Migra cualquier import que quede a la capa Mongo. Borra referencias desde APIs y páginas admin.

Aceptación: Ningún endpoint usa ya localStorage.

Cómo probar en varios celulares (tu caso real)

Arranca MongoDB local (mongod) y corre npm run dev.

Todos los dispositivos en la misma Wi-Fi: abre desde los celulares la IP LAN de tu PC, ej. http://192.168.1.20:3000/.

Abre un móvil con /admin (rol admin) y otros con el catálogo.

Prueba:

Ocultar/publicar un producto → desaparece/aparece al instante en los usuarios.

Cambiar stock → los usuarios ven el nuevo stock/estado.

Crear producto → aparece de inmediato si published:true.

Si quieres exponer fuera de tu red para pruebas remotas, usa ngrok o similar (opcional).

Alternativa: Socket.IO o servicio externo

Más simple en Next: SSE (lo que te dejé).

Más features: Socket.IO (necesita servidor dedicado) o Pusher/Ably (servicio gestionado). Si mañana quieres presencia/salas/reintentos avanzados, pásate a Socket.IO o Pusher conservando la misma interfaz publish(...).

Observaciones de tu repo (lo que vi)

Next 15 + React 19 (package.json).

APIs actuales en src/app/api/* leen del mock src/utils/storage.ts.

ProductCatalog.tsx usa array fijo, por eso no refleja cambios.

AuthContext es localStorage; suficiente para dev.

En este repositorio Next.js (App Router, TypeScript), crea un Hero con video de fondo como lapurita.com, que reproduzca 2 videos consecutivos (playlist) y funcione diferente para desktop y móvil.

Rutas de archivos de video (ya están en el proyecto):

Desktop (por ahora usa los mismos):
const desktopPlaylist = ['/videos/video1.mp4','/videos/video2.mp4'];

Móvil (por ahora usa los mismos):
const mobilePlaylist = ['/videos/video1.mp4','/videos/video2.mp4'];
(Más adelante podré reemplazar por hero-desktop-*.mp4 y hero-mobile-*.mp4 en la misma carpeta /public/videos/).

1) Crea el componente del Hero

Archivo: src/components/HeroVideo.tsx
Requisitos:

use client al inicio.

Renderiza un <section class="hero"> con:

<video id="heroVideo" class="hero__video" autoplay muted playsinline preload="metadata" poster="/assets/hero-poster.jpg" aria-label="Video de chocolate artesanal"> (sin <source> en el JSX; la src la setea JS).

div.hero__overlay con un <h1> y un <a> tipo botón (CTA “Compra ahora” apuntando a /shop).

Estilos (CSS Module): crea src/components/HeroVideo.module.css:

.hero: posición relativa, altura mínima 62vh (desktop) y 48vh (móvil).

.hero__video: posición absoluta inset:0, width:100%, height:100%, object-fit:cover, object-position:center.

.hero__overlay: position:relative; z-index:1; display:grid; place-items:center; text-align:center; color:#fff; text-shadow:0 2px 16px rgba(0,0,0,.35).

CTA con borde redondeado (12px), padding 12–16px, color base #6B3A1E; hover con opacity:.9.

Media-query @media (max-width:768px){ .hero{ min-height:48vh } }.

2) Lógica del playlist y device-switch

En HeroVideo.tsx:

Si window.matchMedia('(max-width: 768px)') es true ⇒ usa mobilePlaylist; si no, desktopPlaylist.

Reproduce dos videos consecutivos y al terminar el segundo vuelve al primero (loop del playlist, no del archivo).

Implementa una función playIndex(i) que:

Asigna video.src = currentPlaylist[i].

Espera video.load() y llama a video.play(). Maneja el Promise (catch): si falla autoplay, muestra un botón “Reproducir”.

En el evento ended, playIndex((i+1) % currentPlaylist.length).

Pre-carga ligera del siguiente clip: crea un <video> off-DOM con preload="metadata" para el nextIndex y, cuando toque, el cambio sea rápido.

Cambio de orientación/responsive: escucha el matchMedia; si cambia el breakpoint, marca un flag pendingSwitch. Al terminar el clip en curso, cambia currentPlaylist y reinicia en el índice 0.

Intersección: usa IntersectionObserver (threshold 0.25). Si el Hero no está visible ⇒ video.pause(). Si vuelve ⇒ video.play().

Preferencias de movimiento: si prefers-reduced-motion: reduce, no auto-reproducir; muestra solo el poster y el CTA.

Errores: si un archivo no carga o hay MEDIA_ERR_*, salta al siguiente clip.

3) Importa el Hero en la Home

Archivo: src/app/page.tsx

Importa y renderiza <HeroVideo /> al inicio del contenido de la página.

4) Opcional WebM

Si existen /videos/video1.webm y /videos/video2.webm, intenta usar WebM primero: crea una función pickSource(baseMp4) que pruebe baseWebm = mp4.replace('.mp4','.webm') con fetch(head), y si 200 usa WebM; si no, MP4.

5) Accesibilidad y SEO

aria-label en el <video>.

poster="/assets/hero-poster.jpg" (yo subiré esa imagen a /public/assets/hero-poster.jpg).

Sin CLS: el contenedor del Hero debe reservar altura con CSS.

6) Entrega

Archivos finales:

src/components/HeroVideo.tsx

src/components/HeroVideo.module.css

Modificación en src/app/page.tsx para usar el componente.

Código limpio, comentado, sin librerías externas.

Deja al inicio de HeroVideo.tsx un bloque // TODO: indicando dónde cambiar las rutas si luego uso hero-desktop-*.mp4 y hero-mobile-*.mp4.

Aceptación: En desktop y móvil el Hero reproduce video1.mp4 y luego video2.mp4 en bucle; pausa fuera de viewport; respeta prefers-reduced-motion; el CTA siempre legible; no hay jumps de layout.
