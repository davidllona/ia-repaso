/* Experimento: una convolución es una multiplicación por una matriz C; la convolución transpuesta
   usa la MISMA matriz traspuesta (Cᵀ). Se ve que cada fila de C es, redibujada en 4×4, un "sello". */
Lab.register("curso3/c3m2-convt-matriz", function (root, api) {
  var st = { mode: "conv", r: 0 };
  var X = [], Y = [1, 2, 3, 4], K = [1, 2, 3, 4, 5, 6, 7, 8, 9], i;
  for (i = 0; i < 16; i++) X.push(i + 1);

  function buildC() {
    var C = [], r, c, a, b;
    for (r = 0; r < 4; r++) {
      C.push(new Array(16).fill(0));
      var oi = Math.floor(r / 2), oj = r % 2;
      for (a = 0; a < 3; a++) for (b = 0; b < 3; b++) C[r][(oi + a) * 4 + (oj + b)] = K[a * 3 + b];
    }
    return C;
  }
  function mulC(C, x) { return C.map(function (row) { var s = 0, c; for (c = 0; c < 16; c++) s += row[c] * x[c]; return s; }); }
  function mulCt(C, y) { var out = new Array(16).fill(0), r, c; for (r = 0; r < 4; r++) for (c = 0; c < 16; c++) out[c] += C[r][c] * y[r]; return out; }

  var view = api.view(root, { aspect: 1.75, minH: 340, maxH: 430, label: "Matriz C de la convolución, entrada y salida" });
  var ui = api.controls(root), out = api.readout(root);
  ui.segmented({ label: "Operación", options: [["conv", "Convolución: y = C·x"], ["trans", "Transpuesta: z = Cᵀ·y"], ["round", "Ida y vuelta: Cᵀ(C·x)"]], value: "conv", onChange: function (v) { st.mode = v; update(); } });
  ui.button("Kernel aleatorio", function () { var rg = api.rng(Math.floor(Math.random() * 1e6)); K = K.map(function () { return rg.int(-2, 9); }); update(); });
  ui.button("Kernel 1…9", function () { K = [1, 2, 3, 4, 5, 6, 7, 8, 9]; update(); });

  function L(w, h) {
    var g = Math.max(18, Math.min(42, (w / 2 - 34) / 4));
    var topH = 4 * g + 28;
    var cw = Math.min(30, (w - 36) / 16), ch = Math.min(34, cw * 1.35);
    return { g: g, topH: topH, cw: cw, ch: ch, mx: (w - cw * 16) / 2 + 8, my: topH + 40,
             ax: Math.max(6, w / 2 - 10 - 4 * g - 6), ay: 22, bx: w / 2 + 28, by: 22 };
  }
  function vals() {
    var C = buildC();
    if (st.mode === "conv") return { C: C, a: X, an: 4, b: mulC(C, X), bn: 2 };
    if (st.mode === "trans") return { C: C, a: Y, an: 2, b: mulCt(C, Y), bn: 4 };
    var y = mulC(C, X); return { C: C, a: X, an: 4, b: mulCt(C, y), bn: 4, y: y };
  }

  view.draw(function (ctx, w, h, C) {
    var D = api.d, V = vals(), g = L(w, h), r, c, i2, j2, sz;
    function grid(x0, y0, arr, n, cell, fill, title, highlight) {
      D.text(ctx, title, x0 + n * cell / 2, y0 - 7, { size: 11, weight: 600, align: "center", color: C.ink2 });
      for (i2 = 0; i2 < n; i2++) for (j2 = 0; j2 < n; j2++) {
        var x = x0 + j2 * cell, y = y0 + i2 * cell, hl = highlight && highlight[i2 * n + j2];
        D.rect(ctx, x, y, cell, cell, hl ? C.terracotaWash : fill, C.line, 1);
        D.text(ctx, String(Math.round(arr[i2 * n + j2] * 100) / 100), x + cell / 2, y + cell / 2 + 4, { size: Math.min(14, cell * 0.38), align: "center", mono: true, weight: 600, color: C.ink });
      }
    }
    var hlIn = new Array(16).fill(false), hlOut = new Array(16).fill(false);
    var row = V.C[st.r], oi = Math.floor(st.r / 2), oj = st.r % 2, a, b;
    for (a = 0; a < 3; a++) for (b = 0; b < 3; b++) { hlIn[(oi + a) * 4 + (oj + b)] = true; hlOut[(oi + a) * 4 + (oj + b)] = true; }
    var inTitle = st.mode === "trans" ? "y (2×2)" : "x (4×4)";
    var outTitle = st.mode === "conv" ? "y = C·x (2×2)" : (st.mode === "trans" ? "z = Cᵀ·y (4×4)" : "Cᵀ(C·x) (4×4)");
    var cellA = V.an === 4 ? g.g : g.g * 1.6, cellB = V.bn === 4 ? g.g : g.g * 1.6;
    var ya = g.ay + (4 * g.g - V.an * cellA) / 2 + 6, yb = g.by + (4 * g.g - V.bn * cellB) / 2 + 6;
    var xa = g.ax + (4 * g.g - V.an * cellA) / 2, xb = g.bx + (4 * g.g - V.bn * cellB) / 2;
    var hA = null, hB = null;
    if (st.mode === "conv") hA = hlIn; else if (st.mode === "trans") { hA = new Array(4).fill(false); hA[st.r] = true; hB = hlOut; } else hA = hlIn;
    if (st.mode === "conv") { hB = new Array(4).fill(false); hB[st.r] = true; }
    grid(xa, ya, V.a, V.an, cellA, C.cobaltoWash, inTitle, hA);
    grid(xb, yb, V.b, V.bn, cellB, C.surface, outTitle, hB);
    D.arrow(ctx, w / 2 - 14, ya + 2 * g.g - 6, w / 2 + 14, ya + 2 * g.g - 6, C.ink, 2);
    D.text(ctx, st.mode === "conv" ? "× C" : (st.mode === "trans" ? "× Cᵀ" : "× C, × Cᵀ"), w / 2, ya + 2 * g.g + 10, { size: 11, align: "center", mono: true, weight: 600, color: C.terracotaInk });

    /* matriz C (4 × 16) */
    D.text(ctx, (w < 520 ? "Matriz C: 4 filas (y) × 16 columnas (x)" : "Matriz C (4 filas × 16 columnas): una fila por casilla de y, una columna por casilla de x"), w / 2, g.topH + 12, { size: Math.min(11, w / 38), align: "center", color: C.ink2, weight: 600 });
    for (c = 0; c < 4; c++) D.text(ctx, "fila " + c + " de x", g.mx + (c * 4 + 2) * g.cw, g.topH + 33, { size: Math.min(9.5, g.cw * 0.42), align: "center", color: C.muted });
    for (r = 0; r < 4; r++) {
      D.text(ctx, "y" + r, g.mx - 4, g.my + r * g.ch + g.ch / 2 + 4, { size: 10, align: "right", color: r === st.r ? C.terracotaInk : C.muted, mono: true, weight: r === st.r ? 700 : 400 });
      for (c = 0; c < 16; c++) {
        var v = V.C[r][c], x2 = g.mx + c * g.cw, y2 = g.my + r * g.ch;
        D.rect(ctx, x2, y2, g.cw, g.ch, v !== 0 ? (r === st.r ? C.terracotaWash : C.cobaltoWash) : C.surface, C.line, 1);
        if (v !== 0) D.text(ctx, String(v), x2 + g.cw / 2, y2 + g.ch / 2 + 4, { size: Math.min(12, g.cw * 0.5), align: "center", mono: true, weight: 600, color: C.ink });
        else D.text(ctx, "·", x2 + g.cw / 2, y2 + g.ch / 2 + 3, { size: 10, align: "center", color: C.muted });
      }
      if (r === st.r) D.rect(ctx, g.mx, g.my + r * g.ch, 16 * g.cw, g.ch, null, C.terracota, 2.5);
    }
    for (c = 1; c < 4; c++) D.line(ctx, g.mx + c * 4 * g.cw, g.my, g.mx + c * 4 * g.cw, g.my + 4 * g.ch, C.ink, 1.3);
    D.text(ctx, (w < 520 ? "toca una fila de C · toca x o y para editar" : "toca una fila de C (o una casilla) para elegirla · toca x o y para cambiar valores"), w / 2, h - 5, { size: Math.min(10, w / 40), align: "center", color: C.muted });
  });

  view.pointer({
    down: function (px, py) {
      var V = vals(), g = L(view.w, view.h), r, c;
      /* fila de la matriz */
      r = Math.floor((py - g.my) / g.ch); c = Math.floor((px - g.mx) / g.cw);
      if (r >= 0 && r < 4 && c >= 0 && c < 16) { st.r = r; update(); return; }
      /* casillas de la izquierda (editar) */
      var cellA = V.an === 4 ? g.g : g.g * 1.6, ya = g.ay + (4 * g.g - V.an * cellA) / 2 + 6, xa = g.ax + (4 * g.g - V.an * cellA) / 2;
      var ii = Math.floor((py - ya) / cellA), jj = Math.floor((px - xa) / cellA);
      if (ii >= 0 && ii < V.an && jj >= 0 && jj < V.an) {
        if (st.mode === "trans") Y[ii * 2 + jj] = (Y[ii * 2 + jj] + 1) % 10; else X[ii * 4 + jj] = (X[ii * 4 + jj] + 1) % 17;
        update(); return;
      }
      var cellB = V.bn === 4 ? g.g : g.g * 1.6, yb = g.by + (4 * g.g - V.bn * cellB) / 2 + 6, xb = g.bx + (4 * g.g - V.bn * cellB) / 2;
      ii = Math.floor((py - yb) / cellB); jj = Math.floor((px - xb) / cellB);
      if (ii >= 0 && ii < V.bn && jj >= 0 && jj < V.bn && V.bn === 2) { st.r = ii * 2 + jj; update(); }
    }
  });

  function update() {
    var V = vals(), html, oi = Math.floor(st.r / 2), oj = st.r % 2, a, b, terms = [];
    view.redraw();
    if (st.mode === "conv") {
      for (a = 0; a < 3; a++) for (b = 0; b < 3; b++) terms.push(K[a * 3 + b] + "·" + X[(oi + a) * 4 + (oj + b)]);
      html = "y" + st.r + " = (fila " + st.r + " de C)·x = " + terms.join(" + ") + " = <b>" + V.b[st.r] + "</b><br>Cada fila de C solo tiene 9 números distintos de cero: los 9 pesos del kernel, colocados donde está la ventana " + st.r + ". Las 16 columnas son los 16 píxeles de x.";
    } else if (st.mode === "trans") {
      html = "Cᵀ·y = suma de (cada y" + "<sub>r</sub> × la fila r de C). Con y" + st.r + " = " + Y[st.r] + ": la fila " + st.r + " de C, redibujada como 4×4, es <b>el sello</b> de y" + st.r + ". Multiplicado por " + Y[st.r] + " pone el kernel escalado en las casillas marcadas.<br>Con 2×2 → 4×4 y esta misma matriz, la transpuesta devuelve el mismo resultado que el método de los sellos.";
    } else {
      var back = V.b, same = true, q;
      for (q = 0; q < 16; q++) if (back[q] !== X[q]) same = false;
      html = "x original: [" + X.slice(0, 4).join(", ") + " …]<br>Cᵀ(C·x): [" + back.slice(0, 4).join(", ") + " …] → " + (same ? "<span class='good'>idéntica</span>" : "<span class='bad'>NO es x</span>") + "<br>Transponer no es invertir: Cᵀ solo recupera la <b>forma</b> (16 números), no los valores. Por eso «deconvolución» es un mal nombre.";
    }
    out.set(html);
  }
  update();
});
