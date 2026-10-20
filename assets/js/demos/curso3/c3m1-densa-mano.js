/* Experimento: una capa Dense «a mano» (2 entradas → 2 neuronas). Forward z = x·W + b, a = f(z); pérdida MSE;
   gradiente por la regla de la cadena: δ = (a − t)·f′(z), ∂L/∂W = xᵀ·δ, ∂L/∂b = δ. Es exactamente lo que calcula GradientTape. */
Lab.register("curso3/c3m1-densa-mano", function (root, api) {
  var D = api.d, M = api.math;
  var W0 = [[0.5, -0.3], [0.2, 0.8]], b0 = [0.1, -0.2];
  var S = { x: [1.0, 2.0], t: [1.0, 0.0], W: [[0.5, -0.3], [0.2, 0.8]], b: [0.1, -0.2], act: "relu", lr: 0.1, hist: [], steps: 0, seed: 7 };
  var ACT = {
    linear: { f: function (z) { return z; }, d: function () { return 1; }, n: "linear" },
    relu: { f: function (z) { return Math.max(0, z); }, d: function (z) { return z > 0 ? 1 : 0; }, n: "relu" },
    sigmoid: { f: M.sigmoid, d: function (z) { var s = M.sigmoid(z); return s * (1 - s); }, n: "sigmoid" },
    tanh: { f: Math.tanh, d: function (z) { var t = Math.tanh(z); return 1 - t * t; }, n: "tanh" }
  };
  var view = api.view(root, { aspect: 2.0, minH: 250, maxH: 330, label: "Capa Dense con 2 entradas y 2 neuronas, con pesos, sesgos y salidas" });
  var view2 = api.view(root, { aspect: 5, minH: 90, maxH: 120, label: "Pérdida en cada paso de descenso" });
  var ui = api.controls(root), out = api.readout(root);
  function sl(l, a, i, mn, mx) { return ui.slider({ label: l, min: mn, max: mx, step: 0.1, value: S[a][i], fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S[a][i] = v; S.hist = [loss()]; update(); } }); }
  sl("x₁ (comedias vistas)", "x", 0, -3, 3); sl("x₂ (películas de acción vistas)", "x", 1, -3, 3); sl("objetivo t₁ (Toy Story: 1 sí, 0 no)", "t", 0, -1, 2); sl("objetivo t₂ (Matrix: 1 sí, 0 no)", "t", 1, -1, 2);
  ui.select({ label: "activación f", value: "relu", options: [["linear", "linear (ninguna)"], ["relu", "relu"], ["sigmoid", "sigmoid"], ["tanh", "tanh"]], onChange: function (v) { S.act = v; S.hist = [loss()]; update(); } });
  ui.slider({ label: "learning rate", min: 0.01, max: 0.5, step: 0.01, value: S.lr, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.lr = v; update(); } });
  ui.button("Un paso: W ← W − lr·∂L/∂W", function () { step(1); }, "primary");
  ui.button("20 pasos", function () { step(20); });
  ui.button("Pesos al azar", function () { var r = api.rng(S.seed++); for (var i = 0; i < 2; i++) { S.b[i] = Math.round(r.normal(0, 0.5) * 10) / 10; for (var j = 0; j < 2; j++) S.W[i][j] = Math.round(r.normal(0, 0.8) * 10) / 10; } S.hist = [loss()]; update(); });
  ui.button("Pesos del ejemplo", function () { S.W = [[0.5, -0.3], [0.2, 0.8]]; S.b = [0.1, -0.2]; S.hist = [loss()]; S.steps = 0; update(); }, "warm");

  function fwd() {
    var A = ACT[S.act], z = [], a = [], j;
    for (j = 0; j < 2; j++) { z[j] = S.x[0] * S.W[0][j] + S.x[1] * S.W[1][j] + S.b[j]; a[j] = A.f(z[j]); }
    var L = ((a[0] - S.t[0]) * (a[0] - S.t[0]) + (a[1] - S.t[1]) * (a[1] - S.t[1])) / 2;
    return { z: z, a: a, L: L };
  }
  function loss() { return fwd().L; }
  function grad() {
    var f = fwd(), A = ACT[S.act], dl = [], dz = [], dW = [[0, 0], [0, 0]], j;
    for (j = 0; j < 2; j++) { dl[j] = f.a[j] - S.t[j]; dz[j] = dl[j] * A.d(f.z[j]); dW[0][j] = S.x[0] * dz[j]; dW[1][j] = S.x[1] * dz[j]; }
    return { f: f, dl: dl, dz: dz, dW: dW, db: dz.slice() };
  }
  function step(n) {
    for (var k = 0; k < n; k++) {
      var g = grad();
      for (var i = 0; i < 2; i++) { S.b[i] -= S.lr * g.db[i]; for (var j = 0; j < 2; j++) S.W[i][j] -= S.lr * g.dW[i][j]; }
      S.steps++; S.hist.push(loss());
    }
    update();
  }
  function n2(v, k) { return (Math.abs(v) < 0.0005 ? 0 : v).toFixed(k || 3).replace("-", "−"); }
  S.hist = [loss()];

  function draw(ctx, w, h, C) {
    var f = fwd(), g = grad(), xi = [w * 0.12, w * 0.12], yi = [h * 0.28, h * 0.72], xo = w * 0.62, yo = [h * 0.28, h * 0.72], i, j, r = Math.max(15, Math.min(22, w * 0.045));
    var lab = [[0.38, 0.30], [0.30, 0.62], [0.30, 0.38], [0.38, 0.70]];
    for (i = 0; i < 2; i++) for (j = 0; j < 2; j++) {
      var wv = S.W[i][j], col = wv >= 0 ? C.cobalto : C.terracota;
      ctx.save(); ctx.globalAlpha = 0.8; D.line(ctx, xi[i], yi[i], xo, yo[j], col, 1 + Math.min(4, Math.abs(wv) * 2)); ctx.restore();
    }
    var tp = [[0.34, 0.2], [0.34, 0.8], [0.34, 0.8], [0.34, 0.2]];
    for (i = 0; i < 2; i++) for (j = 0; j < 2; j++) {
      var tt = i === j ? 0.30 : 0.70, lx = xi[i] + (xo - xi[i]) * (i === j ? 0.30 : 0.70), ly = yi[i] + (yo[j] - yi[i]) * (i === j ? 0.30 : 0.70);
      var s = "W" + (i + 1) + (j + 1) + "=" + n2(S.W[i][j], 2);
      ctx.save(); ctx.font = "600 10.5px 'IBM Plex Mono',monospace"; var tw = ctx.measureText(s).width + 6; ctx.restore();
      D.rect(ctx, lx - tw / 2, ly - 8, tw, 15, C.surface, C.line, 1);
      D.text(ctx, s, lx, ly + 3, { align: "center", size: 10.5, mono: true, weight: 600, color: C.ink });
    }
    for (i = 0; i < 2; i++) {
      D.circle(ctx, xi[i], yi[i], r, C.paper, C.ink, 2);
      D.text(ctx, "x" + (i + 1), xi[i], yi[i] - 3, { align: "center", size: 11, weight: 700, mono: true });
      D.text(ctx, n2(S.x[i], 1), xi[i], yi[i] + 10, { align: "center", size: 10.5, mono: true, color: C.ink2 });
      D.text(ctx, i === 0 ? "comedias" : "acción", xi[i], i === 0 ? yi[i] - r - 6 : yi[i] + r + 14, { align: "center", size: 10, color: C.muted });
    }
    for (j = 0; j < 2; j++) {
      D.circle(ctx, xo, yo[j], r + 3, C.cobaltoWash, C.ink, 2);
      D.text(ctx, "a" + (j + 1), xo, yo[j] - 3, { align: "center", size: 11, weight: 700, mono: true });
      D.text(ctx, n2(f.a[j], 2), xo, yo[j] + 10, { align: "center", size: 10.5, mono: true });
      D.text(ctx, "z=" + n2(f.z[j], 2) + "  b=" + n2(S.b[j], 2), xo, yo[j] + (j === 0 ? -r - 9 : r + 18), { align: "center", size: 10.5, mono: true, color: C.ink2 });
      var xt = w * 0.88;
      D.rect(ctx, xt - 20, yo[j] - 12, 40, 24, C.olivaWash, C.ink, 1.5);
      D.text(ctx, "t" + (j + 1) + "=" + n2(S.t[j], 1), xt, yo[j] + 4, { align: "center", size: 10.5, mono: true, weight: 600 });
      D.arrow(ctx, xo + r + 6, yo[j], xt - 22, yo[j], C.muted, 1.4);
      D.text(ctx, j === 0 ? "Toy Story" : "Matrix", xt, j === 0 ? yo[j] - 18 : yo[j] + 26, { align: "center", size: 10, color: C.muted });
    }
    D.text(ctx, "L = " + n2(f.L, 4), w * 0.88, h * 0.5 + 4, { align: "center", size: 11.5, mono: true, weight: 700, color: C.terracotaInk });
  }
  function drawHist(ctx, w, h, C) {
    var H = S.hist, n = H.length, mx = Math.max.apply(null, H.concat([0.01]));
    var x0 = 38, y0 = 8, pw = w - x0 - 10, ph = h - y0 - 20;
    D.rect(ctx, x0, y0, pw, ph, C.surface, C.ink, 1.2);
    D.text(ctx, "L", x0 - 8, y0 + 10, { align: "right", size: 10.5, color: C.muted, mono: true }); D.text(ctx, "0", x0 - 8, y0 + ph, { align: "right", size: 10.5, color: C.muted, mono: true });
    D.text(ctx, "pasos →  (" + (n - 1) + ")", x0 + pw / 2, h - 4, { align: "center", size: 10.5, color: C.muted });
    if (n > 1) D.path(ctx, H.map(function (v, k) { return [x0 + pw * k / Math.max(n - 1, 20), y0 + ph - ph * v / mx]; }), C.terracota, 2.2);
    D.circle(ctx, x0 + pw * (n - 1) / Math.max(n - 1, 20), y0 + ph - ph * H[n - 1] / mx, 3.5, C.terracota, C.paper, 1);
  }
  function update() {
    var g = grad(), f = g.f, s = "";
    s += "<b>Forward:</b> z₁ = " + n2(S.x[0], 1) + "·" + n2(S.W[0][0], 2) + " + " + n2(S.x[1], 1) + "·" + n2(S.W[1][0], 2) + " + " + n2(S.b[0], 2) + " = " + n2(f.z[0]) + " → a₁ = " + S.act + "(z₁) = <b>" + n2(f.a[0]) + "</b> · " +
      "z₂ = " + n2(f.z[1]) + " → a₂ = <b>" + n2(f.a[1]) + "</b><br>";
    s += "<b>Pérdida:</b> L = ½[(" + n2(f.a[0]) + " − " + n2(S.t[0], 1) + ")² + (" + n2(f.a[1]) + " − " + n2(S.t[1], 1) + ")²] = <b>" + n2(f.L, 4) + "</b><br>";
    s += "<b>Gradiente:</b> δⱼ = (aⱼ − tⱼ)·f′(zⱼ) → δ₁ = " + n2(g.dz[0]) + ", δ₂ = " + n2(g.dz[1]) + "<br>";
    s += "∂L/∂W = xᵀ·δ → [[" + n2(g.dW[0][0]) + ", " + n2(g.dW[0][1]) + "], [" + n2(g.dW[1][0]) + ", " + n2(g.dW[1][1]) + "]] · ∂L/∂b = δ = [" + n2(g.db[0]) + ", " + n2(g.db[1]) + "]";
    if (S.act === "relu" && (f.z[0] <= 0 || f.z[1] <= 0)) s += "<br><span class='bad'>Una neurona tiene z ≤ 0: su ReLU vale 0 y su derivada también, así que sus pesos no reciben gradiente («neurona muerta» por ahora).</span>";
    out.set(s + "<br>Pasos dados: " + S.steps);
    view.redraw(); view2.redraw();
  }
  view.draw(draw); view2.draw(drawHist); update();
});
