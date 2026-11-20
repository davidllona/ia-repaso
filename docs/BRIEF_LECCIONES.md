# Brief: lecciones clarísimas, muy visuales, con código explicado desde cero

Proyecto: `/home/claude/ia-repaso` (web estática «Cuaderno de IA», es un repo git; **no ejecutes git**, de subirlo se encarga el coordinador). Lee también `docs/GUIA_PARA_ANADIR_CURSOS.md` (contrato de demos `Lab.register`).

## Qué dice David (el alumno) — literal
1. «Le faltan cosas y está explicado raro… tendría que ser todo más claro y facilísimo de repasar; hay cosas que se me escaparon cuando lo estudié.»
2. «Me cuesta, no lo explicas del todo claro, me pierdo un poco, sobre todo porque **en el código no explicas por qué importas tal, qué es ese sklearn, etc.** Es mejor que todos los códigos aparezcan al final de cada lección y que se expliquen genial.»
3. «Revisa que en móvil se ve todo genial.»
4. «Debe haber **más animaciones** y cosas para entenderlo todo mil veces mejor.»
5. «El código de cada lección debería ir en un apartado aparte: la última pestaña del módulo, un **laboratorio** con un ejemplo completo, todo bien explicado, qué hace cada cosa y cómo funciona; y si una línea cuesta, que ponga: *esta línea se puede leer así: si tal, tal, tal*.»
6. «Tiene que ser agradable a la vista para verlo a oscuras, tumbado en la cama o de día.» (El tema ya está hecho: no toques colores.)

Nota: algunas lecciones pueden tener a medias un bloque `antes-codigo` o tablas reescritas por un intento anterior: aprovecha lo que sirva y llévalo al laboratorio.

La lección de referencia para la PARTE VISIBLE es `curso-1/modulo-1/leccion-2.html` (pasos numerados, palabras de calle, tablas, chuleta). Lo de CÓDIGO y ANIMACIONES es nuevo: nadie lo ha hecho aún, lo defines tú siguiendo esto.

## A · Parte visible (del `<header class="hero leccion">` hasta antes de `<details class="profundizar">`)
Si la lección ya tiene `<h2 id="chuleta">`, esta parte ya se afinó: **no la reescribas**, solo añade animaciones (C), saca cualquier código de varias líneas al laboratorio (B) y arregla lo que veas mal en móvil. Si no la tiene, reescríbela así:
1. **Pasos numerados, una idea por paso** (`<h2 id="…">1 · …</h2>`). Conserva los `id` existentes de los h2; ids nuevos únicos (ojo: «Profundizar» tiene sus propios ids; si allí ya hay `id="chuleta"`, renómbralo allí).
2. **Cada palabra técnica se explica la primera vez que sale**, en palabras de calle. Nada de nombres que aún no se han visto sin una frase que diga qué son. Si algo se usa y nunca se explicó, explícalo.
3. **Frases cortas.** Sin incisos largos.
4. **Un visual por paso**: tabla pequeña (máx. 3 columnas; 4 solo con cifras cortas), `ul.flow`, `<figure class="figura"><svg>` (clases `fill-a`, `fill-b`, `fill-d`, `muted`, `mono`; nunca colores a mano; letra ≥ 19 en viewBox de 640 para que se lea en móvil), callouts `regla`/`ejemplo`/`analogia`/`ojo`.
5. Ejemplos de **Netflix / películas / series**. Las cifras existentes no cambian.
6. **Chuleta** justo antes de `<div class="resumen">`:
   `<section><h2 id="chuleta">Chuleta para repasar</h2><dl class="chuleta"><div><dt>Palabra</dt><dd>Qué es. <em>Ejemplo.</em></dd></div>…</dl></section>` (5–13 palabras) y en el `meta-line` del hero ` · <a href="#chuleta">Ir a la chuleta</a>`. En `dt` y `th` no pongas símbolos griegos ni `<code>` (salen en mayúsculas).
7. Conserva las 2 `details.predice` y el mini test; reescríbelos sin términos sin explicar (JSON válido, `correcta` es índice).

## B · Código: TODO en el «Laboratorio» del módulo (lo más importante)
David pidió literalmente: «el código de cada lección debería ir en un apartado aparte: la última pestaña del módulo
es un laboratorio donde se hace un ejemplo completo con todo bien explicado, qué hace cada cosa y cómo funciona, y si
hay una línea que cuesta, que ponga: *Esta línea se puede leer así: si tal, tal, tal*».

### B1 · Las lecciones ya no llevan código
En cada `leccion-*.html`, la sección `<h2 class="sin-num">Código</h2>` con sus `article.snippet` (y los avisos
«Antes de leer…», el bloque `antes-codigo` y «Código: el resto del módulo») **se sustituye** por:
```html
<section class="ir-lab">
<h2 class="sin-num">Código</h2>
<a class="lab-card" href="laboratorio.html#paso-3"><span class="lc-ico" aria-hidden="true">🧪</span>
  <span><strong>Ver el código de esta lección en el Laboratorio</strong>
  <span>Paso 3 · Entrenar el árbol: qué hace cada línea y cómo se lee.</span></span></a>
</section>
```
(enlaza al paso del laboratorio donde está lo de esa lección; si son varios pasos, enlaza al primero y nómbralos).
Fuera de esa sección tampoco debe quedar código de más de una línea en la lección.

