/* Experimento: cuello de botella en un pipeline tf.data. Dos «carriles»: el que prepara los lotes (leer + map) y el que entrena.
   Simulación de productor–consumidor (los tiempos son los que pones tú; las reglas son las de tf.data):
   · sin prefetch: se prepara un lote, se entrena con él y solo entonces se prepara el siguiente;
   · prefetch(k): el productor puede ir k lotes por delante mientras se entrena;
   · map(num_parallel_calls=n): el map de un lote usa n núcleos (su tiempo se divide entre n);
   · cache(): desde la 2.ª época leer y mapear cuesta ~1 ms (el resultado ya está en memoria). */
Lab.register("curso3/c3m5-tfdata-pipeline", function (root, api) {
  var D = api.d, N = 100, NSHOW = 6;
  var S = { R: 20, Mm: 40, T: 50, par: false, cores: 4, pre: false, cache: false };

  function times(epoch) {
    var cached = S.cache && epoch === 2, R = cached ? 0.5 : S.R, M = cached ? 0.5 : S.Mm / (S.par ? S.cores : 1);
    return { R: R, M: M, P: R + M };
  }
  function sim(n, tm) {
    var k = S.pre ? 2 : 0, ps = [], pe = [], cs = [], ce = [], i;
    for (i = 0; i < n; i++) {
      if (k === 0) ps[i] = i === 0 ? 0 : ce[i - 1];
      else ps[i] = Math.max(i === 0 ? 0 : pe[i - 1], i - k - 1 >= 0 ? cs[i - k - 1] : 0);
      pe[i] = ps[i] + tm.P;
      cs[i] = Math.max(pe[i], i === 0 ? 0 : ce[i - 1]);
      ce[i] = cs[i] + S.T;
    }
    return { ps: ps, pe: pe, cs: cs, ce: ce, total: ce[n - 1], util: n * S.T / ce[n - 1] };
  }
  var view = api.view(root, { aspect: 1.9, minH: 250, maxH: 340, label: "Diagrama de tiempos del pipeline: carril de datos y carril del modelo en las dos primeras épocas" });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Leer un lote (disco/red), ms", min: 5, max: 60, step: 5, value: S.R, onInput: function (v) { S.R = v; update(); } });
  ui.slider({ label: "Preprocesar un lote (map), ms", min: 5, max: 100, step: 5, value: S.Mm, onInput: function (v) { S.Mm = v; update(); } });
  ui.slider({ label: "Paso de entrenamiento del modelo, ms", min: 10, max: 120, step: 5, value: S.T, onInput: function (v) { S.T = v; update(); } });
  ui.slider({ label: "Núcleos de CPU para el map", min: 2, max: 8, step: 1, value: S.cores, onInput: function (v) { S.cores = v; update(); } });
  ui.toggle({ label: "map(num_parallel_calls=AUTOTUNE)", value: false, onChange: function (v) { S.par = v; update(); } });
  ui.toggle({ label: ".prefetch(AUTOTUNE)", value: false, onChange: function (v) { S.pre = v; update(); } });
  ui.toggle({ label: ".cache()", value: false, onChange: function (v) { S.cache = v; update(); } });
  api.legend(root, [[api.colors().cobalto, "leer"], [api.colors().marker, "map (preprocesar)"], [api.colors().terracota, "entrenar (model.train_step)"]]);

  function draw(ctx, w, h, C) {
    var narrow = w < 480, padL = narrow ? 8 : 12, padR = 10, panelH = (h - 10) / 2, ep, tmax = 0, res = [], k, i;
    for (ep = 1; ep <= 2; ep++) { var tm = times(ep), r = sim(NSHOW, tm); res.push({ tm: tm, r: r }); tmax = Math.max(tmax, r.total); }
    var x0 = padL + (narrow ? 0 : 44), W = w - x0 - padR;
    function X(t) { return x0 + t / tmax * W; }
    for (ep = 0; ep < 2; ep++) {
      var oy = 4 + ep * (panelH + 2), laneH = Math.min(30, (panelH - 36) / 2), y1 = oy + 20, y2 = y1 + laneH + 10, rr = res[ep];
      D.text(ctx, "Época " + (ep + 1) + (ep === 1 ? (S.cache ? " (con cache: datos ya en memoria)" : " (igual que la 1.ª: sin cache)") : "") + " · primeros " + NSHOW + " lotes", padL, oy + 12, { size: narrow ? 10.5 : 12, weight: 600, color: C.ink2 });
      D.rect(ctx, x0, y1, W, laneH, C.surface, C.line, 1); D.rect(ctx, x0, y2, W, laneH, C.surface, C.line, 1);
      if (!narrow) { D.text(ctx, "datos", padL, y1 + laneH / 2 + 4, { size: 11, color: C.muted }); D.text(ctx, "modelo", padL, y2 + laneH / 2 + 4, { size: 11, color: C.muted }); }
      for (i = 0; i < NSHOW; i++) {
        var ps = rr.r.ps[i], rt = rr.tm.R, mt = rr.tm.M;
        D.rect(ctx, X(ps), y1 + 2, Math.max(1, X(ps + rt) - X(ps)), laneH - 4, C.cobalto, C.paper, 1);
        D.rect(ctx, X(ps + rt), y1 + 2, Math.max(1, X(ps + rt + mt) - X(ps + rt)), laneH - 4, C.marker, C.paper, 1);
        D.rect(ctx, X(rr.r.cs[i]), y2 + 2, Math.max(1, X(rr.r.ce[i]) - X(rr.r.cs[i])), laneH - 4, C.terracota, C.paper, 1);
        if (X(rr.r.ce[i]) - X(rr.r.cs[i]) > 14) D.text(ctx, String(i + 1), (X(rr.r.cs[i]) + X(rr.r.ce[i])) / 2, y2 + laneH / 2 + 4, { align: "center", size: 10.5, weight: 700, color: C.paper, mono: true });
      }
      D.text(ctx, "tiempo →  (" + rr.r.ce[NSHOW - 1].toFixed(0) + " ms para " + NSHOW + " lotes)", x0 + W, y2 + laneH + 14, { align: "right", size: 10.5, color: C.muted });
    }
  }
  view.draw(draw);

  function update() {
    var r1 = sim(N, times(1)), r2 = sim(N, times(2)), t1 = times(1);
    var gpuBound = t1.P <= S.T, why;
    if (S.pre) why = gpuBound ? "el modelo ya es el límite: preparar datos va por delante y <b>la GPU casi no espera</b>; más trucos de tf.data no ganarán nada" : "con prefetch ya se solapan, pero preparar un lote (" + t1.P.toFixed(0) + " ms) tarda más que entrenarlo (" + S.T + " ms): el cuello de botella son <b>los datos</b> (prueba el map en paralelo o la cache)";
    else why = "sin prefetch todo es en serie: cada lote cuesta " + (t1.P + S.T).toFixed(0) + " ms (preparar " + t1.P.toFixed(0) + " + entrenar " + S.T + ") y el modelo espera <b>" + (100 * t1.P / (t1.P + S.T)).toFixed(0) + " %</b> del tiempo";
    out.set("Preparar un lote: <b>" + t1.P.toFixed(1) + " ms</b> (leer " + t1.R + " + map " + t1.M.toFixed(1) + ") · entrenar: <b>" + S.T + " ms</b>" +
      "<br>Época de " + N + " lotes: la 1.ª dura <b>" + (r1.total / 1000).toFixed(2) + " s</b> (modelo ocupado el <b class='" + (r1.util > 0.9 ? "good" : "bad") + "'>" + (100 * r1.util).toFixed(0) + " %</b>) · la 2.ª <b>" + (r2.total / 1000).toFixed(2) + " s</b> (" + (100 * r2.util).toFixed(0) + " %)" +
      "<br>" + why.charAt(0).toUpperCase() + why.slice(1) + ".");
    view.redraw();
  }
  update();
});
