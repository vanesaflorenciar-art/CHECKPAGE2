# PAGE CHECK

1. **Supabase** (gratis): creá un proyecto y ejecutá `supabase/schema.sql` en el SQL Editor.
2. **Brevo** (gratis): creá cuenta, una API key (SMTP & API), una lista para contactos con consentimiento y verificá un remitente en *Senders, domains & dedicated IPs*. Brevo no admite direcciones Gmail como remitente: verificá un dominio propio o usá una dirección de tu dominio.
3. **Netlify**: subí esta carpeta (o conectala a un repo) y cargá en *Site configuration > Environment variables*:
   `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (service_role, nunca en el frontend), `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`, `BREVO_LIST_ID`, `ADMIN_TOKEN` (una clave larga y aleatoria).
4. Panel privado: `/admin.html` (pide el `ADMIN_TOKEN`). `PACK_URL` está al inicio del script de `public/index.html`.
5. Secuencia de emails 2 a 5: armala en Brevo (Automations) disparada al ingresar a la lista. Brevo agrega el enlace de baja en los correos comerciales.
Sin `BREVO_API_KEY` no se envía nada y la app lo informa.
