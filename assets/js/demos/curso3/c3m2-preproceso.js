/* Experimento: cada modelo preentrenado espera los píxeles en SU escala. Un mismo píxel RGB se convierte con
   las reglas de VGG16/ResNet50 (BGR y resta de la media de ImageNet), MobileNetV2 ([-1, 1]), EfficientNet (sin cambios)
   y con el error típico (dividir entre 255 y dárselo a VGG16). Los números son exactos. */
Lab.register("curso3/c3m2-preproceso", function (root, api) {
  var st = { r: 200, g: 100, b: 50 };
  var MEAN = { b: 103.939, g: 116.779, r: 123.68 };

  function rows() {
    var R = st.r, G = st.g, B = st.b;
    return [
      { name: "VGG16 / ResNet50", note: "BGR − media", v: [B - MEAN.b, G - MEAN.g, R - MEAN.r], lab: ["B", "G", "R"], range: 255 },
      { name: "MobileNetV2", note: "x/127,5 − 1", v: [R / 127.5 - 1, G / 127.5 - 1, B / 127.5 - 1], lab: ["R", "G", "B"], range: 1 },
      { name: "EfficientNet", note: "sin cambios (reescala dentro)", v: [R, G, B], lab: ["R", "G", "B"], range: 255 },
      { name: "Solo /255", note: "[0, 1]", v: [R / 255, G / 255, B / 255], lab: ["R", "G", "B"], range: 1 },
      { name: "ERROR: x/255 → VGG16", note: "BGR − media sobre [0, 1]", v: [B / 255 - MEAN.b, G / 255 - MEAN.g, R / 255 - MEAN.r], lab: ["B", "G", "R"], range: 255 }
    ];
  }

  var view = api.view(root, { aspect: 1.55, minH: 290, maxH: 400, label: "Valores de un mismo píxel según el preprocesado de cada modelo" });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Rojo (R)", min: 0, max: 255, step: 1, value: st.r, onInput: function (v) { st.r = v; update(); } });
  ui.slider({ label: "Verde (G)", min: 0, max: 255, step: 1, value: st.g, onInput: function (v) { st.g = v; update(); } });
  ui.slider({ label: "Azul (B)", min: 0, max: 255, step: 1, value: st.b, onInput: function (v) { st.b = v; update(); } });

  view.draw(function (ctx, w, h, C) {
    var D = api.d, R = rows(), top = 8, rh = (h - top - 6) / R.length, lw = Math.min(150, w * 0.4), fs = Math.min(11, w / 36), i, j;
    var swatch = "rgb(" + st.r + "," + st.g + "," + st.b + ")";
    R.forEach(function (row, k) {
      var y = top + k * rh, bad = k === 4;
      if (k % 2 === 0) D.rect(ctx, 0, y, w, rh, C.paper2 || C.paper);
      D.text(ctx, row.name, 6, y + rh * 0.42, { size: fs, weight: 600, color: bad ? C.terracotaInk : C.ink });
      D.text(ctx, row.note, 6, y + rh * 0.78, { size: fs * 0.88, color: C.muted });
      /* tres barras (una por canal), eje cero en el centro del bloque */
      var bx = lw + 10, bw = w - bx - 8, zero = bx + bw / 2, half = bw / 2 - 40, bh = Math.max(5, (rh - 8) / 3);
      D.line(ctx, zero, y + 3, zero, y + rh - 3, C.muted, 1);
      row.v.forEach(function (v, c) {
        var frac = Math.max(-1, Math.min(1, v / row.range)), len = frac * half, yy = y + 4 + c * bh;
        var col = [C.cobalto, C.oliva, C.terracota][row.lab[c] === "R" ? 2 : (row.lab[c] === "G" ? 1 : 0)];
        D.rect(ctx, Math.min(zero, zero + len), yy, Math.max(1.5, Math.abs(len)), bh - 1.5, col);
        var txt = row.lab[c] + " " + (Math.abs(v) < 10 && row.range === 1 ? v.toFixed(3) : v.toFixed(1));
        var right = len >= 0;
        D.text(ctx, txt, right ? zero + len + 4 : zero + len - 4, yy + bh - 3, { size: Math.min(9.5, bh * 0.95), mono: true, color: C.ink2, align: right ? "left" : "right" });
      });
    });
  });

  function update() {
    view.redraw();
    var R = rows(), v = R[0].v;
    out.set("Píxel RGB = (" + st.r + ", " + st.g + ", " + st.b + ")<br>" +
      "VGG16/ResNet50: [B, G, R] = [" + st.b + " − 103,939 ; " + st.g + " − 116,779 ; " + st.r + " − 123,68] = [<b>" + v[0].toFixed(3) + "</b>, <b>" + v[1].toFixed(3) + "</b>, <b>" + v[2].toFixed(3) + "</b>]<br>" +
      "MobileNetV2: [" + R[1].v.map(function (x) { return "<b>" + x.toFixed(4) + "</b>"; }).join(", ") + "]<br>" +
      "<span class='bad'>Con el error (x/255 y luego preprocess de VGG16) cualquier píxel queda prácticamente en (−104, −117, −123): toda la imagen se vuelve casi igual y el modelo no ve nada.</span>");
  }
  update();
});
