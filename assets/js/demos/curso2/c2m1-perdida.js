/* Experimento: la entropía cruzada castiga sin techo estar seguro y fallar.
   Pérdida = −ln(p), con p la probabilidad que la red dio a lo que pasó de verdad.
   Se compara con el error cuadrático (1 − p)², que nunca pasa de 1.
   Disfraz: una película de terror; la red reparte probabilidades entre géneros. */
Lab.register("curso2/c2m1-perdida", function (root, api) {
  var D = api.d, M = api.math;
  var S = { p: 0.4 };

  var view = api.view(root, { aspect: 1.6, minH: 230, maxH: 360, label: "Curva de la pérdida −ln(p) y del error cuadrático (1 − p)² según la probabilidad p que la red dio a la respuesta correcta" });
  var plot = api.plot(view, { xr: [0, 1], yr: [0, 5], xticks: 5, yticks: 5, xlabel: "p que la red dio a «terror»", ylabel: "pérdida", pad: { l: 46, r: 14, t: 12, b: 36 },
    xfmt: function (v) { return Math.round(v * 100) + "%"; }, yfmt: function (v) { return Math.round(v); } });
  var ui = api.controls(root), out = api.readout(root);
  var sl = ui.slider({ label: "Probabilidad dada a la respuesta correcta (p)", min: 0.01, max: 0.99, step: 0.01, value: S.p,
    fmt: function (v) { return Math.round(v * 100) + " %"; }, onInput: function (v) { S.p = v; update(); } });
  ui.button("Red A: 40 %", function () { S.p = 0.4; sl.set(0.4, true); update(); }, "primary");
  ui.button("Red B: 1 %", function () { S.p = 0.01; sl.set(0.01, true); update(); });
  ui.button("Acierta: 90 %", function () { S.p = 0.9; sl.set(0.9, true); update(); });
  api.legend(root, [[api.colors().cobalto, "entropía cruzada: −ln p"], [api.colors().terracota, "error cuadrático: (1 − p)²"]]);

  function draw(ctx, w, h, C) {
    plot.axes(ctx);
    ctx.save(); plot.clip(ctx);
    var ce = [], mse = [], i, p;
    for (i = 0; i <= 200; i++) {
      p = 0.005 + i * 0.995 / 200;
      ce.push([plot.x(p), plot.y(Math.min(-Math.log(p), 6))]);
      mse.push([plot.x(p), plot.y((1 - p) * (1 - p))]);
    }
    D.path(ctx, ce, C.cobalto, 2.5);
    D.path(ctx, mse, C.terracota, 2.5);
    ctx.restore();
    var L = -Math.log(S.p), Q = (1 - S.p) * (1 - S.p);
    var x = plot.x(S.p), yL = plot.y(Math.min(L, 5)), yQ = plot.y(Q);
    D.line(ctx, x, plot.y(0), x, yL, C.muted, 1, [4, 4]);
    D.circle(ctx, x, yQ, 6, C.terracota, C.ink, 1.2);
    D.circle(ctx, x, yL, 7, C.cobalto, C.ink, 1.2);
    var right = S.p < 0.55;
    D.text(ctx, "L = " + L.toFixed(2), x + (right ? 12 : -12), Math.max(yL - 8, plot.y(5) + 14), { size: 12, mono: true, weight: 700, align: right ? "left" : "right", color: C.cobaltoInk });
  }

  function update() {
    var L = -Math.log(S.p), Q = (1 - S.p) * (1 - S.p);
    out.set(
      "p = <b>" + S.p.toFixed(2) + "</b> → entropía cruzada L = −ln(" + S.p.toFixed(2) + ") = <b>" + L.toFixed(3) + "</b><br>" +
      "error cuadrático (1 − p)² = <b>" + Q.toFixed(3) + "</b> (nunca pasa de 1)<br>" +
      (S.p >= 0.85 ? "<span class='good'>La red da mucha probabilidad a lo que pasó: castigo pequeño.</span>" :
        S.p <= 0.05 ? "<span class='bad'>Segura y equivocada: la entropía cruzada se dispara; el cuadrado apenas se entera.</span>" :
        "Cuanto menos probabilidad da a lo que pasó, más castigo.")
    );
    view.redraw();
  }
  view.draw(draw); update();
});
