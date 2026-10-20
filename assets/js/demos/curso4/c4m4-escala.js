/* Experimento: la escala de las variables. Dos variables, una de 0 a 10 (días sin abrir la app) y otra de 0 a 1000 (segundos de buffering).
   El mismo modelo, el mismo learning rate y 300 épocas con las variables tal cual y con las variables estandarizadas. */
Lab.register("curso4/c4m4-escala", function (root, api) {
  var M = api.math, D = api.d, EP = 300;
  var S = { le: -1, big: 1000, ver: "loss" };
  var data, std, ready = false;

  var view = api.view(root, { aspect: 2.0, minH: 220, maxH: 340, label: "Pérdida en cada época con las variables sin escalar y estandarizadas" });
  var plot = api.plot(view, { xr: [0, EP], yr: [0, 2], xticks: 6, yticks: 4, xlabel: "época", ylabel: "pérdida BCE", pad: { l: 44, r: 10, t: 12, b: 36 } });
  api.legend(root, [[api.colors().terracota, "variables sin escalar"], [api.colors().cobalto, "variables estandarizadas"]]);
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Learning rate (escala logarítmica)", min: -5, max: 0.5, step: 0.25, value: S.le, fmt: function (v) { return Math.pow(10, v).toPrecision(2); }, onInput: function (v) { S.le = v; run(); } });
  ui.segmented({ label: "Rango de la 2.ª variable (buffering)", options: [[10, "0 a 10"], [100, "0 a 100"], [1000, "0 a 1000"]], value: S.big, onChange: function (v) { S.big = v; gen(); } });
  ui.button("Datos nuevos", function () { seedN += 1; gen(); });
  var seedN = 5, R;

  function sig(z) { return 1 / (1 + Math.exp(-z)); }
  function gen() {
    var r = api.rng(seedN), i, n = 200, h, q, z, y;
    data = { X: [], y: [] };
    for (i = 0; i < n; i++) {
      h = r.range(0, 10); q = r.range(0, S.big);
      z = 0.9 * (h - 5) + 0.01 * 1000 / S.big * (q - S.big / 2);
      y = r.next() < sig(z) ? 1 : 0; data.X.push([h, q]); data.y.push(y);
    }
    var m1 = M.mean(data.X.map(function (v) { return v[0]; })), m2 = M.mean(data.X.map(function (v) { return v[1]; }));
    var s1 = M.std(data.X.map(function (v) { return v[0]; })), s2 = M.std(data.X.map(function (v) { return v[1]; }));
    std = data.X.map(function (v) { return [(v[0] - m1) / s1, (v[1] - m2) / s2]; });
    run();
  }
  function train(Xd, lr) {
    var w1 = 0, w2 = 0, b = 0, hist = [], k, i, g1, g2, gb, e, n = Xd.length, L, z, ok;
    function metrics() { L = 0; ok = 0; for (i = 0; i < n; i++) { z = w1 * Xd[i][0] + w2 * Xd[i][1] + b; L += Math.max(z, 0) - z * data.y[i] + Math.log(1 + Math.exp(-Math.abs(z))); if ((z > 0) === (data.y[i] === 1)) ok++; } return [L / n, ok / n]; }
    hist.push(metrics()[0]);
    for (k = 0; k < EP; k++) {
      g1 = 0; g2 = 0; gb = 0;
      for (i = 0; i < n; i++) { e = sig(w1 * Xd[i][0] + w2 * Xd[i][1] + b) - data.y[i]; g1 += e * Xd[i][0]; g2 += e * Xd[i][1]; gb += e; }
      w1 -= lr * g1 / n; w2 -= lr * g2 / n; b -= lr * gb / n;
      if (!isFinite(w1) || !isFinite(w2) || !isFinite(b)) { w1 = w2 = b = 0; }
      hist.push(metrics()[0]);
    }
    var m = metrics();
    return { hist: hist, loss: m[0], acc: m[1], w: [w1, w2], b: b };
  }
  function run() { var lr = Math.pow(10, S.le); R = { raw: train(data.X, lr), std: train(std, lr), lr: lr }; redraw(); }

  view.draw(function (ctx, w, h, C) {
    if (!ready) return;
    plot.axes(ctx); ctx.save(); plot.clip(ctx);
    D.line(ctx, plot.x(0), plot.y(0.6931), plot.x(EP), plot.y(0.6931), C.line, 1.2, [5, 4]);
    D.path(ctx, R.raw.hist.map(function (v, i) { return [plot.x(i), plot.y(Math.min(v, 2.05))]; }), C.terracota, 2.5);
    D.path(ctx, R.std.hist.map(function (v, i) { return [plot.x(i), plot.y(Math.min(v, 2.05))]; }), C.cobalto, 2.5);
    ctx.restore();
    D.text(ctx, "0.693 = «no sé nada» (50 %)", plot.box.x + plot.box.w - 6, plot.y(0.6931) - 5, { size: 10.5, align: "right", color: C.muted });
    var big = Math.max(R.raw.loss, R.std.loss) > 2.05;
    if (big) D.text(ctx, "una curva sale por arriba del gráfico", plot.box.x + plot.box.w - 6, plot.box.y + 15, { size: 10.5, align: "right", color: C.terracotaInk, weight: 600 });
  });
  function redraw() {
    view.redraw();
    function f(r) { return r.loss > 100 ? "<span class='bad'>" + r.loss.toExponential(1) + "</span>" : "<b>" + r.loss.toFixed(3) + "</b>"; }
    out.set("lr = <b>" + R.lr.toPrecision(2) + "</b> · tras " + EP + " épocas:<br>" +
      "<span style='color:" + api.colors().terracotaInk + "'>sin escalar</span>: pérdida " + f(R.raw) + " · accuracy <b>" + R.raw.acc.toFixed(3) + "</b><br>" +
      "<span style='color:" + api.colors().cobaltoInk + "'>estandarizadas</span>: pérdida " + f(R.std) + " · accuracy <b>" + R.std.acc.toFixed(3) + "</b>");
  }
  ready = true; gen();
});
