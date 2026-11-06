# Cuaderno de IA · 6 cursos

Apuntes interactivos en español para **IBM AI Engineering**. Se han convertido los **31 módulos de los cursos 1–6 en 399 lecciones cortas**, diseñadas para hacer el recorrido esencial en **unos 3 minutos**, contando lectura, animación y dos preguntas. El tiempo es una **estimación**: depende de cada persona y de cuánto explore la animación.

## Cómo usar cada lección

1. **Antes de leer:** intenta responder a la pregunta de predicción.
2. **Entender:** una idea breve y un ejemplo muy sencillo de la vida diaria (tiendas, mascotas, lluvia, transporte, etc.).
3. **Responder:** primera pregunta intercalada.
4. **Experimentar:** una animación interactiva de la idea. Hay controles para cambiar parámetros y comprobar resultados; 18 familias de visualizaciones para todas las lecciones.
5. **Aplicar:** segunda pregunta intercalada. La respuesta explica por qué es correcta.
6. **Profundizar (opcional):** texto original íntegro, tablas, fórmulas, las simulaciones extensas y el código explicado línea por línea. Esta parte **no** entra en el objetivo de 3 minutos.

Las preguntas y las animaciones funcionan sin conectarse a servidores externos. La web es **HTML, CSS y JavaScript estáticos**, sin instalación ni compilación. El progreso se guarda en el navegador con almacenamiento local.

## Abrir la web en el ordenador

Dentro de la carpeta descomprimida:

```bash
python3 -m http.server 8000
```

Abre `http://localhost:8000`. También puedes abrir `index.html`, aunque para las demos conviene usar un servidor local. Para verlo en el móvil desde la misma red puedes usar la IP local de tu ordenador en lugar de `localhost`, si tu cortafuegos lo permite.

## Subir la actualización a un repositorio GitHub existente

**Opción recomendada:** descomprime el ZIP, copia **todo su contenido** a la carpeta de tu repositorio (donde esté el `index.html`) y **sobrescribe los archivos anteriores**. Después, desde esa carpeta:

```bash
git status
git add -A
git commit -m "Cursos 1-6: 399 lecciones visuales de 3 minutos"
git push origin main
```

Si tu rama se llama `master` en vez de `main`, cambia la última línea por `git push origin master`.

### Si todavía no tienes el repositorio descargado

```bash
git clone https://github.com/TU-USUARIO/TU-REPOSITORIO.git
cd TU-REPOSITORIO
```

Copia allí los archivos del ZIP, incluyendo `.nojekyll`, y ejecuta los comandos anteriores. Sustituye `TU-USUARIO` y `TU-REPOSITORIO` por sus nombres reales.

### Si es un repositorio nuevo

Crea un repositorio **vacío** en GitHub y, desde la carpeta descomprimida que contiene `index.html`, ejecuta:

```bash
git init
git branch -M main
git add -A
git commit -m "Publicar Cuaderno de IA · 6 cursos"
git remote add origin https://github.com/TU-USUARIO/TU-REPOSITORIO.git
git push -u origin main
```

Para usar **GitHub Pages**, entra en el repositorio → **Settings → Pages → Deploy from a branch**, selecciona `main` y `/ (root)` y guarda. La URL será `https://TU-USUARIO.github.io/TU-REPOSITORIO/`. Este proyecto incluye `.nojekyll` para que GitHub Pages sirva bien todos los archivos.

## Organización

- `index.html`: portada.
- `curso-1/` … `curso-6/`: curso, índices de módulo y lecciones numeradas.
- `assets/css/style.css`: diseño claro/oscuro y lecciones móviles.
- `assets/js/microanimations.js`: 18 familias de animaciones interactivas nuevas.
- `assets/js/demos/`: simulaciones originales y avanzadas, conservadas.
- `assets/js/app.js`: navegación, progreso, preguntas y código explicado.
- `assets/js/curriculum.js`: fuente de verdad para cursos, módulos y lecciones.
- `docs/originales/`: módulos originales completos, sin perder contenido.
- `docs/GUIA_PARA_ANADIR_CURSOS.md`: cómo continuar el proyecto.
- `tools/verificar_estatico.py`: validación de enlaces locales, preguntas, demos y código.
- `tools/refresh_micro_lessons.py`, `tools/refine_questions.py`: herramientas de mantenimiento de la edición breve.

## Comprobaciones realizadas

Se han verificado **437 páginas HTML**, **399 lecciones**, **325 demos originales referenciadas**, **1.223 cuestionarios/bloques de preguntas** (incluidos los cuestionarios opcionales de consulta), **556 fragmentos de código**, rutas locales y enlaces, JSON de preguntas, e indicaciones de código línea por línea. La lectura principal tiene una mediana de unas **218 palabras** (máximo 324); la animación y las dos preguntas se suman al tiempo de lectura. No se ha podido hacer una comprobación visual automatizada con Chromium en este entorno por una restricción de acceso del navegador. Se recomienda probar algunas lecciones en móvil tras desplegar.

**Nota:** este es un proyecto personal de estudio; no es un producto oficial de IBM ni Coursera.
