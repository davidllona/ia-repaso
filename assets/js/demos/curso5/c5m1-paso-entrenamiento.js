/* Experimento: un paso de entrenamiento número a número en la red 2-2-1 del ejemplo a mano (la del fragmento 6).
   Hacia delante → pérdida → gradientes (las fórmulas de la sección) → descenso del gradiente. Cada pulsación da un paso. */
Lab.register("curso5/c5m1-paso-entrenamiento", function (root, api) {
  var D = api.d, M = api.math;
  var INIT = { W1: [[0.5, -0.5], [1.0, 0.5]], b1: [0, -1], W2: [1, -1], b2: 0 };
  var X = [1, 2];
  var S = { y: 1, lr: 1.0, W1: null, b1: null, W2: null, b2: 0, hist: [] };
  function reset() {
    S.W1 = INIT.W1.map(function (r) { return r.slice(); }); S.b1 = INIT.b1.slice(); S.W2 = INIT.W2.slice(); S.b2 = INIT.b2;
    S.hist = [stat()];
  }
  function f() { return function (v) { return (Math.abs(v) < 0.00005 ? 0 : v).toFixed(4).replace("-", "−"); }; }
  var n4 = f();
  function calc() {
    var z1 = [0, 1].map(function (j) { return S.W1[j][0] * X[0] + S.W1[j][1] * X[1] + S.b1[j]; });
    var h = z1.map(M.sigmoid), z2 = S.W2[0] * h[0] + S.W2[1] * h[1] + S.b2, p = M.sigmoid(z2);
    var L = -(S.y * Math.log(p) + (1 - S.y) * Math.log(1 - p));
    var dz2 = p - S.y, dW2 = [dz2 * h[0], dz2 * h[1]], dh = [S.W2[0] * dz2, S.W2[1] * dz2];
    var dz1 = [dh[0] * h[0] * (1 - h[0]), dh[1] * h[1] * (1 - h[1])];
    var dW1 = [[dz1[0] * X[0], dz1[0] * X[1]], [dz1[1] * X[0], dz1[1] * X[1]]];
    return { z1: z1, h: h, z2: z2, p: p, L: L, dz2: dz2, dW2: dW2, dh: dh, dz1: dz1, dW1: dW1 };
  }
  function stat() { var c = calc(); return { p: c.p, L: c.L }; }

  var view = api.view(root, { aspect: 2.6, minH: 150, maxH: 230, label: "Probabilidad de que el usuario termine la serie y pérdida en cada paso" });
  var plot = api.plot(view, { xr: [0, 20], yr: [0, 1.2], xticks: 4, yticks: 4, xlabel: "pasos de descenso del gradiente", pad: { l: 40, r: 10, t: 18, b: 34 }, xfmt: function (v) { return Math.round(v); } });
  var ui = api.controls(root), tb = api.table(root, ["cantidad", "valor"]), out = api.readout(root);
  ui.slider({ label: "learning rate (η)", min: 0.1, max: 4, step: 0.1, value: S.lr, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.lr = v; update(); } });
  ui.segmented({ label: "Etiqueta real y", value: 1, options: [[1, "y = 1 (la terminó)"], [0, "y = 0 (la abandonó)"]], onChange: function (v) { S.y = v; reset(); update(); } });
  function stepOnce() {
    var c = calc(), j, i;
    for (j = 0; j < 2; j++) { for (i = 0; i < 2; i++) S.W1[j][i] -= S.lr * c.dW1[j][i]; S.b1[j] -= S.lr * c.dz1[j]; S.W2[j] -= S.lr * c.dW2[j]; }
    S.b2 -= S.lr * c.dz2; S.hist.push(stat());
  }
  ui.button("Dar un paso", function () { stepOnce(); update(); }, "primary");
  ui.button("Dar 5 pasos", function () { for (var i = 0; i < 5; i++) stepOnce(); update(); });
  ui.button("Reiniciar pesos", function () { reset(); update(); }, "warm");

  function v2(a) { return "[" + a.map(n4).join(", ") + "]"; }
  function m2(m) { return "[" + m.map(v2).join(", ") + "]"; }
  view.draw(function (ctx, w, h, C) {
    var H = S.hist, xmax = Math.max(20, H.length - 1);
    plot.xr = [0, xmax]; plot.axes(ctx); ctx.save(); plot.clip(ctx);
    D.line(ctx, plot.x(0), plot.y(1), plot.x(xmax), plot.y(1), C.muted, 1, [4, 3]);
    D.path(ctx, H.map(function (q, i) { return [plot.x(i), plot.y(Math.min(q.L, 1.2))]; }), C.terracota, 2.4);
    D.path(ctx, H.map(function (q, i) { return [plot.x(i), plot.y(q.p)]; }), C.cobalto, 2.4);
    ctx.restore();
    D.line(ctx, plot.box.x, 10, plot.box.x + 20, 10, C.cobalto, 2.4); D.text(ctx, S.y ? "p (prob. de que termine)" : "p (prob. de terminarla; objetivo 0)", plot.box.x + 25, 14, { size: 10.5, color: C.cobaltoInk, weight: 600 });
    var lx = plot.box.x + plot.box.w * 0.7;
    D.line(ctx, lx, 10, lx + 20, 10, C.terracota, 2.4); D.text(ctx, "pérdida", lx + 25, 14, { size: 10.5, color: C.terracotaInk, weight: 600 });
  });
  function update() {
    var c = calc();
    tb.set([
      ["z<sub>1</sub> = W1·x + b1", v2(c.z1)],
      ["h = σ(z<sub>1</sub>)", v2(c.h)],
      ["z<sub>2</sub> = W2·h + b2", n4(c.z2)],
      ["p = σ(z<sub>2</sub>)", "<b>" + n4(c.p) + "</b>"],
      ["pérdida BCE", "<b>" + n4(c.L) + "</b>"],
      ["dz<sub>2</sub> = p − y", n4(c.dz2)],
      ["dW2 = dz<sub>2</sub>·h", v2(c.dW2)],
      ["dh = W2ᵀ·dz<sub>2</sub>", v2(c.dh)],
      ["dz<sub>1</sub> = dh·h(1−h)", v2(c.dz1)],
      ["dW1 = dz<sub>1</sub>·xᵀ", m2(c.dW1)],
      ["W1 actual", m2(S.W1)],
      ["W2 actual", v2(S.W2)]
    ]);
    out.set("Pasos dados: <b>" + (S.hist.length - 1) + "</b> · p = <b>" + n4(c.p) + "</b> · pérdida = <b>" + n4(c.L) + "</b><br>Cada paso hace W ← W − η·dW con η = <b>" + S.lr.toFixed(1) + "</b>." +
      (S.hist.length === 1 && S.y === 1 && S.lr === 1 ? "<br>Primer paso con η = 1: p debería pasar de 0.4125 a <b>0.7249</b> (el fragmento 6 da el mismo número)." : "") +
      (S.lr >= 3.5 ? "<br><span class='bad'>η muy grande: los pasos se pasan de largo y la pérdida puede subir.</span>" : ""));
    view.redraw();
  }
  reset(); update();
});
