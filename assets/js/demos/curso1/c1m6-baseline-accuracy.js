/* Experimento: la trampa del accuracy con clases desequilibradas (baseline «siempre No» frente a un modelo real). */
Lab.register("curso1/c1m6-baseline-accuracy", function (root, api) {
  var M = api.math;
  var prev = 0.24, spec = 0.906, rec = 0.449;       // valores reales de la ejecución de lluvia: TN 978, FP 101, FN 189, TP 154
  var view = api.view(root, { aspect: 1.0, minH: 392, maxH: 392, label: "Cien días: cómo clasifican el baseline y el modelo; debajo, accuracy, recall y precision de cada uno" });
  var ui = api.controls(root), out = api.readout(root);
  var sP = ui.slider({ label: "Días de lluvia (de cada 100)", min: 2, max: 60, step: 1, value: Math.round(prev * 100), fmt: function (v) { return v + " %"; }, onInput: function (v) { prev = v / 100; update(); } });
  var sR = ui.slider({ label: "Recall del modelo (lluvias que detecta)", min: 0, max: 100, step: 1, value: Math.round(rec * 100), fmt: function (v) { return v + " %"; }, onInput: function (v) { rec = v / 100; update(); } });
  var sS = ui.slider({ label: "Especificidad (días secos que acierta)", min: 50, max: 100, step: 1, value: Math.round(spec * 100), fmt: function (v) { return v + " %"; }, onInput: function (v) { spec = v / 100; update(); } });
  ui.button("Los datos de lluvia de este módulo", function () { prev = 0.24; rec = 0.449; spec = 0.906; sP.set(24, true); sR.set(45, true); sS.set(91, true); update(); });
  ui.button("Mitad y mitad (50 % de lluvia)", function () { prev = 0.5; sP.set(50, true); update(); });
  api.legend(root, [[api.colors().cobalto, "día seco bien clasificado (TN)"], [api.colors().marker, "falsa alarma (FP)"], [api.colors().terracota, "lluvia que se escapa (FN)"], [api.colors().oliva, "lluvia detectada (TP)"]]);

  function calc() {
    var nPos = Math.round(prev * 100), nNeg = 100 - nPos;
    var tp = Math.round(nPos * rec), fn = nPos - tp, tn = Math.round(nNeg * spec), fp = nNeg - tn;
    return { nPos: nPos, nNeg: nNeg, tp: tp, fn: fn, tn: tn, fp: fp };
  }
  function waffle(ctx, x, y, size, cells, C) {
    var cw = size / 10, k, r, c, idx = 0, D = api.d;
    for (k = 0; k < cells.length; k++) {
      for (var q = 0; q < cells[k][0]; q++) {
        r = Math.floor(idx / 10); c = idx % 10; idx++;
        D.rect(ctx, x + c * cw + 1, y + r * cw + 1, cw - 2, cw - 2, cells[k][1]);
      }
    }
  }
  function bar(ctx, x, y, w, frac, color, label, C, txt) {
    var D = api.d;
    D.rect(ctx, x, y, w, 15, C.paper2 || C.surface, C.line, 1);
    if (frac > 0) D.rect(ctx, x, y, Math.max(1, w * frac), 15, color);
    D.text(ctx, txt, x + w + 6, y + 12, { size: 11, color: C.ink2, mono: true });
  }
  function draw(ctx, w, h, C) {
    var D = api.d, c = calc(), size = Math.min(w * 0.40, 170), gap = (w - 2 * size) / 3;
    var xl = gap, xr = 2 * gap + size, y0 = 28, k;
    D.text(ctx, "Baseline: «nunca llueve»", xl + size / 2, 16, { size: 11.5, weight: 600, align: "center", color: C.ink });
    D.text(ctx, "Modelo", xr + size / 2, 16, { size: 11.5, weight: 600, align: "center", color: C.ink });
    waffle(ctx, xl, y0, size, [[c.nNeg, C.cobalto], [c.nPos, C.terracota]], C);
    waffle(ctx, xr, y0, size, [[c.tn, C.cobalto], [c.fp, C.marker], [c.fn, C.terracota], [c.tp, C.oliva]], C);
    var accB = c.nNeg / 100, accM = (c.tn + c.tp) / 100, recB = 0, recM = c.nPos ? c.tp / c.nPos : 0;
    var precM = (c.tp + c.fp) ? c.tp / (c.tp + c.fp) : 0;
    var by = y0 + size + 26, bw = w - 150;
    var rows = [["Accuracy", accB, accM, (accB * 100).toFixed(0) + " %", (accM * 100).toFixed(0) + " %"],
                ["Recall", recB, recM, "0 %", (recM * 100).toFixed(0) + " %"],
                ["Precision", 0, precM, "—", (precM * 100).toFixed(0) + " %"]];
    for (k = 0; k < rows.length; k++) {
      var yy = by + k * 54;
      D.text(ctx, rows[k][0], 10, yy + 10, { size: 12, weight: 600, color: C.ink });
      D.text(ctx, "baseline", 10, yy + 26, { size: 10, color: C.muted });
      D.text(ctx, "modelo", 10, yy + 42, { size: 10, color: C.muted });
      bar(ctx, 76, yy + 14, bw * 0.78, rows[k][1], C.muted, "", C, rows[k][3]);
      bar(ctx, 76, yy + 32, bw * 0.78, rows[k][2], C.oliva, "", C, rows[k][4]);
    }
  }
  function update() {
    view.redraw();
    var c = calc(), accB = c.nNeg / 100, accM = (c.tn + c.tp) / 100, pstar = (1 - spec) / (1 - spec + rec);
    var verdict = accM > accB ? "<span class='good'>El modelo gana en accuracy por " + ((accM - accB) * 100).toFixed(0) + " puntos.</span>"
                              : "<span class='bad'>En accuracy el modelo PIERDE contra el baseline (" + ((accB - accM) * 100).toFixed(0) + " puntos) aunque detecta " + c.tp + " de " + c.nPos + " días de lluvia y el baseline ninguno.</span>";
    out.set("De cada 100 días: <b>" + c.nPos + " de lluvia</b> y <b>" + c.nNeg + " secos</b>.<br>" +
      "Baseline: accuracy <b>" + (accB * 100).toFixed(0) + " %</b> · detecta <b>0</b> de " + c.nPos + " lluvias.<br>" +
      "Modelo: TN " + c.tn + " · FP " + c.fp + " · FN " + c.fn + " · TP " + c.tp + " → accuracy <b>" + (accM * 100).toFixed(0) + " %</b> · detecta <b>" + c.tp + "</b> de " + c.nPos + ".<br>" + verdict + "<br>" +
      "Con estos recall y especificidad, el modelo supera al baseline en accuracy solo si llueve más del <b>" + (pstar * 100).toFixed(1) + " %</b> de los días.");
  }
  view.draw(draw); update();
});
