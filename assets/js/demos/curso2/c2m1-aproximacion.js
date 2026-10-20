/* Experimento: aproximación universal. Una red 1 → n → 1 con n neuronas ReLU construye una curva «a trozos»:
   f̂(x) = b + Σ cᵢ·ReLU(x − tᵢ). Aquí NO se entrena: se construyen los pesos a mano (interpolación) para ver qué es capaz de dibujar una red de ese tamaño. */
Lab.register("curso2/c2m1-aproximacion", function (root, api) {
  var M = api.math, D = api.d;
  var X0 = -3, X1 = 3;
  var TARGETS = {
    seno: { name: "Seno: sin(2x)", f: function (x) { return Math.sin(2 * x); } },
    parabola: { name: "Parábola: 0,5·x² − 2", f: function (x) { return 0.5 * x * x - 2; } },
    onda: { name: "Dos ondas: sin(x) + 0,5·sin(3x)", f: function (x) { return Math.sin(x) + 0.5 * Math.sin(3 * x); } },
    escalon: { name: "Escalón suave: tanh(4x)", f: function (x) { return Math.tanh(4 * x); } }
  };
  var S = { n: 4, tgt: "seno" };

  // Construcción: n neuronas ReLU con «codos» equiespaciados t_i. La curva resultante une con rectas los puntos (t_i, f(t_i)).
  function build() {
    var F = TARGETS[S.tgt].f, n = S.n, h = (X1 - X0) / n, t = [], sl = [], c = [], i;
    for (i = 0; i < n; i++) t.push(X0 + i * h);
    for (i = 0; i < n; i++) sl.push((F(X0 + (i + 1) * h) - F(X0 + i * h)) / h);      // pendiente de cada trozo
    for (i = 0; i < n; i++) c.push(i === 0 ? sl[0] : sl[i] - sl[i - 1]);                // cada neurona CAMBIA la pendiente
    return { t: t, c: c, b: F(X0), h: h };
  }
  function fhat(B, x) { var s = B.b, i; for (i = 0; i < B.t.length; i++) s += B.c[i] * Math.max(0, x - B.t[i]); return s; }

  var v1 = api.view(root, { aspect: 2.2, minH: 220, maxH: 360, label: "Función objetivo y aproximación hecha con neuronas ReLU" });
  var p1 = api.plot(v1, { xr: [X0, X1], yr: [-2.6, 2.6], xticks: 6, yticks: 4, xlabel: "x", ylabel: "y", pad: { l: 46, r: 12, t: 12, b: 34 }, xfmt: function (v) { return Math.round(v); }, yfmt: function (v) { return +v.toFixed(2); } });
  var v2 = api.view(root, { aspect: 3.6, minH: 150, maxH: 240, label: "Aporte de cada neurona ReLU a la curva final" });
  var p2 = api.plot(v2, { xr: [X0, X1], yr: [-5, 5], xticks: 6, yticks: 4, xlabel: "x", ylabel: "cᵢ·ReLU(x − tᵢ)", pad: { l: 46, r: 12, t: 10, b: 34 }, xfmt: function (v) { return Math.round(v); }, yfmt: function (v) { return +v.toFixed(0); } });
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.72rem, 2.7vw, .84rem)";
  ui.slider({ label: "Neuronas ocultas ReLU (n)", min: 1, max: 20, step: 1, value: S.n, fmt: function (v) { return v; }, onInput: function (v) { S.n = v; update(); } });
  ui.select({ label: "Curva que hay que imitar", value: S.tgt, options: Object.keys(TARGETS).map(function (k) { return [k, TARGETS[k].name]; }), onChange: function (v) { S.tgt = v; update(); } });
  api.legend(root, [[api.colors().ink, "curva objetivo"], [api.colors().cobalto, "salida de la red"], [api.colors().terracota, "neuronas ReLU: su codo (arriba) y su aporte (abajo)"]]);

  var B = null, err = null;
  function analyse() {
    var F = TARGETS[S.tgt].f, N = 600, i, mx = 0, se = 0;
    B = build();
    for (i = 0; i <= N; i++) { var x = X0 + (X1 - X0) * i / N, e = fhat(B, x) - F(x); mx = Math.max(mx, Math.abs(e)); se += e * e; }
    err = { max: mx, mse: se / (N + 1) };
  }

  function drawTop(ctx, w, h, C) {
    var F = TARGETS[S.tgt].f, i, pts = [], pf = [], lo = Infinity, hi = -Infinity, N = 300;
    for (i = 0; i <= N; i++) { var x = X0 + (X1 - X0) * i / N, y = F(x); lo = Math.min(lo, y); hi = Math.max(hi, y); }
    var pad = (hi - lo) * 0.12;
    p1.yr = [Math.floor((lo - pad) * 2) / 2, Math.ceil((hi + pad) * 2) / 2];
    p1.axes(ctx); ctx.save(); p1.clip(ctx);
    for (i = 0; i <= N; i++) { var xx = X0 + (X1 - X0) * i / N; pts.push([p1.x(xx), p1.y(F(xx))]); }
    D.path(ctx, pts, C.ink, 3, [7, 5]);
    // curva de la red = trozos rectos entre los codos
    var knots = B.t.concat([X1]);
    knots.forEach(function (tk) { pf.push([p1.x(tk), p1.y(fhat(B, tk))]); });
    D.path(ctx, pf, C.cobalto, 3);
    ctx.restore();
    // codos: un círculo por neurona (sobre la curva) y una marca en el eje
    B.t.forEach(function (tk, k) {
      D.circle(ctx, p1.x(tk), p1.y(fhat(B, tk)), 4.6, C.terracota, C.paper, 1.5);
    });
    D.circle(ctx, p1.x(X1), p1.y(fhat(B, X1)), 3.2, C.cobalto, C.paper, 1);
  }

  function drawBottom(ctx, w, h, C) {
    var i, k, lo = 0, hi = 0;
    B.t.forEach(function (tk, k2) { var a = B.c[k2] * Math.max(0, X1 - tk); lo = Math.min(lo, a); hi = Math.max(hi, a); });
    var span = Math.max(hi - lo, 1), pad = span * 0.1;
    p2.yr = [lo - pad, hi + pad];
    p2.axes(ctx); ctx.save(); p2.clip(ctx);
    ctx.globalAlpha = S.n > 10 ? 0.7 : 0.9;
    B.t.forEach(function (tk, k2) {
      D.path(ctx, [[p2.x(X0), p2.y(0)], [p2.x(tk), p2.y(0)], [p2.x(X1), p2.y(B.c[k2] * (X1 - tk))]], C.terracota, S.n > 10 ? 1.5 : 2.2);
    });
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function update() {
    analyse();
    var F = TARGETS[S.tgt].f;
    out.set(
      "n = <b>" + S.n + "</b> neuronas ocultas → la curva tiene <b>" + S.n + "</b> trozos rectos · parámetros de la red 1-" + S.n + "-1: <b>" + (3 * S.n + 1) + "</b> (" + S.n + " pesos de entrada, " + S.n + " bias, " + S.n + " pesos de salida y 1 bias final)<br>" +
      "Error máximo |f̂ − f| = <b>" + err.max.toFixed(3) + "</b> · error cuadrático medio = <b>" + err.mse.toExponential(2) + "</b><br>" +
      "Primera neurona: codo en x = " + B.t[0].toFixed(2) + ", c₀ = " + B.c[0].toFixed(2) + " (pendiente inicial). " +
      (S.n > 1 ? "Segunda: codo en x = " + B.t[1].toFixed(2) + ", c₁ = " + B.c[1].toFixed(2) + " (el cambio de pendiente que añade)." : "Con UNA neurona solo hay una recta entre los extremos.") +
      "<br>Esto no es entrenar: los pesos se calculan a mano uniendo " + (S.n + 1) + " puntos de la curva. Muestra lo que ESTA arquitectura puede dibujar, no que el entrenamiento lo encuentre."
    );
    v1.redraw(); v2.redraw();
  }
  analyse(); v1.draw(drawTop); v2.draw(drawBottom); update();
});
