/* Experimento: pasos por época. Cada punto es una película. Al pulsar «Una época», se barajan y se
   recorren lote a lote: cada lote es un paso (una corrección de los parámetros). Con lote 1 es SGD;
   con lote = todas, batch. */
Lab.register("curso1/c1m2-epocas", function (root, api) {
  var n = 60, lote = 8, orden = [], k = -1, t = 0, loop = null, seed = 3;
  var view = api.view(root, { aspect: 1.7, minH: 220, maxH: 340, label: "Una cuadrícula de películas que se recorre por lotes; el lote actual se ilumina y se cuentan los pasos de la época" });
  var ui = api.controls(root), out = api.readout(root);
  var sn = ui.slider({ label: "Películas", min: 10, max: 100, step: 1, value: n, fmt: function (v) { return v.toFixed(0); },
    onInput: function (v) { n = v; if (lote > n) { lote = n; sl.set(lote, true); } reset(); } });
  var sl = ui.slider({ label: "Tamaño del lote", min: 1, max: 100, step: 1, value: lote,
    fmt: function (v) { return v.toFixed(0) + (v === 1 ? " (SGD)" : v >= n ? " (batch)" : ""); },
    onInput: function (v) { lote = Math.min(v, n); reset(); } });
  ui.button("▶ Una época", function () { epoca(); }, "primary");

  function pasos() { return Math.ceil(n / lote); }
  function reset() {
    if (loop) loop.stop();
    var r = api.rng(seed); orden = r.shuffle(Array.from({ length: n }, function (_, i) { return i; }));
    k = -1; update();
  }
  function epoca() {
    seed++; reset();
    var K = pasos(), dur = Math.min(6, Math.max(1.2, K * 0.25)), per = dur / K;
    if (api.reduceMotion) { k = K - 1; update(); return; }
    t = 0; k = 0; update();
    loop = api.loop(function (dt) {
      t += dt; var nk = Math.min(K - 1, Math.floor(t / per));
      if (nk !== k) { k = nk; update(); }
      return t < dur;
    });
    loop.start();
  }
  function draw(ctx, w, h, C) {
    var D = api.d, cols = w < 430 ? 10 : 20, rows = Math.ceil(n / cols);
    var pad = 14, cw = (w - 2 * pad) / cols, ch = Math.min(cw, (h - 2 * pad) / Math.max(rows, 1));
    var r = Math.max(3, Math.min(cw, ch) * 0.32), y0 = (h - rows * ch) / 2;
    var pos = {}; orden.forEach(function (id, j) { pos[id] = j; });
    for (var i = 0; i < n; i++) {
      var cx = pad + (i % cols + 0.5) * cw, cy = y0 + (Math.floor(i / cols) + 0.5) * ch;
      var b = Math.floor(pos[i] / lote);
      if (k >= 0 && b === k) D.circle(ctx, cx, cy, r * 1.25, C.terracota);
      else if (k >= 0 && b < k) D.circle(ctx, cx, cy, r, C.cobalto);
      else D.circle(ctx, cx, cy, r, null, C.muted, 1.5);
    }
  }
  function update() {
    view.redraw();
    var K = pasos(), resto = n % lote;
    var txt = n + " películas / lote de " + lote + " = " + (n / lote).toFixed(2).replace(".", ",") + " → <b>" + K + " paso" + (K > 1 ? "s" : "") + " por época</b>";
    if (resto && lote > 1) txt += " (" + Math.floor(n / lote) + " lotes completos y uno último de " + resto + ")";
    txt += "<br>";
    if (k < 0) txt += "Pulsa «Una época»: en cada paso, el lote naranja calcula el gradiente y corrige los parámetros.";
    else txt += "Paso <b>" + (k + 1) + " de " + K + "</b>. " + (k === K - 1 ? "<span class='good'>Época terminada: las " + n + " películas leídas una vez.</span>" : "Azules: ya leídas en esta época.");
    out.set(txt);
  }
  view.draw(draw); reset();
  return { destroy: function () { if (loop) loop.stop(); } };
});
