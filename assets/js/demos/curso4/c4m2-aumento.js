/* Experimento: aumento de datos aleatorio. Un dígito 8x8 guardado NO cambia; cada vez que se pide (cada época) se le aplica
   un volteo, un giro y un desplazamiento sorteados. Calcula de verdad con interpolación bilineal. */
Lab.register("curso4/c4m2-aumento", function (root, api) {
  var D = api.d, M = api.math;
  var DIG = {
    "3": [[0,0,7,15,13,1,0,0],[0,8,13,6,15,4,0,0],[0,2,1,13,13,0,0,0],[0,0,2,15,11,1,0,0],[0,0,0,1,12,12,1,0],[0,0,0,0,1,10,8,0],[0,0,8,4,5,14,9,0],[0,0,7,13,13,9,0,0]],
    "7": [[0,0,7,8,13,16,15,1],[0,0,7,7,4,11,12,0],[0,0,0,0,8,13,1,0],[0,4,8,8,15,15,6,0],[0,2,11,15,15,4,0,0],[0,0,0,16,5,0,0,0],[0,0,9,15,1,0,0,0],[0,0,13,5,0,0,0,0]],
    "9": [[0,0,11,12,0,0,0,0],[0,2,16,16,16,13,0,0],[0,3,16,12,10,14,0,0],[0,1,16,1,12,15,0,0],[0,0,13,16,9,15,2,0],[0,0,0,3,0,9,11,0],[0,0,0,0,9,15,4,0],[0,0,9,12,13,3,0,0]]
  };
  var S = { dig: "7", p: 0.5, rot: 15, pad: 1, seed: 1, list: [], epochs: 0 };

  function sample(img, R, p, rot, pad) {
    var flip = R.next() < p, ang = rot ? R.range(-rot, rot) : 0, dx = pad ? R.int(-pad, pad) : 0, dy = pad ? R.int(-pad, pad) : 0;
    var out = [], r, c, cs = Math.cos(ang * Math.PI / 180), sn = Math.sin(ang * Math.PI / 180), cx = 3.5, cy = 3.5;
    for (r = 0; r < 8; r++) { var row = []; for (c = 0; c < 8; c++) {
      var x = c - dx, y = r - dy;
      var xr = cs * (x - cx) + sn * (y - cy) + cx, yr = -sn * (x - cx) + cs * (y - cy) + cy;
      if (flip) xr = 7 - xr;
      row.push(bil(img, xr, yr));
    } out.push(row); }
    return { px: out, flip: flip, ang: ang, dx: dx, dy: dy };
  }
  function bil(img, x, y) {
    if (x < -0.5 || y < -0.5 || x > 7.5 || y > 7.5) return 0;
    var x0 = Math.floor(x), y0 = Math.floor(y), tx = x - x0, ty = y - y0;
    function g(yy, xx) { return (yy < 0 || xx < 0 || yy > 7 || xx > 7) ? 0 : img[yy][xx]; }
    return (g(y0, x0) * (1 - tx) + g(y0, x0 + 1) * tx) * (1 - ty) + (g(y0 + 1, x0) * (1 - tx) + g(y0 + 1, x0 + 1) * tx) * ty;
  }
  var view = api.view(root, { aspect: 4.0, minH: 150, maxH: 190, label: "El dígito original y sus versiones aumentadas, una por época" });
  var ui = api.controls(root), out = api.readout(root);
  var R = api.rng(S.seed);
  ui.select({ label: "Dígito guardado", options: [["3", "un 3"], ["7", "un 7"], ["9", "un 9"]], value: S.dig, onChange: function (v) { S.dig = v; reset(); } });
  ui.slider({ label: "RandomHorizontalFlip p", min: 0, max: 1, step: 0.05, value: S.p, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.p = v; reset(); } });
  ui.slider({ label: "RandomRotation (± grados)", min: 0, max: 45, step: 1, value: S.rot, onInput: function (v) { S.rot = v; reset(); } });
  ui.slider({ label: "desplazamiento máx. (píxeles)", min: 0, max: 2, step: 1, value: S.pad, onInput: function (v) { S.pad = v; reset(); } });
  ui.button("Otra época (volver a pedir ds[0])", function () { add(1); }, "primary");
  ui.button("Cinco épocas", function () { add(5); });

  function reset() { R = api.rng(S.seed); S.list = []; S.epochs = 0; add(6); }
  function add(n) {
    for (var k = 0; k < n; k++) { S.list.push(sample(DIG[S.dig], R, S.p, S.rot, S.pad)); S.epochs++; }
    if (S.list.length > 12) S.list = S.list.slice(S.list.length - 12);
    update();
  }
  function paint(ctx, px, x0, y0, size, C, mx) {
    var cell = size / 8, r, c;
    for (r = 0; r < 8; r++) for (c = 0; c < 8; c++) { ctx.fillStyle = C.ink; ctx.globalAlpha = M.clamp(px[r][c] / mx, 0, 1); ctx.fillRect(x0 + c * cell, y0 + r * cell, cell + 0.5, cell + 0.5); }
    ctx.globalAlpha = 1; D.rect(ctx, x0, y0, size, size, null, C.line, 1);
  }
  function draw(ctx, w, h, C) {
    var n = S.list.length, cols = Math.min(n, w < 520 ? 6 : 12), rows = Math.ceil(n / cols) || 1, gap = 6;
    var ow = Math.min(h * 0.55, w * 0.2), bw = (w - ow - 24 - gap * cols) / Math.max(cols, 1);
    var sz = Math.min(bw, (h - 30 - gap * (rows - 1)) / rows);
    D.text(ctx, "guardado", 10 + ow / 2, 12, { size: 10.5, color: C.muted, align: "center" });
    paint(ctx, DIG[S.dig], 10, 20, ow, C, 16);
    D.text(ctx, "ds[0] pedido en cada época →", 10 + ow + 14, 12, { size: 10.5, color: C.muted });
    S.list.forEach(function (it, k) {
      var cc = k % cols, rr = Math.floor(k / cols), x = 10 + ow + 14 + cc * (sz + gap), y = 20 + rr * (sz + gap);
      paint(ctx, it.px, x, y, sz, C, 16);
    });
  }
  view.draw(draw);

  function update() {
    var tail = S.list.slice(-3), lines = tail.map(function (it, k) {
      return "época " + (S.epochs - tail.length + k + 1) + ": volteo <b>" + (it.flip ? "sí" : "no") + "</b>, giro <b>" + it.ang.toFixed(1) + "°</b>, desplazamiento (<b>" + it.dx + "</b>, <b>" + it.dy + "</b>)";
    });
    var flips = S.list.filter(function (it) { return it.flip; }).length;
    out.set("Épocas pedidas: <b>" + S.epochs + "</b> · en las últimas " + S.list.length + ": " + flips + " volteadas y " + (S.list.length - flips) + " sin voltear.<br>" + lines.join("<br>") +
      "<br>La imagen guardada (izquierda) <b>no ha cambiado</b>: la variación se sortea al vuelo en cada llamada a <code>__getitem__</code>." +
      (S.p === 0 && S.rot === 0 && S.pad === 0 ? "<br><span class='bad'>Sin ninguna transformación aleatoria, todas las épocas son idénticas.</span>" : ""));
    view.redraw();
  }
  reset();
});
