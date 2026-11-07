/* Experimento: leer una recta de regresión. Cinco películas, dos sliders (intercepto y pendiente)
   y una película nueva cuyo presupuesto eliges tú: la recta devuelve una predicción para ella. */
Lab.register("curso1/c1m2-recta-netflix", function (root, api) {
  var pts = [
    { n: "Shrek", x: 1, y: 150 }, { n: "Toy Story", x: 2, y: 190 }, { n: "El Rey León", x: 3, y: 205 },
    { n: "Titanic", x: 4, y: 250 }, { n: "Los Vengadores", x: 5, y: 290 }
  ];
  var t0 = 115, t1 = 34, xn = 2.5, showNames = true;

  var view = api.view(root, { aspect: 1.6, minH: 290, label: "Cinco películas según su presupuesto y sus horas vistas, una recta ajustable y la predicción para una película nueva" });
  var plot = api.plot(view, { xr: [0, 6], yr: [0, 350], xticks: 6, yticks: 7, xlabel: "Presupuesto (decenas de millones de €)", ylabel: "Horas vistas (miles)", pad: { l: 52, r: 14, t: 14, b: 40 } });
  var ui = api.controls(root), out = api.readout(root);
  var s0 = ui.slider({ label: "Intercepto θ₀ (miles de horas con presupuesto 0)", min: 0, max: 250, step: 1, value: t0, fmt: function (v) { return v.toFixed(0); }, onInput: function (v) { t0 = v; update(); } });
  var s1 = ui.slider({ label: "Pendiente θ₁ (miles de horas por cada 10 M€)", min: -20, max: 80, step: 1, value: t1, fmt: function (v) { return v.toFixed(0); }, onInput: function (v) { t1 = v; update(); } });
  ui.slider({ label: "Presupuesto de la película nueva (×10 M€)", min: 0.5, max: 6, step: 0.1, value: xn, fmt: function (v) { return (v * 10).toFixed(0) + " M€"; }, onInput: function (v) { xn = v; update(); } });
  ui.toggle({ label: "Mostrar los títulos", value: true, onChange: function (v) { showNames = v; update(); } });
  ui.button("Volver a la recta 115 + 34·x", function () { t0 = 115; t1 = 34; s0.set(t0, true); s1.set(t1, true); update(); }, "primary");

  function draw(ctx, w, h, C) {
    var D = api.d;
    plot.axes(ctx); ctx.save(); plot.clip(ctx);
    // recta
    D.line(ctx, plot.x(0), plot.y(t0), plot.x(6), plot.y(t0 + t1 * 6), C.cobalto, 3);
    // intercepto marcado
    D.circle(ctx, plot.x(0), plot.y(t0), 5, C.cobalto, C.paper, 1.5);
    D.text(ctx, "θ₀ = " + t0.toFixed(0), plot.x(0) + 8, plot.y(t0) + (t1 >= 0 ? 18 : -10), { color: C.cobaltoInk, size: 11, weight: 600 });
    // película nueva: guías a trazos
    var yn = t0 + t1 * xn;
    D.line(ctx, plot.x(xn), plot.y(0), plot.x(xn), plot.y(yn), C.terracota, 1.5, [5, 4]);
    D.line(ctx, plot.x(0), plot.y(yn), plot.x(xn), plot.y(yn), C.terracota, 1.5, [5, 4]);
    D.circle(ctx, plot.x(xn), plot.y(yn), 7, C.terracota, C.paper, 2);
    D.text(ctx, "ŷ = " + yn.toFixed(0), plot.x(0) + 8, plot.y(yn) - 6, { color: C.terracotaInk, size: 11, weight: 600 });
    // películas reales
    pts.forEach(function (p) {
      var yh = t0 + t1 * p.x;
      D.line(ctx, plot.x(p.x), plot.y(p.y), plot.x(p.x), plot.y(yh), C.muted, 1, [3, 3]);
      D.circle(ctx, plot.x(p.x), plot.y(p.y), 5.5, C.ink, C.paper, 1.5);
      if (showNames && view.w > 420) {
        var left = xn > p.x && xn - p.x < 1.1;     // la película nueva está justo a la derecha: título a la izquierda
        D.text(ctx, p.n, plot.x(p.x) + (left ? -8 : 8), plot.y(p.y) + (p.y > yh ? -8 : 16), { color: C.ink2, size: 11, align: left ? "right" : "left" });
      }
    });
    ctx.restore();
  }
  function update() {
    view.redraw();
    var yn = t0 + t1 * xn;
    var txt = "Recta: ŷ = <b>" + t0.toFixed(0) + " + " + t1.toFixed(0) + "·x</b><br>" +
      "Película nueva de <b>" + (xn * 10).toFixed(0) + " M€</b> (x = " + xn.toFixed(1) + "): ŷ = " + t0.toFixed(0) + " + " + t1.toFixed(0) + " × " + xn.toFixed(1) + " = <b>" + yn.toFixed(0) + " mil horas</b><br>";
    if (t1 === 34 && t0 === 115) txt += "<span class='good'>Esta es la recta de mínimos cuadrados de las cinco películas (lección 2).</span>";
    else if (xn > 5.5 || xn < 0.8) txt += "<span class='bad'>Estás fuera del rango de los datos (10–50 M€): extrapolar es fiarse de la recta donde no has visto ninguna película.</span>";
    else txt += "Cada 10 M€ más de presupuesto cambian la predicción en <b>" + t1.toFixed(0) + " mil horas</b>: eso es la pendiente.";
    out.set(txt);
  }
  view.draw(draw); update();
});
