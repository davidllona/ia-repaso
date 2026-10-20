/* Experimento: indexado y slicing sobre una matriz 5×6 (a = torch.arange(1, 31).reshape(5, 6)).
   Cada eje admite un trozo inicio:fin:paso o un entero (que hace desaparecer el eje). Se calcula la selección de verdad
   con las mismas reglas de Python (índices negativos, recorte) y se resalta en la matriz. */
Lab.register("curso4/c4m1-slicing", function (root, api) {
  var D = api.d;
  var R = 5, Cn = 6;
  var A = [], i, j;
  for (i = 0; i < R; i++) { A.push([]); for (j = 0; j < Cn; j++) A[i].push(i * Cn + j + 1); }
  var st = { mode: [0, 0], a: [0, 0], b: [R, Cn], s: [1, 1] };
  var view = api.view(root, { aspect: 2.0, minH: 230, maxH: 320, label: "Matriz 5 por 6 con las celdas elegidas por el slicing resaltadas" });
  var ui = api.controls(root), out = api.readout(root);
  var sl = [];
  function axisControls(ax, name, n) {
    ui.segmented({ label: name + ": ¿trozo o entero?", value: 0, options: [[0, "trozo i:f:p"], [1, "entero"]], onChange: function (v) { st.mode[ax] = v; sync(); update(); } });
    sl[ax] = {
      a: ui.slider({ label: name + ": inicio (o el entero)", min: -n, max: n - 1, step: 1, value: 0, onInput: function (v) { st.a[ax] = v; update(); } }),
      b: ui.slider({ label: name + ": fin (excluido)", min: -n, max: n, step: 1, value: n, onInput: function (v) { st.b[ax] = v; update(); } }),
      s: ui.slider({ label: name + ": paso", min: 1, max: 3, step: 1, value: 1, onInput: function (v) { st.s[ax] = v; update(); } })
    };
  }
  axisControls(0, "Filas (eje 0)", R);
  axisControls(1, "Columnas (eje 1)", Cn);
  function sync() { [0, 1].forEach(function (ax) { var dis = st.mode[ax] === 1; [sl[ax].b, sl[ax].s].forEach(function (c) { c.input.disabled = dis; c.input.parentNode.style.opacity = dis ? 0.35 : 1; }); }); }
  function preset(m0, a0, b0, s0, m1, a1, b1, s1) {
    st.mode = [m0, m1]; st.a = [a0, a1]; st.b = [b0, b1]; st.s = [s0, s1];
    [0, 1].forEach(function (ax) { sl[ax].a.set(st.a[ax], true); sl[ax].b.set(st.b[ax], true); sl[ax].s.set(st.s[ax], true); });
    var segs = ui.el.querySelectorAll(".seg");
    segs.forEach(function (sg, k) { sg.querySelectorAll("button").forEach(function (b, q) { b.setAttribute("aria-pressed", String(q === st.mode[k])); }); });
    sync(); update();
  }
  ui.button("a[1]", function () { preset(1, 1, R, 1, 0, 0, Cn, 1); });
  ui.button("a[:, 1]", function () { preset(0, 0, R, 1, 1, 1, Cn, 1); }, "primary");
  ui.button("a[:, 1:2]", function () { preset(0, 0, R, 1, 0, 1, 2, 1); });
  ui.button("a[1:4, 2:]", function () { preset(0, 1, 4, 1, 0, 2, Cn, 1); });
  ui.button("a[::2, ::2]", function () { preset(0, 0, R, 2, 0, 0, Cn, 2); });
  ui.button("a[-1, -3:]", function () { preset(1, -1, R, 1, 0, -3, Cn, 1); });

  /* Reglas de Python para un trozo a:b:s sobre n elementos (s > 0) */
  function pick(ax, n) {
    if (st.mode[ax] === 1) { var k = st.a[ax] < 0 ? st.a[ax] + n : st.a[ax]; return { idx: [k], keep: false, txt: String(st.a[ax]) }; }
    var a = st.a[ax], b = st.b[ax], s = st.s[ax];
    a = a < 0 ? Math.max(0, a + n) : Math.min(a, n);
    b = b < 0 ? Math.max(0, b + n) : Math.min(b, n);
    var idx = []; for (var k2 = a; k2 < b; k2 += s) idx.push(k2);
    var ta = st.a[ax] === 0 ? "" : String(st.a[ax]), tb = st.b[ax] === n ? "" : String(st.b[ax]), ts = s === 1 ? "" : String(s);
    var txt = ta + ":" + tb + (ts ? ":" + ts : "");
    return { idx: idx, keep: true, txt: txt };
  }
  function draw(ctx, w, h, C) {
    var pr = pick(0, R), pc = pick(1, Cn), pad = 10;
    var cs = Math.min(46, (w - 2 * pad - 24) / Cn, (h - 36) / R), ox = (w - Cn * cs) / 2 + 8, oy = 16, r, c;
    var rs = {}, cc = {}; pr.idx.forEach(function (k) { rs[k] = 1; }); pc.idx.forEach(function (k) { cc[k] = 1; });
    for (c = 0; c < Cn; c++) D.text(ctx, String(c), ox + c * cs + cs / 2, oy - 4, { align: "center", size: 9.5, mono: true, color: C.muted });
    for (r = 0; r < R; r++) {
      D.text(ctx, String(r), ox - 8, oy + r * cs + cs / 2 + 3, { align: "right", size: 9.5, mono: true, color: C.muted });
      for (c = 0; c < Cn; c++) {
        var sel = rs[r] && cc[c];
        D.rect(ctx, ox + c * cs, oy + r * cs, cs, cs, sel ? C.terracotaWash : C.surface, sel ? C.terracota : C.line, sel ? 2.2 : 1);
        D.text(ctx, String(A[r][c]), ox + c * cs + cs / 2, oy + r * cs + cs / 2 + 4, { align: "center", size: cs < 28 ? 10 : 12.5, mono: true, color: sel ? C.terracotaInk : C.muted, weight: sel ? 700 : 400 });
      }
    }
  }
  function update() {
    var pr = pick(0, R), pc = pick(1, Cn), vals = [], shape = [];
    pr.idx.forEach(function (r) { var row = []; pc.idx.forEach(function (c) { row.push(A[r][c]); }); vals.push(row); });
    if (pr.keep) shape.push(pr.idx.length);
    if (pc.keep) shape.push(pc.idx.length);
    var expr = "a[" + pr.txt + ", " + pc.txt + "]";
    var show;
    if (!pr.idx.length || !pc.idx.length) show = "tensor([])  (vacío)";
    else if (!pr.keep && !pc.keep) show = "tensor(" + vals[0][0] + ")";
    else if (!pr.keep) show = "tensor([" + vals[0].join(", ") + "])";
    else if (!pc.keep) show = "tensor([" + vals.map(function (r2) { return r2[0]; }).join(", ") + "])";
    else show = "tensor([" + vals.map(function (r2) { return "[" + r2.join(", ") + "]"; }).join(",<br>        ") + "])";
    var shp = shape.length === 0 ? "()" : shape.length === 1 ? "(" + shape[0] + ",)" : "(" + shape.join(", ") + ")";
    out.set("<b>" + expr + "</b> → forma <b>" + shp + "</b> · " + (pr.idx.length * pc.idx.length) + " elementos<br>" + show +
      "<br>Filas elegidas: [" + pr.idx.join(", ") + "] · columnas elegidas: [" + pc.idx.join(", ") + "]" +
      (!pr.keep || !pc.keep ? "<br>Un <b>entero</b> en un eje hace desaparecer ese eje; un trozo lo mantiene." : ""));
    view.redraw();
  }
  view.draw(draw); sync(); update();
});
