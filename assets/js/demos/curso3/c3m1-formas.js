/* Experimento: forma (shape) de un tensor, reshape y reducción por ejes.
   Un tensor de 24 números 1..24; reshape nunca reordena los datos, y reduce_sum(axis=k) hace desaparecer el eje k. */
Lab.register("curso3/c3m1-formas", function (root, api) {
  var D = api.d;
  var N = 24;
  var st = { rank: 3, dims: [2, 3, 4], axis: "none", keep: false };
  var DIMOPT = [[1, "1"], [2, "2"], [3, "3"], [4, "4"], [6, "6"], [8, "8"], [12, "12"], [24, "24"], [-1, "-1"]];

  var view = api.view(root, { aspect: 2.0, minH: 230, maxH: 330, label: "Los 24 números del tensor dispuestos según la forma elegida" });
  var ui = api.controls(root), out = api.readout(root);
  var segRank = ui.segmented({ label: "Rango (número de ejes)", value: 3, options: [[1, "1"], [2, "2"], [3, "3"]], onChange: function (v) { st.rank = v; fixAxis(); update(); } });
  var sel = [];
  for (var i = 0; i < 3; i++) (function (i) {
    sel[i] = ui.select({ label: "Tamaño del eje " + i, value: st.dims[i], options: DIMOPT, onChange: function (v) { st.dims[i] = parseInt(v, 10); update(); } });
  })(i);
  var selAxis = ui.select({ label: "tf.reduce_sum(…, axis=?)", value: "none", options: [["none", "sin reducir"], ["all", "axis=None (todo)"], ["0", "axis=0"], ["1", "axis=1"], ["2", "axis=2"]], onChange: function (v) { st.axis = v; update(); } });
  ui.toggle({ label: "keepdims=True", value: false, onChange: function (v) { st.keep = v; update(); } });
  ui.button("Plantilla (2, 3, 4)", function () { setShape(3, [2, 3, 4]); }, "primary");
  ui.button("Plantilla (4, 6)", function () { setShape(2, [4, 6, 1]); });
  ui.button("Plantilla (24,)", function () { setShape(1, [24, 1, 1]); });
  ui.button("Plantilla (4, -1)", function () { setShape(2, [4, -1, 1]); });

  function setShape(r, d) {
    st.rank = r; st.dims = d.slice(); st.axis = "none"; st.keep = false;
    syncUI(); update();
  }
  function syncUI() {
    var segs = ui.el.querySelectorAll(".seg button");
    segs.forEach(function (b, i) { b.setAttribute("aria-pressed", String(i + 1 === st.rank)); });
    for (var i = 0; i < 3; i++) sel[i].set(st.dims[i]);
    selAxis.set(st.axis);
    var tg = ui.el.querySelector(".lab-btns .btn[aria-pressed]");
    if (tg) tg.setAttribute("aria-pressed", String(st.keep));
  }
  function fixAxis() {
    if (st.axis !== "none" && st.axis !== "all" && parseInt(st.axis, 10) >= st.rank) { st.axis = "none"; selAxis.set("none"); }
  }
  /* Devuelve {ok, shape, msg} resolviendo un posible -1 */
  function resolve() {
    var d = st.dims.slice(0, st.rank), neg = d.filter(function (v) { return v === -1; }).length;
    if (neg > 1) return { ok: false, msg: "Solo puede haber UN -1 en la forma: Keras/TF no sabría repartir." };
    var prod = 1; d.forEach(function (v) { if (v !== -1) prod *= v; });
    if (neg === 1) {
      if (N % prod !== 0) return { ok: false, msg: "No se puede: " + N + " no es divisible por " + prod + ", así que no hay entero que sustituya al -1." };
      d = d.map(function (v) { return v === -1 ? N / prod : v; });
      return { ok: true, shape: d, inferred: true };
    }
    if (prod !== N) return { ok: false, msg: "InvalidArgumentError: el tensor tiene " + N + " valores, pero la forma pedida tiene " + prod + " (" + d.join(" × ") + ")." };
    return { ok: true, shape: d };
  }
  /* valor en la posición (i,j,k) de una forma 3D rellenada en orden de filas */
  function reduceTensor(shape, axis) {
    var s3 = shape.slice(); while (s3.length < 3) s3.push(1);
    function v(i, j, k) { return 1 + i * s3[1] * s3[2] + j * s3[2] + k; }
    var res = [], i, j, k, ax = axis === "all" ? -1 : parseInt(axis, 10);
    if (axis === "all") { var t = 0; for (i = 0; i < s3[0]; i++) for (j = 0; j < s3[1]; j++) for (k = 0; k < s3[2]; k++) t += v(i, j, k); return { shape: [], vals: [t] }; }
    var keepShape = s3.slice(0, shape.length);
    var outShape = shape.filter(function (_, q) { return q !== ax; });
    var A = s3[0], B = s3[1], Cc = s3[2], vals = [];
    var ia = ax === 0 ? 1 : A, ib = ax === 1 ? 1 : B, ic = ax === 2 ? 1 : Cc;
    for (i = 0; i < ia; i++) for (j = 0; j < ib; j++) for (k = 0; k < ic; k++) {
      var s = 0, n = ax === 0 ? A : ax === 1 ? B : Cc, q;
      for (q = 0; q < n; q++) s += v(ax === 0 ? q : i, ax === 1 ? q : j, ax === 2 ? q : k);
      vals.push(s);
    }
    return { shape: outShape, vals: vals, keepShape: shape.map(function (d, q) { return q === ax ? 1 : d; }) };
  }
  function fmtShape(s) { return s.length === 1 ? "(" + s[0] + ",)" : "(" + s.join(", ") + ")"; }

  function draw(ctx, w, h, C) {
    var R = resolve();
    if (!R.ok) {
      D.rect(ctx, 0, 0, w, h, C.terracotaWash);
      D.text(ctx, "Forma imposible", w / 2, h / 2 - 8, { align: "center", size: 18, weight: 700, color: C.terracotaInk });
      D.text(ctx, "los números no caben", w / 2, h / 2 + 14, { align: "center", size: 13, color: C.terracotaInk });
      return;
    }
    var s = R.shape.slice(); while (s.length < 3) s.unshift(1);
    var d0 = s[0], d1 = s[1], d2 = s[2];
    var best = null, sz, top = 24;
    for (sz = 46; sz >= 9; sz -= 1) {
      var bw = d2 * sz, bh = d1 * sz, g = Math.max(8, sz * 0.5);
      var cols = Math.max(1, Math.floor((w - 16 + g) / (bw + g)));
      var rows = Math.ceil(d0 / cols);
      if (cols >= 1 && bw <= w - 16 && rows * (bh + g + 12) - g - 0 <= h - top - 8) { best = { sz: sz, bw: bw, bh: bh, g: g, cols: cols, rows: rows }; break; }
    }
    if (!best) best = { sz: 9, bw: d2 * 9, bh: d1 * 9, g: 8, cols: Math.max(1, Math.floor((w - 16 + 8) / (d2 * 9 + 8))), rows: 1 };
    var totW = best.cols * best.bw + (best.cols - 1) * best.g, ox = (w - Math.min(totW, w - 16)) / 2;
    var totH = best.rows * (best.bh + best.g + 12) - best.g - 12, oy = top + Math.max(0, (h - top - 14 - totH) / 2);
    var palette = [C.cobaltoWash, C.terracotaWash, C.olivaWash];
    D.text(ctx, "forma " + fmtShape(R.shape) + (R.inferred ? "  (el -1 se calculó)" : ""), w / 2, 14, { align: "center", size: 12, weight: 600, color: C.ink2, mono: true });
    var n = 0, b, ii, jj, ax = st.axis === "none" || st.axis === "all" ? -2 : parseInt(st.axis, 10) + (3 - R.shape.length);
    for (b = 0; b < d0; b++) {
      var cx = ox + (b % best.cols) * (best.bw + best.g), cy = oy + Math.floor(b / best.cols) * (best.bh + best.g + 12);
      for (ii = 0; ii < d1; ii++) for (jj = 0; jj < d2; jj++) {
        n++;
        var fill = palette[b % 3];
        D.rect(ctx, cx + jj * best.sz, cy + ii * best.sz, best.sz, best.sz, fill, C.ink, 1);
        if (best.sz >= 17) D.text(ctx, String(n), cx + jj * best.sz + best.sz / 2, cy + ii * best.sz + best.sz / 2 + 4, { align: "center", size: best.sz >= 26 ? 12 : 10.5, mono: true, color: C.ink });
      }
    }
    if (best.sz < 17) D.text(ctx, "(números 1 a 24, en orden de filas)", w / 2, h - 6, { align: "center", size: 10.5, color: C.muted });
  }

  function update() {
    var R = resolve(), s = "";
    if (!R.ok) { out.set("<span class='bad'>" + R.msg + "</span>"); view.redraw(); return; }
    var shape = R.shape;
    s += "<code>tf.reshape(x, " + fmtShape(st.dims.slice(0, st.rank)) + ")</code> → forma <b>" + fmtShape(shape) + "</b>, rango <b>" + shape.length + "</b>, <b>" + N + "</b> elementos";
    if (R.inferred) s += " <span class='good'>(el -1 era " + shape[st.dims.slice(0, st.rank).indexOf(-1)] + ")</span>";
    s += ".<br>Los números siguen en el mismo orden 1, 2, 3… : <b>reshape solo cambia cómo los agrupas</b>.";
    if (st.axis !== "none") {
      var rd = reduceTensor(shape, st.axis);
      var rs = rd.shape, shownShape = st.keep && st.axis !== "all" ? rd.keepShape : (st.keep && st.axis === "all" ? shape.map(function () { return 1; }) : rs);
      var txt = rd.vals.length > 12 ? rd.vals.slice(0, 12).join(", ") + ", …" : rd.vals.join(", ");
      s += "<br><code>tf.reduce_sum(x, axis=" + (st.axis === "all" ? "None" : st.axis) + (st.keep ? ", keepdims=True" : "") + ")</code> → forma <b>" + fmtShape(shownShape.length ? shownShape : []).replace("()", "()") + "</b>" +
        "<br>valores: <b>" + txt + "</b>" +
        (st.axis !== "all" ? "<br>El eje " + st.axis + " (de tamaño " + shape[parseInt(st.axis, 10)] + ") " + (st.keep ? "se queda con tamaño 1." : "desaparece: se ha sumado.") : "<br>Todo se suma en un único número.");
    }
    out.set(s);
    view.redraw();
  }
  update();
  view.draw(draw);
});
