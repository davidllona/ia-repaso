/* Experimento: red densa frente a CNN según el tamaño de la imagen, en parámetros y en multiplicaciones por imagen.
   Densa: Flatten → Linear(n²·c, H) → ReLU → Linear(H, 10). CNN: Conv(c→F,3,pad 1) → pool 2 → Conv(F→2F,3,pad 1) → pool 2 → (Flatten | AdaptiveAvgPool2d(1)) → Linear. */
(function () {
  function models(n, c, H, F) {
    var d = { params: n * n * c * H + H + H * 10 + 10, macs: n * n * c * H + H * 10 };
    var c1p = (9 * c + 1) * F, c1m = F * n * n * 9 * c, n1 = Math.floor(n / 2);
    var c2p = (9 * F + 1) * 2 * F, c2m = 2 * F * n1 * n1 * 9 * F, n2 = Math.floor(n1 / 2);
    var flat = 2 * F * n2 * n2;
    var cf = { params: c1p + c2p + flat * 10 + 10, macs: c1m + c2m + flat * 10, flat: flat, n2: n2 };
    var cg = { params: c1p + c2p + 2 * F * 10 + 10, macs: c1m + c2m + 2 * F * 10 };
    return { dense: d, cnnFlat: cf, cnnGap: cg };
  }
  var core = { models: models };
  if (typeof module !== "undefined" && module.exports) module.exports = core;
  if (typeof Lab === "undefined") return;

  Lab.register("curso5/c5m3-conv-vs-densa", function (root, api) {
    var D = api.d, SIZES = [8, 16, 28, 32, 64, 96, 128, 224];
    var S = { i: 2, c: 1, H: 128, F: 16 };
    function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }

    var view = api.view(root, { aspect: 1.5, minH: 270, maxH: 360, label: "Parámetros y multiplicaciones de una red densa y de dos CNN, en escala logarítmica" });
    var ui = api.controls(root), out = api.readout(root);
    ui.slider({ label: "Lado de la imagen n", min: 0, max: SIZES.length - 1, step: 1, value: S.i, fmt: function (v) { return SIZES[v] + "×" + SIZES[v]; }, onInput: function (v) { S.i = v; update(); } });
    ui.segmented({ label: "Canales", value: S.c, options: [[1, "1 (gris)"], [3, "3 (color)"]], onChange: function (v) { S.c = v; update(); } });
    ui.segmented({ label: "Neuronas ocultas de la densa", value: S.H, options: [[32, "32"], [128, "128"], [512, "512"]], onChange: function (v) { S.H = v; update(); } });
    ui.segmented({ label: "Filtros de la 1.ª conv (F)", value: S.F, options: [[8, "8"], [16, "16"], [32, "32"]], onChange: function (v) { S.F = v; update(); } });

    function logx(v, x0, bw) { return x0 + bw * (Math.log10(Math.max(v, 1)) - 2) / 7.5; }
    function draw(ctx, w, h, C) {
      var n = SIZES[S.i], M = models(n, S.c, S.H, S.F), labW = Math.min(112, w * 0.3), bx = labW + 4, bw = w - bx - 10;
      var items = [["Densa", M.dense, C.terracota], ["CNN + Flatten", M.cnnFlat, C.cobalto], ["CNN + GAP", M.cnnGap, C.oliva]];
      var groups = [["Parámetros", "params"], ["Multiplicaciones por imagen", "macs"]], gh = (h - 16) / 2, g, k, e;
      groups.forEach(function (gr, gi) {
        var y0 = 8 + gi * gh;
        D.text(ctx, gr[0], 4, y0 + 10, { size: 11.5, weight: 600, color: C.ink2 });
        for (e = 2; e <= 9; e += 1) {
          var gx = logx(Math.pow(10, e), bx, bw);
          D.line(ctx, gx, y0 + 18, gx, y0 + gh - 18, C.line, 1);
          D.text(ctx, "10" + ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"][e], gx, y0 + gh - 6, { size: 9.5, align: "center", color: C.muted, mono: true });
        }
        var rh = (gh - 40) / 3;
        items.forEach(function (it, ii) {
          var y = y0 + 18 + ii * rh, v = it[1][gr[1]], x1 = logx(v, bx, bw);
          D.text(ctx, it[0], 4, y + rh * 0.6, { size: 11, color: C.ink });
          D.rect(ctx, bx, y + 2, Math.max(2, x1 - bx), rh - 5, it[2], null);
          var txt = fmt(v), inside = x1 - bx > txt.length * 7 + 12;
          D.text(ctx, txt, inside ? x1 - 4 : x1 + 4, y + rh * 0.62, { size: 11, mono: true, weight: 600, align: inside ? "right" : "left", color: inside ? C.paper : C.ink });
        });
      });
    }
    view.draw(draw);

    function update() {
      var n = SIZES[S.i], M = models(n, S.c, S.H, S.F), d = M.dense, f = M.cnnFlat, g = M.cnnGap;
      out.set("Imagen <b>" + n + "×" + n + "×" + S.c + "</b> = " + fmt(n * n * S.c) + " valores de entrada.<br>" +
        "Densa: <b>" + fmt(d.params) + "</b> parámetros · CNN+Flatten: <b>" + fmt(f.params) + "</b> (" + (d.params / f.params).toFixed(1) + "× menos; su <code>Flatten</code> da " + fmt(f.flat) + " valores) · CNN+GAP: <b>" + fmt(g.params) + "</b> (" + (d.params / g.params).toFixed(0) + "× menos, <b>siempre los mismos</b> sea cual sea n).<br>" +
        "Multiplicaciones por imagen: densa <b>" + fmt(d.macs) + "</b> · CNN <b>" + fmt(f.macs) + "</b>" + (f.macs > d.macs ? " → <span class='bad'>la CNN calcula " + (f.macs / d.macs).toFixed(1) + "× más que la densa</span>" : " → la CNN calcula " + (d.macs / f.macs).toFixed(1) + "× menos") + ".");
      view.redraw();
    }
    update();
  });
})();
