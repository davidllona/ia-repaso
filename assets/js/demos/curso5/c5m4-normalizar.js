/* Experimento: el preprocesado de ImageNet. Arriba, qué parte de la foto sobrevive a Resize + CenterCrop (geometría exacta de torchvision);
   abajo, qué hace Normalize con un píxel: (v/255 − media)/std en cada canal. */
Lab.register("curso5/c5m4-normalizar", function (root, api) {
  var D = api.d;
  var S = { W: 400, H: 300, R: 256, K: 224, r: 200, g: 100, b: 50, receta: "imagenet" };
  var REC = { imagenet: { mean: [0.485, 0.456, 0.406], std: [0.229, 0.224, 0.225], nombre: "ImageNet" }, medio: { mean: [0.5, 0.5, 0.5], std: [0.5, 0.5, 0.5], nombre: "0,5 / 0,5" } };
  function f2(v) { return v.toFixed(2).replace("-", "−").replace(".", ","); }
  function f3(v) { return v.toFixed(3).replace("-", "−").replace(".", ","); }

  function resized() {
    var W = S.W, H = S.H, R = S.R, nw, nh;
    if (W <= H) { nw = R; nh = Math.floor(R * H / W); } else { nh = R; nw = Math.floor(R * W / H); }
    return [nw, nh];
  }

  var v1 = api.view(root, { aspect: 1.9, minH: 190, maxH: 270, label: "Fotograma original y la parte que queda tras Resize y CenterCrop" });
  var v2 = api.view(root, { aspect: 2.3, minH: 170, maxH: 250, label: "Un píxel antes y después de Normalize, por canal" });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Ancho del fotograma original", min: 200, max: 640, step: 20, value: S.W, onInput: function (v) { S.W = v; update(); } });
  ui.slider({ label: "Alto del fotograma original", min: 200, max: 640, step: 20, value: S.H, onInput: function (v) { S.H = v; update(); } });
  ui.slider({ label: "Resize: lado corto", min: 128, max: 320, step: 16, value: S.R, onInput: function (v) { S.R = v; update(); } });
  ui.slider({ label: "CenterCrop: lado del cuadrado", min: 96, max: 320, step: 16, value: S.K, onInput: function (v) { S.K = v; update(); } });
  ui.slider({ label: "Píxel: canal rojo (0–255)", min: 0, max: 255, step: 1, value: S.r, onInput: function (v) { S.r = v; update(); } });
  ui.slider({ label: "Píxel: canal verde (0–255)", min: 0, max: 255, step: 1, value: S.g, onInput: function (v) { S.g = v; update(); } });
  ui.slider({ label: "Píxel: canal azul (0–255)", min: 0, max: 255, step: 1, value: S.b, onInput: function (v) { S.b = v; update(); } });
  ui.segmented({ label: "Receta de Normalize", value: S.receta, options: [["imagenet", "ImageNet"], ["medio", "0,5 y 0,5"]], onChange: function (v) { S.receta = v; update(); } });

  function draw1(ctx, w, h, C) {
    var pad = 8, avW = w - 2 * pad, avH = h - 2 * pad - 16, sc = Math.min(avW / S.W, avH / S.H), iw = S.W * sc, ih = S.H * sc, ox = (w - iw) / 2, oy = pad + 4, i;
    // fotograma sintético: cielo, suelo, sol y casa
    D.rect(ctx, ox, oy, iw, ih * 0.62, C.cobaltoWash, null);
    D.rect(ctx, ox, oy + ih * 0.62, iw, ih * 0.38, C.olivaWash, null);
    D.circle(ctx, ox + iw * 0.8, oy + ih * 0.2, Math.min(iw, ih) * 0.09, C.marker, null);
    D.rect(ctx, ox + iw * 0.3, oy + ih * 0.38, iw * 0.28, ih * 0.34, C.terracotaWash, C.terracota, 1.5);
    D.rect(ctx, ox + iw * 0.4, oy + ih * 0.52, iw * 0.07, ih * 0.2, C.terracota, null);
    D.rect(ctx, ox, oy, iw, ih, null, C.ink, 1.5);
    // recorte: en coordenadas originales, lado K / factor, factor = R / lado corto
    var f = S.R / Math.min(S.W, S.H), cs = S.K / f * sc, cx = ox + iw / 2 - cs / 2, cy = oy + ih / 2 - cs / 2;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.restore();
    D.rect(ctx, cx, cy, cs, cs, null, C.terracota, 2.4);
    var nr = resized(), narrow = w < 460;
    D.text(ctx, narrow ? "orig. " + S.W + "×" + S.H : S.W + "×" + S.H + " original", 6, h - 5, { size: 10, mono: true, color: C.ink2 });
    D.text(ctx, narrow ? "recorte " + S.K + "² de " + nr[0] + "×" + nr[1] : "recorte " + S.K + "×" + S.K + " (sobre " + nr[0] + "×" + nr[1] + ")", w - 6, h - 5, { size: 10, mono: true, color: C.terracotaInk, align: "right" });
  }
  function draw2(ctx, w, h, C) {
    var rec = REC[S.receta], vals = [S.r, S.g, S.b], names = ["R", "G", "B"], i, left = 30, right = 10, top = 16, bot = 20;
    var x0 = left, wd = w - left - right, lo = -2.4, hi = 2.8;
    function X(v) { return x0 + (v - lo) / (hi - lo) * wd; }
    var rowH = (h - top - bot) / 3;
    ctx.save(); D.rect(ctx, x0, top, wd, h - top - bot, C.surface, C.ink, 1.2); ctx.restore();
    var t;
    for (t = -2; t <= 2; t++) { D.line(ctx, X(t), top, X(t), h - bot, t === 0 ? C.muted : C.line, 1, t === 0 ? [4, 3] : []); D.text(ctx, String(t).replace("-", "−"), X(t), h - bot + 13, { size: 10.5, mono: true, color: C.muted, align: "center" }); }
    var cols = [C.terracota, C.oliva, C.cobalto];
    for (i = 0; i < 3; i++) {
      var raw = vals[i] / 255, z = (raw - rec.mean[i]) / rec.std[i], y = top + rowH * i + rowH * 0.5;
      D.text(ctx, names[i], 12, y + 4, { size: 12, mono: true, color: C.ink2, align: "center", weight: 600 });
      D.rect(ctx, X(0), y - rowH * 0.36, Math.max(2, X(raw) - X(0)), rowH * 0.2, C.muted, null);
      D.rect(ctx, Math.min(X(0), X(z)), y + rowH * 0.02, Math.max(2, Math.abs(X(z) - X(0))), rowH * 0.28, cols[i], null);
      D.text(ctx, f2(raw), X(raw) + 3, y - rowH * 0.2 + 3, { size: 10, mono: true, color: C.ink2 });
      D.text(ctx, f2(z), z >= 0 ? X(z) + 3 : X(z) - 3, y + rowH * 0.28, { size: 10.5, mono: true, color: C.ink, align: z >= 0 ? "left" : "right", weight: 600 });
    }
    D.text(ctx, "gris: v/255 · color: (v/255 − media)/std", w - right, 11, { size: 10, color: C.muted, align: "right" });
  }
  v1.draw(draw1); v2.draw(draw2);

  function update() {
    var nr = resized(), rec = REC[S.receta], z = [S.r, S.g, S.b].map(function (v, i) { return (v / 255 - rec.mean[i]) / rec.std[i]; });
    var s = "Pasos: <b>" + S.W + "×" + S.H + "</b> → Resize(" + S.R + "): <b>" + nr[0] + "×" + nr[1] + "</b> → CenterCrop(" + S.K + "): <b>" + S.K + "×" + S.K + "</b> → ToTensor: tensor (3, " + S.K + ", " + S.K + ") con valores en [0, 1] → Normalize";
    s += "<br>Píxel (" + S.r + ", " + S.g + ", " + S.b + ") → v/255 = (" + f3(S.r / 255) + "; " + f3(S.g / 255) + "; " + f3(S.b / 255) + ") → tras Normalize (" + rec.nombre + "): <b>(" + f3(z[0]) + "; " + f3(z[1]) + "; " + f3(z[2]) + ")</b>";
    if (S.K > Math.min(nr[0], nr[1])) s += "<br><span class='bad'>El recorte (" + S.K + ") es mayor que el lado corto tras Resize (" + Math.min(nr[0], nr[1]) + "): CenterCrop rellenaría con ceros los bordes.</span>";
    else if (S.R === 256 && S.K === 224 && S.receta === "imagenet") s += "<br><span class='good'>Es el preprocesado oficial de ResNet-18 (Resize 256, CenterCrop 224, media y std de ImageNet).</span>";
    else s += "<br><span class='bad'>Distinto del preprocesado con que se entrenó la red: funcionará, pero peor. Usa siempre weights.transforms().</span>";
    out.set(s); v1.redraw(); v2.redraw();
  }
  update();
});
