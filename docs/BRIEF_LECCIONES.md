# Brief: lecciones clarísimas, muy visuales, con código explicado desde cero

Proyecto: `/home/claude/ia-repaso` (web estática «Cuaderno de IA», es un repo git; **no ejecutes git**, de subirlo se encarga el coordinador). Lee también `docs/GUIA_PARA_ANADIR_CURSOS.md` (contrato de demos `Lab.register`).

## Qué dice David (el alumno) — literal
1. «Le faltan cosas y está explicado raro… tendría que ser todo más claro y facilísimo de repasar; hay cosas que se me escaparon cuando lo estudié.»
2. «Me cuesta, no lo explicas del todo claro, me pierdo un poco, sobre todo porque **en el código no explicas por qué importas tal, qué es ese sklearn, etc.** Es mejor que todos los códigos aparezcan al final de cada lección y que se expliquen genial.»
3. «Revisa que en móvil se ve todo genial.»
4. «Debe haber **más animaciones** y cosas para entenderlo todo mil veces mejor.»

La lección de referencia para la PARTE VISIBLE es `curso-1/modulo-1/leccion-2.html` (pasos numerados, palabras de calle, tablas, chuleta). Lo de CÓDIGO y ANIMACIONES es nuevo: nadie lo ha hecho aún, lo defines tú siguiendo esto.

## A · Parte visible (del `<header class="hero leccion">` hasta antes de `<details class="profundizar">`)
Si la lección ya tiene `<h2 id="chuleta">`, esta parte ya se afinó: **no la reescribas**, solo añade animaciones (C), saca el código suelto al final (B) y arregla lo que veas mal en móvil. Si no la tiene, reescríbela así:
1. **Pasos numerados, una idea por paso** (`<h2 id="…">1 · …</h2>`). Conserva los `id` existentes de los h2; ids nuevos únicos (ojo: «Profundizar» tiene sus propios ids; si allí ya hay `id="chuleta"`, renómbralo allí).
2. **Cada palabra técnica se explica la primera vez que sale**, en palabras de calle. Nada de nombres que aún no se han visto sin una frase que diga qué son. Si algo se usa y nunca se explicó, explícalo.
3. **Frases cortas.** Sin incisos largos.
4. **Un visual por paso**: tabla pequeña (máx. 3 columnas; 4 solo con cifras cortas), `ul.flow`, `<figure class="figura"><svg>` (clases `fill-a`, `fill-b`, `fill-d`, `muted`, `mono`; nunca colores a mano; letra ≥ 19 en viewBox de 640 para que se lea en móvil), callouts `regla`/`ejemplo`/`analogia`/`ojo`.
5. Ejemplos de **Netflix / películas / series**. Las cifras existentes no cambian.
6. **Chuleta** justo antes de `<div class="resumen">`:
   `<section><h2 id="chuleta">Chuleta para repasar</h2><dl class="chuleta"><div><dt>Palabra</dt><dd>Qué es. <em>Ejemplo.</em></dd></div>…</dl></section>` (5–13 palabras) y en el `meta-line` del hero ` · <a href="#chuleta">Ir a la chuleta</a>`. En `dt` y `th` no pongas símbolos griegos ni `<code>` (salen en mayúsculas).
7. Conserva las 2 `details.predice` y el mini test; reescríbelos sin términos sin explicar (JSON válido, `correcta` es índice).

