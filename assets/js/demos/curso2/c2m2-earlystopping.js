/* Experimento: sobreajuste por épocas y EarlyStopping (patience, min_delta, restore_best_weights). */
Lab.register("curso2/c2m2-earlystopping", function (root, api) {
  var C2 = window.C2M2, MAXEP = 300;
  var st = { patience: 10, minDelta: 0, restore: true, use: true, seed: 6 };
  var tr, va, net, hist, snaps, shown = 1, loop, res;

  var row = api.el("div", { class: "lab-row" }), cA = api.el("div"), cB = api.el("div");
  row.appendChild(cA); row.appendChild(cB); root.appendChild(row);
  var view = api.view(cA, { aspect: 1.25, minH: 250, maxH: 380, label: "Curvas de loss y val_loss por época con la época de parada de EarlyStopping" });
  var plot = api.plot(view, { xr: [0, MAXEP], yr: [0, 1], xticks: 5, yticks: 4, xlabel: "época (epoch)", ylabel: "loss", xfmt: function (v) { return Math.round(v); }, yfmt: function (v) { return +v.toFixed(2); }, pad: { l: 46, r: 18, t: 10, b: 34 } });
  var view2 = api.view(cB, { aspect: 1.25, minH: 250, maxH: 380, label: "Frontera de decisión del modelo en la época mostrada" });
  var plot2 = api.plot(view2, { xr: [-1.4, 1.4], yr: [-1.3, 1.3], grid: false, xticks: 1, yticks: 1, xfmt: function () { return ""; }, yfmt: function () { return ""; }, pad: { l: 6, r: 6, t: 8, b: 22 } });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "patience (épocas de paciencia)", min: 1, max: 60, step: 1, value: st.patience, onInput: function (v) { st.patience = v; recompute(true); } });
  ui.slider({ label: "min_delta (mejora mínima que cuenta)", min: 0, max: 0.02, step: 0.001, value: st.minDelta, fmt: function (v) { return v.toFixed(3); }, onInput: function (v) { st.minDelta = v; recompute(true); } });
  ui.toggle({ label: "restore_best_weights", value: st.restore, onChange: function (v) { st.restore = v; recompute(false); } });
  ui.toggle({ label: "Usar EarlyStopping", value: st.use, onChange: function (v) { st.use = v; recompute(true); } });
  var sEp = ui.slider({ label: "Época que mira el gráfico de la derecha", min: 1, max: MAXEP, step: 1, value: 1, onInput: function (v) { stopLoop(); shown = v; drawAll(); } });
  var bGo = ui.button("▶ Entrenar", function () { toggle(); }, "primary");
  ui.button("Otros datos", function () { st.seed += 3; train(); recompute(true); }, "warm");

  function train() {
    tr = C2.data.moons(api.rng(60 + st.seed), 40, 0.30); va = C2.data.moons(api.rng(900 + st.seed), 240, 0.30);
    net = new C2.MLP([2, 32, 32, 1], "relu", "sigmoid", "bce", api.rng(5 + st.seed), "adam");
    var rr = api.rng(21 + st.seed); hist = { loss: [], vloss: [], vacc: [] }; snaps = [];
    for (var e = 0; e < MAXEP; e++) {
      hist.loss.push(net.epoch(tr.X, tr.Y, 8, 0.01, rr));
      var v = net.evaluate(va.X, va.Y); hist.vloss.push(v.loss); hist.vacc.push(v.acc); snaps.push(net.getState());
    }
  }
  /* Lógica de EarlyStopping tal como la hace Keras (monitor = val_loss, mode = min). */
  function earlyStopping() {
    var best = Infinity, bestEp = 0, wait = 0, stop = null;
    for (var e = 0; e < MAXEP; e++) {
      var cur = hist.vloss[e]; wait++;
      if (cur - st.minDelta < best) { best = cur; bestEp = e + 1; wait = 0; continue; }
      if (wait >= st.patience && e > 0) { stop = e + 1; break; }
    }
    return { best: best, bestEp: bestEp, stop: stop };
  }
  function recompute(jump) {
    stopLoop(); res = st.use ? earlyStopping() : { best: Math.min.apply(null, hist.vloss), bestEp: hist.vloss.indexOf(Math.min.apply(null, hist.vloss)) + 1, stop: null };
    if (jump) shown = res.stop || MAXEP;
    shown = Math.min(shown, MAXEP);
    sEp.set(shown, true); drawAll();
  }
  function endEpoch() { return res.stop || MAXEP; }
  function stopLoop() { if (loop && loop.running) loop.stop(); }
  function toggle() {
    if (loop.running) { loop.stop(); return; }
    if (api.reduceMotion) { shown = endEpoch(); sEp.set(shown, true); drawAll(); return; }
    if (shown >= endEpoch()) shown = 1;
    loop.start();
  }
  loop = api.loop(function () {
    shown = Math.min(endEpoch(), shown + 3); sEp.set(shown, true); drawAll();
    if (shown >= endEpoch()) return false;
  }, { fps: 30, onState: function (on) { bGo.textContent = on ? "⏸ Pausa" : "▶ Entrenar"; } });

  function modelEpoch() {
    var e = shown;
    if (res.stop && shown >= res.stop && st.restore) e = res.bestEp;
    return e;
  }
  function draw(ctx, w, h, C) {
    var D = api.d, n = Math.min(shown, MAXEP), ymax = 0.9, i, xmax = res.stop ? Math.min(MAXEP, Math.max(100, Math.ceil(res.stop * 2.5 / 50) * 50)) : MAXEP;
    for (i = 0; i < xmax; i++) { if (hist.loss[i] > ymax) ymax = hist.loss[i]; if (hist.vloss[i] > ymax) ymax = hist.vloss[i]; }
    plot.xr = [0, xmax]; plot.yr = [0, Math.min(2.4, Math.ceil(ymax * 5) / 5)];
    plot.axes(ctx); var b = plot.box;
    ctx.save(); plot.clip(ctx);
    if (res.stop && shown >= res.stop) {
      ctx.save(); ctx.globalAlpha = 0.35; D.rect(ctx, plot.x(res.bestEp), b.y, plot.x(res.stop) - plot.x(res.bestEp), b.h, C.terracotaWash, null); ctx.restore();
      ctx.save(); ctx.globalAlpha = 0.4; ctx.setLineDash([3, 4]);
      D.path(ctx, hist.vloss.slice(res.stop - 1, xmax).map(function (v, k) { return [plot.x(res.stop + k), plot.y(Math.min(v, plot.yr[1]))]; }), C.terracota, 2, [3, 4]);
      D.path(ctx, hist.loss.slice(res.stop - 1, xmax).map(function (v, k) { return [plot.x(res.stop + k), plot.y(Math.min(v, plot.yr[1]))]; }), C.cobalto, 2, [3, 4]);
      ctx.restore();
    }
    D.path(ctx, hist.loss.slice(0, n).map(function (v, k) { return [plot.x(k + 1), plot.y(Math.min(v, plot.yr[1]))]; }), C.cobalto, 2.4);
    D.path(ctx, hist.vloss.slice(0, n).map(function (v, k) { return [plot.x(k + 1), plot.y(Math.min(v, plot.yr[1]))]; }), C.terracota, 2.4);
    ctx.restore();
    if (shown >= res.bestEp) {
      D.line(ctx, plot.x(res.bestEp), b.y, plot.x(res.bestEp), b.y + b.h, C.oliva, 1.6, [5, 3]);
      D.circle(ctx, plot.x(res.bestEp), plot.y(Math.min(res.best, plot.yr[1])), 5, C.oliva, C.paper, 1.5);
    }
    if (res.stop && shown >= res.stop) D.line(ctx, plot.x(res.stop), b.y, plot.x(res.stop), b.y + b.h, C.terracota, 2);
    D.line(ctx, plot.x(Math.min(shown, xmax)), b.y, plot.x(Math.min(shown, xmax)), b.y + b.h, C.ink, 1, [2, 3]);
    D.text(ctx, "loss (train)", b.x + b.w - 6, b.y + 14, { align: "right", size: 11, weight: 600, color: C.cobaltoInk });
    D.text(ctx, "val_loss", b.x + b.w - 6, b.y + 28, { align: "right", size: 11, weight: 600, color: C.terracotaInk });
    if (res.stop && shown >= res.stop) D.text(ctx, "- - lo que habría pasado sin parar", b.x + b.w - 6, b.y + 42, { align: "right", size: 10.5, color: C.muted });
    var bx = Math.min(b.x + b.w - 52, plot.x(res.bestEp) + 6);
    if (shown >= res.bestEp) { C2.halo(ctx, "mejor: " + res.bestEp, bx, b.y + b.h - 8, { size: 11, bg: C.surface }); D.text(ctx, "mejor: " + res.bestEp, bx, b.y + b.h - 8, { size: 11, weight: 600, color: C.olivaInk }); }
    if (res.stop && shown >= res.stop) { var sx = Math.min(b.x + b.w - 46, plot.x(res.stop) + 6); C2.halo(ctx, "stop: " + res.stop, sx, b.y + b.h - 24, { size: 11, bg: C.surface }); D.text(ctx, "stop: " + res.stop, sx, b.y + b.h - 24, { size: 11, weight: 600, color: C.terracotaInk }); }
  }
  function draw2(ctx, w, h, C) {
    var D = api.d, b = plot2.box, asp = b.w / b.h;
    plot2.xr = [-1.3 * asp, 1.3 * asp]; plot2.yr = [-1.3, 1.3];
    net.setState(snaps[modelEpoch() - 1]);
    plot2.axes(ctx); ctx.save(); plot2.clip(ctx);
    C2.paintBoundary(ctx, plot2, function (x, y) { return net.forward([x, y])[0]; }, C, 32);
    va.X.forEach(function (p, i) { D.circle(ctx, plot2.x(p[0]), plot2.y(p[1]), 2.6, null, va.Y[i][0] ? C.terracota : C.cobalto, 1); });
    tr.X.forEach(function (p, i) { D.circle(ctx, plot2.x(p[0]), plot2.y(p[1]), 4.6, tr.Y[i][0] ? C.terracota : C.cobalto, C.paper, 1.4); });
    ctx.restore();
    C2.halo(ctx, "● thriller", b.x + 8, b.y + 18, { size: 11, bg: C.surface }); D.text(ctx, "● thriller", b.x + 8, b.y + 18, { size: 11, weight: 600, color: C.terracotaInk });
    C2.halo(ctx, "● comedia", b.x + 8, b.y + 34, { size: 11, bg: C.surface }); D.text(ctx, "● comedia", b.x + 8, b.y + 34, { size: 11, weight: 600, color: C.cobaltoInk });
    D.text(ctx, "modelo de la época " + modelEpoch() + (modelEpoch() !== shown ? " (pesos restaurados)" : ""), b.x + b.w / 2, h - 6, { align: "center", size: 11, weight: 600, color: C.ink });
  }
  function drawAll() {
    view.redraw(); view2.redraw();
    var e = modelEpoch(), vl = hist.vloss[e - 1], va_ = hist.vacc[e - 1], tl = hist.loss[e - 1];
    var line1 = st.use ? "EarlyStopping(monitor='val_loss', patience=" + st.patience + ", min_delta=" + st.minDelta.toFixed(3) + ", restore_best_weights=" + (st.restore ? "True" : "False") + ")" : "sin EarlyStopping: entrena las " + MAXEP + " épocas";
    var line2 = res.stop ? "mejor val_loss <b>" + res.best.toFixed(3) + "</b> en la época <b>" + res.bestEp + "</b> → tras " + st.patience + " épocas sin mejorar para en la <b>" + res.stop + "</b> (se ahorran " + (MAXEP - res.stop) + " épocas)" :
      (st.use ? "no se dispara: val_loss siguió mejorando hasta el final" : "la mejor val_loss fue <b>" + res.best.toFixed(3) + "</b> en la época <b>" + res.bestEp + "</b>, pero se ha entrenado hasta la " + MAXEP);
    var gap = hist.vloss[Math.min(shown, MAXEP) - 1] - hist.loss[Math.min(shown, MAXEP) - 1];
    out.set(line1 + "<br>" + line2 + "<br>modelo mostrado: época <b>" + e + "</b> · loss " + tl.toFixed(3) + " · val_loss <b>" + vl.toFixed(3) + "</b> · val_accuracy <b>" + (100 * va_).toFixed(1) + " %</b>" +
      (shown >= 80 && gap > 0.25 && !(res.stop && shown >= res.stop && st.restore) ? "<br><span class='bad'>Sobreajuste: loss sigue bajando, val_loss sube. El modelo memoriza las " + tr.X.length + " películas de entrenamiento.</span>" : ""));
  }
  train(); recompute(true);
  view.draw(draw); view2.draw(draw2);
  return { destroy: function () { if (loop) loop.stop(); } };
});
