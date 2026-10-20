/* Experimento: ¿qué API necesito? El lector marca los requisitos de su arquitectura y el experimento calcula
   qué API de Keras (Sequential, funcional, subclassing) puede expresarla y con qué pegas. */
Lab.register("curso3/c3m1-tres-apis", function (root, api) {
  var el = api.el;
  var REQ = [
    ["rama", "Ramas o atajos (Add, Concatenate)"],
    ["multin", "Varias entradas (p. ej. imagen + datos de tabla)"],
    ["multout", "Varias salidas (p. ej. clase + valor)"],
    ["share", "Una misma capa usada en dos sitios (pesos compartidos)"],
    ["dyn", "Un if / while de Python que depende de los datos dentro del modelo"],
    ["intro", "Quiero summary() con conexiones, plot_model y sacar capas intermedias"]
  ];
  var on = {};
  var ui = api.controls(root);
  REQ.forEach(function (r) { ui.toggle({ label: r[1], value: false, onChange: function (v) { on[r[0]] = v; update(); } }); });
  ui.button("Limpiar", function () { REQ.forEach(function (r) { on[r[0]] = false; }); root.querySelectorAll(".lab-btns .btn[aria-pressed]").forEach(function (b) { b.setAttribute("aria-pressed", "false"); }); update(); }, "warm");
  var box = el("div", { style: { display: "grid", gap: ".8rem", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,230px),1fr))", marginTop: ".8rem" } });
  root.appendChild(box);
  var out = api.readout(root);
  var code = el("pre", { class: "ascii", style: { margin: ".8rem 0 0", fontSize: ".78rem" } });
  root.appendChild(code);

  function verdict() {
    var seq = [], fun = [], sub = [], v = {};
    var badSeq = [];
    if (on.rama) badSeq.push("no admite ramas ni atajos: cada capa solo recibe la salida de la anterior");
    if (on.multin) badSeq.push("solo tiene una entrada");
    if (on.multout) badSeq.push("solo tiene una salida");
    if (on.share) badSeq.push("no puede reutilizar una misma capa en dos puntos del modelo");
    if (on.dyn) badSeq.push("no admite lógica de Python que dependa de los datos");
    v.seq = badSeq.length ? { s: "no", t: badSeq } : { s: "ok", t: ["Una pila lineal: es la forma más corta de escribirlo."] };
    if (on.dyn) v.fun = { s: "no", t: ["El grafo se construye una sola vez con tensores simbólicos: no puede decidir con un if de Python según los datos."] };
    else v.fun = { s: "ok", t: ["Es un grafo de capas: admite ramas, atajos, varias entradas y salidas y capas compartidas.", on.intro ? "Además summary() muestra «Connected to», plot_model dibuja el grafo y get_layer(...).output permite extraer capas." : "Además se puede inspeccionar el grafo."] };
    var sp = [];
    if (on.intro) sp.push("pierdes la inspección: summary() muestra «?» hasta que lo llamas con datos, sin conexiones, y no hay plot_model ni capas intermedias fáciles");
    if (!on.dyn) sp.push("escribes más código del necesario y los errores de forma salen en ejecución, no al construir");
    v.sub = on.dyn ? { s: sp.length ? "meh" : "ok", t: ["Es la única que deja usar Python completo dentro de call()."].concat(sp) } : { s: "meh", t: ["Puede expresarlo todo, pero:"].concat(sp.length ? sp : ["es más código que las otras dos."]) };
    var best = on.dyn ? "sub" : (on.rama || on.multin || on.multout || on.share || on.intro) ? "fun" : "seq";
    return { v: v, best: best };
  }
  var NAMES = { seq: "Sequential", fun: "API funcional", sub: "Subclassing" };
  var MARK = { ok: "✓ Sirve", meh: "~ Sirve, con peros", no: "✗ No puede" };
  var COL = { ok: "var(--oliva-wash)", meh: "var(--marker-wash)", no: "var(--terracota-wash)" };
  var BORDER = { ok: "var(--oliva)", meh: "var(--marker)", no: "var(--terracota)" };
  var CODE = {
    seq: "model = keras.Sequential([\n    keras.Input(shape=(n,)),\n    layers.Dense(32, activation=\"relu\"),\n    layers.Dense(1),\n])",
    fun: "x = keras.Input(shape=(n,))\nh = layers.Dense(32, activation=\"relu\")(x)\nh = layers.Add()([h, layers.Dense(32)(h)])   # atajo\ny = layers.Dense(1)(h)\nmodel = keras.Model(x, y)",
    sub: "class MiModelo(keras.Model):\n    def __init__(self):\n        super().__init__()\n        self.d = layers.Dense(32, activation=\"relu\")\n        self.out = layers.Dense(1)\n    def call(self, x, training=False):\n        h = self.d(x)\n        # aquí cabe cualquier Python: if, for, while...\n        return self.out(h)"
  };
  function update() {
    var R = verdict();
    box.innerHTML = "";
    ["seq", "fun", "sub"].forEach(function (k) {
      var v = R.v[k], best = R.best === k;
      var card = el("div", { style: { border: "2px solid " + (best ? "var(--ink)" : BORDER[v.s]), background: COL[v.s], padding: ".7rem .8rem", boxShadow: best ? "4px 4px 0 var(--cobalto)" : "none" } });
      card.appendChild(el("div", { style: { fontWeight: 700, fontSize: ".98rem" }, text: NAMES[k] + (best ? "  ★ recomendada" : "") }));
      card.appendChild(el("div", { style: { fontFamily: "var(--font-mono)", fontSize: ".8rem", margin: ".15rem 0 .4rem", fontWeight: 600 }, text: MARK[v.s] }));
      var ul = el("ul", { style: { margin: 0, paddingLeft: "1.1rem", fontSize: ".83rem", lineHeight: 1.4 } });
      v.t.forEach(function (t) { ul.appendChild(el("li", { text: t })); });
      card.appendChild(ul); box.appendChild(card);
    });
    var any = REQ.some(function (r) { return on[r[0]]; });
    out.set(any ? "Con esos requisitos la opción más sencilla que funciona es <b>" + NAMES[R.best] + "</b>." : "Sin requisitos especiales basta <b>Sequential</b>. Marca casillas para ver cómo cambia el veredicto.");
    code.textContent = "# esqueleto de la opción recomendada: " + NAMES[R.best] + "\n" + CODE[R.best];
  }
  update();
});
