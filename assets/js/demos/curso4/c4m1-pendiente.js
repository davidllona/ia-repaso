/* Experimento: la derivada como pendiente. La recta secante entre x y x+h se aproxima a la tangente cuando h → 0,
   y su pendiente (f(x+h) − f(x)) / h se acerca a f'(x). Abajo se dibuja f' para ver la derivada como función. */
Lab.register("curso4/c4m1-pendiente", function (root, api) {
  var D = api.d, M = api.math;
  var F = {
    x2: { name: "x²", f: function (x) { return x * x; }, d: function (x) { return 2 * x; }, yr: [-1, 9], dr: [-6, 6], sym: "2x" },
    x3: { name: "x³", f: function (x) { return x * x * x; }, d: function (x) { return 3 * x * x; }, yr: [-27, 27], dr: [-2, 27], sym: "3x²" },
    sin: { name: "sin(x)", f: Math.sin, d: Math.cos, yr: [-1.5, 1.5], dr: [-1.5, 1.5], sym: "cos(x)" },
    exp: { name: "eˣ", f: Math.exp, d: Math.exp, yr: [-1, 20], dr: [-1, 20], sym: "eˣ" },
    relu: { name: "ReLU(x)", f: function (x) { return Math.max(0, x); }, d: function (x) { return x > 0 ? 1 : 0; }, yr: [-0.5, 3], dr: [-0.5, 1.5], sym: "1 si x>0, 0 si x≤0" },
    sig: { name: "sigmoide(x)", f: M.sigmoid, d: function (x) { var s = M.sigmoid(x); return s * (1 - s); }, yr: [-0.1, 1.1], dr: [-0.05, 0.4], sym: "σ(x)(1−σ(x))" }
  };
  var st = { fn: "x2", x0: 1.5, le: 0 };
  var v1 = api.view(root, { aspect: 2.1, minH: 190, maxH: 270, label: "Curva f(x) con la recta secante y la tangente" });
  var v2 = api.view(root, { aspect: 4.2, minH: 110, maxH: 150, label: "Curva de la derivada f'(x)" });
  var ui = api.controls(root), out = api.readout(root);
  ui.select({ label: "Función f(x)", value: "x2", options: Object.keys(F).map(function (k) { return [k, F[k].name]; }), onChange: function (v) { st.fn = v; update(); } });
  var sx = ui.slider({ label: "Punto x", min: -3, max: 3, step: 0.1, value: st.x0, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { st.x0 = v; update(); } });
  var sh = ui.slider({ label: "Salto h (en escala logarítmica)", min: -4, max: 0.4, step: 0.05, value: st.le, fmt: function (v) { var h = Math.pow(10, v); return h >= 0.1 ? h.toFixed(2) : h.toExponential(1); }, onInput: function (v) { st.le = v; update(); } });
  ui.button("Acercar h → 0", function () { sh.set(-4); }, "primary");
  ui.button("h grande", function () { sh.set(0.3); });
  var p1, p2;
  function h() { return Math.pow(10, st.le); }
  v1.draw(function (ctx, w, hh, C) {
    var f = F[st.fn], x0 = st.x0, hv = h(), y0 = f.f(x0), y1 = f.f(x0 + hv), p = p1 = api.plot(v1, { xr: [-3.2, 3.6], yr: f.yr, xticks: 6, yticks: 4, pad: { l: 40, r: 10, t: 12, b: 22 }, xfmt: function (t) { return t.toFixed(1); } });
    p.axes(ctx); ctx.save(); p.clip(ctx);
    var pts = M.linspace(-3.2, 3.6, 160).map(function (x) { return [p.x(x), p.y(f.f(x))]; }); D.path(ctx, pts, C.ink, 2.2);
    var m = (y1 - y0) / hv, md = f.d(x0), xa = -3.2, xb = 3.6;
    D.line(ctx, p.x(xa), p.y(y0 + md * (xa - x0)), p.x(xb), p.y(y0 + md * (xb - x0)), C.oliva, 1.8, [6, 4]);
    D.line(ctx, p.x(xa), p.y(y0 + m * (xa - x0)), p.x(xb), p.y(y0 + m * (xb - x0)), C.terracota, 2);
    ctx.restore();
    D.circle(ctx, p.x(x0), p.y(y0), 5, C.cobalto, C.paper, 1.5);
    if (x0 + hv <= 3.6) D.circle(ctx, p.x(x0 + hv), p.y(y1), 4.5, C.terracota, C.paper, 1.5);
    function tag(txt, x, y, al, o) {   /* etiqueta con fondo para que no se pise con la curva */
      ctx.save(); ctx.font = (o.weight || 400) + " " + o.size + "px " + (o.mono ? "'IBM Plex Mono',monospace" : "'IBM Plex Sans',system-ui,sans-serif");
      var tw = ctx.measureText(txt).width; ctx.restore();
      ctx.save(); ctx.globalAlpha = 0.85; ctx.fillStyle = C.surface;
      ctx.fillRect(al === "right" ? x - tw - 4 : x - 3, y - o.size - 1, tw + 8, o.size + 6); ctx.restore();
      o.align = al; D.text(ctx, txt, x, y, o);
    }
    tag("f(x) = " + f.name, p.box.x + 6, p.box.y + 14, "left", { size: 11.5, weight: 700, mono: true });
    tag("secante", p.box.x + p.box.w - 6, p.box.y + 14, "right", { size: 10.5, color: C.terracotaInk, weight: 600 });
    tag("tangente", p.box.x + p.box.w - 6, p.box.y + 30, "right", { size: 10.5, color: C.olivaInk, weight: 600 });
  });
  v2.draw(function (ctx, w, hh, C) {
    var f = F[st.fn], p = p2 = api.plot(v2, { xr: [-3.2, 3.6], yr: f.dr, xticks: 6, yticks: 2, pad: { l: 40, r: 10, t: 10, b: 22 }, xfmt: function (t) { return t.toFixed(1); } });
    p.axes(ctx); ctx.save(); p.clip(ctx);
    D.path(ctx, M.linspace(-3.2, 3.6, 160).map(function (x) { return [p.x(x), p.y(f.d(x))]; }), C.olivaInk, 2);
    ctx.restore();
    var m = (f.f(st.x0 + h()) - f.f(st.x0)) / h(), md = f.d(st.x0);
    D.line(ctx, p.x(st.x0), p.box.y, p.x(st.x0), p.box.y + p.box.h, C.line, 1, [3, 3]);
    D.circle(ctx, p.x(st.x0), p.y(md), 5, C.oliva, C.paper, 1.5);
    var my = Math.max(f.dr[0], Math.min(f.dr[1], m)); D.circle(ctx, p.x(st.x0), p.y(my), 4, C.terracota, C.paper, 1.5);
    D.text(ctx, "f'(x) = " + f.sym, p.box.x + 6, p.box.y + 13, { size: 11, weight: 700, mono: true, color: C.olivaInk });
  });
  function update() {
    var f = F[st.fn], x0 = st.x0, hv = h(), m = (f.f(x0 + hv) - f.f(x0)) / hv, md = f.d(x0);
    var s = "<b>f(x)</b> = " + f.name + " en x = " + x0.toFixed(1) + ": f(x) = <b>" + f.f(x0).toFixed(4) + "</b> · f(x+h) = " + f.f(x0 + hv).toFixed(4) +
      "<br>Pendiente de la secante (f(x+h) − f(x)) / h = <b>" + m.toFixed(4) + "</b> (naranja) · derivada exacta f'(x) = <b>" + md.toFixed(4) + "</b> (verde)" +
      "<br>Diferencia: " + Math.abs(m - md).toExponential(2);
    if (st.fn === "relu" && Math.abs(x0) < 0.05) s += "<br><span class='bad'>En x = 0 ReLU tiene una esquina: la secante da 1 (h &gt; 0) pero la derivada «exacta» no existe. PyTorch usa por convención 0.</span>";
    out.set(s); v1.redraw(); v2.redraw();
  }
  update();
});
