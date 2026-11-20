/* Experimento: MSE frente a MAE con tres películas. Mueve la predicción de Shrek y mira cuánto pesa su error en cada medida. */
Lab.register("curso2/c2m2-mse-mae", function (root, api) {
  var pelis = [
    { n: "Toy Story", real: 3, pred: 2.5 },
    { n: "Matrix", real: 5, pred: 5.5 },
    { n: "Shrek", real: 2, pred: 4 }
  ];
  var view = api.view(root, { aspect: 1.25, minH: 300, maxH: 420, label: "Arriba, la nota real y la predicha de tres películas; abajo, cuánto aporta cada película al MSE y al MAE" });
  var ui = api.controls(root), out = api.readout(root);
  var sl = ui.slider({ label: "Nota que predice para Shrek (la real es 2)", min: 0, max: 10, step: 0.5, value: 4, fmt: function (v) { return v.toFixed(1).replace(".", ","); }, onInput: function (v) { pelis[2].pred = v; update(); } });
  ui.button("Volver al ejemplo (4)", function () { pelis[2].pred = 4; sl.set(4, true); update(); });

  function cols(C) { return [C.cobalto, C.oliva, C.terracota]; }
  function n(v, k) { return v.toFixed(k === undefined ? 2 : k).replace(".", ","); }

  view.draw(function (ctx, w, h, C) {
    var D = api.d, col = cols(C), narrow = w < 420;
    var L = narrow ? 74 : 96, R = w - 14, top = 22, rowH = Math.min(46, (h * 0.5) / 3);
    function X(v) { return L + (R - L) * v / 10; }
    /* escala */
    D.text(ctx, "nota sobre 10", R, 12, { align: "right", size: 11, color: C.muted });
    for (var t = 0; t <= 10; t += 2) {
      D.line(ctx, X(t), top, X(t), top + rowH * 3, C.line, 1);
      D.text(ctx, String(t), X(t), top + rowH * 3 + 14, { align: "center", size: 11, color: C.muted, mono: true });
    }
    pelis.forEach(function (p, i) {
      var y = top + rowH * i + rowH / 2;
      D.text(ctx, p.n, 6, y + 4, { size: narrow ? 11.5 : 13, weight: 600, color: C.ink });
      D.line(ctx, X(p.real), y, X(p.pred), y, col[i], 4);
      D.circle(ctx, X(p.real), y, 6, C.paper, C.ink, 2);
      D.circle(ctx, X(p.pred), y, 6, col[i], C.paper, 1.5);
    });
    D.text(ctx, "○ real   ● predicha", L, top + rowH * 3 + 30, { size: 11, color: C.ink2 });
    /* barras apiladas */
    var errs = pelis.map(function (p) { return p.pred - p.real; });
    var sq = errs.map(function (e) { return e * e; }), ab = errs.map(function (e) { return Math.abs(e); });
    var sumSq = sq[0] + sq[1] + sq[2], sumAb = ab[0] + ab[1] + ab[2];
    var by = top + rowH * 3 + 48, bh = Math.max(26, Math.min(36, (h - by - 30) / 2 - 18));
    [["MSE", sq, sumSq], ["MAE", ab, sumAb]].forEach(function (row, k) {
      var y0 = by + k * (bh + 26), x = L, tot = row[2] || 1;
      D.text(ctx, row[0], 6, y0 + bh / 2 + 5, { size: 13, weight: 700, color: C.ink });
      row[1].forEach(function (v, i) {
        var ww = (R - L) * v / tot;
        D.rect(ctx, x, y0, ww, bh, col[i], C.paper, 1);
        var pct = Math.round(100 * v / tot);
        if (ww > 34) D.text(ctx, pct + " %", x + ww / 2, y0 + bh / 2 + 4, { align: "center", size: 11.5, weight: 700, color: C.paper });
        x += ww;
      });
    });
  });

  function update() {
    view.redraw();
    var errs = pelis.map(function (p) { return p.pred - p.real; });
    var sq = errs.map(function (e) { return e * e; }), ab = errs.map(function (e) { return Math.abs(e); });
    var mse = (sq[0] + sq[1] + sq[2]) / 3, mae = (ab[0] + ab[1] + ab[2]) / 3;
    var sS = sq[0] + sq[1] + sq[2], sA = ab[0] + ab[1] + ab[2];
    out.set("Errores: " + errs.map(function (e) { return n(e, 1); }).join(" · ") +
      "<br>MSE = (" + sq.map(function (v) { return n(v); }).join(" + ") + ") / 3 = <b>" + n(mse) + "</b> · RMSE = <b>" + n(Math.sqrt(mse)) + "</b>" +
      "<br>MAE = (" + ab.map(function (v) { return n(v, 1); }).join(" + ") + ") / 3 = <b>" + n(mae) + "</b>" +
      "<br>Shrek pesa el <b>" + (sS ? Math.round(100 * sq[2] / sS) : 0) + " %</b> del MSE y el <b>" + (sA ? Math.round(100 * ab[2] / sA) : 0) + " %</b> del MAE.");
  }
  update();
});
