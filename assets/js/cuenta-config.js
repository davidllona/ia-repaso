/* Configuración de la cuenta (Firebase).
   Copia aquí «apiKey» y «projectId» de tu app web de Firebase
   (Firebase → Configuración del proyecto → General → Tus apps → SDK setup and configuration).
   La apiKey de Firebase es pública por diseño: la seguridad la ponen las reglas de Firestore
   (ver docs/CUENTA_Y_SINCRONIZACION.md). Regla general: match /{cuaderno}/{uid} solo para su dueño.
   Si se dejan vacías, la web funciona igual pero guarda el progreso solo en este navegador. */
window.CUADERNO_CUENTA = {
  apiKey: "AIzaSyAnp3IH26oiY0zixEoZL-M49ghBtnrRYnU",
  projectId: "repasoia",
  /* Carpeta de Firestore de ESTE cuaderno. Cada cuaderno que use el mismo Firebase
     debe tener la suya (p. ej. "progreso-react"); el usuario y la contraseña son los mismos. */
  coleccion: "progreso"
};
