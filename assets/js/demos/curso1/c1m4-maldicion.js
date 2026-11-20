/* Experimento: la maldición de la dimensionalidad. Con muchas columnas, todos los puntos acaban casi igual de lejos. */
Lab.register("curso1/c1m4-maldicion", function (root, api) {
  var DIMS = [1, 2, 3, 5, 10, 20, 50, 100, 300, 1000];
  var N = 300, BINS = 24;
  var idx = 1, seed = 7, dist = [], dmin = 0, dmax = 1;

  var view = api.view(root, { aspect: 1.6, minH: 240, label: "Histograma de las distancias desde un usuario a otros 299, divididas entre la del más lejano. Con muchas columnas, todas se amontonan cerca de la del más lejano." });
  var plot = api.plot(view, { xr: [0, 1], yr: [0, 1], xticks: 4, yticks: 4, xlabel: "distancia ÷ la del más lejano", yfmt: function () { return ""; }, pad: { l: 14, r: 14, t: 40, b: 40 } });
  var C0 = api.colors();
  api.legend(root, [[C0.cobalto, "el vecino más cercano"], [C0.terracota, "el más lejano"], [C0.oliva, "cuántos usuarios hay a cada distancia"]]);
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Columnas (dimensiones)", min: 0, max: DIMS.length - 1, step: 1, value: idx,
    fmt: function (v) { return String(DIMS[v]); }, onInput: function (v) { idx = v; compute(); update(); } });
  ui.button("Otra muestra al azar", function () { seed += 1; compute(); update(); });

  function compute() {
    var d = DIMS[idx], r = api.rng(seed * 1000 + d), p0 = [], i, k;
    for (k = 0; k < d; k++) p0.push(r.next());
    dist = [];
    for (i = 1; i < N; i++) {
      var s = 0;
      for (k = 0; k < d; k++) { var u = r.next() - p0[k]; s += u * u; }
      dist.push(Math.sqrt(s));
    }
    dmin = Math.min.apply(null, dist); dmax = Math.max.apply(null, dist);
  }

  function draw(ctx, w, h, C) {
    var D = api.d, b = plot.box, cnt = new Array(BINS).fill(0), i;
    plot.axes(ctx);
    dist.forEach(function (x) { var j = Math.min(BINS - 1, Math.floor(x / dmax * BINS)); cnt[j]++; });
    var top = Math.max.apply(null, cnt);
    for (i = 0; i < BINS; i++) {
      if (!cnt[i]) continue;
      var x0 = plot.x(i / BINS), x1 = plot.x((i + 1) / BINS), hh = cnt[i] / top * (b.h - 6);
      D.rect(ctx, x0 + 1, b.y + b.h - hh, x1 - x0 - 2, hh, C.oliva, null);
    }
    var xm = plot.x(dmin / dmax), xM = plot.x(1);
    D.line(ctx, xm, b.y - 4, xm, b.y + b.h, C.cobalto, 3);
    D.line(ctx, xM, b.y - 4, xM, b.y + b.h, C.terracota, 3);
    // rótulos en dos filas distintas para que no se pisen
    var lm = "más cercano", lM = "más lejano";
    D.text(ctx, lm, xm < b.x + b.w * 0.55 ? xm + 5 : xm - 5, b.y - 22, { size: 12, weight: 600, color: C.cobaltoInk, align: xm < b.x + b.w * 0.55 ? "left" : "right" });
    D.text(ctx, lM, xM - 5, b.y - 8, { size: 12, weight: 600, color: C.terracotaInk, align: "right" });
  }

  function update() {
    view.redraw();
    var extra = (dmax - dmin) / dmin * 100;
    out.set("<b>" + DIMS[idx] + "</b> columna" + (DIMS[idx] > 1 ? "s" : "") + " · más cercano a <b>" + dmin.toFixed(2) + "</b> · más lejano a <b>" + dmax.toFixed(2) + "</b><br>" +
      "El más lejano está un <b>" + (extra >= 1000 ? Math.round(extra).toLocaleString("es-ES") : extra.toFixed(0)) + " %</b> más lejos que el más cercano. " +
      (extra < 25 ? "<span class='bad'>Casi todos están igual de lejos: «parecerse» ya no significa nada.</span>" : "<span class='good'>Hay vecinos de verdad: cerca y lejos se distinguen.</span>"));
  }

  compute(); view.draw(draw); update();
});
