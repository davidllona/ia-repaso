# Guía para añadir cursos y módulos

Esta web es **HTML, CSS y JavaScript estáticos**: no hay que compilar nada. Se sirve tal cual en GitHub Pages.
Esta guía explica cómo está montada y cómo añadir un curso nuevo (o un módulo) manteniendo el mismo formato.

- Módulo de referencia (cópialo en espíritu, no a ciegas): `curso-1/modulo-1.html`
- Esqueleto vacío para copiar: `docs/plantilla-modulo.html`
- Comprobador automático: `python3 tools/check_site.py`

---

## 1. Estructura de carpetas

```
index.html                  Portada
curso-N/index.html          Portada de cada curso (lista de módulos generada sola)
curso-N/modulo-M.html       Cada módulo
assets/css/style.css        Todo el diseño (modo claro y oscuro)
assets/js/curriculum.js     ÚNICA fuente de verdad del temario (menú, índices, anterior/siguiente)
assets/js/app.js            Menú lateral, índice del módulo, azulejos, progreso, bloques de código, cuestionarios
assets/js/lab.js            Mini-framework de las animaciones interactivas
assets/js/demos/cursoN/*.js Animaciones de un curso concreto
assets/js/demos/comun/*.js  Animaciones que se reutilizan en varios cursos
assets/fonts, assets/vendor Tipografías y KaTeX en local (la web no pide nada a internet)
tools/check_site.py         Comprobador
docs/                       Esta guía y la plantilla
```

Todas las rutas son **relativas**, así que la web funciona igual en `usuario.github.io/repo/` que en local.

---

## 2. Añadir un curso nuevo (pasos exactos)

1. **`assets/js/curriculum.js`**: añade un objeto en `courses` con `id`, `slug` (`curso-N`), `title`, `short`, `blurb` y `modules` (cada módulo con `n`, `slug` (`modulo-M`), `title`, `summary` y `tags`). Cambia `upcoming.from` al siguiente curso pendiente.
2. Crea la carpeta `curso-N/`.
3. Copia `curso-3/index.html` a `curso-N/index.html` y cambia: el `<title>`, la descripción, `data-course="N"`, el texto del hero, las dos tarjetas y `data-course` del `div data-render="module-list"`.
4. Copia `docs/plantilla-modulo.html` a `curso-N/modulo-M.html` (uno por módulo) y cambia `data-course` y `data-module` en el `<body>`.
5. Rellena los módulos (ver sección 3).
6. Ejecuta `python3 tools/check_site.py curso-N/modulo-M.html` hasta que no haya fallos.

La barra lateral, la portada, el muro de azulejos, la numeración de secciones, el botón «Marcar como hecho» y la navegación «anterior / siguiente» se generan solos a partir de `curriculum.js`. No hay que tocar nada más.

---

## 3. Anatomía de un módulo

```html
<body data-root="../" data-course="N" data-module="M">
<main><div class="page">
  <header class="hero"> … eyebrow, h1, lead, hero-tile, goals … </header>
  <section> <h2 id="…">…</h2> … </section>      <!-- tantas como haga falta -->
  <section id="codigo"> <h2>Código del módulo</h2> … <article class="snippet"> … </section>
  <section> <h2 id="quiz">Comprueba lo aprendido</h2> <div class="quiz">…</div> </section>
  <section class="resumen"> <h2 class="sin-num sin-toc">Resumen del módulo</h2> … </section>
</div></main>
```

Reglas del contrato (el JavaScript depende de ellas):

- En el `<head>` va el script anti-parpadeo del tema, `style.css`, `curriculum.js`, `lab.js` y `app.js` con `defer` (copia la plantilla).
- Cada `<h2>` de sección lleva `id` y se numera solo («M.1», «M.2»…). Añade `class="sin-num"` o `class="sin-toc"` para que no se numere o no salga en el índice. Los `h2` dentro de `.resumen`, `.quiz`, `.demo` y `.callout` se ignoran.
- Dentro de una sección usa `<h3>` para subapartados.
- La barra de «Hecho / anterior / siguiente» del final la añade `app.js`. No la escribas a mano; el último párrafo del resumen puede enlazar al módulo siguiente.

---

## 4. Catálogo de componentes

### 4.1 Texto, términos y fórmulas

```html
<p class="pregunta">Una pregunta que abre el tema y que el lector se hace de verdad.</p>
<abbr class="t" data-def="Definición corta que sale al pasar el ratón o tocar.">término</abbr>
<code>x_train</code>  <kbd>Ctrl</kbd>  <strong>…</strong>  <em>…</em>
<div class="formula">\[ z = \frac{x - \mu}{\sigma} \]</div>     <!-- fórmula en bloque -->
… la media \( \mu \) …                                            <!-- fórmula en línea -->
```

