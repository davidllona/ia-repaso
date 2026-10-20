/* Experimento: las cuatro reglas de actualización de PyTorch (SGD, SGD con momentum, RMSprop y Adam) con LOS MISMOS gradientes de entrada.
   Una sola variable; se dibuja el paso Δw que da cada regla en cada iteración. Fórmulas exactas de torch.optim (eps = 1e-8). */
Lab.register("curso5/c5m2-reglas-paso", function (root, api) {
  var D = api.d, C0 = api.colors(), T = 40;
  var S = { pat: "const", lrExp: -2, mu: 0.9, alpha: 0.99, b1: 0.9, b2: 0.999, scale: 1 };
  var PAT = { const: "Constante g = 1", alt: "Alterna +1, −1, +1, −1…", noisy: "Ruidoso: media 1, desviación 2", decay: "Decae hacia 0 (cerca del mínimo)", step: "Cambia de signo a mitad (+1 y luego −1)" };
  var R = api.rng(9), noise = []; for (var q = 0; q < T; q++) noise.push(R.normal(0, 1));
  function grads() {
    var g = [], t;
    for (t = 0; t < T; t++) {
      var v = S.pat === "const" ? 1 : S.pat === "alt" ? (t % 2 ? -1 : 1) : S.pat === "noisy" ? 1 + 2 * noise[t] : S.pat === "decay" ? Math.pow(0.88, t) : (t < T / 2 ? 1 : -1);
      g.push(v * S.scale);
    }
    return g;
  }
  function run() {
    var g = grads(), lr = Math.pow(10, S.lrExp), res = { sgd: [], mom: [], rms: [], adam: [] }, t;
    var v = 0, s = 0, m = 0, a = 0;
    for (t = 0; t < T; t++) {
      var gg = g[t];
      res.sgd.push(-lr * gg);
      v = S.mu * v + gg; res.mom.push(-lr * v);
      s = S.alpha * s + (1 - S.alpha) * gg * gg; res.rms.push(-lr * gg / (Math.sqrt(s) + 1e-8));
      m = S.b1 * m + (1 - S.b1) * gg; a = S.b2 * a + (1 - S.b2) * gg * gg;
      var mh = m / (1 - Math.pow(S.b1, t + 1)), ah = a / (1 - Math.pow(S.b2, t + 1));
      res.adam.push(-lr * mh / (Math.sqrt(ah) + 1e-8));
    }
    return { g: g, r: res, lr: lr };
  }
  var COL = function (C) { return { sgd: C.muted, mom: C.cobalto, rms: C.terracota, adam: C.oliva }; };
  var NAME = { sgd: "SGD", mom: "SGD + momentum", rms: "RMSprop", adam: "Adam" };

  var view = api.view(root, { aspect: 2.1, minH: 230, maxH: 340, label: "Paso que da cada regla de actualización en cada iteración, con los mismos gradientes" });
  var po = { xr: [0, T], yr: [-1, 1], xticks: 4, yticks: 4, xlabel: "iteración t", ylabel: "paso Δw", pad: { l: 50, r: 10, t: 12, b: 36 }, xfmt: function (v) { return Math.round(v); }, yfmt: function (v) { return +v.toPrecision(2); } };
  var plot = api.plot(view, po);
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.72rem, 2.7vw, .84rem)";
  var tb = api.table(root, ["regla", "t=1", "t=40", "Σ"]);
  ui.select({ label: "Gradientes que reciben las cuatro reglas", value: S.pat, options: Object.keys(PAT).map(function (k) { return [k, PAT[k]]; }), onChange: function (v) { S.pat = v; update(); } });
  ui.slider({ label: "Escala de los gradientes (×)", min: -2, max: 2, step: 0.5, value: 0, fmt: function (v) { return "×" + Math.pow(10, v).toPrecision(2).replace(/\.0+$/, ""); }, onInput: function (v) { S.scale = Math.pow(10, v); update(); } });
  ui.slider({ label: "Learning rate (escala log)", min: -4, max: -1, step: 0.1, value: S.lrExp, fmt: function (v) { return Math.pow(10, v).toPrecision(2); }, onInput: function (v) { S.lrExp = v; update(); } });
  ui.slider({ label: "μ del momentum", min: 0, max: 0.99, step: 0.01, value: S.mu, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.mu = v; update(); } });
  ui.slider({ label: "alpha de RMSprop", min: 0.5, max: 0.999, step: 0.001, value: S.alpha, fmt: function (v) { return v.toFixed(3); }, onInput: function (v) { S.alpha = v; update(); } });
  ui.slider({ label: "β₂ de Adam (β₁ = 0,9)", min: 0.9, max: 0.9999, step: 0.0001, value: S.b2, fmt: function (v) { return v.toFixed(4); }, onInput: function (v) { S.b2 = v; update(); } });
  var res;
  api.legend(root, [[C0.muted, "SGD"], [C0.cobalto, "SGD + momentum"], [C0.terracota, "RMSprop"], [C0.oliva, "Adam"]]);

  function draw(ctx, w, h, C) {
    var all = []; ["sgd", "mom", "rms", "adam"].forEach(function (k) { all = all.concat(res.r[k]); });
    var mx = Math.max.apply(null, all.map(Math.abs)) * 1.1 || 1e-6, lg = Math.pow(10, Math.floor(Math.log10(mx))), step = mx / lg > 5 ? 2 : mx / lg > 2.5 ? 1 : 0.5;
    var top = Math.ceil(mx / (lg * step)) * lg * step;
    plot.yr = [-top, top]; po.yticks = 4;
    plot.axes(ctx); ctx.save(); plot.clip(ctx);
    D.line(ctx, plot.x(0), plot.y(0), plot.x(T), plot.y(0), C.ink2, 1);
    var col = COL(C);
    ["sgd", "mom", "rms", "adam"].forEach(function (k) {
      var pts = res.r[k].map(function (v, t) { return [plot.x(t + 1), plot.y(v)]; });
      D.path(ctx, pts, col[k], k === "adam" ? 2.8 : 2.2, k === "sgd" ? [4, 3] : null);
      pts.forEach(function (p, t) { if (t < 12 || t % 4 === 3) D.circle(ctx, p[0], p[1], 2.4, col[k]); });
    });
    ctx.restore();
  }
  res = run();
  view.draw(draw);
  function sci(v) { var a = Math.abs(v); if (a === 0) return "0"; return (a >= 0.0001 && a < 1000 ? String(+v.toPrecision(2)) : v.toExponential(1)).replace("-", "−"); }
  function update() {
    res = run();
    var rows = [];
    ["sgd", "mom", "rms", "adam"].forEach(function (k) {
      var a = res.r[k], tot = a.reduce(function (x, y) { return x + y; }, 0);
      rows.push(["<b>" + (k === "mom" ? "Mom." : k === "rms" ? "RMS" : NAME[k]) + "</b>", sci(a[0]), sci(a[T - 1]), sci(tot)]);
    });
    tb.set(rows);
    var g = res.g, lr = res.lr;
    out.set("lr = <b>" + lr.toPrecision(2) + "</b> · g₁ = <b>" + sci(g[0]) + "</b>, g₂ = <b>" + sci(g[1]) + "</b>. " +
      "Primer paso de Adam = lr·g/|g| = <b>" + sci(-lr * Math.sign(g[0])) + "</b> (no depende de la escala de g); el de RMSprop vale lr/√(1−alpha) = <b>" + sci(-lr / Math.sqrt(1 - S.alpha) * Math.sign(g[0])) + "</b>; el de SGD, <b>" + sci(-lr * g[0]) + "</b> (sí depende).");
    view.redraw();
  }
  update();
});
