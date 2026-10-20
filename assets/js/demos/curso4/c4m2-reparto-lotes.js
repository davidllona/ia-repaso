/* Experimento: qué hace el DataLoader con N muestras numeradas. Tres épocas seguidas: con shuffle=True el orden cambia en cada una;
   con drop_last=True el último lote incompleto se descarta. Cada casilla es una muestra con su índice. */
Lab.register("curso4/c4m2-reparto-lotes", function (root, api) {
  var D = api.d, EP = 3;
  var S = { N: 10, B: 4, shuffle: true, drop: false, seed: 0 };
  var view = api.view(root, { aspect: 3.0, minH: 190, maxH: 250, label: "Las muestras repartidas en lotes durante tres épocas" });
  var ui = api.controls(root), out = api.readout(root);
  var sN = ui.slider({ label: "N muestras del dataset", min: 3, max: 24, step: 1, value: S.N, onInput: function (v) { S.N = v; if (S.B > v) { S.B = v; sB.set(v, true); } update(); } });
  var sB = ui.slider({ label: "batch_size", min: 1, max: 24, step: 1, value: S.B, onInput: function (v) { S.B = Math.min(v, S.N); update(); } });
  ui.toggle({ label: "shuffle=True", value: true, onChange: function (v) { S.shuffle = v; update(); } });
  ui.toggle({ label: "drop_last=True", value: false, onChange: function (v) { S.drop = v; update(); } });
  ui.button("Otra semilla", function () { S.seed++; update(); }, "primary");

  function epochs() {
    var res = [], e, k;
    for (e = 0; e < EP; e++) {
      var idx = []; for (k = 0; k < S.N; k++) idx.push(k);
      if (S.shuffle) api.rng(S.seed * 31 + e * 7 + 1).shuffle(idx);
      var batches = [];
      for (k = 0; k < S.N; k += S.B) batches.push(idx.slice(k, k + S.B));
      if (S.drop && batches.length && batches[batches.length - 1].length < S.B) batches.pop();
      res.push(batches);
    }
    return res;
  }
  function draw(ctx, w, h, C) {
    var E = epochs(), pad = 8, lab = 46, bgap = 7, nb = E[0].length + (S.drop ? 0 : 0);
    var totalW = w - pad * 2 - lab, ncells = S.N, nbMax = Math.ceil(S.N / S.B);
    var cs = Math.max(8, Math.min(40, (totalW - bgap * (nbMax - 1)) / ncells)), rowH = Math.min(cs + 16, (h - 28) / EP);
    var pal = [[C.cobaltoWash, C.cobalto], [C.terracotaWash, C.terracota], [C.olivaWash, C.oliva]];
    E.forEach(function (batches, e) {
      var y = 10 + e * rowH, x = pad + lab, kept = 0;
      D.text(ctx, "época " + e, pad, y + cs / 2 + 4, { size: 10.5, color: C.ink2, weight: 600 });
      batches.forEach(function (b, bi) {
        var col = pal[bi % 3], partial = b.length < S.B;
        b.forEach(function (idx, k) {
          var xx = x + k * cs;
          D.rect(ctx, xx, y, cs - 1.5, cs - 1.5, col[0], partial ? C.ink : col[1], partial ? 1.6 : 1);
          if (cs >= 13) D.text(ctx, String(idx), xx + (cs - 1.5) / 2, y + cs / 2 + 3, { size: cs >= 18 ? 12 : 9, color: C.ink, align: "center", mono: true });
        });
        x += b.length * cs + bgap; kept += b.length;
      });
      if (S.drop && kept < S.N) {
        var dropped = S.N - kept;
        for (var q = 0; q < dropped; q++) { var xx2 = x + q * cs; D.rect(ctx, xx2, y, cs - 1.5, cs - 1.5, C.paper, C.muted, 1); D.line(ctx, xx2, y, xx2 + cs - 1.5, y + cs - 1.5, C.muted, 1); }
      }
    });
    if (w >= 520) D.text(ctx, "cada color = un lote · borde negro = último lote incompleto · tachado = descartadas", w / 2, h - 5, { size: 10, color: C.muted, align: "center" });
    else {
      D.text(ctx, "cada color = un lote · borde negro = último incompleto", w / 2, h - 15, { size: 9, color: C.muted, align: "center" });
      D.text(ctx, "tachado = descartadas (drop_last)", w / 2, h - 4, { size: 9, color: C.muted, align: "center" });
    }
  }
  view.draw(draw);

  function update() {
    var E = epochs(), nb = E[0].length, last = E[0].length ? E[0][nb - 1].length : 0, full = Math.floor(S.N / S.B), rest = S.N % S.B;
    var first = E[0][0] ? E[0][0] : [];
    out.set("<code>DataLoader(ds, batch_size=" + S.B + ", shuffle=" + (S.shuffle ? "True" : "False") + (S.drop ? ", drop_last=True" : "") + ")</code> con N = " + S.N + "<br>" +
      "<code>len(cargador)</code> = " + (S.drop ? "⌊" : "⌈") + S.N + " / " + S.B + (S.drop ? "⌋" : "⌉") + " = <b>" + nb + "</b> lotes por época (" + full + " completos" + (rest && !S.drop ? " + 1 de " + rest : "") + ")" +
      (S.drop && rest ? " · muestras que esta época se ignoran: <b>" + rest + "</b>" : "") + "<br>" +
      "primer lote de la época 0: <b>(" + first.length + ", 1)</b> con muestras [" + first.join(", ") + "]" +
      " · pasos de gradiente en 3 épocas: <b>" + nb * EP + "</b>" +
      (!S.shuffle ? "<br><span class='bad'>Sin shuffle las tres épocas son idénticas: si el dataset está ordenado por clase, el modelo ve primero todo un tipo y luego otro.</span>" : "<br><span class='good'>Con shuffle cada época reparte las muestras en lotes distintos, y cada muestra aparece una sola vez por época.</span>") +
      (!S.drop && rest === 1 ? "<br><span class='bad'>El último lote tiene 1 sola muestra: gradiente muy ruidoso y fallo en BatchNorm. Usa drop_last=True.</span>" : ""));
    view.redraw();
  }
  update();
});
