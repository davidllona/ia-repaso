/* Experimento: con clases desequilibradas, un modelo inútil ("siempre No") saca un accuracy altísimo. */
Lab.register("curso1/c1m5-trampa-accuracy", function (root, api) {
  var D = api.d, N = 1000;
  var st = { frauds: 5, recall: 60, spec: 94 };

  function models() {
    var pos = Math.round(N * st.frauds / 100), neg = N - pos;
    var dummy = { tp: 0, fn: pos, fp: 0, tn: neg };
    var tp = Math.round(pos * st.recall / 100), tn = Math.round(neg * st.spec / 100);
    var real = { tp: tp, fn: pos - tp, fp: neg - tn, tn: tn };
    [dummy, real].forEach(function (m) {
      m.acc = (m.tp + m.tn) / N;
      m.pre = (m.tp + m.fp) ? m.tp / (m.tp + m.fp) : 0;
      m.rec = (m.tp + m.fn) ? m.tp / (m.tp + m.fn) : 0;
      m.f1 = (2 * m.tp + m.fp + m.fn) ? 2 * m.tp / (2 * m.tp + m.fp + m.fn) : 0;
    });
    return { pos: pos, neg: neg, dummy: dummy, real: real };
  }

  var view = api.view(root, { aspect: 1.75, minH: 250, label: "Barras comparando accuracy, precision, recall y F1 del modelo que siempre dice No y de un modelo real" });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Fraudes reales entre las 1.000 transacciones", min: 1, max: 50, step: 1, value: st.frauds, fmt: function (v) { return v + " %"; }, onInput: function (v) { st.frauds = v; update(); } });
  ui.slider({ label: "Recall del modelo real (fraudes que caza)", min: 0, max: 100, step: 5, value: st.recall, fmt: function (v) { return v + " %"; }, onInput: function (v) { st.recall = v; update(); } });
  ui.slider({ label: "Especificidad del modelo real (normales bien vistas)", min: 70, max: 100, step: 1, value: st.spec, fmt: function (v) { return v + " %"; }, onInput: function (v) { st.spec = v; update(); } });
  var C0 = api.colors();
  api.legend(root, [[C0.muted, "«siempre No» (no hace nada)"], [C0.cobalto, "modelo real"]]);

  function draw(ctx, w, h, C) {
    var m = models(), L = 34, R = 10, T = 34, B = 34, bw = w - L - R, bh = h - T - B;
    // barra superior: reparto de las clases
    var fw = bw * m.pos / N;
    D.rect(ctx, L, 8, bw, 12, C.cobaltoWash, C.ink, 1);
    D.rect(ctx, L, 8, fw, 12, C.terracota, null);
    D.text(ctx, "fraudes: " + m.pos + " de " + N, L + bw, 31, { size: 10.5, align: "right", color: C.terracotaInk, weight: 600 });
    // ejes
    var y0 = T + 12, hh = bh - 12;
    D.rect(ctx, L, y0, bw, hh, C.surface, C.ink, 1.5);
    for (var g = 0; g <= 4; g++) {
      var gy = y0 + hh - hh * g / 4;
      D.line(ctx, L, gy, L + bw, gy, C.line, 1);
      D.text(ctx, (g / 4).toFixed(2), L - 4, gy + 4, { size: 10, align: "right", color: C.muted, mono: true });
    }
    var groups = [["accuracy", "acc"], ["precision", "pre"], ["recall", "rec"], ["F1", "f1"]], gw = bw / 4, barW = Math.min(34, gw * 0.34);
    groups.forEach(function (gr, k) {
      var cx = L + gw * (k + 0.5);
      [[m.dummy, C.muted, -1], [m.real, C.cobalto, 1]].forEach(function (b) {
        var v = b[0][gr[1]], bx = cx + (b[2] < 0 ? -barW - 2 : 2), by = y0 + hh - v * hh;
        D.rect(ctx, bx, by, barW, v * hh, b[1], null);
        D.text(ctx, v.toFixed(2), bx + barW / 2, by - 4, { size: 10.5, align: "center", color: C.ink, mono: true, weight: 600 });
      });
      D.text(ctx, gr[0], cx, y0 + hh + 16, { size: 11, align: "center", color: C.ink2, weight: 500 });
    });
  }

  function update() {
    var m = models(), d = m.dummy, r = m.real;
    view.redraw();
    var warn = d.acc > r.acc
      ? "<br><span class='bad'>¡El modelo que no hace nada tiene MÁS accuracy (" + d.acc.toFixed(3) + ") que el real (" + r.acc.toFixed(3) + ")! El accuracy no sirve aquí.</span>"
      : "<br><span class='good'>Aquí el accuracy del modelo real ya supera al de «siempre No», pero mira lo que dicen recall y F1.</span>";
    out.set("«siempre No»: TP=<b>0</b> FN=<b>" + d.fn + "</b> → accuracy <b>" + d.acc.toFixed(3) + "</b>, recall <b>0.000</b><br>" +
      "modelo real: TP=<b>" + r.tp + "</b> FN=<b>" + r.fn + "</b> FP=<b>" + r.fp + "</b> TN=<b>" + r.tn + "</b> → accuracy <b>" + r.acc.toFixed(3) + "</b>, precision <b>" + r.pre.toFixed(3) + "</b>, recall <b>" + r.rec.toFixed(3) + "</b>, F1 <b>" + r.f1.toFixed(3) + "</b>" + warn);
  }
  view.draw(draw); update();
});
