/* Experimento: la «cinta» (GradientTape) da el valor y la derivada de y = x² + 2x en cada punto. */
Lab.register("curso2/c2m2-derivada", function (root, api) {
  var st = { x: 1 };
  var view = api.view(root, { aspect: 1.5, minH: 230, maxH: 360, label: "Curva y = x² + 2x con el punto elegido y la recta que la toca, cuya inclinación es la derivada" });
  var plot = api.plot(view, { xr: [-4, 4], yr: [-4, 26], xticks: 8, yticks: 3, xlabel: "x", ylabel: "y", pad: { l: 40, r: 12, t: 12, b: 34 } });
  var ui = api.controls(root), out = api.readout(root);
  var sl = ui.slider({ label: "Valor de x", min: -4, max: 4, step: 0.5, value: st.x, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { st.x = v; update(); } });
  ui.button("Llevar x a 3", function () { st.x = 3; sl.set(3, true); update(); });

  function f(x) { return x * x + 2 * x; }
  function df(x) { return 2 * x + 2; }

  view.draw(function (ctx, w, h, C) {
    var D = api.d, b = plot.box, pts = [], i;
    plot.axes(ctx);
    ctx.save(); plot.clip(ctx);
    D.line(ctx, b.x, plot.y(0), b.x + b.w, plot.y(0), C.ink2, 1);
    for (i = 0; i <= 160; i++) { var x = -4 + 8 * i / 160; pts.push([plot.x(x), plot.y(f(x))]); }
    D.path(ctx, pts, C.cobalto, 2.6);
    /* recta tangente: y = f(x0) + f'(x0)(x - x0) */
    var x0 = st.x, y0 = f(x0), m = df(x0);
    D.line(ctx, plot.x(x0 - 3), plot.y(y0 - 3 * m), plot.x(x0 + 3), plot.y(y0 + 3 * m), C.terracota, 2, [6, 4]);
    /* escalón «sube 1 en x → sube m en y» */
    var x1 = x0 + 1;
    D.line(ctx, plot.x(x0), plot.y(y0), plot.x(x1), plot.y(y0), C.ink, 1.4);
    D.line(ctx, plot.x(x1), plot.y(y0), plot.x(x1), plot.y(y0 + m), C.ink, 1.4);
    ctx.restore();
    D.circle(ctx, plot.x(x0), plot.y(y0), 6.5, C.terracota, C.paper, 2);
    var narrow = w < 420;
    var px0 = plot.x(x0), leftOk = px0 - b.x > 80;
    var lx = leftOk ? px0 - 10 : px0 + 10, al = leftOk ? "right" : "left";
    var ly = Math.max(b.y + 16, Math.min(b.y + b.h - 10, plot.y(y0) + (leftOk ? -12 : -22)));
    D.text(ctx, "y = " + y0.toFixed(2).replace(".", ","), lx, ly, { align: al, size: narrow ? 12 : 13, weight: 700, color: C.terracotaInk });
    var sx = plot.x(x1) + 5, sy = Math.max(b.y + 14, Math.min(b.y + b.h - 6, plot.y(y0 + m / 2)));
    if (sx < b.x + b.w - 30) D.text(ctx, "+" + m.toFixed(0), sx, sy, { size: 12, weight: 700, color: C.ink });
  });

  function update() {
    view.redraw();
    var x = st.x, a = x * x, c = 2 * x, y = a + c, m = df(x);
    function n(v) { return (Math.round(v * 100) / 100).toString().replace(".", ","); }
    out.set("<b>Graba</b>: x² = " + n(a) + " · 2x = " + n(c) + " · y = " + n(a) + " + " + n(c) + " = <b>" + n(y) + "</b>" +
      "<br><b>Rebobina</b>: derivada = 2·x + 2 = 2·" + n(x) + " + 2 = <b>" + n(m) + "</b>" +
      "<br>" + (m === 0 ? "La curva está plana: mover x un poquito casi no cambia y." :
        "Si x sube 0,01, y " + (m > 0 ? "sube" : "baja") + " unas " + n(Math.abs(m)) + " veces eso: " + n(Math.abs(m) * 0.01) + "."));
  }
  update();
});
