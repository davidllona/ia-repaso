/* Experimento: cuántos parámetros tiene una red profunda (64 entradas → L capas ocultas de W neuronas → 10 salidas),
   comparada con UNA sola capa oculta con las mismas neuronas en total; y qué pasa si las capas van en una lista de Python. */
Lab.register("curso5/c5m2-capas-parametros", function (root, api) {
  var D = api.d;
  var S = { L: 3, W: 32, bn: false, cont: "modulelist" };
  function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }

  function layers(L, W, bn) {
    var rows = [], nin = 64, i;
    for (i = 0; i < L; i++) {
      var p = nin * W + (bn ? 2 * W : W);
      rows.push({ name: "capas." + i, shape: nin + "→" + W, p: p });
      nin = W;
    }
    rows.push({ name: "salida", shape: nin + "→10", p: nin * 10 + 10 });
    return rows;
  }

  var view = api.view(root, { aspect: 1.3, minH: 330, maxH: 380, label: "Parámetros de cada capa de la red profunda y de la red de una sola capa oculta equivalente" });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Capas ocultas (L)", min: 1, max: 10, step: 1, value: S.L, onInput: function (v) { S.L = v; update(); } });
  ui.slider({ label: "Neuronas por capa (W)", min: 4, max: 128, step: 4, value: S.W, onInput: function (v) { S.W = v; update(); } });
  ui.segmented({ label: "Dónde guardas las capas", value: S.cont, options: [["modulelist", "nn.ModuleList"], ["lista", "lista de Python"]], onChange: function (v) { S.cont = v; update(); } });
  ui.toggle({ label: "BatchNorm tras cada capa oculta", value: S.bn, onChange: function (v) { S.bn = v; update(); } });
  api.legend(root, [[api.colors().cobalto, "red profunda (L capas de W neuronas)"], [api.colors().terracota, "una sola capa oculta con L·W neuronas"]]);

  function draw(ctx, w, h, C) {
    var rows = layers(S.L, S.W, S.bn), tot = rows.reduce(function (a, r) { return a + r.p; }, 0);
    var wide = S.L * S.W, pw = 64 * wide + wide + wide * 10 + 10;
    var all = rows.concat([{ name: "1 capa ancha", shape: "64→" + wide + "→10", p: pw, wide: true }]);
    var maxp = Math.max.apply(null, all.map(function (r) { return r.p; }));
    var labW = Math.min(118, w * 0.34), rowH = Math.min(30, (h - 16) / (all.length + 0.6)), top = Math.max(8, (h - rowH * (all.length + 0.6)) / 2), barX = labW + 6, barW = w - barX - 8, i;
    var dead = S.cont === "lista";
    for (i = 0; i < all.length; i++) {
      var r = all[i], y = top + rowH * (i + (r.wide ? 0.6 : 0)), bh = Math.min(18, rowH * 0.66);
      var col = r.wide ? C.terracota : (dead ? C.muted : C.cobalto);
      D.text(ctx, r.name, 4, y + bh * 0.5 + 4, { size: 11.5, mono: true, color: C.ink2 });
      if (w > 330 && !r.wide) D.text(ctx, r.shape, labW - 2, y + bh * 0.5 + 4, { size: 10.5, mono: true, color: C.muted, align: "right" });
      var bw = Math.max(2, barW * r.p / maxp);
      D.rect(ctx, barX, y, bw, bh, col, null);
      var txt = fmt(r.p), tw = txt.length * 6.6 + 8, inside = bw > tw + 6;
      D.text(ctx, txt, inside ? barX + bw - 4 : barX + bw + 4, y + bh * 0.5 + 4, { size: 11, mono: true, color: inside ? C.paper : C.ink, align: inside ? "right" : "left", weight: 500 });
    }
    D.line(ctx, 4, top + rowH * (all.length - 1 + 0.3), w - 4, top + rowH * (all.length - 1 + 0.3), C.line, 1, [3, 3]);
    if (dead) D.text(ctx, "model.parameters() no las ve", w - 6, h - 4, { size: 11, color: C.terracotaInk, align: "right", weight: 600 });
  }
  view.draw(draw);

  function update() {
    var rows = layers(S.L, S.W, S.bn), tot = rows.reduce(function (a, r) { return a + r.p; }, 0);
    var wide = S.L * S.W, pw = 64 * wide + wide + wide * 10 + 10, buf = S.bn ? 2 * S.W * S.L : 0;
    var masUna = S.W * S.W + (S.bn ? 2 * S.W : S.W), dobleW = layers(S.L, Math.min(2 * S.W, 256), S.bn).reduce(function (a, r) { return a + r.p; }, 0);
    var s = "Red profunda: <b>" + fmt(tot) + "</b> parámetros (" + fmt(tot * 4) + " bytes en float32) · una sola capa oculta de <b>" + wide + "</b> neuronas: <b>" + fmt(pw) + "</b> (<b>" + (pw / tot).toFixed(2) + "×</b> los de la profunda)" +
      "<br>Añadir <b>una capa más</b> de " + S.W + " neuronas cuesta <b>+" + fmt(masUna) + "</b>; <b>duplicar el ancho</b> a " + Math.min(2 * S.W, 256) + " lleva el total a <b>" + fmt(dobleW) + "</b> (" + (dobleW / tot).toFixed(1) + "×).";
    if (S.bn) s += "<br>Además hay " + fmt(buf) + " valores en buffers (running_mean y running_var): se guardan en state_dict pero <b>no</b> son parámetros.";
    if (S.cont === "lista") s += "<br><span class='bad'>Con una lista normal de Python: <b>len(list(model.parameters())) = 0</b>. torch.optim.SGD(...) lanza ValueError: optimizer got an empty parameter list, y state_dict() sale vacío.</span>";
    else s += "<br><span class='good'>Con nn.ModuleList: model.parameters() devuelve <b>" + (2 * (S.L + 1) + (S.bn ? 2 * S.L : 0)) + "</b> tensores (peso y bias, o peso y bias de BatchNorm, de cada capa) y el optimizador los actualiza.</span>";
    out.set(s); view.redraw();
  }
  update();
});
