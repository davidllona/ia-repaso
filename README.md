# Cuaderno de IA

Apuntes interactivos del certificado **IBM AI Engineering** (Coursera), en español, con animaciones, ejemplos numéricos y código explicado línea por línea. Web estática: HTML + CSS + JS, sin build.

## Ver en local
Abre `index.html` en el navegador, o sirve la carpeta: `python3 -m http.server 8000` y visita http://localhost:8000

## Publicar en GitHub Pages
1. Crea un repositorio y sube todo el contenido de esta carpeta a la raíz (rama `main`).
2. En GitHub: Settings → Pages → *Deploy from a branch* → rama `main`, carpeta `/ (root)` → Save.
3. En un minuto estará en `https://TU-USUARIO.github.io/TU-REPO/`. El archivo `.nojekyll` ya está incluido.

## Estructura
- `index.html` – portada; `curso-1/` … `curso-6/` – cursos.
- Cada módulo es un índice (`curso-N/modulo-M.html`) más una carpeta de **lecciones cortas** (`curso-N/modulo-M/leccion-L.html`, menos de 5 minutos cada una): pregunta de predicción → idea → animación → ejemplo con números → segunda predicción → resumen en tres líneas → mini test → «Profundizar» (la explicación larga, plegada) → código explicado línea a línea.
- `assets/` – estilos, scripts, demos interactivas (`assets/js/demos/`) y KaTeX.
- `assets/js/curriculum.js` – índice de cursos y módulos (única fuente de verdad).
- `docs/GUIA_PARA_ANADIR_CURSOS.md`, `docs/plantilla-leccion.html` y `docs/plantilla-modulo-hub.html` – cómo añadir módulos, lecciones y cursos.
- `docs/lecciones/cNmM.json` – lista de lecciones de cada módulo; `python3 tools/merge_lessons.py` la vuelca en `curriculum.js`.
- `tools/palabras.py` – cuenta las palabras visibles de cada lección (objetivo ≤ 700, máximo 900).
- `tools/fix_anchors.py` – reescribe enlaces `modulo-M.html#ancla` a la lección donde está el ancla.
- `tools/check_site.py` – comprobador (Playwright) de enlaces, demos y desbordes.

## Cuenta (progreso en todos tus dispositivos)
Botón «Entrar» en la barra superior: inicias sesión con correo y contraseña y las lecciones marcadas se sincronizan entre móvil, tablet y ordenador. Usa Firebase (gratis); cómo activarlo en `docs/CUENTA_Y_SINCRONIZACION.md`.

## Estado
Cursos 1 a 6. El resto del certificado (cursos 7–13) se añade siguiendo `docs/GUIA_PARA_ANADIR_CURSOS.md`.
