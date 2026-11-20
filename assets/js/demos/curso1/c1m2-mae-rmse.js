/* Experimento: mismo MAE, distinto RMSE. Cinco errores que siempre suman 25 (MAE = 5).
   Un slider pasa de «todos fallan 5» a «cuatro fallan 1 y uno falla 21»: el MAE no se mueve
   y el RMSE sube, porque el cuadrado agranda el fallo gordo. */
Lab.register("curso1/c1m2-mae-rmse", function (root, api) {
  var A = [5, 5, 5, 5, 5], B = [1, 1, 1, 1, 21], t = 0;
  var view = api.view(root, { aspect: 1.5, minH: 270, maxH: 380, label: "Cinco barras con el error de cada película y dos medidores: MAE y RMSE" });
  var ui = api.controls(root), out = api.readout(root);
  var s = ui.slider({ label: "Cómo se reparte el error", min: 0, max: 1, step: 0.01, value: 0,
    fmt: function (v) { return v < 0.02 ? "repartido" : v > 0.98 ? "en una sola" : Math.round(v * 100) + " %"; },
    onInput: function (v) { t = v; update(); } });
  ui.button("Todos fallan 5", function () { anim(0); });
  ui.button("Uno falla 21", function () { anim(1); }, "primary");

  var loop = null;
  function anim(to) {
    if (loop) loop.stop();
    if (api.reduceMotion) { t = to; s.set(t, true); update(); return; }
    loop = api.loop(function (dt) {
      var d = to - t, step = Math.sign(d) * Math.min(Math.abs(d), dt * 1.2);
      t += step; s.set(t, true); update();
      return Math.abs(to - t) > 1e-3;
    });
    loop.start();
  }
  function errs() { return A.map(function (a, i) { return a + (B[i] - a) * t; }); }
  function stats() {
    var e = errs(), mae = api.math.mean(e), mse = api.math.mean(e.map(function (v) { return v * v; }));
    return { e: e, mae: mae, mse: mse, rmse: Math.sqrt(mse) };
  }

  function draw(ctx, w, h, C) {
    var D = api.d, st = stats(), narrow = w < 430;
    var top = 26, base = h * 0.56, maxE = 22, x0 = 34, x1 = w - 12, bw = (x1 - x0) / 5;
    D.text(ctx, "Error de cada película (miles de horas)", x0, 16, { color: C.ink2, size: narrow ? 11 : 12 });
    D.line(ctx, x0, base, x1, base, C.line, 1);
    st.e.forEach(function (v, i) {
      var bh = (base - top) * v / maxE, x = x0 + i * bw + bw * 0.18, ww = bw * 0.64;
      D.rect(ctx, x, base - bh, ww, bh, i === 4 ? C.terracota : C.cobalto);
      D.text(ctx, v.toFixed(1).replace(".", ","), x + ww / 2, base - bh - 5, { size: 11, align: "center", mono: true, color: C.ink });
      D.text(ctx, String(i + 1), x + ww / 2, base + 14, { size: 11, align: "center", color: C.muted });
    });
    // medidores
    var mx0 = narrow ? 60 : 70, mx1 = w - 60, scale = function (v) { return mx0 + (mx1 - mx0) * v / 10; };
    function meter(y, name, v, col) {
      D.text(ctx, name, 8, y + 5, { size: 12, weight: 600, color: C.ink });
      D.rect(ctx, mx0, y - 8, mx1 - mx0, 16, C.surface, C.line, 1);
      D.rect(ctx, mx0, y - 8, scale(v) - mx0, 16, col);
      D.text(ctx, v.toFixed(2).replace(".", ","), mx1 + 6, y + 5, { size: 12, mono: true, color: C.ink, weight: 600 });
    }
    meter(h * 0.72, "MAE", st.mae, C.cobalto);
    meter(h * 0.88, "RMSE", st.rmse, C.terracota);
  }
  function update() {
    view.redraw();
    var st = stats(), f = function (v) { return v.toFixed(2).replace(".", ","); };
    out.set("Errores: <b>" + st.e.map(function (v) { return v.toFixed(1).replace(".", ","); }).join(" · ") + "</b> (suman 25)<br>" +
      "MAE = 25 / 5 = <b>" + f(st.mae) + "</b> · MSE = <b>" + f(st.mse) + "</b> · RMSE = √MSE = <b>" + f(st.rmse) + "</b><br>" +
      (t < 0.02 ? "Todos fallan igual: <span class='good'>MAE y RMSE coinciden</span>." :
       "El MAE no se ha movido. El RMSE ha subido <b>" + f(st.rmse - st.mae) + "</b>: <span class='bad'>delata el fallo gordo</span>."));
  }
  view.draw(draw); update();
  return { destroy: function () { if (loop) loop.stop(); } };
});
