# Cuaderno de IA

Apuntes interactivos del certificado **IBM AI Engineering** (Coursera), en español, con animaciones, ejemplos numéricos y código explicado línea por línea. Web estática: HTML + CSS + JS, sin build.

## Ver en local
Abre `index.html` en el navegador, o sirve la carpeta: `python3 -m http.server 8000` y visita http://localhost:8000

## Publicar en GitHub Pages
1. Crea un repositorio y sube todo el contenido de esta carpeta a la raíz (rama `main`).
2. En GitHub: Settings → Pages → *Deploy from a branch* → rama `main`, carpeta `/ (root)` → Save.
3. En un minuto estará en `https://TU-USUARIO.github.io/TU-REPO/`. El archivo `.nojekyll` ya está incluido.

## Estructura
- `index.html` – portada; `curso-1/` … `curso-5/` – módulos.
- `assets/` – estilos, scripts, demos interactivas (`assets/js/demos/`) y KaTeX.
- `assets/js/curriculum.js` – índice de cursos y módulos (única fuente de verdad).
- `docs/GUIA_PARA_ANADIR_CURSOS.md` y `docs/plantilla-modulo.html` – cómo añadir módulos y cursos.
- `tools/check_site.py` – comprobador (Playwright) de enlaces, demos y desbordes.

## Estado
Cursos 1 a 5. El resto del certificado (cursos 6–13) se añade siguiendo `docs/GUIA_PARA_ANADIR_CURSOS.md`.
