/* Experimento: el argumento training. Dropout y BatchNormalization se comportan distinto al entrenar y al predecir.
   Dropout: apaga unidades al azar y reescala por 1/(1−p) solo con training=True.
   BatchNorm: con training=True normaliza con la media y varianza del LOTE y actualiza sus medias móviles; con training=False usa las medias móviles. */
Lab.register("curso3/c3m1-training", function (root, api) {
  var D = api.d, M = api.math;
  var S = { layer: "drop", train: true, p: 0.5, seed: 1, mom: 0.9, mm: 0, mv: 1, calls: 0, batch: null, outBN: null };
  var HVAL = [1.2, 0.8, 1.6, 0.5, 1.0, 1.9, 0.7, 1.4, 0.9, 1.1];
  var view = api.view(root, { aspect: 2.2, minH: 230, maxH: 320, label: "Activaciones antes y después de la capa, según el valor de training" });
  var ui = api.controls(root), out = api.readout(root);
  ui.segmented({ label: "Capa", value: "drop", options: [["drop", "Dropout"], ["bn", "BatchNormalization"]], onChange: function (v) { S.layer = v; if (v === "bn" && !S.batch) newBatch(); update(); } });
  ui.segmented({ label: "training =", value: true, options: [[true, "True (entrenando)"], [false, "False (prediciendo)"]], onChange: function (v) { S.train = v; if (S.layer === "bn") apply(); update(); } });
  ui.slider({ label: "Dropout: tasa p", min: 0.1, max: 0.8, step: 0.05, value: S.p, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.p = v; update(); } });
  ui.slider({ label: "BatchNorm: momentum", min: 0.5, max: 0.99, step: 0.01, value: S.mom, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.mom = v; } });
  ui.button("Dropout: otra máscara", function () { S.seed++; update(); }, "primary");
  ui.button("BatchNorm: procesar un lote nuevo", function () { S.layer = "bn"; var segs = ui.el.querySelectorAll(".seg")[0].querySelectorAll("button"); segs[0].setAttribute("aria-pressed", "false"); segs[1].setAttribute("aria-pressed", "true"); newBatch(); apply(); update(); }, "primary");
  ui.button("Reiniciar medias móviles", function () { S.mm = 0; S.mv = 1; S.calls = 0; newBatch(); S.outBN = null; update(); }, "warm");

  function mask() { var r = api.rng(S.seed * 101), m = []; for (var i = 0; i < 10; i++) m.push(r.next() >= S.p); return m; }
  function newBatch() { var r = api.rng(900 + S.calls * 13 + S.seed), b = []; for (var i = 0; i < 6; i++) b.push(r.normal(5, 2)); S.batch = b; S.outBN = null; }
  function apply() {
    if (!S.batch) newBatch();
    var b = S.batch, mu = M.mean(b), va = M.std(b) * M.std(b), eps = 1e-3;
    if (S.train) { S.outBN = b.map(function (v) { return (v - mu) / Math.sqrt(va + eps); }); S.mm = S.mom * S.mm + (1 - S.mom) * mu; S.mv = S.mom * S.mv + (1 - S.mom) * va; S.calls++; S.used = "lote"; S.lastMu = mu; S.lastVa = va; }
    else { S.outBN = b.map(function (v) { return (v - S.mm) / Math.sqrt(S.mv + eps); }); S.used = "móviles"; S.lastMu = mu; S.lastVa = va; }
  }
  function f2(v) { return (Math.abs(v) < 0.005 ? 0 : v).toFixed(2).replace("-", "−"); }

  function draw(ctx, w, h, C) {
    if (S.layer === "drop") {
      var m = mask(), n = 10, pad = 30, bw = (w - pad - 12) / n, y0 = h - 40, sc = (h - 90) / 2.6, i;
      D.text(ctx, w < 480 ? "gris: entrada · color: salida · training=" + (S.train ? "True" : "False") : "entrada (gris) y salida (color) de Dropout(" + S.p.toFixed(2) + ") con training=" + (S.train ? "True" : "False"), w / 2, 16, { align: "center", size: w < 480 ? 10.5 : 11.5, weight: 600, color: C.ink2 });
      D.line(ctx, pad, y0, w - 8, y0, C.ink, 1.4);
      for (i = 0; i < n; i++) {
        var x = pad + i * bw, hv = HVAL[i], ov = S.train ? (m[i] ? hv / (1 - S.p) : 0) : hv;
        D.rect(ctx, x + 2, y0 - hv * sc, bw * 0.4 - 1, hv * sc, C.line, C.muted, 1);
        if (ov > 0) D.rect(ctx, x + bw * 0.45, y0 - Math.min(ov, 2.6) * sc, bw * 0.45, Math.min(ov, 2.6) * sc, S.train ? C.terracotaWash : C.olivaWash, S.train ? C.terracota : C.oliva, 1.5);
        else D.text(ctx, "✕", x + bw * 0.67, y0 - 6, { align: "center", size: 13, weight: 700, color: C.terracotaInk });
        D.text(ctx, String(i + 1), x + bw / 2, y0 + 14, { align: "center", size: 10, color: C.muted, mono: true });
        if (ov > 0 && S.train && bw > 24) D.text(ctx, ov.toFixed(1), x + bw * 0.67, y0 - Math.min(ov, 2.6) * sc - 4, { align: "center", size: 9.5, mono: true, color: C.ink2 });
      }
      D.text(ctx, "unidad →", w - 8, y0 + 28, { align: "right", size: 10, color: C.muted });
    } else {
      if (!S.outBN) { apply(); }
      var b = S.batch, o = S.outBN, lo = -3, hi = 10, px = 30, pw = w - px - 14;
      function X(v) { return px + (M.clamp(v, lo, hi) - lo) / (hi - lo) * pw; }
      D.text(ctx, (w < 480 ? "entrada (arriba) y salida (abajo) · training=" : "6 valores de una neurona: entrada (arriba) y salida de BatchNorm (abajo), training=") + (S.train ? "True" : "False"), w / 2, 16, { align: "center", size: w < 480 ? 10.5 : 11.5, weight: 600, color: C.ink2 });
      var ya = h * 0.36, yb = h * 0.74;
      [[ya, "entrada"], [yb, "salida"]].forEach(function (r) { D.line(ctx, px, r[0], px + pw, r[0], C.ink, 1.2); });
      var k; for (k = lo; k <= hi; k += 1) { var tx = X(k); D.line(ctx, tx, ya - 3, tx, ya + 3, C.muted, 1); D.line(ctx, tx, yb - 3, tx, yb + 3, C.muted, 1); if (k % 2 === 0) { D.text(ctx, String(k), tx, ya + 16, { align: "center", size: 9.5, color: C.muted, mono: true }); D.text(ctx, String(k), tx, yb + 16, { align: "center", size: 9.5, color: C.muted, mono: true }); } }
      b.forEach(function (v) { D.circle(ctx, X(v), ya, 5.5, C.cobaltoWash, C.cobalto, 2); });
      o.forEach(function (v) { D.circle(ctx, X(v), yb, 5.5, C.terracotaWash, C.terracota, 2); });
      D.line(ctx, X(M.mean(b)), ya - 12, X(M.mean(b)), ya - 4, C.cobalto, 2.5); D.text(ctx, "media " + f2(M.mean(b)), X(M.mean(b)), ya - 15, { align: "center", size: 10, color: C.cobaltoInk, weight: 600 });
      D.line(ctx, X(M.mean(o)), yb - 12, X(M.mean(o)), yb - 4, C.terracota, 2.5); D.text(ctx, "media " + f2(M.mean(o)), X(M.mean(o)), yb - 15, { align: "center", size: 10, color: C.terracotaInk, weight: 600 });
    }
  }
  function update() {
    var s;
    if (S.layer === "drop") {
      var m = mask(), i, kept = 0, sumIn = 0, sumOut = 0;
      for (i = 0; i < 10; i++) { sumIn += HVAL[i]; if (m[i]) kept++; }
      var avg = 0, N = 2000, r = api.rng(1234);
      for (var q = 0; q < N; q++) { var t = 0; for (i = 0; i < 10; i++) if (r.next() >= S.p) t += HVAL[i] / (1 - S.p); avg += t / N; }
      for (i = 0; i < 10; i++) sumOut += S.train ? (m[i] ? HVAL[i] / (1 - S.p) : 0) : HVAL[i];
      s = S.train ? "<b>training=True</b>: se apagan " + (10 - kept) + " de 10 unidades y las que quedan se multiplican por 1/(1 − p) = " + (1 / (1 - S.p)).toFixed(2) + "<br>Suma de la entrada: " + f2(sumIn) + " · de la salida con esta máscara: <b>" + f2(sumOut) + "</b> · media de la salida con 2000 máscaras distintas: <b>" + f2(avg) + "</b> (≈ la suma de entrada: por eso se reescala)" :
        "<b>training=False</b>: Dropout no hace nada, la salida es idéntica a la entrada (suma " + f2(sumIn) + "). Así <code>predict</code> es determinista.";
    } else {
      if (!S.outBN) apply();
      var b = S.batch, o = S.outBN;
      s = "Lote: media <b>" + f2(M.mean(b)) + "</b>, varianza <b>" + f2(M.std(b) * M.std(b)) + "</b> · medias móviles guardadas: media <b>" + f2(S.mm) + "</b>, varianza <b>" + f2(S.mv) + "</b> (tras " + S.calls + " lotes de entrenamiento)<br>" +
        (S.train ? "<b>training=True</b>: normaliza con las estadísticas del <b>lote</b> → salida con media " + f2(M.mean(o)) + " y desviación " + f2(M.std(o)) + ". Después actualiza las medias móviles: nueva = " + S.mom.toFixed(2) + "·vieja + " + (1 - S.mom).toFixed(2) + "·lote."
          : "<b>training=False</b>: normaliza con las medias móviles (" + f2(S.mm) + " y " + f2(S.mv) + "), no con el lote → salida con media " + f2(M.mean(o)) + " y desviación " + f2(M.std(o)) + ". " + (S.calls < 5 ? "<span class='bad'>Con pocas actualizaciones las medias móviles aún están lejos de (5, 4): la salida no queda normalizada.</span>" : "<span class='good'>Ya se parecen a la media 5 y la varianza 4 de los datos.</span>"));
    }
    out.set(s); view.redraw();
  }
  view.draw(draw); update();
});
