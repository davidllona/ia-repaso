/* Experimento: matriz de confusión y umbral de decisión. Un clasificador genera una probabilidad para 600 películas (calibrada: es la
   probabilidad real de que le gusten a un usuario dado lo que ve). El umbral decide a partir de qué probabilidad Netflix le avisa.
   Al mover el umbral cambian los cuatro cuadros de la matriz y todas las métricas, que se recalculan con los 600 casos. */
Lab.register("curso3/c3m7-confusion", function (root, api) {
  var D = api.d, N = 600;
  var S = { sep: 1.8, prev: 0.2, thr: 0.5, seed: 1 };
  var neg = [], pos = [], bins = [];
  var NB = 20;

  function sig(z) { return 1 / (1 + Math.exp(-z)); }
  function gen() {
    var R = api.rng(S.seed * 71 + 5), nPos = Math.round(N * S.prev), i, off = Math.log(S.prev / (1 - S.prev));
    neg = []; pos = [];
    for (i = 0; i < N - nPos; i++) neg.push(sig(S.sep * R.normal(-S.sep / 2, 1) + off));
    for (i = 0; i < nPos; i++) pos.push(sig(S.sep * R.normal(S.sep / 2, 1) + off));
    bins = [new Array(NB).fill(0), new Array(NB).fill(0)];
    neg.forEach(function (p) { bins[0][Math.min(NB - 1, Math.floor(p * NB))]++; });
    pos.forEach(function (p) { bins[1][Math.min(NB - 1, Math.floor(p * NB))]++; });
  }
  function counts(t) {
    var tn = 0, fp = 0, fn = 0, tp = 0;
    neg.forEach(function (p) { if (p >= t) fp++; else tn++; });
    pos.forEach(function (p) { if (p >= t) tp++; else fn++; });
    return { tn: tn, fp: fp, fn: fn, tp: tp };
  }
  function metrics(c) {
    var prec = c.tp + c.fp ? c.tp / (c.tp + c.fp) : 0, rec = c.tp + c.fn ? c.tp / (c.tp + c.fn) : 0;
    return { acc: (c.tp + c.tn) / N, prec: prec, rec: rec, f1: prec + rec ? 2 * prec * rec / (prec + rec) : 0 };
  }

  gen();
  var vH = api.view(root, { aspect: 2.2, minH: 190, maxH: 270, drag: true, label: "Histograma de probabilidades de las películas que no le gustan y las que sí le gustan, con el umbral de decisión" });
  var pH = api.plot(vH, { xr: [0, 1], yr: [0, 1], xticks: 5, yticks: 4, grid: true, pad: { l: 38, r: 10, t: 10, b: 40 }, xlabel: "probabilidad de que le guste (modelo)",
    xfmt: function (v) { return String(v).replace(".", ","); } });
  var vM = api.view(root, { aspect: 2.5, minH: 170, maxH: 230, label: "Matriz de confusión con los cuatro casos" });
  var ui = api.controls(root), out = api.readout(root);
  var thr = ui.slider({ label: "Umbral de decisión", min: 0.02, max: 0.98, step: 0.01, value: S.thr, fmt: function (v) { return v.toFixed(2).replace(".", ","); }, onInput: function (v) { S.thr = v; update(); } });
  ui.slider({ label: "Separación de las dos clases", min: 0.5, max: 4, step: 0.1, value: S.sep, fmt: function (v) { return v.toFixed(1).replace(".", ","); }, onInput: function (v) { S.sep = v; gen(); update(); } });
  ui.slider({ label: "Películas que le gustan (prevalencia)", min: 0.03, max: 0.5, step: 0.01, value: S.prev, fmt: function (v) { return Math.round(v * 100) + " %"; }, onInput: function (v) { S.prev = v; gen(); update(); } });
  ui.button("Otro lote de películas", function () { S.seed = S.seed % 9 + 1; gen(); update(); });
  ui.button("Poner el umbral que maximiza F1", function () { S.thr = bestF1(); thr.set(S.thr, true); update(); }, "primary");
  api.legend(root, [[api.colors().cobalto, "película que no le gusta"], [api.colors().terracota, "película que le gusta"]]);

  function bestF1() { var bt = 0.5, bf = -1; for (var t = 0.02; t <= 0.98; t += 0.01) { var f = metrics(counts(t)).f1; if (f > bf) { bf = f; bt = Math.round(t * 100) / 100; } } return bt; }

  vH.draw(function (ctx, w, h, C) {
    var mx = 0, i; for (i = 0; i < NB; i++) mx = Math.max(mx, bins[0][i], bins[1][i]);
    pH.yr = [0, Math.max(10, Math.ceil(mx / 20) * 20)];
    pH.axes(ctx);
    var b = pH.box, bw = b.w / NB;
    ctx.save(); pH.clip(ctx);
    [[bins[0], C.cobalto], [bins[1], C.terracota]].forEach(function (s) {
      for (i = 0; i < NB; i++) { var y = pH.y(s[0][i]); ctx.globalAlpha = 0.55; D.rect(ctx, b.x + i * bw + 1, y, bw - 2, b.y + b.h - y, s[1]); ctx.globalAlpha = 1; D.rect(ctx, b.x + i * bw + 1, y, bw - 2, b.y + b.h - y, null, s[1], 1); }
    });
    ctx.restore();
    var tx = pH.x(S.thr);
    D.line(ctx, tx, b.y, tx, b.y + b.h, C.ink, 2.4);
    D.circle(ctx, tx, b.y + 8, 6, C.ink, C.paper, 1.5);
    D.text(ctx, "no avisa", tx - 6, b.y + 24, { align: "right", size: 10.5, color: C.ink2 });
    D.text(ctx, "avisa", tx + 6, b.y + 24, { size: 10.5, color: C.ink2 });
  });
  vH.pointer({
    down: function (px) { S.thr = api.math.clamp(Math.round(pH.ix(px) * 100) / 100, 0.02, 0.98); thr.set(S.thr, true); update(); },
    drag: function (px) { S.thr = api.math.clamp(Math.round(pH.ix(px) * 100) / 100, 0.02, 0.98); thr.set(S.thr, true); update(); }
  });

  vM.draw(function (ctx, w, h, C) {
    var c = counts(S.thr), L = Math.min(100, Math.max(w * 0.2, 92)), T = 26, cw = (w - L - 8) / 2, ch = (h - T - 6) / 2;
    D.text(ctx, "no avisa", L + cw / 2, 16, { align: "center", size: 11.5, weight: 600, color: C.ink2 });
    D.text(ctx, "avisa", L + cw * 1.5, 16, { align: "center", size: 11.5, weight: 600, color: C.ink2 });
    D.text(ctx, "no le gusta", L - 8, T + ch / 2 + 4, { align: "right", size: 11.5, weight: 600, color: C.ink2 });
    D.text(ctx, "le gusta", L - 8, T + ch * 1.5 + 4, { align: "right", size: 11.5, weight: 600, color: C.ink2 });
    var cells = [[0, 0, c.tn, "TN", true], [1, 0, c.fp, "FP", false], [0, 1, c.fn, "FN", false], [1, 1, c.tp, "TP", true]];
    cells.forEach(function (q) {
      var x = L + q[0] * cw, y = T + q[1] * ch;
      D.rect(ctx, x + 2, y + 2, cw - 4, ch - 4, q[4] ? C.olivaWash : C.terracotaWash, q[4] ? C.oliva : C.terracota, 2);
      D.text(ctx, String(q[2]), x + cw / 2, y + ch / 2 + 6, { align: "center", size: Math.min(26, ch * 0.42), weight: 700, color: q[4] ? C.olivaInk : C.terracotaInk });
      D.text(ctx, q[3], x + 8, y + 16, { size: 10.5, weight: 700, color: C.ink2 });
    });
  });

  function update() {
    var c = counts(S.thr), m = metrics(c), base = 1 - S.prev, bt = bestF1();
    function pc(v) { return (v * 100).toFixed(1).replace(".", ",") + " %"; }
    out.set("<b>Exactitud</b> = (TP+TN)/" + N + " = " + pc(m.acc) + " &nbsp; (no avisar nunca ya da " + pc(base) + ")" +
      "<br><b>Precisión</b> = TP/(TP+FP) = " + c.tp + "/" + (c.tp + c.fp) + " = " + pc(m.prec) + " &nbsp; <b>Exhaustividad</b> (recall) = TP/(TP+FN) = " + c.tp + "/" + (c.tp + c.fn) + " = " + pc(m.rec) +
      "<br><b>F1</b> = " + m.f1.toFixed(3).replace(".", ",") + " &nbsp; (el umbral que lo maximiza es " + bt.toFixed(2).replace(".", ",") + ")" +
      (m.acc <= base + 0.005 ? "<br><span class='bad'>Con este umbral la exactitud no supera a la de \"no avisar nunca\": no te fíes de ella.</span>" : ""));
    vH.redraw(); vM.redraw();
  }
  gen(); update();
});
