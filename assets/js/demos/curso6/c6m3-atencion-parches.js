/* Experimento: una miniatura de 32×32 troceada en 8×8 parches de 4×4. Eliges un parche (tocándolo o con
   el deslizador) y un tipo de cabeza; el mapa de calor muestra cuánto mira ese parche a cada uno de los 64
   (softmax de sus puntuaciones: la fila suma 1). La opción «token CLS» muestra a quién mira el resumen. */
Lab.register("curso6/c6m3-atencion-parches", function (root, api) {
  var R = api.rng(11), M = [], x, y;
  for (y = 0; y < 32; y++) { M.push([]); for (x = 0; x < 32; x++) M[y].push(R.next() < 0.15 ? 1 : 0); }
  for (y = 1; y < 7; y++) for (x = 2; x < 30; x++) M[y][x] = 2;                       // título
  for (x = 4; x < 28; x++) if (x % 4 !== 0) { M[3][x] = 3; M[4][x] = 3; }
  for (y = 11; y < 29; y++) for (x = 6; x < 20; x++) { var dx = x - 12.5, dy = y - 18; if (dx * dx / 40 + dy * dy / 70 < 1) M[y][x] = 4; } // personaje
  for (y = 14; y < 28; y++) for (x = 21; x < 28; x++) { var ex = x - 24.5, ey = y - 21; if (ex * ex / 9 + ey * ey / 40 < 1) M[y][x] = 4; } // otro personaje
  M[15][10] = 5; M[15][14] = 5; M[18][23] = 5; M[18][26] = 5;

  // rasgos de cada parche: proporción de cada color (6 tipos)
  var F = [], r, c;
  for (r = 0; r < 8; r++) for (c = 0; c < 8; c++) {
    var h = [0, 0, 0, 0, 0, 0];
    for (y = 0; y < 4; y++) for (x = 0; x < 4; x++) h[M[r * 4 + y][c * 4 + x]] += 1 / 16;
    F.push(h);
  }
  var S = { q: 35, modo: "contenido" };

  var view = api.view(root, { aspect: 1.35, minH: 300, maxH: 420, label: "Miniatura troceada en 8 por 8 parches; un mapa de calor muestra a qué parches presta atención el parche elegido" });
  var ui = api.controls(root), out = api.readout(root);
  var sel = ui.select({ label: "Qué cabeza miras", value: S.modo,
    options: [["contenido", "Por contenido"], ["vecindad", "Por cercanía"], ["cls", "Token CLS"]],
    onChange: function (v) { S.modo = v; update(); } });
  function aParche() { if (S.modo === "cls") { S.modo = "contenido"; sel.set("contenido"); } }
  var sq = ui.slider({ label: "Parche que pregunta (también puedes tocarlo)", min: 1, max: 64, step: 1, value: S.q + 1,
    fmt: function (v) { return v + " (fila " + (Math.floor((v - 1) / 8) + 1) + ", col " + ((v - 1) % 8 + 1) + ")"; },
    onInput: function (v) { S.q = v - 1; aParche(); update(); } });

  function pesos() {
    var z = [], j;
    for (j = 0; j < 64; j++) {
      if (S.modo === "cls") z.push(6 * F[j][2] + 2 * F[j][3] + 0.8 * F[j][4]);   // el CLS busca el título
      else if (S.modo === "vecindad") {
        var a = [Math.floor(S.q / 8), S.q % 8], b = [Math.floor(j / 8), j % 8];
        var d2 = (a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]);
        z.push(-d2 / 1.6);
      } else {
        var dot = 0, na = 0, nb = 0;
        for (var t = 0; t < 6; t++) { dot += F[S.q][t] * F[j][t]; na += F[S.q][t] * F[S.q][t]; nb += F[j][t] * F[j][t]; }
        z.push(7 * dot / Math.sqrt(na * nb + 1e-9));
      }
    }
    return api.math.softmax(z);
  }

  var geo = null;
  function draw(ctx, w, h, C) {
    var P = Math.min(h - 30, w > 520 ? w * 0.62 : w - 20), x0 = Math.max(10, (w - P) / 2 - (w > 520 ? 90 : 0)), y0 = 22, s = P / 8, px = P / 32;
    geo = { x0: x0, y0: y0, s: s };
    var col = [C.cobaltoWash, C.paper2, C.terracota, C.paper, C.oliva, C.ink];
    for (y = 0; y < 32; y++) for (x = 0; x < 32; x++) api.d.rect(ctx, x0 + x * px, y0 + y * px, Math.ceil(px), Math.ceil(px), col[M[y][x]]);
    var W = pesos(), mx = Math.max.apply(null, W), j;
    for (j = 0; j < 64; j++) {
      var rr = Math.floor(j / 8), cc = j % 8;
      ctx.save(); ctx.globalAlpha = 0.78 * (1 - W[j] / mx);
      api.d.rect(ctx, x0 + cc * s, y0 + rr * s, s, s, C.paper); ctx.restore();
      if (W[j] / mx > 0.35) api.d.text(ctx, Math.round(W[j] * 100) + "%", x0 + cc * s + s / 2, y0 + rr * s + s / 2 + 4, { align: "center", size: Math.min(12, s * 0.36), weight: 700, color: C.ink });
    }
    for (j = 0; j <= 8; j++) {
      api.d.line(ctx, x0, y0 + j * s, x0 + P, y0 + j * s, C.line, 0.7);
      api.d.line(ctx, x0 + j * s, y0, x0 + j * s, y0 + P, C.line, 0.7);
    }
    if (S.modo !== "cls") api.d.rect(ctx, x0 + (S.q % 8) * s, y0 + Math.floor(S.q / 8) * s, s, s, null, C.terracota, 3);
    api.d.text(ctx, S.modo === "cls" ? "a quién mira el token CLS" : "a quién mira el parche naranja", x0 + P / 2, 14, { align: "center", size: 12, weight: 600, color: C.ink2 });
    if (w > 520) {
      var lx = x0 + P + 24, ly = y0 + 10;
      api.d.text(ctx, "Más brillo = más atención.", lx, ly, { size: 12, color: C.ink2 });
      api.d.text(ctx, "La fila de pesos suma 100 %.", lx, ly + 18, { size: 12, color: C.ink2 });
      api.d.text(ctx, "64 parches + CLS = 65 tokens", lx, ly + 48, { size: 12, color: C.muted });
      api.d.text(ctx, "→ 65 × 65 = 4.225 pesos", lx, ly + 66, { size: 12, color: C.muted });
      api.d.text(ctx, "por cabeza y bloque", lx, ly + 84, { size: 12, color: C.muted });
    }
  }

  view.pointer({ down: function (px, py) {
    if (!geo) return;
    var c = Math.floor((px - geo.x0) / geo.s), r = Math.floor((py - geo.y0) / geo.s);
    if (c < 0 || c > 7 || r < 0 || r > 7) return;
    S.q = r * 8 + c; aParche();
    sq.set(S.q + 1, true); update();
  } });

  function update() {
    view.redraw();
    var W = pesos(), idx = [], j;
    for (j = 0; j < 64; j++) idx.push(j);
    idx.sort(function (a, b) { return W[b] - W[a]; });
    var top = idx.slice(0, 3).map(function (k) { return "fila " + (Math.floor(k / 8) + 1) + "·col " + (k % 8 + 1) + " (" + (W[k] * 100).toFixed(1) + " %)"; });
    var titulo = 0; for (j = 0; j < 8; j++) titulo += W[j] + W[8 + j];
    out.set((S.modo === "cls" ? "El <b>token CLS</b>" : "El parche <b>" + (S.q + 1) + "</b>") + " mira sobre todo a: " + top.join(", ") + "<br>" +
      "Atención total a las dos filas del título: <b>" + (titulo * 100).toFixed(0) + " %</b> · suma de la fila: " + (api.math.sum(W) * 100).toFixed(0) + " %" +
      (S.modo === "vecindad" ? "<br>Esta cabeza imita a una convolución: mira cerca. Un ViT tiene que <b>aprender</b> a hacerlo." : "") +
      (S.modo === "contenido" ? "<br>Mira lejos sin problema: lo que cuenta es parecerse, no estar al lado." : ""));
  }
  view.draw(draw); update();
});