KaTeX se carga solo si hay fórmulas. **No uses `$…$`.** Después de cada fórmula, explica con palabras qué significa cada letra.

### 4.2 Cajas (callouts)

```html
<div class="callout regla">    <span class="lbl">Regla fácil</span>  <p>…</p> </div>   <!-- idea para recordar -->
<div class="callout recuerda"> <span class="lbl">Recuerda</span>     <p>…</p> </div>   <!-- repaso de algo anterior -->
<div class="callout analogia"> <span class="lbl">Analogía</span>     <p>…</p> </div>   <!-- comparación cotidiana -->
<div class="callout ojo">      <span class="lbl">Ojo</span>          <p>…</p> </div>   <!-- error típico, trampa -->
<div class="callout ejemplo">  <span class="lbl">Ejemplo numérico</span> … </div>
```

El ejemplo numérico admite tablas, `<ol class="pasos"><li>…</li></ol>` (pasos numerados) y `<td class="res">` para destacar el resultado. Mira el ejemplo del umbral en `curso-1/modulo-1.html`.

### 4.3 Esquemas

```html
<!-- Cadena de cajas; las clases a / b / c / d cambian el color; .vertical la pone en columna -->
<ul class="flow">
  <li class="a">DATOS<small>días sin entrar = 25</small></li>
  <li class="b">MODELO<small>reglas aprendidas</small></li>
  <li class="c">RESULTADO<small>«va a cancelar»</small></li>
</ul>

<!-- Tarjetas en rejilla -->
<div class="cards"><div class="card"><h4>Título</h4><p>…</p></div> …</div>

<!-- Diagrama de texto (se ve en monoespaciada) -->
<pre class="ascii">SI … →  …</pre>

<!-- Figura SVG con pie. Clases de relleno: fill-a, fill-b, fill-c, fill-d. Texto: muted, mono -->
<figure class="figura">
  <svg viewBox="0 0 640 300" role="img" aria-label="Descripción para lectores de pantalla">…</svg>
  <figcaption>…</figcaption>
</figure>
```

Los colores van por clases (no pongas colores a mano) para que funcionen en modo oscuro.

### 4.4 Tablas

Tablas normales de HTML (`<table>`, con `<thead>` si tienen cabecera). En filas de cabecera usa `<th scope="row">`.

---

## 5. Animaciones interactivas («Experimentos»)

En el HTML:

```html
<figure class="demo" data-demo="curso1/nombre-de-la-demo" data-titulo="Título del experimento">
  <div class="haz">Qué debe hacer el lector.</div>
  <div class="observa">En qué debe fijarse y qué debe concluir.</div>
</figure>
```

La web pone la cabecera «Experimento N», el botón «Reiniciar», «Haz esto» y «Fíjate en». Se cargan **solo cuando la demo se acerca a la pantalla**.

En `assets/js/demos/curso1/nombre-de-la-demo.js`:

```js
Lab.register("curso1/nombre-de-la-demo", function (root, api) {
  var view = api.view(root, { aspect: 1.7, minH: 240, drag: true, label: "Descripción accesible del gráfico" });
  var ui   = api.controls(root);
  var out  = api.readout(root);

  var s = ui.slider({ label: "Parámetro", min: 0, max: 10, step: 0.1, value: 3,
                      fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { update(); } });

  function draw(ctx, w, h, C) {          // C = colores del tema (claro/oscuro automáticamente)
    api.d.circle(ctx, w / 2, h / 2, 20, C.terracota);
  }
  function update() { view.redraw(); out.set("valor = <b>" + s.get().toFixed(1) + "</b>"); }

  view.draw(draw); update();
  // return { destroy: function () { loop.stop(); } };   // solo si usas api.loop
});
```

Qué ofrece `api`:

