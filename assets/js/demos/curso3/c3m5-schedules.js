/* Experimento: learning-rate schedules de Keras (ExponentialDecay, PiecewiseConstantDecay, CosineDecay con y sin warmup,
   PolynomialDecay) y su efecto en el entrenamiento. Arriba, lr(paso) con las fórmulas de Keras. Abajo, la pérdida ESPERADA de una
   parábola f(w)=½·w² entrenada con SGD y gradiente ruidoso (como un mini-batch): E[w²] se actualiza con la fórmula exacta
   s ← (1−η)²·s + η²·σ²  (sin azar), así que la curva es determinista. Se compara con el mismo η0 constante. */
Lab.register("curso3/c3m5-schedules", function (root, api) {
  var D = api.d, C0 = api.colors(), N = 1000;
  var KINDS = [["const", "Constante"], ["exp", "Exponential"], ["step", "Piecewise"], ["cos", "Cosine"], ["warm", "Cos. + warmup"], ["poly", "Polynomial"]];
  var S = { kind: "exp", lr0: 0.6, rate: 0.1, stair: false, alpha: 0.0, warm: 100, power: 1, sigma: 1.0 };

  function lrAt(kind, t) {
    var L0 = S.lr0, W, u;
    if (kind === "const") return L0;
    if (kind === "exp") { u = t / (N / 2); if (S.stair) u = Math.floor(u); return L0 * Math.pow(S.rate, u); }            // decay_steps = N/2
    if (kind === "step") return t <= 500 ? L0 : (t <= 750 ? L0 * 0.1 : L0 * 0.01);                                      // boundaries=[500, 750], values=[η0, η0/10, η0/100]
    if (kind === "cos") return L0 * ((1 - S.alpha) * 0.5 * (1 + Math.cos(Math.PI * Math.min(t, N) / N)) + S.alpha);
    if (kind === "warm") {
      W = S.warm;
      if (t < W) return L0 * t / Math.max(1, W);
      var ds = Math.max(1, N - W); return L0 * ((1 - S.alpha) * 0.5 * (1 + Math.cos(Math.PI * Math.min(t - W, ds) / ds)) + S.alpha);
    }
    u = Math.min(t, N) / N; return (L0 - 0.0) * Math.pow(1 - u, S.power);                                                  // end_learning_rate = 0
  }
  function loss(kind) {
    var s = 9, out = [], t, lr;                                                                                          // w0 = 3 → E[w²] = 9
    for (t = 0; t < N; t++) { lr = lrAt(kind, t); out.push(0.5 * s); s = (1 - lr) * (1 - lr) * s + lr * lr * S.sigma * S.sigma; }
    out.push(0.5 * s); return out;
  }
  function stable(kind) { for (var t = 0; t < N; t += 20) if (lrAt(kind, t) >= 2) return false; return true; }

  var vA = api.view(root, { aspect: 3.2, minH: 140, maxH: 200, label: "Learning rate en función del paso de entrenamiento" });
  var pA = api.plot(vA, { xr: [0, N], yr: [0, 1.5], xticks: 5, yticks: 3, pad: { l: 40, r: 12, t: 12, b: 24 }, yfmt: function (v) { return v.toFixed(1); }, xfmt: function (v) { return Math.round(v); } });
  var vB = api.view(root, { aspect: 2.6, minH: 170, maxH: 260, label: "Pérdida esperada en escala logarítmica con el planificador y con learning rate constante" });
  var pB = api.plot(vB, { xr: [0, N], yr: [-4, 1], xticks: 5, yticks: 5, xlabel: "paso", pad: { l: 44, r: 12, t: 12, b: 34 }, yfmt: function (v) { return Math.round(v) === 0 ? "1" : "1e" + Math.round(v); } });
  var ui = api.controls(root), out = api.readout(root);
  ui.select({ label: "Planificador (keras.optimizers.schedules)", options: KINDS, value: S.kind, onChange: function (v) { S.kind = v; update(); } });
  ui.slider({ label: "initial_learning_rate", min: 0.1, max: 1.5, step: 0.05, value: S.lr0, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.lr0 = v; update(); } });
  ui.slider({ label: "Exponential: decay_rate (decay_steps = 500)", min: 0.05, max: 0.9, step: 0.05, value: S.rate, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.rate = v; update(); } });
  ui.slider({ label: "Cosine: alpha (fracción mínima del lr)", min: 0, max: 0.3, step: 0.05, value: S.alpha, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.alpha = v; update(); } });
  ui.slider({ label: "Cosine + warmup: warmup_steps", min: 0, max: 400, step: 20, value: S.warm, onInput: function (v) { S.warm = v; update(); } });
  ui.slider({ label: "Polynomial: power", min: 0.5, max: 3, step: 0.5, value: S.power, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.power = v; update(); } });
  ui.slider({ label: "Ruido del gradiente σ (mini-batch pequeño = más ruido)", min: 0.2, max: 2, step: 0.1, value: S.sigma, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.sigma = v; update(); } });
  ui.toggle({ label: "Exponential: staircase=True", value: S.stair, onChange: function (v) { S.stair = v; update(); } });
  api.legend(root, [[C0.cobalto, "con el planificador elegido"], [C0.terracota, "learning rate constante (= initial_learning_rate)"]]);

  function drawA(ctx, w, h, C) {
    pA.axes(ctx);
    var pts = [], t, step = 4;
    ctx.save(); pA.clip(ctx);
    for (t = 0; t <= N; t += step) pts.push([pA.x(t), pA.y(lrAt(S.kind, t))]);
    D.path(ctx, [[pA.x(0), pA.y(S.lr0)], [pA.x(N), pA.y(S.lr0)]], C.terracota, 1.8, [5, 4]);
    D.path(ctx, pts, C.cobalto, 2.6);
    ctx.restore();
    D.text(ctx, "learning rate", pA.box.x + pA.box.w - 6, pA.box.y + pA.box.h - 8, { align: "right", size: 11, color: C.muted });
  }
  function drawB(ctx, w, h, C) {
    pB.axes(ctx);
    var a = loss(S.kind), b = loss("const"), pa = [], pb = [], t;
    function ly(v) { return pB.y(Math.max(-4, Math.min(1, Math.log10(Math.max(v, 1e-12))))); }
    ctx.save(); pB.clip(ctx);
    for (t = 0; t <= N; t += 4) { pa.push([pB.x(t), ly(a[t])]); pb.push([pB.x(t), ly(b[t])]); }
    D.path(ctx, pb, C.terracota, 2, [5, 4]); D.path(ctx, pa, C.cobalto, 2.6);
    ctx.restore();
    D.text(ctx, "pérdida esperada ½·E[w²]", pB.box.x + pB.box.w - 6, pB.box.y + 14, { align: "right", size: 11, color: C.muted });
  }
  vA.draw(drawA); vB.draw(drawB);

  function update() {
    var a = loss(S.kind), b = loss("const"), ok = stable(S.kind) && S.lr0 < 2;
    var name = KINDS.filter(function (k) { return k[0] === S.kind; })[0][1];
    var better = a[N] < b[N];
    out.set("<b>" + name + "</b>: lr en el paso 0 = <b>" + lrAt(S.kind, 0).toFixed(3) + "</b>, paso 250 = <b>" + lrAt(S.kind, 250).toFixed(3) + "</b>, paso 500 = <b>" + lrAt(S.kind, 500).toFixed(3) + "</b>, paso 1000 = <b>" + lrAt(S.kind, N).toFixed(3) + "</b>" +
      "<br>Pérdida esperada final: con planificador <b class='" + (better ? "good" : "bad") + "'>" + a[N].toExponential(1) + "</b> · con lr constante <b>" + b[N].toExponential(1) + "</b>" +
      "<br>Pérdida esperada a mitad (paso 500): planificador <b>" + a[500].toExponential(1) + "</b> · constante <b>" + b[500].toExponential(1) + "</b>");
    vA.redraw(); vB.redraw();
  }
  update();
});
