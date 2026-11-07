/* Experimento: ViT-B/16 por piezas (parches + CLS + posición, 12 bloques, norma final y cabeza) con sus
   parámetros reales (torchvision: 86.567.656 con la cabeza de 1.000 clases). Eliges cuántos bloques
   descongelas desde arriba y cuántas clases tiene tu cabeza; se ve cuánto se entrena y cuánta memoria
   extra pide Adam (gradiente + 2 momentos = 12 bytes por parámetro entrenable en float32). */
Lab.register("curso6/c6m3-congelar-vit", function (root, api) {
  var EMB = 590592 + 768 + 151296, BLQ = 7087872, LN = 1536;
  var S = { k: 0, clases: 2, emb: false };
  var view = api.view(root, { aspect: 1.25, minH: 340, maxH: 420, label: "Pila de piezas de un ViT-B/16; las congeladas en gris y las que se entrenan en verde, con una barra proporcional a sus parámetros" });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Bloques que descongelas (desde arriba)", min: 0, max: 12, step: 1, value: 0,
    fmt: function (v) { return v; }, onInput: function (v) { S.k = v; update(); } });
  ui.select({ label: "Clases de tu cabeza", value: "2",
    options: [["2", "2 (póster de animación / acción)"], ["10", "10 géneros"], ["1000", "1.000 (la original de ImageNet)"]],
    onChange: function (v) { S.clases = +v; update(); } });
  ui.toggle({ label: "Descongelar también los parches", value: false, onChange: function (v) { S.emb = v; update(); } });
  var C0 = api.colors();
  api.legend(root, [[C0.oliva, "se entrena"], [C0.line, "congelado"]]);

  function cabeza() { return 768 * S.clases + S.clases; }
  function piezas() {
    var L = [["Cabeza nueva (768 → " + S.clases + ")", cabeza(), true], ["Norma final", LN, S.k > 0]];
    for (var b = 12; b >= 1; b--) L.push(["Bloque " + b, BLQ, b > 12 - S.k]);
    L.push(["Parches + CLS + posición", EMB, S.emb]);
    return L;
  }
  var fmt = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); };

  function draw(ctx, w, h, C) {
    var L = piezas(), top = 12, rh = (h - top - 8) / L.length, lw = Math.min(190, w * 0.42), bx = lw + 16, bw = w - bx - 74, i;
    for (i = 0; i < L.length; i++) {
      var y = top + i * rh, on = L[i][2], frac = Math.max(0.004, L[i][1] / BLQ);
      api.d.text(ctx, L[i][0], lw + 4, y + rh * 0.66, { align: "right", size: Math.min(12, rh * 0.6), color: on ? C.ink : C.muted, weight: on ? 600 : 400 });
      api.d.rect(ctx, bx, y + rh * 0.18, bw * Math.min(1, frac), rh * 0.64, on ? C.oliva : C.line);
      api.d.text(ctx, L[i][1] >= 1e6 ? (L[i][1] / 1e6).toFixed(2).replace(".", ",") + " M" : fmt(L[i][1]), bx + bw * Math.min(1, frac) + 6, y + rh * 0.66, { size: Math.min(11, rh * 0.55), color: C.ink2, mono: true });
    }
  }

  function update() {
    view.redraw();
    var L = piezas(), tot = 0, ent = 0;
    L.forEach(function (p) { tot += p[1]; if (p[2]) ent += p[1]; });
    var pct = ent / tot * 100, mem = ent * 12 / 1048576;
    var consejo = S.k === 0 && !S.emb ? "Solo cabeza: rapidísimo y casi imposible de sobreajustar. Bien con cientos de imágenes; lr ≈ 1e-3."
      : S.k <= 4 && !S.emb ? "Afinado parcial: lr pequeño (1e-5 a 1e-4). Encaja con miles de imágenes."
      : "Afinado casi total: necesita muchos datos y lr muy pequeño, o borrarás lo aprendido en ImageNet.";
    out.set("Entrenables: <b>" + fmt(ent) + "</b> de " + fmt(tot) + " (<b>" + pct.toFixed(pct < 1 ? 3 : 1).replace(".", ",") + " %</b>)<br>" +
      "Memoria extra de Adam (gradiente + 2 momentos): ≈ <b>" + (mem < 1 ? (mem * 1024).toFixed(0) + " KB" : mem.toFixed(0) + " MB") + "</b><br>" + consejo);
  }
  view.draw(draw); update();
});
