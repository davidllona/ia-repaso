/* Experimento: batch, step y epoch con un generador de carpetas. 300 imágenes y batch_size 32 → 10 steps (el último con 12). shuffle=False deja batches de una sola clase. */
Lab.register("curso2/c2m5-batches", function (root, api) {
  var N = 300, B = 32, EP = 5, shuffle = true, step = 1, loop, playing = false;
  var view = api.view(root, { aspect: 1.7, minH: 250, maxH: 380, label: "Imágenes del conjunto de entrenamiento agrupadas en batches" });
  api.legend(root, [[api.colors().terracota, "crack (carpeta 0)"], [api.colors().cobalto, "dent (carpeta 1)"]]);
  var ui = api.controls(root), out = api.readout(root), sl, playBtn;
  function stepsPE() { return Math.ceil(N / B); }
  function total() { return stepsPE() * EP; }
  function order(epoch) {
    var idx = []; for (var i = 0; i < N; i++) idx.push(i);
    return shuffle ? api.rng(100 + epoch).shuffle(idx) : idx;
  }
  function cur() { var s = step - 1, spe = stepsPE(), ep = Math.floor(s / spe), k = s % spe, ord = order(ep); return { ep: ep, k: k, ord: ord, ids: ord.slice(k * B, Math.min(N, (k + 1) * B)) }; }
  function isDent(id) { return id >= N / 2; }
  ui.slider({ label: "Imágenes en train", min: 100, max: 600, step: 50, value: N, fmt: function (v) { return v; }, onInput: function (v) { N = v; fix(); update(); } });
  ui.segmented({ label: "batch_size", options: [[16, "16"], [32, "32"], [64, "64"]], value: B, onChange: function (v) { B = v; fix(); update(); } });
  ui.segmented({ label: "shuffle", options: [[true, "True"], [false, "False"]], value: shuffle, onChange: function (v) { shuffle = v; update(); } });
  sl = ui.slider({ label: "Paso (step) actual", min: 1, max: total(), step: 1, value: 1, fmt: function (v) { return v + " de " + total(); }, onInput: function (v) { step = v; update(); } });
  playBtn = ui.button("Reproducir", function () { if (playing) loop.stop(); else start(); });
  loop = api.loop(function () { if (step >= total()) return false; step++; sl.set(step, true); update(); return true; }, { fps: 3, onState: function (s) { playing = s; playBtn.textContent = s ? "Pausa" : "Reproducir"; } });
  function start() { if (api.reduceMotion) { step = total(); sl.set(step, true); update(); return; } if (step >= total()) { step = 1; sl.set(1, true); } loop.start(); }
  function fix() { sl.input.max = total(); if (step > total()) step = total(); sl.set(step, true); }
  view.draw(function (ctx, w, h, C) {
    var c = cur(), cols = Math.ceil(Math.sqrt(N * (w - 20) / (h - 20))), cell = Math.min((w - 20) / cols, (h - 20) / Math.ceil(N / cols)), rowsN = Math.ceil(N / cols);
    var x0 = (w - cell * cols) / 2, y0 = (h - cell * rowsN) / 2, inB = {}, k;
    c.ids.forEach(function (id) { inB[id] = true; });
    /* posición de cada imagen: por orden de la época (tras mezclar, las posiciones están en orden de lectura) */
    for (k = 0; k < N; k++) {
      var id = c.ord[k], x = x0 + (k % cols) * cell, y = y0 + Math.floor(k / cols) * cell, used = Math.floor(k / B) <= c.k;
      ctx.save(); ctx.globalAlpha = Math.floor(k / B) === c.k ? 1 : (used ? 0.35 : 0.14);
      api.d.rect(ctx, x + 1, y + 1, cell - 2, cell - 2, isDent(id) ? C.cobalto : C.terracota);
      ctx.restore();
    }
    var a = c.k * B, b = Math.min(N, (c.k + 1) * B);
    for (k = a; k < b; k++) { var xx = x0 + (k % cols) * cell, yy = y0 + Math.floor(k / cols) * cell; api.d.rect(ctx, xx, yy, cell, cell, null, C.ink, 1.5); }
  });
  function update() {
    view.redraw();
    var c = cur(), nd = c.ids.filter(isDent).length, spe = stepsPE(), last = N - (spe - 1) * B;
    out.set("<b>" + N + "</b> imágenes / batch_size <b>" + B + "</b> = " + (N / B).toFixed(3).replace(".", ",") + " → <b>" + spe + "</b> steps por época (el último con <b>" + last + "</b> imágenes) · épocas: " + EP + " → <b>" + total() + "</b> steps en total<br>" +
      "Época <b>" + (c.ep + 1) + "/" + EP + "</b> · step <b>" + (c.k + 1) + "/" + spe + "</b> (lo que Keras escribe como «" + (c.k + 1) + "/" + spe + "») · este batch trae <b>" + c.ids.length + "</b> imágenes: <span style='color:var(--terracota-ink)'>" + (c.ids.length - nd) + " crack</span> y <span style='color:var(--cobalto-ink)'>" + nd + " dent</span>" +
      (!shuffle && (nd === 0 || nd === c.ids.length) ? "<br><span class='bad'>Con shuffle=False este batch es de una sola clase: la red solo ve «" + (nd ? "dent" : "crack") + "» en estos steps. Por eso el generador de train usa shuffle=True.</span>" : ""));
  }
  update();
  return { destroy: function () { loop.stop(); } };
});
