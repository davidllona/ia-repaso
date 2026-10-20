/* Experimento: truco de reparametrización. z = μ + σ·ε con ε ~ N(0,1) fijo: el azar vive en ε y μ, σ solo desplazan y estiran.
   Se ven las muestras de ε, las de z, la densidad N(μ, σ²) y las derivadas ∂z/∂μ = 1 y ∂z/∂σ = ε de un punto marcado. */
Lab.register("curso3/c3m4-reparametrizacion", function (root, api) {
  var D = api.d, M = api.math;
  var N = 36, S = { mu: 1.2, sg: 0.5, seed: 4, eps: [], pick: 0 };
  function newEps() {
    var r = api.rng(S.seed++); S.eps = [];
    for (var i = 0; i < N; i++) S.eps.push(M.clamp(r.normal(0, 1), -3.2, 3.2));
    S.eps[0] = 0.8; S.pick = 0;
  }
  newEps();
  var view = api.view(root, { aspect: 1.35, minH: 280, maxH: 420, drag: true, label: "Muestras de epsilon arriba y muestras de z = mu + sigma por epsilon abajo" });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Centro μ (dónde la coloca)", min: -3, max: 3, step: 0.1, value: S.mu, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.mu = v; update(); } });
  ui.slider({ label: "Anchura σ (cuánto duda)", min: 0.1, max: 2, step: 0.05, value: S.sg, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.sg = v; update(); } });
  ui.button("Otras muestras de ε", function () { newEps(); update(); });

  var XR = [-5, 5];
  function geom(w, h) {
    var l = 14, r = 14;
    return { l: l, w: w - l - r, topY: h * 0.40, botY: h * 0.90, hh: h * 0.26 };
  }
  function gx(g, v) { return g.l + (v - XR[0]) / (XR[1] - XR[0]) * g.w; }
  function dens(x, mu, s) { return Math.exp(-0.5 * (x - mu) * (x - mu) / (s * s)) / (s * Math.sqrt(2 * Math.PI)); }
  function draw(ctx, w, h, C) {
    var g = geom(w, h), i, x;
    // paneles
    function panel(yBase, mu, s, col, wash, lab) {
      var peak = dens(mu, mu, s), sc = g.hh / Math.max(peak, 0.8), pts = [];
      for (x = XR[0]; x <= XR[1] + 1e-9; x += 0.05) pts.push([gx(g, x), yBase - dens(x, mu, s) * sc]);
      ctx.save(); ctx.beginPath(); ctx.moveTo(gx(g, XR[0]), yBase);
      pts.forEach(function (p) { ctx.lineTo(p[0], p[1]); }); ctx.lineTo(gx(g, XR[1]), yBase); ctx.closePath();
      ctx.fillStyle = wash; ctx.fill(); ctx.restore();
      D.path(ctx, pts, col, 2);
      D.line(ctx, g.l, yBase, g.l + g.w, yBase, C.ink, 1.5);
      for (var t = -4; t <= 4; t += 2) {
        D.line(ctx, gx(g, t), yBase, gx(g, t), yBase + 4, C.ink, 1);
        D.text(ctx, String(t).replace("-", "−"), gx(g, t), yBase + 15, { size: 10, mono: true, color: C.muted, align: "center" });
      }
      D.text(ctx, lab, g.l + 2, yBase - g.hh - 6, { size: 12, weight: 600, color: col });
    }
    panel(g.topY, 0, 1, C.cobalto, C.cobaltoWash, "ε ~ N(0, 1)   (el azar, siempre el mismo)");
    panel(g.botY, S.mu, S.sg, C.terracota, C.terracotaWash, "z = μ + σ·ε   ~ N(μ, σ²)");
    // flechas de ε a z
    for (i = 0; i < N; i++) {
      var e = S.eps[i], z = S.mu + S.sg * e, hot = i === S.pick;
      ctx.save(); ctx.globalAlpha = hot ? 0.9 : 0.22;
      D.line(ctx, gx(g, e), g.topY - 5, gx(g, z), g.botY - 5, hot ? C.ink : C.muted, hot ? 1.8 : 1, hot ? [] : []);
      ctx.restore();
    }
    for (i = 0; i < N; i++) {
      var e2 = S.eps[i], z2 = S.mu + S.sg * e2, hot2 = i === S.pick;
      var yy = (i % 3) * 5;
      D.circle(ctx, gx(g, e2), g.topY - 5 - yy * 0, hot2 ? 6 : 3.4, hot2 ? C.ink : C.cobalto, C.paper, 1);
      D.circle(ctx, gx(g, z2), g.botY - 5, hot2 ? 6 : 3.4, hot2 ? C.ink : C.terracota, C.paper, 1);
    }
    // marca μ
    D.line(ctx, gx(g, S.mu), g.botY - g.hh - 2, gx(g, S.mu), g.botY + 2, C.terracotaInk, 1.2, [4, 3]);
    // etiqueta del punto marcado
    var ep = S.eps[S.pick], zp = S.mu + S.sg * ep;
    D.text(ctx, "ε = " + ep.toFixed(2).replace("-", "−"), gx(g, ep), g.topY + 28, { size: 11, mono: true, weight: 700, align: "center", color: C.ink });
    D.text(ctx, "z = " + zp.toFixed(2).replace("-", "−"), gx(g, zp), g.botY + 28, { size: 11, mono: true, weight: 700, align: "center", color: C.ink });
  }
  function xToEps(px) { var g = geom(view.w, view.h); return M.clamp(XR[0] + (px - g.l) / g.w * (XR[1] - XR[0]), -3.5, 3.5); }
  function onPtr(px, py) {
    var g = geom(view.w, view.h);
    if (py < (g.topY + g.botY - g.hh) / 2 + 20) { S.eps[S.pick] = xToEps(px); update(); }
  }
  view.pointer({ down: onPtr, drag: onPtr });
  function f(v, k) { return v.toFixed(k === undefined ? 2 : k).replace("-", "−"); }
  function update() {
    var ep = S.eps[S.pick], zp = S.mu + S.sg * ep;
    var zs = S.eps.map(function (e) { return S.mu + S.sg * e; });
    out.set("<b>Punto marcado:</b> z = μ + σ·ε = " + f(S.mu, 2) + " + " + f(S.sg, 2) + " · " + f(ep) + " = <b>" + f(zp) + "</b><br>" +
      "<b>Derivadas</b> (lo que necesita el backpropagation): ∂z/∂μ = <b>1</b> · ∂z/∂σ = ε = <b>" + f(ep) + "</b>. Son números normales: el gradiente puede pasar.<br>" +
      "<b>Las " + N + " muestras:</b> media de z = " + f(M.mean(zs)) + " (μ = " + f(S.mu, 1) + ") · desviación de z = " + f(M.std(zs)) + " (σ = " + f(S.sg) + ")");
    view.redraw();
  }
  view.draw(draw); update();
});
