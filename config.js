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
  supabaseUrl: '',      // Ej.: 'https://abcdefgh.supabase.co'
  supabaseAnonKey: '',  // Ej.: 'eyJhbGciOi...'
  table: 'portfolio_content',
  bucket: 'portfolio-media'
};
