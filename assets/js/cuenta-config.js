/* Configuración de la cuenta (Supabase).
   Pega aquí la «Project URL» y la clave «anon public» de tu proyecto de Supabase
   (Supabase → Project Settings → API). La clave anon es pública: la seguridad la ponen
   las reglas RLS de la tabla «progreso» (ver docs/CUENTA_Y_SINCRONIZACION.md).
   Si se dejan vacías, la web funciona igual pero guarda el progreso solo en este navegador. */
window.CUADERNO_CUENTA = {
  url: "",
  anonKey: ""
};
