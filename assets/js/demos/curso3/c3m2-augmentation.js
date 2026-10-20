/* Experimento: data augmentation "viva". Una imagen sintética de 32×32 sufre giros, zoom, desplazamientos,
   inclinación, volteo, brillo y contraste. Los controles son los RANGOS de las capas de Keras
   (RandomRotation, RandomZoom, RandomTranslation, RandomContrast…) y se calcula cada píxel (interpolación bilineal). */
Lab.register("curso3/c3m2-augmentation", function (root, api) {
  var N = 32;
  var st = { rot: 20, zoom: 20, shift: 15, shear: 15, bright: 20, contrast: 30, flipH: true, fill: "constant", mode: "ext", seed: 1 };
  var src = (function () {
    var a = new Float32Array(N * N * 3), x, y;
    function put(x, y, c) { if (x < 0 || y < 0 || x >= N || y >= N) return; var o = (y * N + x) * 3; a[o] = c[0]; a[o + 1] = c[1]; a[o + 2] = c[2]; }
    for (y = 0; y < N; y++) for (x = 0; x < N; x++) put(x, y, y >= 26 ? [0.40, 0.62, 0.38] : [0.82, 0.89, 0.96]);
    var F = [0.82, 0.30, 0.20], i, j;
    for (y = 6; y < 25; y++) for (x = 9; x < 13; x++) put(x, y, F);
    for (y = 6; y < 10; y++) for (x = 9; x < 23; x++) put(x, y, F);
    for (y = 14; y < 18; y++) for (x = 9; x < 19; x++) put(x, y, F);
    for (y = 3; y < 12; y++) for (x = 21; x < 30; x++) if ((x - 25.5) * (x - 25.5) + (y - 7.5) * (y - 7.5) <= 10) put(x, y, [0.96, 0.78, 0.18]);
    return a;
  })();
  var mean = [0, 0, 0];
  (function () { var k; for (k = 0; k < N * N; k++) { mean[0] += src[k * 3]; mean[1] += src[k * 3 + 1]; mean[2] += src[k * 3 + 2]; } mean = mean.map(function (v) { return v / (N * N); }); })();

  function idx(i, mode) {          /* mapa un índice fuera de rango según fill_mode; -1 = valor constante */
    if (i >= 0 && i < N) return i;
    if (mode === "constant") return -1;
    if (mode === "nearest") return i < 0 ? 0 : N - 1;
    if (mode === "wrap") return ((i % N) + N) % N;
    var p = 2 * N, m = ((i % p) + p) % p; return m < N ? m : p - 1 - m;     /* reflect: (d c b a | a b c d | d c b a) */
  }
  function sample(sx, sy, c, mode) {
    var x0 = Math.floor(sx), y0 = Math.floor(sy), fx = sx - x0, fy = sy - y0, v = 0, dx, dy;
    for (dy = 0; dy < 2; dy++) for (dx = 0; dx < 2; dx++) {
      var xi = idx(x0 + dx, mode), yi = idx(y0 + dy, mode), wgt = (dx ? fx : 1 - fx) * (dy ? fy : 1 - fy);
      v += wgt * ((xi < 0 || yi < 0) ? 0 : src[(yi * N + xi) * 3 + c]);
    }
    return v;
  }
  /* p = {rot (grados), zoom (factor), tx, ty (px), shear, flipH, flipV, bright, contrast (factor)} */
  function warp(p) {
    var out = new Float32Array(N * N * 3), cx = (N - 1) / 2, th = p.rot * Math.PI / 180, co = Math.cos(th), si = Math.sin(th), x, y, c;
    for (y = 0; y < N; y++) for (x = 0; x < N; x++) {
      var u = x - cx - p.tx, v = y - cx - p.ty;
      var u1 = co * u + si * v, v1 = -si * u + co * v;        /* giro inverso */
      u1 = u1 - p.shear * v1;                                 /* inclinación inversa */
      u1 /= p.zoom; v1 /= p.zoom;                             /* zoom inverso */
      if (p.flipH) u1 = -u1;
      if (p.flipV) v1 = -v1;
      var sx = u1 + cx, sy = v1 + cx;
      for (c = 0; c < 3; c++) {
        var val = sample(sx, sy, c, st.fill);
        val = (val - mean[c]) * p.contrast + mean[c] + p.bright;
        out[(y * N + x) * 3 + c] = Math.max(0, Math.min(1, val));
      }
    }
    return out;
  }
  function base() { return { rot: 0, zoom: 1, tx: 0, ty: 0, shear: 0, flipH: false, flipV: false, bright: 0, contrast: 1 }; }
  function extremes() {
    var R = st.rot, Z = st.zoom / 100, S = st.shift / 100 * N, Sh = st.shear / 100, B = st.bright / 100, Cn = st.contrast / 100, list = [], q;
    function t(label, mod) { q = base(); mod(q); list.push({ label: label, p: q }); }
    t("original", function () {});
    t("giro −" + R + "°", function (q) { q.rot = -R; });
    t("giro +" + R + "°", function (q) { q.rot = R; });
    t("zoom −" + st.zoom + " %", function (q) { q.zoom = 1 - Z; });
    t("zoom +" + st.zoom + " %", function (q) { q.zoom = 1 + Z; });
    t("mover →", function (q) { q.tx = S; });
    t("mover ↓", function (q) { q.ty = S; });
    t("inclinar", function (q) { q.shear = Sh; });
    t(st.flipH ? "volteo H" : "sin volteo", function (q) { q.flipH = st.flipH; });
    t("brillo +" + (B).toFixed(2), function (q) { q.bright = B; });
    t("contr. ×" + (1 - Cn).toFixed(2), function (q) { q.contrast = Math.max(0, 1 - Cn); });
    t("contr. ×" + (1 + Cn).toFixed(2), function (q) { q.contrast = 1 + Cn; });
    return list;
  }
  function randoms() {
    var r = api.rng(st.seed * 977), list = [{ label: "original", p: base() }], k;
    for (k = 1; k < 12; k++) {
      var q = base();
      q.rot = r.range(-st.rot, st.rot);
      q.zoom = 1 + r.range(-st.zoom, st.zoom) / 100;
      q.tx = r.range(-st.shift, st.shift) / 100 * N; q.ty = r.range(-st.shift, st.shift) / 100 * N;
      q.shear = r.range(-st.shear, st.shear) / 100;
      q.flipH = st.flipH && r.next() < 0.5;
      q.bright = r.range(-st.bright, st.bright) / 100;
      q.contrast = 1 + r.range(-st.contrast, st.contrast) / 100;
      list.push({ label: (q.rot >= 0 ? "+" : "") + q.rot.toFixed(0) + "° · ×" + q.zoom.toFixed(2) + (q.flipH ? " · H" : ""), p: q });
    }
    return list;
  }

  var view = api.view(root, { aspect: 1.25, minH: 300, maxH: 600, label: "Doce versiones de una misma imagen tras aplicar transformaciones" });
  var ui = api.controls(root), out = api.readout(root);
  ui.segmented({ label: "Qué ver", options: [["ext", "Cada transformación al máximo"], ["rnd", "12 sorteos aleatorios"]], value: st.mode, onChange: function (v) { st.mode = v; update(); } });
  ui.slider({ label: "Giro ± (grados)", min: 0, max: 90, step: 5, value: st.rot, onInput: function (v) { st.rot = v; update(); } });
  ui.slider({ label: "Zoom ± (%)", min: 0, max: 50, step: 5, value: st.zoom, onInput: function (v) { st.zoom = v; update(); } });
  ui.slider({ label: "Desplazamiento ± (% del lado)", min: 0, max: 40, step: 5, value: st.shift, onInput: function (v) { st.shift = v; update(); } });
  ui.slider({ label: "Inclinación ± (shear, %)", min: 0, max: 50, step: 5, value: st.shear, onInput: function (v) { st.shear = v; update(); } });
  ui.slider({ label: "Brillo ± (20 = 0,20 en escala 0-1)", min: 0, max: 50, step: 5, value: st.bright, onInput: function (v) { st.bright = v; update(); } });
  ui.slider({ label: "Contraste ± (%)", min: 0, max: 90, step: 10, value: st.contrast, onInput: function (v) { st.contrast = v; update(); } });
  ui.select({ label: "fill_mode (qué se pone fuera de la imagen)", options: [["constant", "constant (negro)"], ["nearest", "nearest (repite el borde)"], ["reflect", "reflect (espejo)"], ["wrap", "wrap (da la vuelta)"]], value: st.fill, onChange: function (v) { st.fill = v; update(); } });
  ui.toggle({ label: "Permitir volteo horizontal", value: true, onChange: function (v) { st.flipH = v; update(); } });
  ui.button("Nuevo sorteo", function () { st.seed++; st.mode = "rnd"; update(); });

  var tmp = document.createElement("canvas"); tmp.width = N; tmp.height = N;
  var tctx = tmp.getContext("2d");
  view.draw(function (ctx, w, h, C) {
    var D = api.d, tiles = st.mode === "ext" ? extremes() : randoms(), cols = 4, rows = 3;
    var tw = Math.min(w / cols, (h - 6) / rows - 15), gx = (w - tw * cols) / 2 + 0;
    var cellW = w / cols, cellH = (h - 4) / rows;
    tiles.forEach(function (T, k) {
      var r = Math.floor(k / cols), c = k % cols, px = c * cellW + (cellW - tw + 6) / 2 - 3 + 0, py = 4 + r * cellH;
      var out = warp(T.p), img = tctx.createImageData(N, N), q;
      for (q = 0; q < N * N; q++) { img.data[q * 4] = out[q * 3] * 255; img.data[q * 4 + 1] = out[q * 3 + 1] * 255; img.data[q * 4 + 2] = out[q * 3 + 2] * 255; img.data[q * 4 + 3] = 255; }
      tctx.putImageData(img, 0, 0);
      var s = tw - 6, x0 = c * cellW + (cellW - s) / 2;
      ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(tmp, x0, py, s, s); ctx.restore();
      D.rect(ctx, x0, py, s, s, null, k === 0 ? C.terracota : C.ink, k === 0 ? 2 : 1);
      D.text(ctx, T.label, c * cellW + cellW / 2, py + s + 12, { size: Math.min(10.5, cellW / 9.4), align: "center", mono: true, color: C.ink2 });
    });
  });

  function update() {
    view.redraw();
    var html = "En Keras, estas elecciones serían:<br>" +
      "<b>RandomRotation(" + (st.rot / 360).toFixed(3).replace(/0+$/, "").replace(/\.$/, "") + ")</b> → ± " + st.rot + "° (el factor es una fracción de 360°: " + st.rot + "/360)<br>" +
      "<b>RandomZoom(" + (st.zoom / 100).toFixed(2) + ")</b> · <b>RandomTranslation(" + (st.shift / 100).toFixed(2) + ", " + (st.shift / 100).toFixed(2) + ")</b> (" + (st.shift / 100 * N).toFixed(1) + " px de 32) · <b>RandomContrast(" + (st.contrast / 100).toFixed(2) + ")</b> · <b>RandomBrightness(" + (st.bright / 100).toFixed(2) + ")</b>" + (st.flipH ? " · <b>RandomFlip('horizontal')</b>" : "") + "<br>" +
      "Cada época la red ve una variante distinta de la misma foto: nunca dos veces exactamente la misma.";
    out.set(html);
  }
  update();
});