| Cosa | Para qué |
|---|---|
| `api.view(parent,{aspect,minH,maxH,drag,label})` | Canvas nítido y adaptable. Métodos: `.draw(fn)`, `.redraw()`, `.pointer({down,drag,move,up})`, `.label(t)`; propiedades `.w`, `.h`. Usa `drag:true` solo si el usuario arrastra dentro del canvas. |
| `api.plot(view,{xr,yr,pad,xticks,yticks,xlabel,ylabel,xfmt,yfmt,grid})` | Ejes y conversión datos↔píxeles: `p.x(v)`, `p.y(v)`, `p.ix(px)`, `p.iy(py)`, `p.inside(px,py)`, `p.clip(ctx)`, `p.axes(ctx)`, `p.box`. |
| `api.controls(parent)` | `.slider({label,min,max,step,value,fmt,onInput})` → `{get,set(v,silent),input}`; `.select({label,options:[[valor,texto]],value,onChange})`; `.segmented(...)`; `.toggle(...)`; `.button(texto,fn,'primary'\|'warm')`. |
| `api.readout(parent)` | Cuadro de texto en vivo: `.set(html)`. Usa `<b>` y `<span class='good'>` / `<span class='bad'>`. |
| `api.legend(parent,[[color,texto],…])` | Leyenda de colores. |
| `api.table(parent,[cabeceras])` | Tabla: `.set(filas)`. |
| `api.loop(fn,{fps})` | Animación. `fn(dt)` devuelve `false` para parar. Se pausa sola fuera de pantalla. Devuelve `{start, stop}`. Si la demo usa `loop`, devuelve `{destroy}`. |
| `api.rng(semilla)` | Aleatorios reproducibles: `.next() .range(a,b) .int(a,b) .normal(mu,sigma) .pick(arr) .shuffle(arr)`. **Usa siempre semilla** para que todos vean lo mismo. |
| `api.math` | `sum mean std median clamp lerp linspace sigmoid relu tanh softmax dot dist solve polyfit polyval linreg mse` |
| `api.d` | Dibujo: `line circle rect text arrow path` (ver firma en `lab.js`). |
| `api.colors()` | Colores del tema: `ink ink2 muted line paper surface cobalto cobaltoInk cobaltoWash terracota terracotaInk terracotaWash oliva olivaInk olivaWash marker`. **No escribas colores a mano.** |
| `api.reduceMotion` | `true` si el usuario pidió menos animación: en ese caso salta directamente al resultado final. |

Qué hace una buena demo:

1. **Una sola idea** por experimento, la misma que acaba de explicarse en el texto.
2. El lector **mueve algo y ve la consecuencia al instante** (slider, arrastrar un punto, botón «paso a paso»).
3. Un cuadro de lectura con **los números** que cambian, para conectar gráfico y fórmula.
4. Texto «Haz esto» con una instrucción concreta y «Fíjate en» con la conclusión.
5. Funciona a **375 px de ancho** (móvil), en modo claro y oscuro, y se entiende sin leer el código.
6. Nada de librerías externas: solo `lab.js`. Ningún acceso a internet.
7. Etiquetas de texto que **no se pisan** entre sí ni con los puntos (revisa con capturas).

Cuando una demo sirva para varios cursos, ponla en `assets/js/demos/comun/`.

---

## 6. Bloques de código («Código del módulo»)

**Al final de cada módulo** hay una sección «Código del módulo» con los fragmentos que se usan en el curso: qué hacen, para qué sirven y cómo se usan. Cada fragmento es un `article.snippet`:

```html
<article class="snippet" data-lang="python">
  <header>
    <h3>1 · Título del fragmento</h3>
    <p class="para-que"><strong>Para qué sirve</strong> Una o dos frases, sin tecnicismos no explicados.</p>
  </header>
  <pre class="code"><code>import numpy as np        # el código, con &lt; &gt; &amp; escapados
x = np.array([1, 2, 3])
print(x.mean())</code></pre>
  <details class="linea-a-linea" open>
    <summary>Línea por línea</summary>
    <p class="hint">Pasa el ratón por una fila para ver sus líneas resaltadas en el código.</p>
    <table class="lineas">
      <thead><tr><th>Código</th><th>Qué hace</th></tr></thead>
      <tbody>
        <tr data-lines="1"><td><code>import numpy as np</code></td><td>Explicación en lenguaje llano.</td></tr>
        <tr data-lines="2"><td><code>x = np.array([1, 2, 3])</code></td><td>…</td></tr>
        <tr data-lines="3"><td><code>print(x.mean())</code></td><td>…</td></tr>
      </tbody>
    </table>
  </details>
  <div class="salida">
    <strong>Salida esperada</strong>
    <pre>2.0</pre>
    <p>Qué significa esa salida y por qué es esa y no otra.</p>
  </div>
</article>
```

Reglas (el comprobador las verifica):

