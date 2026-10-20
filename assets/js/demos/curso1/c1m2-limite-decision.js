/* Experimento: con dos variables, el límite de decisión de la regresión logística es una recta. */
Lab.register("curso1/c1m2-limite-decision", function (root, api) {
  var M = api.math, r = api.rng(29), N = 120, pts = [], i;
  for (i = 0; i < N; i++) {
    var d = r.range(0, 45), hh = r.range(0, 40), y = r.next() < M.sigmoid(-4 + 0.2 * d - 0.1 * hh) ? 1 : 0;
    pts.push({ d: d, h: hh, y: y });
  }
  var th = [-1, 0.05, 0.05], thr = 0.5, cust = { d: 30, h: 10 };
  function rgba(hex, a) { var s = hex.replace("#", ""); if (s.length === 3) s = s.split("").map(function (c) { return c + c; }).join(""); var n = parseInt(s, 16); return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")"; }

  var view = api.view(root, { aspect: 1.35, minH: 300, drag: true, label: "Clientes según días sin entrar y horas de uso, con el mapa de probabilidad y la recta que separa las dos decisiones" });
  var plot = api.plot(view, { xr: [0, 45], yr: [0, 40], xticks: 5, yticks: 4, xlabel: "Días sin entrar", ylabel: "Horas de uso al mes", pad: { l: 48, r: 12, t: 12, b: 40 } });
  api.legend(root, [[api.colors().cobalto, "se quedó"], [api.colors().terracota, "canceló"], [api.colors().marker, "cliente nuevo (haz clic para moverlo)"]]);
  var ui = api.controls(root), out = api.readout(root);
  var sl = [
    ui.slider({ label: "θ₀ (intercepto)", min: -10, max: 4, step: 0.05, value: th[0], fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { th[0] = v; update(); } }),
    ui.slider({ label: "θ₁ (peso de los días)", min: -0.5, max: 0.6, step: 0.01, value: th[1], fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { th[1] = v; update(); } }),
    ui.slider({ label: "θ₂ (peso de las horas)", min: -0.6, max: 0.5, step: 0.01, value: th[2], fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { th[2] = v; update(); } })
  ];
  ui.slider({ label: "Umbral de decisión", min: 0.05, max: 0.95, step: 0.01, value: thr, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { thr = v; update(); } });
  ui.button("Ajustar con regresión logística", function () { var f = newton(); th = [M.clamp(f[0], -10, 4), M.clamp(f[1], -0.5, 0.6), M.clamp(f[2], -0.6, 0.5)]; th.forEach(function (v, k) { sl[k].set(v, true); }); update(); }, "primary");

  function newton() {
    var t = [0, 0, 0], it, k, a, c;
    for (it = 0; it < 30; it++) {
      var g = [0, 0, 0], H = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
      for (k = 0; k < N; k++) {
        var f = [1, pts[k].d / 10, pts[k].h / 10], p = M.sigmoid(t[0] + t[1] * f[1] + t[2] * f[2]), w = p * (1 - p), e = p - pts[k].y;
        for (a = 0; a < 3; a++) { g[a] += e * f[a]; for (c = 0; c < 3; c++) H[a][c] += w * f[a] * f[c]; }
      }
      var dl = M.solve(H, g); t = [t[0] - dl[0], t[1] - dl[1], t[2] - dl[2]];
    }
    return [t[0], t[1] / 10, t[2] / 10];     // se ajusta con variables /10 (mejor condicionado) y se deshace
  }
  function z(d, h) { return th[0] + th[1] * d + th[2] * h; }
  function draw(ctx, w, h, C) {
    var D = api.d, b = plot.box, cw = 7, x, y, lg = Math.log(thr / (1 - thr));
    plot.axes(ctx); ctx.save(); plot.clip(ctx);
    for (x = Math.floor(b.x); x < b.x + b.w; x += cw) for (y = Math.floor(b.y); y < b.y + b.h; y += cw) {
      var p = M.sigmoid(z(plot.ix(x + cw / 2), plot.iy(y + cw / 2)));
      ctx.fillStyle = p >= thr ? rgba(C.terracota, 0.10 + 0.45 * (p - thr) / (1 - thr + 1e-9)) : rgba(C.cobalto, 0.10 + 0.45 * (thr - p) / (thr + 1e-9));
      ctx.fillRect(x, y, cw, cw);
    }
    // frontera: θ0 + θ1·d + θ2·h = logit(umbral)
    if (Math.abs(th[2]) > 1e-4) {
      var h0 = (lg - th[0]) / th[2], h1 = (lg - th[0] - th[1] * 45) / th[2];
      D.line(ctx, plot.x(0), plot.y(h0), plot.x(45), plot.y(h1), C.ink, 3);
    } else if (Math.abs(th[1]) > 1e-4) { var dx = (lg - th[0]) / th[1]; D.line(ctx, plot.x(dx), b.y, plot.x(dx), b.y + b.h, C.ink, 3); }
    pts.forEach(function (p) {
      var bad = ((z(p.d, p.h) >= lg) ? 1 : 0) !== p.y;
      D.circle(ctx, plot.x(p.d), plot.y(p.h), 4.8, p.y ? C.terracota : C.cobalto, C.paper, 1.3);
      if (bad) D.circle(ctx, plot.x(p.d), plot.y(p.h), 8, null, C.ink, 1.6);
    });
    D.circle(ctx, plot.x(cust.d), plot.y(cust.h), 8, C.marker, C.ink, 2.5);
    ctx.restore();
  }
  function update() {
    view.redraw();
    var lg = Math.log(thr / (1 - thr)), ok = 0, ll = 0;
    pts.forEach(function (p) { var q = M.clamp(M.sigmoid(z(p.d, p.h)), 1e-9, 1 - 1e-9); if ((q >= thr ? 1 : 0) === p.y) ok++; ll -= p.y ? Math.log(q) : Math.log(1 - q); });
    var zc = z(cust.d, cust.h), pc = M.sigmoid(zc);
    out.set("Cliente nuevo: <b>" + cust.d.toFixed(0) + " días</b>, <b>" + cust.h.toFixed(0) + " h/mes</b> → z = <b>" + zc.toFixed(2) + "</b> → p̂(cancela) = <b>" + pc.toFixed(3) + "</b> → <b>" + (pc >= thr ? "cancela" : "se queda") + "</b><br>" +
      "Frontera: " + th[0].toFixed(2) + " + " + th[1].toFixed(2) + "·días + " + th[2].toFixed(2) + "·horas = <b>" + lg.toFixed(2) + "</b> (es una recta)<br>" +
      "Aciertos: <b>" + ok + " / " + N + "</b> (" + (100 * ok / N).toFixed(0) + " %) · log-loss = <b>" + (ll / N).toFixed(3) + "</b> · los círculos con aro son fallos");
  }
  function move(px, py) { if (!plot.inside(px, py)) return; cust.d = M.clamp(plot.ix(px), 0, 45); cust.h = M.clamp(plot.iy(py), 0, 40); update(); }
  view.pointer({ down: move, drag: move });
  view.draw(draw); update();
});
