/* Experimento: producto de matrices A (m×n) @ B (p×k). Si n = p el resultado es m×k y cada celda es
   «fila de A por columna de B» (multiplicar y sumar). Pulsa una celda del resultado o recorre las celdas con «Siguiente». */
Lab.register("curso4/c4m1-matmul", function (root, api) {
  var D = api.d;
  var st = { m: 2, n: 3, p: 3, k: 2, i: 0, j: 0 };
  var TA = [[1, 2, 3, 1], [4, 5, 6, 0], [7, 8, 9, 2], [1, 0, 2, 3]];   /* las dos primeras filas y tres columnas = el ejemplo a mano del texto */
  var TB = [[1, 0, 2, 1], [0, 1, 1, 0], [1, 1, 0, 2], [2, 1, 1, 0]];
  function A(r, c) { return TA[r][c]; }
  function B(r, c) { return TB[r][c]; }
  var view = api.view(root, { aspect: 2.2, minH: 230, maxH: 320, drag: true, label: "Producto de matrices: fila de A por columna de B da una celda de C" });
  var ui = api.controls(root), out = api.readout(root);
  var OPT = [[1, "1"], [2, "2"], [3, "3"], [4, "4"]];
  var selM = ui.select({ label: "A tiene m filas", value: 2, options: OPT, onChange: function (v) { st.m = +v; clamp(); update(); } });
  var selN = ui.select({ label: "A tiene n columnas", value: 3, options: OPT, onChange: function (v) { st.n = +v; update(); } });
  var selP = ui.select({ label: "B tiene p filas", value: 3, options: OPT, onChange: function (v) { st.p = +v; update(); } });
  var selK = ui.select({ label: "B tiene k columnas", value: 2, options: OPT, onChange: function (v) { st.k = +v; clamp(); update(); } });
  ui.button("Siguiente celda ▶", function () {
    if (st.n !== st.p) return;
    st.j++; if (st.j >= st.k) { st.j = 0; st.i = (st.i + 1) % st.m; } update();
  }, "primary");
  ui.button("Ejemplo del texto (2×3 por 3×2)", function () { set(2, 3, 3, 2); });
  ui.button("Producto escalar (1×3 por 3×1)", function () { set(1, 3, 3, 1); });
  ui.button("Forma incompatible (2×3 por 2×3)", function () { set(2, 3, 2, 3); });
  function set(m, n, p, k) { st.m = m; st.n = n; st.p = p; st.k = k; st.i = 0; st.j = 0; selM.set(m); selN.set(n); selP.set(p); selK.set(k); update(); }
  function clamp() { st.i = Math.min(st.i, st.m - 1); st.j = Math.min(st.j, st.k - 1); }
  var G = null;
  function draw(ctx, w, h, C) {
    var ok = st.n === st.p, mats = [[st.m, st.n, A, "A"], [st.p, st.k, B, "B"], [st.m, st.k, null, "C"]];
    var gap = 22, totCols = st.n + st.k + st.k, pad = 8;
    var cs = Math.min(40, (w - 2 * pad - 2 * gap) / totCols, (h - 54) / Math.max(st.m, st.p, 1));
    cs = Math.max(16, cs);
    var tw = totCols * cs + 2 * gap, ox = (w - tw) / 2, oy = 32 + Math.max(0, (h - 54 - Math.max(st.m, st.p) * cs) / 2);
    var xs = [ox, ox + st.n * cs + gap, ox + (st.n + st.k) * cs + 2 * gap];
    G = { xs: xs, oy: oy, cs: cs };
    mats.forEach(function (M, q) {
      var rows = M[0], cols = M[1], r, c;
      D.text(ctx, M[3] + " (" + rows + "×" + cols + ")", xs[q] + cols * cs / 2, 20, { align: "center", size: 12, weight: 700, color: C.ink, mono: true });
      for (r = 0; r < rows; r++) for (c = 0; c < cols; c++) {
        var hot = false, fill = C.surface, txt;
        if (q === 0) { hot = ok && r === st.i; fill = hot ? C.cobaltoWash : C.surface; txt = A(r, c); }
        else if (q === 1) { hot = ok && c === st.j; fill = hot ? C.terracotaWash : C.surface; txt = B(r, c); }
        else {
          hot = ok && r === st.i && c === st.j; fill = hot ? C.olivaWash : C.surface;
          txt = ok ? cval(r, c) : "?";
        }
        if (q === 2 && !ok) fill = C.terracotaWash;
        D.rect(ctx, xs[q] + c * cs, oy + r * cs, cs, cs, fill, hot ? C.ink : C.line, hot ? 2 : 1);
        D.text(ctx, String(txt), xs[q] + c * cs + cs / 2, oy + r * cs + cs / 2 + 4, { align: "center", size: cs < 24 ? 10 : 12.5, mono: true, color: C.ink, weight: hot ? 700 : 400 });
      }
    });
    D.text(ctx, "@", xs[0] + st.n * cs + gap / 2, oy + st.m * cs / 2 + 5, { align: "center", size: 16, weight: 700, color: C.ink });
    D.text(ctx, "=", xs[1] + st.k * cs + gap / 2, oy + st.m * cs / 2 + 5, { align: "center", size: 16, weight: 700, color: C.ink });
  }
  function cval(r, c) { var s = 0; for (var t = 0; t < st.n; t++) s += A(r, t) * B(t, c); return s; }
  view.pointer({ down: function (x, y) {
    if (!G || st.n !== st.p) return;
    var c = Math.floor((x - G.xs[2]) / G.cs), r = Math.floor((y - G.oy) / G.cs);
    if (c >= 0 && c < st.k && r >= 0 && r < st.m) { st.i = r; st.j = c; update(); }
  } });
  function update() {
    var ok = st.n === st.p, s = "<b>A</b> (" + st.m + "×" + st.n + ") @ <b>B</b> (" + st.p + "×" + st.k + ")<br>";
    if (!ok) {
      s += "<span class='bad'>RuntimeError: mat1 and mat2 shapes cannot be multiplied (" + st.m + "x" + st.n + " and " + st.p + "x" + st.k + ")</span><br>Las columnas de A (" + st.n + ") deben ser tantas como las filas de B (" + st.p + ").";
    } else {
      var parts = [], terms = [];
      for (var t = 0; t < st.n; t++) { parts.push("(" + A(st.i, t) + ")·(" + B(t, st.j) + ")"); terms.push(A(st.i, t) * B(t, st.j)); }
      s += "<span class='good'>Compatibles</span> → C tiene forma <b>(" + st.m + ", " + st.k + ")</b> y " + st.m * st.k + " celdas, cada una con " + st.n + " productos.<br>";
      s += "C[" + st.i + "," + st.j + "] = fila " + st.i + " de A · columna " + st.j + " de B = " + parts.join(" + ") + " = " + terms.map(function (q) { return q < 0 ? "(" + q + ")" : q; }).join(" + ") + " = <b>" + cval(st.i, st.j) + "</b>";
    }
    out.set(s); view.redraw();
  }
  view.draw(draw); update();
});
