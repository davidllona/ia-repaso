/* Experimento: por qué los gradientes fluyen con atajos (ResNet). Cadena de L capas con tanh y pesos
   aleatorios con semilla. Red plana: cada capa multiplica el gradiente por f' = w·(1 − a²).
   Red residual: y = x + F(x), cada capa lo multiplica por 1 + f'. Se calcula de verdad (forward + backward). */
Lab.register("curso3/c3m2-bloque-residual", function (root, api) {
  var MAXL = 60, st = { L: 20, sigma: 0.6, seed: 3 };
  var W = [], i;

  function genW() { var r = api.rng(st.seed); W = []; for (i = 0; i < MAXL; i++) W.push(r.normal(0, 1)); }
  genW();

  /* devuelve para cada capa l (1..L) el módulo del gradiente d(salida)/d(entrada de la capa l) */
  function run(residual) {
    var a = [0.5], f = [], l, x = 0.5;
    for (l = 0; l < st.L; l++) {
      var w = W[l] * st.sigma, t = Math.tanh(w * x);
      f.push(w * (1 - t * t));                 /* derivada local de tanh(w·x) respecto a x */
      x = residual ? x + t : t;
      a.push(x);
    }
    var g = new Array(st.L + 1), acc = 1;      /* g[l] = gradiente de la salida respecto a la ENTRADA de la capa l+1 */
    g[st.L] = 1;
    for (l = st.L - 1; l >= 0; l--) { acc *= residual ? (1 + f[l]) : f[l]; g[l] = acc; }
    return { g: g, out: x };
  }

  var view = api.view(root, { aspect: 1.7, minH: 250, maxH: 380, label: "Gradiente (escala logarítmica) que llega a cada capa, red plana frente a red con atajos" });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Profundidad L (nº de capas)", min: 2, max: MAXL, step: 1, value: st.L, onInput: function (v) { st.L = v; update(); } });
  ui.slider({ label: "Escala de los pesos σ", min: 0.2, max: 1.4, step: 0.1, value: st.sigma, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { st.sigma = v; update(); } });
  ui.button("Otros pesos al azar", function () { st.seed += 1; genW(); update(); });

  var plot = api.plot(view, { xr: [1, 20], yr: [-30, 10], pad: { l: 52, r: 12, t: 22, b: 40 }, xticks: 5, yticks: 4, xlabel: "capa (1 = la más cercana a la entrada)", ylabel: "log₁₀ |gradiente|", yfmt: function (t) { return Math.round(t); }, xfmt: function (t) { return Math.round(t); } });

  view.draw(function (ctx, w, h, C) {
    var D = api.d, P = run(false), R = run(true), l;
    plot.xr = [1, Math.max(st.L, 2)];
    var mn = -30, mx = 10;
    plot.yr = [mn, mx];
    plot.axes(ctx);
    ctx.save(); plot.clip(ctx);
    D.line(ctx, plot.x(1), plot.y(0), plot.x(Math.max(st.L, 2)), plot.y(0), C.line, 1, [4, 4]);
    function curve(Q, col) {
      var pts = [];
      for (l = 1; l <= st.L; l++) { var v = Math.abs(Q.g[l - 1]); var lg = v > 0 ? Math.log10(v) : mn; pts.push([plot.x(l), plot.y(Math.max(mn, Math.min(mx, lg)))]); }
      D.path(ctx, pts, col, 2.5);
      pts.forEach(function (p) { D.circle(ctx, p[0], p[1], 2.4, col); });
    }
    curve(P, C.terracota); curve(R, C.oliva);
    ctx.restore();
    D.text(ctx, "Red plana", plot.x(1) + 6, plot.y(mn) - 8, { size: 11, weight: 600, color: C.terracotaInk });
    D.text(ctx, "Red con atajos (ResNet)", plot.x(Math.max(st.L, 2)) - 6, plot.y(mx) + 14, { size: 11, weight: 600, align: "right", color: C.olivaInk });
  });

  function lg(v) { var a = Math.abs(v); return a > 0 ? Math.log10(a) : -Infinity; }
  function update() {
    view.redraw();
    var P = run(false), R = run(true), p1 = P.g[0], r1 = R.g[0];
    var html = "Profundidad <b>" + st.L + "</b>, pesos de escala " + st.sigma.toFixed(1) + ".<br>" +
      "Gradiente que llega a la capa 1 (plana): <b>" + p1.toExponential(1) + "</b> (log₁₀ = " + (isFinite(lg(p1)) ? lg(p1).toFixed(1) : "−∞") + ")<br>" +
      "Gradiente que llega a la capa 1 (con atajos): <b>" + r1.toExponential(1) + "</b> (log₁₀ = " + (isFinite(lg(r1)) ? lg(r1).toFixed(1) : "−∞") + ")<br>";
    if (Math.abs(p1) < 1e-6 && Math.abs(r1) > 1e-3) html += "<span class='good'>La red plana casi no recibe señal en las primeras capas; con atajos sigue llegando.</span>";
    else if (Math.abs(r1) > 1e4) html += "<span class='bad'>Con pesos grandes, los atajos pueden hacer crecer el gradiente: por eso las ResNet reales usan BatchNorm y pesos pequeños.</span>";
    else html += "A esta profundidad la diferencia aún es pequeña: sube L o baja σ.";
    out.set(html);
  }
  update();
});
