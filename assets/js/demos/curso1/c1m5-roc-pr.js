/* Experimento: la curva ROC se construye moviendo el umbral. Al lado, la curva Precision–Recall. */
Lab.register("curso1/c1m5-roc-pr", function (root, api) {
  var M = api.math, D = api.d, i;
  var st = { mode: "text", d: 1.5, prev: 0.3, thr: 0.55 };
  var data = [], roc = [], pr = [], auc = 0, ap = 0, nPos = 0, nNeg = 0;
  var TXT = [[1, 0.92], [1, 0.85], [0, 0.78], [1, 0.70], [1, 0.62], [0, 0.55], [1, 0.43], [0, 0.35], [0, 0.22], [0, 0.10]];
  var NR = 80, rr = api.rng(17), zP = [], zN = [], jit = [];
  for (i = 0; i < NR; i++) { zP.push(rr.normal(0, 1)); zN.push(rr.normal(0, 1)); jit.push(rr.next()); }

  function build() {
    data = [];
    if (st.mode === "text") TXT.forEach(function (t, k) { data.push({ y: t[0], s: t[1], j: (k * 0.37) % 1 }); });
    else {
      var np = Math.round(NR * st.prev), nn = NR - np;
      for (i = 0; i < np; i++) data.push({ y: 1, s: M.sigmoid(1.1 * (st.d / 2 + zP[i])), j: jit[i] });
      for (i = 0; i < nn; i++) data.push({ y: 0, s: M.sigmoid(1.1 * (-st.d / 2 + zN[i])), j: jit[NR - 1 - i] });
    }
    nPos = data.filter(function (p) { return p.y === 1; }).length; nNeg = data.length - nPos;
    var sorted = data.slice().sort(function (a, b) { return b.s - a.s; });
    roc = [{ t: 2, fpr: 0, tpr: 0 }]; pr = [];
    var tp = 0, fp = 0;
    for (i = 0; i < sorted.length; i++) {
      if (sorted[i].y) tp++; else fp++;
      if (i + 1 < sorted.length && sorted[i + 1].s === sorted[i].s) continue;
      roc.push({ t: sorted[i].s, fpr: fp / nNeg, tpr: tp / nPos });
      pr.push({ t: sorted[i].s, rec: tp / nPos, pre: tp / (tp + fp) });
    }
    auc = 0;
    for (i = 1; i < roc.length; i++) auc += (roc[i].fpr - roc[i - 1].fpr) * (roc[i].tpr + roc[i - 1].tpr) / 2;
    ap = 0;
    for (i = 0; i < pr.length; i++) ap += (pr[i].rec - (i ? pr[i - 1].rec : 0)) * pr[i].pre;
  }
  function counts() {
    var tp = 0, fp = 0, fn = 0, tn = 0;
    data.forEach(function (p) { var pred = p.s >= st.thr - 1e-9; if (p.y) { if (pred) tp++; else fn++; } else { if (pred) fp++; else tn++; } });
    return { tp: tp, fp: fp, fn: fn, tn: tn };
  }

  var strip = api.view(root, { aspect: 3.6, minH: 138, maxH: 170, drag: true, label: "Películas que te gustan y que no te gustan, ordenadas por puntuación, con una línea de umbral arrastrable" });
  var row = api.el("div", { class: "lab-row" }), c1 = api.el("div"), c2 = api.el("div");
  row.appendChild(c1); row.appendChild(c2); root.appendChild(row);
  var vR = api.view(c1, { aspect: 1.1, minH: 230, maxH: 380, label: "Curva ROC: tasa de falsos positivos frente a tasa de verdaderos positivos" });
  var vP = api.view(c2, { aspect: 1.1, minH: 230, maxH: 380, label: "Curva Precision–Recall" });
  var pR = api.plot(vR, { xr: [0, 1], yr: [0, 1], xticks: 4, yticks: 4, xlabel: "FPR = FP/(FP+TN)", ylabel: "TPR = recall", pad: { l: 44, r: 12, t: 12, b: 36 } });
  var pP = api.plot(vP, { xr: [0, 1], yr: [0, 1], xticks: 4, yticks: 4, xlabel: "recall", ylabel: "precision", pad: { l: 44, r: 12, t: 12, b: 36 } });
  var ui = api.controls(root), out = api.readout(root);
  var sThr = ui.slider({ label: "Umbral", min: 0, max: 1, step: 0.01, value: st.thr, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { st.thr = v; update(); } });
  var sD = ui.slider({ label: "Separación del modelo (modo aleatorio)", min: 0.2, max: 4, step: 0.1, value: st.d, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { st.d = v; if (st.mode === "rand") { build(); update(); } } });
  var sPrev = ui.slider({ label: "Pelis que te gustan (modo aleatorio)", min: 10, max: 50, step: 5, value: 30, fmt: function (v) { return v + " %"; }, onInput: function (v) { st.prev = v / 100; if (st.mode === "rand") { build(); update(); } } });
  ui.segmented({ label: "Datos", options: [["text", "10 ejemplos del texto"], ["rand", "80 películas al azar"]], value: st.mode, onChange: function (v) { st.mode = v; build(); update(); } });
  var running = false;
  var loop = api.loop(function () {
    st.thr -= 0.01; if (st.thr <= 0) { st.thr = 0; sThr.set(0, true); update(); running = false; return false; }
    sThr.set(st.thr, true); update();
  }, { fps: 30 });
  ui.button("Bajar al siguiente umbral", function () {
    var lower = data.map(function (p) { return p.s; }).filter(function (s) { return s < st.thr - 1e-9; });
    st.thr = lower.length ? Math.max.apply(null, lower) : 0; sThr.set(st.thr, true); update();
  }, "primary");
  ui.button("Barrer de 1 a 0", function () {
    st.thr = 1; sThr.set(1, true); update();
    if (api.reduceMotion) { st.thr = 0; sThr.set(0, true); update(); return; }
    running = true; loop.start();
  });
  ui.button("Umbral a 1", function () { loop.stop(); st.thr = 1; sThr.set(1, true); update(); });
  var C0 = api.colors();
  api.legend(root, [[C0.terracota, "te gusta (real)"], [C0.cobalto, "no te gusta (real)"]]);

  var G = { L: 12, R: 12 };
  function X(s, w) { return G.L + s * (w - G.L - G.R); }
  function drawStrip(ctx, w, h, C) {
    var bh = h - 40, mid = 8 + bh / 2, tx = X(st.thr, w);
    ctx.fillStyle = C.cobaltoWash; ctx.fillRect(G.L, 8, tx - G.L, bh);
    ctx.fillStyle = C.terracotaWash; ctx.fillRect(tx, 8, w - G.R - tx, bh);
    D.rect(ctx, G.L, 8, w - G.L - G.R, bh, null, C.ink, 1.5);
    D.line(ctx, G.L, mid, w - G.R, mid, C.line, 1);
    data.forEach(function (p) {
      var px = X(p.s, w), up = p.y === 1, py = up ? mid - 9 - p.j * (bh / 2 - 9 - 26) : mid + 25 + p.j * (bh / 2 - 25 - 8);
      var pred = p.s >= st.thr - 1e-9, bad = (pred ? 1 : 0) !== p.y;
      D.circle(ctx, px, py, 4.6, up ? C.terracota : C.cobalto, C.paper, 1);
      if (bad) D.circle(ctx, px, py, 7.5, null, C.ink, 1.6);
    });
    D.line(ctx, tx, 3, tx, 8 + bh + 2, C.ink, 2.5);
    D.circle(ctx, tx, 4, 4, C.ink);
    D.text(ctx, "te gustan ↑", G.L + 5, 21, { size: 10, color: C.terracotaInk, weight: 600 });
    D.text(ctx, "no te gustan ↓", G.L + 5, mid + 13, { size: 10, color: C.cobaltoInk, weight: 600 });
    for (var t = 0; t <= 4; t++) D.text(ctx, String(t / 4).replace("0.", "."), X(t / 4, w), h - 21, { size: 10.5, align: "center", color: C.muted, mono: true });
    D.text(ctx, "puntuación del modelo", w / 2, h - 6, { size: 10.5, align: "center", color: C.ink2, weight: 500 });
  }
  function drawROC(ctx, w, h, C) {
    pR.axes(ctx);
    ctx.save(); pR.clip(ctx);
    ctx.beginPath(); ctx.moveTo(pR.x(0), pR.y(0));
    roc.forEach(function (p) { ctx.lineTo(pR.x(p.fpr), pR.y(p.tpr)); });
    ctx.lineTo(pR.x(1), pR.y(0)); ctx.closePath(); ctx.fillStyle = C.olivaWash; ctx.fill();
    ctx.restore();
    D.line(ctx, pR.x(0), pR.y(0), pR.x(1), pR.y(1), C.muted, 1.5, [6, 4]);
    D.path(ctx, roc.map(function (p) { return [pR.x(p.fpr), pR.y(p.tpr)]; }), C.muted, 1.5);
    var done = roc.filter(function (p) { return p.t >= st.thr - 1e-9; });
    D.path(ctx, done.map(function (p) { return [pR.x(p.fpr), pR.y(p.tpr)]; }), C.terracota, 3);
    if (roc.length < 14) roc.forEach(function (p) { D.circle(ctx, pR.x(p.fpr), pR.y(p.tpr), 3, p.t >= st.thr - 1e-9 ? C.terracota : C.paper, C.ink, 1); });
    var c = counts(), cx = pR.x(c.fp / nNeg), cy = pR.y(c.tp / nPos);
    D.circle(ctx, cx, cy, 7, C.terracota, C.ink, 2.2);
    D.text(ctx, "AUC = " + auc.toFixed(3), pR.x(1) - 6, pR.y(0) - 8, { size: 12, weight: 600, align: "right", color: C.olivaInk });
    D.text(ctx, "azar", pR.x(0.62), pR.y(0.62) + 15, { size: 10, color: C.muted, rotate: 0 });
  }
  function drawPR(ctx, w, h, C) {
    pP.axes(ctx);
    var base = nPos / data.length;
    D.line(ctx, pP.x(0), pP.y(base), pP.x(1), pP.y(base), C.muted, 1.5, [6, 4]);
    D.text(ctx, "azar = " + base.toFixed(2), pP.x(0.02), pP.y(base) - 5, { size: 10, color: C.muted });
    var pts = [[pP.x(0), pP.y(pr.length ? pr[0].pre : 1)]].concat(pr.map(function (p) { return [pP.x(p.rec), pP.y(p.pre)]; }));
    D.path(ctx, pts, C.muted, 1.5);
    var done = pr.filter(function (p) { return p.t >= st.thr - 1e-9; });
    if (done.length) D.path(ctx, [[pP.x(0), pP.y(done[0].pre)]].concat(done.map(function (p) { return [pP.x(p.rec), pP.y(p.pre)]; })), C.terracota, 3);
    if (pr.length < 14) pr.forEach(function (p) { D.circle(ctx, pP.x(p.rec), pP.y(p.pre), 3, p.t >= st.thr - 1e-9 ? C.terracota : C.paper, C.ink, 1); });
    var c = counts();
    if (c.tp + c.fp > 0) D.circle(ctx, pP.x(c.tp / nPos), pP.y(c.tp / (c.tp + c.fp)), 7, C.terracota, C.ink, 2.2);
    D.text(ctx, "AP = " + ap.toFixed(3), pP.x(1) - 6, pP.y(0) - 8, { size: 12, weight: 600, align: "right", color: C.olivaInk });
  }
  function f(v) { return isFinite(v) ? v.toFixed(3) : "—"; }
  function update() {
    var c = counts();
    strip.redraw(); vR.redraw(); vP.redraw();
    out.set("umbral ≥ <b>" + st.thr.toFixed(2) + "</b> → TP=<b>" + c.tp + "</b> FP=<b>" + c.fp + "</b> FN=<b>" + c.fn + "</b> TN=<b>" + c.tn + "</b><br>" +
      "TPR = " + c.tp + "/" + nPos + " = <b>" + f(c.tp / nPos) + "</b> · FPR = " + c.fp + "/" + nNeg + " = <b>" + f(c.fp / nNeg) + "</b> · precision = <b>" + f(c.tp / (c.tp + c.fp)) + "</b><br>" +
      "AUC = <b>" + auc.toFixed(3) + "</b> · área Precision–Recall (AP) = <b>" + ap.toFixed(3) + "</b>");
  }
  function move(px) { st.thr = M.clamp(Math.round(((px - G.L) / (strip.w - G.L - G.R)) * 100) / 100, 0, 1); sThr.set(st.thr, true); update(); }
  strip.pointer({ down: move, drag: move });
  build();
  strip.draw(drawStrip); vR.draw(drawROC); vP.draw(drawPR); update();
  return { destroy: function () { loop.stop(); } };
});
