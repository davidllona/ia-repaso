/* Experimento: de PIL/NumPy (alto, ancho, canal) a tensor (canal, alto, ancho). La imagen de 2x3 píxeles del fragmento del módulo.
   Se elige un píxel y se ve a dónde van sus tres valores. Con el interruptor se ve el error típico: reshape en lugar de permute. */
Lab.register("curso4/c4m2-ejes-imagen", function (root, api) {
  var D = api.d;
  var H = 2, W = 3, CH = 3;
  var PX = [[[255, 0, 0], [0, 255, 0], [0, 0, 255]], [[0, 0, 0], [128, 128, 128], [255, 255, 255]]];
  var CN = ["R", "G", "B"], S = { r: 1, c: 1, bad: false };
  var flat = []; PX.forEach(function (row) { row.forEach(function (p) { p.forEach(function (v) { flat.push(v); }); }); });

  var view = api.view(root, { aspect: 1.9, minH: 260, maxH: 340, label: "El póster de 2×3 píxeles como array (alto, ancho, canal) y como tensor (canal, alto, ancho)" });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "fila del píxel", min: 0, max: H - 1, step: 1, value: S.r, onInput: function (v) { S.r = v; update(); } });
  ui.slider({ label: "columna del píxel", min: 0, max: W - 1, step: 1, value: S.c, onInput: function (v) { S.c = v; update(); } });
  ui.toggle({ label: "error típico: reshape(3, 2, 3)", value: false, onChange: function (v) { S.bad = v; update(); } });

  function tensorVal(ch, r, c) { return S.bad ? flat[ch * H * W + r * W + c] : PX[r][c][ch]; }
  function pxColor(v, ch, C) { return v; }
  function draw(ctx, w, h, C) {
    var half = w / 2, small = w < 560, fs = small ? 9.5 : 11, k, r, c, ch;
    D.text(ctx, "array / PIL: [alto][ancho][canal]", half / 2, 14, { size: small ? 10.5 : 12, color: C.ink2, align: "center", weight: 600 });
    D.text(ctx, S.bad ? "reshape(3, 2, 3): ¡mezcla!" : "tensor: [canal][alto][ancho]", half + half / 2, 14, { size: small ? 10.5 : 12, color: S.bad ? C.terracotaInk : C.ink2, align: "center", weight: 600 });
    var cw = Math.min(120, (half - 20) / W), chh = Math.min(82, (h - 80) / H);
    var x0 = (half - cw * W) / 2, y0 = 34;
    for (r = 0; r < H; r++) for (c = 0; c < W; c++) {
      var sel = r === S.r && c === S.c, p = PX[r][c];
      D.rect(ctx, x0 + c * cw, y0 + r * chh, cw - 2, chh - 2, sel ? C.markerWash : C.surface, sel ? C.marker : C.line, sel ? 2.5 : 1);
      D.rect(ctx, x0 + c * cw + 4, y0 + r * chh + 4, 11, 11, "rgb(" + p[0] + "," + p[1] + "," + p[2] + ")", C.ink, 1);
      for (k = 0; k < 3; k++) D.text(ctx, CN[k] + " " + p[k], x0 + c * cw + cw / 2 + 4, y0 + r * chh + 16 + (k + 0.6) * (chh - 20) / 3, { size: fs, color: C.ink, align: "center", mono: true });
    }
    D.text(ctx, "pixeles[" + S.r + ", " + S.c + "] = [" + PX[S.r][S.c].join(", ") + "]", half / 2, y0 + H * chh + 18, { size: fs, color: C.muted, align: "center", mono: true });
    var pw = Math.min(70, (half - 16) / W), ph = Math.min(30, (h - 36 - 3 * 28) / (CH * H)), px0 = half + (half - pw * W) / 2, py = 28;
    for (ch = 0; ch < CH; ch++) {
      D.text(ctx, "canal " + ch + " (" + CN[ch] + ")", half + half / 2, py + 8, { size: fs, color: C.cobaltoInk, align: "center", weight: 600 });
      for (r = 0; r < H; r++) for (c = 0; c < W; c++) {
        var v = tensorVal(ch, r, c), sel2 = r === S.r && c === S.c && !S.bad;
        D.rect(ctx, px0 + c * pw, py + 12 + r * ph, pw - 2, ph - 2, sel2 ? C.markerWash : C.surface, sel2 ? C.marker : C.line, sel2 ? 2.5 : 1);
        D.text(ctx, S.bad ? String(v) : (v / 255).toFixed(2).replace(/0$/, ""), px0 + c * pw + pw / 2 - 1, py + 12 + r * ph + ph / 2 + 3, { size: fs - 0.5, color: C.ink, align: "center", mono: true });
      }
      py += 12 + H * ph + 16;
    }
  }
  view.draw(draw);

  function update() {
    var p = PX[S.r][S.c], t = "";
    t += "Píxel (fila " + S.r + ", columna " + S.c + ") en el array: <code>pixeles[" + S.r + ", " + S.c + "]</code> = <b>[" + p.join(", ") + "]</b> (tres valores juntos, <code>uint8</code> de 0 a 255).<br>";
    if (!S.bad) {
      t += "Tras <code>ToTensor</code> (forma <b>(3, 2, 3)</b>, <code>float32</code>): <code>t[:, " + S.r + ", " + S.c + "]</code> = <b>[" + p.map(function (v) { return (v / 255).toFixed(4); }).join(", ") + "]</b> (cada valor / 255). Los tres valores están ahora en <i>planos distintos</i>, uno por canal.";
      t += "<br><span class='good'>Es una <b>permutación</b> de ejes (<code>permute(2, 0, 1)</code>): cada número va a su sitio correcto.</span>";
    } else {
      var q = [0, 1, 2].map(function (ch) { return flat[ch * H * W + S.r * W + S.c]; });
      t += "Con <code>pixeles.reshape(3, 2, 3)</code> se reinterpretan los mismos 18 números en memoria como 3 planos de 2×3, sin moverlos: <code>t[:, " + S.r + ", " + S.c + "]</code> = <b class='bad'>[" + q.join(", ") + "]</b>.";
      t += "<br><span class='bad'>Forma correcta (3, 2, 3) pero contenido revuelto: el plano «R» contiene valores de rojo, verde y azul mezclados. No da error, y el modelo aprendería con basura.</span>";
    }
    view.redraw(); out.set(t);
  }
  update();
});
