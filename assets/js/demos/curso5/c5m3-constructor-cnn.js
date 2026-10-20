/* Experimento: «torchsummary a mano». Construyes una red capa a capa (nn.Conv2d, nn.MaxPool2d, nn.BatchNorm2d, nn.Flatten, nn.Linear…)
   y la herramienta calcula la forma (N, C, H, W) de cada capa, sus parámetros y sus multiplicaciones, y escribe el código de PyTorch. */
(function () {
  var INPUTS = {
    d8: [1, 8, 8, "1×8×8 (dígitos de scikit-learn)"],
    d16: [1, 16, 16, "1×16×16 (dígitos de la CNN del laboratorio)"],
    m28: [1, 28, 28, "1×28×28 (MNIST)"],
    c32: [3, 32, 32, "3×32×32 (color pequeño)"],
    p100: [3, 100, 100, "3×100×100 (foto de papel)"],
    i224: [3, 224, 224, "3×224×224 (ImageNet)"]
  };

  function outSize(n, k, s, p) { return Math.floor((n + 2 * p - k) / s) + 1; }

  /* aplica las capas una a una; devuelve filas {code, shape, params, macs, err} */
  function analyze(inp, layers) {
    var cur = { dim: 4, C: inp[0], H: inp[1], W: inp[2] }, rows = [], dead = false;
    layers.forEach(function (L) {
      var row = { code: "", shape: "", params: 0, macs: 0, err: null };
      if (dead) { row.code = describe(L, cur); row.shape = "—"; row.err = "(sin calcular: una capa anterior falla)"; row.skipped = true; rows.push(row); return; }
      var nxt = { dim: cur.dim, C: cur.C, H: cur.H, W: cur.W, F: cur.F };
      row.code = describe(L, cur);
      if (L.t === "conv") {
        if (cur.dim !== 4) row.err = "nn.Conv2d espera un tensor 4D (N, C, H, W) y aquí ya es 2D (N, F).";
        else {
          var same = L.p === "same", pad = same ? Math.floor((L.k - 1) / 2) : L.p, h2 = same ? cur.H : outSize(cur.H, L.k, L.s, pad), w2 = same ? cur.W : outSize(cur.W, L.k, L.s, pad);
          if (same && L.s !== 1) row.err = "padding='same' no admite stride > 1 (ValueError).";
          if (!row.err) {
            if (h2 < 1 || w2 < 1) row.err = "el kernel de " + L.k + "×" + L.k + " no cabe en el mapa de " + cur.H + "×" + cur.W + " (con padding " + pad + ").";
            else {
              row.params = (L.k * L.k * cur.C + (L.bias ? 1 : 0)) * L.out;
              row.macs = L.out * h2 * w2 * L.k * L.k * cur.C;
              nxt.C = L.out; nxt.H = h2; nxt.W = w2;
            }
          }
        }
      } else if (L.t === "pool") {
        if (cur.dim !== 4) row.err = "el pooling 2D espera un tensor 4D.";
        else {
          var st = L.s || L.k, h3 = outSize(cur.H, L.k, st, 0), w3 = outSize(cur.W, L.k, st, 0);
          if (h3 < 1 || w3 < 1) row.err = "Output size is too small: la ventana de " + L.k + " no cabe en " + cur.H + "×" + cur.W + ".";
          else { nxt.H = h3; nxt.W = w3; }
        }
      } else if (L.t === "bn") {
        if (cur.dim === 4) row.params = 2 * cur.C; else row.params = 2 * cur.F;
      } else if (L.t === "gap") {
        if (cur.dim !== 4) row.err = "AdaptiveAvgPool2d espera un tensor 4D.";
        else { nxt.H = 1; nxt.W = 1; }
      } else if (L.t === "flat") {
        if (cur.dim === 4) { nxt.dim = 2; nxt.F = cur.C * cur.H * cur.W; }
      } else if (L.t === "lin") {
        if (cur.dim === 4) row.err = "nn.Linear espera (N, F): falta un nn.Flatten() antes (Linear actuaría sobre la última dimensión, W).";
        else { row.params = cur.F * L.out + L.out; row.macs = cur.F * L.out; nxt.F = L.out; }
      }
      if (row.err) dead = true;
      else { cur = nxt; }
      row.shape = row.err ? "ERROR" : shapeStr(cur);
      rows.push(row);
    });
    return { rows: rows, start: { dim: 4, C: inp[0], H: inp[1], W: inp[2] }, end: cur, ok: !dead };
  }
  function shapeStr(s) { return s.dim === 4 ? "(N, " + s.C + ", " + s.H + ", " + s.W + ")" : "(N, " + s.F + ")"; }
  function describe(L, cur) {
    if (L.t === "conv") return "nn.Conv2d(" + (cur && cur.dim === 4 ? cur.C : "?") + ", " + L.out + ", kernel_size=" + L.k + (L.s !== 1 ? ", stride=" + L.s : "") + (L.p ? ", padding=" + (L.p === "same" ? "'same'" : L.p) : "") + (L.bias ? "" : ", bias=False") + ")";
    if (L.t === "pool") return "nn.MaxPool2d(" + L.k + (L.s && L.s !== L.k ? ", stride=" + L.s : "") + ")";
    if (L.t === "bn") return cur && cur.dim === 4 ? "nn.BatchNorm2d(" + cur.C + ")" : "nn.BatchNorm1d(" + (cur ? cur.F : "?") + ")";
    if (L.t === "relu") return "nn.ReLU()";
    if (L.t === "drop") return "nn.Dropout(0.5)";
    if (L.t === "gap") return "nn.AdaptiveAvgPool2d(1)";
    if (L.t === "flat") return "nn.Flatten()";
    if (L.t === "lin") return "nn.Linear(" + (cur && cur.dim === 2 ? cur.F : "?") + ", " + L.out + ")";
    return "?";
  }
  function conv(out, k, s, p, bias) { return { t: "conv", out: out, k: k, s: s || 1, p: p || 0, bias: bias !== false }; }
  function pool(k) { return { t: "pool", k: k, s: 0 }; }
  var PRESETS = {
    lab: { inp: "d16", layers: [conv(16, 5, 1, 2), { t: "relu" }, pool(2), conv(32, 5, 1, 2), { t: "relu" }, pool(2), { t: "flat" }, { t: "lin", out: 10 }] },
    dig: { inp: "d8", layers: [conv(8, 3, 1, 1), { t: "relu" }, pool(2), conv(16, 3, 1, 1), { t: "relu" }, pool(2), { t: "flat" }, { t: "lin", out: 10 }] },
    papel: { inp: "p100", layers: [conv(16, 3), { t: "relu" }, pool(2), conv(32, 3), { t: "relu" }, pool(2), { t: "flat" }, { t: "lin", out: 100 }, { t: "relu" }, { t: "lin", out: 3 }] },
    bn: { inp: "d16", layers: [conv(16, 5, 1, 2), { t: "bn" }, { t: "relu" }, pool(2), conv(32, 5, 1, 2), { t: "bn" }, { t: "relu" }, pool(2), { t: "flat" }, { t: "lin", out: 10 }, { t: "bn" }] }
  };
  var core = { analyze: analyze, PRESETS: PRESETS, INPUTS: INPUTS, outSize: outSize };
  if (typeof module !== "undefined" && module.exports) module.exports = core;
  if (typeof Lab === "undefined") return;

  Lab.register("curso5/c5m3-constructor-cnn", function (root, api) {
    var D = api.d;
    var S = { inp: "d16", layers: [] };
    function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
    function clone(a) { return a.map(function (o) { return Object.assign({}, o); }); }

    var view = api.view(root, { aspect: 1.9, minH: 190, maxH: 300, label: "Parámetros y multiplicaciones de cada capa de la red" });
    var tb = api.table(root, ["#", "<span style='display:block;text-align:left'>capa</span>", "forma", "param.", "mult."]);
    if (window.matchMedia && window.matchMedia("(max-width:520px)").matches) tb.el.querySelector("table").style.fontSize = ".64rem";
    var ui = api.controls(root), out = api.readout(root);
    var selIn = ui.select({ label: "Imagen de entrada (N, C, H, W)", value: S.inp, options: Object.keys(INPUTS).map(function (k) { return [k, INPUTS[k][3]]; }), onChange: function (v) { S.inp = v; update(); } });
    var selT = ui.select({ label: "Capa a añadir", value: "conv", options: [["conv", "nn.Conv2d"], ["pool", "nn.MaxPool2d"], ["bn", "nn.BatchNorm (2d o 1d)"], ["relu", "nn.ReLU"], ["drop", "nn.Dropout"], ["gap", "nn.AdaptiveAvgPool2d(1)"], ["flat", "nn.Flatten"], ["lin", "nn.Linear"]] });
    var selO = ui.select({ label: "Conv2d: out_channels", value: 16, options: [[4, "4"], [8, "8"], [16, "16"], [32, "32"], [64, "64"]] });
    var selK = ui.select({ label: "Conv2d / MaxPool2d: kernel", value: 3, options: [[1, "1"], [2, "2"], [3, "3"], [5, "5"], [7, "7"]] });
    var selS = ui.select({ label: "Conv2d: stride", value: 1, options: [[1, "1"], [2, "2"]] });
    var selP = ui.select({ label: "Conv2d: padding", value: 0, options: [[0, "0"], [1, "1"], [2, "2"], [3, "3"], ["same", "'same'"]] });
    var selB = ui.select({ label: "Conv2d: bias", value: "1", options: [["1", "True (por defecto)"], ["0", "False"]] });
    var selL = ui.select({ label: "Linear: out_features", value: 10, options: [[3, "3"], [10, "10"], [64, "64"], [100, "100"], [256, "256"]] });
    ui.button("Añadir capa", function () {
      var t = selT.get(), L;
      if (t === "conv") L = conv(+selO.get(), +selK.get(), +selS.get(), selP.get() === "same" ? "same" : +selP.get(), selB.get() === "1");
      else if (t === "pool") L = pool(Math.min(+selK.get(), 3) || 2);
      else if (t === "lin") L = { t: "lin", out: +selL.get() };
      else L = { t: t };
      S.layers.push(L); update();
    }, "primary");
    ui.button("Quitar la última", function () { S.layers.pop(); update(); });
    ui.button("Vaciar", function () { S.layers = []; update(); });
    ui.button("CNN del laboratorio", function () { load("lab"); });
    ui.button("CNN dígitos 8×8", function () { load("dig"); });
    ui.button("Red de papel 100×100×3", function () { load("papel"); });
    ui.button("Laboratorio + BatchNorm", function () { load("bn"); });
    function load(k) { S.inp = PRESETS[k].inp; selIn.set(S.inp); S.layers = clone(PRESETS[k].layers); update(); }

    function draw(ctx, w, h, C) {
      var res = analyze(INPUTS[S.inp], S.layers), rows = res.rows, n = rows.length;
      if (!n) { D.text(ctx, "Añade capas o carga un ejemplo", w / 2, h / 2, { size: 13, align: "center", color: C.muted }); return; }
      var mp = 0, mm = 0; rows.forEach(function (r) { mp = Math.max(mp, r.params); mm = Math.max(mm, r.macs); });
      var labW = Math.min(150, w * 0.4), top = 20, rh = Math.min(22, (h - top - 6) / n), bx = labW + 6, bw = w - bx - 8;
      D.text(ctx, "azul: parámetros · naranja: multiplicaciones (cada barra respecto a su máximo)", 4, 11, { size: 10, color: C.muted });
      rows.forEach(function (r, i) {
        var y = top + i * rh, short = r.code.replace("nn.", "").replace("kernel_size=", "k=");
        if (short.length > 23 && labW < 170) short = short.slice(0, 22) + "…";
        D.text(ctx, short, 4, y + rh * 0.62, { size: Math.min(11, rh * 0.55), mono: true, color: r.err ? C.terracotaInk : C.ink2 });
        if (r.err) { D.text(ctx, "ERROR", bx, y + rh * 0.62, { size: 11, mono: true, weight: 700, color: C.terracotaInk }); return; }
        var bh = rh * 0.36;
        if (mp) D.rect(ctx, bx, y + rh * 0.1, Math.max(r.params ? 2 : 0, bw * r.params / mp), bh, C.cobalto, null);
        if (mm) D.rect(ctx, bx, y + rh * 0.1 + bh + 1, Math.max(r.macs ? 2 : 0, bw * r.macs / mm), bh, C.terracota, null);
      });
    }
    view.draw(draw);

    function update() {
      var res = analyze(INPUTS[S.inp], S.layers), rows = res.rows, tp = 0, tm = 0, i, errRow = null;
      var trs = [["0", "<span style='display:block;text-align:left'>entrada</span>", "<span style='white-space:nowrap'>" + shapeStr(res.start) + "</span>", "0", "0"]];
      rows.forEach(function (r, i) {
        tp += r.params; tm += r.macs; if (r.err && !errRow) errRow = { i: i + 1, msg: r.err };
        trs.push([String(i + 1), "<span style='display:block;text-align:left;overflow-wrap:anywhere'><code style='white-space:normal'>" + r.code.replace(/^nn\./, "").replace("kernel_size=", "k=") + "</code></span>", r.err ? "<span class='bad'>ERROR</span>" : "<span style='white-space:nowrap'>" + r.shape + "</span>", fmt(r.params), fmt(r.macs)]);
      });
      trs.push(["", "<span style='display:block;text-align:left'><b>Total</b></span>", "", "<b>" + fmt(tp) + "</b>", "<b>" + fmt(tm) + "</b>"]);
      tb.set(trs);
      var t = rows.length ? "Parámetros entrenables: <b>" + fmt(tp) + "</b> (" + fmt(tp * 4) + " bytes en float32) · multiplicaciones por imagen: <b>" + fmt(tm) + "</b>" : "Red vacía: añade una <code>nn.Conv2d</code> para empezar.";
      if (errRow) t += "<br><span class='bad'>Capa " + errRow.i + ": " + errRow.msg + "</span>";
      else if (rows.length) {
        var lin = rows.filter(function (r) { return /Linear/.test(r.code); }), big = 0, who = "";
        rows.forEach(function (r) { if (r.params > big) { big = r.params; who = r.code; } });
        if (tp && big / tp > 0.5) t += "<br>La capa que más pesa es <code>" + who + "</code>: <b>" + (100 * big / tp).toFixed(big / tp > 0.99 ? 1 : 0) + " %</b> de los parámetros.";
      }
      out.set(t); view.redraw();
    }
    load("lab");
  });
})();
