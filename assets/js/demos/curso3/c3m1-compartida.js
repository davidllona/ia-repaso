/* Experimento: una capa compartida se usa dos veces y recibe la SUMA de los gradientes de sus dos usos.
   Modelo diminuto: la rama 1 calcula w·x₁ y la rama 2 w·x₂; la pérdida es (w·x₁ − t₁)² + (w·x₂ − t₂)². */
Lab.register("curso3/c3m1-compartida", function (root, api) {
  var D = api.d, M = api.math;
  var S = { x1: 2, t1: 6, x2: 1, t2: 1, lr: 0.05, shared: true, w: 0, w1: 0, w2: 0, steps: 0 };
  var view = api.view(root, { aspect: 1.8, minH: 250, maxH: 360, drag: false, label: "Curvas de pérdida de cada rama y su suma, con el valor actual del peso" });
  var plot = api.plot(view, { xr: [-1, 5], yr: [0, 40], xticks: 6, yticks: 4, xlabel: "valor del peso w (multiplicador)", ylabel: "pérdida", pad: { l: 46, r: 12, t: 12, b: 36 },
    xfmt: function (v) { return Math.round(v * 10) / 10; }, yfmt: function (v) { return Math.round(v); } });
  var CC = api.colors();
  api.legend(root, [[CC.cobalto, "pérdida de la rama 1 (Ana)"], [CC.terracota, "pérdida de la rama 2 (Luis)"], [CC.ink, "suma (el modelo compartido)"]]);
  var ui = api.controls(root), out = api.readout(root);
  function sl(l, k, mn, mx, stp) { return ui.slider({ label: l, min: mn, max: mx, step: stp, value: S[k], fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S[k] = v; update(); } }); }
  sl("x₁ · Ana: películas la semana pasada", "x1", 0.5, 3, 0.1); sl("t₁ · Ana: películas esta semana", "t1", -2, 8, 0.1);
  sl("x₂ · Luis: películas la semana pasada", "x2", 0.5, 3, 0.1); sl("t₂ · Luis: películas esta semana", "t2", -2, 8, 0.1);
  ui.slider({ label: "learning rate", min: 0.01, max: 0.2, step: 0.01, value: S.lr, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.lr = v; update(); } });
  ui.segmented({ label: "Cómo se usa la capa", value: "sh", options: [["sh", "Compartida (1 peso w)"], ["sep", "Separada (2 pesos)"]], onChange: function (v) { S.shared = v === "sh"; update(); } });
  ui.button("Un paso de descenso", function () { step(1); }, "primary");
  ui.button("20 pasos", function () { step(20); });
  ui.button("Reiniciar pesos", function () { S.w = 0; S.w1 = 0; S.w2 = 0; S.steps = 0; update(); }, "warm");

  function L1(w) { var e = w * S.x1 - S.t1; return e * e; }
  function L2(w) { var e = w * S.x2 - S.t2; return e * e; }
  function g1(w) { return 2 * (w * S.x1 - S.t1) * S.x1; }
  function g2(w) { return 2 * (w * S.x2 - S.t2) * S.x2; }
  function step(n) {
    for (var i = 0; i < n; i++) {
      if (S.shared) S.w -= S.lr * (g1(S.w) + g2(S.w));
      else { S.w1 -= S.lr * g1(S.w1); S.w2 -= S.lr * g2(S.w2); }
      S.steps++;
    }
    update();
  }
  function wstar() { return (S.x1 * S.t1 + S.x2 * S.t2) / (S.x1 * S.x1 + S.x2 * S.x2); }
  function f2(v) { return (Math.abs(v) < 0.005 ? 0 : v).toFixed(2).replace("-", "−"); }

  function draw(ctx, w, h, C) {
    var xs = M.linspace(-1, 5, 120), top = 0, i;
    xs.forEach(function (x) { top = Math.max(top, L1(x) + L2(x)); });
    top = Math.max(20, Math.ceil(top / 20) * 20); plot.yr = [0, top];
    plot.axes(ctx); ctx.save(); plot.clip(ctx);
    D.path(ctx, xs.map(function (x) { return [plot.x(x), plot.y(L1(x))]; }), C.cobalto, 2);
    D.path(ctx, xs.map(function (x) { return [plot.x(x), plot.y(L2(x))]; }), C.terracota, 2);
    if (S.shared) D.path(ctx, xs.map(function (x) { return [plot.x(x), plot.y(L1(x) + L2(x))]; }), C.ink, 3);
    ctx.restore();
    function mark(x, y, col, lab) { D.circle(ctx, plot.x(x), plot.y(y), 6.5, col, C.ink, 2); }
    if (S.shared) {
      var wv = M.clamp(S.w, -1, 5), y = L1(wv) + L2(wv), sl = g1(wv) + g2(wv), dx = 0.7;
      ctx.save(); plot.clip(ctx);
      D.line(ctx, plot.x(wv - dx), plot.y(y - sl * dx), plot.x(wv + dx), plot.y(y + sl * dx), C.marker, 2.5, [5, 4]);
      ctx.restore();
      mark(wv, y, C.paper); mark(wv, L1(wv), C.cobaltoWash); mark(wv, L2(wv), C.terracotaWash);
      var ws = wstar(); D.line(ctx, plot.x(ws), plot.box.y, plot.x(ws), plot.box.y + plot.box.h, C.oliva, 1.5, [3, 4]);
      D.text(ctx, "mín. de la suma", plot.x(ws), plot.box.y + 12, { align: ws > 3.4 ? "right" : "left", size: 10.5, color: C.olivaInk, weight: 600 });
    } else { mark(M.clamp(S.w1, -1, 5), L1(M.clamp(S.w1, -1, 5)), C.cobaltoWash); mark(M.clamp(S.w2, -1, 5), L2(M.clamp(S.w2, -1, 5)), C.terracotaWash); }
  }
  function update() {
    var s;
    if (S.shared) {
      var a = g1(S.w), b = g2(S.w), L = L1(S.w) + L2(S.w), ws = wstar(), Lm = L1(ws) + L2(ws);
      s = "Parámetros: <b>1</b> (w = " + f2(S.w) + ") · pérdida total = " + f2(L1(S.w)) + " + " + f2(L2(S.w)) + " = <b>" + f2(L) + "</b><br>" +
        "gradiente de la rama 1 (Ana): " + f2(a) + " · de la rama 2 (Luis): " + f2(b) + "<br><b>∂L/∂w = " + f2(a) + " + " + f2(b) + " = " + f2(a + b) + "</b> (se suman: es el mismo peso usado dos veces)<br>" +
        "Mejor w posible: " + f2(ws) + " con pérdida mínima <b>" + f2(Lm) + "</b>" + (Lm > 0.01 ? " — no llega a 0 porque una sola w no puede cumplir a Ana y a Luis a la vez." : ".");
    } else {
      s = "Parámetros: <b>2</b> (w₁ = " + f2(S.w1) + ", w₂ = " + f2(S.w2) + ") · pérdida total = " + f2(L1(S.w1)) + " + " + f2(L2(S.w2)) + " = <b>" + f2(L1(S.w1) + L2(S.w2)) + "</b><br>" +
        "cada peso solo recibe el gradiente de <em>su</em> rama: ∂L/∂w₁ = " + f2(g1(S.w1)) + " · ∂L/∂w₂ = " + f2(g2(S.w2)) + "<br>Con dos pesos libres cada rama puede llegar a su propio óptimo (" + f2(S.t1 / S.x1) + " y " + f2(S.t2 / S.x2) + ") y la pérdida tiende a 0.";
    }
    out.set(s + "<br>Pasos dados: " + S.steps); view.redraw();
  }
  view.draw(draw); update();
});
