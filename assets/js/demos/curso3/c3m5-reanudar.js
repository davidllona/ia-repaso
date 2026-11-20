/* Experimento: «Continuar viendo». Se entrena un peso con Adam (lr 0,3) sobre la pérdida ½·w², con gradientes
   ruidosos (como los de un lote). Se corta en el paso k y se reanuda de tres formas:
   · sin corte (referencia);
   · con un .keras: pesos + estado de Adam (m, v y el contador de pasos) → sigue exactamente igual;
   · solo con los pesos (.weights.h5): Adam empieza con m = v = 0 y contador 0 → su primer paso mide ≈ lr entero
     y da un «tirón» que sube la pérdida varios órdenes de magnitud antes de volver a bajar. */
Lab.register("curso3/c3m5-reanudar", function (root, api) {
  var D = api.d, T = 200, LR = 0.3, B1 = 0.9, B2 = 0.999, EPS = 1e-7;
  var S = { corte: 100, seed: 3, ruido: [] };
  function genRuido() { var R = api.rng(S.seed * 31 + 5); S.ruido = []; for (var t = 0; t < T; t++) S.ruido.push(R.normal(0, 0.3)); }
  function correr(corte, modo) {
    var w = 5, m = 0, v = 0, t = 0, loss = [];
    for (var s = 0; s < T; s++) {
      if (s === corte && modo === "pesos") { m = 0; v = 0; t = 0; }
      loss.push(0.5 * w * w);
      var g = w + S.ruido[s];
      t++; m = B1 * m + (1 - B1) * g; v = B2 * v + (1 - B2) * g * g;
      var mh = m / (1 - Math.pow(B1, t)), vh = v / (1 - Math.pow(B2, t));
      w -= LR * mh / (Math.sqrt(vh) + EPS);
    }
    return loss;
  }
  var view = api.view(root, { aspect: 1.7, minH: 250, maxH: 400, label: "Pérdida por paso: sin corte, reanudando con .keras y reanudando solo con los pesos" });
  var pl = api.plot(view, { xr: [0, T], yr: [-4, 2], xticks: 4, yticks: 3, xlabel: "paso de entrenamiento", ylabel: "pérdida (escala log)", pad: { l: 52, r: 12, t: 12, b: 38 },
    xfmt: function (v) { return Math.round(v); }, yfmt: function (v) { return "1e" + Math.round(v); } });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Se va la luz en el paso", min: 20, max: 180, step: 5, value: S.corte, onInput: function (v) { S.corte = v; update(); } });
  ui.button("Otro ruido de los lotes", function () { S.seed = S.seed % 20 + 1; genRuido(); update(); }, "warm");
  api.legend(root, [[api.colors().cobalto, "reanudar con .keras (pesos + optimizador)"], [api.colors().terracota, "reanudar solo con los pesos"], [api.colors().ink, "sin corte (discontinua)"]]);
  var A, B, C;
  function lg(x) { return Math.max(-4, Math.min(2, Math.log10(Math.max(x, 1e-6)))); }
  function draw(ctx, w, h, Cc) {
    pl.axes(ctx);
    ctx.save(); pl.clip(ctx);
    function curva(arr, from, col, wd, dash) { var pts = []; for (var s = from; s < T; s++) pts.push([pl.x(s), pl.y(lg(arr[s]))]); D.path(ctx, pts, col, wd, dash); }
    curva(C, 0, Cc.terracota, 2.2);
    curva(B, 0, Cc.cobalto, 2.2);
    curva(A, 0, Cc.ink, 1.3, [5, 4]);
    D.line(ctx, pl.x(S.corte), pl.box.y, pl.x(S.corte), pl.box.y + pl.box.h, Cc.muted, 1.5, [3, 3]);
    ctx.restore();
    D.text(ctx, "corte", pl.x(S.corte) + 4, pl.box.y + 14, { size: 11, color: Cc.muted });
  }
  view.draw(draw);
  function update() {
    A = correr(-1, "nada"); B = correr(S.corte, "keras"); C = correr(S.corte, "pesos");
    var k = S.corte, maxC = 0, maxB = 0;
    for (var s = k; s < Math.min(T, k + 15); s++) { maxC = Math.max(maxC, C[s]); maxB = Math.max(maxB, B[s]); }
    var f = function (x) { return x.toExponential(1).replace(".", ","); };
    out.set("Corte en el paso <b>" + k + "</b>. Con <b>.keras</b> el contador de Adam sigue en " + k + " y la curva es idéntica a la de sin corte (peor pérdida en los 15 pasos siguientes: <b>" + f(maxB) + "</b>)." +
      (maxC / Math.max(maxB, 1e-9) < 2 ? "<br>Solo con pesos, el contador vuelve a 0 y Adam olvida sus medias, pero tan pronto apenas se nota: los gradientes aún son grandes. Corta más tarde."
        : "<br>Solo con pesos, el contador vuelve a 0 y Adam olvida sus medias: el primer paso mide unos " + LR.toString().replace(".", ",") + " enteros y la pérdida salta hasta <b class='bad'>" + f(maxC) + "</b>, unas " + Math.round(maxC / Math.max(maxB, 1e-9)) + " veces más."));
    view.redraw();
  }
  genRuido(); update();
});
