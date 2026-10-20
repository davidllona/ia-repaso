/* Experimento: ¿qué hace nn.Conv2d con el tensor que le das? Lee las dimensiones POR POSICIÓN: (N, C, H, W) o, sin lote, (C, H, W).
   Elige una forma de entrada y los in_channels de la capa y mira cómo la interpreta o por qué falla (mensajes reales de PyTorch 2.x). */
(function () {
  var SHAPES = {
    a: [[8, 8], "(8, 8): una imagen suelta"],
    b: [[1, 8, 8], "(1, 8, 8): una imagen con canal, sin lote"],
    c: [[5, 8, 8], "(5, 8, 8): lote de 5 sin canal"],
    d: [[5, 1, 8, 8], "(5, 1, 8, 8): lote NCHW de grises"],
    e: [[5, 8, 8, 1], "(5, 8, 8, 1): lote NHWC de grises (estilo Keras)"],
    f: [[5, 3, 8, 8], "(5, 3, 8, 8): lote NCHW en color"],
    g: [[5, 8, 8, 3], "(5, 8, 8, 3): lote NHWC en color (estilo Keras)"]
  };
  var OUTC = 8, K = 3;

  /* devuelve {ok, shape, msg, roles, fix} */
  function evaluate(shape, inC, dtype) {
    var nd = shape.length, roles, r = { ok: false, shape: null, msg: "", roles: null, fix: "" };
    if (dtype === "uint8") {
      r.msg = "RuntimeError: Input type (unsigned char) and bias type (float) should be the same";
      r.fix = "x.float() / 255 (o ToTensor(), que convierte y divide)";
      r.roles = nd === 4 ? ["N", "C", "H", "W"] : nd === 3 ? ["C", "H", "W"] : shape.map(function () { return "?"; });
      return r;
    }
    if (nd < 3 || nd > 4) {
      r.roles = shape.map(function () { return "?"; });
      r.msg = "RuntimeError: Expected 3D (unbatched) or 4D (batched) input to conv2d, but got input of size: [" + shape.join(", ") + "]";
      r.fix = "x.unsqueeze(0).unsqueeze(0) para añadir lote y canal, o x[None, None]";
      return r;
    }
    roles = nd === 4 ? ["N", "C", "H", "W"] : ["C", "H", "W"];
    r.roles = roles;
    var ci = nd === 4 ? 1 : 0, C = shape[ci], H = shape[ci + 1], W = shape[ci + 2];
    if (C !== inC) {
      var shown = nd === 3 ? [1].concat(shape) : shape;
      r.msg = "RuntimeError: Given groups=1, weight of size [" + OUTC + ", " + inC + ", " + K + ", " + K + "], expected input[" + shown.join(", ") + "] to have " + inC + " channels, but got " + C + " channels instead";
      if (nd === 4 && shape[3] === inC) r.fix = "x.permute(0, 3, 1, 2): pasa de NHWC a NCHW";
      else if (nd === 3) r.fix = "x.unsqueeze(1): añade la dimensión de canal → (" + shape[0] + ", 1, " + shape[1] + ", " + shape[2] + ")";
      else r.fix = "usa in_channels=" + C + " o revisa el orden de las dimensiones";
      return r;
    }
    r.ok = true;
    r.shape = nd === 4 ? [shape[0], OUTC, H - K + 1, W - K + 1] : [OUTC, H - K + 1, W - K + 1];
    r.fix = nd === 3 ? "Ojo: la salida no tiene dimensión de lote porque la entrada tampoco la tenía (x.unsqueeze(0) si la querías)" : "";
    return r;
  }
  var core = { evaluate: evaluate, SHAPES: SHAPES };
  if (typeof module !== "undefined" && module.exports) module.exports = core;
  if (typeof Lab === "undefined") return;

  Lab.register("curso5/c5m3-forma-entrada", function (root, api) {
    var D = api.d, S = { sh: "e", inC: 1, dt: "float32" };
    var view = api.view(root, { aspect: 2.3, minH: 150, maxH: 200, label: "Las dimensiones del tensor y el papel que les asigna nn.Conv2d" });
    var ui = api.controls(root), out = api.readout(root);
    ui.select({ label: "Tu tensor", value: S.sh, options: Object.keys(SHAPES).map(function (k) { return [k, SHAPES[k][1]]; }), onChange: function (v) { S.sh = v; update(); } });
    ui.segmented({ label: "in_channels de la capa", value: S.inC, options: [[1, "nn.Conv2d(1, 8, 3)"], [3, "nn.Conv2d(3, 8, 3)"]], onChange: function (v) { S.inC = +v; update(); } });
    ui.segmented({ label: "dtype", value: S.dt, options: [["float32", "float32"], ["uint8", "uint8 (0–255)"]], onChange: function (v) { S.dt = v; update(); } });

    function draw(ctx, w, h, C) {
      var shape = SHAPES[S.sh][0], r = evaluate(shape, S.inC, S.dt), n = shape.length, cw = Math.min(70, (w - 24) / n - 8), x0 = (w - n * (cw + 8) + 8) / 2, y = 36, i;
      D.text(ctx, "tu tensor", w / 2, 16, { size: 11, align: "center", weight: 600, color: C.ink2 });
      var ci = n === 4 ? 1 : n === 3 ? 0 : -1;
      for (i = 0; i < n; i++) {
        var x = x0 + i * (cw + 8), isC = i === ci, bad = isC && shape[i] !== S.inC;
        D.rect(ctx, x, y, cw, 36, isC ? (bad ? C.terracotaWash : C.olivaWash) : C.surface, isC ? (bad ? C.terracota : C.oliva) : C.line, isC ? 2.5 : 1);
        D.text(ctx, String(shape[i]), x + cw / 2, y + 24, { size: 16, mono: true, weight: 700, align: "center", color: C.ink });
        D.text(ctx, r.roles[i], x + cw / 2, y + 56, { size: 13, mono: true, weight: 700, align: "center", color: r.roles[i] === "?" ? C.muted : (isC ? (bad ? C.terracotaInk : C.olivaInk) : C.ink2) });
      }
      D.text(ctx, "así lo lee Conv2d (por posición)", w / 2, y + 78, { size: 10.5, align: "center", color: C.muted });
      D.text(ctx, "pide in_channels = " + S.inC + (ci >= 0 ? " en la dimensión " + ci : ""), w / 2, y + 96, { size: 11, align: "center", color: C.ink2 });
    }
    view.draw(draw);

    function update() {
      var shape = SHAPES[S.sh][0], r = evaluate(shape, S.inC, S.dt), t;
      if (r.ok) t = "<span class='good'><b>Funciona.</b></span> Salida: <b>(" + r.shape.join(", ") + ")</b> con kernel 3 sin padding (cada lado pierde 2).";
      else t = "<span class='bad'>" + r.msg + "</span>";
      if (r.fix) t += "<br><b>Arreglo:</b> <code>" + r.fix + "</code>";
      out.set(t); view.redraw();
    }
    update();
  });
})();
