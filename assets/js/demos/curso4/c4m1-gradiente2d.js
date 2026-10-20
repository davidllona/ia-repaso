/* Experimento: derivadas parciales y gradiente de f(x, y). Se arrastra un punto sobre el mapa de alturas;
   ∂f/∂x es la pendiente al moverse solo en x, ∂f/∂y solo en y, y el gradiente (∂f/∂x, ∂f/∂y) apunta cuesta arriba. */
Lab.register("curso4/c4m1-gradiente2d", function (root, api) {
  var D = api.d, M = api.math;
  var F = {
    bowl: { name: "x² + y²  (cuenco redondo)", f: function (x, y) { return x * x + y * y; }, gx: function (x, y) { return 2 * x; }, gy: function (x, y) { return 2 * y; }, fr: [0, 18] },
    oval: { name: "x² + 4y²  (cuenco alargado)", f: function (x, y) { return x * x + 4 * y * y; }, gx: function (x, y) { return 2 * x; }, gy: function (x, y) { return 8 * y; }, fr: [0, 40] },
    saddle: { name: "x·y  (silla de montar)", f: function (x, y) { return x * y; }, gx: function (x, y) { return y; }, gy: function (x, y) { return x; }, fr: [-9, 9] }
  };
  var st = { fn: "bowl", x: 2, y: 1, lr: 0.1, steps: 0 };
  var coarse = !!(window.matchMedia && window.matchMedia("(pointer:coarse)").matches);   /* en táctil no se arrastra: hay deslizadores */
  var view = api.view(root, { aspect: 1.75, minH: 260, maxH: 380, drag: !coarse, label: "Mapa del error f(x, y) según dos pesos, con el punto, las derivadas parciales y el gradiente" });
  var ui = api.controls(root), out = api.readout(root);
  ui.select({ label: "Función f(x, y)", value: "bowl", options: Object.keys(F).map(function (k) { return [k, F[k].name]; }), onChange: function (v) { st.fn = v; st.steps = 0; update(); } });
  var sgx = ui.slider({ label: "Posición x (peso del género)", min: -3, max: 3, step: 0.05, value: st.x, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { st.x = v; st.steps = 0; update(); } });
  var sgy = ui.slider({ label: "Posición y (peso de la duración)", min: -3, max: 3, step: 0.05, value: st.y, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { st.y = v; st.steps = 0; update(); } });
  var slr = ui.slider({ label: "Tamaño del paso (lr)", min: 0.02, max: 0.3, step: 0.01, value: st.lr, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { st.lr = v; update(); } });
  ui.button("Un paso cuesta abajo", function () { step(1); }, "primary");
  ui.button("10 pasos", function () { step(10); });
  ui.button("Punto inicial (2, 1)", function () { st.x = 2; st.y = 1; st.steps = 0; update(); });
  function step(k) { var f = F[st.fn]; for (var q = 0; q < k; q++) { var gx = f.gx(st.x, st.y), gy = f.gy(st.x, st.y); st.x -= st.lr * gx; st.y -= st.lr * gy; st.steps++; } st.x = M.clamp(st.x, -3, 3); st.y = M.clamp(st.y, -3, 3); update(); }
  var p;
  function draw(ctx, w, h, C) {
    var f = F[st.fn]; p = api.plot(view, { xr: [-3, 3], yr: [-3, 3], xticks: 6, yticks: 6, pad: { l: 40, r: 10, t: 10, b: 40 }, grid: false, xlabel: "x (peso del género)", ylabel: "y (peso de la duración)", xfmt: function (t) { return Math.round(t); }, yfmt: function (t) { return Math.round(t); } });
    p.axes(ctx);
    var b = p.box, nx = 48, ny = 30, cwid = b.w / nx, chei = b.h / ny, i, j, fr = f.fr;
    ctx.save(); p.clip(ctx);
    for (i = 0; i < nx; i++) for (j = 0; j < ny; j++) {
      var x = p.ix(b.x + (i + 0.5) * cwid), y = p.iy(b.y + (j + 0.5) * chei), v = f.f(x, y);
      var tt = st.fn === "saddle" ? v / 9 : (v - fr[0]) / (fr[1] - fr[0]);
      ctx.globalAlpha = Math.min(0.85, Math.abs(tt) * 0.85);
      ctx.fillStyle = tt >= 0 ? C.terracota : C.cobalto;
      ctx.fillRect(b.x + i * cwid, b.y + j * chei, cwid + 0.5, chei + 0.5);
    }
    ctx.restore();
    D.rect(ctx, b.x, b.y, b.w, b.h, null, C.ink, 1.5);
    var px = p.x(st.x), py = p.y(st.y), gx = f.gx(st.x, st.y), gy = f.gy(st.x, st.y), sc = 14;
    function clampv(v) { return Math.max(-70, Math.min(70, v)); }
    D.arrow(ctx, px, py, px + clampv(gx * sc), py, C.cobaltoInk, 2.2);
    D.arrow(ctx, px, py, px, py - clampv(gy * sc), C.olivaInk, 2.2);
    D.arrow(ctx, px, py, px + clampv(gx * sc), py - clampv(gy * sc), C.ink, 3);
    D.circle(ctx, px, py, 6, C.paper, C.ink, 2.5);
    D.text(ctx, "∂f/∂x", Math.min(b.x + b.w - 34, Math.max(b.x + 8, px + clampv(gx * sc) / 2)), py + (gy >= 0 ? 14 : -6), { align: "center", size: 10.5, color: C.cobaltoInk, weight: 700 });
    D.text(ctx, "∂f/∂y", px + (gx >= 0 ? -8 : 8), py - clampv(gy * sc) / 2, { align: gx >= 0 ? "right" : "left", size: 10.5, color: C.olivaInk, weight: 700 });
    D.text(ctx, "∇f", px + clampv(gx * sc) + (gx >= 0 ? 6 : -6), py - clampv(gy * sc) + (gy >= 0 ? -6 : 14), { align: gx >= 0 ? "left" : "right", size: 11, weight: 700 });
  }
  view.draw(draw);
  if (!coarse) view.pointer({ down: mv, drag: mv });
  function mv(px, py) { if (!p || !p.inside(px, py)) return; st.x = Math.round(p.ix(px) * 20) / 20; st.y = Math.round(p.iy(py) * 20) / 20; st.steps = 0; update(); }
  function update() {
    var f = F[st.fn], x = st.x, y = st.y, e = 1e-4;
    sgx.set(x, true); sgy.set(y, true);
    var nx = (f.f(x + e, y) - f.f(x - e, y)) / (2 * e), ny = (f.f(x, y + e) - f.f(x, y - e)) / (2 * e);
    var gx = f.gx(x, y), gy = f.gy(x, y), n = Math.sqrt(gx * gx + gy * gy);
    out.set("Punto (x, y) = (<b>" + x.toFixed(2) + "</b>, <b>" + y.toFixed(2) + "</b>) · f = <b>" + f.f(x, y).toFixed(3) + "</b>" + (st.steps ? " · pasos dados: " + st.steps : "") +
      "<br>∂f/∂x = <b>" + gx.toFixed(3) + "</b> (comprobación numérica " + nx.toFixed(3) + ") · ∂f/∂y = <b>" + gy.toFixed(3) + "</b> (numérica " + ny.toFixed(3) + ")" +
      "<br>Gradiente ∇f = (" + gx.toFixed(2) + ", " + gy.toFixed(2) + ") · longitud " + n.toFixed(2) + (n < 0.05 ? " · <span class='good'>pendiente casi cero: has llegado a un punto llano</span>" : "") +
      "<br>Un paso cuesta abajo lleva a (x − lr·∂f/∂x, y − lr·∂f/∂y) = (" + (x - st.lr * gx).toFixed(2) + ", " + (y - st.lr * gy).toFixed(2) + ")");
    view.redraw();
  }
  update();
});
