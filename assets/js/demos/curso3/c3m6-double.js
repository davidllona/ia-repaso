/* Experimento: por qué el máximo de estimaciones con ruido sobreestima (DQN) y cómo lo arregla Double DQN.
   Todas las acciones valen realmente 0; la red las estima con ruido N(0, σ). */
Lab.register("curso3/c3m6-double", function (root, api) {
  var D = api.d, M = api.math;
  var S = { n: 8, sigma: 1, a: [], b: [], seed: 5, curve: null, rg: null };
  var v1 = api.view(root, { aspect: 2.2, minH: 190, maxH: 280, label: "Estimaciones ruidosas de acciones que valen 0: la mayor sobreestima; otra estimación independiente de esa acción no" });
  var v2 = api.view(root, { aspect: 2.4, minH: 170, maxH: 250, label: "Sesgo medio del máximo frente al número de acciones, para DQN y Double DQN" });
  var p2 = api.plot(v2, { xr: [1, 20], yr: [-0.5, 3], xticks: 19, yticks: 7, xlabel: "número de acciones", ylabel: "valor medio", pad: { l: 46, r: 14, t: 10, b: 34 }, xfmt: function (v) { return (Math.round(v) % 2 === 1) ? Math.round(v) : ""; }, yfmt: function (v) { return (Math.round(v * 2) / 2).toFixed(1).replace(".", ","); } });
  api.legend(root, [[api.colors().terracota, "DQN: máx de las estimaciones"], [api.colors().cobalto, "Double DQN: se elige con una estimación y se evalúa con otra"], [api.colors().olivaInk, "valor real = 0"]]);
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Número de acciones", min: 2, max: 20, step: 1, value: S.n, fmt: function (v) { return v; }, onInput: function (v) { S.n = v; update(); } });
  ui.slider({ label: "Ruido σ de la estimación", min: 0.1, max: 2, step: 0.1, value: S.sigma, fmt: function (v) { return v.toFixed(1).replace(".", ","); }, onInput: function (v) { S.sigma = v; mc(); sample(); update(); } });
  ui.button("Sortear otra vez", function () { sample(); update(); }, "primary");

  function sample() {
    S.a = []; S.b = [];
    for (var i = 0; i < 20; i++) { S.a.push(S.rg.normal(0, S.sigma)); S.b.push(S.rg.normal(0, S.sigma)); }
  }
  function mc() {
    var rg = api.rng(77), T = 3000, mx = [], db = [];
    for (var n = 1; n <= 20; n++) {
      var sm = 0, sd = 0;
      for (var t = 0; t < T; t++) {
        var best = -1e9, bi = 0, vals = [];
        for (var i = 0; i < n; i++) { var v = rg.normal(0, S.sigma); vals.push(v); if (v > best) { best = v; bi = i; } }
        sm += best; sd += rg.normal(0, S.sigma);
      }
      mx.push(sm / T); db.push(sd / T);
    }
    S.curve = { mx: mx, db: db };
  }
  S.rg = api.rng(S.seed);
  function drawBars(ctx, w, h, C) {
    var n = S.n, m = { l: 36, r: 8, t: 16, b: 26 }, bw = (w - m.l - m.r) / n, rng = 3.5;
    var y0 = m.t + (h - m.t - m.b) / 2, sc = (h - m.t - m.b) / (2 * rng);
    function Y(v) { return y0 - M.clamp(v, -rng, rng) * sc; }
    for (var g = -3; g <= 3; g += 1) { D.line(ctx, m.l, Y(g), w - m.r, Y(g), g === 0 ? C.olivaInk : C.line, g === 0 ? 2 : 1, g === 0 ? [6, 4] : null); D.text(ctx, String(g).replace("-", "−"), m.l - 6, Y(g) + 4, { align: "right", size: 10.5, color: C.muted, mono: true }); }
    var bi = 0; for (var i = 1; i < n; i++) if (S.a[i] > S.a[bi]) bi = i;
    for (i = 0; i < n; i++) {
      var x = m.l + i * bw + bw * 0.15, ww = bw * 0.7, hot = i === bi;
      ctx.save(); ctx.globalAlpha = hot ? 0.95 : 0.5; ctx.fillStyle = hot ? C.terracota : C.muted;
      ctx.fillRect(x, Math.min(Y(0), Y(S.a[i])), ww, Math.abs(Y(S.a[i]) - Y(0))); ctx.restore();
      if (hot) D.circle(ctx, x + ww / 2, Y(S.b[i]), Math.max(4, Math.min(7, bw * 0.22)), C.cobalto, C.paper, 2);
      D.text(ctx, String(i + 1), x + ww / 2, h - 10, { align: "center", size: n > 12 ? 9 : 10.5, color: C.muted, mono: true });
    }
    D.text(ctx, (w < 480 ? "barras: red principal · punto azul: estimación independiente" : "barras: estimaciones de la red principal · punto azul: estimación independiente de la acción ganadora"), m.l, 11, { size: n > 12 || w < 480 ? 9 : 10.5, color: C.muted });
  }
  function drawCurve(ctx, w, h, C) {
    p2.axes(ctx); if (!S.curve) return;
    ctx.save(); p2.clip(ctx);
    D.line(ctx, p2.x(1), p2.y(0), p2.x(20), p2.y(0), C.olivaInk, 1.6, [6, 4]);
    D.path(ctx, S.curve.mx.map(function (v, i) { return [p2.x(i + 1), p2.y(v)]; }), C.terracota, 3);
    D.path(ctx, S.curve.db.map(function (v, i) { return [p2.x(i + 1), p2.y(v)]; }), C.cobalto, 3);
    D.line(ctx, p2.x(S.n), p2.box.y, p2.x(S.n), p2.box.y + p2.box.h, C.ink, 1.2, [3, 3]);
    ctx.restore();
    D.circle(ctx, p2.x(S.n), p2.y(S.curve.mx[S.n - 1]), 5, C.terracota, C.paper, 2);
  }
  function f(v) { return (v < 0 ? "−" : "") + Math.abs(v).toFixed(2).replace(".", ","); }
  function update() {
    var n = S.n, bi = 0; for (var i = 1; i < n; i++) if (S.a[i] > S.a[bi]) bi = i;
    out.set("En este sorteo la mayor estimación es la de la acción <b>" + (bi + 1) + "</b>: <b>" + f(S.a[bi]) + "</b> (y todas valen 0 en realidad). DQN usaría <b>" + f(S.a[bi]) + "</b> en el objetivo; Double DQN elige esa misma acción pero la evalúa con otra estimación independiente: <b>" + f(S.b[bi]) + "</b>.<br>" +
      "Promedio de 3000 sorteos con " + n + " acciones y σ = " + S.sigma.toFixed(1).replace(".", ",") + ": máximo = <span class='bad'><b>" + f(S.curve.mx[n - 1]) + "</b></span> (sesgo hacia arriba) · Double = <span class='good'><b>" + f(S.curve.db[n - 1]) + "</b></span> (≈ 0, sin sesgo).");
    v1.redraw(); v2.redraw();
  }
  v1.draw(drawBars); v2.draw(drawCurve); mc(); sample(); update();
});
