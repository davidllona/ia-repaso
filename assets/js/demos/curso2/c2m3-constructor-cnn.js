/* Experimento: construye una CNN capa a capa y mira cómo cambian las formas y los parámetros (como model.summary()). */
Lab.register("curso2/c2m3-constructor-cnn", function (root, api) {
  var INPUTS = { a: [28, 28, 1], b: [32, 32, 3], c: [64, 64, 3], d: [224, 224, 3], e: [100, 100, 3] };
  var inKey = "a", layers = [], cfg = { filters: 16, k: 3, s: 1, pad: "valid", units: 64 }, msg = "", rows = [];
  var NAMES = { conv: ["conv2d", "Conv2D"], pool: ["max_pooling2d", "MaxPooling2D"], gap: ["global_average_pooling2d", "GlobalAveragePooling2D"], flat: ["flatten", "Flatten"], dense: ["dense", "Dense"] };
  function fmtN(n) { return n.toLocaleString("en-US"); }

  function run() {
    var shape = INPUTS[inKey].slice(), counts = {}, total = 0, out = [], err = "";
    out.push({ name: "input_layer (InputLayer)", shape: "(None, " + shape.join(", ") + ")", params: 0 });
    for (var t = 0; t < layers.length; t++) {
      var L = layers[t], params = 0, name;
      counts[L.type] = (counts[L.type] || 0);
      name = NAMES[L.type][0] + (counts[L.type] ? "_" + counts[L.type] : "") + " (" + NAMES[L.type][1] + ")";
      counts[L.type]++;
      if (L.type === "conv") {
        if (shape.length !== 3) { err = "Conv2D necesita un mapa 3D (alto, ancho, canales)."; break; }
        var H = shape[0], W = shape[1], C = shape[2], oh, ow;
        if (L.pad === "same") { oh = Math.ceil(H / L.s); ow = Math.ceil(W / L.s); }
        else { if (H < L.k || W < L.k) { err = "El filtro " + L.k + "×" + L.k + " no cabe en un mapa de " + H + "×" + W + " con padding 'valid'."; break; } oh = Math.floor((H - L.k) / L.s) + 1; ow = Math.floor((W - L.k) / L.s) + 1; }
        params = (L.k * L.k * C + 1) * L.filters; shape = [oh, ow, L.filters];
      } else if (L.type === "pool") {
        if (shape.length !== 3) { err = "MaxPooling2D necesita un mapa 3D."; break; }
        if (shape[0] < 2 || shape[1] < 2) { err = "El mapa (" + shape[0] + "×" + shape[1] + ") es demasiado pequeño para un pooling 2×2."; break; }
        shape = [Math.floor(shape[0] / 2), Math.floor(shape[1] / 2), shape[2]];
      } else if (L.type === "gap") {
        if (shape.length !== 3) { err = "GlobalAveragePooling2D necesita un mapa 3D."; break; }
        shape = [shape[2]];
      } else if (L.type === "flat") {
        if (shape.length === 3) shape = [shape[0] * shape[1] * shape[2]];
      } else if (L.type === "dense") {
        if (shape.length !== 1) { err = "Antes de una Dense hace falta Flatten (o GlobalAveragePooling2D) para pasar de mapa 3D a vector."; break; }
        params = (shape[0] + 1) * L.units; shape = [L.units];
      }
      total += params;
      out.push({ name: name, shape: "(None, " + shape.join(", ") + ")", params: params });
    }
    return { rows: out, total: total, err: err, last: shape };
  }

  var view = api.view(root, { aspect: 2.4, minH: 150, maxH: 300, label: "Parámetros de cada capa de la red, en barras horizontales" });
  var tbl = api.table(root, ["Capa (tipo)", "Output shape", "Param #", "% del total"]);
  var out = api.readout(root), ui = api.controls(root);
  var inSel = ui.select({ label: "Imagen de entrada", options: [["a", "28×28×1 (dígito en gris)"], ["b", "32×32×3 (color pequeño)"], ["c", "64×64×3"], ["d", "224×224×3 (foto)"], ["e", "100×100×3 (la CNN de las notas)"]], value: inKey, onChange: function (v) { inKey = v; msg = ""; update(); } });
  ui.select({ label: "Conv2D · filtros", options: [8, 16, 32, 64, 128].map(function (n) { return [n, String(n)]; }), value: cfg.filters, onChange: function (v) { cfg.filters = +v; } });
  ui.select({ label: "Conv2D · kernel", options: [[1, "1×1"], [3, "3×3"], [5, "5×5"], [7, "7×7"]], value: cfg.k, onChange: function (v) { cfg.k = +v; } });
  ui.select({ label: "Conv2D · stride", options: [[1, "1"], [2, "2"]], value: cfg.s, onChange: function (v) { cfg.s = +v; } });
  ui.select({ label: "Conv2D · padding", options: [["valid", "valid"], ["same", "same"]], value: cfg.pad, onChange: function (v) { cfg.pad = v; } });
  ui.select({ label: "Dense · neuronas", options: [10, 64, 128, 256, 1000].map(function (n) { return [n, String(n)]; }), value: cfg.units, onChange: function (v) { cfg.units = +v; } });
  function add(L) {
    var keep = layers.slice(); layers.push(L);
    var r = run();
    if (r.err) { layers = keep; msg = r.err; } else msg = "";
    update();
  }
  ui.button("+ Conv2D (ReLU)", function () { add({ type: "conv", filters: cfg.filters, k: cfg.k, s: cfg.s, pad: cfg.pad }); }, "primary");
  ui.button("+ MaxPooling2D(2)", function () { add({ type: "pool" }); });
  ui.button("+ Flatten", function () { add({ type: "flat" }); });
  ui.button("+ GlobalAveragePooling2D", function () { add({ type: "gap" }); });
  ui.button("+ Dense", function () { add({ type: "dense", units: cfg.units }); }, "warm");
  ui.button("Quitar la última", function () { layers.pop(); msg = ""; update(); });
  ui.button("Vaciar", function () { layers = []; msg = ""; update(); });
  ui.button("Cargar: CNN del curso (28×28×1)", function () {
    inKey = "a"; inSel.set("a"); layers = [{ type: "conv", filters: 16, k: 5, s: 1, pad: "valid" }, { type: "pool" }, { type: "conv", filters: 32, k: 5, s: 1, pad: "valid" }, { type: "pool" }, { type: "flat" }, { type: "dense", units: 100 }, { type: "dense", units: 10 }]; msg = ""; update();
  });
  ui.button("Cargar: CNN de las notas (100×100×3 → 3 clases)", function () {
    inKey = "e"; inSel.set("e"); layers = [{ type: "conv", filters: 16, k: 3, s: 1, pad: "valid" }, { type: "pool" }, { type: "conv", filters: 32, k: 3, s: 1, pad: "valid" }, { type: "pool" }, { type: "flat" }, { type: "dense", units: 100 }, { type: "dense", units: 3 }]; msg = ""; update();
  });
  ui.button("Cargar: solo Dense (misma entrada)", function () { layers = [{ type: "flat" }, { type: "dense", units: 128 }, { type: "dense", units: 10 }]; msg = ""; update(); });

  view.draw(function (ctx, w, h, C) {
    var D = api.d, r = run(), items = r.rows.slice(1), n = Math.max(items.length, 1), top = 8, labW = Math.min(150, w * 0.38), bot = 6;
    var rowH = Math.min(30, (h - top - bot) / n), mx = 1, i;
    items.forEach(function (it) { mx = Math.max(mx, it.params); });
    if (!items.length) { D.text(ctx, "Añade capas con los botones de abajo", w / 2, h / 2, { size: 13, align: "center", color: C.muted }); return; }
    for (i = 0; i < items.length; i++) {
      var y = top + i * rowH, nm = items[i].name.split(" ")[0], bw = (w - labW - 70) * items[i].params / mx;
      D.text(ctx, nm, labW - 8, y + rowH / 2 + 4, { size: Math.min(12, rowH * 0.55), align: "right", mono: true, color: C.ink2 });
      D.rect(ctx, labW, y + rowH * 0.15, Math.max(items[i].params ? 2 : 0, bw), rowH * 0.7, items[i].params === mx ? C.terracota : C.cobalto);
      D.text(ctx, items[i].params ? fmtN(items[i].params) : "0", labW + Math.max(2, bw) + 6, y + rowH / 2 + 4, { size: Math.min(12, rowH * 0.55), mono: true, color: items[i].params ? C.ink : C.muted });
    }
  });
  function update() {
    var r = run(); rows = r.rows;
    view.redraw();
    tbl.set(rows.map(function (x) {
      return [x.name, x.shape, fmtN(x.params), r.total ? (x.params ? (100 * x.params / r.total).toFixed(1) + " %" : "—") : "—"];
    }).concat([["<b>Total</b>", "", "<b>" + fmtN(r.total) + "</b>", ""]]));
    var kb = r.total * 4 / 1024;
    out.set("Parámetros totales: <b>" + fmtN(r.total) + "</b> (≈ " + (kb >= 1024 ? (kb / 1024).toFixed(1) + " MB" : kb.toFixed(1) + " KB") + " en float32)" +
      (msg ? "<br><span class='bad'>No se ha podido añadir: " + msg + "</span>" : "") +
      (layers.length && r.last.length === 1 ? "<br>La red ya termina en un vector de <b>" + r.last[0] + "</b> valores." : ""));
  }
  layers = [{ type: "conv", filters: 16, k: 5, s: 1, pad: "valid" }, { type: "pool" }, { type: "conv", filters: 32, k: 5, s: 1, pad: "valid" }, { type: "pool" }, { type: "flat" }, { type: "dense", units: 100 }, { type: "dense", units: 10 }];
  update();
});
