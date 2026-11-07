/* Experimento: en el híbrido CNN + ViT, dónde cortas la CNN decide cuántos tokens recibe el Transformer.
   Etapas de una ResNet-50: reducción ×4, ×8, ×16 o ×32 con 256, 512, 1.024 o 2.048 canales.
   Cada casilla del mapa es un token; se compara el número de parejas de atención (N + 1)² con el de un
   ViT puro de parches 16×16. Las barras van en escala logarítmica. */
Lab.register("curso6/c6m3-hibrido-coste", function (root, api) {
  var ET = { 4: 256, 8: 512, 16: 1024, 32: 2048 };
  var S = { img: 224, red: 16 };
  var view = api.view(root, { aspect: 1.5, minH: 400, maxH: 420, label: "Mapa de características de la CNN dibujado como rejilla y barras con las parejas de atención del híbrido frente a un ViT puro" });
  var ui = api.controls(root), out = api.readout(root);
  ui.select({ label: "Dónde cortas la CNN", value: "16",
    options: [["4", "Etapa 1: reduce ×4"], ["8", "Etapa 2: reduce ×8"], ["16", "Etapa 3: reduce ×16"], ["32", "Etapa 4: reduce ×32"]],
    onChange: function (v) { S.red = +v; update(); } });
  ui.slider({ label: "Tamaño de la imagen", min: 0, max: 3, step: 1, value: 0,
    fmt: function (v) { return [224, 288, 384, 448][v] + " px"; }, onInput: function (v) { S.img = [224, 288, 384, 448][v]; update(); } });

  function lado() { return S.img / S.red; }
  function tokH() { return lado() * lado(); }
  function tokV() { return (S.img / 16) * (S.img / 16); }
  var fmt = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); };

  function draw(ctx, w, h, C) {
    var estrecho = w < 520, P = estrecho ? Math.min(w * 0.5, 160) : Math.min(h - 50, w * 0.36), x0 = estrecho ? (w - P) / 2 : 12, y0 = 26;
    var L = lado(), s = P / L, i;
    api.d.rect(ctx, x0, y0, P, P, C.cobaltoWash, C.line, 1);
    if (L <= 56) for (i = 0; i <= L; i++) {
      var a = L > 30 ? 0.3 : 0.8;
      api.d.line(ctx, x0 + i * s, y0, x0 + i * s, y0 + P, C.cobalto, a);
      api.d.line(ctx, x0, y0 + i * s, x0 + P, y0 + i * s, C.cobalto, a);
    }
    api.d.rect(ctx, x0, y0, Math.max(s, 2), Math.max(s, 2), C.terracota);
    api.d.text(ctx, "mapa " + L + "×" + L + "×" + fmt(ET[S.red]), x0 + P / 2, 16, { align: "center", size: 12, weight: 600, color: C.ink2 });
    api.d.text(ctx, "cada casilla = 1 token", x0 + P / 2, y0 + P + 16, { align: "center", size: 11, color: C.muted });

    // barras (log10 de las parejas)
    var bx = estrecho ? 12 : x0 + P + 26, bw = w - bx - 12, items = [
      ["ViT puro (parches 16)", Math.pow(tokV() + 1, 2), C.cobalto],
      ["Híbrido (este corte)", Math.pow(tokH() + 1, 2), C.terracota]];
    var maxL = 9, ty = estrecho ? y0 + P + 44 : y0 - 6, by = ty + 20, bh = Math.min(30, (h - by - 50) / 4.3);
    api.d.text(ctx, "parejas de atención por cabeza", bx, ty, { size: 12, weight: 600, color: C.ink2 });
    items.forEach(function (it, k) {
      var y = by + k * (bh * 2.1), len = bw * Math.min(1, Math.log10(it[1]) / maxL);
      api.d.text(ctx, it[0], bx, y + 2, { size: 12, color: C.ink });
      api.d.rect(ctx, bx, y + 8, len, bh, it[2]);
      var tx = fmt(it[1]), dentro = len > tx.length * 7.5 + 10;
      api.d.text(ctx, tx, dentro ? bx + len - 6 : bx + len + 5, y + 8 + bh * 0.65, { align: dentro ? "right" : "left", size: 12, weight: 700, color: dentro ? C.paper : C.ink, mono: true });
    });
    var ey = by + 2 * bh * 2.1 + 6;
    [1e3, 1e5, 1e7, 1e9].forEach(function (v) {
      var x = bx + bw * Math.log10(v) / maxL;
      api.d.line(ctx, x, ey, x, ey + 5, C.muted, 1);
      api.d.text(ctx, "10" + ["³", "⁵", "⁷", "⁹"][(Math.log10(v) - 3) / 2], x, ey + 17, { align: "center", size: 10, color: C.muted });
    });
    api.d.text(ctx, "escala logarítmica", bx + bw, ey + 32, { align: "right", size: 10, color: C.muted });
  }

  function update() {
    view.redraw();
    var nH = tokH(), nV = tokV(), pH = (nH + 1) * (nH + 1), pV = (nV + 1) * (nV + 1), ratio = pH / pV;
    out.set("Imagen " + S.img + " → mapa <b>" + lado() + "×" + lado() + "×" + fmt(ET[S.red]) + "</b> → <b>" + fmt(nH) + " tokens</b> de " + fmt(ET[S.red]) + " números → Dense a d<br>" +
      "Atención: (" + fmt(nH) + " + 1)² = <b>" + fmt(pH) + "</b> parejas; ViT puro: " + fmt(pV) + " → " +
      (ratio >= 1 ? "<span class='" + (ratio > 2 ? "bad" : "") + "'>×" + ratio.toFixed(ratio < 10 ? 2 : 0).replace(".", ",") + "</span>" : "<span class='good'>÷" + (1 / ratio).toFixed(1).replace(".", ",") + "</span>"));
  }
  view.draw(draw); update();
});
