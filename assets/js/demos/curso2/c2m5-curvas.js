/* Experimento: diagnosticar un entrenamiento mirando las curvas de acierto de train y valid (sano, memoriza, no aprende). Curvas de juguete con las cifras de la lección 8. */
Lab.register("curso2/c2m5-curvas", function (root, api) {
  var E = 30, caso = "sano", ep = E;
  var rng = api.rng(5), ruido = [];
  for (var k = 0; k <= E; k++) ruido.push([rng.normal(0, 0.006), rng.normal(0, 0.009)]);
  function curvas(c) {
    var tr = [], va = [], e, t, v;
    for (e = 1; e <= E; e++) {
      var n = ruido[e];
      if (c === "sano") { t = 0.5 + 0.42 * (1 - Math.exp(-e / 5)); v = t + 0.01 * (1 - Math.exp(-e / 5)); }
      else if (c === "memoriza") { t = 0.5 + 0.49 * (1 - Math.exp(-e / 4)); v = 0.5 + 0.33 * (1 - Math.exp(-e / 3)) - 0.006 * Math.max(0, e - 8); }
      else { t = 0.5 + 0.05 * (1 - Math.exp(-e / 6)); v = 0.5 + 0.03 * (1 - Math.exp(-e / 6)); }
      tr.push(Math.min(0.995, t + n[0] * 0.6)); va.push(Math.min(0.995, v + n[1]));
    }
    return { t: tr, v: va };
  }
  var D = curvas(caso);
  var narrow = function () { return view.w < 460; };
  var view = api.view(root, { aspect: 1.6, minH: 250, maxH: 380, label: "Curvas de acierto de entrenamiento y validación por época" });
  var P = api.plot(view, { xr: [0, E], yr: [0.4, 1], xticks: 6, yticks: 6, xlabel: "época", xfmt: function (v) { return String(Math.round(v)); }, ylabel: "acierto", yfmt: function (v) { return Math.round(v * 100) + " %"; }, pad: { l: 50 } });
  var C0 = api.colors();
  api.legend(root, [[C0.cobalto, "train (fotos con las que aprende)"], [C0.terracota, "valid (fotos que no usa para aprender)"]]);
  var ui = api.controls(root), out = api.readout(root);
  ui.segmented({ label: "Entrenamiento", options: [["sano", "Sano"], ["memoriza", "Memoriza"], ["noaprende", "No aprende"]], value: caso,
    onChange: function (c) { caso = c; D = curvas(c); update(); } });
  var sl = ui.slider({ label: "Época", min: 1, max: E, step: 1, value: ep, fmt: function (v) { return String(v); }, onInput: function (v) { ep = v; parar(); update(); } });
  var loop = null;
  function parar() { if (loop) { loop.stop(); loop = null; } }
  ui.button("▶ Ver cómo crecen", function () {
    parar();
    if (api.reduceMotion) { ep = E; sl.set(E, true); update(); return; }
    ep = 1; sl.set(1, true); update();
    var acc = 0;
    loop = api.loop(function (dt) {
      acc += dt; if (acc < 0.12) return; acc = 0;
      ep++; sl.set(ep, true); update();
      if (ep >= E) { loop = null; return false; }
    });
    loop.start();
  }, "primary");
  function pts(arr) { var r = []; for (var e = 1; e <= ep; e++) r.push([P.x(e), P.y(arr[e - 1])]); return r; }
  view.draw(function (ctx, w, h, C) {
    P.axes(ctx);
    ctx.save(); P.clip(ctx);
    api.d.line(ctx, P.x(1), P.y(0.5), P.x(E), P.y(0.5), C.muted, 1, [4, 4]);
    api.d.path(ctx, pts(D.t), C.cobalto, 2.6);
    api.d.path(ctx, pts(D.v), C.terracota, 2.6);
    var t = D.t[ep - 1], v = D.v[ep - 1], x = P.x(ep);
    api.d.circle(ctx, x, P.y(t), 4.5, C.cobalto);
    api.d.circle(ctx, x, P.y(v), 4.5, C.terracota);
    if (Math.abs(t - v) > 0.03) {
      var xb = Math.min(x + 8, P.x(E) - 4);
      api.d.line(ctx, xb, P.y(t), xb, P.y(v), C.ink, 1.6);
      api.d.text(ctx, "brecha", xb - 6, (P.y(t) + P.y(v)) / 2 + 4, { size: 12, align: "right", weight: 600 });
    }
    ctx.restore();
    api.d.text(ctx, narrow() ? "azar = 50 %" : "azar (moneda) = 50 %", P.x(E) - 4, P.y(0.5) - 6, { size: 11, align: "right", color: C.muted });
  });
  function pc(x) { return (x * 100).toFixed(0) + " %"; }
  function update() {
    view.redraw();
    var t = D.t[ep - 1], v = D.v[ep - 1], b = t - v, diag;
    if (t < 0.65) diag = "<span class='bad'>No aprende (underfitting)</span>: las dos curvas, pegadas pero cerca del 50 % de tirar una moneda.";
    else if (b > 0.08) diag = "<span class='bad'>Memoriza (overfitting)</span>: train sube y valid se queda atrás. Más datos, más Dropout o parar antes.";
    else diag = "<span class='good'>Sano</span>: las dos suben juntas. Aprende y generaliza.";
    out.set("Época <b>" + ep + "</b> · train <b>" + pc(t) + "</b> · valid <b>" + pc(v) + "</b> · brecha <b>" + (b * 100).toFixed(0) + (Math.abs(Math.round(b * 100)) === 1 ? " punto" : " puntos") + "</b><br>" + diag);
  }
  update();
  return { destroy: function () { parar(); } };
});
