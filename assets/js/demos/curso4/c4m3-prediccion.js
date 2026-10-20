/* Experimento: la recta ŷ = w·x + b como función de tensores; residuos y MSE de 3 puntos. */
Lab.register("curso4/c4m3-prediccion", function (root, api) {
  var X = [1, 2, 3], Y = [2, 5, 8], w = 2, b = 0.5, xn = 4, NAMES = ["Shrek", "Toy Story", "El Rey León"];
  var view = api.view(root, { aspect: 1.75, minH: 240, label: "Tres películas, Shrek (1,2), Toy Story (2,5) y El Rey León (3,8), con su presupuesto y sus horas vistas, y una recta ŷ = w·x + b con los errores en vertical" });
  var plot = api.plot(view, { xr: [0, 5], yr: [-2, 14], xticks: 5, yticks: 4, xlabel: "presupuesto x (×10 M€)", ylabel: "horas vistas y (×100 mil)", pad: { l: 48, r: 14, t: 14, b: 40 } });
  var ui = api.controls(root);
  var sw = ui.slider({ label: "w (horas añadidas por cada +10 M€)", min: -1, max: 5, step: 0.1, value: w, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { w = v; update(); } });
  var sb = ui.slider({ label: "b (sesgo)", min: -4, max: 4, step: 0.1, value: b, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { b = v; update(); } });
  var sx = ui.slider({ label: "x nueva (presupuesto de una peli nueva)", min: 0, max: 5, step: 0.1, value: xn, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { xn = v; update(); } });
  ui.button("Poner w = 3 y b = −1", function () { w = 3; b = -1; sw.set(3, true); sb.set(-1, true); update(); }, "primary");
  var tab = api.table(root, ["x", "y", "ŷ", "ŷ − y", "(ŷ − y)²"]);
  var out = api.readout(root);

  function draw(ctx, W, H, C) {
    var D = api.d, i, pb = plot.box;
    plot.axes(ctx);
    ctx.save(); plot.clip(ctx);
    D.line(ctx, plot.x(0), plot.y(b), plot.x(5), plot.y(w * 5 + b), C.cobalto, 3);
    for (i = 0; i < 3; i++) {
      var yh = w * X[i] + b;
      D.line(ctx, plot.x(X[i]), plot.y(Y[i]), plot.x(X[i]), plot.y(yh), C.terracota, 2.5);
      D.circle(ctx, plot.x(X[i]), plot.y(yh), 4, C.paper, C.cobalto, 2);
    }
    for (i = 0; i < 3; i++) D.circle(ctx, plot.x(X[i]), plot.y(Y[i]), 6, C.terracota, C.paper, 1.5);
    for (i = 0; i < 3; i++) D.text(ctx, NAMES[i], plot.x(X[i]), plot.y(Y[i]) + (w * X[i] + b > Y[i] ? 20 : -11), { size: 11, color: C.ink2, weight: 600, align: "center" });
    var yn = w * xn + b;
    D.line(ctx, plot.x(xn), plot.y(-2), plot.x(xn), plot.y(14), C.oliva, 1.5, [4, 4]);
    D.circle(ctx, plot.x(xn), plot.y(yn), 6, C.oliva, C.paper, 1.5);
    ctx.restore();
    var lbl = "peli nueva: x = " + xn.toFixed(1) + " → ŷ = " + yn.toFixed(2);
    var lx = plot.x(xn) + (plot.x(xn) > pb.x + pb.w * 0.6 ? -8 : 8), al = plot.x(xn) > pb.x + pb.w * 0.6 ? "right" : "left";
    var ly = M().clamp(plot.y(yn) - 10, pb.y + 14, pb.y + pb.h - 8);
    D.text(ctx, lbl, lx, ly, { size: 11.5, color: C.olivaInk, weight: 600, align: al });
    D.text(ctx, "reales (las 3 películas)", pb.x + 8, pb.y + 16, { size: 11, color: C.terracotaInk, weight: 600 });
    D.text(ctx, "predichos ŷ (huecos)", pb.x + 8, pb.y + 31, { size: 11, color: C.cobaltoInk, weight: 600 });
  }
  function M() { return api.math; }
  function update() {
    var rows = [], s = 0, i, es = [];
    for (i = 0; i < 3; i++) {
      var yh = w * X[i] + b, e = yh - Y[i]; s += e * e; es.push(e);
      rows.push([X[i], Y[i], yh.toFixed(2), (e >= 0 ? "+" : "") + e.toFixed(2), (e * e).toFixed(2)]);
    }
    rows.push(["media", "", "", "", "<b>" + (s / 3).toFixed(3) + "</b>"]);
    tab.set(rows);
    view.redraw();
    var parts = es.map(function (e) { return (e * e).toFixed(2); }).join(" + ");
    out.set("ŷ = <b>" + w.toFixed(1) + "</b>·x + <b>" + b.toFixed(1) + "</b><br>MSE = (" + parts + ") / 3 = <b>" + (s / 3).toFixed(3) + "</b>" + (s / 3 < 1e-9 ? " <span class='good'>← error cero: es la recta que generó los datos</span>" : "") + "<br>para una película nueva con presupuesto x = " + xn.toFixed(1) + " (" + (xn * 10).toFixed(0) + " M€) el modelo predice <b>" + (w * xn + b).toFixed(2) + "</b> (×100 mil horas)");
  }
  view.draw(draw); update();
});
