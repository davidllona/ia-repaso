/* Experimento: modelo de regresión logística con UNA variable. p = sigmoide(w·x + b).
   14 alumnos (horas de estudio -> aprobó 0/1). Se mueven w, b y el umbral, se compara con la recta
   de mínimos cuadrados y se hace clic para probar un alumno nuevo. Mismos datos que el fragmento 2. */
Lab.register("curso4/c4m4-sigmoide-1d", function (root, api) {
  var M = api.math, D = api.d;
  var X = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 7, 8];
  var Y = [0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1];
  var S = { w: 0.6, b: -2.0, u: 0.5, xn: 6.0, lin: false };

  var view = api.view(root, { aspect: 1.75, minH: 250, maxH: 400, drag: true, label: "Curva sigmoide sobre los 14 alumnos, con el umbral y la frontera de decisión" });
  var plot = api.plot(view, { xr: [0, 9], yr: [-0.2, 1.2], xticks: 9, yticks: 7, xlabel: "horas de estudio (x)", ylabel: "probabilidad de aprobar", pad: { l: 50, r: 12, t: 12, b: 38 }, yfmt: function (v) { return (+v.toFixed(1)).toString(); } });
  var ui = api.controls(root), out = api.readout(root);

  var sW = ui.slider({ label: "w (peso)", min: -1, max: 4, step: 0.05, value: S.w, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.w = v; update(); } });
  var sB = ui.slider({ label: "b (sesgo)", min: -14, max: 6, step: 0.1, value: S.b, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.b = v; update(); } });
  var sU = ui.slider({ label: "Umbral de decisión", min: 0.05, max: 0.95, step: 0.05, value: S.u, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.u = v; update(); } });
  ui.button("Ajustar con entropía cruzada", function () { var f = fit(); S.w = f.w; S.b = f.b; sW.set(Math.min(4, f.w), true); sB.set(f.b, true); update(); }, "primary");
  ui.button("Un modelo al revés (w negativo)", function () { S.w = -0.6; S.b = 3; sW.set(S.w, true); sB.set(S.b, true); update(); });
  ui.toggle({ label: "Mostrar la recta de mínimos cuadrados", value: S.lin, onChange: function (v) { S.lin = v; update(); } });

  function sig(z) { return 1 / (1 + Math.exp(-z)); }
  function line() { return M.linreg(X, Y); }
  function bce(w, b) { var s = 0, i, p; for (i = 0; i < X.length; i++) { p = M.clamp(sig(w * X[i] + b), 1e-12, 1 - 1e-12); s -= Y[i] ? Math.log(p) : Math.log(1 - p); } return s / X.length; }
  /* Newton-Raphson sobre la entropía cruzada (el mínimo exacto) */
  function fit() {
    var w = 0, b = 0, k, i;
    for (k = 0; k < 60; k++) {
      var gw = 0, gb = 0, hww = 0, hwb = 0, hbb = 0;
      for (i = 0; i < X.length; i++) { var p = sig(w * X[i] + b), e = p - Y[i], s = p * (1 - p); gw += e * X[i]; gb += e; hww += s * X[i] * X[i]; hwb += s * X[i]; hbb += s; }
      var det = hww * hbb - hwb * hwb;
      w -= (hbb * gw - hwb * gb) / det; b -= (hww * gb - hwb * gw) / det;
    }
    return { w: w, b: b };
  }
  function acc() { var ok = 0, i; for (i = 0; i < X.length; i++) if ((sig(S.w * X[i] + S.b) >= S.u) === (Y[i] === 1)) ok++; return ok; }
  function frontera() { return S.w === 0 ? null : (Math.log(S.u / (1 - S.u)) - S.b) / S.w; }

  view.draw(function (ctx, w, h, C) {
    plot.axes(ctx);
    ctx.save(); plot.clip(ctx);
    var bx = plot.box, i, pts = [];
    D.line(ctx, bx.x, plot.y(0), bx.x + bx.w, plot.y(0), C.line, 1.5);
    D.line(ctx, bx.x, plot.y(1), bx.x + bx.w, plot.y(1), C.line, 1.5);
    D.line(ctx, bx.x, plot.y(S.u), bx.x + bx.w, plot.y(S.u), C.olivaInk, 1.5, [5, 4]);
    var fx = frontera();
    if (fx !== null && fx > 0 && fx < 9) D.line(ctx, plot.x(fx), bx.y, plot.x(fx), bx.y + bx.h, C.ink2, 1.5, [2, 4]);
    if (S.lin) {
      var L = line();
      D.line(ctx, plot.x(0), plot.y(L.b), plot.x(9), plot.y(L.b + L.m * 9), C.oliva, 2.5);
    }
    for (i = 0; i <= 120; i++) { var xx = 9 * i / 120; pts.push([plot.x(xx), plot.y(sig(S.w * xx + S.b))]); }
    D.path(ctx, pts, C.ink, 3);
    for (i = 0; i < X.length; i++) {
      var good = (sig(S.w * X[i] + S.b) >= S.u) === (Y[i] === 1);
      D.circle(ctx, plot.x(X[i]), plot.y(Y[i]), 6.5, Y[i] ? C.cobalto : C.terracota, good ? C.paper : C.ink, good ? 1.5 : 3);
    }
    // alumno nuevo
    var pn = sig(S.w * S.xn + S.b);
    D.line(ctx, plot.x(S.xn), plot.y(0), plot.x(S.xn), plot.y(pn), C.marker, 2, [3, 3]);
    D.circle(ctx, plot.x(S.xn), plot.y(pn), 7, C.marker, C.ink, 2.5);
    ctx.restore();
    D.text(ctx, "aprobó", bx.x + 6, plot.y(1) - 7, { size: 11, color: C.cobaltoInk, weight: 600 });
    D.text(ctx, "suspendió", bx.x + 6, plot.y(0) + 16, { size: 11, color: C.terracotaInk, weight: 600 });
  });

  function update() {
    var z = S.w * S.xn + S.b, p = sig(z), fx = frontera(), a = acc(), L = line();
    out.set("w = <b>" + S.w.toFixed(2) + "</b> · b = <b>" + S.b.toFixed(2) + "</b> · pérdida BCE = <b>" + bce(S.w, S.b).toFixed(3) + "</b> · aciertos con umbral " + S.u.toFixed(2) + ": <b>" + a + " de 14</b><br>" +
      "Frontera (p = umbral): " + (fx === null ? "no existe (w = 0)" : "x = <b>" + fx.toFixed(2) + " h</b>") + (S.w < 0 ? " · <span class='bad'>w negativo: más horas, MENOS probabilidad</span>" : "") + "<br>" +
      "Alumno nuevo (" + S.xn.toFixed(1) + " h): z = " + S.w.toFixed(2) + "·" + S.xn.toFixed(1) + " + (" + S.b.toFixed(2) + ") = <b>" + z.toFixed(2) + "</b> → p = σ(z) = <b>" + p.toFixed(3) + "</b> → odds = " + (p / (1 - p)).toFixed(2) + " → clase <b>" + (p >= S.u ? 1 : 0) + "</b>" +
      (S.lin ? "<br>La recta de mínimos cuadrados daría <span class='bad'>" + (L.b + L.m * S.xn).toFixed(3) + "</span> (y con 0 h daría " + L.b.toFixed(3) + ")." : ""));
    view.redraw();
  }
  view.pointer({ down: function (px, py) { if (plot.inside(px, py)) { S.xn = M.clamp(Math.round(plot.ix(px) * 10) / 10, 0, 9); update(); } },
    drag: function (px, py) { if (plot.inside(px, py)) { S.xn = M.clamp(Math.round(plot.ix(px) * 10) / 10, 0, 9); update(); } } });
  update();
});
