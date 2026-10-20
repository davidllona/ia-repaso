/* Experimento: ¿gana la red neuronal a la regresión lineal? Se entrena de verdad (Adam, pérdida MSE) una red con una capa
   oculta de tanh y se ajusta una recta por mínimos cuadrados; ambas se evalúan en un test aparte con R².
   El lector decide cuánto se curva la relación real, cuánto ruido hay y de cuántos ejemplos se dispone. */
Lab.register("curso3/c3m7-red-vs-lineal", function (root, api) {
  var D = api.d, M = api.math;
  var S = { a: 0.7, noise: 0.3, n: 60, H: 12, seed: 1 };
  var st = null;
  function f(x, a) { return (1 - a) * 2 * x + a * 1.6 * Math.sin(6 * x); }

  function trainMLP(xs, ys, H, epochs, lr, seed) {
    var R = api.rng(seed * 101 + 9), w1 = [], b1 = [], w2 = [], b2 = 0, j, i, e;
    for (j = 0; j < H; j++) { w1.push(R.normal(0, 2)); b1.push(R.range(-1.5, 1.5)); w2.push(R.normal(0, 0.5)); }
    var P = [w1, b1, w2], mom = [], vel = [], mb = 0, vb = 0;
    P.forEach(function (arr) { mom.push(new Array(H).fill(0)); vel.push(new Array(H).fill(0)); });
    var n = xs.length, h = new Array(H), g1 = new Array(H), gb1 = new Array(H), g2 = new Array(H), b1c = 0.9, b2c = 0.999;
    for (e = 1; e <= epochs; e++) {
      var gB = 0; g1.fill(0); gb1.fill(0); g2.fill(0);
      for (i = 0; i < n; i++) {
        var yh = b2;
        for (j = 0; j < H; j++) { h[j] = Math.tanh(w1[j] * xs[i] + b1[j]); yh += w2[j] * h[j]; }
        var d = 2 * (yh - ys[i]) / n; gB += d;
        for (j = 0; j < H; j++) { g2[j] += d * h[j]; var dh = d * w2[j] * (1 - h[j] * h[j]); g1[j] += dh * xs[i]; gb1[j] += dh; }
      }
      var grads = [g1, gb1, g2], c1 = 1 - Math.pow(b1c, e), c2 = 1 - Math.pow(b2c, e);
      for (var p = 0; p < 3; p++) for (j = 0; j < H; j++) {
        mom[p][j] = b1c * mom[p][j] + (1 - b1c) * grads[p][j]; vel[p][j] = b2c * vel[p][j] + (1 - b2c) * grads[p][j] * grads[p][j];
        P[p][j] -= lr * (mom[p][j] / c1) / (Math.sqrt(vel[p][j] / c2) + 1e-8);
      }
      mb = b1c * mb + (1 - b1c) * gB; vb = b2c * vb + (1 - b2c) * gB * gB; b2 -= lr * (mb / c1) / (Math.sqrt(vb / c2) + 1e-8);
    }
    return function (x) { var s = b2; for (var k = 0; k < H; k++) s += w2[k] * Math.tanh(w1[k] * x + b1[k]); return s; };
  }
  function r2(pred, ys) { var m = M.mean(ys), se = 0, st2 = 0; for (var i = 0; i < ys.length; i++) { se += (pred[i] - ys[i]) * (pred[i] - ys[i]); st2 += (ys[i] - m) * (ys[i] - m); } return 1 - se / st2; }

  function compute() {
    var R = api.rng(S.seed * 53 + 2), xs = [], ys = [], xt = [], yt = [], ft = [], i;
    for (i = 0; i < S.n; i++) { var x = R.range(-1, 1); xs.push(x); ys.push(f(x, S.a) + R.normal(0, S.noise)); }
    for (i = 0; i < 400; i++) { var z = R.range(-1, 1); xt.push(z); ft.push(f(z, S.a)); yt.push(f(z, S.a) + R.normal(0, S.noise)); }
    var lin = M.linreg(xs, ys), net = trainMLP(xs, ys, S.H, 700, 0.03, S.seed);
    var pl = xt.map(function (x) { return lin.m * x + lin.b; }), pn = xt.map(net);
    var vf = M.std(ft); vf *= vf;
    st = { xs: xs, ys: ys, lin: lin, net: net, r2l: r2(pl, yt), r2n: r2(pn, yt), ceil: vf / (vf + S.noise * S.noise) };
  }

  var view = api.view(root, { aspect: 1.7, minH: 250, maxH: 360, label: "Duración y nota de las películas de entrenamiento, recta ajustada, red neuronal y función verdadera" });
  var plot = api.plot(view, { xr: [-1, 1], yr: [-3, 3], xticks: 4, yticks: 6, grid: true, pad: { l: 40, r: 12, t: 12, b: 34 }, xlabel: "duración de la película (estandarizada)" });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Cuánto se curva la relación duración → nota", min: 0, max: 1, step: 0.05, value: S.a, fmt: function (v) { return v.toFixed(2).replace(".", ","); }, onInput: function (v) { S.a = v; update(); } });
  ui.slider({ label: "Ruido: gustos impredecibles (σ)", min: 0.05, max: 1.5, step: 0.05, value: S.noise, fmt: function (v) { return v.toFixed(2).replace(".", ","); }, onInput: function (v) { S.noise = v; update(); } });
  ui.slider({ label: "Películas con las que entrena", min: 8, max: 300, step: 4, value: S.n, onInput: function (v) { S.n = v; update(); } });
  ui.slider({ label: "Neuronas de la capa oculta", min: 2, max: 24, step: 1, value: S.H, onInput: function (v) { S.H = v; update(); } });
  ui.button("Otra muestra de datos", function () { S.seed = S.seed % 9 + 1; update(); });
  api.legend(root, [[api.colors().muted, "películas de entrenamiento"], [api.colors().ink2, "función verdadera"], [api.colors().cobalto, "recta (regresión lineal)"], [api.colors().terracota, "red neuronal"]]);

  view.draw(function (ctx, w, h, C) {
    plot.axes(ctx);
    if (!st) return;
    ctx.save(); plot.clip(ctx);
    var i, pts;
    for (i = 0; i < st.xs.length; i++) D.circle(ctx, plot.x(st.xs[i]), plot.y(st.ys[i]), 2.8, C.muted);
    pts = []; for (i = 0; i <= 120; i++) { var x = -1 + 2 * i / 120; pts.push([plot.x(x), plot.y(f(x, S.a))]); }
    D.path(ctx, pts, C.ink2, 1.6, [6, 4]);
    D.line(ctx, plot.x(-1), plot.y(-st.lin.m + st.lin.b), plot.x(1), plot.y(st.lin.m + st.lin.b), C.cobalto, 2.6);
    pts = []; for (i = 0; i <= 120; i++) { var x2 = -1 + 2 * i / 120; pts.push([plot.x(x2), plot.y(st.net(x2))]); }
    D.path(ctx, pts, C.terracota, 2.6);
    ctx.restore();
  });

  function update() {
    compute();
    var d = st.r2n - st.r2l, verdict;
    if (d > 0.02) verdict = "<span class='good'>La red gana</span> (+" + d.toFixed(3).replace(".", ",") + " de R²): la relación no es una recta y hay datos para aprenderla.";
    else if (d < -0.02) verdict = "<span class='bad'>La red pierde</span> (" + d.toFixed(3).replace(".", ",") + "): con una relación casi recta o muy pocos datos, la flexibilidad extra solo aprende ruido.";
    else verdict = "<b>Empate técnico</b> (" + (d >= 0 ? "+" : "") + d.toFixed(3).replace(".", ",") + "): elige la recta; es más simple, más rápida y se explica sola.";
    out.set("<b>R² en test</b> — recta: <b>" + st.r2l.toFixed(3).replace(".", ",") + "</b> · red: <b>" + st.r2n.toFixed(3).replace(".", ",") + "</b> · techo por el ruido: " + st.ceil.toFixed(3).replace(".", ",") +
      "<br>" + verdict);
    view.redraw();
  }
  update();
});
