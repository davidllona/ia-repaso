/* Experimento: collate_fn. El DataLoader recibe una lista de muestras y debe convertirla en un lote.
   (a) muestras del mismo tamaño → torch.stack añade una dimensión delante; (b) longitudes distintas → error, o relleno (padding) con collate_fn propia. */
Lab.register("curso4/c4m2-collate", function (root, api) {
  var D = api.d, M = api.math;
  var FR = [[5, 2, 9], [7, 1], [3, 8, 4, 6], [2], [4, 4, 1, 5, 3], [6, 9]];
  var S = { mode: "pad", B: 3, same: false, C: 1, Hh: 8, W: 8 };
  var view = api.view(root, { aspect: 2.4, minH: 230, maxH: 330, label: "Muestras (subtítulos o pósters) y lote resultante" });
  var ui = api.controls(root), out = api.readout(root);
  ui.segmented({ label: "Tipo de muestra", options: [["seq", "subtítulos (frases de longitud variable)"], ["img", "pósters (tamaño fijo)"]], value: "seq", onChange: function (v) { S.type = v; update(); } });
  ui.segmented({ label: "collate_fn", options: [["def", "por defecto"], ["pad", "con padding"]], value: "pad", onChange: function (v) { S.mode = v; update(); } });
  ui.slider({ label: "batch_size B", min: 1, max: 6, step: 1, value: S.B, onInput: function (v) { S.B = v; update(); } });
  ui.slider({ label: "canales C (pósters)", min: 1, max: 3, step: 1, value: 1, onInput: function (v) { S.C = v; update(); } });
  ui.slider({ label: "alto = ancho (pósters)", min: 4, max: 32, step: 4, value: 8, onInput: function (v) { S.Hh = v; S.W = v; update(); } });
  S.type = "seq";

  function drawSeq(ctx, w, h, C) {
    var B = S.B, maxL = 0, k, j, items = FR.slice(0, B);
    items.forEach(function (f) { maxL = Math.max(maxL, f.length); });
    var padW = 8, lab = 78, cs = Math.max(16, Math.min(34, (w - padW * 2 - lab) / Math.max(maxL, 5))), rowH = Math.min(cs + 6, (h - 70) / B);
    D.text(ctx, "muestras que saca __getitem__", padW, 14, { size: 10.5, color: C.muted });
    var lens = items.map(function (f) { return f.length; }), allSame = lens.every(function (l) { return l === lens[0]; });
    items.forEach(function (f, i) {
      var y = 24 + i * rowH;
      D.text(ctx, "frase " + i + " (L=" + f.length + ")", padW, y + rowH / 2 + 1, { size: 10, color: C.ink2, mono: true });
      f.forEach(function (v, j2) { var x = padW + lab + j2 * cs; D.rect(ctx, x, y, cs - 2, rowH - 3, C.cobaltoWash, C.cobalto, 1); D.text(ctx, String(v), x + cs / 2 - 1, y + rowH / 2 + 4, { size: 11, color: C.ink, align: "center", mono: true }); });
    });
    var yb = 24 + B * rowH + 12;
    if (S.mode === "def" && !allSame) {
      var bad = 1; while (lens[bad] === lens[0]) bad++;
      D.text(ctx, "RuntimeError: stack expects each tensor to be equal size,", padW, yb + 12, { size: w < 520 ? 10 : 11.5, color: C.terracotaInk, weight: 600 });
      D.text(ctx, "but got [" + lens[0] + "] at entry 0 and [" + lens[bad] + "] at entry " + bad, padW, yb + 28, { size: w < 520 ? 10 : 11.5, color: C.terracotaInk, weight: 600 });
    } else if (S.mode === "def") {
      D.text(ctx, "todas miden " + lens[0] + ": torch.stack funciona → lote de forma (" + B + ", " + lens[0] + ")", padW, yb + 12, { size: 11, color: C.olivaInk, weight: 600 });
    } else {
      D.text(ctx, "lote tras pad_sequence(batch_first=True) → forma (" + B + ", " + maxL + ")", padW, yb + 4, { size: 10.5, color: C.ink2 });
      items.forEach(function (f, i) {
        var y = yb + 10 + i * Math.min(rowH * 0.75, 22);
        for (j = 0; j < maxL; j++) {
          var x = padW + lab + j * cs, real = j < f.length, hh = Math.min(rowH * 0.75, 22) - 2;
          D.rect(ctx, x, y, cs - 2, hh, real ? C.cobaltoWash : C.terracotaWash, real ? C.cobalto : C.terracota, 1);
          D.text(ctx, real ? String(f[j]) : "0", x + cs / 2 - 1, y + hh / 2 + 4, { size: 10.5, color: real ? C.ink : C.terracotaInk, align: "center", mono: true, weight: real ? 400 : 700 });
        }
      });
    }
  }
  function drawImg(ctx, w, h, C) {
    var B = S.B, pad = 10, sz = Math.min(70, (w - pad * 2) / (B + 1.4)), k;
    D.text(ctx, B + " muestras, cada una de forma (" + S.C + ", " + S.Hh + ", " + S.W + ")", pad, 14, { size: 11, color: C.ink2, weight: 600 });
    for (k = 0; k < B; k++) {
      var x = pad + k * (sz * 0.55 + 4) + 0, y = 28 + k * 3;
      for (var c = 0; c < S.C; c++) D.rect(ctx, x + c * 4, y - c * 4 + 8, sz * 0.8, sz * 0.8, c % 2 ? C.terracotaWash : C.cobaltoWash, c % 2 ? C.terracota : C.cobalto, 1);
    }
    var yb = 28 + sz + 34;
    D.text(ctx, "torch.stack(muestras, dim=0) → crea una dimensión NUEVA delante:", pad, yb, { size: 11, color: C.ink2 });
    D.text(ctx, "(B, C, H, W) = (" + B + ", " + S.C + ", " + S.Hh + ", " + S.W + ")", pad, yb + 22, { size: 15, color: C.cobaltoInk, weight: 700, mono: true });
    D.text(ctx, "el lote ocupa " + (B * S.C * S.Hh * S.W * 4).toLocaleString("es-ES") + " bytes en float32", pad, yb + 42, { size: 11, color: C.muted });
  }
  view.draw(function (ctx, w, h, C) { if (S.type === "img") drawImg(ctx, w, h, C); else drawSeq(ctx, w, h, C); });

  function update() {
    var t;
    if (S.type === "img") {
      t = "Las <code>B</code> muestras tienen exactamente la misma forma, así que la <code>collate_fn</code> por defecto hace <code>torch.stack</code>: el lote tiene <b>una dimensión más</b> que cada muestra, al principio. Las etiquetas (enteros) se convierten en un tensor de forma <b>(" + S.B + ",)</b> y tipo <code>int64</code>.";
    } else {
      var items = FR.slice(0, S.B), lens = items.map(function (f) { return f.length; }), maxL = Math.max.apply(null, lens), real = lens.reduce(function (a, b) { return a + b; }, 0), total = S.B * maxL;
      if (S.mode === "def") t = lens.every(function (l) { return l === lens[0]; }) ? "Con B = " + S.B + " todas las frases miden " + lens[0] + " y el apilado funciona. Prueba con B = 2 o más." : "La <code>collate_fn</code> por defecto exige que todas las muestras tengan el mismo tamaño. Con longitudes " + lens.join(", ") + " no puede apilarlas.";
      else t = "Longitudes: " + lens.join(", ") + " → se rellena hasta <b>" + maxL + "</b> con ceros (<code>padding_value=0</code>). Lote <b>(" + S.B + ", " + maxL + ")</b>: " + real + " valores reales y <b>" + (total - real) + "</b> de relleno (" + Math.round((total - real) / total * 100) + " %). Se guardan las longitudes reales <code>" + JSON.stringify(lens) + "</code> para que el modelo ignore el relleno.";
    }
    view.redraw(); out.set(t);
  }
  update();
});
