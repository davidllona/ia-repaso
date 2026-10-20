/* Experimento: ¿qué tipo (dtype) tiene el resultado de operar dos tensores? Tabla de promoción generada con PyTorch 2.14.1
   (torch.ones(2, dtype=...) op torch.ones(2, dtype=...)). Además se calcula la memoria que ocupan N elementos. */
Lab.register("curso4/c4m1-dtypes", function (root, api) {
  var D = api.d;
  var NAMES = ["bool", "uint8", "int8", "int16", "int32", "int64", "float16", "float32", "float64"];
  var BYTES = { bool: 1, uint8: 1, int8: 1, int16: 2, int32: 4, int64: 8, float16: 2, float32: 4, float64: 8 };
  var FL = { float16: 1, float32: 1, float64: 1 };
  function promo(a, b, op) {
    var fa = FL[a], fb = FL[b], k = op === "/" ? 1 : 0, r;
    if (op === "/") {
      if (fa && fb) r = rank(a) >= rank(b) ? a : b;
      else if (fa) r = a; else if (fb) r = b; else r = "float32";
      return r;
    }
    if (fa || fb) { if (fa && fb) return rank(a) >= rank(b) ? a : b; return fa ? a : b; }
    if (a === b) return a;
    if (a === "bool") return b; if (b === "bool") return a;
    if ((a === "uint8" && b === "int8") || (a === "int8" && b === "uint8")) return "int16";
    return rank(a) >= rank(b) ? a : b;
  }
  function rank(n) { return NAMES.indexOf(n); }
  var st = { a: "int64", b: "float32", op: "+", n: 1000000 };
  var view = api.view(root, { aspect: 2.6, minH: 170, maxH: 240, label: "Dos tensores, su operación y el dtype del resultado" });
  var ui = api.controls(root), out = api.readout(root);
  var opts = NAMES.map(function (n) { return [n, "torch." + n]; });
  ui.select({ label: "dtype del tensor A", value: st.a, options: opts, onChange: function (v) { st.a = v; update(); } });
  ui.select({ label: "dtype del tensor B", value: st.b, options: opts, onChange: function (v) { st.b = v; update(); } });
  ui.segmented({ label: "Operación", value: "+", options: [["+", "A + B  (o A * B)"], ["/", "A / B"]], onChange: function (v) { st.op = v; update(); } });
  ui.select({ label: "Elementos del tensor", value: 1000000, options: [[1000, "mil"], [1000000, "un millón"], [47040000, "47 millones (60 000 carátulas de 28 × 28)"]], onChange: function (v) { st.n = +v; update(); } });
  ui.button("int64 + float32", function () { setT("int64", "float32", "+"); }, "primary");
  ui.button("int64 / int64", function () { setT("int64", "int64", "/"); });
  ui.button("int64 + float16", function () { setT("int64", "float16", "+"); });
  ui.button("uint8 + int8", function () { setT("uint8", "int8", "+"); });
  function setT(a, b, op) {
    st.a = a; st.b = b; st.op = op;
    var sels = ui.el.querySelectorAll("select"); sels[0].value = a; sels[1].value = b;
    ui.el.querySelectorAll(".seg button").forEach(function (x, k) { x.setAttribute("aria-pressed", String((k === 0) === (op === "+"))); });
    update();
  }
  function mb(n, name) { var by = n * BYTES[name]; return by >= 1e6 ? (by / 1e6).toFixed(by >= 1e8 ? 0 : 1) + " MB" : by >= 1e3 ? (by / 1e3).toFixed(0) + " KB" : by + " B"; }
  view.draw(function (ctx, w, h, C) {
    var r = promo(st.a, st.b, st.op), bw = Math.min(120, (w - 120) / 3), y = 30, x0 = (w - (3 * bw + 80)) / 2;
    function box(x, label, name, fill) {
      D.rect(ctx, x, y, bw, 64, fill, C.ink, 1.5);
      D.text(ctx, label, x + bw / 2, y + 20, { align: "center", size: 12, weight: 700, mono: true });
      D.text(ctx, name, x + bw / 2, y + 40, { align: "center", size: bw < 90 ? 10.5 : 12, mono: true });
      D.text(ctx, BYTES[name] + " B/elem", x + bw / 2, y + 56, { align: "center", size: 9.5, color: C.muted });
    }
    box(x0, "A", st.a, C.cobaltoWash);
    D.text(ctx, st.op, x0 + bw + 20, y + 40, { align: "center", size: 20, weight: 700 });
    box(x0 + bw + 40, "B", st.b, C.terracotaWash);
    D.text(ctx, "=", x0 + 2 * bw + 60, y + 40, { align: "center", size: 20, weight: 700 });
    box(x0 + 2 * bw + 80, "A" + st.op + "B", r, C.olivaWash);
    D.text(ctx, (w < 460 ? "el resultado toma el tipo «más grande»" : "el resultado toma el tipo «más grande» de los dos (con las reglas de PyTorch)"), w / 2, h - 14, { align: "center", size: 11, color: C.ink2 });
  });
  function update() {
    var r = promo(st.a, st.b, st.op), warn = "";
    if (FL[r] && !FL[st.a] && !FL[st.b]) warn = " · división «verdadera»: dos enteros dan float32";
    else if (r === "float16" && (st.a === "int64" || st.b === "int64" || st.a === "int32" || st.b === "int32")) warn = " · <span class='bad'>un entero de 32/64 bits se convierte a float16: pierdes precisión</span>";
    else if (r === "float64" && (st.a === "float32" || st.b === "float32")) warn = " · float32 con float64 sube a float64 (el doble de memoria)";
    else if (r === "int16" && (st.a === "uint8" || st.b === "uint8")) warn = " · uint8 con int8 no caben en 8 bits: sube a int16";
    out.set("<b>A</b> torch." + st.a + " " + st.op + " <b>B</b> torch." + st.b + " → <b>torch." + r + "</b>" + warn +
      "<br>Memoria de " + st.n.toLocaleString("es-ES") + " elementos: A = " + mb(st.n, st.a) + " · B = " + mb(st.n, st.b) + " · resultado = " + mb(st.n, r));
    view.redraw();
  }
  update();
});
