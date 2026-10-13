# Publicación automática con Supabase

Con esta conexión, al pulsar **Publicar** en el panel los cambios los ven todos los
visitantes al instante, sin subir archivos. Supabase tiene un plan gratuito que alcanza
de sobra para un portafolio.

## Cómo entrar al panel

En el portafolio, haz **5 clics seguidos** sobre el nombre que aparece abajo a la
izquierda (en el pie de página). Se abre el panel y pide correo y contraseña.

## Configuración (una sola vez, unos 10 minutos)

1. **Crea el proyecto.** Entra a https://supabase.com, crea una cuenta y un proyecto nuevo.
2. **Crea las tablas y reglas.** En el proyecto: *SQL Editor → New query*. Pega todo el
   contenido de `supabase-setup.sql` y pulsa *Run*.
3. **Crea tu usuario.** *Authentication → Users → Add user → Create new user*.
   Escribe tu correo y una contraseña segura, y marca *Auto Confirm User*.
4. **Bloquea registros nuevos.** *Authentication → Sign In / Providers* y desactiva
   *Allow new users to sign up*. Así nadie más puede crear cuentas.
5. **Copia dos datos.** *Project Settings → API*:
   - **Project URL**
   - **anon public** (la clave pública)
6. **Pégalos en `config.js`** (en `supabaseUrl` y `supabaseAnonKey`).
7. **Sube todos los archivos** a tu hosting, incluido `config.js` ya completado.
8. Entra al panel (5 clics), inicia sesión y pulsa **Publicar** una primera vez.

## Importante

- Pega solo la clave **anon public**. Nunca la `service_role`.
- La clave anon es pública por diseño. La seguridad la dan las reglas del SQL: cualquiera
  puede leer el contenido, pero solo tu usuario puede cambiarlo.
- `data.js` sigue siendo el respaldo: si el servicio en línea no responde, el sitio muestra
  ese archivo. Descárgalo desde *Publicar y respaldo* de vez en cuando y reemplázalo.
- Los proyectos del plan gratuito pueden pausarse tras un tiempo sin actividad. Si ocurre,
  se reactivan desde el panel de Supabase y mientras tanto el sitio sigue mostrando `data.js`.
