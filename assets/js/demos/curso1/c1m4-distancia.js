/* Experimento: la distancia euclídea entre dos usuarios (acción, comedia) y qué pasa si una columna cambia de escala. */
Lab.register("curso1/c1m4-distancia", function (root, api) {
  var M = api.math;
  var A = { x: 1, y: 2 }, B = { x: 4, y: 6 }, minutos = false;

  var view = api.view(root, { aspect: 1.5, minH: 280, drag: true, label: "Dos usuarios situados según las películas de acción y de comedia vistas; el segundo se puede arrastrar y se dibuja el triángulo que une a los dos" });
  var plot = api.plot(view, { xr: [0, 10], yr: [0, 10], xticks: 10, yticks: 10, xlabel: "Películas de acción vistas esta semana", ylabel: "Comedias vistas esta semana", pad: { l: 46, r: 14, t: 12, b: 40 } });
  api.legend(root, [[api.colors().cobalto, "usuario A (fijo)"], [api.colors().terracota, "usuario B (arrástralo)"], [api.colors().oliva, "distancia en línea recta"]]);
  var ui = api.controls(root), out = api.readout(root);
  var sx = ui.slider({ label: "Acción de B", min: 0, max: 10, step: 1, value: B.x, fmt: function (v) { return v.toFixed(0); }, onInput: function (v) { B.x = v; update(); } });
  var sy = ui.slider({ label: "Comedia de B", min: 0, max: 10, step: 1, value: B.y, fmt: function (v) { return v.toFixed(0); }, onInput: function (v) { B.y = v; update(); } });
  ui.toggle({ label: "Medir la acción en minutos (×100) en vez de en películas", value: false, onChange: function (v) { minutos = v; update(); } });
  ui.button("Volver al triángulo 3-4-5", function () { B.x = 4; B.y = 6; sx.set(4, true); sy.set(6, true); update(); }, "warm");

  function draw(ctx, w, h, C) {
    var D = api.d, ax = plot.x(A.x), ay = plot.y(A.y), bx = plot.x(B.x), by = plot.y(B.y);
    plot.axes(ctx); ctx.save(); plot.clip(ctx);
    // catetos
    D.line(ctx, ax, ay, bx, ay, C.muted, 2, [5, 4]);
    D.line(ctx, bx, ay, bx, by, C.muted, 2, [5, 4]);
    // hipotenusa
    D.line(ctx, ax, ay, bx, by, C.oliva, 3);
    var dx = B.x - A.x, dy = B.y - A.y;
    if (dx !== 0) D.text(ctx, "diferencia acción = " + dx, (ax + bx) / 2, ay + (dy >= 0 ? 16 : -8), { size: 11, align: "center", color: C.ink2 });
    if (dy !== 0) D.text(ctx, "comedia = " + dy, bx + (dx >= 0 ? 8 : -8), (ay + by) / 2, { size: 11, align: dx >= 0 ? "left" : "right", color: C.ink2 });
    D.circle(ctx, ax, ay, 8, C.cobalto, C.paper, 2);
    D.circle(ctx, bx, by, 9, C.terracota, C.paper, 2);
    D.text(ctx, "A (" + A.x + ", " + A.y + ")", ax, ay - 14, { size: 12, align: "center", color: C.ink });
    D.text(ctx, "B (" + B.x + ", " + B.y + ")", bx, by - 15, { size: 12, align: "center", color: C.ink });
    ctx.restore();
  }
  function update() {
    view.redraw();
    var dx = B.x - A.x, dy = B.y - A.y, d = Math.sqrt(dx * dx + dy * dy);
    var txt = "Diferencias: " + dx + " y " + dy + " → al cuadrado: " + (dx * dx) + " + " + (dy * dy) + " = " + (dx * dx + dy * dy) +
      " → raíz: distancia = <b>" + d.toFixed(2) + "</b>";
    if (minutos) {
      var dxm = dx * 100, dm = Math.sqrt(dxm * dxm + dy * dy);
      txt += "<br>Con la acción en minutos: diferencias " + dxm + " y " + dy + " → distancia = <b>" + dm.toFixed(2) + "</b>. " +
        "La comedia aporta solo el <span class='bad'>" + (dm > 0 ? (100 * dy * dy / (dxm * dxm + dy * dy)).toFixed(2) : "0") + " %</span> de la distancia: la columna grande manda. Por eso se escala antes.";
    }
    out.set(txt);
  }
  function grab(px, py) {
    if (!plot.inside(px, py)) return;
    B.x = M.clamp(Math.round(plot.ix(px)), 0, 10); B.y = M.clamp(Math.round(plot.iy(py)), 0, 10);
    sx.set(B.x, true); sy.set(B.y, true); update();
  }
  view.pointer({ down: grab, drag: grab });
  view.draw(draw); update();
});
