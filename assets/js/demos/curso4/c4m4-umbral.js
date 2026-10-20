/* Experimento: del número p a la clase. 60 usuarios con la probabilidad p de cancelar que da un modelo ya entrenado
   y lo que pasó de verdad. Se mueve el umbral y se ve la matriz de confusión y el accuracy.
   Equivale a (p >= umbral).float() == y en PyTorch. */
Lab.register("curso4/c4m4-umbral", function (root, api) {
  var M = api.math, D = api.d, S = { u: 0.5 };
  var rng = api.rng(21), N = 60, P = [], Y = [], J = [], i, x, p;
  for (i = 0; i < N; i++) { x = rng.range(0, 10); p = 1 / (1 + Math.exp(-1.1 * (x - 4.5))); P.push(p); Y.push(rng.next() < p ? 1 : 0); J.push(rng.next()); }

  var view = api.view(root, { aspect: 2.3, minH: 200, maxH: 300, drag: !matchMedia("(pointer:coarse)").matches, label: "Cada usuario es un punto colocado según la probabilidad p que da el modelo, con el umbral como línea vertical" });
  var plot = api.plot(view, { xr: [0, 1], yr: [0, 1], xticks: 10, yticks: 2, xlabel: "p = probabilidad de cancelar dada por el modelo", pad: { l: 12, r: 12, t: 10, b: 38 }, grid: false, yfmt: function () { return ""; } });
  var ui = api.controls(root), out = api.readout(root);
  var sU = ui.slider({ label: "Umbral", min: 0.05, max: 0.95, step: 0.01, value: S.u, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.u = v; update(); } });
  ui.button("Umbral 0.5 (el de siempre)", function () { S.u = 0.5; slider(); update(); });
  function slider() { sU.set(S.u, true); }

  function counts() {
    var tp = 0, fp = 0, fn = 0, tn = 0, k, pred;
    for (k = 0; k < N; k++) { pred = P[k] >= S.u ? 1 : 0; if (pred && Y[k]) tp++; else if (pred && !Y[k]) fp++; else if (!pred && Y[k]) fn++; else tn++; }
    return { tp: tp, fp: fp, fn: fn, tn: tn };
  }
  view.draw(function (ctx, w, h, C) {
    plot.axes(ctx);
    var b = plot.box, k, c;
    ctx.save(); plot.clip(ctx);
    ctx.fillStyle = C.terracotaWash; ctx.globalAlpha = 0.35; ctx.fillRect(b.x, b.y, plot.x(S.u) - b.x, b.h);
    ctx.fillStyle = C.cobaltoWash; ctx.fillRect(plot.x(S.u), b.y, b.x + b.w - plot.x(S.u), b.h); ctx.globalAlpha = 1;
    D.line(ctx, b.x, b.y + b.h / 2, b.x + b.w, b.y + b.h / 2, C.line, 1);
    for (k = 0; k < N; k++) {
      var py = Y[k] ? b.y + 10 + J[k] * (b.h / 2 - 22) : b.y + b.h / 2 + 12 + J[k] * (b.h / 2 - 22), pred = P[k] >= S.u ? 1 : 0;
      D.circle(ctx, plot.x(P[k]), py, 4.5, Y[k] ? C.cobalto : C.terracota, pred === Y[k] ? C.paper : C.ink, pred === Y[k] ? 1.2 : 2.6);
    }
    D.line(ctx, plot.x(S.u), b.y, plot.x(S.u), b.y + b.h, C.ink, 2.5);
    ctx.restore();
    D.text(ctx, "cancelaron de verdad", b.x + 6, b.y + 13, { size: 10.5, color: C.cobaltoInk, weight: 600 });
    D.text(ctx, "se quedaron de verdad", b.x + 6, b.y + b.h - 6, { size: 10.5, color: C.terracotaInk, weight: 600 });
  });
  function update() {
    c = counts();
    var acc = (c.tp + c.tn) / N, prec = c.tp + c.fp ? c.tp / (c.tp + c.fp) : 0, rec = c.tp + c.fn ? c.tp / (c.tp + c.fn) : 0;
    out.set("umbral = <b>" + S.u.toFixed(2) + "</b>: se predice «cancela» (1) si p ≥ " + S.u.toFixed(2) + "<br>" +
      "<b>" + c.tp + "</b> cancelaciones detectadas (TP) · <b>" + c.fp + "</b> falsas alarmas (FP) · <b>" + c.fn + "</b> cancelaciones que se escapan (FN) · <b>" + c.tn + "</b> usuarios que se quedan, bien detectados (TN)<br>" +
      "accuracy = (" + c.tp + " + " + c.tn + ") / " + N + " = <b>" + acc.toFixed(3) + "</b> · precision = <b>" + prec.toFixed(2) + "</b> · recall = <b>" + rec.toFixed(2) + "</b>");
    view.redraw();
  }
  var c;
  view.pointer({ down: function (px) { S.u = M.clamp(Math.round(plot.ix(px) * 100) / 100, 0.05, 0.95); slider(); update(); }, drag: function (px) { S.u = M.clamp(Math.round(plot.ix(px) * 100) / 100, 0.05, 0.95); slider(); update(); } });
  update();
});
