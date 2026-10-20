/* Experimento: broadcasting. Se alinean las formas por la derecha; cada par de ejes debe ser igual o uno de ellos valer 1.
   El que vale 1 (o falta) se «estira» copiando sus valores. Se calcula de verdad A (op) B. */
Lab.register("curso3/c3m1-broadcasting", function (root, api) {
  var D = api.d;
  var st = { a0: 3, a1: 1, rb: 1, b0: 1, b1: 4, op: "+" };
  var A, B;
  var rA = api.rng(5);
  var BASE_A = [], BASE_B = [], i, j;
  for (i = 0; i < 4; i++) { BASE_A.push([]); BASE_B.push([]); for (j = 0; j < 4; j++) { BASE_A[i].push(1 + ((i * 4 + j * 3) % 9)); BASE_B[i].push(10 * (1 + ((i * 2 + j) % 4))); } }

  var view = api.view(root, { aspect: 2.6, minH: 200, maxH: 280, label: "Los dos tensores estirados al tamaño común y el resultado de operarlos" });
  var ui = api.controls(root), out = api.readout(root);
  var OPT = [[1, "1"], [2, "2"], [3, "3"], [4, "4"]];
  ui.select({ label: "A: filas", value: st.a0, options: OPT, onChange: function (v) { st.a0 = +v; update(); } });
  ui.select({ label: "A: columnas", value: st.a1, options: OPT, onChange: function (v) { st.a1 = +v; update(); } });
  ui.segmented({ label: "Rango de B", value: 1, options: [[1, "rango 1: (n,)"], [2, "rango 2: (f, n)"]], onChange: function (v) { st.rb = v; update(); } });
  var sb0 = ui.select({ label: "B: filas (solo rango 2)", value: st.b0, options: OPT, onChange: function (v) { st.b0 = +v; update(); } });
  var sb1 = ui.select({ label: "B: columnas", value: st.b1, options: OPT, onChange: function (v) { st.b1 = +v; update(); } });
  ui.segmented({ label: "Operación", value: "+", options: [["+", "A + B"], ["*", "A × B"]], onChange: function (v) { st.op = v; update(); } });
  ui.button("A (3,1) + B (4,)", function () { set(3, 1, 1, 1, 4); }, "primary");
  ui.button("A (2,3) + B (3,)", function () { set(2, 3, 1, 1, 3); });
  ui.button("A (2,3) + B (2,)", function () { set(2, 3, 1, 1, 2); });
  ui.button("A (2,3) + B (2,1)", function () { set(2, 3, 2, 2, 1); });

  function set(a0, a1, rb, b0, b1) {
    st.a0 = a0; st.a1 = a1; st.rb = rb; st.b0 = b0; st.b1 = b1;
    var sels = ui.el.querySelectorAll("select"), segs = ui.el.querySelectorAll(".seg");
    sels[0].value = a0; sels[1].value = a1; sels[2].value = b0; sels[3].value = b1;
    segs[0].querySelectorAll("button").forEach(function (b, k) { b.setAttribute("aria-pressed", String(k + 1 === rb)); });
    update();
  }
  function shapeB() { return st.rb === 1 ? [st.b1] : [st.b0, st.b1]; }
  function fmt(s) { return s.length === 1 ? "(" + s[0] + ",)" : "(" + s.join(", ") + ")"; }
  /* alinea por la derecha */
  function analyse() {
    var sa = [st.a0, st.a1], sb = shapeB(), n = 2;
    var pb = sb.length === 1 ? [1, sb[0]] : sb.slice();
    var res = [], bad = -1, k;
    for (k = 0; k < n; k++) {
      if (sa[k] === pb[k] || sa[k] === 1 || pb[k] === 1) res.push(Math.max(sa[k], pb[k]));
      else { res.push(null); if (bad < 0) bad = k; }
    }
    return { sa: sa, sb: sb, pb: pb, res: res, bad: bad };
  }
  function cell(m, i, j, rows, cols) { return m[i % rows][j % cols]; }

  function draw(ctx, w, h, C) {
    var an = analyse(), pad = 8, i, j, ok = an.bad < 0;
    var R0 = ok ? an.res[0] : Math.max(an.sa[0], an.pb[0]), R1 = ok ? an.res[1] : Math.max(an.sa[1], an.pb[1]);
    var cols = 3 * R1, gaps = 2 * 26 + 12 * 0;
    var s = Math.max(12, Math.min(34, Math.floor((w - 2 * pad - gaps - 2 * 8) / Math.max(1, cols))));
    var matW = R1 * s, totW = 3 * matW + 2 * 26, ox = (w - totW) / 2, oy = 52 + Math.max(0, (h - 52 - 22 - R0 * s) / 2 - 8);
    function mat(x0, valFn, origR, origC, color, title, titleShape) {
      D.text(ctx, title, x0 + matW / 2, 20, { align: "center", size: 12, weight: 700, color: C.ink });
      D.text(ctx, titleShape, x0 + matW / 2, 36, { align: "center", size: 11, mono: true, color: C.muted });
      for (i = 0; i < R0; i++) for (j = 0; j < R1; j++) {
        var orig = i < origR && j < origC, v = valFn(i, j);
        D.rect(ctx, x0 + j * s, oy + i * s, s, s, orig ? color : C.surface, C.ink, orig ? 1.4 : 1);
        if (!orig) { ctx.save(); ctx.globalAlpha = 0.45; }
        D.text(ctx, v === null ? "?" : String(v), x0 + j * s + s / 2, oy + i * s + s / 2 + 4, { align: "center", size: s >= 26 ? 12 : 10, mono: true, color: orig ? C.ink : C.muted, weight: orig ? 600 : 400 });
        if (!orig) ctx.restore();
      }
    }
    var x1 = ox, x2 = ox + matW + 26, x3 = ox + 2 * (matW + 26);
    var sa = an.sa, sb = an.sb;
    mat(x1, function (i, j) { return cell(BASE_A, i, j, sa[0], sa[1]); }, sa[0], sa[1], C.cobaltoWash, "A", fmt(sa) + (ok ? "" : ""));
    mat(x2, function (i, j) { return cell(BASE_B, i, j, an.pb[0], an.pb[1]); }, an.pb[0], an.pb[1], C.terracotaWash, "B", fmt(sb));
    D.text(ctx, st.op === "+" ? "+" : "×", x1 + matW + 13, oy + R0 * s / 2 + 6, { align: "center", size: 20, weight: 700, color: C.ink });
    D.text(ctx, "=", x2 + matW + 13, oy + R0 * s / 2 + 6, { align: "center", size: 20, weight: 700, color: C.ink });
    if (ok) {
      mat(x3, function (i, j) {
        var a = cell(BASE_A, i, j, sa[0], sa[1]), b = cell(BASE_B, i, j, an.pb[0], an.pb[1]);
        return st.op === "+" ? a + b : a * b;
      }, R0, R1, C.olivaWash, "Resultado", fmt(an.res));
    } else {
      D.rect(ctx, x3, oy, matW, R0 * s, C.terracotaWash, C.terracota, 2);
      D.text(ctx, "ERROR", x3 + matW / 2, oy + R0 * s / 2 + 5, { align: "center", size: 14, weight: 700, color: C.terracotaInk });
      D.text(ctx, "Resultado", x3 + matW / 2, 20, { align: "center", size: 12, weight: 700, color: C.ink });
      D.text(ctx, "imposible", x3 + matW / 2, 36, { align: "center", size: 11, mono: true, color: C.muted });
    }
    D.text(ctx, w < 480 ? "atenuado = copia estirada" : "los números atenuados son copias: el «estirado» no gasta memoria extra", w / 2, h - 6, { align: "center", size: 10.5, color: C.muted });
  }

  function update() {
    sb0.el.disabled = st.rb === 1; sb0.el.parentNode.style.opacity = st.rb === 1 ? 0.4 : 1;
    var an = analyse(), s = "";
    s += "<b>A</b> " + fmt(an.sa) + " · <b>B</b> " + fmt(an.sb) + (an.sb.length === 1 ? " → se trata como " + fmt(an.pb) + " (se añade un 1 por la izquierda)" : "") + "<br>";
    s += "Eje 1 (derecha): " + an.sa[1] + " frente a " + an.pb[1] + " · Eje 0: " + an.sa[0] + " frente a " + an.pb[0] + "<br>";
    if (an.bad < 0) s += "<span class='good'>Compatibles</span> → forma del resultado <b>" + fmt(an.res) + "</b>";
    else s += "<span class='bad'>Incompatibles en el eje " + an.bad + ": " + an.sa[an.bad] + " y " + an.pb[an.bad] + " no son iguales y ninguno es 1.</span><br>TensorFlow diría: <code>InvalidArgumentError: Incompatible shapes: [" + an.sa.join(",") + "] vs. [" + an.sb.join(",") + "]</code>";
    out.set(s);
    view.redraw();
  }
  view.draw(draw); update();
});
