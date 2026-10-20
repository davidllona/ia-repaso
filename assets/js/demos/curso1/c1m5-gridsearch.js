/* Experimento: búsqueda de hiperparámetros con validación cruzada.
   Modelo: regresión polinómica con penalización Ridge. Hiperparámetros: grado (filas) y alpha (columnas). */
Lab.register("curso1/c1m5-gridsearch", function (root, api) {
  var M = api.math, D = api.d, i, j;
  var DEGS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], ALPHAS = [-6, -5, -4, -3, -2, -1, 0, 1], K = 5;
  var st = { mode: "grid", n: 20, seed: 3, data: 1 };
  var tr, te, folds, cells, evaluated = [], bestFound = null, bestGrid = null, varY = 1;

  function f(x) { return Math.sin(3.4 * x); }
  function gen() {
    var r = api.rng(st.data * 37 + 5), t = api.rng(777);
    tr = []; te = [];
    for (i = 0; i < 30; i++) { var x = r.range(-1, 1); tr.push([x, f(x) + r.normal(0, 0.35)]); }
    for (i = 0; i < 400; i++) { var x2 = t.range(-1, 1); te.push([x2, f(x2) + t.normal(0, 0.35)]); }
    var perm = []; for (i = 0; i < tr.length; i++) perm.push(i); r.shuffle(perm);
    folds = new Array(tr.length); perm.forEach(function (idx, q) { folds[idx] = q % K; });
    varY = M.std(tr.map(function (p) { return p[1]; })); varY *= varY;
    // evaluar TODAS las celdas una vez (el modo Random solo "descubre" algunas)
    cells = [];
    DEGS.forEach(function (d, ri) {
      ALPHAS.forEach(function (la, ci) {
        var a = Math.pow(10, la), sse = 0;
        for (var k = 0; k < K; k++) {
          var A = tr.filter(function (p, q) { return folds[q] !== k; }), B = tr.filter(function (p, q) { return folds[q] === k; });
          var c = fit(A, d, a); sse += B.reduce(function (s, p) { var e = M.polyval(c, p[0]) - p[1]; return s + e * e; }, 0);
        }
        var score = 1 - (sse / tr.length) / varY, full = fit(tr, d, a);
        var tmse = M.mean(te.map(function (p) { var e = M.polyval(full, p[0]) - p[1]; return e * e; }));
        var vt = M.std(te.map(function (p) { return p[1]; })); vt *= vt;
        cells.push({ d: d, la: la, ri: ri, ci: ci, score: score, test: 1 - tmse / vt });
      });
    });
    bestGrid = cells.reduce(function (b, c) { return c.score > b.score ? c : b; }, cells[0]);
    pickCells();
  }
  function fit(pts, d, a) {
    var n = d + 1, A = [], b = [], p, q, k;
    for (p = 0; p < n; p++) { A.push(new Array(n).fill(0)); b.push(0); }
    pts.forEach(function (pt) {
      var pw = [1]; for (q = 1; q < 2 * n; q++) pw.push(pw[q - 1] * pt[0]);
      for (p = 0; p < n; p++) { for (k = 0; k < n; k++) A[p][k] += pw[p + k]; b[p] += pw[p] * pt[1]; }
    });
    for (p = 1; p < n; p++) A[p][p] += a;
    for (p = 0; p < n; p++) A[p][p] += 1e-10;
    return M.solve(A, b);
  }
  function pickCells() {
    if (st.mode === "grid") evaluated = cells.slice();
    else { var order = api.rng(st.seed * 1013 + 3).shuffle(cells.map(function (c, q) { return q; })); evaluated = order.slice(0, st.n).map(function (q) { return cells[q]; }); }
    bestFound = evaluated.reduce(function (b, c) { return c.score > b.score ? c : b; }, evaluated[0]);
  }

  var view = api.view(root, { aspect: 1.2, minH: 310, maxH: 470, label: "Mapa de calor con la puntuación de validación cruzada para cada combinación de grado del polinomio y alpha" });
  var ui = api.controls(root), out = api.readout(root);
  ui.segmented({ label: "Estrategia de búsqueda", options: [["grid", "GridSearchCV (todas)"], ["random", "RandomizedSearchCV (al azar)"]], value: st.mode, onChange: function (v) { st.mode = v; pickCells(); update(); } });
  ui.slider({ label: "Combinaciones que prueba Randomized (n_iter)", min: 5, max: 60, step: 1, value: st.n, onInput: function (v) { st.n = v; pickCells(); update(); } });
  ui.button("Nuevo sorteo", function () { st.seed++; pickCells(); update(); }, "primary");
  ui.button("Otros datos", function () { st.data++; gen(); update(); });
  var C0 = api.colors();
  api.legend(root, [[C0.ink, "aro grueso (color del texto): lo que devuelve best_params_"], [C0.oliva, "aro verde: la mejor de TODA la rejilla"]]);

  function hex(c) { c = c.trim(); if (c[0] === "#") { if (c.length === 4) c = "#" + c[1] + c[1] + c[2] + c[2] + c[3] + c[3]; return [parseInt(c.substr(1, 2), 16), parseInt(c.substr(3, 2), 16), parseInt(c.substr(5, 2), 16)]; } var m = c.match(/[\d.]+/g) || [0, 0, 0]; return [+m[0], +m[1], +m[2]]; }
  function mix(a, b, t) { var A = hex(a), B = hex(b); return "rgb(" + Math.round(A[0] + (B[0] - A[0]) * t) + "," + Math.round(A[1] + (B[1] - A[1]) * t) + "," + Math.round(A[2] + (B[2] - A[2]) * t) + ")"; }

  function draw(ctx, w, h, C) {
    var L = 34, R = 8, T = 22, B = 44, cw = (w - L - R) / ALPHAS.length, ch = (h - T - B) / DEGS.length, set = {};
    evaluated.forEach(function (c) { set[c.ri * 100 + c.ci] = 1; });
    var hi = bestGrid.score, lo = Math.max(Math.min.apply(null, cells.map(function (c) { return c.score; })), hi - 0.9);
    D.text(ctx, "grado del polinomio ↓", L, 12, { size: 10.5, color: C.ink2, weight: 500 });
    DEGS.forEach(function (d, ri) { D.text(ctx, String(d), L - 6, T + ri * ch + ch / 2 + 4, { size: 10.5, align: "right", color: C.muted, mono: true }); });
    ALPHAS.forEach(function (la, ci) { D.text(ctx, la === 0 ? "1" : "1e" + la, L + ci * cw + cw / 2, T + DEGS.length * ch + 14, { size: 10.5, align: "center", color: C.muted, mono: true }); });
    D.text(ctx, "alpha →", L + (cw * ALPHAS.length) / 2, h - 8, { size: 11, align: "center", color: C.ink2, weight: 500 });
    cells.forEach(function (c) {
      var x0 = L + c.ci * cw, y0 = T + c.ri * ch;
      if (set[c.ri * 100 + c.ci]) {
        var t = M.clamp((c.score - lo) / (hi - lo), 0, 1);
        D.rect(ctx, x0, y0, cw, ch, mix(C.terracotaWash, C.cobalto, t), C.paper, 1);
        if (cw >= 34 && ch >= 20) D.text(ctx, c.score < -9 ? "<-9" : c.score.toFixed(2), x0 + cw / 2, y0 + ch / 2 + 4, { size: 10, align: "center", color: t > 0.55 ? C.paper : C.ink, mono: true, weight: 500 });
      } else {
        D.rect(ctx, x0, y0, cw, ch, C.surface, C.line, 1);
        D.line(ctx, x0 + 3, y0 + ch - 3, x0 + cw - 3, y0 + 3, C.line, 1);
      }
    });
    D.rect(ctx, L, T, cw * ALPHAS.length, ch * DEGS.length, null, C.ink, 1.5);
    if (bestGrid !== bestFound) D.rect(ctx, L + bestGrid.ci * cw + 1.5, T + bestGrid.ri * ch + 1.5, cw - 3, ch - 3, null, C.oliva, 3);
    D.rect(ctx, L + bestFound.ci * cw + 1.5, T + bestFound.ri * ch + 1.5, cw - 3, ch - 3, null, C.ink, 3);
  }
  function update() {
    view.redraw();
    var fits = evaluated.length * K, b = bestFound, g = bestGrid;
    out.set((st.mode === "grid" ? "GridSearchCV" : "RandomizedSearchCV") + ": <b>" + evaluated.length + "</b> combinaciones × " + K + " folds = <b>" + fits + "</b> entrenamientos (la rejilla completa son " + cells.length * K + ")<br>" +
      "best_params_ = {grado: <b>" + b.d + "</b>, alpha: <b>" + (b.la === 0 ? "1" : "1e" + b.la) + "</b>} · best_score_ (R² de validación cruzada) = <b>" + b.score.toFixed(3) + "</b><br>" +
      "con el modelo reentrenado con todo train, el examen final en test da R² = <b>" + b.test.toFixed(3) + "</b> (se mira UNA vez)" +
      (b === g ? "<br><span class='good'>Ha encontrado la mejor combinación de toda la rejilla.</span>" : "<br><span class='bad'>La mejor de la rejilla completa era grado " + g.d + ", alpha " + (g.la === 0 ? "1" : "1e" + g.la) + " (" + g.score.toFixed(3) + "): Randomized se queda a " + (g.score - b.score).toFixed(3) + " con el " + Math.round(100 * evaluated.length / cells.length) + " % del esfuerzo.</span>"));
  }
  gen(); view.draw(draw); update();
});
