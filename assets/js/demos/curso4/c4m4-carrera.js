/* Experimento: dos copias del mismo modelo p = sigmoide(w·x + b) con el mismo punto de partida.
   Una se entrena con MSE y otra con entropía cruzada (BCE), descenso del gradiente con todos los datos.
   Mismos 14 usuarios (días sin abrir la app -> canceló) y mismas cuentas que el fragmento 11. */
Lab.register("curso4/c4m4-carrera", function (root, api) {
  var M = api.math, D = api.d;
  var X = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 7, 8];
  var Y = [0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1];
  var START = { malo: [-2, 8], neutro: [0, 0], inv: [-2.5, 5] };
  var S = { start: "malo", lr: 0.1, epoch: 0, max: 2000 };
  var A, B, hist, loop, ready = false;

  var view = api.view(root, { aspect: 1.9, minH: 230, maxH: 360, label: "Los 14 usuarios y las dos curvas sigmoides, una entrenada con MSE y otra con entropía cruzada" });
  var plot = api.plot(view, { xr: [0, 9], yr: [-0.2, 1.2], xticks: 9, yticks: 7, xlabel: "días sin abrir la app", ylabel: "p (cancelar)", pad: { l: 40, r: 10, t: 10, b: 36 }, yfmt: function (v) { return (+v.toFixed(1)).toString(); } });
  var view2 = api.view(root, { aspect: 3.4, minH: 150, maxH: 230, label: "Pérdida de entropía cruzada de cada modelo en cada época" });
  var plot2 = api.plot(view2, { xr: [0, S.max], yr: [0, 4], xticks: 4, yticks: 4, xlabel: "época", ylabel: "BCE medida", pad: { l: 46, r: 16, t: 10, b: 34 } });
  api.legend(root, [[api.colors().cobalto, "entrenado con BCE"], [api.colors().terracota, "entrenado con MSE"]]);
  var ui = api.controls(root), out = api.readout(root);
  ui.select({ label: "Punto de partida", value: S.start, options: [["malo", "Confiado y equivocado (w = −2, b = 8)"], ["neutro", "Neutro (w = 0, b = 0)"], ["inv", "Al revés (w = −2.5, b = 5)"]], onChange: function (v) { S.start = v; reset(); } });
  ui.slider({ label: "Learning rate", min: 0.02, max: 1, step: 0.02, value: S.lr, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.lr = v; reset(); } });
  var bPlay = ui.button("Ejecutar", function () { if (loop.running) loop.stop(); else { if (S.epoch >= S.max) reset(); if (api.reduceMotion) { advance(S.max - S.epoch); redraw(); } else loop.start(); } }, "primary");
  ui.button("+ 100 épocas", function () { advance(100); redraw(); });
  ui.button("Volver al inicio", function () { reset(); });

  function sig(z) { return 1 / (1 + Math.exp(-z)); }
  function loss(m, kind) { var s = 0, i, p; for (i = 0; i < X.length; i++) { p = sig(m.w * X[i] + m.b); if (kind === "bce") { p = M.clamp(p, 1e-12, 1 - 1e-12); s -= Y[i] ? Math.log(p) : Math.log(1 - p); } else s += (p - Y[i]) * (p - Y[i]); } return s / X.length; }
  function acc(m) { var ok = 0, i; for (i = 0; i < X.length; i++) if ((sig(m.w * X[i] + m.b) > 0.5) === (Y[i] === 1)) ok++; return ok / X.length; }
  function stepModel(m, kind) {
    var gw = 0, gb = 0, i, p, e;
    for (i = 0; i < X.length; i++) {
      p = sig(m.w * X[i] + m.b);
      e = kind === "bce" ? (p - Y[i]) : 2 * (p - Y[i]) * p * (1 - p);
      gw += e * X[i]; gb += e;
    }
    m.w -= S.lr * gw / X.length; m.b -= S.lr * gb / X.length;
  }
  function record() { hist.push([loss(A, "bce"), loss(B, "bce")]); }
  function advance(n) { var k; for (k = 0; k < n && S.epoch < S.max; k++) { stepModel(A, "bce"); stepModel(B, "mse"); S.epoch++; if (S.epoch % 10 === 0) record(); } }
  function reset() {
    if (loop) loop.stop();
    var s = START[S.start]; A = { w: s[0], b: s[1] }; B = { w: s[0], b: s[1] }; S.epoch = 0; hist = []; record(); hist.idx = 0; redraw();
  }
  loop = api.loop(function () { advance(20); redraw(); return S.epoch < S.max; }, { fps: 20, onState: function (on) { bPlay.textContent = on ? "Pausa" : "Ejecutar"; } });

  view.draw(function (ctx, w, h, C) {
    if (!ready) return;
    plot.axes(ctx); ctx.save(); plot.clip(ctx);
    var i, a = [], b = [], xx;
    D.line(ctx, plot.x(0), plot.y(0.5), plot.x(9), plot.y(0.5), C.line, 1.2, [5, 4]);
    for (i = 0; i <= 90; i++) { xx = 9 * i / 90; a.push([plot.x(xx), plot.y(sig(A.w * xx + A.b))]); b.push([plot.x(xx), plot.y(sig(B.w * xx + B.b))]); }
    D.path(ctx, b, C.terracota, 3); D.path(ctx, a, C.cobalto, 3);
    for (i = 0; i < X.length; i++) D.circle(ctx, plot.x(X[i]), plot.y(Y[i]), 5.5, Y[i] ? C.cobaltoWash : C.terracotaWash, C.ink, 1.8);
    ctx.restore();
  });
  view2.draw(function (ctx, w, h, C) {
    if (!ready) return;
    var mxv = 0; hist.forEach(function (r) { mxv = Math.max(mxv, r[0], r[1]); });
    plot2.yr = [0, mxv <= 4 ? 4 : Math.min(20, Math.ceil(mxv / 2) * 2)];
    plot2.axes(ctx); ctx.save(); plot2.clip(ctx);
    var pa = hist.map(function (r, i) { return [plot2.x(i * 10), plot2.y(r[0])]; }), pb = hist.map(function (r, i) { return [plot2.x(i * 10), plot2.y(r[1])]; });
    D.path(ctx, pb, C.terracota, 2.5); D.path(ctx, pa, C.cobalto, 2.5);
    ctx.restore();
  });
  function redraw() {
    view.redraw(); view2.redraw();
    out.set("época <b>" + S.epoch + "</b> de " + S.max + " · lr = " + S.lr.toFixed(2) + "<br>" +
      "<span style='color:" + api.colors().cobaltoInk + "'>BCE</span>: w = <b>" + A.w.toFixed(3) + "</b>, b = <b>" + A.b.toFixed(3) + "</b> · BCE = <b>" + loss(A, "bce").toFixed(4) + "</b> · accuracy = <b>" + acc(A).toFixed(3) + "</b><br>" +
      "<span style='color:" + api.colors().terracotaInk + "'>MSE</span>: w = <b>" + B.w.toFixed(3) + "</b>, b = <b>" + B.b.toFixed(3) + "</b> · MSE = " + loss(B, "mse").toFixed(4) + " · BCE medida = <b>" + loss(B, "bce").toFixed(4) + "</b> · accuracy = <b>" + acc(B).toFixed(3) + "</b>");
  }
  ready = true; reset();
  return { destroy: function () { loop.stop(); } };
});
