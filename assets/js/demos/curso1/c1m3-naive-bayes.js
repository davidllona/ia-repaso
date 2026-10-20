/* Experimento: Naive Bayes de spam calculado en vivo con un corpus de 10 correos. */
Lab.register("curso1/c1m3-naive-bayes", function (root, api) {
  var D = api.d;
  var SPAM = ["gratis oferta ahora", "oferta gratis premio", "premio ahora gratis", "oferta ahora hola"];
  var HAM = ["hola reunión mañana", "informe reunión mañana", "hola informe", "reunión ahora", "hola mañana", "gratis informe"];
  var VOCAB = ["ahora", "gratis", "hola", "informe", "mañana", "oferta", "premio", "reunión"];
  var cs = {}, ch = {}, totS = 0, totH = 0, alpha = 1, on = {}, toggles = {};
  VOCAB.forEach(function (w) { cs[w] = 0; ch[w] = 0; on[w] = false; });
  SPAM.forEach(function (m) { m.split(" ").forEach(function (w) { cs[w]++; totS++; }); });
  HAM.forEach(function (m) { m.split(" ").forEach(function (w) { ch[w]++; totH++; }); });
  var PS = SPAM.length / (SPAM.length + HAM.length), PH = 1 - PS, V = VOCAB.length;

  var view = api.view(root, { aspect: 5, minH: 84, maxH: 120, label: "Probabilidad final de spam y de no spam para el mensaje elegido" });
  var ui = api.controls(root), tbl = api.table(root, ["Factor", "P(· | spam)", "P(· | ham)"]), out = api.readout(root);
  ui.select({ label: "Mensaje de ejemplo", value: "gratis reunión", options: [["gratis reunión", "gratis reunión"], ["oferta informe", "oferta informe"], ["gratis oferta premio", "gratis oferta premio"], ["hola reunión", "hola reunión"], ["", "(vacío: tú eliges)"]],
    onChange: function (v) { VOCAB.forEach(function (w) { on[w] = false; }); v.split(" ").forEach(function (w) { if (w) on[w] = true; }); sync(); update(); } });
  ui.slider({ label: "Suavizado de Laplace (α)", min: 0, max: 3, step: 0.5, value: alpha, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { alpha = v; update(); } });
  VOCAB.forEach(function (w) { toggles[w] = ui.toggle({ label: w, value: on[w], onChange: function (v) { on[w] = v; update(); } }); });
  function sync() { VOCAB.forEach(function (w) { toggles[w].set(on[w]); }); }

  function pw(counts, tot, w) { return (counts[w] + alpha) / (tot + alpha * V); }
  function fmt(x) { return x === 0 ? "0" : (x < 0.0001 ? x.toExponential(2) : x.toFixed(4)); }
  function calc() {
    var ws = VOCAB.filter(function (w) { return on[w]; }), s = PS, h = PH, rows = [["Prior: P(clase) = 4/10 y 6/10", PS.toFixed(4), PH.toFixed(4)]];
    ws.forEach(function (w) {
      var a = pw(cs, totS, w), b = pw(ch, totH, w); s *= a; h *= b;
      rows.push(["«" + w + "»: (" + cs[w] + (alpha ? "+" + alpha : "") + ")/(" + totS + (alpha ? "+" + alpha + "·8" : "") + ") · (" + ch[w] + (alpha ? "+" + alpha : "") + ")/(" + totH + (alpha ? "+" + alpha + "·8" : "") + ")", a.toFixed(4), b.toFixed(4)]);
    });
    rows.push(["<b>Producto (puntuación sin normalizar)</b>", "<b>" + fmt(s) + "</b>", "<b>" + fmt(h) + "</b>"]);
    return { ws: ws, s: s, h: h, rows: rows, post: (s + h) > 0 ? s / (s + h) : null };
  }
  function draw(ctx, w, h, C) {
    var r = calc(), x0 = 14, bw = w - 28, by = h / 2 - 15, bh = 30;
    D.rect(ctx, x0, by, bw, bh, C.paper2, C.ink, 1.5);
    if (r.post === null) { D.text(ctx, "0 / 0: sin suavizado el modelo no puede decidir", w / 2, by + 20, { size: 13, align: "center", color: C.terracotaInk, weight: 600 }); return; }
    var ws = bw * r.post;
    D.rect(ctx, x0, by, ws, bh, C.terracota); D.rect(ctx, x0 + ws, by, bw - ws, bh, C.cobalto); D.rect(ctx, x0, by, bw, bh, null, C.ink, 1.5);
    D.text(ctx, "spam " + (r.post * 100).toFixed(1) + " %", x0, by - 8, { size: 12, color: C.terracotaInk, weight: 600 });
    D.text(ctx, "no spam " + ((1 - r.post) * 100).toFixed(1) + " %", x0 + bw, by - 8, { size: 12, color: C.cobaltoInk, weight: 600, align: "right" });
    D.line(ctx, x0 + bw / 2, by - 3, x0 + bw / 2, by + bh + 3, C.ink, 1.5);
    D.text(ctx, "50 %", x0 + bw / 2, by + bh + 16, { size: 11, color: C.muted, align: "center" });
  }
  function update() {
    var r = calc(); tbl.set(r.rows); view.redraw();
    var msg = r.ws.length ? "«" + r.ws.join(" ") + "»" : "(mensaje vacío)";
    var txt = "Mensaje: <b>" + msg + "</b> · α = <b>" + alpha.toFixed(1) + "</b><br>";
    if (r.post === null) txt += "<span class='bad'>Las dos puntuaciones valen 0: una palabra nunca vista en spam anula la clase spam, y otra nunca vista en ham anula la clase ham. Sube α por encima de 0.</span>";
    else txt += "P(spam | mensaje) = " + fmt(r.s) + " / (" + fmt(r.s) + " + " + fmt(r.h) + ") = <b>" + (r.post * 100).toFixed(1) + " %</b> → " + (r.post > 0.5 ? "<span class='bad'>se clasifica como spam</span>" : "<span class='good'>se clasifica como no spam</span>") +
      (alpha === 0 && (r.s === 0 || r.h === 0) ? "<br>Con α = 0 una sola palabra desconocida deja una clase en 0 y la decisión es absoluta (100 % / 0 %) con muy poca evidencia." : "");
    out.set(txt);
  }
  VOCAB.forEach(function (w) { on[w] = false; }); on["gratis"] = true; on["reunión"] = true; sync();
  view.draw(draw); update();
});
