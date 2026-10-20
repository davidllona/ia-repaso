/* Experimento: anatomía de fit(): muestras, lotes (batch), pasos y épocas (epoch). */
Lab.register("curso2/c2m2-anatomia-fit", function (root, api) {
  var st = { N: 1000, batch: 32, epochs: 3, vs: 0 };
  var done = 0, acc = 0, loop;       // done = pasos de pesos ya realizados (en total)

  var view = api.view(root, { aspect: 3.2, minH: 250, maxH: 250, label: "Conjunto de datos dividido en lotes; épocas completadas y paso actual" });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Valoraciones de películas del dataset (N)", min: 50, max: 2000, step: 50, value: st.N, onInput: function (v) { st.N = v; reset(); } });
  ui.select({ label: "batch_size", value: st.batch, options: [[8, "8"], [16, "16"], [32, "32"], [64, "64"], [128, "128"], [256, "256"]], onChange: function (v) { st.batch = +v; reset(); } });
  ui.slider({ label: "epochs", min: 1, max: 10, step: 1, value: st.epochs, onInput: function (v) { st.epochs = v; reset(); } });
  ui.select({ label: "validation_split", value: st.vs, options: [[0, "0 (sin validación)"], [0.1, "0.1"], [0.2, "0.2"], [0.3, "0.3"]], onChange: function (v) { st.vs = +v; reset(); } });
  var bPlay = ui.button("▶ Entrenar (fit)", function () { toggle(); }, "primary");
  ui.button("Un paso", function () { stop(); advance(1); });
  ui.button("Una época", function () { stop(); var s = geom(); advance(s.steps - (done % s.steps)); });

  function geom() {
    var ntr = Math.floor(st.N * (1 - st.vs)), nva = st.N - ntr, steps = Math.ceil(ntr / st.batch);
    return { ntr: ntr, nva: nva, steps: steps, last: ntr - (steps - 1) * st.batch, total: steps * st.epochs };
  }
  function stop() { if (loop && loop.running) loop.stop(); }
  function reset() { stop(); done = 0; acc = 0; update(); }
  function advance(k) { var g = geom(); done = Math.min(g.total, done + k); update(); }
  function toggle() {
    var g = geom();
    if (loop.running) { loop.stop(); return; }
    if (done >= g.total) { done = 0; }
    if (api.reduceMotion) { done = g.total; update(); return; }
    acc = 0; loop.start();
  }
  loop = api.loop(function (dt) {
    var g = geom(); acc += dt * Math.max(6, g.total / 5);
    var k = Math.floor(acc); acc -= k; advance(k);
    if (done >= g.total) return false;
  }, { fps: 30, onState: function (on) { bPlay.textContent = on ? "⏸ Pausa" : "▶ Entrenar (fit)"; } });

  function draw(ctx, w, h, C) {
    var D = api.d, g = geom(), x0 = 14, x1 = w - 14, bw = x1 - x0, barY = 52, barH = 38, i;
    var ep = Math.min(st.epochs - 1, Math.floor(done / g.steps)), stepIn = done >= g.total ? g.steps : done - ep * g.steps;
    var narrow = w < 520;
    D.text(ctx, (narrow ? "" : "dataset: ") + st.N + " valoraciones = " + g.ntr + " entreno" + (g.nva ? " + " + g.nva + " validación" : ""), x0, 18, { size: 12, weight: 600, color: C.ink });
    D.text(ctx, narrow ? "cada bloque = un lote de " + st.batch + " = 1 actualización" : "cada bloque es un lote (batch) de " + st.batch + " valoraciones: pesos actualizados UNA vez", x0, 36, { size: 10.5, color: C.muted });
    var trW = bw * g.ntr / st.N;
    D.rect(ctx, x0, barY, trW, barH, C.surface, null);
    for (i = 0; i < g.steps; i++) {
      var a = x0 + trW * i * st.batch / g.ntr, b = x0 + trW * Math.min(g.ntr, (i + 1) * st.batch) / g.ntr, isLast = i === g.steps - 1 && g.last < st.batch;
      var seen = i < stepIn || done >= g.total;
      var fill = seen ? (isLast ? C.terracotaWash : C.cobaltoWash) : C.surface;
      if (i === stepIn && done < g.total) fill = C.terracota;
      D.rect(ctx, a, barY, Math.max(0.6, b - a), barH, fill, null);
      if (b - a > 4) D.line(ctx, b, barY, b, barY + barH, C.ink, 1);
    }
    D.rect(ctx, x0, barY, trW, barH, null, C.ink, 1.5);
    if (g.nva) {
      D.rect(ctx, x0 + trW, barY, bw - trW, barH, C.line, C.ink, 1.5);
      D.text(ctx, "validación", x0 + trW + (bw - trW) / 2, barY + barH / 2 + 4, { align: "center", size: 10.5, color: C.ink2, weight: 600 });
    }
    // marcador del lote actual
    if (done < g.total) {
      var cx = x0 + trW * (stepIn + 0.5) * st.batch / g.ntr; cx = Math.min(cx, x0 + trW);
      D.arrow(ctx, cx, barY - 8, cx, barY - 1, C.terracota, 2);
      var s1 = stepIn * st.batch + 1, s2 = Math.min(g.ntr, (stepIn + 1) * st.batch);
      var lab = "lote " + (stepIn + 1) + ": valoraciones " + s1 + "–" + s2, tw = lab.length * 6.2;
      D.text(ctx, "", cx, barY - 12, {});
      D.text(ctx, lab, Math.max(x0 + tw / 2, Math.min(w - 14 - tw / 2, cx)), barY + barH + 16, { align: "center", size: 11, color: C.terracotaInk, weight: 600 });
    } else D.text(ctx, "fit() terminado", w / 2, barY + barH + 16, { align: "center", size: 11, color: C.olivaInk, weight: 600 });
    // épocas
    var ey = 142, gap = 6, cw = (bw - gap * (st.epochs - 1)) / st.epochs, e;
    D.text(ctx, narrow ? "épocas (1 época = recorrer todo el entreno)" : "épocas (una época = recorrer el dataset de entrenamiento completo una vez)", x0, ey - 10, { size: 11, weight: 600, color: C.ink });
    for (e = 0; e < st.epochs; e++) {
      var ex = x0 + e * (cw + gap), frac = done >= g.total ? 1 : (e < ep ? 1 : e === ep ? stepIn / g.steps : 0);
      D.rect(ctx, ex, ey, cw, 30, C.surface, null);
      D.rect(ctx, ex, ey, cw * frac, 30, e === ep && done < g.total ? C.terracota : C.oliva, null);
      D.rect(ctx, ex, ey, cw, 30, null, C.ink, 1.5);
      if (cw > 22) D.text(ctx, String(e + 1), ex + cw / 2, ey + 20, { align: "center", size: 12, weight: 600, color: frac > 0.5 ? C.paper : C.ink });
    }
    // contador de actualizaciones
    var py = 214;
    D.text(ctx, "actualizaciones de pesos: " + done + " de " + g.total + (narrow ? "" : "  (= " + st.epochs + " épocas × " + g.steps + " pasos)"), x0, py, { size: 11.5, weight: 600, color: C.ink });
    D.rect(ctx, x0, py + 8, bw, 10, C.surface, C.ink, 1);
    D.rect(ctx, x0, py + 8, bw * done / g.total, 10, C.cobalto, null);
  }
  function update() {
    view.redraw();
    var g = geom(), ep = Math.min(st.epochs, Math.floor(done / g.steps) + 1), stepIn = done >= g.total ? g.steps : done % g.steps;
    var fill = 20, nf = Math.round(fill * stepIn / g.steps), bar = new Array(nf + 1).join("━") + new Array(fill - nf + 1).join("╌");
    var lastTxt = g.last < st.batch ? "El último lote solo tiene <b>" + g.last + "</b> valoraciones (" + g.ntr + " no es múltiplo de " + st.batch + ")." : "Todos los lotes tienen " + st.batch + " valoraciones (" + g.ntr + " es múltiplo de " + st.batch + ").";
    out.set("steps_per_epoch = ceil(" + g.ntr + " / " + st.batch + ") = <b>" + g.steps + "</b> · actualizaciones totales = " + st.epochs + " × " + g.steps + " = <b>" + g.total + "</b><br>" +
      lastTxt + (g.nva ? "<br>validation_split=" + st.vs + " aparta las <b>últimas " + g.nva + "</b> filas (" + g.ntr + " = int(" + st.N + " × " + (1 - st.vs).toFixed(1) + ")): no se mezclan antes." : "") +
      "<br>Epoch " + ep + "/" + st.epochs + "&nbsp; " + stepIn + "/" + g.steps + " " + bar);
  }
  view.draw(draw); update();
  return { destroy: function () { if (loop) loop.stop(); } };
});
