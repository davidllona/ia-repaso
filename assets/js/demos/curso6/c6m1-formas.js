/* Experimento: la misma imagen por las dos tuberías, paso a paso. Keras guarda los canales al final (B, H, W, C) y deja
   los píxeles en 0–255 (se reescalan dentro del modelo con Rescaling); PyTorch los pone delante (B, C, H, W) y
   ToTensor los pasa a 0–1 (Normalize con media 0,5 y desviación 0,5 los lleva a −1..1). Se sigue un píxel concreto. */
Lab.register("curso6/c6m1-formas", function (root, api) {
  var D = api.d;
  var S = { paso: 1, B: 32, lado: 32, v: 200 };
  var PASOS = ["archivo PNG", "una imagen", "un lote", "lista para la red"];

  var view = api.view(root, { aspect: 1.8, minH: 270, maxH: 340, label: "La misma imagen en Keras (canales al final) y en PyTorch (canales delante), paso a paso" });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Paso de la tubería", min: 1, max: 4, step: 1, value: S.paso, fmt: function (v) { return v + " · " + PASOS[v - 1]; }, onInput: function (v) { S.paso = v; update(); } });
  ui.slider({ label: "Valor de un píxel rojo en el PNG", min: 0, max: 255, step: 1, value: S.v, fmt: function (v) { return v; }, onInput: function (v) { S.v = v; update(); } });
  ui.select({ label: "image_size / Resize", options: [["32", "32 × 32"], ["64", "64 × 64"], ["224", "224 × 224"]], value: "32", onChange: function (v) { S.lado = +v; update(); } });
  ui.slider({ label: "batch_size", min: 8, max: 64, step: 8, value: S.B, fmt: function (v) { return v; }, onInput: function (v) { S.B = v; update(); } });

  function info() {
    var H = S.lado, v = S.v, p = S.paso, B = S.B;
    var k = [["(" + H + ", " + H + ", 3)", "uint8", "0–255", String(v)],
             ["(" + H + ", " + H + ", 3)", "float32", "0–255", v.toFixed(1)],
             ["(" + B + ", " + H + ", " + H + ", 3)", "float32", "0–255", v.toFixed(1)],
             ["(" + B + ", " + H + ", " + H + ", 3)", "float32", "0–1", (v / 255).toFixed(3)]][p - 1];
    var t = [["(" + H + ", " + H + ", 3)", "uint8", "0–255", String(v)],
             ["(3, " + H + ", " + H + ")", "float32", "0–1", (v / 255).toFixed(3)],
             ["(" + B + ", 3, " + H + ", " + H + ")", "float32", "0–1", (v / 255).toFixed(3)],
             ["(" + B + ", 3, " + H + ", " + H + ")", "float32", "−1–1", ((v / 255 - 0.5) / 0.5).toFixed(3)]][p - 1];
    var dk = ["PNG en disco", "image_dataset_from_directory", "batch_size=" + B, "Rescaling(1./255)"][p - 1];
    var dt = ["PNG en disco", "ToTensor()", "DataLoader(batch_size=" + B + ")", "Normalize(0.5, 0.5)"][p - 1];
    k[3] = k[3].replace(".", ","); t[3] = t[3].replace(".", ",");
    return { k: k, t: t, dk: dk, dt: dt };
  }

  /* canales al final: una rejilla donde cada píxel lleva sus 3 valores juntos (R|G|B) */
  function gridLast(ctx, x, y, s, C, hl) {
    var n = 4, c = s / n, i, j;
    for (i = 0; i < n; i++) for (j = 0; j < n; j++) {
      var px = x + j * c, py = y + i * c;
      D.rect(ctx, px, py, c / 3, c, C.terracotaWash); D.rect(ctx, px + c / 3, py, c / 3, c, C.olivaWash); D.rect(ctx, px + 2 * c / 3, py, c / 3, c, C.cobaltoWash);
      D.rect(ctx, px, py, c, c, null, C.line, 1);
    }
    if (hl) { D.rect(ctx, x, y, c / 3, c, C.terracota); D.rect(ctx, x, y, c, c, null, C.ink, 2); }
  }
  /* canales delante: tres planos separados R, G, B */
  function planes(ctx, x, y, s, C, hl) {
    var off = s * 0.16, cols = [[C.cobaltoWash, "B"], [C.olivaWash, "G"], [C.terracotaWash, "R"]];
    cols.forEach(function (cl, k) {
      var sz = s - 2 * off;
      D.rect(ctx, x + (2 - k) * off, y + k * off, sz, sz, cl[0], C.line, 1);
      D.text(ctx, cl[1], x + (2 - k) * off + sz - 6, y + k * off + 12, { size: 10, color: C.ink2, align: "right", weight: 600 });
    });
    var sz2 = s - 2 * off, c = sz2 / 4;
    if (hl) { D.rect(ctx, x, y + 2 * off, c, c, C.terracota); D.rect(ctx, x, y + 2 * off, c, c, null, C.ink, 2); }
  }
  function pila(ctx, x, y, s, fn, C, lote) {
    if (lote) for (var k = 3; k >= 1; k--) D.rect(ctx, x + k * 6, y - k * 6, s, s, C.surface, C.muted, 1);
    fn(ctx, x, y, s, C, true);
  }

  function draw(ctx, w, h, C) {
    var r = info(), half = w / 2, lote = S.paso >= 3, s = Math.min(half * 0.55, h - 116 - (lote ? 12 : 0)), y = 50;
    D.line(ctx, half, 8, half, h - 8, C.line, 1);
    [["Keras", gridLast, r.k, r.dk], ["PyTorch", S.paso === 1 ? gridLast : planes, r.t, r.dt]].forEach(function (col, i) {
      var cx = i * half + half / 2, x = cx - s / 2;
      D.text(ctx, col[0], cx, 20, { size: 14, weight: 700, align: "center", color: i ? C.terracotaInk : C.cobaltoInk });
      var et = half < 190 ? col[3].replace("image_dataset_from_directory", "…from_directory").replace("DataLoader(batch_size=", "DataLoader(B=") : col[3];
      D.text(ctx, et, cx, 36, { size: 10, align: "center", color: C.muted, mono: true });
      pila(ctx, x, y + (lote ? 12 : 0), s, col[1], C, lote);
      var canalDelante = i === 1 && S.paso > 1;
      D.text(ctx, canalDelante ? "3 planos: R, G, B" : "cada píxel: R G B juntos", cx, h - 50, { size: 10.5, align: "center", color: C.muted });
      D.text(ctx, col[2][0], cx, h - 32, { size: 12.5, weight: 700, align: "center", mono: true, color: C.ink });
      D.text(ctx, col[2][1] + " · " + col[2][2] + " · píxel " + col[2][3], cx, h - 13, { size: half < 190 ? 9.5 : 11, align: "center", mono: true, color: C.ink2 });
    });
  }

  function update() {
    var r = info();
    var msg = ["Mismo archivo, mismos números: aún no ha intervenido ningún framework.",
      "Keras deja los canales al final y el 0–255; PyTorch (ToTensor) pone el canal delante y divide entre 255.",
      "Los dos apilan un eje nuevo delante: el del lote. Solo cambia dónde está el canal.",
      "Keras divide entre 255 dentro del modelo; PyTorch resta la media 0,5 y divide entre 0,5: (" + (S.v / 255).toFixed(3).replace(".", ",") + " − 0,5) / 0,5 = " + ((S.v / 255 - 0.5) / 0.5).toFixed(3).replace(".", ",") + "."][S.paso - 1];
    out.set("Keras <b>" + r.k[0] + "</b> · PyTorch <b>" + r.t[0] + "</b><br>" + msg);
    view.redraw();
  }
  view.draw(draw); update();
});
