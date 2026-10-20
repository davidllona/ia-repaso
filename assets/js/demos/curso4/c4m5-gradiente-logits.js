/* Experimento: el gradiente de la entropía cruzada respecto a los logits es p − y. Cada paso de descenso
   z ← z − lr·(p − y) sube el logit de la clase correcta y baja los demás (y la suma del gradiente es 0). */
Lab.register("curso4/c4m5-gradiente-logits", function (root, api) {
  var D = api.d, M = api.math, K = 4, NAMES = ["acción", "comedia", "terror", "animación"];
  var Z0 = [0.5, 1.5, -0.5, 0];
  var S = { z: Z0.slice(), t: 0, lr: 1, n: 0 };
  var view = api.view(root, { aspect: 1.7, minH: 200, maxH: 300, label: "Logits, probabilidades y gradiente p menos y de cuatro géneros: acción, comedia, terror y animación" });
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.68rem, 2.5vw, .8rem)";
  ui.select({ label: "género real (y)", value: "0", options: [["0", "acción (clase 0)"], ["1", "comedia (clase 1)"], ["2", "terror (clase 2)"], ["3", "animación (clase 3)"]], onChange: function (v) { S.t = +v; update(); } });
  ui.slider({ label: "tasa de aprendizaje lr", min: 0.1, max: 4, step: 0.1, value: 1, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.lr = v; update(); } });
  function step() { var p = M.softmax(S.z), k; for (k = 0; k < K; k++) S.z[k] -= S.lr * (p[k] - (k === S.t ? 1 : 0)); S.n++; }
  ui.button("Un paso", function () { step(); update(); }, "primary");
  ui.button("10 pasos", function () { for (var i = 0; i < 10; i++) step(); update(); });
  ui.button("Volver a los logits iniciales", function () { S.z = Z0.slice(); S.n = 0; update(); });
  function cl(C) { return [C.cobalto, C.terracota, C.oliva, C.marker]; }
  view.draw(function (ctx, w, h, C) {
    var p = M.softmax(S.z), g = p.map(function (v, k) { return v - (k === S.t ? 1 : 0); }), colors = cl(C), k;
    var x0 = 62, cw = (w - x0 - 6) / 3, top = 30, rh = (h - top - 6) / K, bh = Math.min(16, rh - 16);
    var zmax = Math.max(3, Math.max.apply(null, S.z.map(Math.abs))), heads = ["logits z", "p = softmax(z)", "gradiente p − y"];
    heads.forEach(function (t, c) { D.text(ctx, t, x0 + cw * c + cw / 2, 16, { size: 11, weight: 700, align: "center", color: C.ink2 }); });
    for (k = 0; k < K; k++) {
      var y = top + k * rh;
      D.text(ctx, NAMES[k], x0 - 6, y + bh / 2 + 4, { size: 11, weight: 700, align: "right", color: k === S.t ? C.oliva : C.ink });
      // columna 1: z (divergente)
      var c0 = x0 + cw * 0 + cw / 2, half = cw / 2 - 8;
      D.line(ctx, c0, y - 2, c0, y + bh + 2, C.muted, 1);
      var zw = half * S.z[k] / zmax; D.rect(ctx, Math.min(c0, c0 + zw), y, Math.abs(zw), bh, colors[k]);
      D.text(ctx, S.z[k].toFixed(2).replace("-", "−"), c0, y + bh + 11, { size: 10, mono: true, align: "center", color: C.ink2 });
      // columna 2: p
      var c1 = x0 + cw + 8, wmax = cw - 16;
      D.rect(ctx, c1, y, wmax, bh, C.surface, C.line, 1); D.rect(ctx, c1, y, Math.max(1, wmax * p[k]), bh, colors[k]);
      D.text(ctx, p[k].toFixed(3), c1 + wmax / 2, y + bh + 11, { size: 10, mono: true, align: "center", color: C.ink2 });
      // columna 3: gradiente
      var c2 = x0 + cw * 2 + cw / 2, gw = half * g[k];
      D.line(ctx, c2, y - 2, c2, y + bh + 2, C.muted, 1);
      D.rect(ctx, Math.min(c2, c2 + gw), y, Math.abs(gw), bh, g[k] < 0 ? C.oliva : C.terracota);
      D.text(ctx, g[k].toFixed(3).replace("-", "−"), c2, y + bh + 11, { size: 10, mono: true, align: "center", color: C.ink2 });
    }
  });
  function update() {
    var p = M.softmax(S.z), g = p.map(function (v, k) { return v - (k === S.t ? 1 : 0); }), L = -Math.log(p[S.t]);
    out.set("Paso <b>" + S.n + "</b> · género real = <b>" + NAMES[S.t] + " (" + S.t + ")</b> · p<sub>" + S.t + "</sub> = <b>" + p[S.t].toFixed(4) + "</b> · pérdida = −ln p<sub>" + S.t + "</sub> = <b>" + L.toFixed(4) + "</b><br>" +
      "gradiente p − y = (" + g.map(function (v) { return v.toFixed(3).replace("-", "−"); }).join(", ") + ") · suma = <b>" + Math.abs(M.sum(g)).toFixed(3) + "</b> · ln K = " + Math.log(K).toFixed(3));
    view.redraw();
  }
  update();
});
