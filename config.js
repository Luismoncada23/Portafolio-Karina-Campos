/* =====================================================================
   config.js — Conexión con Supabase (opcional)

   Déjalo vacío para trabajar en "modo local" (sin publicación automática).
   Para activar la publicación automática, pega aquí los dos datos de tu
   proyecto de Supabase (Project Settings → API):
     - Project URL           → supabaseUrl
     - anon public key       → supabaseAnonKey

   La clave "anon" es pública por diseño: la seguridad la dan las reglas
   (RLS) del archivo supabase-setup.sql. NUNCA pegues aquí la clave
   "service_role".
   ===================================================================== */
window.PF_CONFIG = {
  supabaseUrl: 'https://ogijwqzvmhukgdlkrhbx.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naWp3cXp2bWh1a2dkbGtyaGJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4Njk5ODAsImV4cCI6MjEwNzQ0NTk4MH0.dpDZV5mtEGACk7dQY08OJR7HQEwksMl3E9WcTHlNmGQ',
  table: 'portfolio_content',
  bucket: 'portfolio-media'
};
