rediseño completo (UI + UX + comportamiento) que soporte los flujos de usuario y administrador que describes, además de un plan claro de implementación. Abajo tienes: checklist de requisitos extraídos, diagnóstico del diseño actual, propuesta de rediseño (visual y funcional), contrato técnico mínimo (modelos y API), riesgos/edge-cases y el plan de trabajo siguiente con acciones concretas. Confirma y empiezo a implementar la primera iteración (autenticación demo + panel admin + control de stock).

Checklist (requisitos extraídos)
- [ ] Usuarios pueden registrarse/iniciar sesión y comprar (checkout simple).  
- [ ] Carrito funcional (ya existe) integrado con stock.  
- [ ] Al vender un producto, stock decrece y muestra “SIN STOCK”.  
- [ ] Admins pueden ver productos, usuarios y pedidos.  
- [ ] Admins pueden marcar producto como “no publicado” (ocultar al usuario) y eliminar (borrado lógico o físico).  
- [ ] Páginas responsivas y UX mejorada.  
- [ ] Soporte de roles (admin / usuario).  
- [ ] Flujo de pedido y vista de pedidos para admin.  

Diagnóstico rápido — diseño actual (lo que tienes hoy)
- Stack: Next.js (App router, TypeScript), Tailwind CSS, componentes en components, imágenes en productos.  
- Componentes clave ya presentes: `ProductCatalog`, `Cart`, `Checkout` y un `CartContext` (estado de carrito).  
- UX visual: paleta cálida (marrones/amarillos) aplicada; tarjetas de producto, CTA visibles.  
- Falta: autenticación, roles, panel admin, persistencia (DB), control real de stock, filtros avanzados, optimizaciones de imágenes en algunos componentes y gestión de productos (publish/unpublish/delete).  
- Observaciones técnicas: warnings resueltos (viewport moved), quedan `img` sin convertir en algunos archivos; build mostró `EPERM` de Windows (permiso al generar .next/trace) — no crítico pero resolver con permisos/limpieza si hace ruido.

Propuesta de rediseño — objetivo
- UX objetivo: interfaz cálida y premium, checkout en 1-2 pasos, carrito accessible desde drawer, vista de producto con estado de stock claro y badges (Orgánico, 70% cacao, SIN STOCK).  
- Funcional: agregar roles (usuario/admin), autenticación básica (demo o NextAuth/Supabase), persistencia (mock DB o Supabase/Postgres local), APIs para productos/pedidos/usuarios, panel admin para gestionar stock/publicación, decremento de stock en compra y bloqueo de compra si stock = 0.

Propuesta visual (resumen)
- Paleta: Color primario marrón oscuro #4E260E / acento #A0522D / amarillo cálido #FDE6C4.  
- Header: logo + búsqueda + icono carrito (drawer) + avatar/login.  
- Layout catálogo: filtro lateral (por % cacao, tipo, orgánico), cards con imagen centrada, badge de estado (En stock / Sin stock / Nuevo), botón “Agregar” desactivado si sin stock.  
- Product Detail: modal o página con más fotos, descripción, porcentaje cacao, origen, reviews (mock).  
- Checkout: formulario mínimo (nombre, dirección, email, teléfono), resumen de pedido fijo en la derecha (móvil: collapsible). Pago simulado (no integrar pasarela real en esta fase).  
- Admin UI: layout tipo dashboard con sidebar (Productos, Usuarios, Pedidos). Tabla productos con columnas: imagen, nombre, stock, publicado (toggle), acciones (editar, eliminar lógico). Tabla pedidos con detalle; usuarios listados.

Contrato técnico mínimo (inputs/outputs)
- Inputs: acciones UI (addToCart(productId, qty), placeOrder(payload), adminTogglePublish(productId), adminDelete(productId)).  
- Outputs: respuestas JSON de APIs (success, producto actualizado, pedido creado).  
- Formas de error: 400 para datos inválidos, 409 para falta de stock, 401 para acceso admin faltante.  
- Criterio de éxito: flujo de compra de un usuario decrementa stock y no permite nuevas compras cuando stock<=0; admin puede ocultar producto inmediatamente.

Modelos sugeridos (JSON)
- Product: { id, name, description, price, stock: number, published: boolean, image, tags: string[] }  
- User: { id, name, email, role: 'user'|'admin', createdAt }  
- Order: { id, userId, items: [{ productId, qty, price }], subtotal, shipping, total, status, createdAt }  

Opciones de implementación (recomendadas)
- A — Rápido/demo (frontend-only): usar Next.js API routes (dev-only) y almacenar datos en JSON en memoria o en un archivo `data/*.json`. Auth simulado con localStorage (login con role toggle). Bueno para demo, sin persistencia real.  
- B — Producción simple: usar Supabase (Postgres + Auth) o Firebase (Auth + Firestore). Permite usuarios reales, persistencia y reglas. Recomendado si quieres persistencia real.  
- C — Backend propio: Node/Express + PostgreSQL. Requiere infraestructura y más tiempo.

Recomendación: empezar por A (prototipo funcional) y luego migrar a B si quieres persistencia real. Esto permite entregar rápidamente panel admin + roles + stock.

Edge cases y cómo cubrirlos
- Compra concurrente (2 usuarios intentan comprar último item): resolver con check de stock en API y error 409 si ya no hay stock. En demo, simular respuesta conflict.  
- Usuarios sin sesión intentando comprar: permitir checkout como invitado (requisito original), pero para admin features forzar login.  
- Admin elimina (borrado lógico vs físico): implementar `deletedAt` o `published=false`; eliminar físico solo vía acción admin confirmada.  
- Pérdida de estado en reload: persistir carrito en localStorage para UX.  
- Imágenes grandes y LCP: convertir a `next/image` y usar `priority` para hero images.
