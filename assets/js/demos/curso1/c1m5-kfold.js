/* Experimento: validación cruzada K-Fold. Cada ronda, un trozo distinto hace de validación. */
Lab.register("curso1/c1m5-kfold", function (root, api) {
  var M = api.math, D = api.d, i;
  var N = 30, r = api.rng(23), X = [], y = [];
  for (i = 0; i < 24; i++) { X.push([r.normal(0, 1), r.normal(0, 1)]); y.push(0); }
  for (i = 0; i < 6; i++) { X.push([r.normal(1.7, 1), r.normal(1.4, 1)]); y.push(1); }
  var st = { K: 5, shuffle: false, strat: false, cur: 5 };
  var fold = [], scores = [], bInVal = [], holdMin = 0, holdMax = 0;

  function order() {
    var ord = []; for (i = 0; i < N; i++) ord.push(i);
    if (st.shuffle) api.rng(99).shuffle(ord);
    return ord;
  }
  function assign() {
    var ord = order(), K = st.K, f = new Array(N), k;
    if (!st.strat) {
      var base = Math.floor(N / K), extra = N % K, pos = 0;
      for (k = 0; k < K; k++) { var size = base + (k < extra ? 1 : 0); for (var t = 0; t < size; t++) f[ord[pos++]] = k; }
    } else {
      var c = 0;
      [0, 1].forEach(function (cl) { ord.forEach(function (idx) { if (y[idx] === cl) f[idx] = (c++) % K; }); });
    }
    return f;
  }
  function knn(trainIdx, q) {
    var d = trainIdx.map(function (j) { return [M.dist(X[j], q), y[j]]; }).sort(function (a, b) { return a[0] - b[0]; }).slice(0, 3), s = 0;
    d.forEach(function (e) { s += e[1]; });
    return s * 2 > d.length ? 1 : 0;
  }
  function acc(trainIdx, testIdx) {
    var ok = 0; testIdx.forEach(function (j) { if (knn(trainIdx, X[j]) === y[j]) ok++; }); return ok / testIdx.length;
  }
  function compute() {
    fold = assign(); scores = []; bInVal = [];
    for (var k = 0; k < st.K; k++) {
      var tr = [], va = [];
      for (i = 0; i < N; i++) (fold[i] === k ? va : tr).push(i);
      scores.push(acc(tr, va)); bInVal.push(va.filter(function (j) { return y[j] === 1; }).length);
    }
    // 25 hold-out aleatorios con un test del mismo tamaño que un fold
    var rr = api.rng(5), mn = 1, mx = 0, nt = Math.floor(N / st.K);
    for (var h = 0; h < 25; h++) {
      var p = []; for (i = 0; i < N; i++) p.push(i); rr.shuffle(p);
      var a = acc(p.slice(nt), p.slice(0, nt)); mn = Math.min(mn, a); mx = Math.max(mx, a);
    }
    holdMin = mn; holdMax = mx;
  }

  var view = api.view(root, { aspect: 1.5, minH: 250, maxH: 420, label: "Cada fila es una ronda de validación cruzada: los cuadrados resaltados son los datos de validación y los claros los de entrenamiento" });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "K (número de folds)", min: 2, max: 10, step: 1, value: st.K, onInput: function (v) { st.K = v; st.cur = v; compute(); update(); } });
  ui.toggle({ label: "Mezclar antes (shuffle)", value: st.shuffle, onChange: function (v) { st.shuffle = v; compute(); update(); } });
  ui.toggle({ label: "Estratificar", value: st.strat, onChange: function (v) { st.strat = v; compute(); update(); } });
  ui.button("Ronda a ronda", function () { st.cur = st.cur >= st.K ? 1 : st.cur + 1; update(); }, "primary");
  ui.button("Calcular todas", function () { st.cur = st.K; update(); });
  var C0 = api.colors();
  api.legend(root, [[C0.cobalto, "clase A (24 muestras)"], [C0.terracota, "clase B (6 muestras)"], [C0.marker, "resaltado = validación de esa ronda"]]);

  function draw(ctx, w, h, C) {
    var K = st.K, L = w < 420 ? 26 : 56, R = w < 420 ? 36 : 54, top = 26, bot = 10;
    var cw = (w - L - R) / N, rowH = (h - top - bot) / K, ch = Math.min(26, rowH - 4), k, j;
    D.text(ctx, w < 420 ? "las 30 muestras →" : "las 30 muestras, tal como están en el conjunto de datos →", L, 13, { size: 10.5, color: C.muted });
    D.text(ctx, "acierto", w - 4, 13, { size: 10.5, align: "right", color: C.muted });
    for (k = 0; k < K; k++) {
      var y0 = top + k * rowH + (rowH - ch) / 2, done = k < st.cur;
      D.text(ctx, w < 420 ? String(k + 1) : "ronda " + (k + 1), L - 6, y0 + ch / 2 + 4, { size: 11, align: "right", color: k === st.cur - 1 ? C.terracotaInk : C.ink2, weight: k === st.cur - 1 ? 700 : 500 });
      for (j = 0; j < N; j++) {
        var x0 = L + j * cw, val = fold[j] === k, col = y[j] ? C.terracota : C.cobalto;
        if (val) { D.rect(ctx, x0 - 1, y0 - 2, cw + 0.5, ch + 4, C.marker, null); }
        ctx.save(); ctx.globalAlpha = val ? 1 : 0.38;
        D.rect(ctx, x0 + 0.6, y0, Math.max(1, cw - 1.6), ch, col, null);
        ctx.restore();
      }
      if (done) {
        var s = scores[k];
        D.text(ctx, s.toFixed(2), w - 4, y0 + ch / 2 + 4, { size: 11.5, align: "right", weight: 700, mono: true, color: s < 0.6 ? C.terracotaInk : C.olivaInk });
      } else D.text(ctx, "—", w - 4, y0 + ch / 2 + 4, { size: 11.5, align: "right", color: C.muted });
    }
  }

  function update() {
    view.redraw();
    var sc = scores.slice(0, st.cur), m = M.mean(sc), s = M.std(sc);
    var noB = bInVal.slice(0, st.cur).filter(function (b) { return b === 0; }).length, bad = scores.slice(0, st.cur).filter(function (v) { return v < 0.5; }).length;
    out.set("rondas hechas: <b>" + st.cur + " de " + st.K + "</b> · aciertos: [" + sc.map(function (v) { return v.toFixed(2); }).join(", ") + "]<br>" +
      "media ± desviación = <b>" + m.toFixed(3) + " ± " + s.toFixed(3) + "</b> · muestras de la clase B en cada validación: [" + bInVal.join(", ") + "]" +
      (noB ? "<br><span class='bad'>" + noB + " fold(s) de validación SIN ninguna muestra de la clase B: el resultado de esa ronda no dice nada sobre B.</span>" : "") +
      (bad ? "<br><span class='bad'>" + bad + " ronda(s) por debajo de 0,50: ¡peor que tirar una moneda!</span>" : "") +
      "<br>25 repartos hold-out al azar (test del mismo tamaño) dieron aciertos entre <b>" + holdMin.toFixed(2) + "</b> y <b>" + holdMax.toFixed(2) + "</b>: una sola partición es una lotería.");
  }
  compute(); view.draw(draw); update();
});
