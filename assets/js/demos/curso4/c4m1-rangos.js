/* Experimento: rango, forma, dtype y memoria de un tensor. Se construye un tensor de 0 a 3 ejes con los números 1..n,
   se calcula ndim, numel y bytes de verdad, y se puede pulsar cualquier celda para ver su índice t[i, j, k]. */
Lab.register("curso4/c4m1-rangos", function (root, api) {
  var D = api.d;
  var DT = { float32: [4, true], float64: [8, true], int64: [8, false], int32: [4, false], int8: [1, false] };
  var st = { rank: 2, dims: [2, 3, 4], dtype: "float32", sel: null };
  var view = api.view(root, { aspect: 2.1, minH: 210, maxH: 300, drag: true, label: "Tensor dibujado como números en celdas; pulsa una celda para ver su índice" });
  var ui = api.controls(root), out = api.readout(root);
  ui.segmented({ label: "Rango (número de ejes)", value: 2, options: [[0, "0 · escalar"], [1, "1 · vector"], [2, "2 · matriz"], [3, "3 · cubo"]], onChange: function (v) { st.rank = v; st.sel = null; update(); } });
  var OPT = [[1, "1"], [2, "2"], [3, "3"], [4, "4"]];
  var s0 = ui.select({ label: "Tamaño del eje 0", value: 2, options: OPT, onChange: function (v) { st.dims[0] = +v; st.sel = null; update(); } });
  var s1 = ui.select({ label: "Tamaño del eje 1", value: 3, options: OPT, onChange: function (v) { st.dims[1] = +v; st.sel = null; update(); } });
  var s2 = ui.select({ label: "Tamaño del eje 2", value: 4, options: OPT, onChange: function (v) { st.dims[2] = +v; st.sel = null; update(); } });
  ui.select({ label: "dtype", value: "float32", options: [["float32", "torch.float32 (4 bytes)"], ["float64", "torch.float64 (8 bytes)"], ["int64", "torch.int64 (8 bytes)"], ["int32", "torch.int32 (4 bytes)"], ["int8", "torch.int8 (1 byte)"]], onChange: function (v) { st.dtype = v; update(); } });

  function shape() { return st.dims.slice(0, st.rank); }
  function numel() { return shape().reduce(function (a, b) { return a * b; }, 1); }
  function fmtShape(s) { return s.length === 0 ? "()" : s.length === 1 ? "(" + s[0] + ",)" : "(" + s.join(", ") + ")"; }
  function val(n) { return DT[st.dtype][1] ? n + "." : String(n); }
  function layout(w, h) {
    var s = shape(), r = st.rank, d0 = s[0] || 1, d1 = r >= 2 ? s[1] : 1, d2 = r >= 3 ? s[2] : r === 2 ? s[1] : r === 1 ? s[0] : 1;
    var blocks = r === 3 ? s[0] : 1, rows = r === 3 ? s[1] : r === 2 ? s[0] : 1, cols = r === 3 ? s[2] : r === 2 ? s[1] : r === 1 ? s[0] : 1;
    var gap = 14, padX = 12, top = r === 3 ? 34 : 18;
    var cs = Math.min(46, (w - 2 * padX - (blocks - 1) * gap) / (blocks * cols), (h - top - 30) / rows);
    cs = Math.max(14, cs);
    var tw = blocks * cols * cs + (blocks - 1) * gap, ox = (w - tw) / 2, oy = top + Math.max(0, (h - top - 30 - rows * cs) / 2);
    return { blocks: blocks, rows: rows, cols: cols, cs: cs, ox: ox, oy: oy, gap: gap };
  }
  function cellRect(L, b, i, j) { return [L.ox + b * (L.cols * L.cs + L.gap) + j * L.cs, L.oy + i * L.cs]; }
  function flat(b, i, j) { return (b * L0.rows + i) * L0.cols + j; }
  var L0 = null;

  function draw(ctx, w, h, C) {
    var L = L0 = layout(w, h), b, i, j;
    for (b = 0; b < L.blocks; b++) {
      if (st.rank === 3) D.text(ctx, "t[" + b + "]", L.ox + b * (L.cols * L.cs + L.gap) + L.cols * L.cs / 2, L.oy - 8, { align: "center", size: 11, mono: true, color: C.muted, weight: 600 });
      for (i = 0; i < L.rows; i++) for (j = 0; j < L.cols; j++) {
        var p = cellRect(L, b, i, j), isSel = st.sel && st.sel[0] === b && st.sel[1] === i && st.sel[2] === j;
        D.rect(ctx, p[0], p[1], L.cs, L.cs, isSel ? C.terracotaWash : (st.rank === 3 && b % 2 ? C.olivaWash : C.cobaltoWash), isSel ? C.terracota : C.ink, isSel ? 2.4 : 1);
        var txt = val(flat(b, i, j) + 1);
        D.text(ctx, txt, p[0] + L.cs / 2, p[1] + L.cs / 2 + 4, { align: "center", size: L.cs < 24 ? 9.5 : 12, mono: true, color: C.ink, weight: 600 });
      }
    }
    var lab = st.rank === 0 ? "un solo número, sin ejes" : st.rank === 1 ? "1 eje: " + L.cols + " números en fila" : st.rank === 2 ? "2 ejes: " + L.rows + " filas × " + L.cols + " columnas" : "3 ejes: " + L.blocks + " bloques de " + L.rows + " × " + L.cols;
    D.text(ctx, lab, w / 2, h - 8, { align: "center", size: 11.5, color: C.ink2, weight: 600 });
  }
  view.draw(draw);
  view.pointer({ down: function (x, y) {
    var L = L0, b, i, j;
    for (b = 0; b < L.blocks; b++) for (i = 0; i < L.rows; i++) for (j = 0; j < L.cols; j++) {
      var p = cellRect(L, b, i, j);
      if (x >= p[0] && x < p[0] + L.cs && y >= p[1] && y < p[1] + L.cs) { st.sel = [b, i, j]; update(); return; }
    }
  } });

  function update() {
    var s = shape(), n = numel(), bytes = n * DT[st.dtype][0], r = st.rank;
    s0.el.disabled = r < 1; s1.el.disabled = r < 2; s2.el.disabled = r < 3;
    [s0, s1, s2].forEach(function (c, k) { c.el.parentNode.style.opacity = k < r ? 1 : 0.35; });
    var h = "<b>t.shape</b> = torch.Size(" + (s.length === 1 ? "[" + s[0] + "]" : "[" + s.join(", ") + "]") + ") · <b>t.ndim</b> = " + r + " · <b>t.numel()</b> = " + (s.length ? s.join(" × ") + " = " : "") + n +
      "<br><b>t.dtype</b> = torch." + st.dtype + " · memoria = " + n + " × " + DT[st.dtype][0] + " bytes = <b>" + bytes + " bytes</b>";
    if (st.sel) {
      var k = st.sel, idx = r === 0 ? "t" : r === 1 ? "t[" + k[2] + "]" : r === 2 ? "t[" + k[1] + ", " + k[2] + "]" : "t[" + k[0] + ", " + k[1] + ", " + k[2] + "]";
      h += "<br>Celda elegida: <b>" + idx + "</b> = " + val(flat(k[0], k[1], k[2]) + 1) + " (posición " + flat(k[0], k[1], k[2]) + " en memoria)";
    } else h += "<br>Pulsa una celda para ver su índice.";
    out.set(h); view.redraw();
  }
  update();
});
