/* Experimento: cómo reparte un DataLoader un conjunto de N imágenes en lotes (batch_size, shuffle, drop_last)
   y cuántas actualizaciones de pesos hace por época. Las imágenes son de 1x16x16, como las de la CNN del laboratorio. */
(function () {
  function plan(N, B, dropLast) {
    var full = Math.floor(N / B), rest = N % B, batches = dropLast ? full : full + (rest ? 1 : 0);
    return { batches: batches, last: rest && !dropLast ? rest : (batches ? B : 0), dropped: dropLast ? rest : 0, hasPartial: !!rest && !dropLast };
  }
  var core = { plan: plan };
  if (typeof module !== "undefined" && module.exports) module.exports = core;
  if (typeof Lab === "undefined") return;

  Lab.register("curso5/c5m3-lotes", function (root, api) {
    var D = api.d, SIZES = [1, 8, 32, 64, 100, 128, 256];
    var S = { N: 1347, B: 100, drop: false, shuffle: true, E: 5, seed: 5 };
    function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }

    var view = api.view(root, { aspect: 2.6, minH: 150, maxH: 190, label: "Las muestras del conjunto, coloreadas según el lote al que pertenecen" });
    var ui = api.controls(root), out = api.readout(root);
    ui.slider({ label: "Muestras N", min: 100, max: 2000, step: 1, value: S.N, onInput: function (v) { S.N = v; update(); } });
    ui.slider({ label: "batch_size", min: 0, max: SIZES.length - 1, step: 1, value: SIZES.indexOf(S.B), fmt: function (v) { return SIZES[v]; }, onInput: function (v) { S.B = SIZES[v]; update(); } });
    ui.slider({ label: "Épocas", min: 1, max: 10, step: 1, value: S.E, onInput: function (v) { S.E = v; update(); } });
    ui.toggle({ label: "shuffle=True", value: true, onChange: function (v) { S.shuffle = v; update(); } });
    ui.toggle({ label: "drop_last=True", value: false, onChange: function (v) { S.drop = v; update(); } });
    ui.button("Otra época (nuevo orden)", function () { S.seed += 3; update(); }, "primary");

    function order() {
      var idx = [], i; for (i = 0; i < S.N; i++) idx.push(i);
      return S.shuffle ? api.rng(S.seed).shuffle(idx) : idx;
    }
    function draw(ctx, w, h, C) {
      var P = plan(S.N, S.B, S.drop), maxCells = 640, k = Math.max(1, Math.ceil(S.N / maxCells)), cells = Math.ceil(S.N / k);
      var cs = Math.max(4, Math.min(14, Math.sqrt(((w - 16) * (h - 44)) / cells))), cols = Math.floor((w - 16) / cs), rows = Math.ceil(cells / cols), x0 = (w - cols * cs) / 2, y0 = 8, i;
      var pal = [[C.cobaltoWash, C.cobalto], [C.terracotaWash, C.terracota], [C.olivaWash, C.oliva], [C.markerWash, C.marker]];
      for (i = 0; i < cells; i++) {
        var s0 = i * k, b = Math.floor(s0 / S.B), dropped = S.drop && b >= P.batches, partial = P.hasPartial && b === P.batches - 1;
        var x = x0 + (i % cols) * cs, y = y0 + Math.floor(i / cols) * cs;
        var col = dropped ? [C.paper, C.muted] : pal[b % 4];
        D.rect(ctx, x, y, cs - 1, cs - 1, col[0], partial ? C.ink : col[1], partial ? 1.5 : 0.8);
        if (dropped && cs >= 6) D.line(ctx, x + 1, y + 1, x + cs - 2, y + cs - 2, C.muted, 1);
      }
      var yb = y0 + rows * cs + 14;
      D.text(ctx, "una casilla = " + k + " muestra" + (k > 1 ? "s" : "") + " · colores alternos = lotes distintos", w / 2, Math.min(h - 20, yb), { size: 10, align: "center", color: C.muted });
      D.text(ctx, "borde negro = último lote incompleto · tachado = descartadas", w / 2, Math.min(h - 6, yb + 13), { size: 10, align: "center", color: C.muted });
    }
    view.draw(draw);

    function update() {
      var P = plan(S.N, S.B, S.drop), ord = order(), first = ord.slice(0, Math.min(S.B, 6)), t;
      t = "<code>DataLoader(dataset, batch_size=" + S.B + ", shuffle=" + (S.shuffle ? "True" : "False") + (S.drop ? ", drop_last=True" : "") + ")</code> con N = " + fmt(S.N) + "<br>" +
        "lotes por época = " + (S.drop ? "⌊" : "⌈") + S.N + " / " + S.B + (S.drop ? "⌋" : "⌉") + " = <b>" + P.batches + "</b> · cada lote: <b>(" + S.B + ", 1, 16, 16)</b> (" + fmt(S.B * 256 * 4) + " bytes) · último lote: <b>" + P.last + "</b> muestras" +
        (P.dropped ? " · descartadas: <b>" + P.dropped + "</b>" : "") + "<br>" +
        "actualizaciones de pesos en " + S.E + " época" + (S.E > 1 ? "s" : "") + ": " + P.batches + " × " + S.E + " = <b>" + fmt(P.batches * S.E) + "</b><br>" +
        "índices del primer lote: [" + first.join(", ") + (S.B > 6 ? ", …" : "") + "]" + (S.shuffle ? " (desordenados)" : " (en orden)");
      if (P.hasPartial && P.last === 1) t += "<br><span class='bad'>El último lote tiene 1 sola muestra: en entrenamiento, <code>nn.BatchNorm1d</code> falla («Expected more than 1 value per channel») y el gradiente es muy ruidoso. Solución: <code>drop_last=True</code>.</span>";
      else if (P.hasPartial && P.last < S.B / 2) t += "<br><span class='bad'>El último lote es pequeño (" + P.last + " frente a " + S.B + "): su gradiente es más ruidoso. <code>drop_last=True</code> lo evita a costa de ignorar " + P.last + " muestras en esa época.</span>";
      else if (!P.hasPartial && !P.dropped) t += "<br><span class='good'>N es múltiplo de batch_size: todos los lotes son iguales.</span>";
      out.set(t); view.redraw();
    }
    update();
  });
})();
