/* Experimento: aumento de datos como en ImageDataGenerator (rotation_range, shifts, zoom_range, horizontal_flip, brightness_range, fill_mode="nearest") sobre una imagen sintética. */
Lab.register("curso2/c2m5-augmentation", function (root, api) {
  var S = 72, NV = 8, par = { rot: 20, shift: 0.1, zoom: 0.2, flip: true, bri: 0.2 }, seed = 1;
  /* imagen base: chapa con una abolladura (zona clara y zona oscura) y una flecha en la esquina para ver los giros */
  var base = new Float32Array(S * S * 3), i, j;
  (function () {
    var g = api.rng(3);
    for (i = 0; i < S; i++) for (j = 0; j < S; j++) {
      var v = 0.58 + 0.06 * (i / S) + g.normal(0, 0.012), dx1 = j - 40, dy1 = i - 34, dx2 = j - 30, dy2 = i - 38;
      v += 0.4 * Math.exp(-(dx1 * dx1 + dy1 * dy1) / 60) - 0.4 * Math.exp(-(dx2 * dx2 + dy2 * dy2) / 60);
      var r = v * 0.92, gg = v * 0.97, b = v * 1.05;
      if (i < 12 && j < 22 && (j - 2) >= Math.abs(i - 6) * 1.2 && j > 3 && j < 20) { r = 0.85; gg = 0.25; b = 0.15; }
      base[(i * S + j) * 3] = r; base[(i * S + j) * 3 + 1] = gg; base[(i * S + j) * 3 + 2] = b;
    }
  })();
  function make(rot, shx, shy, zoom, flip, bri) {
    var out = new Float32Array(S * S * 3), th = rot * Math.PI / 180, c = Math.cos(th), s = Math.sin(th), cx = (S - 1) / 2, y, x;
    for (y = 0; y < S; y++) for (x = 0; x < S; x++) {
      var u = x - cx - shx * S, v = y - cx - shy * S;
      u = u / zoom; v = v / zoom;
      var su = c * u + s * v, sv = -s * u + c * v;
      if (flip) su = -su;
      var sx = Math.round(Math.max(0, Math.min(S - 1, su + cx))), sy = Math.round(Math.max(0, Math.min(S - 1, sv + cx)));
      for (var q = 0; q < 3; q++) out[(y * S + x) * 3 + q] = Math.max(0, Math.min(1, base[(sy * S + sx) * 3 + q] * bri));
    }
    return out;
  }
  function toCanvas(arr) {
    var cv = document.createElement("canvas"); cv.width = S; cv.height = S; var cx = cv.getContext("2d"), im = cx.createImageData(S, S), k;
    for (k = 0; k < S * S; k++) { im.data[k * 4] = arr[k * 3] * 255; im.data[k * 4 + 1] = arr[k * 3 + 1] * 255; im.data[k * 4 + 2] = arr[k * 3 + 2] * 255; im.data[k * 4 + 3] = 255; }
    cx.putImageData(im, 0, 0); return cv;
  }
  var variants = [];
  function draws() {
    var g = api.rng(seed), o = [];
    for (var n = 0; n < NV; n++) {
      var rot = par.rot * g.range(-1, 1), sx = par.shift * g.range(-1, 1), sy = par.shift * g.range(-1, 1), z = 1 + par.zoom * g.range(-1, 1), fl = par.flip && g.next() < 0.5, br = 1 + par.bri * g.range(-1, 1);
      o.push({ arr: make(rot, sx, sy, z, fl, br), txt: (rot >= 0 ? "+" : "") + rot.toFixed(0) + "°" + (fl ? " ↔" : "") });
    }
    return o;
  }
  var orig = toCanvas(base);
  variants = draws().map(function (v) { v.cv = toCanvas(v.arr); return v; });
  var view = api.view(root, { aspect: 1.5, minH: 280, maxH: 420, label: "Imagen original y ocho versiones generadas con aumento de datos" });
  var ui = api.controls(root), out = api.readout(root);
  function reg() { variants = draws().map(function (v) { v.cv = toCanvas(v.arr); return v; }); update(); }
  ui.slider({ label: "rotation_range (grados)", min: 0, max: 60, step: 5, value: par.rot, fmt: function (v) { return v + "°"; }, onInput: function (v) { par.rot = v; reg(); } });
  ui.slider({ label: "width/height_shift_range", min: 0, max: 0.4, step: 0.05, value: par.shift, fmt: function (v) { return v.toFixed(2).replace(".", ","); }, onInput: function (v) { par.shift = v; reg(); } });
  ui.slider({ label: "zoom_range", min: 0, max: 0.5, step: 0.05, value: par.zoom, fmt: function (v) { return v.toFixed(2).replace(".", ","); }, onInput: function (v) { par.zoom = v; reg(); } });
  ui.slider({ label: "brightness_range (±)", min: 0, max: 0.6, step: 0.05, value: par.bri, fmt: function (v) { return v.toFixed(2).replace(".", ","); }, onInput: function (v) { par.bri = v; reg(); } });
  ui.toggle({ label: "horizontal_flip", value: par.flip, onChange: function (v) { par.flip = v; reg(); } });
  ui.button("Otro lote de ejemplos", function () { seed++; reg(); }, "primary");
  view.draw(function (ctx, w, h, C) {
    var cols = w < 520 ? 3 : 3, gap = 8, rows = 3, cell = Math.min((w - gap * (cols + 1)) / cols, (h - 16 - gap * (rows - 1)) / rows), x0 = (w - (cell * cols + gap * (cols - 1))) / 2, k;
    ctx.imageSmoothingEnabled = false;
    for (k = 0; k < 9; k++) {
      var cx = x0 + (k % cols) * (cell + gap), cy = 4 + Math.floor(k / cols) * (cell + gap), cvs = k === 0 ? orig : variants[k - 1].cv;
      ctx.drawImage(cvs, cx, cy, cell, cell);
      api.d.rect(ctx, cx, cy, cell, cell, null, k === 0 ? C.terracota : C.line, k === 0 ? 3 : 1);
      var t = k === 0 ? "original" : variants[k - 1].txt;
      api.d.rect(ctx, cx + 2, cy + cell - 16, Math.min(cell - 4, t.length * 6.2 + 8), 14, C.surface);
      api.d.text(ctx, t, cx + 6, cy + cell - 5, { size: 10, color: C.ink, mono: true });
    }
  });
  function update() {
    view.redraw();
    var px = Math.round(base[(36 * S + 36) * 3] * 255), pv = variants[0].arr[(36 * S + 36) * 3];
    out.set("Cada imagen de arriba es la original (borde naranja) más <b>una transformación al azar</b> dentro de los rangos de los sliders: <code>fill_mode=\"nearest\"</code> rellena los huecos repitiendo el borde.<br>" +
      "Y <code>rescale=1./255</code> hace aparte lo siguiente: un píxel de valor <b>" + px + "</b> pasa a <b>" + (px / 255).toFixed(3).replace(".", ",") + "</b>; 255 → <b>1,000</b>; 128 → <b>0,502</b>. La flecha roja (esquina) te dice cuándo se ha girado o volteado la imagen.");
  }
  update();
});
