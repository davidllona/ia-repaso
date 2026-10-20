/* Experimento: búsqueda de hiperparámetros. El fondo de colores es una cuadrícula 8 × 8 de redes entrenadas DE VERDAD
   (learning rate × neuronas ocultas, 20 puntos con ruido, 60 épocas, error medido en 100 puntos de validación).
   Sobre ella se comparan dos formas de gastar un presupuesto de pruebas: recorrer la cuadrícula en orden (el learning rate
   es el bucle exterior) o sortear valores continuos como hace RandomSearch (cada prueba entrena una red nueva).
   La línea gris es la mediana de 16 órdenes aleatorios, calculada en segundo plano. */
Lab.register("curso3/c3m7-tuner", function (root, api) {
  var D = api.d, M = api.math;
  var LMIN = 0.0005, LMAX = 0.3, EP = 60, NTR = 20, NT = 64, NMED = 16;
  var LRS = [], HS = [2, 4, 6, 8, 10, 12, 14, 16], j;
  for (j = 0; j < 8; j++) LRS.push(LMIN * Math.pow(LMAX / LMIN, j / 7));
  var S = { method: "random", trials: 8, seed: 1 };
  var tr = [], va = [], cellLoss = [], gridT = [], randT = [], gridCurve = [], randCurve = [], medCurve = null, best = 1, bestCell = 0, alive = true, timers = [];

  function f(x) { return Math.sin(3 * x) + 0.4 * x; }
  function trainOne(H, lr, seed) {
    var R = api.rng(seed), w1 = [], b1 = [], w2 = [], b2 = 0, jj, i, e, p;
    for (jj = 0; jj < H; jj++) { w1.push(R.normal(0, 2)); b1.push(R.range(-1.5, 1.5)); w2.push(R.normal(0, 0.4)); }
    var P = [w1, b1, w2], mo = [], ve = [], mb = 0, vb = 0, n = tr.length, h = new Array(H), g = [new Array(H), new Array(H), new Array(H)];
    P.forEach(function () { mo.push(new Array(H).fill(0)); ve.push(new Array(H).fill(0)); });
    for (e = 1; e <= EP; e++) {
      var gB = 0; for (p = 0; p < 3; p++) g[p].fill(0);
      for (i = 0; i < n; i++) {
        var yh = b2; for (jj = 0; jj < H; jj++) { h[jj] = Math.tanh(w1[jj] * tr[i][0] + b1[jj]); yh += w2[jj] * h[jj]; }
        var d = 2 * (yh - tr[i][1]) / n; gB += d;
        for (jj = 0; jj < H; jj++) { g[2][jj] += d * h[jj]; var dh = d * w2[jj] * (1 - h[jj] * h[jj]); g[0][jj] += dh * tr[i][0]; g[1][jj] += dh; }
      }
      var c1 = 1 - Math.pow(0.9, e), c2 = 1 - Math.pow(0.999, e);
      for (p = 0; p < 3; p++) for (jj = 0; jj < H; jj++) {
        mo[p][jj] = 0.9 * mo[p][jj] + 0.1 * g[p][jj]; ve[p][jj] = 0.999 * ve[p][jj] + 0.001 * g[p][jj] * g[p][jj];
        P[p][jj] -= lr * (mo[p][jj] / c1) / (Math.sqrt(ve[p][jj] / c2) + 1e-8);
      }
      mb = 0.9 * mb + 0.1 * gB; vb = 0.999 * vb + 0.001 * gB * gB; b2 -= lr * (mb / c1) / (Math.sqrt(vb / c2) + 1e-8);
    }
    var s = 0; for (i = 0; i < va.length; i++) { var y2 = b2; for (jj = 0; jj < H; jj++) y2 += w2[jj] * Math.tanh(w1[jj] * va[i][0] + b1[jj]); s += (y2 - va[i][1]) * (y2 - va[i][1]); }
    s /= va.length; return isFinite(s) ? Math.min(s, 10) : 10;
  }
  function makeData() {
    var R = api.rng(2024), i;
    for (i = 0; i < NTR; i++) { var x = R.range(-1, 1); tr.push([x, f(x) + R.normal(0, 0.3)]); }
    for (i = 0; i < 100; i++) { var z = R.range(-1, 1); va.push([z, f(z) + R.normal(0, 0.3)]); }
  }
  function makeGrid() {
    var a, b, t = [];
    for (a = 0; a < 8; a++) for (b = 0; b < 8; b++) cellLoss.push(trainOne(HS[a], LRS[b], 7 + a * 8 + b));
    for (b = 0; b < 8; b++) for (a = 0; a < 8; a++) t.push({ lr: LRS[b], H: HS[a], loss: cellLoss[a * 8 + b] });   // learning rate = bucle exterior
    gridT = t; best = Math.min.apply(null, cellLoss); bestCell = cellLoss.indexOf(best);
  }
  function randSeq(seed) {
    var R = api.rng(seed * 1009 + 3), t = [], k;
    for (k = 0; k < NT; k++) { var lr = Math.exp(R.range(Math.log(LMIN), Math.log(LMAX))), H = R.int(1, 16); t.push({ lr: lr, H: H, loss: trainOne(H, lr, 5000 + seed * 131 + k) }); }
    return t;
  }
  function bsf(seq) { var cur = Infinity; return seq.map(function (t) { cur = Math.min(cur, t.loss); return cur; }); }
  function near(curve, tol) { for (var i = 0; i < curve.length; i++) if (curve[i] <= best * tol) return i + 1; return NT + "+"; }
  function distinct(seq, n, key) { var s = {}; for (var i = 0; i < n; i++) s[seq[i][key].toFixed(5)] = 1; return Object.keys(s).length; }

  var vG = api.view(root, { aspect: 1.25, minH: 280, maxH: 380, label: "Cuadrícula de 64 redes entrenadas (learning rate por neuronas) con las pruebas realizadas por el método elegido" });
  var pG = api.plot(vG, { xr: [0, 8], yr: [0, 8], xticks: 8, yticks: 8, grid: false, pad: { l: 36, r: 10, t: 14, b: 36 }, xfmt: function () { return ""; }, yfmt: function () { return ""; } });
  var vC = api.view(root, { aspect: 2.4, minH: 150, maxH: 210, label: "Mejor error de validación encontrado según el número de pruebas, para cuadrícula y búsqueda aleatoria" });
  var pC = api.plot(vC, { xr: [0, NT], yr: [-1, 0.5], xticks: 4, yticks: 3, grid: true, pad: { l: 44, r: 10, t: 10, b: 30 }, xlabel: "pruebas realizadas",
    yfmt: function (v) { return v === -1 ? "0,1" : v === -0.5 ? "0,3" : v === 0 ? "1" : "3"; } });
  var ui = api.controls(root), out = api.readout(root);
  ui.segmented({ label: "Método", options: [["grid", "Cuadrícula (en orden)"], ["random", "Aleatoria"]], value: S.method, onChange: function (v) { S.method = v; update(); } });
  ui.slider({ label: "Pruebas que te permites", min: 1, max: NT, step: 1, value: S.trials, onInput: function (v) { S.trials = v; update(); } });
  ui.button("Otro orden aleatorio", function () { S.seed = S.seed % 50 + 1; recomputeRandom(); update(); });
  api.legend(root, [[api.colors().cobalto, "cuadrícula en orden"], [api.colors().terracota, "aleatoria (este orden)"], [api.colors().muted, "aleatoria, mediana de " + NMED + " órdenes"]]);

  function bad(v) { return Math.min(1, Math.max(0, (Math.log10(v) + 0.9) / 1.3)); }
  var curTrials = [];
  vG.draw(function (ctx, w, h, C) {
    if (!cellLoss.length) return;
    var b = pG.box, cw = b.w / 8, ch = b.h / 8, i, k;
    for (i = 0; i < 8; i++) for (k = 0; k < 8; k++) {
      var x = b.x + k * cw, y = b.y + (7 - i) * ch;
      D.rect(ctx, x, y, cw, ch, C.surface);
      ctx.save(); ctx.globalAlpha = 0.12 + 0.78 * bad(cellLoss[i * 8 + k]); D.rect(ctx, x + 1, y + 1, cw - 2, ch - 2, C.terracota); ctx.restore();
    }
    D.rect(ctx, b.x + (bestCell % 8) * cw + 2, b.y + (7 - Math.floor(bestCell / 8)) * ch + 2, cw - 4, ch - 4, null, C.oliva, 3);
    D.rect(ctx, b.x, b.y, b.w, b.h, null, C.ink, 1.5);
    for (k = 0; k < 8; k++) if (k % 2 === 0 || cw > 44) D.text(ctx, LRS[k] < 0.01 ? LRS[k].toFixed(4).replace(".", ",") : LRS[k].toFixed(3).replace(".", ","), b.x + (k + 0.5) * cw, b.y + b.h + 14, { align: "center", size: 9.5, color: C.muted, mono: true });
    for (i = 0; i < 8; i++) D.text(ctx, String(HS[i]), b.x - 6, b.y + (7 - i + 0.5) * ch + 4, { align: "right", size: 10.5, color: C.muted, mono: true });
    D.text(ctx, "learning rate (escala log) →", b.x + b.w, b.y + b.h + 29, { align: "right", size: 10.5, color: C.ink2 });
    D.text(ctx, "neuronas ocultas ↑", 4, b.y - 3, { size: 10.5, color: C.ink2 });
    var r = Math.min(10, Math.min(cw, ch) * 0.34);
    curTrials.forEach(function (t, q) {
      var px = b.x + ((Math.log(t.lr / LMIN) / Math.log(LMAX / LMIN) * 7 + 0.5) / 8) * b.w, py = Math.min(b.y + b.h - r - 1, Math.max(b.y + r + 1, b.y + b.h - ((t.H - 1) / 16) * b.h));
      D.circle(ctx, px, py, r, C.paper, C.ink, 1.5);
      D.text(ctx, String(q + 1), px, py + 3.5, { align: "center", size: q > 8 ? 8.5 : 10, weight: 700, color: C.ink });
    });
  });
  vC.draw(function (ctx, w, h, C) {
    pC.axes(ctx);
    if (!gridCurve.length) return;
    var i;
    ctx.save(); pC.clip(ctx);
    D.line(ctx, pC.box.x, pC.y(Math.log10(best)), pC.box.x + pC.box.w, pC.y(Math.log10(best)), C.oliva, 1.5, [3, 3]);
    [[gridCurve, C.cobalto, 2.2, null], [randCurve, C.terracota, 2.4, null], [medCurve, C.muted, 2, [5, 4]]].forEach(function (c) {
      if (!c[0]) return;
      var pts = []; for (i = 0; i < NT; i++) pts.push([pC.x(i + 1), pC.y(Math.log10(Math.max(c[0][i], 0.1)))]);
      D.path(ctx, pts, c[1], c[2], c[3]);
    });
    D.line(ctx, pC.x(S.trials), pC.box.y, pC.x(S.trials), pC.box.y + pC.box.h, C.ink, 1.5);
    ctx.restore();
    D.text(ctx, "mejor celda de la cuadrícula", pC.box.x + pC.box.w - 4, pC.y(Math.log10(best)) + 13, { align: "right", size: 10.5, color: C.olivaInk });
  });

  function recomputeRandom() { randT = randSeq(S.seed); randCurve = bsf(randT); }
  function update() {
    var seq = S.method === "grid" ? gridT : randT, cur = S.method === "grid" ? gridCurve : randCurve, n = S.trials, tol = 1.25;
    curTrials = seq.slice(0, n);
    function pc(v) { return v.toFixed(3).replace(".", ","); }
    out.set("<b>Mejor celda de la cuadrícula</b> (las 64 redes entrenadas): val_loss = " + pc(best) +
      "<br><b>Con " + n + " pruebas (" + (S.method === "grid" ? "cuadrícula en orden" : "aleatoria") + "):</b> val_loss = <b>" + pc(cur[n - 1]) + "</b> &nbsp;(" +
      (cur[n - 1] <= best * tol ? "<span class='good'>a menos de un 25 % del mejor</span>" : "<span class='bad'>aún lejos del mejor</span>") + ")" +
      "<br>Valores distintos de learning rate probados: cuadrícula <b>" + distinct(gridT, n, "lr") + "</b> · aleatoria <b>" + distinct(randT, n, "lr") + "</b>" +
      "<br>Pruebas para llegar a ≤ 1,25 × la mejor celda: cuadrícula <b>" + near(gridCurve, tol) + "</b> · aleatoria (este orden) <b>" + near(randCurve, tol) + "</b> · aleatoria (mediana) <b>" + (medCurve ? near(medCurve, tol) : "calculando…") + "</b>");
    vG.redraw(); vC.redraw();
  }
  function computeMedian() {
    var all = [], s = 0;
    function step() {
      if (!alive) return;
      if (s >= NMED) {
        medCurve = []; for (var i = 0; i < NT; i++) medCurve.push(M.median(all.map(function (c) { return c[i]; })));
        update(); return;
      }
      s++; all.push(bsf(randSeq(1000 + s)));
      timers.push(setTimeout(step, 0));
    }
    timers.push(setTimeout(step, 30));
  }
  makeData(); makeGrid(); recomputeRandom(); gridCurve = bsf(gridT);
  update(); computeMedian();
  return { destroy: function () { alive = false; timers.forEach(clearTimeout); } };
});
