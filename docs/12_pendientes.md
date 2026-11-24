# 12 · Pendientes antes de publicar

Lo que la web necesita de la pastelería (o de otras personas) para salir a producción.

## De la clienta

- [x] **Permiso** para usar su marca y su logo en la web y en el curso público (confirmado el 2026-11-24).
- [ ] **Precios reales** de cada opción (`src/app/core/catalogo/tortas.json`).
- [ ] **Antelación** de cada opción, hora de corte y días cerrados.
- [ ] **Reglas** de combinaciones imposibles (las actuales son de ejemplo: fruta fresca ≤ 2 pisos, corazón ≤ 3 pisos, pequeña ≤ 3 pisos, naked y glaseado solo lisos, fondant sin borlas).
- [ ] Sabores, rellenos, colores y toppers que ofrece de verdad.
- [ ] **Historia** de la dueña (portada y "Nosotros") y fotos si quiere.
- [ ] **Datos de contacto**, dirección y horario.
- [ ] 5–10 **publicaciones reales** suyas para enseñar a la IA su forma de escribir.
- [ ] Descuento de cumpleaños (ahora 10 %) y sus condiciones.
- [ ] Pasar la cuenta de Instagram **que ya existe** a cuenta profesional (empresa), vincularla a una página de Facebook y generar el token de la Graph API (para publicar desde n8n).
- [ ] Decidir si se publica también en X y TikTok (el flujo actual solo prepara Instagram).

## Técnicos

- [ ] Cuenta de **Brevo**: remitente verificado, lista "Newsletter", clave de API.
- [ ] Clave de la **API de Claude** para n8n.
- [ ] Dominio, servidor y HTTPS (guía 11).
- [ ] **Revisión legal** (RGPD/LOPDGDD) de la política de privacidad y de los textos de consentimiento; datos del responsable.
- [ ] Modelos de Blender (GLB) para piezas con más detalle (opcional; ahora todo es geometría generada por código).

## Fases siguientes (según PROYECTO-WEB.md)

- Fase 2 completa: cuentas de usuario con historial de diseños en el servidor.
- Fase 4: más productos (galletas, cupcakes) con su catálogo JSON.
- Fase 5: pago online (un estado más del pedido).
- Fase 6: realidad aumentada.
