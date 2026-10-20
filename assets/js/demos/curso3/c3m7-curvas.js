/* Experimento: leer curvas de aprendizaje. Se entrena de verdad (Adam) una red de una capa oculta sobre 25 puntos con ruido
   y se mide cada época la pérdida de train y la de validación (100 puntos). Con EarlyStopping se ve cuándo se pararía y
   qué diagnóstico sale de las curvas: sobreajuste, infraajuste, learning rate demasiado alto o ajuste sano. */
Lab.register("curso3/c3m7-curvas", function (root, api) {
  var D = api.d, M = api.math;
  var NMAX = 400, SIG = 0.3;
  var S = { H: 40, l2: 0, lr: 0.02, pat: 25, seed: 1, es: false };
  var L2V = [0, 0.0001, 0.0003, 0.001, 0.003, 0.01, 0.03];
  var data = null, run = null;
  function f(x) { return Math.sin(3 * x); }

  function makeData() {
    var R = api.rng(S.seed * 97 + 4), tr = [], va = [], i;
    for (i = 0; i < 25; i++) { var x = R.range(-1, 1); tr.push([x, f(x) + R.normal(0, SIG)]); }
    for (i = 0; i < 100; i++) { var z = R.range(-1, 1); va.push([z, f(z) + R.normal(0, SIG)]); }
    data = { tr: tr, va: va };
  }
  function train() {
    var R = api.rng(S.seed * 13 + 1), H = S.H, w1 = [], b1 = [], w2 = [], b2 = 0, j, i, e, p;
    for (j = 0; j < H; j++) { w1.push(R.normal(0, 2)); b1.push(R.range(-1.5, 1.5)); w2.push(R.normal(0, 0.4)); }
    var P = [w1, b1, w2], mo = [], ve = [], mb = 0, vb = 0;
    P.forEach(function () { mo.push(new Array(H).fill(0)); ve.push(new Array(H).fill(0)); });
    var tr = data.tr, va = data.va, n = tr.length, h = new Array(H), g = [new Array(H), new Array(H), new Array(H)], B1 = 0.9, B2 = 0.999;
    var LT = [], LV = [];
    function mse(set) { var s = 0; for (var q = 0; q < set.length; q++) { var yh = b2; for (var k = 0; k < H; k++) yh += w2[k] * Math.tanh(w1[k] * set[q][0] + b1[k]); s += (yh - set[q][1]) * (yh - set[q][1]); } return s / set.length; }
    for (e = 1; e <= NMAX; e++) {
      var gB = 0; for (p = 0; p < 3; p++) g[p].fill(0);
      for (i = 0; i < n; i++) {
        var yh = b2; for (j = 0; j < H; j++) { h[j] = Math.tanh(w1[j] * tr[i][0] + b1[j]); yh += w2[j] * h[j]; }
        var d = 2 * (yh - tr[i][1]) / n; gB += d;
        for (j = 0; j < H; j++) { g[2][j] += d * h[j]; var dh = d * w2[j] * (1 - h[j] * h[j]); g[0][j] += dh * tr[i][0]; g[1][j] += dh; }
      }
      for (j = 0; j < H; j++) { g[0][j] += 2 * S.l2 * w1[j]; g[2][j] += 2 * S.l2 * w2[j]; }
      var c1 = 1 - Math.pow(B1, e), c2 = 1 - Math.pow(B2, e);
      for (p = 0; p < 3; p++) for (j = 0; j < H; j++) {
        mo[p][j] = B1 * mo[p][j] + (1 - B1) * g[p][j]; ve[p][j] = B2 * ve[p][j] + (1 - B2) * g[p][j] * g[p][j];
        P[p][j] -= S.lr * (mo[p][j] / c1) / (Math.sqrt(ve[p][j] / c2) + 1e-8);
      }
      mb = B1 * mb + (1 - B1) * gB; vb = B2 * vb + (1 - B2) * gB * gB; b2 -= S.lr * (mb / c1) / (Math.sqrt(vb / c2) + 1e-8);
      var lt = mse(tr), lv = mse(va);
      if (!isFinite(lt) || lt > 50) lt = 50; if (!isFinite(lv) || lv > 50) lv = 50;
      LT.push(lt); LV.push(lv);
    }
    var best = 0, wait = 0, stop = -1;
    for (e = 0; e < NMAX; e++) {
      if (LV[e] < LV[best] - 1e-6) { best = e; wait = 0; } else wait++;
      if (wait >= S.pat && stop < 0) stop = e;
    }
    var bestAll = 0; for (e = 0; e < NMAX; e++) if (LV[e] < LV[bestAll]) bestAll = e;
    var n2 = S.es && stop >= 0 ? stop + 1 : NMAX;
    var bestS = 0; for (e = 0; e < n2; e++) if (LV[e] < LV[bestS]) bestS = e;
    var jumps = 0; for (e = 10; e < NMAX; e++) if (LT[e] > LT[e - 1] * 1.3) jumps++;
    run = { LT: LT, LV: LV, n: n2, best: bestS, stop: S.es && stop >= 0 ? stop : -1, jumps: jumps };
  }

  var view = api.view(root, { aspect: 1.9, minH: 250, maxH: 340, label: "Pérdida de entrenamiento y de validación por época, en escala logarítmica" });
  var plot = api.plot(view, { xr: [0, NMAX], yr: [-2, 0], xticks: 4, yticks: 2, grid: true, pad: { l: 46, r: 12, t: 12, b: 34 }, xlabel: "época",
    yfmt: function (v) { return v === -2 ? "0,01" : v === -1 ? "0,1" : "1"; } });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Neuronas ocultas (capacidad)", min: 2, max: 60, step: 1, value: S.H, onInput: function (v) { S.H = v; update(); } });
  var l2s = ui.slider({ label: "Regularización L2 (λ)", min: 0, max: 6, step: 1, value: 0, fmt: function (v) { return L2V[v] === 0 ? "0" : String(L2V[v]).replace(".", ","); }, onInput: function (v) { S.l2 = L2V[v]; update(); } });
  ui.slider({ label: "Learning rate", min: 0.002, max: 0.4, step: 0.002, value: S.lr, fmt: function (v) { return v.toFixed(3).replace(".", ","); }, onInput: function (v) { S.lr = v; update(); } });
  ui.slider({ label: "EarlyStopping · patience", min: 3, max: 80, step: 1, value: S.pat, onInput: function (v) { S.pat = v; update(); } });
  ui.toggle({ label: "EarlyStopping activo", value: S.es, onChange: function (v) { S.es = v; update(); } });
  ui.button("Otro ruido (otra semilla)", function () { S.seed = S.seed % 9 + 1; makeData(); update(); });
  api.legend(root, [[api.colors().cobalto, "pérdida de entrenamiento"], [api.colors().terracota, "pérdida de validación"], [api.colors().oliva, "mejor época"]]);

  function lg(v) { return Math.log10(Math.max(v, 1e-3)); }
  view.draw(function (ctx, w, h, C) {
    plot.axes(ctx);
    if (!run) return;
    var b = plot.box, i, pts;
    ctx.save(); plot.clip(ctx);
    D.line(ctx, b.x, plot.y(lg(SIG * SIG)), b.x + b.w, plot.y(lg(SIG * SIG)), C.muted, 1.2, [4, 4]);
    [[run.LT, C.cobalto], [run.LV, C.terracota]].forEach(function (c) {
      pts = []; for (i = 0; i < run.n; i++) pts.push([plot.x(i + 1), plot.y(lg(c[0][i]))]);
      D.path(ctx, pts, c[1], 2.2);
    });
    ctx.restore();
    D.text(ctx, "ruido de los datos (σ² = 0,09)", b.x + b.w - 5, plot.y(lg(SIG * SIG)) - 5, { align: "right", size: 10.5, color: C.muted });
    D.circle(ctx, plot.x(run.best + 1), plot.y(lg(run.LV[run.best])), 5.5, C.oliva, C.ink, 1.5);
    if (run.stop >= 0) {
      D.line(ctx, plot.x(run.stop + 1), b.y, plot.x(run.stop + 1), b.y + b.h, C.ink, 2);
      D.text(ctx, "para", plot.x(run.stop + 1) - 4, b.y + 12, { align: "right", size: 11, weight: 700, color: C.ink });
    }
  });

  function diagnose() {
    var r = run, lastT = r.LT[r.n - 1], lastV = r.LV[r.n - 1], bestV = r.LV[r.best], noise = SIG * SIG;
    if (r.jumps > 8) return "<span class='bad'>Learning rate demasiado alto</span>: la pérdida de entrenamiento sube y baja a saltos (" + r.jumps + " subidas bruscas). Baja el learning rate.";
    if (bestV > 2.2 * noise && lastT > 1.6 * noise) return "<span class='bad'>Infraajuste</span>: las dos curvas siguen altas, por encima del ruido. Faltan neuronas, épocas o menos regularización.";
    if (lastV > 1.25 * bestV && lastV > lastT * 1.6) return "<span class='bad'>Sobreajuste</span>: el entrenamiento sigue bajando pero la validación ha subido " + Math.round((lastV / bestV - 1) * 100) + " % desde su mínimo. Activa EarlyStopping, sube λ o reduce neuronas.";
    return "<span class='good'>Ajuste sano</span>: la validación está cerca del mínimo y de la curva de entrenamiento. Detenerse en la mejor época es lo correcto.";
  }
  function update() {
    train();
    var r = run;
    out.set("<b>Épocas entrenadas:</b> " + r.n + (r.stop >= 0 ? " (EarlyStopping paró en la " + (r.stop + 1) + ")" : " (sin parada)") +
      "<br><b>Mejor val_loss:</b> " + r.LV[r.best].toFixed(3).replace(".", ",") + " en la época " + (r.best + 1) + " · <b>train_loss final:</b> " + r.LT[r.n - 1].toFixed(3).replace(".", ",") + " · <b>val_loss final:</b> " + r.LV[r.n - 1].toFixed(3).replace(".", ",") +
      "<br>" + diagnose());
    view.redraw();
  }
  makeData(); update();
});
