/* Experimento: por qué ayuda un atajo (Add) al gradiente. Cadena de L capas con un solo número por capa:
   sin atajo h' = tanh(w·h) → derivada w·(1−tanh²) en cada capa; con atajo h' = h + tanh(w·h) → 1 + w·(1−tanh²).
   Se calcula de verdad ∂h_L/∂h_i como producto de derivadas locales (regla de la cadena). */
Lab.register("curso3/c3m1-atajo", function (root, api) {
  var D = api.d, M = api.math;
  var S = { L: 20, s: 0.6, h0: 0.8, seed: 3, mode: "both" };
  var W;
  var view = api.view(root, { aspect: 1.9, minH: 250, maxH: 360, label: "Tamaño del gradiente en cada capa, con y sin atajo, en escala logarítmica" });
  var plot = api.plot(view, { xr: [0, 20], yr: [-8, 2], xticks: 5, yticks: 5, xlabel: "capa i (0 = entrada, L = salida)", ylabel: "log10 |∂h_L/∂h_i|", pad: { l: 50, r: 12, t: 12, b: 36 } });
  var CC = api.colors();
  api.legend(root, [[CC.terracota, "sin atajo"], [CC.oliva, "con atajo (Add)"], [CC.muted, "línea de puntos: gradiente = 1"]]);
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Capas L", min: 2, max: 40, step: 1, value: S.L, onInput: function (v) { S.L = v; make(); update(); } });
  ui.slider({ label: "Tamaño de los pesos (escala s)", min: 0.2, max: 1.5, step: 0.05, value: S.s, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.s = v; update(); } });
  ui.slider({ label: "Entrada h₀", min: 0.1, max: 2, step: 0.1, value: S.h0, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.h0 = v; update(); } });
  ui.segmented({ label: "Qué ver", value: "both", options: [["both", "Ambas"], ["plain", "Sin atajo"], ["res", "Con atajo"]], onChange: function (v) { S.mode = v; update(); } });
  ui.button("Otros pesos al azar", function () { S.seed++; make(); update(); }, "primary");

  function make() { var r = api.rng(S.seed); W = []; for (var i = 0; i < 40; i++) W.push((r.next() < 0.5 ? -1 : 1) * r.range(0.5, 1.5)); }
  function run(res) {
    var h = S.h0, loc = [], i, th, w;
    for (i = 0; i < S.L; i++) {
      w = W[i] * S.s; th = Math.tanh(w * h);
      var d = w * (1 - th * th);
      loc.push(res ? 1 + d : d);
      h = res ? h + th : th;
    }
    var g = new Array(S.L + 1); g[S.L] = 1;
    for (i = S.L - 1; i >= 0; i--) g[i] = g[i + 1] * loc[i];
    return g;
  }
  function lg(v) { return Math.log10(Math.max(Math.abs(v), 1e-30)); }
  function sci(v) { if (v === 0) return "0"; var e = Math.floor(Math.log10(Math.abs(v))), m = v / Math.pow(10, e); return (m.toFixed(1) + "·10^" + e).replace("-", "−"); }

  function draw(ctx, w, h, C) {
    var P = run(false), R = run(true), lo = 0, hi = 0, i;
    (S.mode !== "res" ? P : []).concat(S.mode !== "plain" ? R : []).forEach(function (v) { var q = lg(v); lo = Math.min(lo, q); hi = Math.max(hi, q); });
    hi = Math.ceil(hi + 0.3); lo = Math.floor(lo - 0.3); lo = hi - Math.max(5, Math.ceil((hi - lo) / 5) * 5);
    plot.xr = [0, S.L]; plot.yr = [lo, hi];
    plot.axes(ctx);
    var z = plot.y(0); ctx.save(); plot.clip(ctx); D.line(ctx, plot.box.x, z, plot.box.x + plot.box.w, z, C.muted, 1.2, [4, 4]); ctx.restore();
    ctx.save(); plot.clip(ctx);
    function line(g, col) { var pts = g.map(function (v, k) { return [plot.x(k), plot.y(lg(v))]; }); D.path(ctx, pts, col, 2.6); pts.forEach(function (p) { D.circle(ctx, p[0], p[1], S.L > 25 ? 2 : 3.5, col, C.paper, 1); }); }
    if (S.mode !== "res") line(P, C.terracota);
    if (S.mode !== "plain") line(R, C.oliva);
    ctx.restore();
  }
  function update() {
    var P = run(false), R = run(true);
    out.set("Gradiente que llega a la capa 0 desde la salida:<br>" +
      "sin atajo: <b>" + sci(P[0]) + "</b> · con atajo: <b>" + sci(R[0]) + "</b>" +
      (Math.abs(P[0]) < 1e-3 ? "<br><span class='bad'>Sin atajo casi no llega señal a las primeras capas: se desvanece (vanishing gradient).</span>" : "") +
      (Math.abs(R[0]) > 1e-3 && Math.abs(R[0]) < 1e3 ? "<br><span class='good'>Con atajo, cada factor es 1 + w·σ′ ≈ 1: el gradiente sigue vivo.</span>" : "") +
      (Math.abs(R[0]) >= 1e3 ? "<br><span class='bad'>Con pesos tan grandes hasta el atajo puede explotar.</span>" : ""));
    view.redraw();
  }
  make(); view.draw(draw); update();
});
