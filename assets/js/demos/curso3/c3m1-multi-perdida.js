/* Experimento: modelo con dos salidas (clasificación + regresión). La pérdida total que minimiza fit() es la suma
   ponderada  loss = w_clase·CE + w_valor·MSE.  Si una pérdida es de otra magnitud, domina el entrenamiento. */
Lab.register("curso3/c3m1-multi-perdida", function (root, api) {
  var D = api.d, M = api.math;
  var P = [0.80, 0.55, 0.70, 0.35], R = [0.10, -0.15, 0.08, -0.12];
  var S = { e: 1, wc: 1, ev: 0 };
  var ce = P.reduce(function (a, p) { return a - Math.log(p); }, 0) / P.length, r2 = R.reduce(function (a, r) { return a + r * r; }, 0) / R.length;
  var view = api.view(root, { aspect: 6, minH: 100, maxH: 112, label: "Barra con la parte de la pérdida total que aporta cada salida" });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Tamaño típico del objetivo de regresión (10^e)", min: 0, max: 3, step: 0.1, value: S.e, fmt: function (v) { return "10^" + v.toFixed(1) + " = " + Math.round(Math.pow(10, v)); }, onInput: function (v) { S.e = v; update(); } });
  var swc = ui.slider({ label: "loss_weights de «clase»", min: 0, max: 2, step: 0.05, value: S.wc, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.wc = v; update(); } });
  var sv = ui.slider({ label: "loss_weights de «valor» (10^k)", min: -4, max: 1, step: 0.1, value: S.ev, fmt: function (v) { return "10^" + v.toFixed(1) + " = " + Math.pow(10, v).toPrecision(2); }, onInput: function (v) { S.ev = v; update(); } });
  ui.button("Equilibrar las dos aportaciones", function () {
    var mse = r2 * Math.pow(Math.pow(10, S.e), 2);
    S.ev = M.clamp(Math.round(Math.log10(S.wc * ce / mse) * 10) / 10, -4, 1); sv.set(S.ev, true); update();
  }, "primary");
  ui.button("Pesos 1 y 1 (los de por defecto)", function () { S.wc = 1; S.ev = 0; swc.set(1, true); sv.set(0, true); update(); }, null);

  function calc() {
    var sc = Math.pow(10, S.e), mse = r2 * sc * sc, wv = Math.pow(10, S.ev), a = S.wc * ce, b = wv * mse;
    return { mse: mse, wv: wv, a: a, b: b, tot: a + b };
  }
  function draw(ctx, w, h, C) {
    var c = calc(), x0 = 12, bw = w - 24, y = 34, bh = 38, fa = c.tot > 0 ? c.a / c.tot : 0;
    D.text(ctx, "parte de la pérdida total que «ve» el optimizador", x0, 18, { size: 12, weight: 600, color: C.ink2 });
    D.rect(ctx, x0, y, bw, bh, C.surface, C.ink, 1.6);
    D.rect(ctx, x0, y, bw * fa, bh, C.cobaltoWash, null); D.rect(ctx, x0 + bw * fa, y, bw * (1 - fa), bh, C.terracotaWash, null);
    D.rect(ctx, x0, y, bw, bh, null, C.ink, 1.6);
    if (fa > 0.12) D.text(ctx, "clase " + Math.round(fa * 100) + " %", x0 + bw * fa / 2, y + bh / 2 + 4, { align: "center", size: 12, weight: 700, color: C.cobaltoInk });
    if (fa < 0.88) D.text(ctx, "valor " + Math.round((1 - fa) * 100) + " %", x0 + bw * fa + bw * (1 - fa) / 2, y + bh / 2 + 4, { align: "center", size: 12, weight: 700, color: C.terracotaInk });
    D.text(ctx, "50 %", x0 + bw / 2, y + bh + 14, { align: "center", size: 10, color: C.muted });
    D.line(ctx, x0 + bw / 2, y - 3, x0 + bw / 2, y + bh + 3, C.muted, 1, [3, 3]);
  }
  function update() {
    var c = calc();
    out.set("CE de «clase» (media de −ln p con p = " + P.join(", ") + ") = <b>" + ce.toFixed(3) + "</b> · MSE de «valor» = " + r2.toFixed(5) + " × (10^" + S.e.toFixed(1) + ")² = <b>" + c.mse.toPrecision(4) + "</b><br>" +
      "pérdida total = " + S.wc.toFixed(2) + " × " + ce.toFixed(3) + " + " + c.wv.toPrecision(2) + " × " + c.mse.toPrecision(4) + " = " + c.a.toFixed(3) + " + " + c.b.toPrecision(4) + " = <b>" + c.tot.toPrecision(4) + "</b>" +
      (c.b > 9 * c.a ? "<br><span class='bad'>La regresión domina más del 90 %: el modelo casi ignorará la clasificación.</span>" : c.a > 9 * c.b ? "<br><span class='bad'>La clasificación domina más del 90 %: el modelo casi ignorará el valor.</span>" : "<br><span class='good'>Aportaciones comparables: las dos tareas empujan los pesos compartidos.</span>"));
    view.redraw();
  }
  view.draw(draw); update();
});
