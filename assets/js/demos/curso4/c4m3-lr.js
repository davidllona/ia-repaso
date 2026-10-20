/* Experimento: elegir el learning rate con una validación: curvas de entrenamiento/validación y barrido de lr. */
Lab.register("curso4/c4m3-lr", function (root, api) {
  var N = 60, r = api.rng(21), X = [], Y = [], i, E = 15, e10 = -1.3;
  for (i = 0; i < N; i++) { var xv = -3 + 6 * i / (N - 1); X.push(xv); Y.push(-3 * xv + 1 + r.normal(0, 0.3)); }
  var idx = []; for (i = 0; i < N; i++) idx.push(i); api.rng(4).shuffle(idx);
  var tr = idx.slice(0, 40), va = idx.slice(40);
  var mx2 = tr.reduce(function (s, k) { return s + X[k] * X[k]; }, 0) / tr.length, lrMax = 1 / mx2;
  function mseOn(set, w, b) { var s = 0; set.forEach(function (k) { var e = w * X[k] + b - Y[k]; s += e * e; }); return s / set.length; }
  function train(lr, epochs) {
    var w = 0, b = 0, a = [mseOn(tr, w, b)], v = [mseOn(va, w, b)], k, j;
    for (k = 0; k < epochs; k++) {
      var gw = 0, gb = 0;
      tr.forEach(function (q) { var e = w * X[q] + b - Y[q]; gw += 2 * e * X[q] / tr.length; gb += 2 * e / tr.length; });
      w -= lr * gw; b -= lr * gb;
      var ta = mseOn(tr, w, b), tv = mseOn(va, w, b);
      if (!isFinite(ta) || ta > 1e8) { ta = Infinity; tv = Infinity; }
      a.push(ta); v.push(tv);
    }
    return { tr: a, va: v, w: w, b: b };
  }
  var row = api.el("div", { class: "lab-row" }); root.appendChild(row);
  var p1 = api.el("div", { style: { minWidth: 0 } }), p2 = api.el("div", { style: { minWidth: 0 } }); row.appendChild(p1); row.appendChild(p2);
  var vA = api.view(p1, { aspect: 1.25, minH: 240, label: "MSE de entrenamiento y de validación en cada época, en escala logarítmica" });
  var pA = api.plot(vA, { xr: [0, 15], yr: [-2, 4], xticks: 5, yticks: 6, xlabel: "época", yfmt: function (t) { return "1e" + t; }, pad: { l: 46, r: 12, t: 12, b: 36 } });
  var vB = api.view(p2, { aspect: 1.25, minH: 240, label: "MSE de validación tras las épocas elegidas para cada learning rate, en escala logarítmica" });
  var pB = api.plot(vB, { xr: [-3, 0], yr: [-2, 4], xticks: 3, yticks: 6, xlabel: "learning rate", xfmt: function (t) { return "1e" + t; }, yfmt: function (t) { return "1e" + t; }, pad: { l: 46, r: 12, t: 12, b: 36 } });
  var ui = api.controls(root);
  var sE = ui.slider({ label: "épocas de entrenamiento", min: 1, max: 40, step: 1, value: E, fmt: function (v) { return v; }, onInput: function (v) { E = v; update(); } });
  var sL = ui.slider({ label: "learning rate (escala logarítmica)", min: -3, max: 0, step: 0.05, value: e10, fmt: function (v) { return Math.pow(10, v).toFixed(4); }, onInput: function (v) { e10 = v; update(); } });
  var out = api.readout(root);
  function lg(v) { return api.math.clamp(Math.log(Math.max(v, 1e-12)) / Math.LN10, -2, 4); }
  var sweep = [];
  function computeSweep() {
    sweep = [];
    for (var k = 0; k <= 60; k++) { var e = -3 + 3 * k / 60, t = train(Math.pow(10, e), E); sweep.push([e, t.va[E]]); }
  }
  function drawA(ctx, W, H, C) {
    var D = api.d, t = train(Math.pow(10, e10), E);
    pA.xr = [0, Math.max(5, E)]; pA.axes(ctx); ctx.save(); pA.clip(ctx);
    D.path(ctx, t.tr.map(function (v, k) { return [pA.x(k), pA.y(lg(v))]; }), C.cobalto, 2.5);
    D.path(ctx, t.va.map(function (v, k) { return [pA.x(k), pA.y(lg(v))]; }), C.terracota, 2.5, [5, 3]);
    ctx.restore();
    D.text(ctx, "entrenamiento (línea azul)", pA.box.x + pA.box.w - 8, pA.box.y + 16, { size: 11, color: C.cobaltoInk, weight: 600, align: "right" });
    D.text(ctx, "validación (rayada roja)", pA.box.x + pA.box.w - 8, pA.box.y + 31, { size: 11, color: C.terracotaInk, weight: 600, align: "right" });
  }
  function drawB(ctx, W, H, C) {
    var D = api.d, best = null;
    pB.axes(ctx); ctx.save(); pB.clip(ctx);
    var lx = Math.log(lrMax) / Math.LN10;
    ctx.globalAlpha = 0.18; D.rect(ctx, pB.x(lx), pB.box.y, pB.x(0) - pB.x(lx), pB.box.h, C.terracota); ctx.globalAlpha = 1;
    D.path(ctx, sweep.map(function (s) { return [pB.x(s[0]), pB.y(lg(s[1]))]; }), C.ink, 2);
    sweep.forEach(function (s) { if (isFinite(s[1]) && (!best || s[1] < best[1])) best = s; });
    D.line(ctx, pB.x(e10), pB.box.y, pB.x(e10), pB.box.y + pB.box.h, C.cobalto, 2, [4, 3]);
    if (best) D.circle(ctx, pB.x(best[0]), pB.y(lg(best[1])), 6, C.marker, C.ink, 2);
    ctx.restore();
    D.text(ctx, "zona inestable →", pB.x(lx) - 6, pB.box.y + 16, { size: 10.5, color: C.terracotaInk, weight: 600, align: "right" });
    D.text(ctx, "punto amarillo = mejor lr", pB.box.x + 8, pB.box.y + pB.box.h - 8, { size: 10.5, color: C.ink, weight: 600 });
    return best;
  }
  function update() {
    computeSweep(); vA.redraw(); vB.redraw();
    var lr = Math.pow(10, e10), t = train(lr, E), best = null;
    sweep.forEach(function (s) { if (isFinite(s[1]) && (!best || s[1] < best[1])) best = s; });
    var fin = isFinite(t.va[E]);
    out.set("lr = <b>" + lr.toFixed(4) + "</b> · tras <b>" + E + "</b> épocas: MSE entrenamiento = <b>" + (fin ? t.tr[E].toFixed(3) : "∞") + "</b> · MSE validación = <b>" + (fin ? t.va[E].toFixed(3) : "∞") + "</b><br>" +
      "límite de estabilidad ≈ 1 / media(x²) = <b>" + lrMax.toFixed(3) + "</b> · mejor lr del barrido ≈ <b>" + (best ? Math.pow(10, best[0]).toFixed(3) : "—") + "</b> (MSE validación " + (best ? best[1].toFixed(3) : "—") + ")<br>" +
      (!fin ? "<span class='bad'>DIVERGE: el MSE crece en cada época. Baja el lr.</span>" : lr < 0.3 * (best ? Math.pow(10, best[0]) : 1) ? "<span class='bad'>lr demasiado pequeño para estas épocas: se queda a medio camino.</span>" : lr > 1.5 * (best ? Math.pow(10, best[0]) : 1) ? "<span class='bad'>lr cerca (o por encima) del límite: oscila o diverge.</span>" : "<span class='good'>lr razonable: baja deprisa sin oscilar.</span>"));
  }
  vA.draw(drawA); vB.draw(drawB);
  update();
});