### B2 · Crea `curso-N/modulo-M/laboratorio.html`
Copia la estructura de una lección (head, `<body data-root="../../" data-course="N" data-module="M" data-lesson="K+1">`
donde K = nº de lecciones, hero `hero leccion` con eyebrow «Curso N · Módulo M · Laboratorio»). Contenido, en este orden:
1. **Hero**: título «Laboratorio: <qué construimos>» y un `lead` de una frase («Vamos a … de principio a fin con Python»).
2. `<h2 id="mapa">Lo que vamos a hacer</h2>` + `<ol class="lab-mapa">` con un `<li><a href="#paso-1">Título del paso</a></li>`
   por paso (de un vistazo, el ejemplo completo).
3. `<h2 id="antes">Antes de empezar: las piezas</h2>`: qué es Python en una frase, qué es una **librería** y qué hace
   `import`, y una `dl.chuleta` con una ficha por CADA librería, módulo, clase y función que salga en el laboratorio
   (numpy/np, pandas/pd, scikit-learn/sklearn, `train_test_split`, `fit`, `predict`, keras, torch…): qué es, para qué la
   usamos aquí, y de dónde sale el nombre o el apodo («sklearn es scikit-learn escrito corto; se escribe así al importar»).
4. **Un paso por cada parte del ejemplo** (6–12 pasos), cada uno `<section class="lab-paso" id="paso-N">` con
   `<h2><span class="paso-n">N</span>Título</h2>`, una frase de **para qué sirve este paso y con qué lección conecta**
   (con enlace a la lección), y un `article.snippet` con el formato de siempre (`header` + `p.para-que`, `pre.code`,
   `details.linea-a-linea open` con `table.lineas`, y `div.salida`). En la `table.lineas` CADA fila dice:
   - qué hace la línea, en palabras de calle;
   - `<span class="por-que">…</span>`: por qué hace falta (qué pasaría sin ella);
   - y en las líneas que cuestan (casi todas las de librerías, condiciones, bucles, corchetes, argumentos con nombre…)
     `<span class="se-lee">si el cliente lleva más de 18,5 días sin entrar, apúntalo como «cancela»; si no, como «se queda»</span>`:
     la línea traducida a una frase en castellano que se pueda leer en voz alta.
   Explica cada argumento raro (`random_state=42`, `test_size=0.2`, `max_depth=1`, `axis=1`, `[:1]`, `.shape`…) y la
   sintaxis de Python la primera vez que salga (`def`, `for`, `if`, `[]`, `{}`, `f"…"`, `with`, `class`, `self`…).
   En `div.salida`: la salida real y **cómo leer cada número**.
5. `<h2 id="completo">El código completo</h2>`: el script entero seguido (un solo `pre.code`, sin tabla) para copiarlo
   y ejecutarlo de una vez, con una línea de cómo ejecutarlo (Colab / Jupyter / `python archivo.py`).
6. `<h2 id="mas-codigo">Más código del módulo</h2>`: los fragmentos de las lecciones que no encajen en el ejemplo
   completo, cada uno con su tabla reescrita igual (qué hace + por qué + se lee así). **Ningún fragmento del módulo se
   pierde**: todos están en un paso o aquí.
7. Chuleta final `<h2 id="chuleta">Chuleta del laboratorio</h2>` (funciones usadas → qué hacen, en una línea) y el
   resumen en tres líneas. Sin mini test ni Profundizar.

**El ejemplo completo** usa el hilo de Netflix del módulo y, siempre que se pueda, se construye **reutilizando y
ordenando los fragmentos que ya hay** (su código y su salida son reales: no los cambies). Si para que sea un ejemplo
continuo hace falta código nuevo o unir fragmentos, **ejecútalo de verdad** (`OMP_NUM_THREADS=1`; scikit-learn,
pandas y numpy están instalados; si necesitas TensorFlow/Keras o PyTorch, instálalos con
`pip install --break-system-packages tensorflow-cpu` / `pip install --break-system-packages torch --index-url https://download.pytorch.org/whl/cpu`)
y pega la salida real. Sin descargas de datasets de internet: datos inventados con numpy/pandas o los de
`sklearn.datasets` que vienen dentro de la librería.

### B3 · Índice del módulo
Añade al final de `docs/lecciones/cNmM.json` `{"n":K+1,"slug":"laboratorio","title":"Laboratorio: …","blurb":"…","min":X}`
(`min` = minutos reales de lectura del laboratorio; puede pasar de 5) y ejecuta `python3 tools/merge_lessons.py`.
Si el hub `curso-N/modulo-M.html` menciona el número de lecciones, actualízalo.

