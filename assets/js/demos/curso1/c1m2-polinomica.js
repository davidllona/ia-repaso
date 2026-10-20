/* Experimento: regresión polinómica = regresión lineal con columnas nuevas x, x², x³… ¿Cuántas columnas son demasiadas? */
Lab.register("curso1/c1m2-polinomica", function (root, api) {
  var M = api.math, seed = 21, deg = 2, noise = 0.4, N = 16, train, test, errs;
  function f(v) { return 4.5 + 0.0012 * (v - 85) * (v - 85); }   // consumo (L/100 km) según velocidad (km/h)
  function u(v) { return (v - 90) / 60; }                        // velocidad estandarizada a ~[-1.2, 1.2]
  function gen() {
    var r = api.rng(seed), i, t = api.rng(777); train = []; test = [];
    for (i = 0; i < N; i++) { var v = r.range(20, 160); train.push([v, f(v) + r.normal(0, noise)]); }
    for (i = 0; i < 80; i++) { var v2 = t.range(20, 160); test.push([v2, f(v2) + t.normal(0, noise)]); }
    train.sort(function (a, b) { return a[0] - b[0]; });
  }
  function fit(d) { return M.polyfit(train.map(function (p) { return u(p[0]); }), train.map(function (p) { return p[1]; }), d, 1e-9); }
  function rmse(c, set) { return Math.sqrt(M.mean(set.map(function (p) { var e = M.polyval(c, u(p[0])) - p[1]; return e * e; }))); }
  function allErrs() { errs = []; for (var d = 1; d <= 12; d++) { var c = fit(d); errs.push([d, rmse(c, train), rmse(c, test)]); } }

  var view = api.view(root, { aspect: 1.7, minH: 260, label: "Consumo de combustible según la velocidad: puntos de entrenamiento, de test y la curva del polinomio" });
  var plot = api.plot(view, { xr: [0, 180], yr: [2, 14], xticks: 6, yticks: 6, xlabel: "Velocidad (km/h)", ylabel: "Consumo (L/100 km)", pad: { l: 48, r: 12, t: 12, b: 40 } });
  var view2 = api.view(root, { aspect: 3.8, minH: 130, maxH: 190, label: "Error de entrenamiento y de test según el grado del polinomio" });
  var plot2 = api.plot(view2, { xr: [1, 12], yr: [0, 2], xticks: 11, yticks: 2, xlabel: "grado del polinomio", pad: { l: 40, r: 12, t: 8, b: 34 } });
  api.legend(root, [[api.colors().cobalto, "entrenamiento (los que el modelo ve)"], [api.colors().muted, "test (nunca vistos)"], [api.colors().terracota, "curva del modelo"]]);
  var ui = api.controls(root), tab = api.table(root, ["velocidad (km/h)", "x = (v − 90) / 60", "x²", "x³", ""]), out = api.readout(root);
  ui.slider({ label: "Grado del polinomio (nº de columnas nuevas)", min: 1, max: 12, step: 1, value: deg, onInput: function (v) { deg = v; update(); } });
  ui.slider({ label: "Coches de entrenamiento", min: 8, max: 40, step: 1, value: N, onInput: function (v) { N = v; gen(); allErrs(); update(); } });
  ui.slider({ label: "Ruido en los datos", min: 0.1, max: 1, step: 0.05, value: noise, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { noise = v; gen(); allErrs(); update(); } });
  ui.button("Generar otros datos", function () { seed += 5; gen(); allErrs(); update(); }, "primary");

  function draw(ctx, w, h, C) {
    var D = api.d, c = fit(deg), i, tr = [], cur = [];
    plot.axes(ctx); ctx.save(); plot.clip(ctx);
    for (i = 0; i <= 120; i++) { var v = 180 * i / 120; tr.push([plot.x(v), plot.y(f(v))]); }
    D.path(ctx, tr, C.muted, 1.5, [5, 4]);
    test.forEach(function (p) { D.circle(ctx, plot.x(p[0]), plot.y(p[1]), 3, null, C.muted, 1); });
    for (i = 0; i <= 240; i++) { var v2 = 20 + 140 * i / 240; cur.push([plot.x(v2), plot.y(M.polyval(c, u(v2)))]); }
    D.path(ctx, cur, C.terracota, 3);
    train.forEach(function (p) { D.circle(ctx, plot.x(p[0]), plot.y(p[1]), 5.5, C.cobalto, C.paper, 1.5); });
    ctx.restore();
  }
  function draw2(ctx, w, h, C) {
    var D = api.d, ymax = 2;
    plot2.axes(ctx); ctx.save(); plot2.clip(ctx);
    D.path(ctx, errs.map(function (e) { return [plot2.x(e[0]), plot2.y(Math.min(e[1], ymax))]; }), C.cobalto, 2.5);
    D.path(ctx, errs.map(function (e) { return [plot2.x(e[0]), plot2.y(Math.min(e[2], ymax))]; }), C.terracota, 2.5);
    ctx.restore();
    D.line(ctx, plot2.x(deg), plot2.box.y, plot2.x(deg), plot2.box.y + plot2.box.h, C.ink, 1.5, [4, 3]);
    D.text(ctx, "— error de test", plot2.box.x + plot2.box.w - 8, plot2.y(1.45), { size: 10.5, color: C.terracotaInk, weight: 600, align: "right" });
    D.text(ctx, "— error de train", plot2.box.x + plot2.box.w - 8, plot2.y(1.1), { size: 10.5, color: C.cobaltoInk, weight: 600, align: "right" });
  }
  function update() {
    view.redraw(); view2.redraw();
    var e = errs[deg - 1], rows = [], k, j;
    for (k = 0; k < 4; k++) {
      var v = train[Math.floor(k * (train.length - 1) / 3)][0], z = u(v), row = [v.toFixed(0)];
      for (j = 1; j <= 3; j++) row.push(j <= deg ? Math.pow(z, j).toFixed(2) : "—");
      row.push(deg > 3 ? "… hasta x^" + deg : "");
      rows.push(row);
    }
    tab.set(rows);
    var tr = e[1], te = e[2], verdict, cls;
    if (tr > 0.8) { verdict = "Infraajuste: una curva así de simple no recoge la forma de los datos."; cls = "bad"; }
    else if (te > tr * 2 + 0.2) { verdict = "Sobreajuste: ha memorizado el ruido de los coches de entrenamiento; con coches nuevos falla mucho más."; cls = "bad"; }
    else { verdict = "Buen equilibrio: error parecido y bajo en train y en test."; cls = "good"; }
    out.set("Grado <b>" + deg + "</b> → <b>" + (deg + 1) + "</b> parámetros para <b>" + N + "</b> puntos · RMSE train = <b>" + tr.toFixed(2) + "</b> · RMSE test = <b>" + (te > 9 ? ">9" : te.toFixed(2)) + "</b> L/100 km<br><span class='" + cls + "'>" + verdict + "</span>");
  }
  gen(); allErrs(); view.draw(draw); view2.draw(draw2); update();
});
