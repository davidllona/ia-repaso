/* Experimento: formas y parámetros del autoencoder convolucional; con padding "valid" o tamaños impares la salida deja de coincidir con la entrada. */
Lab.register("curso2/c2m5-forma-autoencoder", function (root, api) {
  function thou(v) { return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }

  var n0 = 28, pad = "same", f1 = 16, f2 = 8;
  var ui, view, out, tbl;
  function build() {
    var rows = [], n = n0, c = 1, tot = 0, enc = [], sizes = [[n0, 1]];
    function conv(name, f, act) {
      var p = (9 * c + 1) * f; n = pad === "same" ? n : n - 2; c = f; tot += p;
      rows.push([name, n + "×" + n + "×" + c, p]); sizes.push([n, c]);
    }
    function pool(name) { n = pad === "same" ? Math.ceil(n / 2) : Math.floor(n / 2); rows.push([name, n + "×" + n + "×" + c, 0]); sizes.push([n, c]); }
    function up(name) { n = n * 2; rows.push([name, n + "×" + n + "×" + c, 0]); sizes.push([n, c]); }
    rows.push(["Input", n0 + "×" + n0 + "×1", 0]);
    conv("Conv " + f1, f1); pool("MaxPool");
    conv("Conv " + f2, f2); pool("bottleneck (MaxPool)");
    var bi = rows.length - 1, bn = n, bc = c;
    conv("Conv " + f2, f2); up("UpSampling");
    conv("Conv " + f1, f1); up("UpSampling");
    conv("Conv 1 (sigmoid)", 1);
    return { rows: rows, total: tot, n: n, bi: bi, bn: bn, bc: bc, sizes: sizes };
  }
  view = api.view(root, { aspect: 3.2, minH: 110, maxH: 150, label: "Embudo del autoencoder: tamaño de cada capa" });
  ui = api.controls(root);
  ui.select({ label: "Tamaño de la imagen de entrada", options: [[28, "28×28 (como en las notas)"], [32, "32×32"], [25, "25×25 (impar)"]], value: n0, onChange: function (v) { n0 = +v; update(); } });
  ui.segmented({ label: "padding de convoluciones y pooling", options: [["same", "same"], ["valid", "valid"]], value: pad, onChange: function (v) { pad = v; update(); } });
  ui.select({ label: "Filtros de la capa exterior", options: [[8, "8"], [16, "16 (notas)"], [32, "32"]], value: f1, onChange: function (v) { f1 = +v; update(); } });
  ui.select({ label: "Filtros de la capa interior", options: [[4, "4"], [8, "8 (notas)"], [16, "16"]], value: f2, onChange: function (v) { f2 = +v; update(); } });
  out = api.readout(root);
  tbl = api.table(root, ["Capa", "Forma de salida", "Parámetros"]);
  tbl.el.classList.add("c2m5-fa");
  root.appendChild(api.el("style", { text: ".c2m5-fa .lab-table{font-size:.74rem}.c2m5-fa .lab-table td,.c2m5-fa .lab-table th{padding:.3rem .3rem!important}" }));
  var M = build();
  view.draw(function (ctx, w, h, C) {
    var sz = M.sizes, k = sz.length, bx = 12, gap = (w - 24) / k, maxH = h - 34, i;
    for (i = 0; i < k; i++) {
      var hh = Math.max(4, Math.min(1.4, sz[i][0] / n0) * maxH * 0.8), ww = Math.max(5, Math.min(gap - 4, 3 + sz[i][1] * 0.9));
      var col = i === 0 || i === k - 1 ? C.ink2 : (i - 1 === M.bi - 0 ? C.terracota : (i <= M.bi ? C.cobalto : C.oliva));
      var cx = bx + gap * i + gap / 2;
      api.d.rect(ctx, cx - ww / 2, 8 + (maxH - hh) / 2, ww, hh, col);
    }
    var cxb = bx + gap * M.bi + gap / 2;
    api.d.text(ctx, "entrada", bx + gap / 2, h - 6, { size: 10, align: "left", color: C.muted });
    api.d.text(ctx, "cuello", Math.min(w - 30, Math.max(40, cxb)), h - 6, { size: 10, align: "center", color: C.terracotaInk, weight: 600 });
    api.d.text(ctx, "salida", w - 12, h - 6, { size: 10, align: "right", color: C.muted });
  });
  function update() {
    M = build();
    var ok = M.n === n0, bv = M.bn * M.bn * M.bc, comp = n0 * n0 / bv;
    out.set("Entrada: <b>" + n0 + "×" + n0 + "×1 = " + (n0 * n0) + "</b> valores · cuello de botella: <b>" + M.bn + "×" + M.bn + "×" + M.bc + " = " + bv + "</b> valores → compresión <b>" + comp.toFixed(1).replace(".", ",") + "×</b> · parámetros totales: <b>" + thou(M.total) + "</b><br>" +
      "Salida: <b>" + M.n + "×" + M.n + "</b> · " + (ok ? "<span class='good'>coincide con la entrada: se puede calcular el MSE</span>" : "<span class='bad'>NO coincide con " + n0 + "×" + n0 + ": Keras no puede comparar la salida con el objetivo</span>"));
    tbl.set(M.rows.map(function (r, i) { return [r[0].replace("bottleneck", "<b>bottleneck</b>"), r[1], thou(r[2])]; }).concat([["<b>Total</b>", "", "<b>" + thou(M.total) + "</b>"]]));
    view.redraw();
  }
  update();
});
