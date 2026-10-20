/* Experimento: un outlier arrastra la recta OLS (error al cuadrado) mucho más que la recta MAE (error absoluto). */
Lab.register("curso1/c1m2-outlier", function (root, api) {
  var M = api.math, r = api.rng(12), base = [], i;
  for (i = 0; i < 10; i++) {
    var x = Math.round((1.2 + i * 0.45 + r.range(-0.15, 0.15)) * 10) / 10;
    base.push({ x: x, y: Math.round(115 + 34 * x + r.normal(0, 14)) });
  }
  var out0 = { x: 5.0, y: 285 }, o = { x: out0.x, y: out0.y }, withO = true;

  var view = api.view(root, { aspect: 1.6, minH: 290, drag: true, label: "Diez coches y un coche extra que puedes arrastrar; dos rectas: la de mínimos cuadrados y la de error absoluto" });
  var plot = api.plot(view, { xr: [0, 6], yr: [0, 400], xticks: 6, yticks: 8, xlabel: "Tamaño del motor (litros)", ylabel: "CO₂ (g/km)", pad: { l: 52, r: 14, t: 12, b: 40 } });
  api.legend(root, [[api.colors().terracota, "recta OLS (minimiza el error al cuadrado)"], [api.colors().cobalto, "recta MAE (minimiza el error absoluto)"], [api.colors().oliva, "OLS sin el coche extra"]]);
  var ui = api.controls(root), out = api.readout(root);
  var sy = ui.slider({ label: "Emisiones del coche extra (g/km)", min: 0, max: 400, step: 1, value: o.y, fmt: function (v) { return v.toFixed(0); }, onInput: function (v) { o.y = v; update(); } });
  var sx = ui.slider({ label: "Motor del coche extra (L)", min: 0.5, max: 5.8, step: 0.1, value: o.x, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { o.x = v; update(); } });
  ui.toggle({ label: "Incluir el coche extra", value: true, onChange: function (v) { withO = v; update(); } });
  ui.button("Colocarlo como un híbrido raro", function () { o.x = 5.0; o.y = 60; sx.set(5.0, true); sy.set(60, true); update(); }, "warm");

  function all() { return withO ? base.concat([o]) : base; }
  function olsFit(P) { return M.linreg(P.map(function (p) { return p.x; }), P.map(function (p) { return p.y; })); }
  // Recta de mínimo error absoluto: el óptimo pasa siempre por dos puntos, así que probamos todas las parejas.
  function ladFit(P) {
    var best = null, a, b;
    for (a = 0; a < P.length; a++) for (b = a + 1; b < P.length; b++) {
      if (Math.abs(P[a].x - P[b].x) < 1e-9) continue;
      var m = (P[b].y - P[a].y) / (P[b].x - P[a].x), c = P[a].y - m * P[a].x, s = 0;
      P.forEach(function (p) { s += Math.abs(p.y - (c + m * p.x)); });
      if (!best || s < best.s) best = { m: m, b: c, s: s };
    }
    return best;
  }
  function draw(ctx, w, h, C) {
    var D = api.d, P = all(), f1 = olsFit(P), f2 = ladFit(P), f0 = olsFit(base);
    plot.axes(ctx); ctx.save(); plot.clip(ctx);
    if (withO) D.line(ctx, plot.x(0), plot.y(f0.b), plot.x(6), plot.y(f0.b + f0.m * 6), C.oliva, 2, [6, 5]);
    D.line(ctx, plot.x(0), plot.y(f2.b), plot.x(6), plot.y(f2.b + f2.m * 6), C.cobalto, 3);
    D.line(ctx, plot.x(0), plot.y(f1.b), plot.x(6), plot.y(f1.b + f1.m * 6), C.terracota, 3);
    base.forEach(function (p) { D.circle(ctx, plot.x(p.x), plot.y(p.y), 5, C.ink, C.paper, 1.5); });
    if (withO) { D.circle(ctx, plot.x(o.x), plot.y(o.y), 9, C.marker, C.ink, 2.5); }
    ctx.restore();
  }
  function update() {
    view.redraw();
    var P = all(), f1 = olsFit(P), f2 = ladFit(P), f0 = olsFit(base);
    var sse = 0, sae = 0;
    P.forEach(function (p) {
      var e = p.y - (f1.b + f1.m * p.x); sse += e * e;
      var e2 = p.y - (f2.b + f2.m * p.x); sae += Math.abs(e2);
    });
    var shares = "";
    if (withO) {
      var e1 = o.y - (f1.b + f1.m * o.x), e2 = o.y - (f2.b + f2.m * o.x);
      shares = "<br>El coche extra aporta el <b>" + (100 * e1 * e1 / sse).toFixed(0) + " %</b> del error cuadrático de OLS y el <b>" + (100 * Math.abs(e2) / sae).toFixed(0) + " %</b> del error absoluto de MAE.";
    }
    out.set("Pendiente sin el coche extra (OLS): <b>" + f0.m.toFixed(1) + "</b> g/km por litro<br>" +
      "Con el coche extra → OLS: <b>" + f1.m.toFixed(1) + "</b> (cambia " + Math.abs(f1.m - f0.m).toFixed(1) + ") · MAE: <b>" + f2.m.toFixed(1) + "</b> (cambia " + Math.abs(f2.m - f0.m).toFixed(1) + ")" +
      shares);
  }
  function grab(px, py) {
    if (!withO) return;
    if (!plot.inside(px, py)) return;
    o.x = M.clamp(Math.round(plot.ix(px) * 10) / 10, 0.5, 5.8); o.y = M.clamp(Math.round(plot.iy(py)), 0, 400);
    sx.set(o.x, true); sy.set(o.y, true); update();
  }
  view.pointer({ down: grab, drag: grab });
  view.draw(draw); update();
});
