/* Experimento: el producto de matrices A @ B celda a celda (lección 1 del curso 3, módulo 1).
   A = visionados de Ana y Luis (2 × 3), B = género de cada película (3 × 2). Cada celda del resultado
   es una fila de A por una columna de B: se multiplican por parejas y se suman, y se ve sumando pareja a pareja. */
Lab.register("curso3/c3m1-matmul", function (root, api) {
  var D = api.d;
  var A = [[1, 2, 3], [4, 5, 6]], B = [[1, 0], [0, 1], [1, 1]];
  var FIL = ["Ana", "Luis"], COL = ["aventura", "romance"], PEL = ["Toy Story", "Titanic", "Shrek"];
  var S = { i: 0, j: 0, k: 3, t: 0 };
  var view = api.view(root, { aspect: 2.1, minH: 190, maxH: 260, label: "Producto de matrices: la fila de A y la columna de B que forman la celda elegida del resultado" });
  var ui = api.controls(root), out = api.readout(root);
  var opts = [], a, b;
  for (a = 0; a < 2; a++) for (b = 0; b < 2; b++) opts.push([a + "," + b, FIL[a] + " · " + COL[b]]);
  var sel = ui.select({ label: "Celda del resultado", options: opts, value: "0,0", onChange: function (v) { pick(+v[0], +v[2]); } });
  ui.button("Siguiente celda ▶", function () { var n = (S.i * 2 + S.j + 1) % 4; sel.set(Math.floor(n / 2) + "," + (n % 2)); pick(Math.floor(n / 2), n % 2); }, "primary");
  ui.button("Repetir la cuenta", function () { pick(S.i, S.j); });
  var loop = api.loop(function (dt) {
    S.t += dt;
    var k = Math.min(3, Math.floor(S.t / 0.7));
    if (k !== S.k) { S.k = k; update(); }
    return S.k < 3;
  });
  function pick(i, j) {
    S.i = i; S.j = j; S.t = 0;
    if (api.reduceMotion) { S.k = 3; update(); return; }
    S.k = 0; update(); loop.start();
  }
  function cell(i, j) { var s = 0; for (var k = 0; k < 3; k++) s += A[i][k] * B[k][j]; return s; }
  function draw(ctx, w, h, C) {
    var gap = w < 420 ? 20 : 34, s = Math.min(46, (w - 16 - 2 * gap) / 7), top = 46;
    var x0 = (w - (7 * s + 2 * gap)) / 2, xA = x0, xB = xA + 3 * s + gap, xC = xB + 2 * s + gap;
    var yA = top + s / 2, yB = top, yC = top + s / 2, fs = s >= 34 ? 14 : 12, i, j;
    D.text(ctx, w < 420 ? "A (2, 3)" : "A: veces vista (2, 3)", xA + 1.5 * s, 18, { align: "center", size: 12, weight: 700, color: C.ink });
    D.text(ctx, w < 420 ? "B (3, 2)" : "B: género (3, 2)", xB + s, 18, { align: "center", size: 12, weight: 700, color: C.ink });
    D.text(ctx, w < 420 ? "A @ B" : "A @ B (2, 2)", xC + s, 18, { align: "center", size: 12, weight: 700, color: C.ink });
    D.text(ctx, "@", xB - gap / 2, yB + 1.5 * s + 6, { align: "center", size: 16, weight: 700, color: C.ink2 });
    D.text(ctx, "=", xC - gap / 2, yB + 1.5 * s + 6, { align: "center", size: 16, weight: 700, color: C.ink2 });
    for (i = 0; i < 2; i++) for (j = 0; j < 3; j++) {
      var onA = i === S.i, hotA = onA && j <= S.k;
      D.rect(ctx, xA + j * s, yA + i * s, s, s, onA ? (hotA ? C.cobaltoWash : C.surface) : C.paper, onA ? C.cobalto : C.line, onA ? 2 : 1);
      D.text(ctx, String(A[i][j]), xA + j * s + s / 2, yA + i * s + s / 2 + 5, { align: "center", size: fs, mono: true, weight: onA ? 700 : 400, color: onA ? C.ink : C.muted });
    }
    for (i = 0; i < 3; i++) for (j = 0; j < 2; j++) {
      var onB = j === S.j, hotB = onB && i <= S.k;
      D.rect(ctx, xB + j * s, yB + i * s, s, s, onB ? (hotB ? C.terracotaWash : C.surface) : C.paper, onB ? C.terracota : C.line, onB ? 2 : 1);
      D.text(ctx, String(B[i][j]), xB + j * s + s / 2, yB + i * s + s / 2 + 5, { align: "center", size: fs, mono: true, weight: onB ? 700 : 400, color: onB ? C.ink : C.muted });
    }
    for (i = 0; i < 2; i++) for (j = 0; j < 2; j++) {
      var me = i === S.i && j === S.j, done = (i * 2 + j) < (S.i * 2 + S.j) || (me && S.k >= 3);
      D.rect(ctx, xC + j * s, yC + i * s, s, s, me ? C.olivaWash : C.paper, me ? C.oliva : C.line, me ? 2.5 : 1);
      var txt = me ? (S.k >= 3 ? String(cell(i, j)) : "…") : String(cell(i, j));
      D.text(ctx, txt, xC + j * s + s / 2, yC + i * s + s / 2 + 5, { align: "center", size: fs, mono: true, weight: me ? 700 : 400, color: me || done ? C.ink : C.muted });
    }
    var parts = [], sum = 0, k;
    for (k = 0; k < 3 && k <= Math.min(S.k, 2); k++) { parts.push(A[S.i][k] + "·" + B[k][S.j]); sum += A[S.i][k] * B[k][S.j]; }
    var line = parts.join(" + ") + (S.k >= 3 ? " = " + sum : " …");
    D.text(ctx, line, w / 2, h - 12, { align: "center", size: w < 420 ? 13 : 15, mono: true, weight: 700, color: C.oliva });
  }
  function update() {
    var i = S.i, j = S.j, k, t = [];
    for (k = 0; k < 3; k++) t.push(PEL[k] + ": " + A[i][k] + " × " + B[k][j]);
    out.set("<b>" + FIL[i] + "</b> en <b>" + COL[j] + "</b> = fila " + i + " de A por columna " + j + " de B.<br>" + t.join(" · ") +
      (S.k >= 3 ? "<br>Suma: <b>" + cell(i, j) + "</b>. Solo cuentan las películas de ese género (las que tienen un 1 en B)." : "<br>Sumando pareja a pareja…"));
    view.redraw();
  }
  view.draw(draw);
  update();
  return { destroy: function () { loop.stop(); } };
});
