/* Experimento: monitorización y reentrenamiento. Los hábitos cambian mes a mes y un modelo congelado empeora. */
Lab.register("curso1/c1m1-deriva", function (root, api) {
  var NM = 12, NC = 120, drift = 1.25, mes = 0, reent = [], ALERTA = 0.85;
  var r = api.rng(5), DIAS = [], FLIP = [], JIT = [], m, i;
  for (m = 0; m < NM; m++) {
    DIAS.push([]); FLIP.push([]); JIT.push([]);
    for (i = 0; i < NC; i++) { DIAS[m].push(r.range(0, 60)); FLIP[m].push(r.next() < 0.06); JIT[m].push(r.range(-0.17, 0.17)); }
  }
  var C0 = api.colors();

  var v1 = api.view(root, { aspect: 3.1, minH: 150, label: "Clientes del mes actual según los días sin entrar, con el umbral del modelo y el umbral real" });
  var p1 = api.plot(v1, { xr: [0, 60], yr: [0, 1], xticks: 6, yticks: 2, pad: { l: 62, r: 12, t: 22, b: 34 }, xlabel: "Días sin entrar", yfmt: function () { return ""; }, xfmt: function (v) { return Math.round(v); } });
  var v2 = api.view(root, { aspect: 2.9, minH: 170, label: "Acierto del modelo mes a mes con la línea de alerta" });
  var p2 = api.plot(v2, { xr: [0, 11], yr: [0.5, 1], xticks: 11, yticks: 5, pad: { l: 46, r: 12, t: 14, b: 34 }, xlabel: "Mes",
    xfmt: function (v) { return Math.round(v); }, yfmt: function (v) { return Math.round(v * 100) + "%"; } });
  api.legend(root, [[C0.terracota, "Canceló"], [C0.cobalto, "Se quedó"], [C0.ink, "Umbral del modelo"], [C0.oliva, "Umbral real (cambia)"]]);
  var ui = api.controls(root), out = api.readout(root);
  var sMes = ui.slider({ label: "Mes actual", min: 0, max: NM - 1, step: 1, value: 0, fmt: function (v) { return "mes " + v; }, onInput: function (v) { mes = v; reent = reent.filter(function (a) { return a <= mes; }); update(); } });
  ui.slider({ label: "Rapidez del cambio de hábitos", min: 0, max: 2.5, step: 0.25, value: drift, fmt: function (v) { return v.toFixed(2) + " días/mes"; }, onInput: function (v) { drift = v; update(); } });
  ui.button("Mes siguiente", function () { if (mes < NM - 1) { mes++; sMes.set(mes, true); update(); } }, "primary");
  ui.button("Reentrenar con los 2 últimos meses", function () { if (reent.indexOf(mes) < 0) reent.push(mes); update(); }, "warm");

  function trueT(m2) { return Math.max(4, 20 - drift * m2); }
  function label(m2, i2) { return (DIAS[m2][i2] > trueT(m2)) !== FLIP[m2][i2] ? 1 : 0; }
  /* Entrena: prueba los puntos intermedios entre clientes vecinos y se queda con el umbral que menos falla. */
  function fit(ms) {
    var pts = [];
    ms.forEach(function (m2) { for (var i2 = 0; i2 < NC; i2++) pts.push([DIAS[m2][i2], label(m2, i2)]); });
    pts.sort(function (a, b) { return a[0] - b[0]; });
    var best = null, k, j;
    for (k = 0; k < pts.length - 1; k++) {
      var t = (pts[k][0] + pts[k + 1][0]) / 2, err = 0;
      for (j = 0; j < pts.length; j++) if (((pts[j][0] > t) ? 1 : 0) !== pts[j][1]) err++;
      if (best === null || err < best.err) best = { t: t, err: err };
    }
    return best.t;
  }
  function modelT(k) {
    var last = -1, j;
    reent.forEach(function (a) { if (a < k && a > last) last = a; });
    return last < 0 ? fit([0]) : fit(last > 0 ? [last - 1, last] : [last]);
  }
  function acc(k) {
    var t = modelT(k), ok = 0, i2;
    for (i2 = 0; i2 < NC; i2++) if (((DIAS[k][i2] > t) ? 1 : 0) === label(k, i2)) ok++;
    return ok / NC;
  }
  function draw1(ctx, w, h, C) {
    var D = api.d, t = modelT(mes), tr = trueT(mes), b, i2;
    p1.axes(ctx); b = p1.box;
    D.text(ctx, "Canceló", b.x - 6, p1.y(0.75) + 4, { align: "right", size: 11, color: C.terracotaInk, weight: 600 });
    D.text(ctx, "Se quedó", b.x - 6, p1.y(0.25) + 4, { align: "right", size: 11, color: C.cobaltoInk, weight: 600 });
    ctx.save(); p1.clip(ctx);
    for (i2 = 0; i2 < NC; i2++) {
      var lab = label(mes, i2), pred = DIAS[mes][i2] > t ? 1 : 0, x = p1.x(DIAS[mes][i2]), y = p1.y((lab ? 0.75 : 0.25) + JIT[mes][i2]);
      D.circle(ctx, x, y, 3.6, lab ? C.terracota : C.cobalto, pred !== lab ? C.ink : null, 1.6);
    }
    ctx.restore();
    D.line(ctx, p1.x(tr), b.y, p1.x(tr), b.y + b.h, C.oliva, 2.5, [6, 4]);
    D.line(ctx, p1.x(t), b.y, p1.x(t), b.y + b.h, C.ink, 2);
    var left = t <= tr;
    D.text(ctx, "modelo " + t.toFixed(1), p1.x(t) + (left ? -5 : 5), b.y - 6, { align: left ? "right" : "left", size: 11, color: C.ink, weight: 600 });
    D.text(ctx, "real " + tr.toFixed(1), p1.x(tr) + (left ? 5 : -5), b.y - 6, { align: left ? "left" : "right", size: 11, color: C.olivaInk, weight: 600 });
  }
  function draw2(ctx, w, h, C) {
    var D = api.d, k, pts = [];
    p2.axes(ctx);
    D.line(ctx, p2.x(0), p2.y(ALERTA), p2.x(11), p2.y(ALERTA), C.terracota, 1.5, [5, 4]);
    D.text(ctx, "alerta 85 %", p2.x(11) - 4, p2.y(ALERTA) - 5, { align: "right", size: 10.5, color: C.terracotaInk, weight: 600 });
    reent.forEach(function (a) { if (a + 1 <= 11) D.line(ctx, p2.x(a + 0.5), p2.box.y, p2.x(a + 0.5), p2.box.y + p2.box.h, C.oliva, 1.5, [2, 3]); });
    for (k = 0; k <= mes; k++) pts.push([p2.x(k), p2.y(acc(k))]);
    D.path(ctx, pts, C.cobalto, 2);
    pts.forEach(function (p, k2) { D.circle(ctx, p[0], p[1], 4.5, acc(k2) < ALERTA ? C.terracota : C.cobalto, C.paper, 1.2); });
  }
  function update() {
    v1.redraw(); v2.redraw();
    var a = acc(mes), t = modelT(mes), n = reent.length;
    out.set("Mes <b>" + mes + "</b> · umbral real (el modelo no lo conoce): <b>" + trueT(mes).toFixed(1) + " días</b> · umbral del modelo: <b>" + t.toFixed(1) + " días</b><br>" +
      "Acierto este mes: <b>" + (a * 100).toFixed(1) + " %</b> (mes 0: " + (acc(0) * 100).toFixed(1) + " %) · reentrenamientos: <b>" + n + "</b>" +
      (n ? " (en el mes " + reent.slice().sort(function (x, y) { return x - y; }).join(", ") + ")" : "") + "<br>" +
      (a < ALERTA ? "<span class='bad'>ALERTA: el acierto ha caído por debajo del 85 %. Toca reentrenar.</span>" : "<span class='good'>El modelo sigue por encima del 85 %.</span>"));
  }
  v1.draw(draw1); v2.draw(draw2); update();
});
