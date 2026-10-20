/* Experimento: ¿cuánto gradiente llega a cada capa en una cadena de N bloques con y sin atajo?
   Cadena escalar: sin atajo  h' = tanh(w·h);  con atajo  h' = h + tanh(w·h)  (misma w en las dos cadenas).
   Se hace backprop de verdad: el gradiente que llega a la capa i es el producto de las derivadas locales de las capas i..N. */
Lab.register("curso5/c5m4-residual", function (root, api) {
  var D = api.d;
  var S = { N: 20, escala: 0.8, x0: 1.0, seed: 4 };
  var W = [];
  function pesos() { var r = api.rng(S.seed), i; W = []; for (i = 0; i < 60; i++) W.push(r.normal(0, 1)); }
  pesos();

  /* devuelve para cada capa i (0..N-1) el módulo del gradiente d h_N / d h_i en ambas cadenas */
  function calcula() {
    var N = S.N, i, hp = S.x0, hr = S.x0, dp = [], dr = [], gp = [], gr = [];
    for (i = 0; i < N; i++) {
      var w = S.escala * W[i];
      var tp = Math.tanh(w * hp), tr = Math.tanh(w * hr);
      dp.push(w * (1 - tp * tp));            // derivada de la capa sin atajo
      dr.push(1 + w * (1 - tr * tr));        // derivada de la capa con atajo
      hp = tp; hr = hr + tr;
    }
    var ap = 1, ar = 1;
    for (i = N - 1; i >= 0; i--) { ap *= dp[i]; ar *= dr[i]; gp[i] = Math.abs(ap); gr[i] = Math.abs(ar); }
    return { gp: gp, gr: gr, salP: hp, salR: hr };
  }

  var view = api.view(root, { aspect: 1.7, minH: 250, maxH: 380, label: "Gradiente que llega a cada capa, con y sin atajo, en escala logarítmica" });
  var pl = api.plot(view, { xr: [1, 60], yr: [-12, 6], xticks: 4, yticks: 6, pad: { l: 42, r: 10, t: 16, b: 38 }, xlabel: "capa (1 = la más cercana a la entrada)", ylabel: "log10 |gradiente|", xfmt: function (v) { return Math.round(v); }, yfmt: function (v) { return Math.round(v); } });
  var ui = api.controls(root), out = api.readout(root);
  api.legend(root, [[api.colors().terracota, "sin atajo: h' = tanh(w·h)"], [api.colors().cobalto, "con atajo: h' = h + tanh(w·h)"]]);
  ui.slider({ label: "Número de bloques N", min: 2, max: 60, step: 1, value: S.N, onInput: function (v) { S.N = v; update(); } });
  ui.slider({ label: "Escala de los pesos", min: 0.2, max: 2, step: 0.1, value: S.escala, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.escala = v; update(); } });
  ui.slider({ label: "Valor de entrada h₀", min: -2, max: 2, step: 0.1, value: S.x0, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.x0 = v; update(); } });
  ui.button("Otros pesos aleatorios", function () { S.seed++; pesos(); update(); });

  function lg(v) { return Math.log10(Math.max(v, 1e-30)); }
  function sci(v) { if (v === 0) return "0"; var e = Math.floor(Math.log10(v)), m = v / Math.pow(10, e); return m.toFixed(2).replace(".", ",") + "·10^" + e; }
  function draw(ctx, w, h, C) {
    var r = calcula(), i, N = S.N;
    pl.xr = [1, Math.max(N, 2)]; pl.yr = [-12, 6];
    pl.axes(ctx); ctx.save(); pl.clip(ctx);
    D.line(ctx, pl.box.x, pl.y(0), pl.box.x + pl.box.w, pl.y(0), C.muted, 1, [4, 3]);
    function curva(g, col) {
      var pts = [];
      for (i = 0; i < N; i++) pts.push([pl.x(i + 1), pl.y(Math.max(-12, Math.min(6, lg(g[i]))))]);
      D.path(ctx, pts, col, 2.2);
      for (i = 0; i < N; i++) if (N <= 30) D.circle(ctx, pts[i][0], pts[i][1], 2.6, col, null);
    }
    curva(r.gp, C.terracota); curva(r.gr, C.cobalto);
    ctx.restore();
    D.text(ctx, "gradiente = 1", pl.box.x + pl.box.w - 4, pl.y(0) - 4, { size: 10.5, color: C.muted, align: "right" });
  }
  view.draw(draw);

  function update() {
    var r = calcula(), N = S.N;
    var gp = r.gp[0], gr = r.gr[0];
    var s = "Gradiente que llega a la capa 1 (la más lejana de la salida), con <b>N = " + N + "</b> bloques:<br>sin atajo: <b>" + sci(gp) + "</b> · con atajo: <b>" + sci(gr) + "</b>";
    if (gp > 0) s += " · cociente con/sin: <b>" + (gr / gp > 1e6 ? sci(gr / gp) : (gr / gp).toFixed(1).replace(".", ",")) + "</b>";
    if (gp < 1e-3 && gr > 1e-2 && gr < 1e2) s += "<br><span class='good'>El atajo mantiene el gradiente en torno a 1; sin atajo se ha apagado casi del todo (la capa 1 no aprende).</span>";
    else if (gr >= 1e2) s += "<br><span class='bad'>Con pesos tan grandes el atajo no basta: el gradiente crece y puede explotar. Los atajos ayudan, no hacen magia (por eso se combinan con BatchNorm y buena inicialización).</span>";
    else if (gp >= 1e-3) s += "<br>Con pocos bloques o pesos grandes, también sin atajo llega algo de gradiente: sube N.";
    out.set(s); view.redraw();
  }
  update();
});
