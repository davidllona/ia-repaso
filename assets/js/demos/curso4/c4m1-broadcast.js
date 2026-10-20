/* Experimento: broadcasting en PyTorch. Modo 1: calculadora de formas (se alinean por la derecha y cada eje debe ser igual o valer 1).
   Modo 2: la trampa de la pérdida a mano, con y_pred de forma (3, 1) y y_real de forma (3,). Todo se calcula de verdad. */
Lab.register("curso4/c4m1-broadcast", function (root, api) {
  var D = api.d, M = api.math;
  var SH = [[3, 1], [4], [2, 3], [3], [2], [2, 1], [3, 4], [32, 10], [10], [2, 3, 4], [4, 1], [1, 4], [5, 1, 3], [1]];
  function key(s) { return s.join("x"); }
  var st = { mode: "calc", a: 0, b: 1, p: [1, 2, 3], fix: false };
  var view = api.view(root, { aspect: 2.3, minH: 240, maxH: 330, label: "Alineación de formas para el broadcasting o matriz de diferencias de la pérdida" });
  var ui = api.controls(root), out = api.readout(root);
  var opts = SH.map(function (s, k) { return [k, "(" + s.join(", ") + (s.length === 1 ? ",)" : ")")]; });
  var mode = ui.segmented({ label: "Qué quieres ver", value: "calc", options: [["calc", "Calculadora de formas"], ["mse", "La trampa de la pérdida"]], onChange: function (v) { st.mode = v; vis(); update(); } });
  var selA = ui.select({ label: "A + B   ·   forma de A", value: 0, options: opts, onChange: function (v) { st.a = +v; update(); } });
  var selB = ui.select({ label: "forma de B", value: 1, options: opts, onChange: function (v) { st.b = +v; update(); } });
  var presets = [
    ui.button("(3,1) + (4,)  → (3,4)", function () { setAB(0, 1); }, "primary"),
    ui.button("(2,3) + (3,)", function () { setAB(2, 3); }),
    ui.button("(2,3) + (2,)  ¡error!", function () { setAB(2, 4); }),
    ui.button("(32,10) + (10,)  (sesgo)", function () { setAB(7, 8); })
  ];
  var sp = [0, 1, 2].map(function (k) { return ui.slider({ label: "y_pred[" + k + "] (el real es " + (k + 1) + ")", min: -1, max: 5, step: 0.5, value: k + 1, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { st.p[k] = v; update(); } }); });
  var tg = ui.toggle({ label: "Arreglar: y_real.reshape(-1, 1)", value: false, onChange: function (v) { st.fix = v; update(); } });
  function setAB(a, b) { st.a = a; st.b = b; selA.set(a); selB.set(b); update(); }
  function hide(el, on) { var c = el.closest ? el.closest(".ctl") : null; if (c) c.style.display = on ? "none" : ""; }
  function vis() {
    var calc = st.mode === "calc";
    hide(selA.el, !calc); hide(selB.el, !calc);
    presets.forEach(function (b) { b.style.display = calc ? "" : "none"; });
    sp.forEach(function (s) { hide(s.input, calc); });
    tg.set(st.fix); var tb = ui.el.querySelectorAll(".lab-btns .btn[aria-pressed]"); if (tb[0]) tb[0].style.display = calc ? "none" : "";
  }
  function fmt(s) { return s.length === 1 ? "(" + s[0] + ",)" : "(" + s.join(", ") + ")"; }
  function analyse() {
    var sa = SH[st.a], sb = SH[st.b], n = Math.max(sa.length, sb.length), rows = [], res = [], bad = -1, k;
    for (k = 0; k < n; k++) {
      var ia = sa.length - n + k, ib = sb.length - n + k;
      var da = ia >= 0 ? sa[ia] : null, db = ib >= 0 ? sb[ib] : null, ra = da === null ? 1 : da, rb = db === null ? 1 : db, ok = ra === rb || ra === 1 || rb === 1;
      if (!ok && bad < 0) bad = k;
      rows.push({ da: da, db: db, ok: ok, res: ok ? Math.max(ra, rb) : null });
      res.push(ok ? Math.max(ra, rb) : null);
    }
    return { sa: sa, sb: sb, n: n, rows: rows, res: res, bad: bad };
  }
  function drawCalc(ctx, w, h, C) {
    var an = analyse(), n = an.n, bw = Math.min(70, (w - 150) / Math.max(n, 1)), x0 = w - 12 - n * bw - 6, lab = 70;
    var rowsY = [40, 108, 188], k;
    D.text(ctx, "eje:", 10, 24, { size: 11, color: C.muted });
    for (k = 0; k < n; k++) D.text(ctx, String(k - n), x0 + k * bw + bw / 2, 24, { align: "center", size: 10.5, mono: true, color: C.muted });
    D.text(ctx, "A", 10, rowsY[0] + 22, { size: 13, weight: 700, mono: true });
    D.text(ctx, "B", 10, rowsY[1] + 22, { size: 13, weight: 700, mono: true });
    D.text(ctx, an.bad < 0 ? "A+B" : "A+B", 10, rowsY[2] + 22, { size: 13, weight: 700, mono: true });
    function box(row, v, fill, stroke, dashed, txt, col) {
      var x = x0 + row.k * bw + 4;
      ctx.save(); if (dashed) ctx.setLineDash([4, 3]);
      D.rect(ctx, x, row.y, bw - 8, 34, fill, stroke, dashed ? 1.2 : 1.6); ctx.restore();
      D.text(ctx, txt, x + (bw - 8) / 2, row.y + 22, { align: "center", size: 14, mono: true, weight: 700, color: col });
    }
    for (k = 0; k < n; k++) {
      var r = an.rows[k], stretchA = r.da !== null && r.da === 1 && (r.db || 1) !== 1, stretchB = r.db !== null && r.db === 1 && (r.da || 1) !== 1;
      box({ k: k, y: rowsY[0] }, r.da, r.da === null ? C.paper : C.cobaltoWash, r.da === null ? C.muted : C.ink, r.da === null, r.da === null ? "1" : String(r.da), r.da === null ? C.muted : C.ink);
      box({ k: k, y: rowsY[1] }, r.db, r.db === null ? C.paper : C.terracotaWash, r.db === null ? C.muted : C.ink, r.db === null, r.db === null ? "1" : String(r.db), r.db === null ? C.muted : C.ink);
      box({ k: k, y: rowsY[2] }, r.res, r.ok ? C.olivaWash : C.terracotaWash, r.ok ? C.oliva : C.terracota, false, r.ok ? String(r.res) : "✗", r.ok ? C.olivaInk : C.terracotaInk);
      if (r.ok && (r.da === null || stretchA)) D.text(ctx, "se estira", x0 + k * bw + bw / 2, rowsY[0] + 52, { align: "center", size: 9.5, color: C.cobaltoInk });
      if (r.ok && (r.db === null || stretchB)) D.text(ctx, "se estira", x0 + k * bw + bw / 2, rowsY[1] + 50, { align: "center", size: 9.5, color: C.terracotaInk });
    }
    D.text(ctx, "recuadro punteado = eje que no existe (se rellena con 1 por la izquierda)", w / 2, h - 6, { align: "center", size: 10, color: C.muted });
  }
  function drawMse(ctx, w, h, C) {
    var yr = [1, 2, 3], yp = st.p, bad = !st.fix, cs = Math.min(54, (w - 150) / 3, (h - 70) / 3), ox = (w - 3 * cs) / 2 + 30, oy = 40, i, j;
    if (bad) {
      D.text(ctx, "y_pred − y_real  →  forma (3, 3)", w / 2, 18, { align: "center", size: 12, weight: 700 });
      for (j = 0; j < 3; j++) D.text(ctx, "real " + yr[j], ox + j * cs + cs / 2, oy - 6, { align: "center", size: 9.5, mono: true, color: C.muted });
      for (i = 0; i < 3; i++) {
        D.text(ctx, "pred " + yp[i].toFixed(1), ox - 6, oy + i * cs + cs / 2 + 4, { align: "right", size: 9.5, mono: true, color: C.muted });
        for (j = 0; j < 3; j++) {
          var dd = yp[i] - yr[j], diag = i === j;
          D.rect(ctx, ox + j * cs, oy + i * cs, cs, cs, diag ? C.olivaWash : C.terracotaWash, C.line, 1);
          D.text(ctx, dd.toFixed(1), ox + j * cs + cs / 2, oy + i * cs + cs / 2 + 4, { align: "center", size: 12, mono: true, color: diag ? C.olivaInk : C.terracotaInk, weight: diag ? 700 : 400 });
        }
      }
      D.text(ctx, "verde = pares correctos · naranja = pares «todos contra todos»", w / 2, oy + 3 * cs + 20, { align: "center", size: 10.5, color: C.muted });
    } else {
      D.text(ctx, w < 460 ? "con reshape(-1, 1)  →  forma (3, 1)" : "y_pred − y_real.reshape(-1, 1)  →  forma (3, 1)", w / 2, 18, { align: "center", size: 12, weight: 700 });
      ox = Math.max(ox, w < 460 ? 150 : 0);
      for (i = 0; i < 3; i++) {
        D.text(ctx, "pred " + yp[i].toFixed(1) + " − real " + yr[i], ox - 10, oy + i * cs + cs / 2 + 4, { align: "right", size: 10.5, mono: true, color: C.muted });
        D.rect(ctx, ox, oy + i * cs, cs, cs, C.olivaWash, C.line, 1);
        D.text(ctx, (yp[i] - yr[i]).toFixed(1), ox + cs / 2, oy + i * cs + cs / 2 + 4, { align: "center", size: 12, mono: true, color: C.olivaInk, weight: 700 });
      }
    }
  }
  function mseVals() {
    var yr = [1, 2, 3], yp = st.p, i, j, s = 0;
    for (i = 0; i < 3; i++) for (j = 0; j < 3; j++) s += (yp[i] - yr[j]) * (yp[i] - yr[j]);
    var good = 0; for (i = 0; i < 3; i++) good += (yp[i] - yr[i]) * (yp[i] - yr[i]);
    return { bad: s / 9, sumBad: s, good: good / 3, sumGood: good };
  }
  view.draw(function (ctx, w, h, C) { if (st.mode === "calc") drawCalc(ctx, w, h, C); else drawMse(ctx, w, h, C); });
  function update() {
    var s;
    if (st.mode === "calc") {
      var an = analyse();
      s = "<b>A</b> " + fmt(an.sa) + " + <b>B</b> " + fmt(an.sb) + "<br>";
      if (an.bad < 0) s += "<span class='good'>Compatibles</span> → resultado de forma <b>" + fmt(an.res) + "</b>";
      else s += "<span class='bad'>RuntimeError: The size of tensor a (" + (an.rows[an.bad].da === null ? 1 : an.rows[an.bad].da) + ") must match the size of tensor b (" + (an.rows[an.bad].db === null ? 1 : an.rows[an.bad].db) + ") at non-singleton dimension " + an.bad + "</span>";
    } else {
      var m = mseVals();
      s = st.fix ? "Con <b>reshape(-1, 1)</b> las dos formas son (3, 1): resta par a par.<br>MSE = (" + m.sumGood.toFixed(2) + ") / 3 = <b>" + m.good.toFixed(4) + "</b>"
        : "Sin reshape: (3, 1) − (3,) → (3, 3): se resta cada predicción con cada real.<br>Suma de los 9 cuadrados = " + m.sumBad.toFixed(2) + " → MSE = " + m.sumBad.toFixed(2) + " / 9 = <b>" + m.bad.toFixed(4) + "</b>";
      s += "<br>Con y_pred = [1, 2, 3] (perfecto) la versión mala da 12 / 9 = 1.3333 y la buena 0.";
    }
    out.set(s); view.redraw();
  }
  vis(); update();
});
