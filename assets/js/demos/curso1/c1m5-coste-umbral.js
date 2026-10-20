/* Experimento: cada umbral tiene un coste en euros; el mejor umbral depende de lo que cuesta cada tipo de error. */
Lab.register("curso1/c1m5-coste-umbral", function (root, api) {
  var M = api.math, D = api.d, i;
  var N = 2000, r = api.rng(31), prob = [], yr = [];
  for (i = 0; i < N; i++) { var p = M.sigmoid(r.normal(-1.6, 1.3)); prob.push(p); yr.push(r.next() < p ? 1 : 0); }
  var nPos = yr.reduce(function (a, b) { return a + b; }, 0);
  var st = { cfp: 10, cfn: 40, thr: 0.5 };
  var curve = [], best = null;

  function at(t) {
    var tp = 0, fp = 0, fn = 0, tn = 0;
    for (var k = 0; k < N; k++) {
      var pred = prob[k] >= t;
      if (yr[k]) { if (pred) tp++; else fn++; } else { if (pred) fp++; else tn++; }
    }
    return { t: t, tp: tp, fp: fp, fn: fn, tn: tn, cfp: st.cfp * fp, cfn: st.cfn * fn, total: st.cfp * fp + st.cfn * fn };
  }
  function recompute() {
    curve = []; best = null;
    for (var t = 0; t <= 100; t++) {
      var c = at(t / 100); curve.push(c);
      if (!best || c.total < best.total) best = c;
    }
  }

  var view = api.view(root, { aspect: 1.75, minH: 270, label: "Coste total en euros según el umbral, con la parte debida a descuentos innecesarios y la debida a bajas no detectadas" });
  var plot = api.plot(view, { xr: [0, 1], yr: [0, 1], xticks: 5, yticks: 4, xlabel: "umbral de decisión", ylabel: "coste (€)", pad: { l: 56, r: 12, t: 20, b: 38 },
    yfmt: function (v) { return v >= 1000 ? (v / 1000).toFixed(v % 1000 ? 1 : 0) + "k" : Math.round(v); } });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Coste de un descuento a quien no se iba (FP)", min: 1, max: 50, step: 1, value: st.cfp, fmt: function (v) { return v + " €"; }, onInput: function (v) { st.cfp = v; recompute(); update(); } });
  ui.slider({ label: "Coste de una baja no detectada (FN)", min: 1, max: 200, step: 1, value: st.cfn, fmt: function (v) { return v + " €"; }, onInput: function (v) { st.cfn = v; recompute(); update(); } });
  var sT = ui.slider({ label: "Umbral que usas", min: 0.02, max: 0.98, step: 0.01, value: st.thr, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { st.thr = v; update(); } });
  var C0 = api.colors();
  api.legend(root, [[C0.cobalto, "coste de descuentos de más (FP)"], [C0.terracota, "coste de bajas no detectadas (FN)"], [C0.ink, "coste total"]]);

  function draw(ctx, w, h, C) {
    var ymax = Math.max.apply(null, curve.map(function (c) { return Math.max(c.total, c.cfp, c.cfn); }));
    var nice = Math.pow(10, Math.floor(Math.log10(ymax))), top = Math.ceil(ymax / nice * 2) / 2 * nice;
    plot.yr = [0, top]; plot.axes(ctx);
    ctx.save(); plot.clip(ctx);
    D.path(ctx, curve.map(function (c) { return [plot.x(c.t), plot.y(c.cfp)]; }), C.cobalto, 2.2);
    D.path(ctx, curve.map(function (c) { return [plot.x(c.t), plot.y(c.cfn)]; }), C.terracota, 2.2);
    D.path(ctx, curve.map(function (c) { return [plot.x(c.t), plot.y(c.total)]; }), C.ink, 3);
    ctx.restore();
    var th = st.cfp / (st.cfp + st.cfn);
    D.line(ctx, plot.x(th), plot.box.y, plot.x(th), plot.box.y + plot.box.h, C.oliva, 1.8, [2, 4]);
    var cur = at(Math.round(st.thr * 100) / 100), bx = plot.x(cur.t);
    D.line(ctx, bx, plot.box.y, bx, plot.box.y + plot.box.h, C.terracota, 1.5, [5, 4]);
    D.circle(ctx, bx, plot.y(cur.total), 6.5, C.terracota, C.ink, 2);
    D.circle(ctx, plot.x(best.t), plot.y(best.total), 7, C.oliva, C.ink, 2);
    var bx2 = plot.box.x + plot.box.w - 8, by2 = plot.box.y + plot.box.h - 34;
    if (w >= 520) {
    D.circle(ctx, bx2 - 168, by2 - 4, 4.5, C.oliva, C.ink, 1.5);
    D.text(ctx, "mínimo: " + Math.round(best.total).toLocaleString("es-ES") + " € (umbral " + best.t.toFixed(2) + ")", bx2, by2, { size: 11, weight: 600, color: C.olivaInk, align: "right" });
    D.circle(ctx, bx2 - 168, by2 + 14, 4.5, C.terracota, C.ink, 1.5);
    D.text(ctx, "tu umbral " + cur.t.toFixed(2) + ": " + cur.total.toLocaleString("es-ES") + " €", bx2, by2 + 18, { size: 11, weight: 600, color: C.terracotaInk, align: "right" });
    }
    var tl = "teoría p* = " + th.toFixed(2);
    D.text(ctx, tl, plot.x(th) + (th < 0.6 ? 6 : -6), plot.box.y + plot.box.h - 8, { size: 10.5, color: C.olivaInk, align: th < 0.6 ? "left" : "right", weight: 600 });
  }

  function update() {
    view.redraw();
    var cur = at(Math.round(st.thr * 100) / 100), th = st.cfp / (st.cfp + st.cfn), ref = at(0.5);
    out.set("umbral <b>" + cur.t.toFixed(2) + "</b>: FP=<b>" + cur.fp + "</b> · FN=<b>" + cur.fn + "</b> → coste = " + st.cfp + "·" + cur.fp + " + " + st.cfn + "·" + cur.fn + " = <b>" + cur.total.toLocaleString("es-ES") + " €</b><br>" +
      "umbral con menor coste = <b>" + best.t.toFixed(2) + "</b> (" + Math.round(best.total).toLocaleString("es-ES") + " €) · con el umbral 0,50 pagarías <b>" + ref.total.toLocaleString("es-ES") + " €</b><br>" +
      "si las probabilidades están bien calibradas: p* = C_FP/(C_FP+C_FN) = " + st.cfp + "/" + (st.cfp + st.cfn) + " = <b>" + th.toFixed(3) + "</b>");
  }
  recompute(); view.draw(draw); update();
});