## B · Código: SIEMPRE al final y explicado desde cero (lo más importante)
En la sección `<h2 class="sin-num">Código</h2>` (después de «Profundizar»):
1. **Nada de código fuera de ahí.** Si en la parte visible hay bloques de código (`pre`), muévelos a esta sección o conviértelos en una frase/tabla. (El `code` en línea de 1–2 palabras sí puede quedarse.)
2. Justo debajo del `<h2>`, un bloque **«Antes de leer el código»** que no dé nada por sabido:
   ```html
   <div class="callout recuerda antes-codigo">
     <span class="lbl">Antes de leer el código</span>
     <p>Una o dos frases: qué vamos a comprobar con código y con qué idea de la lección conecta.</p>
     <dl class="chuleta">
       <div><dt>import</dt><dd>Traer código que otra gente ya escribió para no hacerlo tú. <em>Como instalar una app en vez de programarla.</em></dd></div>
       <div><dt>scikit-learn (sklearn)</dt><dd>La librería de Python con los algoritmos de Machine Learning ya hechos. En el código se escribe <code>sklearn</code>.</dd></div>
       …una ficha por CADA librería, módulo, clase y función que aparezca en los fragmentos de esta lección
          (numpy/np, pandas/pd, sklearn.tree, DecisionTreeClassifier, train_test_split, fit, predict, keras, torch, nn.Module, DataLoader…):
          qué es, para qué sirve aquí, y de dónde sale el nombre o el apodo si ayuda…
     </dl>
   </div>
   ```
   Aunque una librería ya se explicara en lecciones anteriores, repite su ficha corta: David repasa lecciones sueltas.
3. **Reescribe la tabla «Línea por línea» de cada fragmento** (`table.lineas`, mismas filas `tr[data-lines]`, misma primera celda con el código) para que cada explicación responda, con palabras de calle: **qué hace** la línea, **por qué hace falta** y **qué significa cada palabra o argumento raro** (p. ej. `random_state=42`: «fija el azar para que a ti te salga lo mismo que aquí; 42 es un número cualquiera»). En las líneas `import`/`from … import …`: de qué librería viene, qué es esa pieza y para qué la vamos a usar más abajo. Explica también la sintaxis de Python que no sea obvia la primera vez que salga en la lección (dobles corchetes, `[:1]`, `f"…"`, `lambda`, `with`, `def`, `class`, `self`, `.shape`, `axis=1`…). 1–3 frases por fila.
4. Reescribe también el **«Para qué sirve»** (una frase clara) y el texto bajo «Salida esperada» para que diga **cómo leer cada número de la salida**.
5. **No cambies ni el código (`pre.code`) ni la salida (`.salida pre`)**: están ejecutados de verdad.
6. Si un fragmento usa cosas de lecciones posteriores, déjalo dicho en un `<div class="callout recuerda"><span class="lbl">Antes de leer el fragmento N</span>…` (si ya existe, mejóralo).

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
- Palabras visibles: objetivo ≤ 800, máximo 900 (`python3 tools/palabras.py curso-N/modulo-M/`; chuleta, código y Profundizar no cuentan; el texto de `.anim-pasos` sí: hazlo corto).
- No toques `assets/js/app.js`, `lab.js`, `cuenta*.js`, `assets/css/style.css`, `comun/`, `tools/`. Si necesitas algo del framework, dilo en el informe.
- Si cambias duración o título: `docs/lecciones/cNmM.json` (`min`, `blurb`) y **no** ejecutes `merge_lessons.py` (lo hace el coordinador).
- NO uses `pkill`. Una cosa pesada cada vez (CPU compartida con otros agentes). Temporales en tu propia carpeta bajo `/tmp/claude-0/-home-claude/e8ada9e5-9b4d-5445-aa70-5f4e1fd060a9/scratchpad/`.
- Guarda tu trabajo lección a lección (cada lección terminada queda escrita en disco antes de empezar la siguiente): si te cortan, se retoma desde ahí.

## Verificación final
- `python3 tools/palabras.py curso-N/modulo-M/` → ninguna por encima de 900.
- `python3 tools/check_site.py curso-N/modulo-M.html curso-N/modulo-M/leccion-*.html` → 0 problemas.
- Quiz JSON válido, ids únicos, `node --check` en demos nuevas.

## Informe final (breve, en español; uno solo y terminas, sin trabajo en segundo plano)
Por lección: qué quedó en «Antes de leer el código» (nº de fichas), nº de fragmentos con la tabla reescrita, animaciones añadidas (paso a paso / demos nuevas con nombre), si reescribiste la parte visible, palabras. Y problemas de móvil o del framework.
