/* Experimento: dos miniaturas de 32×32 troceadas en 4×4 parches. La B es la A con la fila de arriba
   (título) y la de abajo (créditos) intercambiadas: contienen exactamente los mismos 16 parches.
   Sin posición, el Transformer recibe la misma «bolsa» de parches y da la misma probabilidad a las dos;
   con posición, cada parche lleva su lugar sumado y las distingue. */
Lab.register("curso6/c6m3-posicion", function (root, api) {
  var R = api.rng(7), S = { pos: false, orden: [] }, k;
  for (k = 0; k < 16; k++) S.orden.push(k);

  // póster A en píxeles (0 fondo, 1 fondo2, 2 título, 3 letras, 4 personaje, 5 ojos, 6 créditos)
  var A = [], x, y;
  for (y = 0; y < 32; y++) { A.push([]); for (x = 0; x < 32; x++) A[y].push(R.next() < 0.18 ? 1 : 0); }
  for (y = 1; y < 6; y++) for (x = 3; x < 29; x++) A[y][x] = 2;
  for (x = 5; x < 27; x++) if (x % 4 !== 0) A[3][x] = 3;
  for (y = 9; y < 24; y++) for (x = 9; x < 23; x++) { var dx = x - 15.5, dy = y - 16; if (dx * dx + dy * dy < 40) A[y][x] = 4; }
  A[14][13] = 5; A[14][18] = 5;
  for (x = 6; x < 26; x++) if (x % 3) A[28][x] = 6;
  // B: intercambia la fila de parches 0 (y 0–7) con la 3 (y 24–31)
  var B = A.map(function (f, yy) { var src = yy < 8 ? yy + 24 : yy >= 24 ? yy - 24 : yy; return A[src].slice(); });
  var filaDe = [3, 1, 2, 0];   // en B, el parche de la fila r de A está en la fila filaDe[r]

  var view = api.view(root, { aspect: 1.05, minH: 360, maxH: 480, label: "Dos miniaturas, una con el título arriba y otra abajo, y debajo los 16 parches de cada una sueltos como bolsa de tokens" });
  var ui = api.controls(root), out = api.readout(root);
  var tg = ui.toggle({ label: "Sumar la posición a cada parche", value: false, onChange: function (v) { S.pos = v; update(); } });
  ui.button("Barajar los parches", function () { R.shuffle(S.orden); update(); }, "primary");

  function col(v, C) { return [C.cobaltoWash, C.paper2, C.terracota, C.paper, C.oliva, C.ink, C.ink2][v]; }
  function pinta(ctx, M, s, C, ry, rx, nx, ny) {     // copia el parche (ry, rx) en (nx, ny)
    var px = s / 8;
    for (var y = 0; y < 8; y++) for (var x = 0; x < 8; x++)
      api.d.rect(ctx, nx + x * px, ny + y * px, Math.ceil(px), Math.ceil(px), col(M[ry * 8 + y][rx * 8 + x], C));
  }

  // modelo de juguete: sin posición solo cuenta el contenido (simétrico); con posición, título en fila 0 suma
  function prob(esB) {
    if (!S.pos) return 0.5;
    var filaTitulo = esB ? 3 : 0;
    var z = filaTitulo === 0 ? 3.4 : -3.4;
    return 1 / (1 + Math.exp(-z));
  }

  function draw(ctx, w, h, C) {
    var colW = (w - 36) / 2, P = Math.min(colW, h * 0.34, 170), i;
    [[A, "A · título arriba", false], [B, "B · título abajo", true]].forEach(function (it, j) {
      var M = it[0], cx = 12 + j * (colW + 12), x0 = cx + (colW - P) / 2, y0 = 20, s = P / 4, r, c;
      api.d.text(ctx, it[1], cx + colW / 2, 13, { align: "center", size: 12, weight: 600, color: C.ink2 });
      for (r = 0; r < 4; r++) for (c = 0; c < 4; c++) pinta(ctx, M, s, C, r, c, x0 + c * s, y0 + r * s);
      for (r = 0; r <= 4; r++) {
        api.d.line(ctx, x0, y0 + r * s, x0 + P, y0 + r * s, C.ink, 0.8);
        api.d.line(ctx, x0 + r * s, y0, x0 + r * s, y0 + P, C.ink, 0.8);
      }
      // bolsa de tokens
      var by = y0 + P + 30, g = 6, t = Math.min((colW - 18) / 4, (h - by - 56 - 3 * g) / 4), bx = cx + (colW - (4 * t + 3 * g)) / 2;
      api.d.text(ctx, "bolsa de 16 tokens", cx + colW / 2, by - 9, { align: "center", size: 11, color: C.muted });
      for (i = 0; i < 16; i++) {
        var idx = S.orden[i], rA = Math.floor(idx / 4), cA = idx % 4;
        var rM = j ? filaDe[rA] : rA;                        // dónde está ese contenido en este póster
        var nx = bx + (i % 4) * (t + g), ny = by + Math.floor(i / 4) * (t + g);
        pinta(ctx, M, t, C, rM, cA, nx, ny);
        api.d.rect(ctx, nx, ny, t, t, null, C.line, 1);
        if (S.pos) {
          var lab = String(rM * 4 + cA + 1);
          api.d.rect(ctx, nx + t - 17, ny + t - 13, 17, 13, C.ink);
          api.d.text(ctx, lab, nx + t - 8.5, ny + t - 3, { align: "center", size: 10, weight: 700, color: C.paper });
        }
      }
      // barra de probabilidad
      var pr = prob(j === 1), yb = h - 22, bw = colW - 10;
      api.d.rect(ctx, cx + 5, yb, bw, 12, C.paper2, C.line, 1);
      api.d.rect(ctx, cx + 5, yb, bw * pr, 12, S.pos ? (j ? C.cobalto : C.terracota) : C.muted);
      api.d.text(ctx, "P(título arriba) = " + Math.round(pr * 100) + " %", cx + colW / 2, yb - 5, { align: "center", size: 12, weight: 600, color: C.ink });
    });
  }

  function update() {
    view.redraw();
    out.set(S.pos
      ? "Con posición cada token es <b>contenido + vector de su lugar</b> (número de la esquina). La banda del título lleva «1–4» en A y «13–16» en B: las bolsas ya son distintas y el modelo las separa."
      : "Sin posición, A y B dan <b>la misma bolsa</b> de parches (baraja y compruébalo). El modelo no puede distinguirlas: <span class='bad'>50 % para las dos</span>.");
  }
  view.draw(draw); update();
});