## C · Más animaciones (mínimo 2 cosas que se muevan o se toquen por lección, además de la demo que ya tenga)
Herramientas, de más barata a más cara:
1. **Reproductor «paso a paso»** (ya programado en `app.js`): úsalo para TODA cuenta a mano o proceso de varios pasos de la parte visible, en lugar de (o además de) la tabla estática.
   ```html
   <div class="anim-pasos" data-titulo="La nota de la película, paso a paso">
     <div class="paso"><p><strong>1.</strong> Duración: 2 h × peso 0,43</p><span class="grande">+0,86</span></div>
     <div class="paso"><p><strong>2.</strong> Es secuela: 1 × −1,72</p><span class="grande">0,86 − 1,72 = −0,86</span></div>
     …3 a 7 pasos; cada paso corto: 1–2 frases y, si procede, el resultado en <span class="grande">…</span>, una mini tabla o un mini SVG…
   </div>
   ```
2. **Demo interactiva nueva** (`assets/js/demos/cursoN/cNmM-nombre.js` con `Lab.register`, `<figure class="demo" data-demo="cursoN/cNmM-nombre" data-titulo="…">` + `<div class="haz">` + `<div class="observa">`): créala cuando el concepto central de un paso no tenga ninguna y se entienda mejor moviendo algo (slider, botones, puntos que se animan). Copia el estilo de una demo sencilla existente del mismo curso. Sin arrastre en táctil salvo con slider alternativo (`drag: !matchMedia('(pointer:coarse)').matches`). Textos de canvas ≥ 11 px y que no se pisen a 375 px. `node --check`.
3. Las demos que estaban dentro de «Profundizar» pueden subir a la parte visible si ayudan (sin duplicarlas).
Objetivo: que cada idea importante tenga algo que se mueve. Calidad antes que cantidad: una animación que no aclara nada sobra.

## D · Móvil (375 px) — obligatorio
- Ninguna tabla, esquema, `pre`, fórmula o demo visible se corta ni obliga a scroll lateral de página. Tablas: máx. 3 columnas de texto corto.
- Sirve la web por http (no `file://`) para las capturas; haz capturas a 375 px de TODAS las lecciones (parte visible, chuleta, «Antes de leer el código» y una tabla línea a línea) y míralas. Mira también cada demo nueva funcionando.
- El tema es oscuro (negro + rojo). Usa solo variables/clases del CSS: nada de colores a mano.

## Límites
- Palabras visibles de cada LECCIÓN: objetivo ≤ 800, máximo 900 (`python3 tools/palabras.py curso-N/modulo-M/`; chuleta y Profundizar no cuentan; el texto de `.anim-pasos` sí). El laboratorio no tiene límite, pero cada paso debe ser corto y claro.
- No toques `assets/js/app.js`, `lab.js`, `cuenta*.js`, `assets/css/style.css`, `comun/`, `tools/`. Si necesitas algo del framework, dilo en el informe.
- Tras tocar `docs/lecciones/cNmM.json`, ejecuta `python3 tools/merge_lessons.py` (es idempotente; puede tocar otros módulos en `curriculum.js` sin problema).
- NO uses `pkill`. Una cosa pesada cada vez (CPU compartida con otros agentes). Temporales en tu propia carpeta bajo `/tmp/claude-0/-home-claude/e8ada9e5-9b4d-5445-aa70-5f4e1fd060a9/scratchpad/`.
- Guarda tu trabajo lección a lección (cada lección terminada queda escrita en disco antes de empezar la siguiente): si te cortan, se retoma desde ahí.

## Verificación final
- `python3 tools/palabras.py curso-N/modulo-M/` → ninguna por encima de 900.
- `python3 tools/check_site.py curso-N/modulo-M.html curso-N/modulo-M/leccion-*.html curso-N/modulo-M/laboratorio.html` → 0 problemas.
- Un script que confirme que cada `article.snippet` original del módulo está en el laboratorio (por su código).
- Quiz JSON válido, ids únicos, `node --check` en demos nuevas.

## Informe final (breve, en español; uno solo y terminas, sin trabajo en segundo plano)
Laboratorio: qué ejemplo construye, nº de pasos, nº de fichas en «Antes de empezar», nº de fragmentos, si ejecutaste código nuevo. Por lección: animaciones añadidas (paso a paso / demos nuevas con nombre), si reescribiste la parte visible, palabras. Y problemas de móvil o del framework.

## Notas añadidas
- Tema: oscuro suave (gris carbón, texto hueso, rojo de acento) o claro cálido según el sistema; los gráficos usan su propia paleta azul/ámbar/verde (`api.colors()` ya la devuelve). No fijes colores.
- Revisa a 375 px TODAS las demos de tu módulo (no solo las nuevas): si los rótulos del canvas se pisan o se cortan (p. ej. en `curso1/aprende-umbral` se pisan «predice: se queda», el título del eje y el texto del segundo gráfico), arréglalo en el JS de la demo: textos más cortos en pantallas estrechas, más margen o dos líneas. Esto sí puedes tocarlo aunque la demo no sea nueva (salvo las de `comun/`: avisa en el informe).
- Las capturas guárdalas en `/home/claude/shots/<tu-modulo>/` (crea la carpeta). Hay un ejemplo de script de capturas en `/home/claude/shots/shot.py`.
