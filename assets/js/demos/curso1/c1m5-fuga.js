/* Experimento: data leakage. Dos fugas clásicas que dan un resultado "demasiado bueno":
   (A) una columna que ya contiene la respuesta; (B) seleccionar variables con TODAS las etiquetas antes de validar. */
Lab.register("curso1/c1m5-fuga", function (root, api) {
  var M = api.math, D = api.d, i, j;
  var st = { sc: "A", lam: 0.8, dim: 500, k: 10, seed: 1 };

  /* ---- clasificador simple: LDA con covarianza diagonal ---- */
  function fitLDA(rows, y, cols) {
    var m = [[], []], v = [[], []], n = [0, 0], c, a, s0 = 0;
    cols.forEach(function (cj) { m[0].push(0); m[1].push(0); });
    rows.forEach(function (r, k) { n[y[k]]++; cols.forEach(function (cj, q) { m[y[k]][q] += r[cj]; }); });
    cols.forEach(function (cj, q) { m[0][q] /= Math.max(1, n[0]); m[1][q] /= Math.max(1, n[1]); });
    var pooled = cols.map(function () { return 0; });
    rows.forEach(function (r, k) { cols.forEach(function (cj, q) { var d = r[cj] - m[y[k]][q]; pooled[q] += d * d; }); });
    pooled = pooled.map(function (s) { return Math.max(1e-6, s / Math.max(1, rows.length - 2)); });
    return { m: m, v: pooled, cols: cols, prior: Math.log(Math.max(1, n[1]) / Math.max(1, n[0])) };
  }
  function predLDA(mod, r) {
    var s = mod.prior;
    mod.cols.forEach(function (cj, q) { s += (mod.m[1][q] - mod.m[0][q]) / mod.v[q] * (r[cj] - (mod.m[0][q] + mod.m[1][q]) / 2); });
    return s > 0 ? 1 : 0;
  }
  function accOf(mod, rows, y) { var ok = 0; rows.forEach(function (r, k) { if (predLDA(mod, r) === y[k]) ok++; }); return ok / rows.length; }
  function pick(rows, y, k) {
    var p = rows[0].length, sc = [], n1 = 0, n0 = 0;
    y.forEach(function (v) { if (v) n1++; else n0++; });
    for (var c = 0; c < p; c++) {
      var s1 = 0, s0 = 0, q1 = 0, q0 = 0;
      rows.forEach(function (r, t) { if (y[t]) { s1 += r[c]; q1 += r[c] * r[c]; } else { s0 += r[c]; q0 += r[c] * r[c]; } });
      var m1 = s1 / n1, m0 = s0 / n0, v1 = q1 / n1 - m1 * m1, v0 = q0 / n0 - m0 * m0;
      sc.push([Math.abs(m1 - m0) / Math.sqrt(v1 / n1 + v0 / n0 + 1e-12), c]);
    }
    sc.sort(function (a, b) { return b[0] - a[0]; });
    return sc.slice(0, k).map(function (x) { return x[1]; });
  }

  /* ---- Escenario A: columna que filtra el target ---- */
  var A = (function () {
    var r = api.rng(7), N = 300, rows = [], y = [], zl = [], prodRows = [], prodY = [];
    function feats(yy) { var f = []; for (var q = 0; q < 5; q++) f.push((yy ? 0.3 : -0.3) + r.normal(0, 1)); return f; }
    for (i = 0; i < N; i++) { var yy = r.next() < 0.5 ? 1 : 0; y.push(yy); rows.push(feats(yy)); zl.push(r.normal(0, 1)); }
    for (i = 0; i < N; i++) { var y2 = r.next() < 0.5 ? 1 : 0; prodY.push(y2); prodRows.push(feats(y2).concat([r.normal(0, 1)])); }
    return { rows: rows, y: y, zl: zl, prodRows: prodRows, prodY: prodY, N: N };
  })();
  function runA() {
    var lam = st.lam, N = A.N, all = [], honestCols = [0, 1, 2, 3, 4], leakCols = [0, 1, 2, 3, 4, 5], K = 5, fold = [];
    for (i = 0; i < N; i++) { all.push(A.rows[i].concat([3 * lam * (2 * A.y[i] - 1) + A.zl[i]])); fold.push(i % K); }
    function cv(cols) {
      var s = 0;
      for (var f = 0; f < K; f++) {
        var tr = [], ytr = [], va = [], yva = [];
        for (i = 0; i < N; i++) (fold[i] === f ? (va.push(all[i]), yva.push(A.y[i])) : (tr.push(all[i]), ytr.push(A.y[i])));
        s += accOf(fitLDA(tr, ytr, cols), va, yva);
      }
      return s / K;
    }
    var full = fitLDA(all, A.y, leakCols);
    return { val: cv(leakCols), prod: accOf(full, A.prodRows, A.prodY), honest: cv(honestCols) };
  }

  /* ---- Escenario B: selección de variables fuera / dentro de la validación ---- */
  function runB() {
    var R = 10, N = 40, K = 5, bad = 0, good = 0, last = null;
    for (var rep = 0; rep < R; rep++) {
      var r = api.rng(st.seed * 9973 + rep * 131), rows = [], y = [];
      for (i = 0; i < N; i++) { var row = []; for (j = 0; j < st.dim; j++) row.push(r.normal(0, 1)); rows.push(row); y.push(r.next() < 0.5 ? 1 : 0); }
      var perm = []; for (i = 0; i < N; i++) perm.push(i); r.shuffle(perm);
      var fold = new Array(N); perm.forEach(function (idx, t) { fold[idx] = t % K; });
      var selAll = pick(rows, y, st.k), sb = 0, sg = 0;
      for (var f = 0; f < K; f++) {
        var tr = [], ytr = [], va = [], yva = [];
        for (i = 0; i < N; i++) (fold[i] === f ? (va.push(rows[i]), yva.push(y[i])) : (tr.push(rows[i]), ytr.push(y[i])));
        sb += accOf(fitLDA(tr, ytr, selAll), va, yva);
        sg += accOf(fitLDA(tr, ytr, pick(tr, ytr, st.k)), va, yva);
      }
      bad += sb / K; good += sg / K;
      if (rep === 0) last = { bad: sb / K, good: sg / K };
    }
    return { bad: bad / R, good: good / R, first: last };
  }

  var view = api.view(root, { aspect: 1.9, minH: 240, label: "Barras que comparan el resultado con fuga de datos y el resultado honesto" });
  var ui0 = api.controls(root);
  ui0.segmented({ label: "Qué fuga quieres ver", options: [["A", "A · una columna con la respuesta"], ["B", "B · selección con todos los datos"]], value: st.sc, onChange: function (v) { st.sc = v; show(); update(); } });
  var uiA = api.controls(root), uiB = api.controls(root), out = api.readout(root);
  uiA.slider({ label: "Cuánta respuesta lleva la columna «sospechosa»", min: 0, max: 1, step: 0.05, value: st.lam, fmt: function (v) { return Math.round(v * 100) + " %"; }, onInput: function (v) { st.lam = v; update(); } });
  uiB.slider({ label: "Columnas candidatas (todas puro ruido)", min: 10, max: 1000, step: 10, value: st.dim, onInput: function (v) { st.dim = v; update(); } });
  uiB.slider({ label: "Columnas que se quedan (k)", min: 1, max: 30, step: 1, value: st.k, onInput: function (v) { st.k = v; update(); } });
  uiB.button("Otros 10 conjuntos de datos", function () { st.seed++; update(); }, "primary");
  function show() { uiA.el.style.display = st.sc === "A" ? "" : "none"; uiB.el.style.display = st.sc === "B" ? "" : "none"; }

  var res = null;
  function draw(ctx, w, h, C) {
    var bars, base, baseLabel;
    if (st.sc === "A") {
      bars = [["validación", "(con la columna)", res.val, C.terracota], ["producción", "(la columna no existe)", res.prod, C.cobalto], ["modelo honesto", "(sin la columna)", res.honest, C.oliva]];
      base = 0.5; baseLabel = "azar = 0,50";
    } else {
      bars = [["con fuga", "(selección fuera)", res.bad, C.terracota], ["sin fuga", "(dentro de cada fold)", res.good, C.oliva]];
      base = 0.5; baseLabel = "azar = 0,50 (datos de ruido puro)";
    }
    var L = 40, R = 12, T = 18, B = 46, bw = w - L - R, bh = h - T - B, k;
    D.rect(ctx, L, T, bw, bh, C.surface, C.ink, 1.5);
    for (k = 0; k <= 4; k++) { var gy = T + bh - bh * k / 4; D.line(ctx, L, gy, L + bw, gy, C.line, 1); D.text(ctx, (k / 4).toFixed(2), L - 4, gy + 4, { size: 10, align: "right", color: C.muted, mono: true }); }
    var gw = bw / bars.length, barW = Math.min(70, gw * 0.5);
    bars.forEach(function (b, q) {
      var cx = L + gw * (q + 0.5), v = b[2], by = T + bh - v * bh;
      D.rect(ctx, cx - barW / 2, by, barW, v * bh, b[3], null);
      D.text(ctx, v.toFixed(2), cx, by - 5, { size: 12, align: "center", weight: 700, mono: true, color: C.ink });
      D.text(ctx, b[0], cx, T + bh + 15, { size: 11, align: "center", weight: 600, color: C.ink2 });
      D.text(ctx, b[1], cx, T + bh + 29, { size: 10, align: "center", color: C.muted });
    });
    var yb = T + bh - base * bh;
    D.line(ctx, L, yb, L + bw, yb, C.ink, 1.6, [6, 4]);
    D.text(ctx, w < 520 ? "azar" : baseLabel, L + bw / bars.length, yb - 5, { size: 10.5, align: "center", color: C.ink, weight: 600 });
  }
  function update() {
    if (st.sc === "A") {
      res = runA();
      out.set("validación cruzada con la columna: <b>" + res.val.toFixed(3) + "</b> · en producción (esa columna aún no existe, llega con ruido): <b>" + res.prod.toFixed(3) + "</b><br>" +
        "un modelo honesto, sin la columna, saca <b>" + res.honest.toFixed(3) + "</b>" +
        (res.val - res.honest > 0.1 ? "<br><span class='bad'>El resultado «brillante» (" + res.val.toFixed(2) + ") era una ilusión: venía de la columna que conocía la respuesta.</span>" : "<br><span class='good'>Con poca fuga la diferencia es pequeña; sube el porcentaje y mira qué ocurre.</span>"));
    } else {
      res = runB();
      out.set("media de 10 conjuntos de puro ruido (40 muestras, " + st.dim + " columnas, quedan " + st.k + "):<br>" +
        "selección fuera de la validación: <b>" + res.bad.toFixed(3) + "</b> · selección dentro de cada fold: <b>" + res.good.toFixed(3) + "</b><br>" +
        (res.bad - res.good > 0.1 ? "<span class='bad'>Con fuga «aprende» a predecir ruido (" + (res.bad * 100).toFixed(0) + " % de aciertos). Sin fuga: azar.</span>" : "<span class='good'>Con pocas columnas candidatas la trampa casi no funciona; súbelas.</span>"));
    }
    view.redraw();
  }
  show(); update(); view.draw(draw);
});
