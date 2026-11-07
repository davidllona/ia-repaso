/* Experimento: EarlyStopping y ModelCheckpoint sobre las curvas REALES del clasificador de pósters
   (30 épocas de Keras, semilla 0, 800 pósters de entrenamiento y 200 de validación).
   Se elige la paciencia y si se restauran los mejores pesos; se ve en qué época para y qué pesos te quedas. */
Lab.register("curso6/c6m2-early-stopping", function (root, api) {
  var LOSS = [0.628, 0.536, 0.468, 0.376, 0.267, 0.18, 0.143, 0.116, 0.085, 0.067, 0.075, 0.041, 0.044, 0.045, 0.025, 0.03, 0.062, 0.029, 0.029, 0.023, 0.018, 0.023, 0.042, 0.018, 0.006, 0.032, 0.028, 0.026, 0.004, 0.002];
  var VAL = [0.647, 0.567, 0.492, 0.379, 0.242, 0.164, 0.166, 0.122, 0.113, 0.093, 0.127, 0.1, 0.089, 0.073, 0.069, 0.068, 0.115, 0.091, 0.152, 0.147, 0.104, 0.087, 0.146, 0.101, 0.064, 0.075, 0.085, 0.07, 0.074, 0.077];
  var ACC = [0.645, 0.68, 0.73, 0.81, 0.885, 0.935, 0.925, 0.95, 0.95, 0.965, 0.945, 0.965, 0.98, 0.97, 0.98, 0.97, 0.955, 0.98, 0.945, 0.955, 0.975, 0.98, 0.96, 0.965, 0.98, 0.97, 0.98, 0.975, 0.97, 0.975];
  var N = VAL.length, S = { pac: 3, restaurar: true };

  var view = api.view(root, { aspect: 1.75, minH: 240, maxH: 360, label: "Curvas de pérdida de entrenamiento y validación época a época, con la época en la que para EarlyStopping y los guardados de ModelCheckpoint" });
  var plot = api.plot(view, { xr: [0.5, N + 0.5], yr: [0, 0.7], xticks: 6, yticks: 7, xlabel: "época", ylabel: "pérdida",
    pad: { l: 46, r: 12, t: 16, b: 40 }, xfmt: function (v) { return Math.round(v); }, yfmt: function (v) { return v.toFixed(1); } });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "patience (épocas sin mejorar que aguanta)", min: 1, max: 10, step: 1, value: S.pac,
    fmt: function (v) { return v; }, onInput: function (v) { S.pac = v; update(); } });
  ui.toggle({ label: "restore_best_weights=True", value: true, onChange: function (v) { S.restaurar = v; update(); } });
  var C0 = api.colors();
  api.legend(root, [[C0.cobalto, "loss (entrenamiento)"], [C0.terracota, "val_loss"], [C0.oliva, "guardado por ModelCheckpoint"]]);

  // Reglas de Keras: mejora si val < mejor; si no, espera += 1; para cuando espera >= patience.
  function simular() {
    var mejor = Infinity, mejorEp = 0, espera = 0, guardados = [], e;
    for (e = 0; e < N; e++) {
      if (VAL[e] < mejor) { mejor = VAL[e]; mejorEp = e; espera = 0; guardados.push(e); }
      else { espera++; if (espera >= S.pac) return { para: e, mejorEp: mejorEp, guardados: guardados, agoto: false }; }
    }
    return { para: N - 1, mejorEp: mejorEp, guardados: guardados, agoto: true };
  }

  function draw(ctx, w, h, C) {
    var r = simular(), e;
    plot.axes(ctx);
    var xa = plot.x(r.para + 1.5), xb = plot.x(N + 0.5);
    if (!r.agoto) {
      api.d.rect(ctx, xa, plot.box.y, xb - xa, plot.box.h, C.surface);
      api.d.text(ctx, "no se entrena", (xa + xb) / 2, plot.box.y + 14, { align: "center", size: 11, color: C.muted });
    }
    var pl = [], pv = [];
    for (e = 0; e < N; e++) { pl.push([plot.x(e + 1), plot.y(LOSS[e])]); pv.push([plot.x(e + 1), plot.y(VAL[e])]); }
    api.d.path(ctx, pl, C.cobalto, 2);
    api.d.path(ctx, pv, C.terracota, 2);
    r.guardados.forEach(function (g) { if (g <= r.para) api.d.circle(ctx, plot.x(g + 1), plot.y(VAL[g]), 4, C.oliva, C.paper, 1); });
    var xp = plot.x(r.para + 1);
    api.d.line(ctx, xp, plot.box.y, xp, plot.box.y + plot.box.h, C.ink2, 1.5, [5, 4]);
    var xm = plot.x(r.mejorEp + 1), ym = plot.y(VAL[r.mejorEp]);
    api.d.circle(ctx, xm, ym, 7, null, C.ink, 2);
    var txt = "para en " + (r.para + 1), izq = xp > plot.box.x + plot.box.w * 0.7;
    api.d.text(ctx, txt, xp + (izq ? -6 : 6), plot.box.y + plot.box.h * 0.45, { align: izq ? "right" : "left", size: 11, weight: 600, color: C.ink });
  }

  function update() {
    view.redraw();
    var r = simular(), fin = S.restaurar ? r.mejorEp : r.para;
    out.set("Para tras la época <b>" + (r.para + 1) + "</b>" + (r.agoto ? " (se acabaron las 30 épocas)" : "") +
      " · mejor val_loss en la época <b>" + (r.mejorEp + 1) + "</b> (" + VAL[r.mejorEp].toFixed(3) + ")<br>" +
      "Pesos con los que te quedas: época <b>" + (fin + 1) + "</b> → val_loss " + VAL[fin].toFixed(3) + ", val_acc " + ACC[fin].toFixed(3) +
      (S.restaurar ? "" : "<br><span class='bad'>Sin restaurar te quedas con la última época, no con la mejor (mejor.keras sí guarda la mejor).</span>") +
      (r.mejorEp + 1 === 25 ? "<br><span class='good'>Con esta paciencia llega al mínimo de la época 25.</span>" : ""));
  }
  view.draw(draw); update();
});
