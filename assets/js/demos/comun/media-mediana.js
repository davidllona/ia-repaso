/* Experimento: un valor extremo arrastra la media, pero casi no mueve la mediana. */
Lab.register("comun/media-mediana", function (root, api) {
  var M = api.math, base = [20, 22, 23, 25, 21, 24], extra = 26;
  var view = api.view(root, { aspect: 3.0, minH: 210, label: "Recta numérica con los precios y las posiciones de la media y la mediana" });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Precio del último dato (miles de €)", min: 20, max: 900, step: 1, value: extra,
    fmt: function (v) { return v + " mil €"; }, onInput: function (v) { extra = v; update(); } });
  ui.button("Poner un valor normal (26)", function () { s.set(26); });
  var s = { set: function (v) { extra = v; ui.el.querySelector("input").value = v; ui.el.querySelector("input").dispatchEvent(new Event("input")); } };

  function data() { return base.concat([extra]); }
  function draw(ctx, w, h, C) {
    var D = api.d, L = 24, R = 24, y0 = h - 74, vals = data(), mean = M.mean(vals), med = M.median(vals);
    function X(v) { return L + v / 950 * (w - L - R); }
    D.line(ctx, L, y0, w - R, y0, C.ink, 2);
    for (var t = 0; t <= 900; t += 100) {
      D.line(ctx, X(t), y0 - 5, X(t), y0 + 5, C.ink, 1.5);
      D.text(ctx, String(t), X(t), y0 + 21, { size: 11, align: "center", color: C.muted, mono: true });
    }
    D.text(ctx, "miles de €", w - R, y0 + 38, { size: 11, align: "right", color: C.ink2 });
    // Los puntos se apilan; el paso se adapta a la altura disponible (la parte superior se reserva para la etiqueta de la mediana)
    var step = M.clamp((y0 - 46) / 7, 9, 14), rad = step < 12 ? 4.5 : 6, stack = {};
    vals.forEach(function (v, i) {
      var key = Math.round(X(v) / 9), k = stack[key] = (stack[key] || 0) + 1;
      D.circle(ctx, X(v), y0 - 10 - (k - 1) * step, rad, i === vals.length - 1 ? C.terracota : C.cobalto, C.paper, 1.5);
    });
    // Mediana: línea continua cobalto que sube hasta arriba, con su etiqueta encima de todos los puntos
    D.line(ctx, X(med), 26, X(med), y0 + 8, C.cobalto, 3);
    D.text(ctx, "mediana " + med.toFixed(1), X(med), 16, { size: 12, align: X(med) > w - 130 ? "right" : "center", color: C.cobaltoInk, weight: 600 });
    // Media: línea de puntos terracota que baja por debajo del eje, con su etiqueta abajo
    D.line(ctx, X(mean), y0 - 6, X(mean), y0 + 46, C.terracota, 3, [6, 3]);
    D.text(ctx, "media " + mean.toFixed(1), X(mean), y0 + 62, { size: 12, align: X(mean) > w - 120 ? "right" : "center", color: C.terracotaInk, weight: 600 });
  }
  function update() {
    var vals = data(), mean = M.mean(vals), med = M.median(vals);
    view.redraw();
    out.set("datos = [" + vals.join(", ") + "]<br>media = <b>" + mean.toFixed(1) + "</b> · mediana = <b>" + med.toFixed(1) + "</b>" +
      (mean - med > 12 ? "<br><span class='bad'>La media ya no representa a un dato típico: está arrastrada por el valor extremo.</span>" : "<br><span class='good'>Con datos parecidos, media y mediana casi coinciden.</span>"));
  }
  view.draw(draw); update();
});
