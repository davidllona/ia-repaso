/* Experimento: hacer UNA pregunta a un nodo (variable + umbral) y medir impureza antes/después y ganancia. */
Lab.register("curso1/c1m3-division-arbol", function (root, api) {
  var D = api.d, M = api.math;
  var NAMES = ["días sin entrar", "horas de uso al mes"], RANGE = [[0, 60], [0, 40]];
  var ds = "tabla", feat = 1, crit = "gini", thr = 11, pts = [];

  function makePts(kind) {
    if (kind === "tabla") {
      var d = [3, 6, 9, 14, 17, 21, 26, 33, 41, 52], h = [30, 25, 8, 20, 5, 12, 6, 4, 10, 2], y = [0, 0, 1, 0, 1, 0, 1, 1, 1, 1];
      return d.map(function (v, i) { return [v, h[i], y[i]]; });
    }
    var r = api.rng(11), out = [], i;
    for (i = 0; i < 30; i++) out.push([M.clamp(r.normal(14, 9), 1, 59), M.clamp(r.normal(24, 7), 1, 39), 0]);
    for (i = 0; i < 30; i++) out.push([M.clamp(r.normal(37, 13), 1, 59), M.clamp(r.normal(12, 7), 1, 39), 1]);
    return out.map(function (p) { return [Math.round(p[0] * 2) / 2, Math.round(p[1] * 2) / 2, p[2]]; });
  }
  function imp(c0, c1) {
    var n = c0 + c1; if (!n) return 0;
    var p = c1 / n, q = 1 - p;
    if (crit === "gini") return 1 - p * p - q * q;
    return (p <= 0 || q <= 0) ? 0 : -p * Math.log2(p) - q * Math.log2(q);
  }
  function evalSplit(fi, t) {
    var l0 = 0, l1 = 0, r0 = 0, r1 = 0;
    pts.forEach(function (p) { if (p[fi] <= t) { if (p[2]) l1++; else l0++; } else { if (p[2]) r1++; else r0++; } });
    var n = pts.length, ip = imp(l0 + r0, l1 + r1), il = imp(l0, l1), ir = imp(r0, r1);
    var w = ((l0 + l1) * il + (r0 + r1) * ir) / n;
    return { l0: l0, l1: l1, r0: r0, r1: r1, ip: ip, il: il, ir: ir, w: w, gain: ip - w };
  }
  function best(fi) {
    var vals = pts.map(function (p) { return p[fi]; }).sort(function (a, b) { return a - b; }), b = null, i;
    for (i = 0; i < vals.length - 1; i++) {
      if (vals[i] === vals[i + 1]) continue;
      var t = (vals[i] + vals[i + 1]) / 2, e = evalSplit(fi, t);
      if (!b || e.gain > b.gain + 1e-12) b = { t: t, gain: e.gain, fi: fi };
    }
    return b;
  }

  var view = api.view(root, { aspect: 1.55, minH: 270, label: "Clientes según días sin entrar y horas de uso, con la línea de la pregunta" });
  var plot = api.plot(view, { xr: RANGE[0], yr: RANGE[1], xticks: 6, yticks: 4, xlabel: "días sin entrar", ylabel: "horas de uso al mes", pad: { l: 50, r: 12, t: 12, b: 38 },
    xfmt: function (v) { return Math.round(v); }, yfmt: function (v) { return Math.round(v); } });
  var view2 = api.view(root, { aspect: 3.4, minH: 120, maxH: 190, label: "Ganancia de información para cada umbral posible" });
  var plot2 = api.plot(view2, { xr: RANGE[1], yr: [0, 0.5], xticks: 4, yticks: 2, xlabel: "umbral de la pregunta (variable elegida)", ylabel: "ganancia",
    pad: { l: 50, r: 12, t: 8, b: 34 }, xfmt: function (v) { return Math.round(v); }, yfmt: function (v) { return v.toFixed(2); } });
  var ui = api.controls(root), out = api.readout(root), sl;

  ui.segmented({ label: "Datos", options: [["tabla", "Los 10 clientes de la tabla"], ["grande", "60 clientes con ruido"]], value: ds, onChange: function (v) { ds = v; pts = makePts(ds); goBest(); } });
  ui.segmented({ label: "Variable de la pregunta", options: [[0, "días sin entrar"], [1, "horas de uso"]], value: feat, onChange: function (v) { setFeat(v); update(); } });
  ui.segmented({ label: "Medida de impureza", options: [["gini", "Gini"], ["ent", "Entropía"]], value: crit, onChange: function (v) { crit = v; update(); } });
  sl = ui.slider({ label: "Umbral («≤»)", min: 0, max: 40, step: 0.25, value: thr, fmt: function (v) { return String(+v.toFixed(2)); }, onInput: function (v) { thr = v; update(); } });
  ui.button("Mejor umbral con esta variable", function () { var b = best(feat); thr = b.t; sl.set(thr, true); update(); }, "primary");
  ui.button("Mejor pregunta de las dos variables", function () { goBest(); }, "warm");

  function setFeat(f) {
    feat = f; sl.input.min = RANGE[f][0]; sl.input.max = RANGE[f][1];
    thr = M.clamp(thr, RANGE[f][0], RANGE[f][1]); sl.set(thr, true);
    plot2.xr = RANGE[f];
  }
  function goBest() {
    var b0 = best(0), b1 = best(1), b = b1.gain > b0.gain + 1e-12 ? b1 : b0;
    setFeat(b.fi); thr = b.t; sl.set(thr, true); update();
  }

  function draw(ctx, w, h, C) {
    plot.axes(ctx);
    var b = plot.box, e = evalSplit(feat, thr), maj = function (c0, c1) { return c1 > c0 ? C.terracotaWash : (c0 > c1 ? C.cobaltoWash : C.paper2); };
    ctx.save(); ctx.globalAlpha = 0.85;
    if (feat === 0) {
      D.rect(ctx, b.x, b.y, plot.x(thr) - b.x, b.h, maj(e.l0, e.l1));
      D.rect(ctx, plot.x(thr), b.y, b.x + b.w - plot.x(thr), b.h, maj(e.r0, e.r1));
    } else {
      D.rect(ctx, b.x, plot.y(thr), b.w, b.y + b.h - plot.y(thr), maj(e.l0, e.l1));
      D.rect(ctx, b.x, b.y, b.w, plot.y(thr) - b.y, maj(e.r0, e.r1));
    }
    ctx.restore();
    D.rect(ctx, b.x, b.y, b.w, b.h, null, C.ink, 1.5);
    if (feat === 0) D.line(ctx, plot.x(thr), b.y, plot.x(thr), b.y + b.h, C.ink, 2.5);
    else D.line(ctx, b.x, plot.y(thr), b.x + b.w, plot.y(thr), C.ink, 2.5);
    pts.forEach(function (p) { D.circle(ctx, plot.x(p[0]), plot.y(p[1]), ds === "tabla" ? 7 : 5, p[2] ? C.terracota : C.cobalto, C.paper, 1.5); });
  }
  function draw2(ctx, w, h, C) {
    var bs = best(feat), top = Math.max(0.1, Math.ceil(bs.gain * 1.15 * 10) / 10), r = RANGE[feat], i, pathPts = [];
    plot2.xr = r; plot2.yr = [0, top]; plot2.axes(ctx);
    for (i = 0; i <= 240; i++) { var t = r[0] + (r[1] - r[0]) * i / 240; pathPts.push([plot2.x(t), plot2.y(evalSplit(feat, t).gain)]); }
    D.path(ctx, pathPts, C.cobaltoInk, 2.5);
    D.line(ctx, plot2.x(thr), plot2.box.y, plot2.x(thr), plot2.box.y + plot2.box.h, C.ink, 1.5, [4, 3]);
    D.circle(ctx, plot2.x(bs.t), plot2.y(bs.gain), 6, C.oliva, C.paper, 2);
  }
  function f3(v) { return (Math.abs(v) < 5e-4 ? 0 : v).toFixed(3); }
  function update() {
    view.redraw(); view2.redraw();
    var e = evalSplit(feat, thr), n = pts.length, nl = e.l0 + e.l1, nr = e.r0 + e.r1, bs = best(feat), nm = crit === "gini" ? "Gini" : "Entropía";
    var gainTxt = e.gain.toFixed(3);
    out.set("Pregunta: <b>¿" + NAMES[feat] + " ≤ " + String(+thr.toFixed(2)) + "?</b><br>" +
      "Sí (izquierda): <b>" + nl + "</b> clientes (" + e.l0 + " se quedan, " + e.l1 + " cancelan) → " + nm + " = <b>" + f3(e.il) + "</b><br>" +
      "No (derecha): <b>" + nr + "</b> clientes (" + e.r0 + " se quedan, " + e.r1 + " cancelan) → " + nm + " = <b>" + f3(e.ir) + "</b><br>" +
      "Antes de preguntar: " + nm + " = <b>" + f3(e.ip) + "</b> · Después (media ponderada " + nl + "/" + n + " y " + nr + "/" + n + "): <b>" + f3(e.w) + "</b><br>" +
      "Ganancia = " + f3(e.ip) + " − " + f3(e.w) + " = <b>" + gainTxt + "</b> · mejor umbral de esta variable: <b>" + String(+bs.t.toFixed(2)) + "</b> (ganancia " + f3(bs.gain) + ")" +
      (e.gain >= bs.gain - 1e-9 ? "<br><span class='good'>Esta es la mejor pregunta posible con esta variable.</span>" : ""));
  }
  pts = makePts(ds); setFeat(feat);
  view.draw(draw); view2.draw(draw2); update();
});
