/* Experimento: view / reshape / .T y la memoria. Un tensor es una tira de memoria (storage) más una forma y unos «strides»
   (cuántos pasos de memoria se salta al avanzar un índice). Se calculan de verdad forma, strides y contigüidad. */
Lab.register("curso4/c4m1-memoria", function (root, api) {
  var D = api.d;
  var base = [], i;
  for (i = 1; i <= 12; i++) base.push(i);
  var st = { store: base.slice(), copy: null, op: "v34", msg: "" };
  var OPS = {
    v12: { name: "x", shape: [12], strides: [1] },
    v34: { name: "x.view(3, 4)", shape: [3, 4], strides: [4, 1] },
    v43: { name: "x.view(4, 3)", shape: [4, 3], strides: [3, 1] },
    t43: { name: "x.view(3, 4).T", shape: [4, 3], strides: [1, 4] },
    cont: { name: "x.view(3, 4).T.contiguous()", shape: [4, 3], strides: [3, 1], copy: true }
  };
  var view = api.view(root, { aspect: 1.55, minH: 300, maxH: 420, label: "La memoria de 12 carátulas seguidas y el tensor (parrilla) que las mira con una forma y unos strides" });
  var ui = api.controls(root), out = api.readout(root);
  ui.select({ label: "Vista sobre la misma memoria", value: "v34", options: [["v12", "x  (forma (12,))"], ["v34", "x.view(3, 4)"], ["v43", "x.view(4, 3)"], ["t43", "x.view(3, 4).T  (transpuesta)"], ["cont", "…T.contiguous()  (copia)"]], onChange: function (v) { st.op = v; st.copy = v === "cont" ? makeCopy() : null; st.msg = ""; update(); } });
  ui.button("Probar .view(12) sobre esta vista", function () {
    var o = OPS[st.op];
    st.msg = isContig(o) ? "<span class='good'>.view(12) funciona: la vista es contigua.</span>" : "<span class='bad'>RuntimeError: view size is not compatible with input tensor's size and stride… Use .reshape(...) instead.</span>";
    update();
  }, "primary");
  function makeCopy() {
    var o = OPS.t43, arr = [], r, c;
    for (r = 0; r < o.shape[0]; r++) for (c = 0; c < o.shape[1]; c++) arr.push(base0()[r * o.strides[0] + c * o.strides[1]]);
    return arr;
  }
  function base0() { return st.store; }
  function isContig(o) {
    if (o.shape.length === 1) return o.strides[0] === 1;
    return o.strides[1] === 1 && o.strides[0] === o.shape[1];
  }
  var G = null;
  function draw(ctx, w, h, C) {
    var o = OPS[st.op], rows = o.shape.length === 1 ? 1 : o.shape[0], cols = o.shape.length === 1 ? o.shape[0] : o.shape[1];
    var sr = o.shape.length === 1 ? 0 : o.strides[0], sc = o.strides[o.strides.length - 1], r, c;
    var pad = 10, ms = Math.min(34, (w - 2 * pad) / 12);
    D.text(ctx, "Memoria de x: 12 carátulas seguidas", w / 2, 16, { align: "center", size: 12, weight: 700, color: C.ink });
    var mx = (w - ms * 12) / 2, my = 24;
    for (i = 0; i < 12; i++) {
      var shade = st.op === "cont" ? C.surface : (i % 2 ? C.cobaltoWash : C.paper2);
      D.rect(ctx, mx + i * ms, my, ms, ms, shade, C.ink, 1);
      D.text(ctx, String(st.store[i]), mx + i * ms + ms / 2, my + ms / 2 + 4, { align: "center", size: ms < 24 ? 9.5 : 12, mono: true, weight: 600, color: C.ink });
      D.text(ctx, String(i), mx + i * ms + ms / 2, my + ms + 11, { align: "center", size: 9.5, mono: true, color: C.muted });
    }
    var cs = Math.min(44, (w - 2 * pad - 20) / Math.max(cols, 4), (h - my - ms - 130) / Math.max(rows, 3));
    cs = Math.max(20, cs);
    var gx = (w - cols * cs) / 2, gy = my + ms + 62;
    D.text(ctx, o.name + "   shape " + (o.shape.length === 1 ? "(12,)" : "(" + o.shape.join(", ") + ")") + "   stride " + (o.shape.length === 1 ? "(1,)" : "(" + o.strides.join(", ") + ")"), w / 2, my + ms + 32, { align: "center", size: w < 480 ? 10.5 : 12, mono: true, color: C.ink2, weight: 600 });
    G = { gx: gx, gy: gy, cs: cs, rows: rows, cols: cols, sr: sr, sc: sc };
    var src = st.op === "cont" ? st.copy : st.store;
    for (r = 0; r < rows; r++) for (c = 0; c < cols; c++) {
      var mem = st.op === "cont" ? r * cols + c : r * sr + c * sc;
      var v = src[mem], shade2 = st.op === "cont" ? C.olivaWash : (mem % 2 ? C.cobaltoWash : C.paper2);
      D.rect(ctx, gx + c * cs, gy + r * cs, cs, cs, shade2, C.ink, 1);
      D.text(ctx, String(v), gx + c * cs + cs / 2, gy + r * cs + cs / 2 + 1, { align: "center", size: cs < 28 ? 10.5 : 13, mono: true, weight: 700, color: C.ink });
      D.text(ctx, "m" + mem, gx + c * cs + cs / 2, gy + r * cs + cs - 5, { align: "center", size: 8.5, mono: true, color: C.muted });
      if (st.op !== "cont") {
        var ax = mx + mem * ms + ms / 2, ay = my + ms + 14;
        ctx.save(); ctx.globalAlpha = 0.28; D.line(ctx, ax, ay + 2, gx + c * cs + cs / 2, gy + r * cs, C.terracota, 1); ctx.restore();
      }
    }
    if (st.op === "cont") {
      D.text(ctx, "copia nueva: memoria propia (no comparte con x)", w / 2, gy + rows * cs + 16, { align: "center", size: 11, color: C.oliva, weight: 600 });
    }
  }
  view.draw(draw);
  view.pointer({ down: function (x, y) {
    var g = G; if (!g) return;
    var c = Math.floor((x - g.gx) / g.cs), r = Math.floor((y - g.gy) / g.cs);
    if (c < 0 || c >= g.cols || r < 0 || r >= g.rows) return;
    if (st.op === "cont") st.copy[r * g.cols + c] += 100;
    else st.store[r * g.sr + c * g.sc] += 100;
    st.msg = "Sumaste 100 a una celda: " + (st.op === "cont" ? "la copia cambió, <b>x no</b>." : "todas las vistas sobre esa memoria lo ven.");
    update();
  } });

  function update() {
    var o = OPS[st.op], contig = isContig(o);
    var memOk = st.op === "cont" ? "no (memoria propia)" : "sí";
    out.set("<b>" + o.name + "</b> · forma " + (o.shape.length === 1 ? "(12,)" : "(" + o.shape.join(", ") + ")") + " · strides " + (o.shape.length === 1 ? "(1,)" : "(" + o.strides.join(", ") + ")") +
      "<br>is_contiguous() = <b>" + contig + "</b> · comparte memoria con x: <b>" + memOk + "</b>" +
      (o.shape.length === 1 ? "<br>Elemento [j] está en la celda de memoria <b>j·1</b>" : "<br>Elemento [i, j] está en la celda de memoria <b>i·" + o.strides[0] + " + j·" + o.strides[1] + "</b>") +
      (st.msg ? "<br>" + st.msg : "<br>Pulsa una celda del tensor (abajo) para sumarle 100 y mira quién más cambia."));
    view.redraw();
  }
  update();
});
