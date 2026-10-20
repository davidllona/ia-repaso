/* Experimento: época, batch, mini-batch e iteración. 24 ejemplos; modelo ŷ = w·x con w = 0,5 fijo. Cada batch da una
   estimación (ruidosa) del gradiente de TODO el dataset; cuanto más pequeño el batch, más ruido y más iteraciones por época.
   Disfraz: cada uno de los 24 ejemplos es una película (x = nota de la crítica, y = tu nota, ≈ el doble). */
Lab.register("curso2/c2m1-batches", function (root, api) {
  var M = api.math, D = api.d, C0 = api.colors();
  var N = 24, W = 0.5;
  var r0 = api.rng(7), X = [], Y = [], i;
  for (i = 0; i < N; i++) { var x = r0.range(0.5, 3); X.push(x); Y.push(2 * x + r0.normal(0, 0.5)); }
  var g = X.map(function (x, k) { return 2 * (W * x - Y[k]) * x; });      // gradiente de cada ejemplo (dMSE/dw)
  var gTrue = M.mean(g);
  var S = { B: 4, seed: 1, order: [], k: 0 };

  function newEpoch() { var r = api.rng(100 + S.seed++); S.order = r.shuffle(X.map(function (_, i) { return i; })); S.k = 0; }
  function batches() { var out = [], B = S.B; for (var i = 0; i < N; i += B) out.push(S.order.slice(i, i + B)); return out; }
  function bgrad(b) { return M.mean(b.map(function (i) { return g[i]; })); }

  var view1 = api.view(root, { aspect: 4.6, minH: 100, maxH: 150, label: "Las 24 películas del catálogo de ejemplo y el batch actual" });
  var view2 = api.view(root, { aspect: 2.5, minH: 190, maxH: 330, label: "Gradiente estimado por cada batch frente al gradiente verdadero" });
  var gmin = Math.floor((Math.min.apply(null, g) - 2) / 5) * 5, gmax = Math.ceil((Math.max.apply(null, g) + 2) / 5) * 5;   // límites redondos (marcas cada 5)
  var plot2 = api.plot(view2, { xr: [gmin, gmax], yr: [0, 1], xticks: Math.round((gmax - gmin) / 5), yticks: 1, xlabel: "gradiente dL/dw estimado con el batch", pad: { l: 14, r: 14, t: 12, b: 36 }, grid: false, xfmt: function (v) { return Math.round(v); }, yfmt: function () { return ""; } });
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.72rem, 2.7vw, .84rem)";
  ui.select({ label: "Tamaño del batch (batch_size)", value: 4, options: [[1, "1 (SGD puro)"], [2, "2"], [3, "3"], [4, "4"], [5, "5 (el último, más pequeño)"], [6, "6"], [8, "8"], [12, "12"], [24, "24 (todo el dataset)"]],
    onChange: function (v) { S.B = parseInt(v, 10); newEpoch(); update(); } });
  ui.button("Siguiente iteración", function () { var nb = batches().length; if (S.k >= nb) newEpoch(); S.k++; update(); }, "primary");
  ui.button("Terminar la época", function () { S.k = batches().length; update(); });
  ui.button("Nueva época (otro orden)", function () { newEpoch(); update(); });
  api.legend(root, [[C0.terracota, "películas del batch de esta iteración"], [C0.oliva, "ya vistas por la red en esta época"], [C0.muted, "pendientes"]]);

  function drawGrid(ctx, w, h, C) {
    var bs = batches(), cur = S.k > 0 ? bs[S.k - 1] : [], used = {}, k, cols = 12, rows = 2, gap = 4;
    for (k = 0; k < S.k - 1; k++) bs[k].forEach(function (i) { used[i] = 1; });
    var cw = Math.min(54, (w - 24 - gap * (cols - 1)) / cols), ch = Math.min(30, (h - 16 - gap) / rows);
    var x0 = (w - (cw * cols + gap * (cols - 1))) / 2, y0 = (h - (ch * rows + gap)) / 2;
    // el orden de la época decide la posición de cada ejemplo en la rejilla
    S.order.forEach(function (idx, pos) {
      var cx = x0 + (pos % cols) * (cw + gap), cy = y0 + Math.floor(pos / cols) * (ch + gap);
      var isCur = cur.indexOf(idx) >= 0, isUsed = !!used[idx];
      D.rect(ctx, cx, cy, cw, ch, isCur ? C.terracota : isUsed ? C.oliva : C.paper, isCur ? C.ink : C.muted, isCur ? 2 : 1);
      D.text(ctx, String(idx + 1), cx + cw / 2, cy + ch / 2 + 4, { size: 11, mono: true, align: "center", color: isCur || isUsed ? C.paper : C.muted, weight: 600 });
    });
  }
  function drawG(ctx, w, h, C) {
    var bs = batches(), nb = bs.length, b = plot2.box, k;
    plot2.axes(ctx);
    var rowH = Math.min(28, (b.h - 16) / Math.max(nb, 1));
    ctx.save(); plot2.clip(ctx);
    D.line(ctx, plot2.x(gTrue), b.y, plot2.x(gTrue), b.y + b.h, C.cobalto, 2.5);
    for (k = 0; k < Math.min(S.k, nb); k++) {
      var gv = bgrad(bs[k]), yy = b.y + 10 + k * rowH + rowH / 2;
      D.circle(ctx, plot2.x(gv), yy, Math.min(5.5, rowH / 2 + 1.5), k === S.k - 1 ? C.terracota : C.oliva, C.ink, k === S.k - 1 ? 1.8 : 1);
    }
    ctx.restore();
    D.text(ctx, "verdadero = " + gTrue.toFixed(1), plot2.x(gTrue) + (gTrue > (gmin + gmax) / 2 ? -8 : 8), b.y + b.h - 8, { size: 11, weight: 600, color: C.cobaltoInk, align: gTrue > (gmin + gmax) / 2 ? "right" : "left" });
  }

  function update() {
    var bs = batches(), nb = bs.length, done = Math.min(S.k, nb);
    var gs = bs.slice(0, done).map(bgrad), sd = gs.length > 1 ? M.std(gs) : 0;
    var all = bs.map(bgrad), sdAll = M.std(all);
    out.set(
      "N = <b>" + N + "</b> películas · batch_size = <b>" + S.B + "</b> → iteraciones por época = ⌈" + N + " / " + S.B + "⌉ = <b>" + nb + "</b> " +
      "(cada iteración = 1 actualización de pesos)<br>" +
      "Iteración " + done + " de " + nb + " en esta época" + (done > 0 ? " · gradiente de este batch = <b>" + gs[done - 1].toFixed(2) + "</b> (el verdadero es " + gTrue.toFixed(2) + ")" : "") + "<br>" +
      "Dispersión de las estimaciones de la época (desv. típica): <b>" + sdAll.toFixed(2) + "</b>" +
      (S.B === N ? "<br>Con batch = dataset siempre sale el gradiente exacto, pero solo hay 1 actualización por época." :
        S.B === 1 ? "<br>Con 1 película por batch hay " + N + " actualizaciones por época, pero cada una es muy ruidosa." :
        "<br>10 épocas = " + (10 * nb) + " actualizaciones con este batch_size.") +
      (done === nb && nb > 0 ? "<br><span class='good'>Época completa: la red ha visto las " + N + " películas exactamente una vez.</span>" : "")
    );
    view1.redraw(); view2.redraw();
  }
  newEpoch(); view1.draw(drawGrid); view2.draw(drawG); update();
});
