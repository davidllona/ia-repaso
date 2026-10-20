/* Experimento: una neurona (regresión logística) solo dibuja una recta en las variables que le das.
   Si le añades variables nuevas calculadas a partir de las originales (x1², x2², x1·x2, x1²+x2²), la frontera
   deja de ser una recta en el plano (x1, x2). Como el fragmento 18. */
Lab.register("curso4/c4m4-no-lineal", function (root, api) {
  var M = api.math, D = api.d;
  var S = { data: "circulos", feats: "xy", seed: 4 };
  var pts, R, wts, mu, sd, ready = false;

  var wrap = api.el("div", { style: { maxWidth: "560px", margin: "0 auto" } }); root.appendChild(wrap);
  var view = api.view(wrap, { aspect: 1.1, minH: 280, maxH: 520, label: "Dos grupos de puntos, el mapa de probabilidad del modelo y la frontera p = 0.5" });
  var plot = api.plot(view, { xr: [-1.6, 1.6], yr: [-1.6, 1.6], xticks: 4, yticks: 4, xlabel: "x1", ylabel: "x2", pad: { l: 40, r: 10, t: 10, b: 36 }, grid: false, xfmt: function (v) { return +v.toFixed(1); }, yfmt: function (v) { return +v.toFixed(1); } });
  var ui = api.controls(root), out = api.readout(root);
  ui.select({ label: "Datos", value: S.data, options: [["circulos", "Un grupo dentro de otro (círculos)"], ["cuadrantes", "Esquinas opuestas (como XOR)"], ["rectos", "Separables con una recta"]], onChange: function (v) { S.data = v; gen(); } });
  ui.select({ label: "Variables que ve el modelo", value: S.feats, options: [["xy", "x1, x2"], ["sq", "x1, x2, x1², x2²"], ["prod", "x1, x2, x1·x2"], ["r2", "x1, x2, x1² + x2²"]], onChange: function (v) { S.feats = v; train(); } });
  ui.button("Datos nuevos", function () { S.seed += 3; gen(); });

  function sig(z) { return 1 / (1 + Math.exp(-z)); }
  function feat(x, y) {
    switch (S.feats) { case "sq": return [x, y, x * x, y * y]; case "prod": return [x, y, x * y]; case "r2": return [x, y, x * x + y * y]; default: return [x, y]; }
  }
  function gen() {
    var r = api.rng(S.seed), i, a, rad;
    pts = [];
    if (S.data === "circulos") {
      for (i = 0; i < 100; i++) { a = r.range(0, 6.2832); rad = Math.abs(r.normal(0.45, 0.1)); pts.push({ x: rad * Math.cos(a), y: rad * Math.sin(a), c: 1 }); }
      for (i = 0; i < 100; i++) { a = r.range(0, 6.2832); rad = Math.abs(r.normal(1.1, 0.12)); pts.push({ x: rad * Math.cos(a), y: rad * Math.sin(a), c: 0 }); }
    } else if (S.data === "cuadrantes") {
      for (i = 0; i < 200; i++) { var x = r.range(-1.3, 1.3), y = r.range(-1.3, 1.3); if (Math.abs(x) < 0.12 || Math.abs(y) < 0.12) { i--; continue; } pts.push({ x: x, y: y, c: x * y > 0 ? 1 : 0 }); }
    } else {
      for (i = 0; i < 100; i++) pts.push({ x: r.normal(-0.6, 0.35), y: r.normal(-0.4, 0.35), c: 0 });
      for (i = 0; i < 100; i++) pts.push({ x: r.normal(0.6, 0.35), y: r.normal(0.5, 0.35), c: 1 });
    }
    train();
  }
  function train() {
    var F = pts.map(function (p) { return feat(p.x, p.y); }), d = F[0].length, n = F.length, j, i, k;
    mu = []; sd = [];
    for (j = 0; j < d; j++) { var col = F.map(function (v) { return v[j]; }); mu.push(M.mean(col)); sd.push(M.std(col) || 1); }
    var Z = F.map(function (v) { return v.map(function (t, j2) { return (t - mu[j2]) / sd[j2]; }); });
    var w = new Array(d).fill(0), b = 0, g, gb, e, z;
    for (k = 0; k < 1500; k++) {
      g = new Array(d).fill(0); gb = 0;
      for (i = 0; i < n; i++) { z = b; for (j = 0; j < d; j++) z += w[j] * Z[i][j]; e = sig(z) - pts[i].c; for (j = 0; j < d; j++) g[j] += e * Z[i][j]; gb += e; }
      for (j = 0; j < d; j++) w[j] -= 1.0 * g[j] / n; b -= 1.0 * gb / n;
    }
    wts = { w: w, b: b };
    var L = 0, ok = 0;
    for (i = 0; i < n; i++) { z = score(pts[i].x, pts[i].y); L += Math.max(z, 0) - z * pts[i].c + Math.log(1 + Math.exp(-Math.abs(z))); if ((z > 0) === (pts[i].c === 1)) ok++; }
    R = { loss: L / n, acc: ok / n, d: d };
    redraw();
  }
  function score(x, y) { var f = feat(x, y), z = wts.b, j; for (j = 0; j < f.length; j++) z += wts.w[j] * (f[j] - mu[j]) / sd[j]; return z; }

  view.draw(function (ctx, w, h, C) {
    if (!ready) return;
    plot.axes(ctx); ctx.save(); plot.clip(ctx);
    var N = 36, ix, iy, d = 3.2 / N, q, i, xa, xb, ya, yb;
    for (iy = 0; iy < N; iy++) for (ix = 0; ix < N; ix++) {
      q = sig(score(-1.6 + d * (ix + 0.5), -1.6 + d * (iy + 0.5)));
      ctx.globalAlpha = 0.06 + 0.32 * Math.abs(q - 0.5) * 2; ctx.fillStyle = q > 0.5 ? C.cobalto : C.terracota;
      xa = Math.round(plot.x(-1.6 + d * ix)); xb = Math.round(plot.x(-1.6 + d * (ix + 1))); ya = Math.round(plot.y(-1.6 + d * (iy + 1))); yb = Math.round(plot.y(-1.6 + d * iy));
      ctx.fillRect(xa, ya, xb - xa, yb - ya);
    }
    ctx.globalAlpha = 1;
    for (i = 0; i < pts.length; i++) {
      var good = (score(pts[i].x, pts[i].y) > 0) === (pts[i].c === 1);
      D.circle(ctx, plot.x(pts[i].x), plot.y(pts[i].y), 4, pts[i].c ? C.cobalto : C.terracota, good ? C.paper : C.ink, good ? 1 : 2.2);
    }
    ctx.restore();
  });
  function redraw() {
    view.redraw();
    var np = R.d + 1;
    out.set("variables: <b>" + R.d + "</b> → parámetros del modelo: <b>" + np + "</b> (" + R.d + " pesos + 1 sesgo)<br>" +
      "pérdida BCE = <b>" + R.loss.toFixed(3) + "</b> · accuracy = <b>" + R.acc.toFixed(3) + "</b>" + (R.acc < 0.7 ? " <span class='bad'>← casi como lanzar una moneda: una recta no puede separar estos grupos</span>" : R.acc > 0.95 ? " <span class='good'>← la frontera ya no es una recta en (x1, x2)</span>" : ""));
  }
  ready = true; gen();
});
