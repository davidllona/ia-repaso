/* Experimento: cómo recortar el coste de una convolución. Compara parámetros y multiplicaciones de:
   (A) 5×5 directa frente a 1×1 + 5×5 (Inception), (B) k×k normal frente a separable en profundidad (MobileNet),
   (C) dos 3×3 frente a un cuello de botella 1×1 → 3×3 → 1×1 (ResNet-50). Los números son exactos. */
Lab.register("curso3/c3m2-bottleneck-coste", function (root, api) {
  var st = { mode: "A", H: 28, cin: 192, cout: 32, k: 5, red: 16 };
  var DEF = {
    A: { H: 28, cin: 192, cout: 32, k: 5, red: 16 },
    B: { H: 56, cin: 64, cout: 128, k: 3, red: 16 },
    C: { H: 14, cin: 256, cout: 256, k: 3, red: 64 }
  };
  function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " "); }

  function variants() {
    var H2 = st.H * st.H, k = st.k, ci = st.cin, co = st.cout, r = st.red;
    if (st.mode === "A") {
      return { title: "Salida " + st.H + "×" + st.H + "×" + co + " a partir de " + st.H + "×" + st.H + "×" + ci, list: [
        { name: k + "×" + k + " directa", params: (k * k * ci + 1) * co, mults: H2 * co * k * k * ci },
        { name: "1×1 (" + r + ") → " + k + "×" + k, params: (ci + 1) * r + (k * k * r + 1) * co, mults: H2 * r * ci + H2 * co * k * k * r }
      ] };
    }
    if (st.mode === "B") {
      return { title: "Salida " + st.H + "×" + st.H + "×" + co + " a partir de " + st.H + "×" + st.H + "×" + ci, list: [
        { name: k + "×" + k + " normal", params: (k * k * ci + 1) * co, mults: H2 * co * k * k * ci },
        { name: k + "×" + k + " separable", params: k * k * ci + ci * co + co, mults: H2 * ci * k * k + H2 * ci * co }
      ] };
    }
    var c = ci, b = r;
    return { title: "Mismo tamaño " + st.H + "×" + st.H + "×" + c + " dentro y fuera", list: [
      { name: "dos 3×3 (bloque básico)", params: 2 * (9 * c * c + c), mults: 2 * H2 * 9 * c * c },
      { name: "1×1 → 3×3 → 1×1 (cuello " + b + ")", params: (c + 1) * b + (9 * b * b + b) + (b + 1) * c, mults: H2 * (c * b + 9 * b * b + b * c) }
    ] };
  }

  var view = api.view(root, { aspect: 2.0, minH: 220, maxH: 290, label: "Barras comparando parámetros y multiplicaciones de dos diseños de convolución" });
  var ui = api.controls(root), out = api.readout(root);
  ui.segmented({ label: "Caso", options: [["A", "A · Inception 1×1"], ["B", "B · MobileNet"], ["C", "C · ResNet-50"]], value: "A", onChange: function (v) { st.mode = v; var d = DEF[v]; st.H = d.H; st.cin = d.cin; st.cout = d.cout; st.k = d.k; st.red = d.red; sync(); update(); } });
  var sH = ui.slider({ label: "Lado del mapa (H = W)", min: 7, max: 112, step: 7, value: st.H, onInput: function (v) { st.H = v; update(); } });
  var sCi = ui.slider({ label: "Canales de entrada", min: 16, max: 512, step: 16, value: st.cin, onInput: function (v) { st.cin = v; update(); } });
  var sCo = ui.slider({ label: "Canales de salida", min: 16, max: 512, step: 16, value: st.cout, onInput: function (v) { st.cout = v; update(); } });
  var sK = ui.slider({ label: "Lado del kernel k", min: 3, max: 7, step: 2, value: st.k, onInput: function (v) { st.k = v; update(); } });
  var sR = ui.slider({ label: "Canales intermedios (cuello)", min: 4, max: 128, step: 4, value: st.red, onInput: function (v) { st.red = v; update(); } });
  function sync() { sH.set(st.H, true); sCi.set(st.cin, true); sCo.set(st.cout, true); sK.set(st.k, true); sR.set(st.red, true); }

  view.draw(function (ctx, w, h, C) {
    var D = api.d, V = variants(), a = V.list[0], b = V.list[1];
    var pad = 8, labW = Math.min(150, w * 0.36), bw = w - labW - pad - 70, fs = Math.min(11.5, w / 34);
    D.text(ctx, V.title, pad, 15, { size: fs, weight: 600, color: C.ink2 });
    function group(y0, title, key, ratioTxt) {
      D.text(ctx, title, pad, y0, { size: fs, weight: 600, color: C.cobaltoInk });
      var mx = Math.max(a[key], b[key]), rowH = Math.min(30, (h - 60) / 4), i;
      [a, b].forEach(function (v, idx) {
        var y = y0 + 6 + idx * (rowH + 4), len = Math.max(2, v[key] / mx * bw);
        D.text(ctx, v.name, pad, y + rowH / 2 + 4, { size: Math.min(10.5, w / 36), color: C.ink });
        D.rect(ctx, labW, y, len, rowH, idx === 0 ? C.terracota : C.oliva);
        D.text(ctx, fmt(v[key]), labW + len + 4, y + rowH / 2 + 4, { size: Math.min(10.5, w / 36), mono: true, color: C.ink2 });
      });
      D.text(ctx, ratioTxt, w - pad, y0, { size: fs, weight: 700, align: "right", color: C.terracotaInk, mono: true });
    }
    var rp = a.params / b.params, rm = a.mults / b.mults;
    group(36, "Parámetros", "params", "÷ " + rp.toFixed(1));
    group(36 + 2 * Math.min(30, (h - 60) / 4) + 28, "Multiplicaciones", "mults", "÷ " + rm.toFixed(1));
  });

  function update() {
    view.redraw();
    var V = variants(), a = V.list[0], b = V.list[1];
    var html = "<b>" + a.name + "</b>: " + fmt(a.params) + " parámetros · " + fmt(a.mults) + " multiplicaciones<br><b>" + b.name + "</b>: " + fmt(b.params) + " parámetros · " + fmt(b.mults) + " multiplicaciones<br>";
    html += "Ahorro: parámetros <b>" + (a.params / b.params).toFixed(2) + "×</b> · multiplicaciones <b>" + (a.mults / b.mults).toFixed(2) + "×</b>";
    if (st.mode === "B") html += "<br>Fórmula del ahorro de multiplicaciones: 1 / (1/C_sal + 1/k²) = 1 / (1/" + st.cout + " + 1/" + (st.k * st.k) + ") = " + (1 / (1 / st.cout + 1 / (st.k * st.k))).toFixed(2) + "×";
    if (st.mode === "A") html += "<br>El 1×1 primero reduce " + st.cin + " canales a " + st.red + ": el 5×5 caro trabaja con " + st.red + " en vez de " + st.cin + ".";
    out.set(html);
  }
  update();
});
