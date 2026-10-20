/* Experimento: qué capas se congelan en transfer learning / fine-tuning. Cuerpo VGG16 (13 convoluciones)
   + cabeza nueva (GlobalAveragePooling + Dense(5)). Se cuentan parámetros entrenables y congelados de verdad. */
Lab.register("curso3/c3m2-congelar-capas", function (root, api) {
  var CLASSES = 5;
  var spec = [[64, 3], [64, 64], "p", [128, 64], [128, 128], "p", [256, 128], [256, 256], [256, 256], "p", [512, 256], [512, 512], [512, 512], "p", [512, 512], [512, 512], [512, 512], "p"];
  var layers = [], blk = 1, ci = 0;
  spec.forEach(function (s) {
    if (s === "p") { layers.push({ name: "pool" + blk, params: 0, conv: false }); blk++; ci = 0; }
    else { ci++; layers.push({ name: "block" + blk + "_conv" + ci, params: (9 * s[1] + 1) * s[0], conv: true }); }
  });
  var convIdx = []; layers.forEach(function (L, i) { if (L.conv) convIdx.push(i); });
  var headParams = 512 * CLASSES + CLASSES;
  var st = { N: 0, data: "few", sim: "high" };

  function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " "); }
  function trainableSet() {
    var set = {}, k; for (k = 0; k < st.N; k++) set[convIdx[convIdx.length - 1 - k]] = true;
    return set;
  }
  function totals() {
    var set = trainableSet(), tr = headParams, fr = 0;
    layers.forEach(function (L, i) { if (set[i]) tr += L.params; else fr += L.params; });
    return { tr: tr, fr: fr, set: set };
  }

  var view = api.view(root, { aspect: 1.3, minH: 420, maxH: 470, label: "Lista de capas del cuerpo VGG16 con las congeladas y las entrenables" });
  var ui = api.controls(root), out = api.readout(root);
  var sl = ui.slider({ label: "Capas convolucionales descongeladas (las últimas)", min: 0, max: 13, step: 1, value: 0, onInput: function (v) { st.N = v; update(); } });
  ui.select({ label: "Datos propios", options: [["few", "pocos (cientos de imágenes)"], ["many", "muchos (decenas de miles)"]], value: "few", onChange: function (v) { st.data = v; update(); } });
  ui.select({ label: "Parecido con ImageNet", options: [["high", "alto (animales, objetos, coches…)"], ["low", "bajo (rayos X, satélite, microscopio)"]], value: "high", onChange: function (v) { st.sim = v; update(); } });
  ui.button("Aplicar la recomendación", function () { var r = reco(); st.N = r.N; sl.set(r.N, true); update(); }, "primary");
  ui.button("Congelar todo el cuerpo", function () { st.N = 0; sl.set(0, true); update(); });
  ui.button("Descongelarlo todo", function () { st.N = 13; sl.set(13, true); update(); });

  function reco() {
    if (st.data === "few" && st.sim === "high") return { N: 0, lr: "1e-3 (solo la cabeza)", why: "Extracción de características: el cuerpo ya sabe ver y tú tienes pocas imágenes; descongelar solo invita al sobreajuste." };
    if (st.data === "few" && st.sim === "low") return { N: 3, lr: "cabeza 1e-3; después 1e-5", why: "Entrena primero la cabeza. Si no basta, descongela solo el último bloque (el más específico de ImageNet) con learning rate muy bajo y mucha augmentation." };
    if (st.data === "many" && st.sim === "high") return { N: 6, lr: "cabeza 1e-3; después 1e-5", why: "Ajuste fino en dos fases: cabeza primero; luego los últimos bloques con learning rate bajo. Las primeras capas (bordes, texturas) ya sirven tal cual." };
    return { N: 13, lr: "cabeza 1e-3; después 1e-5 a 1e-4", why: "Con muchos datos de un dominio distinto, conviene reajustar casi todo (los pesos preentrenados siguen siendo mejor punto de partida que el azar)." };
  }

  var geo = {};
  view.draw(function (ctx, w, h, C) {
    var D = api.d, T = totals(), n = layers.length + 1, top = 52, rh = Math.min(20, (h - top - 8) / n), fs = Math.min(10.5, rh * 0.62), i;
    var total = T.tr + T.fr;
    /* barra resumen */
    D.text(ctx, "Parámetros: ", 6, 14, { size: 11, weight: 600, color: C.ink2 });
    var bx = 6, bw = w - 12;
    D.rect(ctx, bx, 20, bw, 14, C.surface, C.ink, 1);
    D.rect(ctx, bx, 20, bw * T.fr / total, 14, C.cobalto);
    D.rect(ctx, bx + bw * T.fr / total, 20, bw * T.tr / total, 14, C.terracota);
    D.text(ctx, "congelados " + fmt(T.fr), 6, 46, { size: Math.min(10.5, w / 38), color: C.cobaltoInk, weight: 600 });
    D.text(ctx, "entrenables " + fmt(T.tr), w - 6, 46, { size: Math.min(10.5, w / 38), color: C.terracotaInk, weight: 600, align: "right" });
    geo = { top: top, rh: rh };
    var maxP = 1; layers.forEach(function (L) { if (L.params > maxP) maxP = L.params; });
    var lw = Math.min(130, w * 0.36), chipW = Math.min(76, w * 0.2), bar0 = lw + chipW + 6, barW = w - bar0 - 6;
    layers.forEach(function (L, k) {
      var y = top + k * rh, tr = !!T.set[k];
      if (k % 2 === 0) D.rect(ctx, 0, y, w, rh, C.paper2 || C.paper);
      D.text(ctx, L.name, 6, y + rh / 2 + fs * 0.35, { size: fs, mono: true, color: L.conv ? C.ink : C.muted });
      if (L.conv) {
        D.rect(ctx, lw, y + 2, chipW, rh - 4, tr ? C.terracotaWash : C.cobaltoWash, tr ? C.terracota : C.cobalto, 1);
        D.text(ctx, tr ? "entrena" : "congelada", lw + chipW / 2, y + rh / 2 + fs * 0.35, { size: fs * 0.92, align: "center", color: tr ? C.terracotaInk : C.cobaltoInk, weight: 600 });
        var bl = Math.max(1.5, L.params / maxP * (barW - 54));
        D.rect(ctx, bar0, y + 3, bl, rh - 6, tr ? C.terracota : C.cobalto);
        D.text(ctx, fmt(L.params), bar0 + bl + 3, y + rh / 2 + fs * 0.35, { size: Math.min(fs, 9.5), mono: true, color: C.ink2 });
      }
    });
    var yh = top + layers.length * rh;
    D.rect(ctx, 0, yh, w, rh, C.terracotaWash);
    D.text(ctx, "cabeza nueva", 6, yh + rh / 2 + fs * 0.35, { size: fs, weight: 600, color: C.ink });
    D.rect(ctx, lw, yh + 2, chipW, rh - 4, C.terracotaWash, C.terracota, 1);
    D.text(ctx, "entrena", lw + chipW / 2, yh + rh / 2 + fs * 0.35, { size: fs * 0.92, align: "center", color: C.terracotaInk, weight: 600 });
    D.text(ctx, "GAP + Dense(" + CLASSES + "): " + fmt(headParams), bar0, yh + rh / 2 + fs * 0.35, { size: Math.min(fs, 9.5), mono: true, color: C.ink2 });
  });
  view.pointer({ down: function (px, py) {
    var k = Math.floor((py - geo.top) / geo.rh);
    if (k >= 0 && k < layers.length) {
      var pos = convIdx.indexOf(k); if (pos < 0) { var j; for (j = k; j < layers.length; j++) if (layers[j].conv) { pos = convIdx.indexOf(j); break; } }
      if (pos >= 0) { st.N = convIdx.length - pos; sl.set(st.N, true); update(); }
    }
  } });

  function update() {
    view.redraw();
    var T = totals(), total = T.tr + T.fr, r = reco();
    var mem = (T.fr * 4 + T.tr * 16) / 1048576;
    var html = "Entrenables: <b>" + fmt(T.tr) + "</b> (" + (100 * T.tr / total).toFixed(1) + " %) · congelados: <b>" + fmt(T.fr) + "</b> · total: <b>" + fmt(total) + "</b><br>" +
      "Memoria aproximada de pesos + gradientes + estados de Adam: congelado 4 B/parámetro, entrenable 16 B → <b>" + mem.toFixed(0) + " MB</b> (todo congelado: " + ((total - headParams) * 4 / 1048576 + headParams * 16 / 1048576).toFixed(0) + " MB; todo entrenable: " + (total * 16 / 1048576).toFixed(0) + " MB)<br>" +
      "Recomendación para <b>" + (st.data === "few" ? "pocos" : "muchos") + " datos</b> y dominio <b>" + (st.sim === "high" ? "parecido" : "distinto") + "</b>: descongelar <b>" + r.N + "</b> capas · learning rate " + r.lr + ".<br>" + r.why;
    out.set(html);
  }
  update();
});
