/* Experimento: matriz de confusión del proyecto según el umbral. Probabilidades REALES de un modelo Keras entrenado con las imágenes sintéticas (60 de test). */
Lab.register("curso2/c2m5-matriz-confusion", function (root, api) {
  var PROB = [0.18, 0.001, 0.0, 0.003, 0.462, 0.0, 0.107, 0.659, 0.0, 0.526, 0.006, 0.0, 0.0, 0.007, 0.0, 0.0, 0.134, 0.691, 0.031, 0.0, 0.903, 0.034, 0.584, 0.001, 0.665, 0.262, 0.0, 0.001, 0.001, 0.0, 0.943, 0.942, 0.939, 0.902, 0.938, 0.946, 0.835, 0.949, 0.947, 0.709, 0.953, 0.947, 0.952, 0.936, 0.945, 0.94, 0.94, 0.929, 0.9, 0.945, 0.947, 0.658, 0.925, 0.934, 0.584, 0.851, 0.941, 0.945, 0.952, 0.896], REAL = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], th = 0.5, N = PROB.length;
  var view = api.view(root, { aspect: 1.6, minH: 320, maxH: 340, drag: true, label: "Probabilidades predichas para 60 imágenes de test y matriz de confusión" });
  var ui = api.controls(root), out = api.readout(root), sl;
  sl = ui.slider({ label: "Umbral de decisión", min: 0.05, max: 0.95, step: 0.05, value: th, fmt: function (v) { return v.toFixed(2).replace(".", ","); }, onInput: function (v) { th = v; update(); } });
  function counts() { var tn = 0, fp = 0, fn = 0, tp = 0; PROB.forEach(function (p, i) { var pred = p > th ? 1 : 0; if (REAL[i] === 1) { pred ? tp++ : fn++; } else { pred ? fp++ : tn++; } }); return { tn: tn, fp: fp, fn: fn, tp: tp }; }
  var jit = api.rng(6), J = PROB.map(function () { return jit.next(); });
  view.draw(function (ctx, w, h, C) {
    var m = counts(), x0 = 40, x1 = w - 14, X = function (p) { return x0 + p * (x1 - x0); };
    var rowH = 34, rowPitch = rowH + 18, y0 = 32, bottom = y0 + rowPitch + rowH, mid = bottom + 2;
    api.d.text(ctx, "Probabilidad que da el modelo de que sea «dent» (1)", x0, 14, { size: 11, weight: 600, color: C.ink2 });
    [["real: crack", 0, C.terracota], ["real: dent", 1, C.cobalto]].forEach(function (r) {
      var yy = y0 + r[1] * rowPitch;
      api.d.rect(ctx, x0, yy, x1 - x0, rowH, C.surface, C.line, 1);
      api.d.text(ctx, r[0], x0, yy - 5, { size: 10, color: C.muted });
    });
    PROB.forEach(function (p, i) { var yy = y0 + REAL[i] * rowPitch + 8 + J[i] * (rowH - 16); api.d.circle(ctx, X(p), yy, 3.4, REAL[i] ? C.cobalto : C.terracota); });
    api.d.line(ctx, X(th), y0 - 2, X(th), bottom + 2, C.ink, 2);
    [0, 0.5, 1].forEach(function (t) { api.d.text(ctx, String(t).replace(".", ","), X(t), bottom + 16, { size: 10, align: "center", color: C.muted, mono: true }); });
    /* matriz */
    var gy = mid + 52, cw = Math.min(110, (w - 120) / 2), ch = Math.min(64, (h - gy - 10) / 2), gx = (w - 2 * cw) / 2 + 30;
    api.d.text(ctx, "Predicho: crack", gx + cw / 2, gy - 8, { size: 10.5, align: "center", color: C.ink2, weight: 600 });
    api.d.text(ctx, "Predicho: dent", gx + cw * 1.5, gy - 8, { size: 10.5, align: "center", color: C.ink2, weight: 600 });
    api.d.text(ctx, "Real: crack", gx - 6, gy + ch / 2 + 4, { size: 10.5, align: "right", color: C.ink2, weight: 600 });
    api.d.text(ctx, "Real: dent", gx - 6, gy + ch * 1.5 + 4, { size: 10.5, align: "right", color: C.ink2, weight: 600 });
    [[m.tn, 0, 0, true], [m.fp, 1, 0, false], [m.fn, 0, 1, false], [m.tp, 1, 1, true]].forEach(function (c) {
      var okc = c[3], col = okc ? C.oliva : C.terracota, a = Math.min(1, c[0] / 30);
      api.d.rect(ctx, gx + c[1] * cw, gy + c[2] * ch, cw - 4, ch - 4, C.surface, col, 2);
      ctx.save(); ctx.globalAlpha = 0.12 + 0.5 * a; api.d.rect(ctx, gx + c[1] * cw, gy + c[2] * ch, cw - 4, ch - 4, col); ctx.restore();
      api.d.text(ctx, String(c[0]), gx + c[1] * cw + (cw - 4) / 2, gy + c[2] * ch + (ch - 4) / 2 + 8, { size: 24, align: "center", weight: 700, color: C.ink, mono: true });
    });
  });
  view.pointer({ down: mv, drag: mv });
  function mv(px) { var x0 = 40, x1 = view.w - 14, v = Math.round(((px - x0) / (x1 - x0)) * 20) / 20; v = Math.max(0.05, Math.min(0.95, v)); sl.set(v); }
  function f(v) { return (100 * v).toFixed(1).replace(".", ",") + " %"; }
  function update() {
    view.redraw();
    var m = counts(), acc = (m.tn + m.tp) / N, pr = m.tp + m.fp ? m.tp / (m.tp + m.fp) : 0, rc = m.tp / (m.tp + m.fn);
    out.set("Umbral <b>" + th.toFixed(2).replace(".", ",") + "</b> · aciertos " + (m.tn + m.tp) + " de " + N + " → accuracy <b>" + f(acc) + "</b><br>" +
      "Precision de «dent» = " + m.tp + "/" + (m.tp + m.fp) + " = <b>" + f(pr) + "</b> · recall de «dent» = " + m.tp + "/" + (m.tp + m.fn) + " = <b>" + f(rc) + "</b>");
  }
  update();
  sl.set(th, true);
});
