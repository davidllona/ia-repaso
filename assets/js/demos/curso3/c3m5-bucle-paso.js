/* Experimento: un bucle de entrenamiento personalizado, paso a paso.
   Neurona y = w·x + b sobre 8 puntos. Por cada lote: (1) forward dentro de la cinta, (2) pérdida MSE, (3) tape.gradient,
   (4) optimizer.apply_gradients, (5) metrics.Mean.update_state. Al acabar la época: result() y reset_state(). */
Lab.register("curso3/c3m5-bucle-paso", function (root, api) {
  var D = api.d, M = api.math;
  var R0 = api.rng(5), X = [], Y = [], i;
  for (i = 0; i < 8; i++) { var x = -1.75 + i * 0.5; X.push(x); Y.push(2 * x + 1 + R0.normal(0, 0.25)); }
  X = X.map(function (v) { return Math.round(v * 100) / 100; }); Y = Y.map(function (v) { return Math.round(v * 100) / 100; });
  var S = { lr: 0.1, bs: 4, w: 0, b: 0, epoch: 1, batch: 0, ph: -1, tot: 0, cnt: 0, hist: [], cur: null };
  var PH = ["pred", "loss", "tape", "apply", "Mean"];

  function nb() { return X.length / S.bs; }
  function batchIdx() { var r = [], k; for (k = 0; k < S.bs; k++) r.push(S.batch * S.bs + k); return r; }
  function compute() {
    var idx = batchIdx(), pred = [], l = 0, gw = 0, gb = 0;
    idx.forEach(function (k) { var p = S.w * X[k] + S.b; pred.push(p); l += (p - Y[k]) * (p - Y[k]); gw += 2 * (p - Y[k]) * X[k]; gb += 2 * (p - Y[k]); });
    return { idx: idx, pred: pred, loss: l / idx.length, gw: gw / idx.length, gb: gb / idx.length };
  }
  function reset(full) {
    S.w = 0; S.b = 0; S.epoch = 1; S.batch = 0; S.ph = -1; S.tot = 0; S.cnt = 0; S.hist = []; S.cur = null;
    if (full) update();
  }
  function advance() {
    if (S.epoch > 12) return;
    if (S.ph === -1 || S.ph === 4) {                       // empieza un lote nuevo
      if (S.ph === 4) {
        S.batch++;
        if (S.batch >= nb()) {                              // fin de época: result() y reset_state()
          S.hist.push(S.tot / S.cnt); S.epoch++; S.batch = 0; S.tot = 0; S.cnt = 0; S.ph = -1; S.cur = null; return;
        }
      }
      S.ph = 0; S.cur = compute(); return;
    }
    S.ph++;
    var c = S.cur;
    if (S.ph === 3) { S.w -= S.lr * c.gw; S.b -= S.lr * c.gb; }          // apply_gradients
    if (S.ph === 4) { S.tot += c.loss; S.cnt++; }                         // Mean.update_state(loss)
  }

  var vA = api.view(root, { aspect: 1.9, minH: 230, maxH: 330, label: "Datos, recta actual y lote en curso" });
  var pA = api.plot(vA, { xr: [-2, 2], yr: [-3, 6], xticks: 4, yticks: 3, xlabel: "x", ylabel: "y", pad: { l: 34, r: 12, t: 30, b: 32 }, xfmt: function (v) { return +v.toFixed(0); }, yfmt: function (v) { return Math.round(v); } });
  var vB = api.view(root, { aspect: 4.2, minH: 100, maxH: 150, label: "Pérdida media (Mean.result) al final de cada época" });
  var pB = api.plot(vB, { xr: [0, 12], yr: [0, 1], xticks: 6, yticks: 2, xlabel: "época", pad: { l: 40, r: 12, t: 12, b: 32 } });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "learning rate", min: 0.02, max: 0.4, step: 0.02, value: S.lr, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.lr = v; update(); } });
  ui.segmented({ label: "batch_size", value: 4, options: [[2, "2"], [4, "4"], [8, "8"]], onChange: function (v) { S.bs = v; reset(true); } });
  ui.button("Paso ▶", function () { advance(); update(); }, "primary");
  ui.button("Lote entero", function () {
    var e = S.epoch; if (S.ph === 4 || S.ph === -1) advance(); while (S.ph !== 4 && S.epoch === e) advance(); update();
  });
  ui.button("Época entera", function () { var e = S.epoch; while (S.epoch === e && S.epoch <= 12) advance(); update(); }, "warm");
  ui.button("Reiniciar", function () { reset(true); });

  function f2(v) { return (Math.abs(v) < 0.005 ? 0 : v).toFixed(2).replace("-", "−"); }
  function drawA(ctx, w, h, C) {
    pA.axes(ctx);
    var bx = pA.box, k, cur = S.cur, inB = {};
    if (cur && S.ph >= 0) cur.idx.forEach(function (q) { inB[q] = true; });
    ctx.save(); pA.clip(ctx);
    if (cur && S.ph >= 0 && S.ph <= 1) cur.idx.forEach(function (q) { var p = (S.ph >= 0 ? cur.pred[cur.idx.indexOf(q)] : 0); D.line(ctx, pA.x(X[q]), pA.y(Y[q]), pA.x(X[q]), pA.y(p), C.terracota, 2); });
    D.line(ctx, pA.x(-2), pA.y(S.w * -2 + S.b), pA.x(2), pA.y(S.w * 2 + S.b), C.cobalto, 2.5);
    D.line(ctx, pA.x(-2), pA.y(-4 + 1), pA.x(2), pA.y(5), C.line, 1, [4, 4]);
    ctx.restore();
    for (k = 0; k < X.length; k++) {
      if (inB[k]) D.circle(ctx, pA.x(X[k]), pA.y(Y[k]), 6, C.terracota, C.ink, 1.5);
      else D.circle(ctx, pA.x(X[k]), pA.y(Y[k]), 5, C.paper, C.muted, 1.8);
    }
    var cw = bx.w / PH.length, j;
    for (j = 0; j < PH.length; j++) {
      var on = S.ph === j, done = S.ph > j;
      D.rect(ctx, bx.x + j * cw + 2, 6, cw - 4, 20, on ? C.terracota : (done ? C.olivaWash : C.surface), on ? C.ink : C.line, on ? 2 : 1);
      D.text(ctx, (j + 1) + " " + PH[j], bx.x + j * cw + cw / 2, 20, { align: "center", size: w < 420 ? 10 : 11.5, weight: on ? 700 : 500, color: on ? C.paper : C.ink2, mono: true });
    }
    D.text(ctx, "discontinua: y = 2x + 1 (la verdad)", bx.x + 6, bx.y + 14, { size: 10.5, color: C.muted });
    D.text(ctx, "y = " + f2(S.w) + "·x + " + f2(S.b), bx.x + bx.w - 6, bx.y + bx.h - 8, { align: "right", size: 12, color: C.cobaltoInk, weight: 600, mono: true });
  }
  function drawB(ctx, w, h, C) {
    pB.yr = [0, Math.max(1, S.hist.length ? S.hist[0] * 1.1 : 1)];
    pB.axes(ctx);
    var pts = S.hist.map(function (v, k) { return [pB.x(k + 1), pB.y(v)]; });
    D.path(ctx, pts, C.cobalto, 2.4);
    S.hist.forEach(function (v, k) { D.circle(ctx, pB.x(k + 1), pB.y(v), 3.5, C.cobalto); });
    D.text(ctx, "Mean.result() al acabar cada época", pB.box.x + pB.box.w - 4, pB.box.y + 12, { align: "right", size: 10.5, color: C.muted });
  }
  vA.draw(drawA); vB.draw(drawB);

  function update() {
    var c = S.cur, ph = S.ph, s = "";
    var head = "Época <b>" + Math.min(S.epoch, 12) + "</b> · lote <b>" + (S.batch + 1) + "/" + nb() + "</b> · w = <b>" + f2(S.w) + "</b>, b = <b>" + f2(S.b) + "</b> · pasos del optimizador: <b>" + ((S.epoch - 1) * nb() + S.batch + (ph >= 3 ? 1 : 0)) + "</b><br>";
    if (S.epoch > 12) s = "<b>12 épocas completadas.</b> Pulsa «Reiniciar» para empezar de nuevo.";
    else if (ph === -1) s = "Todo listo. Metric <code>Mean</code> a cero (total = 0, count = 0). Pulsa <b>Paso ▶</b>: se abre la cinta para el lote " + (S.batch + 1) + ".";
    else {
      var xs = c.idx.map(function (k) { return f2(X[k]); }).join(", "), ys = c.idx.map(function (k) { return f2(Y[k]); }).join(", ");
      if (ph === 0) s = "<b>1 · Forward</b> (dentro de <code>with tf.GradientTape()</code>). x = [" + xs + "] → pred = w·x + b = [" + c.pred.map(f2).join(", ") + "]";
      if (ph === 1) s = "<b>2 · Pérdida</b> (MSE del lote). y = [" + ys + "], pred = [" + c.pred.map(f2).join(", ") + "] → media de los errores² = <b>" + f2(c.loss) + "</b>";
      if (ph === 2) s = "<b>3 · <code>tape.gradient</code></b>: ∂L/∂w = media(2·(pred−y)·x) = <b>" + f2(c.gw) + "</b> · ∂L/∂b = media(2·(pred−y)) = <b>" + f2(c.gb) + "</b>";
      if (ph === 3) s = "<b>4 · <code>apply_gradients</code></b> (η = " + S.lr.toFixed(2) + "): w ← w − η·∂L/∂w, b ← b − η·∂L/∂b. Ahora w = <b>" + f2(S.w) + "</b>, b = <b>" + f2(S.b) + "</b>";
      if (ph === 4) s = "<b>5 · <code>Mean.update_state(loss)</code></b>: total = " + f2(S.tot) + " (+" + f2(c.loss) + "), count = " + S.cnt + " → <code>result()</code> parcial = <b>" + f2(S.tot / S.cnt) + "</b>. " + (S.batch + 1 >= nb() ? "Era el último lote: el siguiente paso cierra la época (<code>result()</code> y <code>reset_state()</code>)." : "Siguiente paso: lote " + (S.batch + 2) + ".");
    }
    var last = S.hist.length ? "<br>Pérdida media de la última época cerrada: <b>" + f2(S.hist[S.hist.length - 1]) + "</b>" : "";
    out.set(head + s + last);
    vA.redraw(); vB.redraw();
  }
  update();
});
