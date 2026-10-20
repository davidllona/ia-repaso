/* Experimento: softmax en vivo con 4 clases. Se ve la cadena z → z + c → e^(z+c) → p y se comprueba que sumar la
   misma constante c a todos los logits NO cambia las probabilidades (solo importan las diferencias). */
Lab.register("curso4/c4m5-softmax-vivo", function (root, api) {
  var D = api.d, M = api.math, K = 4, NAMES = ["acción", "comedia", "terror", "animación"];
  var S = { z: [3, 1, -1, 0], c: 0 };
  var view = api.view(root, { aspect: 3.2, minH: 140, maxH: 190, label: "Barras de probabilidad de los cuatro géneros: acción, comedia, terror y animación" });
  var ui = api.controls(root);
  var sl = [0, 1, 2, 3].map(function (k) {
    return ui.slider({ label: "logit z" + k + " (" + NAMES[k] + ")", min: -6, max: 6, step: 0.1, value: S.z[k], fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.z[k] = v; update(); } });
  });
  var sc = ui.slider({ label: "constante c que se suma a TODOS", min: -10, max: 10, step: 0.5, value: 0, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.c = v; update(); } });
  function preset(z) { S.z = z.slice(); sl.forEach(function (q, k) { q.set(z[k], true); }); update(); }
  ui.button("Ejemplo del texto (3, 1, −1, 0)", function () { preset([3, 1, -1, 0]); sc.set(0, true); S.c = 0; update(); });
  ui.button("Todos iguales", function () { preset([1, 1, 1, 1]); });
  ui.button("Uno domina (6, 0, 0, 0)", function () { preset([6, 0, 0, 0]); });
  ui.button("Dos empatados (2, 2, 0, 0)", function () { preset([2, 2, 0, 0]); });
  var tab = api.table(root, ["género", "z", "z+c", "exp(z+c)", "p"]);
  Array.prototype.forEach.call(tab.el.querySelectorAll("th"), function (t) { t.style.textTransform = "none"; });
  var out = api.readout(root);
  out.el.style.fontSize = "clamp(.7rem, 2.6vw, .82rem)";
  function cl(C) { return [C.cobalto, C.terracota, C.oliva, C.marker]; }
  view.draw(function (ctx, w, h, C) {
    var p = M.softmax(S.z), colors = cl(C), k, bh = Math.min(30, (h - 24) / K - 6), x0 = 74, wmax = w - x0 - 62;
    for (k = 0; k < K; k++) {
      var y = 10 + k * (bh + 8);
      D.text(ctx, NAMES[k], x0 - 8, y + bh / 2 + 4, { size: 11.5, weight: 700, align: "right" });
      D.rect(ctx, x0, y, wmax, bh, C.surface, C.line, 1);
      D.rect(ctx, x0, y, Math.max(1, wmax * p[k]), bh, colors[k]);
      D.text(ctx, (p[k] * 100).toFixed(1) + "%", x0 + wmax + 6, y + bh / 2 + 4, { size: 11, mono: true });
    }
  });
  function f(v, n) { return v.toFixed(n).replace("-", "−"); }
  function update() {
    var zc = S.z.map(function (v) { return v + S.c; }), e = zc.map(Math.exp), s = M.sum(e), p = e.map(function (v) { return v / s; });
    var base = M.softmax(S.z), dmax = 0, k;
    for (k = 0; k < K; k++) dmax = Math.max(dmax, Math.abs(p[k] - base[k]));
    var rows = [];
    for (k = 0; k < K; k++) rows.push([NAMES[k] + " (" + k + ")", f(S.z[k], 1), f(zc[k], 1), e[k] < 1e-3 ? e[k].toExponential(2) : e[k].toFixed(4), "<b>" + p[k].toFixed(4) + "</b>"]);
    rows.push(["Σ", "", "", s < 1e-3 ? s.toExponential(2) : s.toFixed(4), "<b>" + M.sum(p).toFixed(4) + "</b>"]);
    tab.set(rows);
    var best = 0; for (k = 1; k < K; k++) if (p[k] > p[best]) best = k;
    out.set("argmax = <b>" + NAMES[best] + "</b> (clase " + best + ") · suma de p = <b>" + M.sum(p).toFixed(4) + "</b>" + (S.c !== 0 ? "<br>Con c = " + S.c.toFixed(1) + " las probabilidades cambian como máximo <b>" + dmax.toExponential(1) + "</b> respecto a c = 0 (cero salvo redondeo: e<sup>c</sup> se cancela al dividir)." : "<br>Mueve c: las probabilidades no cambian."));
    view.redraw();
  }
  update();
});
