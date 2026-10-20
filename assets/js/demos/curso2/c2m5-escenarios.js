/* Experimento: los tres escenarios de transfer learning sobre VGG16: qué se congela, qué se entrena y cuántos parámetros. */
Lab.register("curso2/c2m5-escenarios", function (root, api) {
  function thou(v) { return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }

  var CONV = [["block1_conv1", 1792], ["block1_conv2", 36928], ["block2_conv1", 73856], ["block2_conv2", 147584], ["block3_conv1", 295168], ["block3_conv2", 590080], ["block3_conv3", 590080],
    ["block4_conv1", 1180160], ["block4_conv2", 2359808], ["block4_conv3", 2359808], ["block5_conv1", 2359808], ["block5_conv2", 2359808], ["block5_conv3", 2359808]];
  var HEAD = [["Dense 512", 12845568], ["Dense 512", 262656], ["Dense 1", 513]];
  var sc = 2, nTop = 3;
  var view = api.view(root, { aspect: 1.25, minH: 330, maxH: 430, label: "Capas de VGG16 y cabeza: congeladas o entrenables" });
  api.legend(root, [[api.colors().muted, "congelada (no se actualiza)"], [api.colors().terracota, "entrenable"]]);
  var ui = api.controls(root), out = api.readout(root), sl;
  ui.segmented({ label: "Escenario", options: [[1, "1 · Feature extraction"], [2, "2 · Transfer learning"], [3, "3 · Fine-tuning"]], value: sc, onChange: function (v) { sc = v; update(); } });
  sl = ui.slider({ label: "Fine-tuning: últimas capas Conv descongeladas", min: 0, max: 13, step: 1, value: nTop, fmt: function (v) { return v + (v === 3 ? " (bloque 5)" : ""); }, onInput: function (v) { nTop = v; if (sc !== 3) { sc = 3; segSet(); } update(); } });
  function segSet() { var b = ui.el.querySelectorAll(".seg button"); b.forEach(function (x, i) { x.setAttribute("aria-pressed", String(i + 1 === sc)); }); }
  function rows() {
    var r = [];
    CONV.forEach(function (c, i) { r.push({ name: c[0], p: c[1], tr: sc === 3 && i >= 13 - nTop }); });
    if (sc !== 1) HEAD.forEach(function (c) { r.push({ name: c[0], p: c[1], tr: true, head: true }); });
    return r;
  }
  function fm(v) { return v >= 1e6 ? (v / 1e6).toFixed(1).replace(".", ",") + " M" : v >= 1e3 ? Math.round(v / 1e3) + " k" : String(v); }
  var R = rows();
  view.draw(function (ctx, w, h, C) {
    var all = CONV.concat(sc !== 1 ? HEAD : []), n = 16, left = 92, right = 50, rh = (h - 8) / n, mx = Math.sqrt(12845568), i;
    for (i = 0; i < n; i++) {
      var y = 4 + i * rh, row = R[i];
      if (!row) { if (i === 13) api.d.text(ctx, "sin cabeza: la salida de la base son las features", left, y + rh / 2 + 4, { size: 11, color: C.muted }); continue; }
      var col = row.tr ? C.terracota : C.muted, bw = (w - left - right) * Math.sqrt(row.p) / mx;
      api.d.text(ctx, row.name, 6, y + rh / 2 + 4, { size: 10.5, color: row.head ? C.ink : C.ink2, weight: row.head ? 600 : 400, mono: true });
      api.d.rect(ctx, left, y + 2, Math.max(2, bw), rh - 4, col);
      api.d.text(ctx, fm(row.p), w - 6, y + rh / 2 + 4, { size: 10.5, align: "right", mono: true, color: C.ink });
    }
  });
  var NOTE = { 1: "Todo congelado. Se usa VGG16 solo para obtener features (25.088 números por imagen) y se pasan a otro método (clustering, PCA, un clasificador sencillo). Aquí no hay <code>fit</code> de la red.",
    2: "Base congelada + cabeza nueva. Se entrena solo la cabeza. En el proyecto: <code>Adam(learning_rate=0.0001)</code>.",
    3: "Se descongelan las capas superiores de la base y se entrenan junto con la cabeza, con un learning rate muy pequeño: <code>Adam(learning_rate=1e-5)</code>." };
  function update() {
    R = rows();
    var tr = 0, fr = 0, base = 0, deepest = -1;
    R.forEach(function (r, i) { if (r.tr) tr += r.p; else fr += r.p; if (r.tr && deepest < 0) deepest = i; });
    var tot = tr + fr, cap = R.filter(function (r) { return r.tr; }).length;
    out.set("Entrenables: <b>" + thou(tr) + "</b> · congelados: <b>" + thou(fr) + "</b> · parte entrenable: <b>" + (tot ? (100 * tr / tot).toFixed(1).replace(".", ",") : 0) + " %</b><br>" +
      (tr === 0 ? "El gradiente no se calcula para ningún peso." : "El gradiente solo llega hasta <b>" + R[deepest].name + "</b>: " + cap + " de " + R.length + " capas con peso se actualizan.") + "<br>" + NOTE[sc]);
    view.redraw();
  }
  update();
});
