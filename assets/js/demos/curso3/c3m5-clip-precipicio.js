/* Experimento: el «precipicio» de la pérdida. f(w) = 0,05·w² + 2·e^{3(w−2)}: un cuenco suave con una pared casi vertical a la derecha.
   Descenso de gradiente con paso η·g. Sin recorte, un gradiente enorme lanza el peso lejos. Con clipnorm=c el paso nunca pasa de η·c. */
Lab.register("curso3/c3m5-clip-precipicio", function (root, api) {
  var D = api.d, M = api.math, STEPS = 40, coarse = !!(window.matchMedia && matchMedia("(pointer:coarse)").matches);
  var S = { w0: 3, lr: 0.1, c: 3, clip: true };
  function f(w) { return 0.05 * w * w + 2 * Math.exp(3 * (w - 2)); }
  function g(w) { return 0.1 * w + 6 * Math.exp(3 * (w - 2)); }
  var WMIN = (function () { var lo = -2, hi = 1; for (var i = 0; i < 60; i++) { var m = (lo + hi) / 2; if (g(m) > 0) hi = m; else lo = m; } return lo; })();
  function path(useClip) {
    var w = S.w0, ws = [w], gs = [], i, gr, n;
    for (i = 0; i < STEPS; i++) {
      gr = g(w); n = Math.abs(gr); gs.push(gr);
      if (useClip && n > S.c) gr = gr * S.c / n;
      w = w - S.lr * gr; ws.push(w);
      if (Math.abs(w) > 1e6) break;
    }
    return { ws: ws, gs: gs };
  }
  var view = api.view(root, { aspect: 2.1, minH: 230, maxH: 340, drag: !coarse, label: "Pérdida con un precipicio y los recorridos del descenso sin recorte y con clipnorm" });
  var plot = api.plot(view, { xr: [-8, 4], yr: [0, 6], xticks: 6, yticks: 3, xlabel: "peso w", ylabel: "pérdida", pad: { l: 40, r: 14, t: 14, b: 34 }, xfmt: function (v) { return Math.round(v); }, yfmt: function (v) { return Math.round(v); } });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "learning rate η", min: 0.01, max: 0.2, step: 0.01, value: S.lr, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.lr = v; update(); } });
  ui.slider({ label: "clipnorm c", min: 0.5, max: 20, step: 0.5, value: S.c, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.c = v; update(); } });
  ui.slider({ label: "w inicial (también puedes arrastrar el punto)", min: -2, max: 3.4, step: 0.1, value: S.w0, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.w0 = v; update(); } });
  api.legend(root, [[api.colors().terracota, "sin recorte"], [api.colors().cobalto, "con clipnorm"]]);
  view.pointer({ down: function (px) { setW(px); }, drag: function (px) { setW(px); } });
  function setW(px) { S.w0 = Math.round(M.clamp(plot.ix(px), -2, 3.4) * 10) / 10; update(); }

  function drawPath(ctx, p, col, dy, C) {
    var i, pts = [];
    for (i = 0; i < p.ws.length; i++) { var w = p.ws[i]; pts.push([M.clamp(plot.x(w), plot.box.x - 6, plot.box.x + plot.box.w + 6), plot.y(Math.min(f(M.clamp(w, -50, 4)), 5.9)) + dy]); }
    D.path(ctx, pts, col, 1.6, [3, 3]);
    for (i = 0; i < p.ws.length; i++) {
      if (i > 12 && i < p.ws.length - 1) continue;
      var w2 = p.ws[i]; if (w2 < -8 || w2 > 4) continue;
      D.circle(ctx, plot.x(w2), plot.y(f(w2)) + dy, i === 0 ? 5.5 : 3.6, i === 0 ? C.paper : col, i === 0 ? C.ink : null, 2);
    }
  }
  function draw(ctx, w, h, C) {
    plot.axes(ctx);
    var b = plot.box, i, pts = [];
    ctx.save(); plot.clip(ctx);
    for (i = 0; i <= 240; i++) { var x = -8 + 12 * i / 240; pts.push([plot.x(x), plot.y(Math.min(f(x), 7))]); }
    D.path(ctx, pts, C.ink, 2.4);
    drawPath(ctx, path(false), C.terracota, 0, C); drawPath(ctx, path(true), C.cobalto, 0, C);
    ctx.restore();
    var pn = path(false), last = pn.ws[Math.min(1, pn.ws.length - 1)];
    if (last < -8) D.text(ctx, "← el primer paso lo lanza fuera de la gráfica (w = " + last.toFixed(1) + ")", b.x + 8, b.y + 18, { size: 11, color: C.terracotaInk, weight: 600 });
  }
  view.draw(draw);

  function update() {
    var a = path(false), c = path(true), g0 = g(S.w0);
    function at(p, k) { var v = p.ws[Math.min(k, p.ws.length - 1)]; return Math.abs(v) > 1e5 ? v.toExponential(1) : v.toFixed(2); }
    out.set("Gradiente inicial en w = " + S.w0.toFixed(1) + ": <b>" + g0.toFixed(1) + "</b> → paso sin recorte = η·g = <b>" + (S.lr * g0).toFixed(2) + "</b>; con clipnorm = " + S.c.toFixed(1) + " → paso = <b>" + (S.lr * Math.min(Math.abs(g0), S.c) * Math.sign(g0)).toFixed(2) + "</b> (nunca más de η·c = " + (S.lr * S.c).toFixed(2) + ")" +
      "<br>w tras 1 paso: sin recorte <b>" + at(a, 1) + "</b> · con clipnorm <b>" + at(c, 1) + "</b>" +
      "<br>w tras " + STEPS + " pasos: sin recorte <b>" + at(a, STEPS) + "</b> · con clipnorm <b>" + at(c, STEPS) + "</b> (el mínimo está en w ≈ " + WMIN.toFixed(2) + ", con pérdida " + f(WMIN).toFixed(3) + ")" +
      "<br>pérdida final: sin recorte <b class='bad'>" + f(M.clamp(a.ws[a.ws.length - 1], -1e3, 1e3)).toFixed(2) + "</b> · con clipnorm <b class='good'>" + f(c.ws[c.ws.length - 1]).toFixed(2) + "</b>");
    view.redraw();
  }
  update();
});
