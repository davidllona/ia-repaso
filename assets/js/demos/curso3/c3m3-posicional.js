/* Experimento: la codificación posicional sinusoidal como un conjunto de RELOJES. Cada pareja (sin, cos) es la manecilla de un reloj con su velocidad
   ω_i = 1 / 10000^(2i/d). Debajo, el producto escalar PE(p)·PE(p+k) en función de la distancia k: es la misma curva para cualquier p. */
Lab.register("curso3/c3m3-posicional", function (root, api) {
  var D = api.d, NP = 64;
  var S = { d: 8, p: 12, p2: 40 };
  function n(v, k) { return v.toFixed(k === undefined ? 2 : k).replace(".", ",").replace("-", "−"); }
  function om(i) { return 1 / Math.pow(10000, 2 * i / S.d); }
  function pe(p) { var o = [], i; for (i = 0; i < S.d / 2; i++) { o.push(Math.sin(p * om(i))); o.push(Math.cos(p * om(i))); } return o; }
  function dot(a, b) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i] * b[i]; return s; }
  var view = api.view(root, { aspect: 3.0, minH: 120, maxH: 170, label: "Relojes de la codificación posicional: cada pareja seno-coseno es una manecilla que gira a su velocidad" });
  var view2 = api.view(root, { aspect: 2.4, minH: 190, maxH: 250, label: "Producto escalar entre la posición p y la posición p+k en función de k, para dos valores de p" });
  var plot = api.plot(view2, { xr: [0, 40], yr: [-1, 1], xticks: 8, yticks: 4, xlabel: "distancia k entre las dos posiciones", ylabel: "PE(p)·PE(p+k) / (d/2)", pad: { l: 48, r: 10, t: 12, b: 38 }, xfmt: function (v) { return Math.round(v); }, yfmt: function (v) { return n(v, 1); } });
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.7rem, 2.6vw, .82rem)";
  ui.segmented({ label: "Tamaño d_model", value: 8, options: [[4, "4"], [8, "8"], [16, "16"]], onChange: function (v) { S.d = v; update(); } });
  ui.slider({ label: "Posición p (azul)", min: 0, max: NP - 1, step: 1, value: S.p, onInput: function (v) { S.p = v; update(); } });
  ui.slider({ label: "Otra posición p' (naranja)", min: 0, max: NP - 1, step: 1, value: S.p2, onInput: function (v) { S.p2 = v; update(); } });
  api.legend(root, [[api.colors().cobalto, "p"], [api.colors().terracota, "p'"]]);

  view.draw(function (ctx, w, h, C) {
    var m = S.d / 2, i, cw = w / m, r = Math.min(cw / 2 - 6, h / 2 - 18, 36);
    [[S.p, C.cobalto, 0], [S.p2, C.terracota, 1]].forEach(function (cfg) {
      for (i = 0; i < m; i++) {
        var cx = cw * (i + 0.5), cy = h / 2 - 4, a = cfg[0] * om(i);
        if (!cfg[2]) { D.circle(ctx, cx, cy, r, C.surface, C.ink2, 1.3); for (var t = 0; t < 12; t++) { var tt = t * Math.PI / 6; D.line(ctx, cx + Math.sin(tt) * r * 0.86, cy - Math.cos(tt) * r * 0.86, cx + Math.sin(tt) * r, cy - Math.cos(tt) * r, C.line, 1); } }
        D.arrow(ctx, cx, cy, cx + Math.sin(a) * r * (cfg[2] ? 0.7 : 0.92), cy - Math.cos(a) * r * (cfg[2] ? 0.7 : 0.92), cfg[1], cfg[2] ? 2 : 2.4);
        if (!cfg[2]) D.text(ctx, "ω=" + (om(i) >= 0.01 ? n(om(i), 2) : om(i).toExponential(0).replace("e-", "e−")), cx, cy + r + 14, { size: 10, align: "center", color: C.muted, mono: true });
      }
    });
    D.text(ctx, "pareja i = 0 (rápida) → pareja " + (m - 1) + " (lenta)", w / 2, 11, { size: 10.5, align: "center", color: C.ink2 });
  });
  view2.draw(function (ctx, w, h, C) {
    plot.axes(ctx); var k, m = S.d / 2;
    [[S.p, C.cobalto, 4.5, []], [S.p2, C.terracota, 1.8, [5, 4]]].forEach(function (cfg) {
      var pts = []; for (k = 0; k <= 40; k++) pts.push([plot.x(k), plot.y(dot(pe(cfg[0]), pe(cfg[0] + k)) / m)]);
      ctx.save(); plot.clip(ctx); D.path(ctx, pts, cfg[1], cfg[2], cfg[3]); ctx.restore();
    });
  });
  function update() {
    view.redraw(); view2.redraw();
    var m = S.d / 2, v = pe(S.p), a = dot(pe(S.p), pe(S.p + 3)), b = dot(pe(S.p2), pe(S.p2 + 3));
    out.set("PE(" + S.p + ") = [" + v.map(function (x) { return n(x, 2); }).join("; ") + "] (pares sen, cos)<br>" +
      "La pareja más rápida da una vuelta cada 2π ≈ <b>6,28</b> posiciones; la más lenta, cada 2π·10000<sup>" + n((S.d - 2) / S.d, 2) + "</sup> ≈ <b>" + Math.round(2 * Math.PI * Math.pow(10000, (S.d - 2) / S.d)).toLocaleString("es-ES") + "</b>.<br>" +
      "PE(p)·PE(p+3) = <b>" + n(a, 3) + "</b> con p = " + S.p + " y <b>" + n(b, 3) + "</b> con p' = " + S.p2 + (Math.abs(a - b) < 1e-9 ? " → <span class='good'>idénticos: solo importa la distancia.</span>" : ""));
  }
  update();
});
