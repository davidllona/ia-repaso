/* Experimento: tamaños y parámetros de VGG16 según el tamaño de la imagen, include_top y la cabeza (Flatten o GlobalAveragePooling2D). */
Lab.register("curso2/c2m5-vgg16-formas", function (root, api) {
  function thou(v) { return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }

  var BLOCKS = [[64, 64], [128, 128], [256, 256, 256], [512, 512, 512], [512, 512, 512]];
  var size = 224, top = false, head = "flat", units = 512;
  function calc() {
    var n = size, cin = 3, rows = [], b, i;
    BLOCKS.forEach(function (blk, bi) {
      var p = 0;
      blk.forEach(function (f) { p += (9 * cin + 1) * f; cin = f; });
      var nIn = n; n = Math.floor(n / 2);
      rows.push({ label: "Bloque " + (bi + 1), shape: nIn + "×" + nIn + " → " + n + "×" + n + "×" + cin, params: p });
    });
    var feat = head === "flat" ? n * n * 512 : 512, extra = [], tot = 0;
    rows.forEach(function (r) { tot += r.params; });
    var base = tot;
    if (top) {
      extra = [{ label: "fc1", shape: "25088 → 4096", params: 25088 * 4096 + 4096, top: true }, { label: "fc2", shape: "4096 → 4096", params: 4096 * 4096 + 4096, top: true }, { label: "predictions", shape: "4096 → 1000", params: 4096 * 1000 + 1000, top: true }];
    } else {
      extra = [{ label: "Dense " + units, shape: feat + " → " + units, params: feat * units + units }, { label: "Dense " + units, shape: units + " → " + units, params: units * units + units }, { label: "Dense 1", shape: units + " → 1", params: units + 1 }];
    }
    extra.forEach(function (r) { tot += r.params; });
    return { rows: rows.concat(extra), base: base, total: tot, map: n, feat: feat, head: tot - base };
  }
  var view = api.view(root, { aspect: 1.6, minH: 250, maxH: 380, label: "Parámetros de cada bloque de VGG16 y de la cabeza" });
  var ui = api.controls(root), out = api.readout(root), R;
  ui.select({ label: "Tamaño de la imagen (alto = ancho)", options: [[224, "224 (el de VGG16)"], [160, "160"], [128, "128"], [96, "96"], [64, "64"], [32, "32 (el mínimo)"]], value: size, onChange: function (v) { size = +v; update(); } });
  ui.segmented({ label: "include_top", options: [[false, "False (quitar clasificador)"], [true, "True"]], value: top, onChange: function (v) { top = v; update(); } });
  ui.segmented({ label: "Tras la base…", options: [["flat", "Flatten"], ["gap", "GlobalAveragePooling2D"]], value: head, onChange: function (v) { head = v; update(); } });
  ui.select({ label: "Neuronas de la cabeza nueva", options: [[256, "256"], [512, "512 (proyecto)"]], value: units, onChange: function (v) { units = +v; update(); } });
  function fm(v) { return v >= 1e6 ? (v / 1e6).toFixed(1).replace(".", ",") + " M" : v >= 1e3 ? (v / 1e3).toFixed(0) + " k" : String(v); }
  R = calc();
  view.draw(function (ctx, w, h, C) {
    var rows = R.rows, n = rows.length, left = 78, right = 52, top0 = 8, rh = (h - top0 - 6) / n, mx = Math.max.apply(null, rows.map(function (r) { return r.params; }));
    rows.forEach(function (r, i) {
      var y = top0 + i * rh, bw = (w - left - right - 6) * r.params / mx, col = r.top ? C.terracota : (i < 5 ? C.cobalto : C.oliva);
      api.d.text(ctx, r.label, 6, y + rh / 2 + 4, { size: 11, color: C.ink2, weight: i < 5 ? 400 : 600 });
      api.d.rect(ctx, left, y + 2, Math.max(2, bw), rh - 4, col);
      api.d.text(ctx, fm(r.params), w - 6, y + rh / 2 + 4, { size: 11, align: "right", mono: true, color: C.ink });
    });
  });
  function update() {
    R = calc();
    var bad = top && size !== 224;
    var maps = R.rows.slice(0, 5).map(function (r) { return r.shape.split(" → ")[1].split("×")[0]; });
    out.set("Mapas de salida por bloque: <b>" + size + " → " + maps.join(" → ") + "</b> · salida de la base: <b>" + R.map + "×" + R.map + "×512</b> = " + thou((R.map * R.map * 512)) + " valores" + (head === "flat" && !top ? " (esto es lo que entra en la primera <code>Dense</code>)" : "") + "<br>" +
      "Base (13 capas Conv): <b>" + thou(R.base) + "</b> parámetros · " + (top ? "clasificador original" : "cabeza nueva") + ": <b>" + thou(R.head) + "</b> · total: <b>" + thou(R.total) + "</b>" +
      (bad ? "<br><span class='bad'>Con include_top=True y pesos de ImageNet, Keras exige 224×224: las capas fc esperan exactamente 25.088 entradas.</span>" : (R.head > R.base ? "<br><span class='bad'>La cabeza tiene más parámetros que toda la base convolucional.</span>" : "")));
    view.redraw();
  }
  update();
});
