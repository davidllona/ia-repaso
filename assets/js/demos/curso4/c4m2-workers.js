/* Experimento: num_workers. Simulación de tiempos (ficticios, en ms) de un cargador que prepara 8 lotes y de un modelo que los consume.
   Con 0 trabajadores todo ocurre en serie; con W trabajadores el reparto es por turnos (lote k → trabajador k mod W) y cada uno puede ir un máximo de 2 lotes por delante. */
Lab.register("curso4/c4m2-workers", function (root, api) {
  var D = api.d, NB = 8, PREF = 2;
  var S = { W: 2, load: 60, step: 30 };
  var view = api.view(root, { aspect: 3.4, minH: 170, maxH: 230, label: "Diagrama de tiempos del proceso principal y de los trabajadores" });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "num_workers", min: 0, max: 4, step: 1, value: S.W, onInput: function (v) { S.W = v; update(); } });
  ui.slider({ label: "preparar un lote de pósters (ms)", min: 5, max: 120, step: 5, value: S.load, onInput: function (v) { S.load = v; update(); } });
  ui.slider({ label: "paso del modelo con un lote (ms)", min: 5, max: 120, step: 5, value: S.step, onInput: function (v) { S.step = v; update(); } });

  function simulate() {
    var W = S.W, L = S.load, T = S.step, k, loads = [], steps = [], t = 0;
    if (W === 0) {
      for (k = 0; k < NB; k++) { loads.push({ lane: 0, s: t, e: t + L, k: k }); t += L; steps.push({ s: t, e: t + T, k: k }); t += T; }
      return { loads: loads, steps: steps, total: t, W: 0 };
    }
    var fin = [], consStart = [], prevEnd = 0;
    for (k = 0; k < NB; k++) {
      var s = 0;
      if (k - W >= 0) s = Math.max(s, fin[k - W]);
      if (k - PREF * W >= 0) s = Math.max(s, consStart[k - PREF * W]);
      fin[k] = s + L; loads.push({ lane: (k % W) + 1, s: s, e: s + L, k: k });
      consStart[k] = Math.max(prevEnd, fin[k]);
      steps.push({ s: consStart[k], e: consStart[k] + T, k: k }); prevEnd = consStart[k] + T;
    }
    return { loads: loads, steps: steps, total: prevEnd, W: W };
  }
  function draw(ctx, w, h, C) {
    var sim = simulate(), lanes = sim.W === 0 ? 1 : sim.W + 1, pad = { l: 78, r: 26, t: 12, b: 26 };
    var lw = w - pad.l - pad.r, laneH = Math.min(34, (h - pad.t - pad.b) / lanes), maxT = Math.max(sim.total, 100), sx = lw / maxT;
    var names = ["modelo (main)"]; for (var q = 1; q <= sim.W; q++) names.push("trabajador " + (q - 1));
    if (sim.W === 0) names = ["proceso único"];
    names.forEach(function (nm, i) { D.text(ctx, nm, pad.l - 6, pad.t + i * laneH + laneH / 2 + 4, { size: w < 520 ? 9.5 : 10.5, color: C.ink2, align: "right" }); D.line(ctx, pad.l, pad.t + (i + 1) * laneH, w - pad.r, pad.t + (i + 1) * laneH, C.line, 1); });
    sim.loads.forEach(function (b) {
      var y = pad.t + (sim.W === 0 ? 0 : b.lane) * laneH + 3, x = pad.l + b.s * sx, bw = (b.e - b.s) * sx;
      D.rect(ctx, x, y, Math.max(1, bw - 1), laneH - 6, C.cobaltoWash, C.cobalto, 1);
      if (bw > 14) D.text(ctx, String(b.k), x + bw / 2, y + (laneH - 6) / 2 + 4, { size: 10, color: C.cobaltoInk, align: "center", mono: true });
    });
    sim.steps.forEach(function (b) {
      var y = pad.t + 3, x = pad.l + b.s * sx, bw = (b.e - b.s) * sx;
      D.rect(ctx, x, y, Math.max(1, bw - 1), laneH - 6, C.terracotaWash, C.terracota, 1);
      if (bw > 14) D.text(ctx, String(b.k), x + bw / 2, y + (laneH - 6) / 2 + 4, { size: 10, color: C.terracotaInk, align: "center", mono: true });
    });
    var yb = pad.t + lanes * laneH;
    D.line(ctx, pad.l, yb + 2, w - pad.r, yb + 2, C.ink, 1);
    var ticks = 4, i;
    for (i = 0; i <= ticks; i++) { var tv = maxT * i / ticks; D.text(ctx, Math.round(tv) + " ms", pad.l + tv * sx, yb + 15, { size: 10, color: C.muted, align: "center", mono: true }); }
  }
  view.draw(draw);

  function update() {
    var sim = simulate(), base = NB * (S.load + S.step), busy = NB * S.step, util = busy / sim.total;
    out.set("8 lotes · preparar = <b>" + S.load + " ms</b>, paso del modelo = <b>" + S.step + " ms</b><br>" +
      "tiempo total: <b>" + Math.round(sim.total) + " ms</b> (en serie serían " + base + " ms → ×" + (base / sim.total).toFixed(2) + " más rápido)<br>" +
      "el modelo está trabajando el <b class='" + (util > 0.9 ? "good" : "bad") + "'>" + Math.round(util * 100) + " %</b> del tiempo" +
      (util < 0.9 ? " y esperando datos el resto: la GPU/CPU del modelo se queda parada" : " (casi sin esperas)") +
      "<br><span style='color:var(--muted)'>Tiempos ficticios, solo para ver el reparto: azul = preparar un lote de pósters (leer + transformar + apilar), naranja = un paso de entrenamiento.</span>");
    view.redraw();
  }
  update();
});
