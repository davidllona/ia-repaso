/* Experimento: contador de parámetros y de activaciones capa a capa en LeNet-5, AlexNet y VGG16.
   Las formas y los parámetros se calculan con las fórmulas de las CNN; los totales coinciden con Keras. */
Lab.register("curso3/c3m2-contador-arquitecturas", function (root, api) {
  var ARCH = {
    lenet: { name: "LeNet-5 (1998)", side: 32, ch: 1, smin: 28, smax: 64, sstep: 4, classes: 10, layers: [
      ["conv", 6, 5, 1, "valid"], ["pool", 2, 2], ["conv", 16, 5, 1, "valid"], ["pool", 2, 2], ["fc", 120], ["fc", 84]] },
    alex: { name: "AlexNet (2012)", side: 227, ch: 3, smin: 99, smax: 323, sstep: 8, classes: 1000, layers: [
      ["conv", 96, 11, 4, "valid"], ["pool", 3, 2], ["conv", 256, 5, 1, "same"], ["pool", 3, 2],
      ["conv", 384, 3, 1, "same"], ["conv", 384, 3, 1, "same"], ["conv", 256, 3, 1, "same"], ["pool", 3, 2], ["fc", 4096], ["fc", 4096]] },
    vgg: { name: "VGG16 (2014)", side: 224, ch: 3, smin: 64, smax: 320, sstep: 32, classes: 1000, layers: [
      ["conv", 64, 3, 1, "same"], ["conv", 64, 3, 1, "same"], ["pool", 2, 2],
      ["conv", 128, 3, 1, "same"], ["conv", 128, 3, 1, "same"], ["pool", 2, 2],
      ["conv", 256, 3, 1, "same"], ["conv", 256, 3, 1, "same"], ["conv", 256, 3, 1, "same"], ["pool", 2, 2],
      ["conv", 512, 3, 1, "same"], ["conv", 512, 3, 1, "same"], ["conv", 512, 3, 1, "same"], ["pool", 2, 2],
      ["conv", 512, 3, 1, "same"], ["conv", 512, 3, 1, "same"], ["conv", 512, 3, 1, "same"], ["pool", 2, 2], ["fc", 4096], ["fc", 4096]] }
  };
  var st = { arch: "vgg", side: 224, head: "flat" };

  function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " "); }

  function build() {
    var A = ARCH[st.arch], side = st.side, ch = A.ch, rows = [], total = 0, conv = 0, dense = 0, flat = false, vec = 0, ok = true;
    rows.push({ name: "entrada", shape: side + "×" + side + "×" + ch, params: 0, act: side * side * ch, kind: "in" });
    var nconv = 0, npool = 0, nfc = 0;
    A.layers.forEach(function (L) {
      if (!ok) return;
      if (L[0] === "conv") {
        var k = L[2], s = L[3], f = L[1], p, out;
        if (L[4] === "same") out = Math.ceil(side / s); else out = Math.floor((side - k) / s) + 1;
        if (out < 1) { ok = false; return; }
        p = (k * k * ch + 1) * f; side = out; ch = f; conv += p; total += p; nconv++;
        rows.push({ name: "conv" + nconv + " " + k + "×" + k + (s > 1 ? " /" + s : ""), shape: side + "×" + side + "×" + ch, params: p, act: side * side * ch, kind: "conv" });
      } else if (L[0] === "pool") {
        var o2 = Math.floor((side - L[1]) / L[2]) + 1;
        if (o2 < 1) { ok = false; return; }
        side = o2; npool++;
        rows.push({ name: "pool" + npool + " " + L[1] + "×" + L[1], shape: side + "×" + side + "×" + ch, params: 0, act: side * side * ch, kind: "pool" });
      } else if (L[0] === "fc") {
        if (!flat) {
          flat = true;
          if (st.head === "gap") { vec = ch; rows.push({ name: "GlobalAvgPool", shape: String(vec), params: 0, act: vec, kind: "pool" }); }
          else { vec = side * side * ch; rows.push({ name: "Flatten", shape: String(vec), params: 0, act: vec, kind: "pool" }); }
        }
        if (st.head === "gap") return;               /* con GAP se quitan las FC intermedias */
        var pf = vec * L[1] + L[1]; nfc++; vec = L[1]; dense += pf; total += pf;
        rows.push({ name: "fc" + nfc, shape: String(vec), params: pf, act: vec, kind: "fc" });
      }
    });
    if (!ok) return { ok: false };
    if (!flat) { vec = side * side * ch; }
    var pOut = vec * A.classes + A.classes; dense += pOut; total += pOut;
    rows.push({ name: "salida (" + A.classes + ")", shape: String(A.classes), params: pOut, act: A.classes, kind: "fc" });
    return { ok: true, rows: rows, total: total, conv: conv, dense: dense };
  }

  var view = api.view(root, { aspect: 1.35, minH: 400, maxH: 440, label: "Barras de parámetros y de activaciones capa a capa" });
  var ui = api.controls(root), out = api.readout(root);
  ui.select({ label: "Arquitectura", options: [["lenet", "LeNet-5"], ["alex", "AlexNet"], ["vgg", "VGG16"]], value: st.arch, onChange: function (v) { st.arch = v; st.side = ARCH[v].side; setSlider(); update(); } });
  ui.segmented({ label: "Cabeza clasificadora", options: [["flat", "Flatten + capas densas"], ["gap", "GlobalAveragePooling + una densa"]], value: "flat", onChange: function (v) { st.head = v; update(); } });
  var sl = ui.slider({ label: "Lado de la imagen de entrada (px)", min: 64, max: 320, step: 32, value: 224, onInput: function (v) { st.side = v; update(); } });
  function setSlider() { var A = ARCH[st.arch]; sl.input.min = A.smin; sl.input.max = A.smax; sl.input.step = A.sstep; sl.set(A.side, true); }
  setSlider();

  view.draw(function (ctx, w, h, C) {
    var D = api.d, R = build(), top = 34, bot = 6;
    if (!R.ok) { D.text(ctx, "Con esa imagen las capas no caben: sube el tamaño.", w / 2, h / 2, { size: 13, weight: 600, align: "center", color: C.terracotaInk }); return; }
    var n = R.rows.length, rh = Math.min(22, (h - top - bot) / n), wide = w >= 560, lw = wide ? 200 : Math.min(112, w * 0.32), cw = (w - lw - 10) / 2 - 4, i;
    var maxP = 1, maxA = 1;
    R.rows.forEach(function (r) { if (r.params > maxP) maxP = r.params; if (r.act > maxA) maxA = r.act; });
    var fs = Math.min(10.5, rh * 0.7);
    D.text(ctx, wide ? "capa · forma de su salida" : "capa", 4, 14, { size: 10.5, weight: 600, color: C.ink2 });
    D.text(ctx, "Parámetros", lw + cw / 2, 14, { size: Math.min(11, w / 30), weight: 600, align: "center", color: C.cobaltoInk });
    D.text(ctx, (wide ? "Valores en el mapa de salida" : "Valores de salida"), lw + cw + 8 + cw / 2, 14, { size: Math.min(11, w / 30), weight: 600, align: "center", color: C.terracotaInk });
    D.text(ctx, "(cada barra, a su escala)", lw + cw / 2, 27, { size: 9.5, align: "center", color: C.muted });
    D.text(ctx, "(cada barra, a su escala)", lw + cw + 8 + cw / 2, 27, { size: 9.5, align: "center", color: C.muted });
    R.rows.forEach(function (r, idx) {
      var y = top + idx * rh;
      if (idx % 2 === 0) D.rect(ctx, 0, y, w, rh, C.paper2 || C.paper);
      D.text(ctx, r.name, 4, y + rh / 2 + fs * 0.35, { size: fs, color: C.ink, weight: r.kind === "conv" || r.kind === "fc" ? 600 : 400 });
      if (wide) D.text(ctx, r.shape, 112, y + rh / 2 + fs * 0.35, { size: Math.min(fs, 10), mono: true, color: C.muted });
      var bw = Math.max(0, r.params / maxP * (cw - 56));
      if (r.params > 0) {
        D.rect(ctx, lw, y + 2, Math.max(1.5, bw), rh - 4, r.kind === "fc" ? C.terracota : C.cobalto);
        D.text(ctx, fmt(r.params), lw + Math.max(1.5, bw) + 3, y + rh / 2 + fs * 0.35, { size: Math.min(fs, 9.5), mono: true, color: C.ink2 });
      } else D.text(ctx, "0", lw + 2, y + rh / 2 + fs * 0.35, { size: Math.min(fs, 9.5), mono: true, color: C.muted });
      var ax = lw + cw + 8, aw = Math.max(1.5, r.act / maxA * (cw - 56));
      D.rect(ctx, ax, y + 2, aw, rh - 4, C.oliva);
      D.text(ctx, fmt(r.act), ax + aw + 3, y + rh / 2 + fs * 0.35, { size: Math.min(fs, 9.5), mono: true, color: C.ink2 });
    });
  });

  function update() {
    var R = build(), A = ARCH[st.arch];
    view.redraw();
    if (!R.ok) { out.set("<span class='bad'>La imagen es demasiado pequeña para esta arquitectura.</span>"); return; }
    var known = { "lenet|flat|32": 61706, "alex|flat|227": 62378344, "vgg|flat|224": 138357544 }[st.arch + "|" + st.head + "|" + st.side];
    var html = "<b>" + A.name + "</b> con imagen " + st.side + "×" + st.side + "×" + A.ch + ": total <b>" + fmt(R.total) + "</b> parámetros" +
      (known ? " <span class='good'>(coincide con Keras: " + fmt(known) + ")</span>" : "") +
      "<br>Capas convolucionales: <b>" + fmt(R.conv) + "</b> (" + (100 * R.conv / R.total).toFixed(1) + " %) · capas densas: <b>" + fmt(R.dense) + "</b> (" + (100 * R.dense / R.total).toFixed(1) + " %)";
    html += "<br>" + (st.head === "gap" ? "Con GlobalAveragePooling la parte densa deja de depender del tamaño de la imagen." : "Las capas densas dependen del tamaño de la imagen (Flatten); las convolucionales, no.");
    out.set(html);
  }
  update();
});
