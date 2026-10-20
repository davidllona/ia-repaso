/* Experimento: EarlyStopping + ReduceLROnPlateau sobre una curva de validación REAL.
   Se entrena de verdad (SGD con mini-batches) un polinomio de grado 8 sobre 20 puntos con ruido; cada época se mide
   la pérdida de entrenamiento y la de validación (80 puntos), y los dos callbacks aplican exactamente la lógica de Keras. */
Lab.register("curso3/c3m5-parada-lr", function (root, api) {
  var D = api.d, C0 = api.colors();
  var NMAX = 150, DEG = 9, BATCH = 4, MINLR = 0.002;
  var S = { seed: 1, lr0: 0.5, es: true, esPat: 12, restore: true, rl: true, rlPat: 5, rlFac: 0.5 };
  var data = null, run = null;

  function makeData() {
    var R = api.rng(S.seed * 101 + 7), tr = [], va = [], i;
    for (i = 0; i < 20; i++) { var x = -1 + 2 * i / 19; tr.push([x, Math.sin(3 * x) + R.normal(0, 0.3)]); }
    for (i = 0; i < 80; i++) { var xv = -1 + 2 * R.next(); va.push([xv, Math.sin(3 * xv) + R.normal(0, 0.3)]); }
    data = { tr: tr, va: va, R: R };
  }
  function feat(x) { var r = [], p = 1; for (var k = 0; k < DEG; k++) { r.push(p); p *= x; } return r; }
  function mse(w, set) {
    var s = 0;
    for (var i = 0; i < set.length; i++) { var ph = feat(set[i][0]), p = 0; for (var k = 0; k < DEG; k++) p += w[k] * ph[k]; s += (p - set[i][1]) * (p - set[i][1]); }
    return s / set.length;
  }
  function train() {
    var w = new Array(DEG).fill(0), lr = S.lr0, R = api.rng(S.seed * 31 + 5), tr = data.tr;
    var out = [], best = Infinity, bestE = -1, wait = 0, rlBest = Infinity, rlWait = 0, bestW = null, reds = [], stopAt = -1, e, b, k, i;
    for (e = 0; e < NMAX; e++) {
      var idx = R.shuffle(tr.map(function (_, j) { return j; }));
      for (b = 0; b < tr.length; b += BATCH) {
        var bs = idx.slice(b, b + BATCH), g = new Array(DEG).fill(0);
        for (i = 0; i < bs.length; i++) {
          var pt = tr[bs[i]], ph = feat(pt[0]), p = 0;
          for (k = 0; k < DEG; k++) p += w[k] * ph[k];
          for (k = 0; k < DEG; k++) g[k] += 2 * (p - pt[1]) * ph[k] / bs.length;
        }
        for (k = 0; k < DEG; k++) w[k] -= lr * g[k];
      }
      var l = mse(w, tr), v = mse(w, data.va);
      if (!isFinite(v) || v > 1e6) { out.push([Math.min(l, 1e6), 1e6, lr]); }
      else out.push([l, v, lr]);
      if (v < best) { best = v; bestE = e; wait = 0; bestW = w.slice(); } else wait++;
      if (S.rl) {
        if (v < rlBest - 1e-4) { rlBest = v; rlWait = 0; }
        else { rlWait++; if (rlWait >= S.rlPat && lr > MINLR) { lr = Math.max(MINLR, lr * S.rlFac); rlWait = 0; reds.push(e); } }
      }
      if (S.es && wait >= S.esPat) { stopAt = e; break; }
    }
    run = { out: out, bestE: bestE, best: best, reds: reds, stopAt: stopAt, n: out.length };
  }

  var vL = api.view(root, { aspect: 2.0, minH: 220, maxH: 340, label: "Pérdida de entrenamiento y de validación por época, con las reducciones del learning rate y la parada" });
  var optL = { xr: [0, NMAX], yr: [0, 0.6], xticks: 5, yticks: 4, xfmt: function (v) { return Math.round(v); }, xlabel: "época", pad: { l: 40, r: 12, t: 14, b: 34 }, yfmt: function (v) { return v.toFixed(1); } };
  var pL = api.plot(vL, optL);
  var vR = api.view(root, { aspect: 7, minH: 70, maxH: 100, label: "Learning rate por época" });
  var optR = { xr: [0, NMAX], yr: [-3, 0], xticks: 5, yticks: 3, grid: true, pad: { l: 40, r: 12, t: 8, b: 8 }, xfmt: function () { return ""; }, yfmt: function (v) { return String(Math.pow(10, Math.round(v))); } };
  var pR = api.plot(vR, optR);
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Learning rate inicial", min: 0.05, max: 0.8, step: 0.05, value: S.lr0, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.lr0 = v; update(); } });
  ui.slider({ label: "EarlyStopping · patience", min: 1, max: 40, step: 1, value: S.esPat, onInput: function (v) { S.esPat = v; update(); } });
  ui.slider({ label: "ReduceLROnPlateau · patience", min: 1, max: 15, step: 1, value: S.rlPat, onInput: function (v) { S.rlPat = v; update(); } });
  ui.slider({ label: "ReduceLROnPlateau · factor", min: 0.2, max: 0.9, step: 0.1, value: S.rlFac, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.rlFac = v; update(); } });
  ui.toggle({ label: "EarlyStopping", value: S.es, onChange: function (v) { S.es = v; update(); } });
  ui.toggle({ label: "restore_best_weights", value: S.restore, onChange: function (v) { S.restore = v; update(); } });
  ui.toggle({ label: "ReduceLROnPlateau", value: S.rl, onChange: function (v) { S.rl = v; update(); } });
  ui.button("Otro ruido (otra semilla)", function () { S.seed = S.seed % 6 + 1; makeData(); update(); });
  api.legend(root, [[C0.cobalto, "pérdida de entrenamiento"], [C0.terracota, "pérdida de validación"], [C0.oliva, "mejor época"]]);

  function drawL(ctx, w, h, C) {
    pL.axes(ctx);
    if (!run) return;
    var bx = pL.box, i, k;
    ctx.save(); pL.clip(ctx);
    for (k = 0; k < run.reds.length; k++) D.line(ctx, pL.x(run.reds[k] + 1), bx.y, pL.x(run.reds[k] + 1), bx.y + bx.h, C.muted, 1, [3, 3]);
    function curve(idx, col) {
      var pts = [];
      for (i = 0; i < run.n; i++) pts.push([pL.x(i + 1), pL.y(Math.min(run.out[i][idx], 0.62))]);
      D.path(ctx, pts, col, 2);
    }
    curve(0, C.cobalto); curve(1, C.terracota);
    ctx.restore();
    var bE = run.bestE;
    D.circle(ctx, pL.x(bE + 1), pL.y(run.out[bE][1]), 5, C.oliva, C.ink, 1.5);
    if (run.stopAt >= 0) {
      D.line(ctx, pL.x(run.stopAt + 1), bx.y, pL.x(run.stopAt + 1), bx.y + bx.h, C.ink, 2);
      D.text(ctx, "para", pL.x(run.stopAt + 1) - 4, bx.y + 12, { align: "right", size: 11, weight: 700, color: C.ink });
    }
    D.text(ctx, "líneas de puntos = el learning rate se reduce", bx.x + bx.w - 4, bx.y + bx.h - 6, { align: "right", size: 10.5, color: C.muted });
  }
  function drawR(ctx, w, h, C) {
    pR.axes(ctx);
    if (!run) return;
    var pts = [], i;
    ctx.save(); pR.clip(ctx);
    for (i = 0; i < run.n; i++) pts.push([pR.x(i + 1), pR.y(Math.log10(run.out[i][2]))]);
    D.path(ctx, pts, C.cobalto, 2.4);
    ctx.restore();
    D.text(ctx, "learning rate (escala log)", pR.box.x + pR.box.w - 6, pR.box.y + pR.box.h - 6, { align: "right", size: 10.5, color: C.muted });
  }
  vL.draw(drawL); vR.draw(drawR);

  function update() {
    train();
    var want = Math.max(20, run.n + 2), step = want <= 40 ? 5 : (want <= 80 ? 10 : 25), xmax = Math.ceil(want / step) * step;
    pL.xr = [0, xmax]; pR.xr = pL.xr; optL.xticks = xmax / step; optR.xticks = xmax / step;
    var r = run, last = r.out[r.n - 1][1], bestv = r.out[r.bestE][1];
    var shown = (S.es && S.restore) ? bestv : last;
    var txt = "<b>Épocas entrenadas:</b> " + r.n + (r.stopAt >= 0 ? " (EarlyStopping paró en la época " + (r.stopAt + 1) + ")" : " (sin parada: se llegó al tope de " + NMAX + ")") +
      "<br><b>Mejor val_loss:</b> " + bestv.toFixed(3) + " en la época " + (r.bestE + 1) +
      "<br><b>val_loss del modelo que te quedas:</b> <span class='" + (shown <= bestv + 1e-9 ? "good" : "bad") + "'>" + shown.toFixed(3) + "</span>" +
      (S.es && S.restore ? " (pesos restaurados de la época " + (r.bestE + 1) + ")" : " (pesos de la última época, la " + r.n + ")") +
      "<br><b>Reducciones de lr:</b> " + r.reds.length + " · lr final = " + r.out[r.n - 1][2].toFixed(3);
    out.set(txt);
    vL.redraw(); vR.redraw();
  }
  makeData(); update();
});
