/* Configuración de la cuenta (Firebase).
   Copia aquí «apiKey» y «projectId» de tu app web de Firebase
   (Firebase → Configuración del proyecto → General → Tus apps → SDK setup and configuration).
   La apiKey de Firebase es pública por diseño: la seguridad la ponen las reglas de Firestore
   (ver docs/CUENTA_Y_SINCRONIZACION.md).
   Si se dejan vacías, la web funciona igual pero guarda el progreso solo en este navegador. */
window.CUADERNO_CUENTA = {
  apiKey: "",
  projectId: ""
};
