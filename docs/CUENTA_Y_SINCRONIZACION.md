# Cuenta y sincronización del progreso (Firebase)

La web es estática (GitHub Pages), así que el inicio de sesión y el guardado del progreso
en la nube los hace **Firebase** (plan gratuito Spark), usando su API REST: no hace falta
ninguna librería. Mientras `assets/js/cuenta-config.js` esté vacío, todo funciona igual que
antes y el progreso se guarda solo en el navegador.

## Activarlo (una vez)

1. **Authentication → Comenzar → Método de acceso → Correo electrónico/contraseña → Habilitar → Guardar.**
2. **Authentication → Configuración → Dominios autorizados → Agregar dominio:** `davidllona.github.io`.
3. **Firestore Database → Reglas**, sustituye todo por esto y pulsa **Publicar**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{cuaderno}/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

   Así cada persona solo puede leer y escribir **su** documento, en cualquier cuaderno.

4. **Configuración del proyecto (rueda) → General → Tus apps → icono `</>` (Web)**: ponle un
   nombre, *Registrar app*, y copia de `firebaseConfig` los valores `apiKey` y `projectId`
   en `assets/js/cuenta-config.js`. La `apiKey` de Firebase es pública por diseño; la
   protegen las reglas del paso 3.
5. Sube el cambio a GitHub. En 1–2 minutos el botón «Entrar» funciona.

## Varios cuadernos con el mismo Firebase

La regla de arriba sirve para todos. En cada cuaderno, `assets/js/cuenta-config.js` lleva el
mismo `apiKey` y `projectId` y una `coleccion` distinta (`progreso`, `progreso-react`…).
El usuario y la contraseña son los mismos, y como todos están en `davidllona.github.io`,
al entrar en uno quedas dentro en todos.

## Cómo funciona

- Botón de cuenta en la barra superior → Entrar / Crear cuenta / He olvidado la contraseña
  (Firebase envía el correo de recuperación con su propia página para poner la contraseña nueva).
- La sesión (token de refresco) se guarda en `localStorage` y se renueva sola: sigues dentro
  hasta pulsar «Cerrar sesión».
- Cada vez que marcas o desmarcas una lección se guarda la fecha del cambio
  (`cuaderno-ia:cambios:v1`). Al entrar, al volver a la pestaña y tras cada cambio, la web
  descarga tu documento `{coleccion}/{uid}`, lo **fusiona** (para cada lección gana el cambio más
  reciente) y lo vuelve a subir. Lo marcado antes de tener cuenta se conserva.
- Archivos: `assets/js/cuenta.js` (lógica e interfaz) y `assets/js/cuenta-config.js` (datos del proyecto).
