/* Experimento: un paso de SGD con momentum desmontado en flechas. Valle f(x, y) = ½(x² + k·y²). Forma de PyTorch:
   v ← μ·v + g ;  w ← w − lr·v  (Nesterov: w ← w − lr·(g + μ·v) con la v ya actualizada). */
Lab.register("curso5/c5m2-momentum-valle", function (root, api) {
  var D = api.d, C0 = api.colors();
  var S = { lrExp: -1.55, mu: 0.9, k: 20, nest: false, start: [-8, 1.2], paths: null };
  var XR = [-10, 3], YR = [-2.2, 2.2];
  function grad(p) { return [p[0], S.k * p[1]]; }
  function f(p) { return 0.5 * (p[0] * p[0] + S.k * p[1] * p[1]); }
  function lr() { return Math.pow(10, S.lrExp); }
  function reset() {
    S.paths = { sgd: { pts: [S.start.slice()], w: S.start.slice() }, mom: { pts: [S.start.slice()], w: S.start.slice(), v: [0, 0], last: null } };
    S.n = 0;
  }
  function step() {
    var a = S.paths.sgd, g = grad(a.w), L = lr();
    a.w = [a.w[0] - L * g[0], a.w[1] - L * g[1]]; a.pts.push(a.w.slice());
    var m = S.paths.mom, gm = grad(m.w), vprev = m.v.slice();
    m.v = [S.mu * m.v[0] + gm[0], S.mu * m.v[1] + gm[1]];
    var dir = S.nest ? [gm[0] + S.mu * m.v[0], gm[1] + S.mu * m.v[1]] : m.v;
    var from = m.w.slice();
    m.w = [m.w[0] - L * dir[0], m.w[1] - L * dir[1]]; m.pts.push(m.w.slice());
    m.last = { from: from, g: gm, vprev: vprev, v: m.v.slice(), dir: dir };
    S.n++;
    if (!isFinite(m.w[0]) || Math.abs(m.w[0]) > 1e6 || Math.abs(m.w[1]) > 1e6) m.broken = true;
  }

  var view = api.view(root, { aspect: 1.75, minH: 250, maxH: 400, drag: true, label: "Valle largo y estrecho con el camino de SGD y el de SGD con momentum, y las flechas de un paso" });
  var plot = api.plot(view, { xr: XR, yr: YR, xticks: 6, yticks: 4, pad: { l: 34, r: 10, t: 10, b: 26 }, xfmt: function (v) { return Math.round(v); }, yfmt: function (v) { return +v.toFixed(1); } });
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.72rem, 2.7vw, .84rem)";
  ui.slider({ label: "Learning rate (escala log)", min: -2.4, max: -1.1, step: 0.01, value: S.lrExp, fmt: function (v) { return Math.pow(10, v).toFixed(3); }, onInput: function (v) { S.lrExp = v; reset(); update(); } });
  ui.slider({ label: "Momentum μ", min: 0, max: 0.99, step: 0.01, value: S.mu, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.mu = v; reset(); update(); } });
  ui.slider({ label: "Lo estrecho que es el valle (k)", min: 2, max: 40, step: 1, value: S.k, onInput: function (v) { S.k = v; reset(); update(); } });
  ui.toggle({ label: "Nesterov", value: S.nest, onChange: function (v) { S.nest = v; reset(); update(); } });
  ui.button("Dar 1 paso", function () { step(); update(); }, "primary");
  ui.button("Dar 10 pasos", function () { for (var i = 0; i < 10; i++) step(); update(); });
  ui.button("Dar 50 pasos", function () { for (var i = 0; i < 50; i++) step(); update(); });
  ui.button("Volver al inicio", function () { reset(); update(); });
  api.legend(root, [[C0.muted, "SGD simple"], [C0.cobalto, "SGD con momentum"], [C0.terracota, "flecha −lr·g (el gradiente de hoy)"], [C0.oliva, "flecha −lr·μ·v (la inercia)"]]);
  view.pointer({ down: mv, drag: mv });
  function mv(px, py) { var p = [plot.ix(px), plot.iy(py)]; if (plot.inside(px, py)) { S.start = [Math.max(XR[0] + 0.5, Math.min(XR[1] - 0.5, p[0])), Math.max(YR[0] + 0.3, Math.min(YR[1] - 0.3, p[1]))]; reset(); update(); } }

  function draw(ctx, w, h, C) {
    plot.axes(ctx); ctx.save(); plot.clip(ctx);
    var i, j, lv = [0.5, 2, 6, 14, 28, 45];
    lv.forEach(function (c) {
      var a = Math.sqrt(2 * c), b = Math.sqrt(2 * c / S.k), pts = [];
      for (j = 0; j <= 60; j++) { var t = 2 * Math.PI * j / 60; pts.push([plot.x(a * Math.cos(t)), plot.y(b * Math.sin(t))]); }
      D.path(ctx, pts, C.line, 1.1);
    });
    function path(pp, col, wd) { D.path(ctx, pp.pts.map(function (q) { return [plot.x(q[0]), plot.y(q[1])]; }), col, wd); pp.pts.forEach(function (q, ii) { if (ii < 60 || ii === pp.pts.length - 1) D.circle(ctx, plot.x(q[0]), plot.y(q[1]), 2.4, col); }); }
    path(S.paths.sgd, C.muted, 1.6); path(S.paths.mom, C.cobalto, 2.2);
    var m = S.paths.mom;
    if (m.last) {
      var L = lr(), sc = function (q) { return [plot.x(q[0]), plot.y(q[1])]; }, a = sc(m.last.from);
      var e1 = [m.last.from[0] - L * m.last.g[0], m.last.from[1] - L * m.last.g[1]], e2 = [m.last.from[0] - L * S.mu * m.last.vprev[0], m.last.from[1] - L * S.mu * m.last.vprev[1]];
      var b1 = sc(e1), b2 = sc(e2);
      if (!S.nest) {
        D.arrow(ctx, a[0], a[1], b2[0], b2[1], C.oliva, 2.4);
        D.arrow(ctx, b2[0], b2[1], b2[0] + (b1[0] - a[0]), b2[1] + (b1[1] - a[1]), C.terracota, 2.4);
      } else { D.arrow(ctx, a[0], a[1], b2[0], b2[1], C.oliva, 2.4); D.arrow(ctx, b2[0], b2[1], b2[0] + (b1[0] - a[0]), b2[1] + (b1[1] - a[1]), C.terracota, 2.4); }
    }
    D.circle(ctx, plot.x(0), plot.y(0), 4.5, null, C.ink, 1.6);
    D.circle(ctx, plot.x(S.start[0]), plot.y(S.start[1]), 6, C.marker, C.ink, 1.6);
    ctx.restore();
    D.text(ctx, "mínimo", plot.x(0) + 8, plot.y(0) - 8, { size: 10.5, color: C.muted });
    D.text(ctx, "arrastra el punto amarillo", plot.box.x + 6, plot.box.y + plot.box.h - 6, { size: 10.5, color: C.muted });
  }
  reset();
  view.draw(draw);
  function f3(v) { return (Math.abs(v) < 5e-4 ? 0 : v).toFixed(2).replace("-", "−"); }
  function update() {
    var m = S.paths.mom, a = S.paths.sgd, L = lr(), s = "Paso <b>" + S.n + "</b> · coste: SGD <b>" + f(a.w).toExponential(2) + "</b> · momentum <b>" + f(m.w).toExponential(2) + "</b>";
    if (m.last) s += "<br>Último paso del momentum: g = (" + f3(m.last.g[0]) + "; " + f3(m.last.g[1]) + ") · v = μ·v_ant + g = (" + f3(m.last.v[0]) + "; " + f3(m.last.v[1]) + ") · movimiento = −lr·" + (S.nest ? "(g + μ·v)" : "v") + " = (" + f3(-L * m.last.dir[0]) + "; " + f3(-L * m.last.dir[1]) + ")";
    if (m.broken || a.w[0] !== a.w[0] || Math.abs(a.w[1]) > 1e3) s += "<br><span class='bad'>Algo diverge: el learning rate es demasiado grande para lo estrecho del valle (SGD simple se estabiliza si lr·k &lt; 2: aquí lr·k = " + (L * S.k).toFixed(2) + ").</span>";
    else s += "<br>lr·k = " + (L * S.k).toFixed(2) + " (SGD simple se estabiliza mientras sea &lt; 2). La flecha verde es la inercia y la terracota el gradiente de hoy: su suma es el paso.";
    out.set(s); view.redraw();
  }
  reset(); update();
});
