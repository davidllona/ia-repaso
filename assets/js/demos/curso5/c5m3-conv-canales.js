/* Experimento: una nn.Conv2d(in_channels=2, out_channels=2, kernel_size=2) calculada a mano, posición a posición.
   Cada filtro de salida tiene UN kernel por canal de entrada; se suman las aportaciones de todos los canales y el sesgo. */
(function () {
  var X = [[[1, 2, 0], [0, 1, 3], [2, 1, 0]], [[0, 1, 1], [2, 0, 1], [1, 3, 0]]];
  var K = [
    [[[1, 0], [0, -1]], [[0, 1], [1, 0]]],
    [[[0, 1], [-1, 0]], [[1, 0], [0, 1]]]
  ];
  var B0 = [0.5, -1];

  function partial(o, c, i, j) {
    var s = 0, a, b;
    for (a = 0; a < 2; a++) for (b = 0; b < 2; b++) s += X[c][i + a][j + b] * K[o][c][a][b];
    return s;
  }
  /* mask[c] = 1 si el canal de entrada c participa; bias[o] = sesgo del filtro o */
  function outAt(o, i, j, mask, bias) {
    var s = 0, c;
    for (c = 0; c < 2; c++) if (mask[c]) s += partial(o, c, i, j);
    return s + bias[o];
  }
  var core = { X: X, K: K, partial: partial, outAt: outAt, B0: B0 };
  if (typeof module !== "undefined" && module.exports) module.exports = core;
  if (typeof Lab === "undefined") return;

  Lab.register("curso5/c5m3-conv-canales", function (root, api) {
    var D = api.d;
    var S = { o: 0, pos: 0, on1: true, bias: B0.slice() };
    function fmt(x) { return Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : (Math.round(x * 10) / 10).toString(); }
    function mask() { return [1, S.on1 ? 1 : 0]; }
    function posIJ() { return { i: Math.floor(S.pos / 2), j: S.pos % 2 }; }

    var vA = api.view(root, { aspect: 2.2, minH: 152, maxH: 172, label: "Canal de entrada 0: imagen, kernel y productos" });
    var vB = api.view(root, { aspect: 2.2, minH: 152, maxH: 172, label: "Canal de entrada 1: imagen, kernel y productos" });
    var vO = api.view(root, { aspect: 2.2, minH: 152, maxH: 172, label: "Mapas de salida de los dos filtros" });
    var ui = api.controls(root), out = api.readout(root);
    ui.segmented({ label: "Filtro de salida", value: 0, options: [[0, "filtro 0"], [1, "filtro 1"]], onChange: function (v) { S.o = v; sb.set(S.bias[v], true); update(); } });
    var sp = ui.slider({ label: "Posición de la ventana", min: 0, max: 3, step: 1, value: 0, fmt: function (v) { return (v + 1) + " de 4"; }, onInput: function (v) { S.pos = v; update(); } });
    var sb = ui.slider({ label: "Sesgo (bias) del filtro", min: -3, max: 3, step: 0.5, value: S.bias[0], fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.bias[S.o] = v; update(); } });
    ui.toggle({ label: "Canal de entrada 1 activo", value: true, onChange: function (v) { S.on1 = v; update(); } });
    ui.button("Siguiente posición ▶", function () { S.pos = (S.pos + 1) % 4; sp.set(S.pos, true); update(); }, "primary");

    function panel(c) {
      return function (ctx, w, h, C) {
        var p = posIJ(), g = 14, s = Math.max(16, Math.min(34, (w - 20 - 2 * g) / 7)), x0 = (w - (7 * s + 2 * g)) / 2, y0 = 30, a, b;
        var inactive = c === 1 && !S.on1, colr = c === 0 ? C.cobalto : C.terracota, wash = c === 0 ? C.cobaltoWash : C.terracotaWash, ink = c === 0 ? C.cobaltoInk : C.terracotaInk;
        D.text(ctx, (w > 430 ? "canal de entrada " : "entrada ") + c + (inactive ? (w > 430 ? " (apagado)" : " (off)") : ""), x0, 14, { size: 11, weight: 600, color: inactive ? C.muted : ink });
        D.text(ctx, "kernel K[" + S.o + "][" + c + "]", x0 + 3 * s + g, 14, { size: 11, weight: 600, color: C.ink2 });
        D.text(ctx, "productos", x0 + 5 * s + 2 * g, 14, { size: 11, weight: 600, color: C.ink2 });
        for (a = 0; a < 3; a++) for (b = 0; b < 3; b++) {
          var inWin = a >= p.i && a <= p.i + 1 && b >= p.j && b <= p.j + 1;
          D.rect(ctx, x0 + b * s, y0 + a * s, s, s, inWin && !inactive ? wash : C.surface, C.line, 1);
          D.text(ctx, String(X[c][a][b]), x0 + (b + 0.5) * s, y0 + (a + 0.5) * s + 4, { size: Math.min(14, s * 0.45), align: "center", mono: true, color: inactive ? C.muted : C.ink });
        }
        D.rect(ctx, x0 + p.j * s, y0 + p.i * s, 2 * s, 2 * s, null, inactive ? C.muted : colr, 3);
        var kx = x0 + 3 * s + g, px = x0 + 5 * s + 2 * g, ky = y0 + 0.5 * s, sum = 0;
        for (a = 0; a < 2; a++) for (b = 0; b < 2; b++) {
          var kv = K[S.o][c][a][b], pv = X[c][p.i + a][p.j + b] * kv; sum += pv;
          D.rect(ctx, kx + b * s, ky + a * s, s, s, C.surface, C.line, 1);
          D.text(ctx, fmt(kv), kx + (b + 0.5) * s, ky + (a + 0.5) * s + 4, { size: Math.min(14, s * 0.45), align: "center", mono: true, color: kv > 0 ? C.cobaltoInk : kv < 0 ? C.terracotaInk : C.muted, weight: 600 });
          D.rect(ctx, px + b * s, ky + a * s, s, s, inactive ? C.surface : (pv > 0 ? C.cobaltoWash : pv < 0 ? C.terracotaWash : C.paper), C.line, 1);
          D.text(ctx, inactive ? "·" : fmt(pv), px + (b + 0.5) * s, ky + (a + 0.5) * s + 4, { size: Math.min(14, s * 0.45), align: "center", mono: true, color: inactive ? C.muted : C.ink, weight: 600 });
        }
        D.text(ctx, "Σ = " + (inactive ? "—" : fmt(sum)), px + s, ky + 2 * s + 16, { size: 12, align: "center", mono: true, weight: 700, color: inactive ? C.muted : C.ink });
      };
    }
    function drawOut(ctx, w, h, C) {
      var p = posIJ(), s = Math.max(18, Math.min(38, (w - 40) / 6)), gap = Math.max(24, (w - 4 * s) / 3), x0 = (w - (4 * s + gap)) / 2, y0 = 30, o, i, j, m = mask();
      for (o = 0; o < 2; o++) {
        var xo = x0 + o * (2 * s + gap);
        D.text(ctx, "salida " + o + (o === S.o ? "  ◀ filtro elegido" : ""), xo, 14, { size: 11, weight: 600, color: o === S.o ? C.ink : C.muted });
        for (i = 0; i < 2; i++) for (j = 0; j < 2; j++) {
          var v = outAt(o, i, j, m, S.bias), cur = o === S.o && i === p.i && j === p.j;
          D.rect(ctx, xo + j * s, y0 + i * s, s, s, v > 0 ? C.cobaltoWash : v < 0 ? C.terracotaWash : C.paper, cur ? C.ink : C.line, cur ? 3 : 1);
          D.text(ctx, fmt(v), xo + (j + 0.5) * s, y0 + (i + 0.5) * s + 4, { size: Math.min(14, s * 0.42), align: "center", mono: true, weight: 600, color: v > 0 ? C.cobaltoInk : v < 0 ? C.terracotaInk : C.muted });
        }
      }
    }
    vA.draw(panel(0)); vB.draw(panel(1)); vO.draw(drawOut);

    function update() {
      var p = posIJ(), m = mask(), s0 = partial(S.o, 0, p.i, p.j), s1 = partial(S.o, 1, p.i, p.j), tot = outAt(S.o, p.i, p.j, m, S.bias);
      vA.redraw(); vB.redraw(); vO.redraw();
      out.set("Filtro <b>" + S.o + "</b>, ventana en fila <b>" + p.i + "</b>, columna <b>" + p.j + "</b><br>" +
        "canal 0: Σ = <b>" + fmt(s0) + "</b> &nbsp;+&nbsp; canal 1: Σ = <b>" + (S.on1 ? fmt(s1) : "0 (apagado)") + "</b> &nbsp;+&nbsp; sesgo <b>" + fmt(S.bias[S.o]) + "</b> &nbsp;=&nbsp; <b>" + fmt(tot) + "</b>" +
        "<br>Es <b>un solo número</b> por filtro y posición: los canales de entrada se suman. Parámetros de la capa: 2·2·2·2 pesos + 2 sesgos = <b>18</b>.");
    }
    update();
  });
})();
