/* Experimento: elegir la forma de la curva mirando el scatter. Toda curva "no lineal" se ajusta con regresión lineal sobre columnas transformadas. */
Lab.register("curso1/c1m2-formas", function (root, api) {
  var M = api.math;
  var kinds = {
    lineal:  { name: "Lineal", x: [1, 12], f: function (x) { return 20 + 6 * x; }, sd: 6, mult: false },
    u:       { name: "Curva en U (cuadrática)", x: [1, 12], f: function (x) { return 12 + 1.1 * (x - 6.5) * (x - 6.5); }, sd: 3, mult: false },
    expo:    { name: "Exponencial (crece cada vez más rápido)", x: [1, 12], f: function (x) { return 12 * Math.exp(0.25 * x); }, sd: 0.08, mult: true },
    log:     { name: "Logarítmica (rendimientos decrecientes)", x: [1, 12], f: function (x) { return 20 + 40 * Math.log(x); }, sd: 5, mult: false },
    seno:    { name: "Periódica (estacional, periodo 12)", x: [1, 24], f: function (x) { return 50 + 25 * Math.sin(2 * Math.PI * x / 12 + 0.6); }, sd: 4, mult: false }
  };
  var kind = "expo", model = "recta", P = 12, showTruth = false, pts = [], zs = [];
  var r = api.rng(5), i; for (i = 0; i < 24; i++) zs.push(r.normal(0, 1));

  function build() {
    var k = kinds[kind], n = kind === "seno" ? 24 : 12; pts = [];
    for (var j = 0; j < n; j++) { var x = k.x[0] + (k.x[1] - k.x[0]) * j / (n - 1); pts.push([x, k.mult ? k.f(x) * Math.exp(k.sd * zs[j]) : k.f(x) + k.sd * zs[j]]); }
  }
  // Regresión lineal sobre columnas calculadas con colFn(x); devuelve pesos y función de predicción.
  function linfit(colFn, xs, ys) {
    var p = colFn(xs[0]).length + 1, A = [], b = [], a, c, k;
    for (a = 0; a < p; a++) { A.push(new Array(p).fill(0)); b.push(0); }
    for (k = 0; k < xs.length; k++) { var f = [1].concat(colFn(xs[k])); for (a = 0; a < p; a++) { b[a] += f[a] * ys[k]; for (c = 0; c < p; c++) A[a][c] += f[a] * f[c]; } }
    for (a = 0; a < p; a++) A[a][a] += 1e-9;
    var th = M.solve(A, b);
    return { th: th, at: function (x) { var f2 = [1].concat(colFn(x)), s = 0; for (var q = 0; q < p; q++) s += th[q] * f2[q]; return s; } };
  }
  function model_(m) {
    var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; }), f, g;
    if (m === "recta") { f = linfit(function (x) { return [x]; }, xs, ys); return { pred: f.at, eq: f.th[0].toFixed(1) + " + " + f.th[1].toFixed(2) + "·x", cols: "x" }; }
    if (m === "cuad") { f = linfit(function (x) { return [x, x * x]; }, xs, ys); return { pred: f.at, eq: f.th[0].toFixed(1) + " + " + f.th[1].toFixed(2) + "·x + " + f.th[2].toFixed(3) + "·x²", cols: "x, x²" }; }
    if (m === "cub") { f = linfit(function (x) { return [x, x * x, x * x * x]; }, xs, ys); return { pred: f.at, eq: f.th.map(function (t, q) { return t.toFixed(q > 2 ? 4 : 2); }).join(" ; "), cols: "x, x², x³" }; }
    if (m === "log") { f = linfit(function (x) { return [Math.log(x)]; }, xs, ys); return { pred: f.at, eq: f.th[0].toFixed(1) + " + " + f.th[1].toFixed(1) + "·ln(x)", cols: "ln(x)" }; }
    if (m === "exp") {
      g = linfit(function (x) { return [x]; }, xs, ys.map(function (y) { return Math.log(Math.max(y, 1e-6)); }));
      return { pred: function (x) { return Math.exp(g.at(x)); }, eq: Math.exp(g.th[0]).toFixed(1) + "·e^(" + g.th[1].toFixed(3) + "·x)", cols: "x, pero ajustando ln(y)" };
    }
    f = linfit(function (x) { return [Math.sin(2 * Math.PI * x / P), Math.cos(2 * Math.PI * x / P)]; }, xs, ys);
    return { pred: f.at, eq: f.th[0].toFixed(1) + " + " + f.th[1].toFixed(1) + "·sen + " + f.th[2].toFixed(1) + "·cos (periodo " + P + ")", cols: "sen(2πx/P), cos(2πx/P)" };
  }

  var view = api.view(root, { aspect: 1.7, minH: 270, label: "Datos con una relación escondida y la curva que ajusta la regresión sobre las columnas elegidas" });
  var plot = api.plot(view, { xr: [0, 18], yr: [0, 300], xticks: 6, yticks: 5, xlabel: "x", ylabel: "y", pad: { l: 46, r: 12, t: 12, b: 38 } });
  var ui = api.controls(root), out = api.readout(root);
  ui.select({ label: "¿Qué relación esconden los datos?", options: Object.keys(kinds).map(function (k) { return [k, kinds[k].name]; }), value: kind, onChange: function (v) { kind = v; build(); update(); } });
  ui.select({ label: "¿Qué columnas le damos a la regresión lineal?", options: [["recta", "x  (una recta)"], ["cuad", "x, x²"], ["cub", "x, x², x³"], ["log", "ln(x)"], ["exp", "x → ajusta ln(y)  (exponencial)"], ["per", "sen y cos con periodo P"]], value: model, onChange: function (v) { model = v; update(); } });
  ui.slider({ label: "Periodo P (solo en el modelo periódico)", min: 3, max: 30, step: 0.5, value: P, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { P = v; update(); } });
  ui.toggle({ label: "Mostrar la verdad (sin ruido)", value: false, onChange: function (v) { showTruth = v; update(); } });
  api.legend(root, [[api.colors().ink, "datos observados"], [api.colors().terracota, "curva del modelo (a trazos: fuera de los datos)"], [api.colors().muted, "la verdad"]]);

  function ranges() {
    var xmax = kinds[kind].x[1], ymax = 0; pts.forEach(function (p) { ymax = Math.max(ymax, p[1]); });
    return { xmax: xmax, xr: [0, Math.round(xmax * 1.5)], yr: [0, Math.ceil(ymax * 1.5 / 50) * 50] };
  }
  function draw(ctx, w, h, C) {
    var D = api.d, R = ranges(), m = model_(model), k = kinds[kind], i;
    plot.xr = R.xr; plot.yr = R.yr; plot.axes(ctx); ctx.save(); plot.clip(ctx);
    if (showTruth) { var tr = []; for (i = 0; i <= 150; i++) { var x = R.xr[1] * i / 150; tr.push([plot.x(x), plot.y(k.f(x))]); } D.path(ctx, tr, C.muted, 2, [3, 4]); }
    var a = [], b = [];
    for (i = 0; i <= 200; i++) { var x2 = R.xr[1] * i / 200, pt = [plot.x(x2), plot.y(m.pred(x2))]; (x2 <= R.xmax + 1e-9 ? a : b).push(pt); }
    if (a.length && b.length) b.unshift(a[a.length - 1]);
    D.path(ctx, a, C.terracota, 3); D.path(ctx, b, C.terracota, 2, [6, 5]);
    pts.forEach(function (p) { D.circle(ctx, plot.x(p[0]), plot.y(p[1]), 4.5, C.ink, C.paper, 1.5); });
    ctx.restore();
  }
  function update() {
    view.redraw();
    var m = model_(model), ys = pts.map(function (p) { return p[1]; }), ym = M.mean(ys), sse = 0, sst = 0;
    pts.forEach(function (p) { var e = p[1] - m.pred(p[0]); sse += e * e; sst += (p[1] - ym) * (p[1] - ym); });
    var r2 = 1 - sse / sst, rm = Math.sqrt(sse / pts.length), signs = "", runs = 1, prev = 0;
    pts.forEach(function (p, q) {
      var e = p[1] - m.pred(p[0]), sg = e >= 0 ? 1 : -1;
      signs += (sg > 0 ? "+" : "−") + " "; if (q && sg !== prev) runs++; prev = sg;
    });
    var patron = runs <= Math.max(3, Math.floor(pts.length / 4));
    out.set("Modelo: ŷ = <b>" + m.eq + "</b><br>Columnas usadas: <b>" + m.cols + "</b><br>R² = <b>" + r2.toFixed(3) + "</b> · RMSE = <b>" + rm.toFixed(1) + "</b><br>" +
      "Signo de los residuos, de izquierda a derecha: <b>" + signs + "</b><br>" +
      (patron ? "<span class='bad'>Los residuos van en bloques (+ + + − − − …): la curva se equivoca siempre en el mismo sentido en cada zona. Señal de que la forma elegida no es la adecuada, aunque el R² salga alto.</span>"
             : "<span class='good'>Los residuos se reparten al azar entre + y −: no queda ninguna forma sin explicar.</span>"));
  }
  build(); view.draw(draw); update();
});
