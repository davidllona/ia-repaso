/* Experimento: formas y parámetros de una red de una capa oculta nn.Linear(d_in, h) → activación → nn.Linear(h, d_out).
   Se eligen d_in, h, d_out y el tamaño del lote y se ve la forma de cada tensor y cuántos números hay que aprender. */
Lab.register("curso5/c5m1-parametros", function (root, api) {
  var D = api.d;
  var S = { din: 64, h: 16, dout: 10, n: 32 };
  var PRESETS = [["XOR 2-2-1", 2, 2, 1, 4], ["Lunas 2-8-1", 2, 8, 1, 32], ["Dígitos 64-16-10", 64, 16, 10, 32], ["MNIST 784-100-10", 784, 100, 10, 100]];

  var view = api.view(root, { aspect: 3.6, minH: 110, maxH: 150, label: "Barra con la parte de los parámetros que corresponde a cada tensor" });
  var ui = api.controls(root), out = api.readout(root);
  var sIn, sH, sOut, sN;
  sIn = ui.slider({ label: "d_in (características de entrada)", min: 1, max: 784, step: 1, value: S.din, fmt: function (v) { return v; }, onInput: function (v) { S.din = v; update(); } });
  sH = ui.slider({ label: "h (neuronas ocultas)", min: 1, max: 256, step: 1, value: S.h, fmt: function (v) { return v; }, onInput: function (v) { S.h = v; update(); } });
  sOut = ui.slider({ label: "d_out (neuronas de salida)", min: 1, max: 20, step: 1, value: S.dout, fmt: function (v) { return v; }, onInput: function (v) { S.dout = v; update(); } });
  sN = ui.slider({ label: "N (tamaño del lote)", min: 1, max: 256, step: 1, value: S.n, fmt: function (v) { return v; }, onInput: function (v) { S.n = v; update(); } });
  PRESETS.forEach(function (p) {
    ui.button(p[0], function () { S.din = p[1]; S.h = p[2]; S.dout = p[3]; S.n = p[4]; sIn.set(p[1], true); sH.set(p[2], true); sOut.set(p[3], true); sN.set(p[4], true); update(); });
  });

  function fmtN(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  function parts() {
    return [
      { k: "W1", n: S.h * S.din, t: "W1 " + S.h + "×" + S.din },
      { k: "b1", n: S.h, t: "b1" },
      { k: "W2", n: S.dout * S.h, t: "W2 " + S.dout + "×" + S.h },
      { k: "b2", n: S.dout, t: "b2" }
    ];
  }
  view.draw(function (ctx, w, h, C) {
    var P = parts(), tot = P.reduce(function (s, q) { return s + q.n; }, 0), x = 10, bw = w - 20, y = 34, bh = 34;
    var fills = [C.cobalto, C.cobaltoWash, C.terracota, C.terracotaWash];
    D.text(ctx, "Cada color es un tensor de parámetros; el ancho es proporcional a cuántos números tiene", w / 2, 18, { size: 11, align: "center", color: C.muted });
    P.forEach(function (q, i) {
      var pw = bw * q.n / tot;
      D.rect(ctx, x, y, Math.max(pw, 1.5), bh, fills[i], C.ink, 1);
      q.x = x; q.w = pw; x += pw;
    });
    // etiquetas debajo, alternando alturas para que no se pisen
    var lastEnd = -100, row = 0;
    P.forEach(function (q, i) {
      var label = q.t + " = " + fmtN(q.n), cx = q.x + q.w / 2;
      ctx.save(); ctx.font = "500 10.5px 'IBM Plex Mono',monospace"; var tw = ctx.measureText(label).width; ctx.restore();
      var left = Math.max(4, Math.min(w - tw - 4, cx - tw / 2));
      if (left < lastEnd + 6) row = (row + 1) % 3; else row = 0;
      lastEnd = left + tw;
      var yy = y + bh + 16 + row * 15;
      D.line(ctx, cx, y + bh, cx, yy - 10, C.muted, 1);
      D.text(ctx, label, left, yy, { size: 10.5, mono: true, weight: 500, color: i < 2 ? C.cobaltoInk : C.terracotaInk });
    });
  });

  function update() {
    var P = parts(), tot = P.reduce(function (s, q) { return s + q.n; }, 0);
    out.set(
      "x: <b>(" + S.n + ", " + S.din + ")</b> → linear1 (weight <b>(" + S.h + ", " + S.din + ")</b>, bias <b>(" + S.h + ",)</b>) → z1, h: <b>(" + S.n + ", " + S.h + ")</b><br>" +
      "h → linear2 (weight <b>(" + S.dout + ", " + S.h + ")</b>, bias <b>(" + S.dout + ",)</b>) → salida: <b>(" + S.n + ", " + S.dout + ")</b><br>" +
      "parámetros = " + S.din + "·" + S.h + " + " + S.h + " + " + S.h + "·" + S.dout + " + " + S.dout + " = <b>" + fmtN(tot) + "</b><br>" +
      "capa 1: <b>" + fmtN(P[0].n + P[1].n) + "</b> · capa 2: <b>" + fmtN(P[2].n + P[3].n) + "</b>" +
      "<br>Si metes un lote con " + (S.din + 1) + " columnas: <span class='bad'>RuntimeError: mat1 and mat2 shapes cannot be multiplied (" + S.n + "x" + (S.din + 1) + " and " + S.din + "x" + S.h + ")</span>");
    view.redraw();
  }
  update();
});
