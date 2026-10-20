/* Experimento: fuga de datos al ELEGIR VARIABLES antes de repartir. Se generan filas de ruido puro (sin ninguna señal),
   se eligen las k columnas más correlacionadas con la etiqueta y se mide el acierto en un test. Si la elección usa
   también las filas del test (fuga) el acierto sale muy por encima del azar; si usa solo el train, sale el 50 % honesto.
   Todo se calcula de verdad, con 30 repeticiones por configuración. */
Lab.register("curso3/c3m7-fuga", function (root, api) {
  var D = api.d, REP = 30;
  var S = { n: 60, p: 300, k: 10, seed: 1 };
  var res = null;

  function corrAll(X, y, rows) {            // correlación de cada columna con y, usando solo las filas "rows"
    var p = X[0].length, m = rows.length, my = 0, i, j, out = new Array(p);
    for (i = 0; i < m; i++) my += y[rows[i]]; my /= m;
    var sy = 0; for (i = 0; i < m; i++) sy += (y[rows[i]] - my) * (y[rows[i]] - my);
    for (j = 0; j < p; j++) {
      var mx = 0, sxy = 0, sxx = 0;
      for (i = 0; i < m; i++) mx += X[rows[i]][j]; mx /= m;
      for (i = 0; i < m; i++) { var dx = X[rows[i]][j] - mx; sxy += dx * (y[rows[i]] - my); sxx += dx * dx; }
      out[j] = sxx > 0 && sy > 0 ? sxy / Math.sqrt(sxx * sy) : 0;
    }
    return out;
  }
  function topK(c, k) {
    var idx = c.map(function (_, j) { return j; });
    idx.sort(function (a, b) { return Math.abs(c[b]) - Math.abs(c[a]); });
    return idx.slice(0, k);
  }
  function accuracy(X, y, sel, signs, rows) {
    var ok = 0, i, t;
    for (i = 0; i < rows.length; i++) {
      var s = 0; for (t = 0; t < sel.length; t++) s += signs[sel[t]] * X[rows[i]][sel[t]];
      if ((s >= 0 ? 1 : -1) === y[rows[i]]) ok++;
    }
    return ok / rows.length;
  }
  function compute() {
    var R = api.rng(S.seed * 7919 + 11), leak = [], fair = [], rep, i, j;
    for (rep = 0; rep < REP; rep++) {
      var X = [], y = [];
      for (i = 0; i < S.n; i++) { var row = []; for (j = 0; j < S.p; j++) row.push(R.normal(0, 1)); X.push(row); y.push(R.next() < 0.5 ? -1 : 1); }
      var idx = R.shuffle(X.map(function (_, q) { return q; }));
      var ntr = Math.round(S.n * 0.7), tr = idx.slice(0, ntr), te = idx.slice(ntr), all = idx;
      var cTr = corrAll(X, y, tr), cAll = corrAll(X, y, all);
      var signs = cTr.map(function (c) { return c >= 0 ? 1 : -1; });
      leak.push(accuracy(X, y, topK(cAll, S.k), signs, te));
      fair.push(accuracy(X, y, topK(cTr, S.k), signs, te));
    }
    res = { leak: leak, fair: fair, mLeak: api.math.mean(leak), mFair: api.math.mean(fair) };
  }

  var view = api.view(root, { aspect: 1.9, minH: 250, maxH: 330, label: "Acierto en el test con la selección de variables hecha antes o después del reparto, 30 repeticiones" });
  var plot = api.plot(view, { xr: [0, 3], yr: [0.3, 1], xticks: 3, yticks: 7, grid: true, pad: { l: 44, r: 12, t: 12, b: 46 },
    xfmt: function () { return ""; }, yfmt: function (v) { return Math.round(v * 100) + "%"; } });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Filas (n)", min: 30, max: 200, step: 10, value: S.n, onInput: function (v) { S.n = v; update(); } });
  ui.slider({ label: "Columnas de ruido (p)", min: 20, max: 500, step: 20, value: S.p, onInput: function (v) { S.p = v; update(); } });
  ui.slider({ label: "Variables que se eligen (k)", min: 1, max: 30, step: 1, value: S.k, onInput: function (v) { S.k = v; update(); } });
  ui.button("Otro sorteo de datos", function () { S.seed = S.seed % 9 + 1; update(); });
  api.legend(root, [[api.colors().terracota, "elegir ANTES de repartir (fuga)"], [api.colors().cobalto, "elegir solo con el train (correcto)"]]);

  function draw(ctx, w, h, C) {
    plot.axes(ctx);
    if (!res) return;
    var b = plot.box, cols = [[1, res.leak, res.mLeak, C.terracota, "ANTES de repartir"], [2, res.fair, res.mFair, C.cobalto, "DESPUÉS (solo train)"]];
    D.line(ctx, b.x, plot.y(0.5), b.x + b.w, plot.y(0.5), C.muted, 1.5, [5, 4]);
    D.text(ctx, "azar", b.x + 4, plot.y(0.5) - 5, { size: 10.5, color: C.muted });
    cols.forEach(function (c) {
      var cx = plot.x(c[0]), bw = Math.min(70, b.w / 3 * 0.55);
      var y0 = plot.y(0.3), y1 = plot.y(Math.max(0.3, c[2]));
      D.rect(ctx, cx - bw / 2, y1, bw, y0 - y1, c[3] + "55", c[3], 1.5);
      c[1].forEach(function (v, i) {
        var jx = ((i * 0.61803) % 1 - 0.5) * bw * 0.9;
        D.circle(ctx, cx + jx, plot.y(Math.max(0.3, v)), 2.6, c[3], C.paper, 0.8);
      });
      D.line(ctx, cx - bw / 2 - 4, y1, cx + bw / 2 + 4, y1, C.ink, 2.4);
      D.text(ctx, Math.round(c[2] * 100) + " %", cx, y0 - 8, { align: "center", size: 13, weight: 700, color: C.ink });
      D.text(ctx, c[4], cx, b.y + b.h + 17, { align: "center", size: w < 420 ? 10 : 11.5, weight: 600, color: C.ink2 });
    });
  }
  view.draw(draw);

  function update() {
    compute();
    out.set("<b>" + S.n + " filas, " + S.p + " columnas de ruido puro, eliges " + S.k + "</b> (media de " + REP + " sorteos)" +
      "<br>Elegir ANTES de repartir: <span class='bad'><b>" + (res.mLeak * 100).toFixed(1).replace(".", ",") + " %</b></span> de acierto en el test" +
      "<br>Elegir solo con el train: <span class='good'><b>" + (res.mFair * 100).toFixed(1).replace(".", ",") + " %</b></span> (el azar puro)" +
      "<br>Fuga: <b>+" + ((res.mLeak - res.mFair) * 100).toFixed(1).replace(".", ",") + " puntos</b> de acierto que no existen: son ruido que \"se coló\" desde el test.");
    view.redraw();
  }
  update();
});
