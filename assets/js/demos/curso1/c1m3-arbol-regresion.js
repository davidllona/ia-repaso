/* Experimento: árbol de regresión en 1D: predice la media de cada hoja (función escalón). */
Lab.register("curso1/c1m3-arbol-regresion", function (root, api) {
  var D = api.d, M = api.math;
  var seed = 4, noise = 0.8, depth = 2, MAXD = 8, minLeaf = 1, showLine = false, train, test, tree, errs, lin;
  function f(x) { return 4 + 3 * Math.sin(0.9 * x); }
  function gen() {
    var r = api.rng(seed), t = api.rng(500 + seed), i;
    train = []; test = [];
    for (i = 0; i < 60; i++) { var x = r.range(0, 10); train.push([x, f(x) + r.normal(0, noise)]); }
    for (i = 0; i < 150; i++) { var x2 = t.range(0, 10); test.push([x2, f(x2) + t.normal(0, noise)]); }
    tree = grow(train.slice().sort(function (a, b) { return a[0] - b[0]; }), 0);
    lin = M.linreg(train.map(function (p) { return p[0]; }), train.map(function (p) { return p[1]; }));
    errs = []; for (var d = 1; d <= MAXD; d++) errs.push([d, mse(train, d), mse(test, d)]);
  }
  /* Cada pregunta «x ≤ umbral» se elige para minimizar la suma de errores cuadráticos (SSE) de las dos mitades */
  function sse(s, e) { var m = 0, i, v = 0; for (i = s; i < e; i++) m += s_[i][1]; m /= (e - s); for (i = s; i < e; i++) v += (s_[i][1] - m) * (s_[i][1] - m); return v; }
  var s_ = [];
  function grow(sorted, dep) {
    var n = sorted.length, mean = M.mean(sorted.map(function (p) { return p[1]; }));
    var node = { depth: dep, n: n, pred: mean, lo: sorted[0][0], hi: sorted[n - 1][0] };
    if (n < 2 || dep >= MAXD) return node;
    s_ = sorted; var best = null, i;
    for (i = 1; i < n; i++) {
      if (sorted[i][0] === sorted[i - 1][0] || i < minLeaf || n - i < minLeaf) continue;
      var tot = sse(0, i) + sse(i, n);
      if (!best || tot < best.s - 1e-12) best = { s: tot, i: i, t: (sorted[i][0] + sorted[i - 1][0]) / 2 };
    }
    if (!best) return node;
    node.t = best.t;
    node.left = grow(sorted.slice(0, best.i), dep + 1); node.right = grow(sorted.slice(best.i), dep + 1);
    return node;
  }
  function predict(x, cap) { var nd = tree; while (nd.left && nd.depth < cap) nd = x <= nd.t ? nd.left : nd.right; return nd.pred; }
  function mse(set, cap) { return M.mean(set.map(function (p) { var e = predict(p[0], cap) - p[1]; return e * e; })); }
  function leaves(nd, cap) { return (nd.left && nd.depth < cap) ? leaves(nd.left, cap) + leaves(nd.right, cap) : 1; }
  function cuts(nd, cap, arr) { if (nd.left && nd.depth < cap) { arr.push(nd.t); cuts(nd.left, cap, arr); cuts(nd.right, cap, arr); } return arr; }

  var view = api.view(root, { aspect: 1.8, minH: 250, label: "Tensión de las escenas de una película según el minuto, y predicción escalonada de un árbol de regresión" });
  var plot = api.plot(view, { xr: [0, 10], yr: [-1, 9], xticks: 5, yticks: 5, grid: false, xlabel: "minuto de la película", ylabel: "nivel de tensión de la escena", pad: { l: 40, r: 10, t: 10, b: 36 }, xfmt: function (v) { return v * 10; }, yfmt: function (v) { return ""; } });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Profundidad máxima (max_depth)", min: 1, max: MAXD, step: 1, value: depth, onInput: function (v) { depth = v; update(); } });
  ui.slider({ label: "Mínimo de datos por hoja (min_samples_leaf)", min: 1, max: 10, step: 1, value: minLeaf, onInput: function (v) { minLeaf = v; gen(); update(); } });
  ui.slider({ label: "Ruido de los datos", min: 0.2, max: 1.6, step: 0.2, value: noise, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { noise = v; gen(); update(); } });
  ui.toggle({ label: "Comparar con una recta (regresión lineal)", value: false, onChange: function (v) { showLine = v; update(); } });
  ui.button("Generar otros datos", function () { seed += 3; gen(); update(); });
  api.legend(root, [[api.colors().cobalto, "escenas medidas (entrenamiento)"], [api.colors().terracota, "predicción del árbol"], [api.colors().muted, "tensión real (desconocida)"]]);

  function draw(ctx, w, h, C) {
    plot.axes(ctx); ctx.save(); plot.clip(ctx);
    var i, tr = [], pr = [], cs = cuts(tree, depth, []).sort(function (a, b) { return a - b; });
    for (i = 0; i <= 160; i++) { var x = 10 * i / 160; tr.push([plot.x(x), plot.y(f(x))]); }
    D.path(ctx, tr, C.muted, 1.5, [5, 4]);
    cs.forEach(function (t) { D.line(ctx, plot.x(t), plot.box.y, plot.x(t), plot.box.y + plot.box.h, C.line, 1); });
    for (i = 0; i <= 400; i++) { var x2 = 10 * i / 400; pr.push([plot.x(x2), plot.y(predict(x2, depth))]); }
    D.path(ctx, pr, C.terracota, 3);
    if (showLine) D.path(ctx, [[plot.x(0), plot.y(lin.b)], [plot.x(10), plot.y(lin.b + lin.m * 10)]], C.oliva, 2.5, [8, 4]);
    train.forEach(function (p) { D.circle(ctx, plot.x(p[0]), plot.y(p[1]), 4.5, C.cobalto, C.paper, 1.2); });
    ctx.restore();
  }
  function update() {
    view.redraw();
    var e = errs[depth - 1], linTe = M.mean(test.map(function (p) { var q = lin.b + lin.m * p[0] - p[1]; return q * q; }));
    var bd = 1; errs.forEach(function (q) { if (q[2] < errs[bd - 1][2]) bd = q[0]; });
    var s2 = noise * noise;
    var verdict = e[1] > 1.6 * s2 ? "<span class='bad'>Infraajuste: el error de train es mucho mayor que el ruido; faltan escalones para seguir la forma.</span>"
      : (e[1] < 0.5 * s2 && e[2] > 1.8 * e[1] ? "<span class='bad'>Sobreajuste: el error de train es menor que el propio ruido de los datos (ha memorizado ruido) y el de test es mucho mayor.</span>"
      : "<span class='good'>Buen equilibrio: el error de train ronda el ruido y el de test no se dispara.</span>");
    out.set("max_depth = <b>" + depth + "</b> · hojas (escalones) = <b>" + leaves(tree, depth) + "</b> · error cuadrático medio: train = <b>" + e[1].toFixed(2) + "</b>, test = <b>" + e[2].toFixed(2) + "</b>" +
      (showLine ? "<br>Recta: error de test = <b>" + linTe.toFixed(2) + "</b>" : "") + "<br>Ruido de los datos (σ²) = <b>" + (noise * noise).toFixed(2) + "</b> · profundidad con menor error de test: <b>" + bd + "</b><br>" + verdict);
  }
  gen(); view.draw(draw); update();
});
