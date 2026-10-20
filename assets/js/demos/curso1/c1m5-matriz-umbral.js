/* Experimento: la matriz de confusión se mueve con el umbral.
   Cada punto es una muestra real; su posición es la puntuación que le da el modelo. */
Lab.register("curso1/c1m5-matriz-umbral", function (root, api) {
  var M = api.math, D = api.d, i;
  var N = 70, r = api.rng(5), zP = [], zN = [], jP = [], jN = [];
  for (i = 0; i < N; i++) { zP.push(r.normal(0, 1)); zN.push(r.normal(0, 1)); jP.push(r.next()); jN.push(r.next()); }
  var st = { d: 1.6, prev: 0.35, thr: 0.5 }, pos = [], neg = [];

  function build() {
    var nPos = Math.max(1, Math.round(N * st.prev)), nNeg = N - nPos;
    pos = []; neg = [];
    for (i = 0; i < nPos; i++) pos.push({ s: M.sigmoid(1.1 * (st.d / 2 + zP[i])), j: jP[i] });
    for (i = 0; i < nNeg; i++) neg.push({ s: M.sigmoid(1.1 * (-st.d / 2 + zN[i])), j: jN[i] });
  }
  function counts() {
    var tp = 0, fn = 0, fp = 0, tn = 0;
    pos.forEach(function (p) { if (p.s >= st.thr) tp++; else fn++; });
    neg.forEach(function (p) { if (p.s >= st.thr) fp++; else tn++; });
    return { tp: tp, fn: fn, fp: fp, tn: tn };
  }

  var view = api.view(root, { aspect: 2.1, minH: 215, drag: true, label: "Películas que te gustan y que no te gustan, colocadas según la puntuación del modelo, con una línea de umbral que se puede arrastrar" });
  var mview = api.view(root, { aspect: 2.7, minH: 150, label: "Matriz de confusión con los cuatro recuentos TN, FP, FN y TP" });
  api.legend(root, [[api.colors().terracota, "te gusta (real)"], [api.colors().cobalto, "no te gusta (real)"], [api.colors().ink, "aro = error del modelo"]]);
  var ui = api.controls(root), out = api.readout(root);
  var sThr = ui.slider({ label: "Umbral de decisión", min: 0.05, max: 0.95, step: 0.01, value: st.thr, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { st.thr = v; update(); } });
  ui.slider({ label: "Lo bien que separa el modelo", min: 0.2, max: 4, step: 0.1, value: st.d, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { st.d = v; build(); update(); } });
  ui.slider({ label: "Porcentaje de pelis que te gustan", min: 10, max: 60, step: 5, value: Math.round(st.prev * 100), fmt: function (v) { return v + " %"; }, onInput: function (v) { st.prev = v / 100; build(); update(); } });

  var G = { L: 12, R: 12, T: 26, B: 40 };
  function X(s, w) { return G.L + s * (w - G.L - G.R); }

  function drawStrip(ctx, w, h, C) {
    var bandH = (h - G.T - G.B) / 2, y0 = G.T, y1 = G.T + bandH, y2 = G.T + 2 * bandH, tx = X(st.thr, w);
    ctx.fillStyle = C.cobaltoWash; ctx.fillRect(G.L, y0, tx - G.L, y2 - y0);
    ctx.fillStyle = C.terracotaWash; ctx.fillRect(tx, y0, w - G.R - tx, y2 - y0);
    D.line(ctx, G.L, y1, w - G.R, y1, C.line, 1);
    D.rect(ctx, G.L, y0, w - G.L - G.R, y2 - y0, null, C.ink, 1.5);
    var rad = w < 420 ? 4 : 5, padT = 22, padB = 9;
    function dot(p, yTop, real) {
      var px = X(p.s, w), py = yTop + padT + p.j * (bandH - padT - padB), pred = p.s >= st.thr ? 1 : 0, bad = pred !== real;
      D.circle(ctx, px, py, rad, real ? C.terracota : C.cobalto, C.paper, 1);
      if (bad) D.circle(ctx, px, py, rad + 3, null, C.ink, 1.8);
    }
    pos.forEach(function (p) { dot(p, y0, 1); });
    neg.forEach(function (p) { dot(p, y1, 0); });
    D.text(ctx, "te gustan: " + pos.length, G.L + 5, y0 + 12, { size: 10.5, color: C.terracotaInk, weight: 600 });
    D.text(ctx, "no te gustan: " + neg.length, G.L + 5, y1 + 12, { size: 10.5, color: C.cobaltoInk, weight: 600 });
    D.line(ctx, tx, y0 - 8, tx, y2 + 2, C.ink, 2.5);
    D.circle(ctx, tx, y0 - 8, 5, C.ink);
    if (tx > 120) D.text(ctx, "NO la recomienda", tx - 8, 11, { size: 10.5, align: "right", color: C.cobaltoInk, weight: 600 });
    if (w - tx > 120) D.text(ctx, "la recomienda", tx + 8, 11, { size: 10.5, color: C.terracotaInk, weight: 600 });
    for (var t = 0; t <= 4; t++) D.text(ctx, (t / 4).toFixed(2).replace(/0+$/, "").replace(/\.$/, ""), X(t / 4, w), y2 + 15, { size: 10.5, align: "center", color: C.muted, mono: true });
    D.text(ctx, "puntuación (0 = seguro que no te gusta, 1 = seguro que sí)", (G.L + w - G.R) / 2, y2 + 31, { size: 11, align: "center", color: C.ink2, weight: 500 });
  }

  function drawMatrix(ctx, w, h, C) {
    var c = counts(), lw = Math.min(92, w * 0.24), th = 28, x0 = lw, y0 = th, cw = (w - lw - 6) / 2, ch = (h - th - 6) / 2;
    var cells = [
      [c.tn, "TN", "bien descartada", true], [c.fp, "FP", "falsa alarma", false],
      [c.fn, "FN", "se te escapó", false], [c.tp, "TP", "bien recomendada", true]
    ];
    D.text(ctx, "NO la recomienda", x0 + cw / 2, 17, { size: 10.5, align: "center", color: C.ink2, weight: 600 });
    D.text(ctx, "la recomienda", x0 + cw * 1.5, 17, { size: 10.5, align: "center", color: C.ink2, weight: 600 });
    D.text(ctx, "real:", lw - 8, y0 + ch / 2 - 2, { size: 10.5, align: "right", color: C.ink2, weight: 600 });
    D.text(ctx, "no te gusta", lw - 8, y0 + ch / 2 + 11, { size: 10.5, align: "right", color: C.ink2, weight: 600 });
    D.text(ctx, "real:", lw - 8, y0 + ch * 1.5 - 2, { size: 10.5, align: "right", color: C.ink2, weight: 600 });
    D.text(ctx, "te gusta", lw - 8, y0 + ch * 1.5 + 11, { size: 10.5, align: "right", color: C.ink2, weight: 600 });
    cells.forEach(function (cl, k) {
      var cx = x0 + (k % 2) * cw, cy = y0 + Math.floor(k / 2) * ch;
      D.rect(ctx, cx + 2, cy + 2, cw - 4, ch - 4, cl[3] ? C.olivaWash : C.terracotaWash, cl[3] ? C.oliva : C.terracota, 1.5);
      D.text(ctx, String(cl[0]), cx + cw / 2, cy + ch / 2 + 5, { size: Math.min(30, ch * 0.5), align: "center", weight: 600, color: cl[3] ? C.olivaInk : C.terracotaInk, mono: true });
      D.text(ctx, cl[1] + (cw > 120 ? " · " + cl[2] : ""), cx + cw / 2, cy + ch - 9, { size: 10.5, align: "center", color: C.ink2 });
    });
  }

  function f(v) { return isFinite(v) ? v.toFixed(3) : "—"; }
  function update() {
    var c = counts(), n = N, acc = (c.tp + c.tn) / n, pre = c.tp / (c.tp + c.fp), rec = c.tp / (c.tp + c.fn), esp = c.tn / (c.tn + c.fp);
    var f1 = 2 * c.tp / (2 * c.tp + c.fp + c.fn);
    view.redraw(); mview.redraw();
    out.set("umbral = <b>" + st.thr.toFixed(2) + "</b> · TP = <b>" + c.tp + "</b> · FP = <b>" + c.fp + "</b> · FN = <b>" + c.fn + "</b> · TN = <b>" + c.tn + "</b><br>" +
      "accuracy = (TP+TN)/N = (" + c.tp + "+" + c.tn + ")/" + n + " = <b>" + f(acc) + "</b><br>" +
      "precision = TP/(TP+FP) = " + c.tp + "/" + (c.tp + c.fp) + " = <b>" + f(pre) + "</b><br>" +
      "recall = TP/(TP+FN) = " + c.tp + "/" + (c.tp + c.fn) + " = <b>" + f(rec) + "</b><br>" +
      "especificidad = TN/(TN+FP) = " + c.tn + "/" + (c.tn + c.fp) + " = <b>" + f(esp) + "</b> · F1 = <b>" + f(f1) + "</b>");
  }
  function move(px) { st.thr = M.clamp(Math.round(((px - G.L) / (view.w - G.L - G.R)) * 100) / 100, 0.05, 0.95); sThr.set(st.thr, true); update(); }
  view.pointer({ down: move, drag: move });
  build();
  view.draw(drawStrip); mview.draw(drawMatrix); update();
});
