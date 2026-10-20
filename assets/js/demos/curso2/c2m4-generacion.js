/* Experimento: generar texto token a token. MODELO JUGUETE: no es un Transformer, es una tabla de conteos (n-gramas) de un corpus
   de 30 frases propias. Lo que sí es real es el final del proceso: logits -> temperatura -> top-k -> top-p -> muestreo. */
Lab.register("curso2/c2m4-generacion", function (root, api) {
  var D = api.d, C0 = api.colors();
  var CORPUS = [
    "el gato duerme en el sofá .", "el gato bebe leche en la cocina .", "el perro duerme en el jardín .", "el perro corre por el parque .",
    "el perro come carne en la cocina .", "la niña lee un libro en el sofá .", "la niña corre por el parque .", "el gato corre por el jardín .",
    "la luna brilla sobre el mar .", "el sol brilla sobre el parque .", "el gato mira la luna .", "el perro mira al gato .",
    "el gato mira al perro .", "la niña bebe leche en la cocina .", "el niño come pan en el jardín .", "el niño lee un libro en la cocina .",
    "el perro bebe agua en el jardín .", "el gato come pescado en la cocina .", "la niña mira el mar .", "el sol brilla sobre el jardín .",
    "el niño corre por el jardín .", "el gato duerme en la cocina .", "la niña duerme en el sofá .", "el perro mira la luna .",
    "el niño bebe agua en la cocina .", "la luna brilla sobre el jardín .", "el gato corre por el parque .", "la niña come pan en el jardín .",
    "el niño mira el mar .", "el perro duerme en el sofá ."
  ];
  var S = { order: 1, T: 1, k: 15, p: 1, ctx: ["el"], text: [], last: null, seed: 3 };
  var rng = api.rng(S.seed);
  var uni = {}, bi = {}, tri = {};
  CORPUS.forEach(function (s) {
    var w = s.split(" ");
    w.forEach(function (t, i) {
      if (i > 0) { (bi[w[i - 1]] = bi[w[i - 1]] || {})[t] = ((bi[w[i - 1]] || {})[t] || 0) + 1; }
      if (i > 1) { var key = w[i - 2] + " " + w[i - 1]; (tri[key] = tri[key] || {})[t] = (tri[key][t] || 0) + 1; }
      uni[t] = (uni[t] || 0) + 1;
    });
  });
  function n(v, k) { return v.toFixed(k === undefined ? 3 : k).replace(".", ",").replace("-", "−"); }

  function counts() {
    var c = S.ctx, key;
    if (S.order === 2 && c.length >= 2) { key = c[c.length - 2] + " " + c[c.length - 1]; if (tri[key]) return { c: tri[key], via: "«" + key + "»" }; }
    key = c[c.length - 1];
    return { c: bi[key] || {}, via: "«" + key + "»" };
  }
  var R;
  function compute() {
    var base = counts(), toks = Object.keys(base.c), tot = 0;
    toks.forEach(function (t) { tot += base.c[t]; });
    var items = toks.map(function (t) { var p = base.c[t] / tot; return { t: t, n: base.c[t], p0: p, logit: Math.log(p) }; });
    items.sort(function (a, b) { return b.p0 - a.p0 || (a.t < b.t ? -1 : 1); });
    // temperatura
    var m = Math.max.apply(null, items.map(function (o) { return o.logit; })), z = 0;
    items.forEach(function (o) { o.e = Math.exp((o.logit - m) / S.T); z += o.e; });
    items.forEach(function (o) { o.p1 = o.e / z; o.keep = true; });
    // top-k
    items.forEach(function (o, i) { if (i >= S.k) o.keep = false; });
    // top-p (sobre lo que queda de top-k, ya ordenado por p1)
    var kept = items.filter(function (o) { return o.keep; }), ksum = 0;
    kept.forEach(function (o) { ksum += o.p1; });
    var acc = 0, cut = false;
    kept.forEach(function (o) { if (cut) { o.keep = false; return; } acc += o.p1 / ksum; if (acc >= S.p - 1e-9) cut = true; });
    var fin = 0; items.forEach(function (o) { if (o.keep) fin += o.p1; });
    items.forEach(function (o) { o.p2 = o.keep ? o.p1 / fin : 0; });
    var H = 0; items.forEach(function (o) { if (o.p2 > 0) H -= o.p2 * Math.log2(o.p2); });
    R = { items: items, via: base.via, H: H, nkeep: items.filter(function (o) { return o.keep; }).length };
  }

  var view = api.view(root, { aspect: 2.3, minH: 270, maxH: 310, label: "Probabilidad de cada palabra candidata para el siguiente token, antes y después de aplicar temperatura, top-k y top-p" });
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.72rem, 2.7vw, .84rem)";
  ui.select({ label: "Empezar con…", value: "el", options: [["el", "el"], ["el gato", "el gato"], ["el perro", "el perro"], ["la niña", "la niña"], ["la luna", "la luna"]], onChange: function (v) { reset(v); } });
  ui.segmented({ label: "Contexto que mira el modelo", value: 1, options: [[1, "1 palabra"], [2, "2 palabras"]], onChange: function (v) { S.order = v; update(); } });
  ui.slider({ label: "Temperatura T", min: 0.1, max: 3, step: 0.05, value: S.T, fmt: function (v) { return n(v, 2); }, onInput: function (v) { S.T = v; update(); } });
  ui.slider({ label: "top-k (cuántas candidatas se quedan)", min: 1, max: 15, step: 1, value: S.k, fmt: function (v) { return v >= 15 ? "todas" : v; }, onInput: function (v) { S.k = v; update(); } });
  ui.slider({ label: "top-p (masa de probabilidad que se queda)", min: 0.1, max: 1, step: 0.05, value: S.p, fmt: function (v) { return v >= 1 ? "100 %" : Math.round(v * 100) + " %"; }, onInput: function (v) { S.p = v; update(); } });
  ui.button("Generar la siguiente palabra", function () { step(); }, "primary");
  ui.button("Generar hasta el punto", function () { var g = 0; while (S.ctx[S.ctx.length - 1] !== "." && g++ < 14) step(true); update(); });
  ui.button("Borrar y volver a empezar", function () { reset(S.start || "el"); });
  S.start = "el";
  api.legend(root, [[C0.line, "probabilidad original del corpus (T = 1)"], [C0.cobalto, "probabilidad final con tus ajustes"], [C0.muted, "candidata descartada"]]);

  function reset(v) { S.start = v; S.ctx = v.split(" "); S.last = null; update(); }
  function step(quiet) {
    if (S.ctx[S.ctx.length - 1] === ".") return;       // la frase ya terminó
    compute();
    var u = rng.next(), acc = 0, pick = R.items[0], i;
    for (i = 0; i < R.items.length; i++) { acc += R.items[i].p2; if (u < acc) { pick = R.items[i]; break; } }
    if (pick.p2 === 0) pick = R.items.filter(function (o) { return o.keep; })[0] || R.items[0];
    S.last = { t: pick.t, p: pick.p2 }; S.ctx.push(pick.t);
    if (!quiet) update();
  }

  function draw(ctx, w, h, C) {
    var items = R.items.slice(0, 9), rowH = Math.min(26, (h - 36) / Math.max(items.length, 1)), L = 62, Rr = 64, bw = w - L - Rr - 8, i;
    D.text(ctx, "Siguiente palabra tras " + R.via + " (" + R.items.length + " candidatas en el corpus)", 8, 15, { size: 11.5, color: C.ink2, weight: 500 });
    items.forEach(function (o, k) {
      var y = 28 + k * rowH;
      D.text(ctx, o.t, L - 8, y + rowH * 0.62, { size: 12, align: "right", weight: o.keep ? 600 : 400, color: o.keep ? C.ink : C.muted });
      D.rect(ctx, L, y + 3, bw * o.p0, rowH - 6, C.line);
      if (o.keep) D.rect(ctx, L, y + rowH * 0.28, bw * o.p2, rowH * 0.44, C.cobalto);
      else D.text(ctx, "descartada", L + bw * Math.max(o.p0, 0.02) + 6, y + rowH * 0.62, { size: 10.5, color: C.muted });
      D.text(ctx, o.keep ? n(o.p2 * 100, 1) + " %" : n(o.p1 * 100, 1) + " %", w - 6, y + rowH * 0.62, { size: 11, mono: true, align: "right", color: o.keep ? C.cobaltoInk : C.muted });
      if (S.last && S.ctx.length > 1 && o.t === S.last.t) D.rect(ctx, 4, y + 1, w - 8, rowH - 2, null, C.terracota, 2);
    });
    if (R.items.length > 9) D.text(ctx, "… y " + (R.items.length - 9) + " candidatas más (menos probables)", 8, h - 6, { size: 10.5, color: C.muted });
  }
  compute();
  view.draw(draw);

  function update() {
    compute(); view.redraw();
    var txt = S.ctx.join(" ");
    out.set("Texto: <b>" + txt + "</b>" + (S.ctx[S.ctx.length - 1] === "." ? " <span class='good'>(fin de frase)</span>" : "") + "<br>" +
      "Candidatas: " + R.items.length + " → se quedan <b>" + R.nkeep + "</b> · entropía de la distribución final: <b>" + n(R.H, 2) + "</b> bits" +
      (S.last ? "<br>Última elegida: «<b>" + S.last.t + "</b>» (probabilidad " + n(S.last.p * 100, 1) + " %)" : "") +
      (R.nkeep === 1 ? "<br><span class='bad'>Una sola candidata: es decodificación voraz (greedy), siempre sale lo mismo.</span>" : S.T > 2 ? "<br><span class='bad'>T alta: las poco probables ganan peso.</span>" : ""));
  }
  update();
});
