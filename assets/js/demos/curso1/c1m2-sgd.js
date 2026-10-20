/* Experimento: GD (todos los datos), mini-batch (unos pocos) y SGD (uno solo) sobre la misma montaña de coste de 2 parámetros. */
Lab.register("curso1/c1m2-sgd", function (root, api) {
  var M = api.math, N = 60, X = [], Y = [], i, rd = api.rng(3);
  for (i = 0; i < N; i++) { var x = rd.normal(1, 1); X.push(x); Y.push(2 + 3 * x + rd.normal(0, 1.5)); }
  var opt = M.linreg(X, Y);                                   // el mínimo exacto (θ0, θ1)
  var START = [-1.5, 6.0], lr = 0.06, B = 8, decay = false, spd = 3, seed = 1, t, algs, rs, loop;
  var NAMES = ["GD (los 60 datos)", "Mini-batch", "SGD (1 dato)"];
  function rgba(hex, a) { var s = hex.replace("#", ""); if (s.length === 3) s = s.split("").map(function (c) { return c + c; }).join(""); var n = parseInt(s, 16); return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")"; }
  function J(a, b) { var s = 0; for (var q = 0; q < N; q++) { var e = a + b * X[q] - Y[q]; s += e * e; } return s / N; }
  function init() {
    rs = api.rng(seed); t = 0; algs = [0, 1, 2].map(function () { return { th: START.slice(), path: [START.slice()], loss: [Math.sqrt(J(START[0], START[1]))] }; });
  }
  function grad(th, idx) {
    var g0 = 0, g1 = 0;
    for (var q = 0; q < idx.length; q++) { var e = th[0] + th[1] * X[idx[q]] - Y[idx[q]]; g0 += e; g1 += e * X[idx[q]]; }
    return [2 * g0 / idx.length, 2 * g1 / idx.length];
  }
  function batchIdx(size) { var idx = [], q; if (size >= N) { for (q = 0; q < N; q++) idx.push(q); return idx; } for (q = 0; q < size; q++) idx.push(rs.int(0, N - 1)); return idx; }
  function tick() {
    var a = decay ? lr / (1 + 0.03 * t) : lr;
    [N, B, 1].forEach(function (size, k) {
      var g = grad(algs[k].th, batchIdx(size));
      algs[k].th = [algs[k].th[0] - a * g[0], algs[k].th[1] - a * g[1]];
      var bad = !isFinite(algs[k].th[0]) || Math.abs(algs[k].th[0]) > 1e3 || Math.abs(algs[k].th[1]) > 1e3;
      if (bad) algs[k].th = [M.clamp(algs[k].th[0] || 0, -50, 50), M.clamp(algs[k].th[1] || 0, -50, 50)];
      algs[k].path.push(algs[k].th.slice()); algs[k].loss.push(Math.sqrt(J(algs[k].th[0], algs[k].th[1])));
      if (algs[k].path.length > 600) algs[k].path.shift();
    });
    t++;
  }

  var view = api.view(root, { aspect: 1.25, minH: 300, label: "Curvas de nivel del coste según el intercepto y la pendiente, con la trayectoria de tres algoritmos de descenso" });
  var plot = api.plot(view, { xr: [-2, 6], yr: [-1, 7], xticks: 8, yticks: 8, xlabel: "θ₀ (intercepto)", ylabel: "θ₁ (pendiente)", pad: { l: 42, r: 12, t: 12, b: 40 } });
  var view2 = api.view(root, { aspect: 3.8, minH: 130, maxH: 190, label: "Error de cada algoritmo según el número de actualizaciones" });
  var plot2 = api.plot(view2, { xr: [0, 100], yr: [0, 8], xticks: 5, yticks: 4, xlabel: "actualizaciones de los parámetros", ylabel: "RMSE", pad: { l: 42, r: 12, t: 8, b: 32 } });
  api.legend(root, [[api.colors().cobalto, NAMES[0]], [api.colors().oliva, NAMES[1]], [api.colors().terracota, NAMES[2]], [api.colors().marker, "mínimo exacto (OLS)"]]);
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Learning rate (α)", min: 0.005, max: 0.2, step: 0.005, value: lr, fmt: function (v) { return v.toFixed(3); }, onInput: function (v) { lr = v; init(); redraw(); } });
  ui.slider({ label: "Tamaño del mini-batch", min: 2, max: 30, step: 1, value: B, onInput: function (v) { B = v; init(); redraw(); } });
  ui.slider({ label: "Velocidad (actualizaciones por paso de animación)", min: 1, max: 10, step: 1, value: spd, onInput: function (v) { spd = v; } });
  ui.toggle({ label: "Learning rate decreciente", value: false, onChange: function (v) { decay = v; init(); redraw(); } });
  var bPlay = ui.button("Ejecutar", function () { if (loop.running) loop.stop(); else { if (api.reduceMotion) { for (var q = 0; q < 150; q++) tick(); redraw(); } else loop.start(); } }, "primary");
  ui.button("Nuevo sorteo de datos", function () { seed += 7; init(); redraw(); });
  loop = api.loop(function () { for (var q = 0; q < spd; q++) tick(); redraw(); return t < 400; }, { fps: 15, onState: function (on) { bPlay.textContent = on ? "Pausa" : "Ejecutar"; } });

  var grid = null, gridKey = "";
  function bands(ctx, C) {
    var b = plot.box, cw = 6, x, y, key = b.w + "x" + b.h + C.cobalto;
    var lmin = Math.log(J(opt.b, opt.m) + 1e-9);
    for (x = Math.floor(b.x); x < b.x + b.w; x += cw) for (y = Math.floor(b.y); y < b.y + b.h; y += cw) {
      var j = J(plot.ix(x + cw / 2), plot.iy(y + cw / 2)), lv = Math.floor((Math.log(j) - lmin) * 1.6);
      ctx.fillStyle = rgba(C.cobalto, Math.max(0.05, 0.62 - lv * 0.06) * (lv % 2 ? 0.8 : 1));
      ctx.fillRect(x, y, cw, cw);
    }
  }
  function draw(ctx, w, h, C) {
    var D = api.d, cols = [C.cobalto, C.oliva, C.terracota];
    plot.axes(ctx); ctx.save(); plot.clip(ctx);
    bands(ctx, C);
    [0, 1, 2].forEach(function (k) {
      D.path(ctx, algs[k].path.map(function (p) { return [plot.x(p[0]), plot.y(p[1])]; }), cols[k], k === 0 ? 3 : 1.6);
    });
    [0, 1, 2].forEach(function (k) { var p = algs[k].th; D.circle(ctx, plot.x(p[0]), plot.y(p[1]), 5, cols[k], C.paper, 1.5); });
    D.circle(ctx, plot.x(START[0]), plot.y(START[1]), 6, null, C.ink, 2);
    D.circle(ctx, plot.x(opt.b), plot.y(opt.m), 7, C.marker, C.ink, 2.5);
    ctx.restore();
    D.text(ctx, "salida", plot.x(START[0]) + 9, plot.y(START[1]) + 4, { size: 10.5, color: C.ink2 });
  }
  function draw2(ctx, w, h, C) {
    var D = api.d, cols = [C.cobalto, C.oliva, C.terracota], mx = Math.max(100, Math.ceil(t / 50) * 50), r0 = algs[0].loss[0];
    plot2.xr = [0, mx]; plot2.yr = [0, Math.ceil(r0 / 2) * 2]; plot2.axes(ctx); ctx.save(); plot2.clip(ctx);
    [0, 1, 2].forEach(function (k) { var base = t + 1 - algs[k].loss.length; D.path(ctx, algs[k].loss.map(function (v, q) { return [plot2.x(base + q), plot2.y(v)]; }), cols[k], k === 0 ? 3 : 1.5); });
    D.line(ctx, plot2.box.x, plot2.y(1.5), plot2.box.x + plot2.box.w, plot2.y(1.5), C.muted, 1.2, [4, 4]);
    ctx.restore();
    D.text(ctx, "ruido de los datos (1,5)", plot2.box.x + plot2.box.w - 6, plot2.y(1.5) - 5, { size: 10, color: C.muted, align: "right" });
  }
  function redraw() {
    view.redraw(); view2.redraw();
    var a = decay ? lr / (1 + 0.03 * t) : lr;
    function f(k) { var p = algs[k].th, d = Math.hypot(p[0] - opt.b, p[1] - opt.m); return "(" + p[0].toFixed(2) + ", " + p[1].toFixed(2) + ") · distancia al mínimo <b>" + d.toFixed(2) + "</b> · RMSE <b>" + algs[k].loss[algs[k].loss.length - 1].toFixed(2) + "</b>"; }
    out.set("Actualizaciones: <b>" + t + "</b> · learning rate actual = <b>" + a.toFixed(3) + "</b> · mínimo exacto (" + opt.b.toFixed(2) + ", " + opt.m.toFixed(2) + ")<br>" +
      "GD: " + f(0) + "<br>Mini-batch (" + B + "): " + f(1) + "<br>SGD: " + f(2) + "<br>" +
      "Datos leídos hasta ahora → GD: <b>" + (t * N) + "</b> · mini-batch: <b>" + (t * B) + "</b> · SGD: <b>" + t + "</b>");
  }
  init(); view.draw(draw); view2.draw(draw2); redraw();
  return { destroy: function () { loop.stop(); } };
});
