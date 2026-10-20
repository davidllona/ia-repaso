/* Experimento: cuántos parámetros necesita una red densa y una CNN según el tamaño de la imagen. */
Lab.register("curso2/c2m3-cnn-vs-dense", function (root, api) {
  var SIZES = [8, 16, 28, 32, 64, 128, 224], si = 2, ch = 1, U = 128;
  function fmtN(n) { return n.toLocaleString("en-US"); }
  function counts() {
    var H = SIZES[si], C = ch, q = Math.floor(Math.floor(H / 2) / 2);
    var inputs = H * H * C;
    var convs = (9 * C + 1) * 16 + (9 * 16 + 1) * 32;
    return {
      inputs: inputs,
      denseFirst: inputs * U + U, convFirst: (9 * C + 1) * 16,
      dense: (inputs * U + U) + (U * 10 + 10),
      cnn: convs + (q * q * 32 * 10 + 10), cnnGap: convs + (32 * 10 + 10),
      q: q
    };
  }
  var view = api.view(root, { aspect: 2.0, minH: 190, maxH: 280, label: "Parámetros de tres modelos en escala logarítmica" });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Lado del fotograma (alto = ancho)", min: 0, max: SIZES.length - 1, step: 1, value: si, fmt: function (v) { return SIZES[v] + " × " + SIZES[v]; }, onInput: function (v) { si = v; update(); } });
  ui.segmented({ label: "Canales", options: [[1, "1 (gris)"], [3, "3 (color RGB)"]], value: ch, onChange: function (v) { ch = v; update(); } });
  ui.segmented({ label: "Neuronas de la capa densa", options: [[64, "64"], [128, "128"], [512, "512"]], value: U, onChange: function (v) { U = v; update(); } });

  view.draw(function (ctx, w, h, C) {
    var D = api.d, c = counts(), left = 10, right = 14, axisY = h - 24, plotW = w - left - right;
    var items = [["Densa: Flatten → Dense(" + U + ") → Dense(10)", c.dense, C.terracota], ["CNN con Flatten", c.cnn, C.cobalto], ["CNN con GlobalAveragePooling2D", c.cnnGap, C.oliva]];
    var lo = 3, hi = 9;
    function X(v) { return left + (Math.log10(v) - lo) / (hi - lo) * plotW; }
    var rowH = (axisY - 6) / 3, i, t;
    for (t = lo; t <= hi; t++) {
      D.line(ctx, X(Math.pow(10, t)), 4, X(Math.pow(10, t)), axisY, C.line, 1);
      var lab = t === 3 ? "1k" : t === 4 ? "10k" : t === 5 ? "100k" : t === 6 ? "1M" : t === 7 ? "10M" : t === 8 ? "100M" : "1000M";
      D.text(ctx, lab, X(Math.pow(10, t)), axisY + 14, { size: 10, align: t === hi ? "right" : t === lo ? "left" : "center", mono: true, color: C.muted });
    }
    for (i = 0; i < 3; i++) {
      var y = 4 + i * rowH, bx = X(items[i][1]);
      D.text(ctx, items[i][0] + " · " + fmtN(items[i][1]), left + 2, y + 13, { size: Math.min(12, Math.max(10, w / 34)), weight: 600, color: C.ink });
      D.rect(ctx, left, y + 20, Math.max(2, bx - left), rowH - 30, items[i][2]);
    }
    D.line(ctx, left, axisY, w - right, axisY, C.ink, 1.2);
  });
  function update() {
    view.redraw();
    var c = counts(), H = SIZES[si];
    out.set("Fotograma " + H + "×" + H + "×" + ch + " → <b>" + fmtN(c.inputs) + "</b> números de entrada<br>" +
      "Primera capa: Dense(" + U + ") = <b>" + fmtN(c.denseFirst) + "</b> parámetros · Conv2D(16, 3×3) = <b>" + fmtN(c.convFirst) + "</b> (¡" + fmtN(Math.round(c.denseFirst / c.convFirst)) + " veces menos!)<br>" +
      "Modelo completo: densa <b>" + fmtN(c.dense) + "</b> · CNN <b>" + fmtN(c.cnn) + "</b> (" + (c.dense / c.cnn).toFixed(1) + "× menos) · CNN + GlobalAvgPool <b>" + fmtN(c.cnnGap) + "</b> (no depende del tamaño de la imagen)<br>" +
      "Memoria de los pesos de la densa (float32): <b>" + (c.dense * 4 / 1048576 >= 1 ? (c.dense * 4 / 1048576).toFixed(1) + " MB" : (c.dense * 4 / 1024).toFixed(1) + " KB") + "</b>");
  }
  update();
});
