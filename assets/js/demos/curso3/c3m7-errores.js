/* Experimento: errores típicos que se ven en las curvas. Se entrena de verdad (descenso de gradiente) una regresión lineal con dos variables
   de pisos (superficie y antigüedad) y se rompe a propósito de cinco maneras: variables sin escalar, learning rate demasiado alto o demasiado bajo,
   y objetivo desalineado con las filas (barajar X e y por separado). La pérdida está dividida por la varianza de y: 1 = predecir siempre la media. */
Lab.register("curso3/c3m7-errores", function (root, api) {
  var D = api.d, M = api.math;
  var STEPS = 100, N = 120;
  var PRESETS = { bien: { lr: 0.1, scale: true, shuffle: false }, sin: { lr: 0.1, scale: false, shuffle: false }, alto: { lr: 1.2, scale: true, shuffle: false },
                  bajo: { lr: 0.002, scale: true, shuffle: false }, desal: { lr: 0.1, scale: true, shuffle: true } };
  var S = { bug: "bien", lr: 0.1 }, base = null, run = null;

  function makeData() {
    var R = api.rng(11), X = [], y = [], i;
    for (i = 0; i < N; i++) { var sup = R.normal(85, 28), ant = R.normal(30, 17); X.push([sup, ant]); y.push(2.0 * sup - 1.5 * ant + 40 + R.normal(0, 15)); }
    base = { X: X, y: y };
  }
  function train() {
    var P = PRESETS[S.bug], i, k, X = base.X.map(function (r) { return r.slice(); }), y = base.y.slice();
    if (P.shuffle) { var R = api.rng(5); y = R.shuffle(y); }
    var mx = [M.mean(X.map(function (r) { return r[0]; })), M.mean(X.map(function (r) { return r[1]; }))];
    var sx = [M.std(X.map(function (r) { return r[0]; })), M.std(X.map(function (r) { return r[1]; }))];
    var my = M.mean(y), sy = M.std(y);
    if (P.scale) { X = X.map(function (r) { return [(r[0] - mx[0]) / sx[0], (r[1] - mx[1]) / sx[1]]; }); y = y.map(function (v) { return (v - my) / sy; }); }
    var vy = M.std(y) * M.std(y), w = [0, 0], b = 0, losses = [], exploded = -1;
    for (var t = 0; t <= STEPS; t++) {
      var g0 = 0, g1 = 0, gb = 0, L = 0;
      for (i = 0; i < N; i++) { var e = w[0] * X[i][0] + w[1] * X[i][1] + b - y[i]; L += e * e; g0 += 2 * e * X[i][0] / N; g1 += 2 * e * X[i][1] / N; gb += 2 * e / N; }
      L = L / N / vy;
      if (!isFinite(L) || L > 1e6) { exploded = t; break; }
      losses.push(L);
      w[0] -= S.lr * g0; w[1] -= S.lr * g1; b -= S.lr * gb;
    }
    run = { losses: losses, exploded: exploded };
  }

  var view = api.view(root, { aspect: 1.9, minH: 240, maxH: 330, label: "Pérdida normalizada de cada paso del descenso de gradiente, en escala logarítmica" });
  var plot = api.plot(view, { xr: [0, STEPS], yr: [-3, 2], xticks: 5, yticks: 5, grid: true, pad: { l: 46, r: 12, t: 12, b: 34 }, xlabel: "paso de entrenamiento",
    yfmt: function (v) { return v === -3 ? "0,001" : v === -2 ? "0,01" : v === -1 ? "0,1" : v === 0 ? "1" : v === 1 ? "10" : "100"; } });
  var ui = api.controls(root), out = api.readout(root);
  var seg = ui.segmented({ label: "Qué se hace mal", options: [["bien", "Todo bien"], ["sin", "Sin escalar"], ["alto", "lr muy alto"], ["bajo", "lr muy bajo"], ["desal", "X e y desalineadas"]], value: S.bug,
    onChange: function (v) { S.bug = v; S.lr = PRESETS[v].lr; lrs.set(S.lr, true); update(); } });
  var lrs = ui.slider({ label: "Learning rate", min: 0.0001, max: 1.5, step: 0.0001, value: S.lr, fmt: function (v) { return v.toFixed(4).replace(".", ","); }, onInput: function (v) { S.lr = v; update(); } });

  view.draw(function (ctx, w, h, C) {
    plot.axes(ctx);
    if (!run) return;
    var b = plot.box, pts = [], i;
    D.line(ctx, b.x, plot.y(0), b.x + b.w, plot.y(0), C.muted, 1.5, [5, 4]);
    D.text(ctx, "predecir siempre la media", b.x + b.w - 5, plot.y(0) - 5, { align: "right", size: 10.5, color: C.muted });
    ctx.save(); plot.clip(ctx);
    for (i = 0; i < run.losses.length; i++) pts.push([plot.x(i), plot.y(M.clamp(Math.log10(Math.max(run.losses[i], 1e-4)), -3, 2))]);
    D.path(ctx, pts, C.terracota, 2.6);
    ctx.restore();
    if (run.exploded >= 0) {
      D.text(ctx, "explota en el paso " + run.exploded, plot.x(Math.max(2, run.exploded)) + 8, b.y + 16, { size: 12, weight: 700, color: C.terracotaInk });
      if (pts.length) D.circle(ctx, pts[pts.length - 1][0], pts[pts.length - 1][1], 5, C.terracotaInk);
    } else D.circle(ctx, pts[pts.length - 1][0], pts[pts.length - 1][1], 5, C.terracota, C.ink, 1.5);
  });

  var TXT = {
    bien: "Variables y objetivo estandarizados, learning rate razonable: la pérdida cae en picado y se queda en el suelo del ruido (≈ 0,06: es la fracción de la variación que es puro ruido).",
    sin: "<b>Sin escalar</b>: la superficie vale ~85 y la antigüedad ~30, así que sus gradientes son enormes (y distintos entre sí). El mismo learning rate que funcionaba <b>se pasa de largo</b> y la pérdida explota. Baja el learning rate a 0,0001 y verás el otro síntoma: avanza a paso de tortuga.",
    alto: "<b>Learning rate demasiado alto</b>: cada paso salta al otro lado del valle y se aleja más de lo que se acerca. La pérdida crece en vez de bajar.",
    bajo: "<b>Learning rate demasiado bajo</b>: el modelo sí mejora, pero tan despacio que en 100 pasos apenas se ha movido. En Keras lo verías como una curva casi plana desde la primera época.",
    desal: "<b>Filas y etiquetas desalineadas</b> (por ejemplo, barajar X e y por separado): ya no hay relación que aprender y la pérdida se queda en ≈ 1, el nivel de predecir la media. Es un fallo de datos, no de modelo: ¡no lo arregla ninguna red más grande!"
  };
  function update() {
    train();
    var r = run, last = r.losses[r.losses.length - 1];
    out.set("<b>Pérdida inicial:</b> " + r.losses[0].toFixed(2).replace(".", ",") + " · <b>tras " + (r.losses.length - 1) + " pasos:</b> " +
      (r.exploded >= 0 ? "<span class='bad'>infinita (el entrenamiento explotó)</span>" : "<span class='" + (last < 0.2 ? "good" : "bad") + "'>" + (last < 0.01 ? last.toExponential(1).replace(".", ",") : last.toFixed(3).replace(".", ",")) + "</span>") +
      "<br>" + TXT[S.bug]);
    view.redraw();
  }
  makeData(); update();
});
