/* Experimento: detección de anomalías = «lo normal» medido en desviaciones (espectadores de una sala de cine; capítulos de una cuenta). Recalcula media, desviación y z en vivo. */
Lab.register("curso1/c1m1-anomalias", function (root, api) {
  var M = api.math;
  var CASOS = {
    cine: { nombre: "Sala de cine (espectadores)", unidad: "espectadores", hist: [80, 82, 81, 83, 80, 82, 81, 79, 82, 81], min: 70, max: 160, step: 1, ini: 83, lbl: "Espectadores de hoy" },
    cuenta: { nombre: "Cuenta (capítulos al mes)", unidad: "capítulos", hist: [15, 30, 45, 22, 38, 27, 41, 33, 19, 36], min: 0, max: 5000, step: 10, ini: 40, lbl: "Capítulos de este mes" }
  };
  var caso = "cine", k = 3, nuevo = CASOS.cine.ini;

  var view = api.view(root, { aspect: 1.9, minH: 250, label: "Serie de valores normales con una banda de normalidad y un valor nuevo que puede salirse de ella" });
  var plot = api.plot(view, { xr: [0, 12], yr: [0, 1], xticks: 6, yticks: 5, pad: { l: 58, r: 14, t: 14, b: 36 }, xlabel: "Orden de la observación",
    xfmt: function (v) { return Math.round(v); }, yfmt: function (v) { return Math.round(v).toLocaleString("es-ES"); } });
  var ui = api.controls(root), out = api.readout(root);
  api.legend(root, [[api.colors().oliva, "Valor normal"], [api.colors().terracota, "Se sale de la banda"], [api.colors().cobaltoWash, "Banda de lo normal"]]);

  ui.segmented({ label: "Qué vigilamos", options: [["cine", "Sala de cine"], ["cuenta", "Cuenta de streaming"]], value: caso, onChange: function (v) {
    caso = v; nuevo = CASOS[v].ini; sl.input.min = CASOS[v].min; sl.input.max = CASOS[v].max; sl.input.step = CASOS[v].step; sl.set(nuevo, true); update(); } });
  var sl = ui.slider({ label: "Valor nuevo", min: CASOS.cine.min, max: CASOS.cine.max, step: CASOS.cine.step, value: nuevo,
    fmt: function (v) { return fmtU(v); }, onInput: function (v) { nuevo = v; update(); } });
  ui.slider({ label: "Umbral k (en desviaciones)", min: 1, max: 6, step: 0.5, value: k, fmt: function (v) { return v.toFixed(1) + " σ"; }, onInput: function (v) { k = v; update(); } });
  ui.button("Poner un valor normal", function () { var c = CASOS[caso]; nuevo = c.ini; sl.set(nuevo); });

  function fmtU(v) { var c = CASOS[caso]; return Math.round(v).toLocaleString("es-ES") + " " + c.unidad; }
  function stats() {
    var h = CASOS[caso].hist, m = M.mean(h), s = M.std(h);
    return { m: m, s: s, z: (nuevo - m) / s };
  }
  /* Rango con marcas «redondas»: 5 intervalos iguales con un paso de 1, 2, 5, 10, 20, 50… */
  function range(st) {
    var lo = Math.min(st.m - 5 * st.s, nuevo), hi = Math.max(st.m + 5 * st.s, nuevo), pasos = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000], i, lo2, step;
    for (i = 0; i < pasos.length; i++) {
      step = pasos[i]; lo2 = Math.floor(lo / step) * step;
      if (lo2 + 5 * step >= hi) break;
    }
    return [lo2, lo2 + 5 * step];
  }
  function draw(ctx, w, h, C) {
    var D = api.d, st = stats(), c = CASOS[caso], b;
    plot.yr = range(st);
    plot.axes(ctx);
    b = plot.box;
    D.text(ctx, caso === "cuenta" ? "Capítulos en el mes" : "Espectadores en la sesión", 13, b.y + b.h / 2, { align: "center", size: 12, color: C.ink2, weight: 500, rotate: -Math.PI / 2 });
    ctx.save();
    plot.clip(ctx);
    ctx.save(); ctx.globalAlpha = 0.55;
    D.rect(ctx, b.x, plot.y(st.m + k * st.s), b.w, plot.y(st.m - k * st.s) - plot.y(st.m + k * st.s), C.cobaltoWash);
    ctx.restore();
    D.line(ctx, b.x, plot.y(st.m), b.x + b.w, plot.y(st.m), C.cobaltoInk, 1.5, [5, 4]);
    c.hist.forEach(function (v, i) {
      var bad = Math.abs((v - st.m) / st.s) > k;
      D.circle(ctx, plot.x(i + 1), plot.y(v), 5, bad ? C.terracota : C.oliva, C.paper, 1.2);
    });
    var anom = Math.abs(st.z) > k, px = plot.x(11), py = plot.y(nuevo);
    D.line(ctx, plot.x(10), plot.y(c.hist[9]), px, py, anom ? C.terracota : C.oliva, 1.5, [3, 3]);
    ctx.save(); ctx.translate(px, py); ctx.rotate(Math.PI / 4);
    D.rect(ctx, -7, -7, 14, 14, anom ? C.terracota : C.oliva, C.ink, 2);
    ctx.restore();
    ctx.restore();
  }
  function update() {
    var st = stats(), anom = Math.abs(st.z) > k, flagged = 0, c = CASOS[caso];
    c.hist.forEach(function (v) { if (Math.abs((v - st.m) / st.s) > k) flagged++; });
    view.redraw();
    out.set("Historial normal: media <b>" + st.m.toFixed(1) + " " + c.unidad + "</b> · desviación <b>" + st.s.toFixed(2) + " " + c.unidad + "</b><br>" +
      "z = (" + fmtU(nuevo) + " − " + st.m.toFixed(1) + ") / " + st.s.toFixed(2) + " = <b>" + st.z.toFixed(2) + "</b> · umbral ±<b>" + k.toFixed(1) + "</b><br>" +
      (anom ? "<span class='bad'>ANOMALÍA: está a " + Math.abs(st.z).toFixed(1) + " desviaciones de lo normal.</span>" : "<span class='good'>Normal: dentro de la banda.</span>") + "<br>" +
      "Falsas alarmas: con este umbral, <b>" + flagged + " de 10</b> valores normales del historial saltarían como anomalía" + (flagged ? " <span class='bad'>(umbral demasiado estricto)</span>" : "") + ".");
  }
  view.draw(draw); update();
});
