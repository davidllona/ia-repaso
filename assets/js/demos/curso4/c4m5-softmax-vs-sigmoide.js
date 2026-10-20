/* Experimento: multiclase (una sola clase correcta → softmax + CrossEntropyLoss) frente a multi-etiqueta
   (cada etiqueta es sí/no por separado → una sigmoide por salida + BCEWithLogitsLoss). Mismos logits, dos lecturas. */
Lab.register("curso4/c4m5-softmax-vs-sigmoide", function (root, api) {
  var D = api.d, M = api.math, K = 3, NAMES = ["playa", "perro", "noche"];
  var S = { z: [2, -1, 0.5], th: 0.5 };
  var view = api.view(root, { aspect: 2.3, minH: 165, maxH: 220, label: "Probabilidades de softmax y de sigmoide para tres etiquetas de una foto" });
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.68rem, 2.5vw, .8rem)";
  var sl = [0, 1, 2].map(function (k) {
    return ui.slider({ label: "logit z" + k + " (" + NAMES[k] + ")", min: -4, max: 4, step: 0.1, value: S.z[k], fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.z[k] = v; update(); } });
  });
  ui.slider({ label: "umbral de la sigmoide", min: 0.1, max: 0.9, step: 0.05, value: S.th, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.th = v; update(); } });
  ui.button("Playa y perro a la vez (3, 2.5, −3)", function () { S.z = [3, 2.5, -3]; sl.forEach(function (q, k) { q.set(S.z[k], true); }); update(); });
  view.draw(function (ctx, w, h, C) {
    var ps = M.softmax(S.z), pg = S.z.map(M.sigmoid), k, x0 = 56, pw = (w - x0 - 8) / 2, bh = Math.min(28, (h - 66) / K - 8);
    D.text(ctx, "softmax: reparte 1", x0 + pw / 2 - 4, 16, { size: 11, weight: 700, align: "center", color: C.cobaltoInk });
    D.text(ctx, "sigmoide: cada una sola", x0 + pw + pw / 2 + 4, 16, { size: 11, weight: 700, align: "center", color: C.terracotaInk });
    for (k = 0; k < K; k++) {
      var y = 28 + k * (bh + 10), wmax = pw - 50;
      D.text(ctx, NAMES[k], x0 - 6, y + bh / 2 + 4, { size: 11, weight: 700, align: "right" });
      D.rect(ctx, x0, y, wmax, bh, C.surface, C.line, 1); D.rect(ctx, x0, y, Math.max(1, wmax * ps[k]), bh, C.cobalto);
      D.text(ctx, ps[k].toFixed(3), x0 + wmax + 3, y + bh / 2 + 4, { size: 10, mono: true });
      var x1 = x0 + pw + 8;
      D.rect(ctx, x1, y, wmax, bh, C.surface, C.line, 1); D.rect(ctx, x1, y, Math.max(1, wmax * pg[k]), bh, pg[k] >= S.th ? C.terracota : C.muted);
      D.line(ctx, x1 + wmax * S.th, y - 3, x1 + wmax * S.th, y + bh + 3, C.ink, 1.4, [3, 2]);
      D.text(ctx, pg[k].toFixed(3), x1 + wmax + 3, y + bh / 2 + 4, { size: 10, mono: true });
    }
    var yb = 28 + K * (bh + 10) + 6;
    D.text(ctx, "suma = " + M.sum(ps).toFixed(3), x0 + pw / 2 - 4, yb + 10, { size: 12, mono: true, weight: 700, align: "center", color: C.cobaltoInk });
    D.text(ctx, "suma = " + M.sum(pg).toFixed(3), x0 + pw + pw / 2 + 4, yb + 10, { size: 12, mono: true, weight: 700, align: "center", color: C.terracotaInk });
  });
  function update() {
    var ps = M.softmax(S.z), pg = S.z.map(M.sigmoid), best = 0, k, on = [];
    for (k = 1; k < K; k++) if (ps[k] > ps[best]) best = k;
    for (k = 0; k < K; k++) if (pg[k] >= S.th) on.push(NAMES[k]);
    out.set("softmax + argmax → una sola etiqueta: <b>" + NAMES[best] + "</b> (suma de p = " + M.sum(ps).toFixed(3) + ")<br>" +
      "sigmoide + umbral " + S.th.toFixed(2) + " → <b>" + (on.length ? on.join(" + ") : "ninguna etiqueta") + "</b> (suma de p = " + M.sum(pg).toFixed(3) + ", puede ser cualquier cosa entre 0 y " + K + ")");
    view.redraw();
  }
  update();
});
