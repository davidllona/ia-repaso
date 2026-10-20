/* Experimento: el bucle de entrenamiento en vivo. Regresión logística con una variable, pérdida BCE.
   Batch completo / mini-batch / SGD. Con datos perfectamente separables la pérdida baja hacia 0 pero w no deja de crecer. */
Lab.register("curso4/c4m4-entrena-1d", function (root, api) {
  var M = api.math, D = api.d;
  var X = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 7, 8];
  var DATA = { solape: [0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1], separable: [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1] };
  var S = { data: "solape", lr: 0.5, modo: "batch", curva: "loss", epoch: 0, updates: 0, max: 1000, w: 0, b: 0 };
  var rng, hist, loop, ready = false;

  var view = api.view(root, { aspect: 1.9, minH: 230, maxH: 360, label: "Los 14 usuarios y la curva sigmoide que se va ajustando durante el entrenamiento" });
  var plot = api.plot(view, { xr: [0, 9], yr: [-0.2, 1.2], xticks: 9, yticks: 7, xlabel: "días sin abrir la app", ylabel: "p (cancelar)", pad: { l: 40, r: 10, t: 10, b: 36 }, yfmt: function (v) { return (+v.toFixed(1)).toString(); } });
  var view2 = api.view(root, { aspect: 3.4, minH: 150, maxH: 230, label: "Curva de aprendizaje" });
  var plot2 = api.plot(view2, { xr: [0, 100], yr: [0, 0.8], xticks: 4, yticks: 4, xlabel: "época", ylabel: "pérdida", pad: { l: 46, r: 16, t: 10, b: 34 } });
  var ui = api.controls(root), out = api.readout(root);
  ui.select({ label: "Datos", value: S.data, options: [["solape", "Con solapamiento (los de siempre)"], ["separable", "Perfectamente separables (corte en 3.25 días)"]], onChange: function (v) { S.data = v; reset(); } });
  ui.segmented({ label: "Cuántos datos por actualización", options: [["batch", "Todos (14)"], ["mini", "Mini-batch (4)"], ["sgd", "Uno (SGD)"]], value: S.modo, onChange: function (v) { S.modo = v; reset(); } });
  ui.slider({ label: "Learning rate", min: 0.05, max: 3, step: 0.05, value: S.lr, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.lr = v; reset(); } });
  ui.segmented({ label: "Curva inferior", options: [["loss", "Pérdida"], ["w", "Valor de w"]], value: S.curva, onChange: function (v) { S.curva = v; view2.redraw(); } });
  var bPlay = ui.button("Ejecutar", function () { if (loop.running) loop.stop(); else { if (S.epoch >= S.max) reset(); if (api.reduceMotion) { advance(S.max - S.epoch); redraw(); } else loop.start(); } }, "primary");
  ui.button("+ 1 época", function () { advance(1); redraw(); });
  ui.button("+ 100 épocas", function () { advance(100); redraw(); });
  ui.button("Volver al inicio", function () { reset(); });

  function sig(z) { return 1 / (1 + Math.exp(-z)); }
  function Yv() { return DATA[S.data]; }
  function lossAll() { var Y = Yv(), s = 0, i, z; for (i = 0; i < X.length; i++) { z = S.w * X[i] + S.b; s += Math.max(z, 0) - z * Y[i] + Math.log(1 + Math.exp(-Math.abs(z))); } return s / X.length; }
  function accAll() { var Y = Yv(), ok = 0, i; for (i = 0; i < X.length; i++) if ((S.w * X[i] + S.b > 0) === (Y[i] === 1)) ok++; return ok; }
  function update(idx) {
    var Y = Yv(), gw = 0, gb = 0, i, e;
    for (i = 0; i < idx.length; i++) { e = sig(S.w * X[idx[i]] + S.b) - Y[idx[i]]; gw += e * X[idx[i]]; gb += e; }
    S.w -= S.lr * gw / idx.length; S.b -= S.lr * gb / idx.length; S.updates++;
  }
  function oneEpoch() {
    var order = [], i, bs = S.modo === "batch" ? 14 : S.modo === "mini" ? 4 : 1;
    for (i = 0; i < X.length; i++) order.push(i);
    if (S.modo !== "batch") rng.shuffle(order);
    for (i = 0; i < X.length; i += bs) update(order.slice(i, i + bs));
    S.epoch++;
    if (!isFinite(S.w) || !isFinite(S.b)) { S.w = 0; S.b = 0; }
    hist.push([lossAll(), S.w]);
  }
  function advance(n) { var k; for (k = 0; k < n && S.epoch < S.max; k++) oneEpoch(); }
  function reset() { if (loop) loop.stop(); rng = api.rng(11); S.w = 0; S.b = 0; S.epoch = 0; S.updates = 0; hist = [[lossAll(), 0]]; redraw(); }
  loop = api.loop(function () { advance(S.modo === "sgd" ? 2 : 6); redraw(); return S.epoch < S.max; }, { fps: 20, onState: function (on) { bPlay.textContent = on ? "Pausa" : "Ejecutar"; } });

  view.draw(function (ctx, w, h, C) {
    if (!ready) return;
    plot.axes(ctx); ctx.save(); plot.clip(ctx);
    var Y = Yv(), i, pts = [], xx;
    D.line(ctx, plot.x(0), plot.y(0.5), plot.x(9), plot.y(0.5), C.line, 1.2, [5, 4]);
    for (i = 0; i <= 120; i++) { xx = 9 * i / 120; pts.push([plot.x(xx), plot.y(sig(S.w * xx + S.b))]); }
    D.path(ctx, pts, C.ink, 3);
    if (Math.abs(S.w) > 1e-6) { var fx = -S.b / S.w; if (fx > 0 && fx < 9) D.line(ctx, plot.x(fx), plot.box.y, plot.x(fx), plot.box.y + plot.box.h, C.ink2, 1.5, [2, 4]); }
    for (i = 0; i < X.length; i++) { var good = (S.w * X[i] + S.b > 0) === (Y[i] === 1); D.circle(ctx, plot.x(X[i]), plot.y(Y[i]), 6, Y[i] ? C.cobalto : C.terracota, good ? C.paper : C.ink, good ? 1.5 : 3); }
    ctx.restore();
  });
  view2.draw(function (ctx, w, h, C) {
    if (!ready) return;
    var n = Math.max(100, hist.length - 1), k = S.curva === "loss" ? 0 : 1, vals = hist.map(function (r) { return r[k]; }), mx = Math.max.apply(null, vals), mn = Math.min.apply(null, vals);
    plot2.xr = [0, n];
    if (k === 0) plot2.yr = [0, Math.max(0.1, Math.ceil(Math.max(mx, 0.1) * 10) / 10)]; else plot2.yr = [Math.min(0, Math.floor(mn)), Math.max(1, Math.ceil(mx))];
    plot2.axes(ctx); ctx.save(); plot2.clip(ctx);
    D.path(ctx, vals.map(function (v, i) { return [plot2.x(i), plot2.y(v)]; }), k === 0 ? C.terracota : C.cobalto, 2.5);
    ctx.restore();
    D.text(ctx, k === 0 ? "pérdida BCE" : "peso w", plot2.box.x + plot2.box.w - 6, plot2.box.y + 14, { size: 11, align: "right", color: k === 0 ? C.terracotaInk : C.cobaltoInk, weight: 600 });
  });
  function redraw() {
    view.redraw(); view2.redraw();
    var fx = Math.abs(S.w) > 1e-6 ? (-S.b / S.w) : null, ok = accAll(), msg = "";
    if (S.data === "separable" && S.epoch > 200) msg = "<br><span class='bad'>Datos separables: la pérdida sigue bajando hacia 0 y w sigue creciendo sin parar (no existe un mínimo finito).</span>";
    out.set("época <b>" + S.epoch + "</b> · actualizaciones hechas: <b>" + S.updates + "</b> · lr = " + S.lr.toFixed(2) + "<br>" +
      "w = <b>" + S.w.toFixed(3) + "</b> · b = <b>" + S.b.toFixed(3) + "</b> · pérdida BCE = <b>" + lossAll().toFixed(4) + "</b> · accuracy = <b>" + ok + " de 14</b>" + (fx !== null ? " · frontera en <b>" + fx.toFixed(2) + " días</b>" : "") + msg);
  }
  ready = true; reset();
  return { destroy: function () { loop.stop(); } };
});
