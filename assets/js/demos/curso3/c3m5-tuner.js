/* Experimento: estrategias de búsqueda de hiperparámetros (Keras Tuner) sobre un espacio de 2 hiperparámetros:
   log10(learning rate) y nº de unidades. La «accuracy de validación» es una función oculta con ruido (semilla fija) que NO ves
   hasta que un trial la mide. Cada entrenamiento completo cuesta 27 épocas.
   · Rejilla (GridSearch): k×k puntos equiespaciados.  · Aleatoria (RandomSearch): puntos al azar.
   · Bayesiana (BayesianOptimization): proceso gaussiano (kernel RBF) + criterio UCB sobre lo ya medido.
   · Hyperband: reducción sucesiva (max_epochs = 27, factor = 3): muchos modelos con pocas épocas y solo los mejores siguen. */
Lab.register("curso3/c3m5-tuner", function (root, api) {
  var D = api.d, M = api.math, C0 = api.colors();
  var XR = [-4, -1], UR = [8, 128], RMAX = 27, ETA = 3;
  var NAMES = [["grid", "Rejilla"], ["random", "Aleatoria"], ["bayes", "Bayesiana"], ["hb", "Hyperband"]];
  var COL = { grid: "ink", random: "terracota", bayes: "cobalto", hb: "oliva" };
  var S = { sel: "bayes", budget: 270, seed: 1, surf: true, res: null };

  function base(x, u) { return 0.92 - 0.2 * Math.pow((x + 2.3) / 1.0, 2) - 0.1 * Math.pow((u - 72) / 60, 2) + 0.02 * Math.sin(2.4 * x) * Math.cos(u / 22); }
  function hash(a, b, c, d) { var h = 2166136261, k, arr = [a, b, c, d]; for (k = 0; k < 4; k++) { h ^= Math.round(arr[k] * 1000) | 0; h = Math.imul(h, 16777619); } return h >>> 0; }
  function evalAt(x, u, r) {
    var R = api.rng(hash(S.seed, x, u, r)), nz = (R.next() + R.next() + R.next() - 1.5) * 2, speed = Math.min(3, Math.max(0.1, Math.pow(10, x + 2.5)));
    return Math.max(0.5, base(x, u) - 0.3 * Math.exp(-r * speed / 8) + nz * 0.012 / Math.sqrt(r));
  }
  function randCfg(R) { return [R.range(XR[0], XR[1]), 8 * R.int(1, 16)]; }

  function runGrid(n) {
    var k = Math.max(1, Math.floor(Math.sqrt(n))), t = [], i, j;
    for (i = 0; i < k; i++) for (j = 0; j < k; j++) t.push({ c: [XR[0] + (XR[1] - XR[0]) * (i + 0.5) / k, Math.round((UR[0] + (UR[1] - UR[0]) * (j + 0.5) / k) / 8) * 8], r: RMAX });
    return t.slice(0, n);
  }
  function runRandom(n) { var R = api.rng(S.seed * 7 + 1), t = []; while (t.length < n) t.push({ c: randCfg(R), r: RMAX }); return t; }
  function gpNext(tr, R) {
    var ls = 0.28, n = tr.length, X = tr.map(function (q) { return [(q.c[0] - XR[0]) / 3, (q.c[1] - UR[0]) / 120]; });
    var ys = tr.map(function (q) { return q.y; }), mu = M.mean(ys);
    function k(a, b) { var d = (a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]); return 0.04 * Math.exp(-d / (2 * ls * ls)); }
    var K = X.map(function (a, i) { return X.map(function (b, j) { return k(a, b) + (i === j ? 1e-4 : 0); }); });
    var alpha = M.solve(K, ys.map(function (v) { return v - mu; })), best = null, bestV = -Infinity, c, i;
    for (c = 0; c < 250; c++) {
      var cfg = randCfg(R), xc = [(cfg[0] - XR[0]) / 3, (cfg[1] - UR[0]) / 120], kc = X.map(function (a) { return k(a, xc); });
      var mean = mu + M.dot(kc, alpha), v = M.solve(K, kc), varc = Math.max(0, k(xc, xc) - M.dot(kc, v)), ucb = mean + 2.2 * Math.sqrt(varc);
      if (ucb > bestV) { bestV = ucb; best = cfg; }
    }
    return best;
  }
  function runBayes(n) {
    var R = api.rng(S.seed * 13 + 5), t = [], i, init = Math.min(5, n);
    for (i = 0; i < n; i++) {
      var cfg = i < init ? randCfg(R) : gpNext(t, R);
      t.push({ c: cfg, r: RMAX, y: evalAt(cfg[0], cfg[1], RMAX) });
    }
    return t;
  }
  function runHB() {
    var R = api.rng(S.seed * 19 + 3), smax = Math.floor(Math.log(RMAX) / Math.log(ETA) + 1e-9), B = (smax + 1) * RMAX, out = [], s;
    for (s = smax; s >= 0; s--) {
      var n = Math.ceil(B / RMAX * Math.pow(ETA, s) / (s + 1)), r0 = RMAX * Math.pow(ETA, -s), cfgs = [], i;
      for (i = 0; i < n; i++) cfgs.push({ c: randCfg(R), y: 0 });
      for (i = 0; i <= s; i++) {
        var ni = Math.floor(n * Math.pow(ETA, -i)), ri = Math.round(r0 * Math.pow(ETA, i));
        cfgs.forEach(function (q) { q.y = evalAt(q.c[0], q.c[1], ri); });
        cfgs.slice(0, ni).forEach(function (q) { out.push({ c: q.c, r: ri, y: q.y }); });
        cfgs = cfgs.slice(0, ni).sort(function (a, b) { return b.y - a.y; }).slice(0, Math.max(1, Math.floor(ni / ETA)));
      }
    }
    return out;
  }
  function compute() {
    var n = Math.floor(S.budget / RMAX), res = {}, key;
    res.grid = runGrid(n); res.random = runRandom(n); res.bayes = runBayes(n); res.hb = runHB();
    res.grid.concat(res.random).forEach(function (q) { if (q.y === undefined) q.y = evalAt(q.c[0], q.c[1], q.r); });
    for (key in res) {
      var cum = 0, bestY = 0, curve = [[0, 0.5]], keep = [], spent = 0;
      res[key].forEach(function (q) {
        if (spent + q.r > S.budget) return;
        spent += q.r; q.cum = spent; keep.push(q);
        if (q.r === RMAX && q.y > bestY) bestY = q.y;
        curve.push([spent, Math.max(0.5, bestY)]);
      });
      res[key] = { t: keep, curve: curve, spent: spent, best: keep.filter(function (q) { return q.r === RMAX; }).sort(function (a, b) { return b.y - a.y; })[0] || null };
    }
    S.res = res;
  }

  var vA = api.view(root, { aspect: 1.7, minH: 250, maxH: 380, label: "Espacio de búsqueda con los trials de la estrategia elegida" });
  var pA = api.plot(vA, { xr: XR, yr: UR, xticks: 3, yticks: 4, xlabel: "log10(learning rate)", ylabel: "unidades", pad: { l: 40, r: 12, t: 12, b: 36 }, xfmt: function (v) { return Math.round(v); }, yfmt: function (v) { return Math.round(v); } });
  var vB = api.view(root, { aspect: 2.8, minH: 170, maxH: 240, label: "Mejor accuracy de validación encontrada según las épocas gastadas, por estrategia" });
  var pB = api.plot(vB, { xr: [0, 540], yr: [0.5, 0.95], xticks: 6, yticks: 3, xlabel: "épocas de entrenamiento gastadas", pad: { l: 44, r: 12, t: 12, b: 34 }, yfmt: function (v) { return v.toFixed(2); } });
  var ui = api.controls(root);
  ui.select({ label: "Estrategia que se dibuja arriba", value: S.sel, options: NAMES, onChange: function (v) { S.sel = v; update(); } });
  ui.slider({ label: "Presupuesto total (épocas); un entrenamiento completo = 27", min: 108, max: 540, step: 27, value: S.budget, onInput: function (v) { S.budget = v; compute(); update(); } });
  ui.toggle({ label: "mostrar la superficie real (oculta para el tuner)", value: true, onChange: function (v) { S.surf = v; update(); } });
  ui.button("Otro paisaje y otras semillas", function () { S.seed = S.seed % 6 + 1; compute(); update(); }, "warm");
  api.legend(root, NAMES.map(function (k) { return [k[0] === "grid" ? C0.ink : C0[COL[k[0]]], k[1]]; }));
  var table = api.table(root, ["Método", "trials", "épocas", "val_acc"]);
  var out = api.readout(root);

  function col(C, k) { return COL[k] === "ink" ? C.ink : C[COL[k]]; }
  function drawA(ctx, w, h, C) {
    pA.axes(ctx);
    var b = pA.box, i, j;
    ctx.save(); pA.clip(ctx);
    if (S.surf) {
      var nx = 48, ny = 24, cw = b.w / nx, ch = b.h / ny;
      for (i = 0; i < nx; i++) for (j = 0; j < ny; j++) {
        var v = base(pA.ix(b.x + (i + 0.5) * cw), pA.iy(b.y + (j + 0.5) * ch)), lvl = Math.max(0, Math.min(8, Math.floor((v - 0.5) / 0.05)));
        var x0 = Math.round(b.x + i * cw), x1 = Math.round(b.x + (i + 1) * cw), y0 = Math.round(b.y + j * ch), y1 = Math.round(b.y + (j + 1) * ch);
        ctx.globalAlpha = 0.04 + 0.05 * lvl; ctx.fillStyle = C.oliva; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      }
      ctx.globalAlpha = 1;
    }
    var r = S.res[S.sel], k = S.sel, many = r.t.length > 24;
    r.t.forEach(function (q, idx) {
      var px = pA.x(q.c[0]), py = pA.y(q.c[1]), rad = k === "hb" ? 3 + 5.5 * Math.log(q.r + 1) / Math.log(RMAX + 1) : 8;
      D.circle(ctx, px, py, rad, q.r === RMAX ? col(C, k) : C.paper, col(C, k), 2);
      if (!many && k !== "hb") D.text(ctx, String(idx + 1), px, py + 3.5, { align: "center", size: 9.5, weight: 700, color: C.paper, mono: true });
    });
    if (r.best) D.circle(ctx, pA.x(r.best.c[0]), pA.y(r.best.c[1]), 13, null, C.terracota, 3);
    ctx.restore();
    if (k === "hb") D.text(ctx, "grande = más épocas · vacío = descartado", b.x + 6, b.y + b.h - 8, { size: 10.5, color: C.ink2 });
    else D.text(ctx, "anillo naranja = el mejor", b.x + 6, b.y + b.h - 8, { size: 10.5, color: C.ink2 });
  }
  function drawB(ctx, w, h, C) {
    pB.xr = [0, S.budget]; pB.axes(ctx);
    ctx.save(); pB.clip(ctx);
    NAMES.forEach(function (n) {
      var cv = S.res[n[0]].curve, pts = [], i, last = 0;
      for (i = 0; i < cv.length; i++) { pts.push([pB.x(cv[i][0]), pB.y(cv[i][1])]); }
      pts.push([pB.x(S.budget), pB.y(cv[cv.length - 1][1])]);
      D.path(ctx, pts, col(C, n[0]), n[0] === S.sel ? 3.2 : 1.6);
    });
    ctx.restore();
  }
  compute();
  vA.draw(drawA); vB.draw(drawB);

  function update() {
    var rows = [], peak = 0, i, j;
    NAMES.forEach(function (n) {
      var r = S.res[n[0]], b = r.best;
      rows.push(["<b>" + n[1] + "</b>", r.t.length, r.spent, b ? b.y.toFixed(3) : "—"]);
    });
    table.set(rows);
    for (i = 0; i < 60; i++) for (j = 1; j <= 16; j++) peak = Math.max(peak, base(XR[0] + 3 * i / 59, 8 * j));
    out.set("Presupuesto: <b>" + S.budget + "</b> épocas = " + Math.floor(S.budget / RMAX) + " entrenamientos completos. El techo teórico (sin ruido) de esta superficie es <b>" + peak.toFixed(3) + "</b>. " +
      "Hyperband prueba <b>" + S.res.hb.t.length + "</b> trials (cada uno con su nº de épocas) porque descarta pronto los malos: ve muchas más configuraciones con el mismo presupuesto, aunque solo las supervivientes llegan a 27 épocas.");
    vA.redraw(); vB.redraw();
  }
  update();
});