- **Cada línea no vacía del código debe estar cubierta** por una fila `data-lines="3"` o `data-lines="3-7"` (numeración desde 1, contando las líneas en blanco).
- Debe haber «Para qué sirve» y «Salida esperada».
- Dentro de `<code>` escapa `<`, `>` y `&` (`&lt; &gt; &amp;`).
- Resaltado y botón «Copiar» los pone `app.js`. Para otros lenguajes usa `data-lang="bash"` o `data-lang="text"`.
- **El código tiene que haberse ejecutado de verdad** y la salida pegada debe ser la real (con los mismos números). Si el código depende de aleatoriedad o de una descarga, fija las semillas o muestra una salida que sepas que es real, y avisa en la salida si varía.
- Si un fragmento usa variables de otro anterior, dilo en la introducción de la sección.
- Cada fragmento enseña **cómo se usa** (con una llamada real y un resultado visible), no solo la definición.
- Explica los términos de la línea que sean nuevos (qué es `fit`, qué es un `epoch`, qué significa `axis=1`…).

---

## 7. Cuestionario final

```html
<div class="quiz">
<script type="application/json" class="quiz-data">
{"titulo":"Cuestionario del módulo N",
 "preguntas":[
  {"q":"Enunciado (se admite <code>HTML</code>).",
   "opciones":["A","B","C","D"],
   "correcta":1,
   "porque":"Por qué esa es la correcta y por qué las demás no."}
 ]}
</script>
</div>
```

- **8–10 preguntas**, mezclando concepto, cálculo a mano y lectura de código.
- El JSON tiene que ser válido (comillas dobles; `\"` dentro de textos). `correcta` es el índice (empieza en 0).
- Reparte la posición de la respuesta correcta; que no sea siempre la misma.
- `porque` explica el razonamiento, no solo repite la opción.

---

## 8. Cómo debe estar escrito el contenido (criterio de calidad)

Esta web es **el profesor particular de David**. El lector parte de cero y quiere entender **cómo y por qué** funcionan las cosas, no memorizar definiciones.

1. **Desde cero.** Ningún término sin explicar la primera vez que aparece (usa `abbr.t` para definiciones cortas y un párrafo para las importantes).
2. **Primero la intuición, después la fórmula.** Orden recomendado: pregunta o problema real → analogía cotidiana → ejemplo con números pequeños resuelto a mano → fórmula o definición → animación → código.
3. **Cada fórmula con un ejemplo numérico** completo (paso a paso, cuentas visibles).
4. **El porqué.** No solo «se usa ReLU», sino «por qué se usa ReLU y qué pasaría con otra cosa».
5. **Errores típicos** en cajas «Ojo» (los de verdad: fugas de datos, olvidar escalar, confundir `predict` con `predict_proba`…).
6. **Nada de relleno.** No resúmenes de una línea ni listas de palabras sueltas: párrafos que expliquen. Pero tampoco muros de texto: usa esquemas, tablas y cajas para respirar.
7. **Todo el contenido del curso, sin dejarse nada.** Si en el temario aparece un concepto, una técnica, una función o un error documentado, tiene su explicación.
8. Español claro, tuteo, sin jerga innecesaria. Los términos en inglés se escriben tal cual (*overfitting*, *batch*) la primera vez con su significado.
9. **Honestidad técnica.** Si un detalle depende de la versión (Keras 3, TensorFlow 2.x), dilo. No inventes resultados: se calculan.
10. Cada módulo termina con: Código del módulo → Cuestionario → Resumen.

---

## 9. Comprobador automático

```bash
python3 tools/check_site.py                                  # todas las páginas
python3 tools/check_site.py curso-1/modulo-2.html            # solo una
python3 tools/check_site.py --shots /ruta/capturas curso-1/modulo-2.html   # + capturas de demos, código y móvil
```

Comprueba por página: errores de consola y recursos que no cargan, demos que no se montan o salen vacías, cobertura línea por línea del código, «Para qué sirve» y «Salida esperada», cuestionarios con preguntas, enlaces y anclas internas, y que no haya scroll horizontal a 375 px.

Mientras se escribe un curso, los enlaces a módulos que todavía no existen salen como «ENLACE roto»; es normal y desaparece al crearlos.

Las capturas sirven para **mirar** el resultado: el comprobador no sabe si una etiqueta pisa a otra.

---

## 10. Publicar en GitHub Pages

1. Sube la carpeta del proyecto a un repositorio (el contenido, con `index.html` en la raíz).
2. En GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, rama `main`, carpeta `/ (root)`.
3. Espera un minuto: la web queda en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.
4. El archivo `.nojekyll` de la raíz evita que GitHub procese la web con Jekyll.

Para probarla en local: `python3 -m http.server 8000` dentro de la carpeta y abre `http://localhost:8000`. (Abrir los `.html` con doble clic casi funciona, pero las animaciones cargan scripts y es más fiable usar el servidor.)
