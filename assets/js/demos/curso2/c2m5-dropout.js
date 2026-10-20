/* Experimento: Dropout. En entrenamiento apaga unidades al azar y multiplica el resto por 1/(1-p); en inferencia no hace nada. */
Lab.register("curso2/c2m5-dropout", function (root, api) {
  var VALS = [0.9, 0.4, 0.7, 0.2, 0.8, 0.5, 0.3, 0.6, 1.0, 0.1, 0.45, 0.75], NU = VALS.length, rate = 0.3, train = true, rg = api.rng(12), mask = [], count = 0;
  function newMask() { mask = VALS.map(function () { return rg.next() >= rate ? 1 : 0; }); count++; }
  newMask();
  var view = api.view(root, { aspect: 1.9, minH: 220, maxH: 330, label: "Valores de 12 unidades antes y después de Dropout" });
  api.legend(root, [[api.colors().cobalto, "antes de Dropout"], [api.colors().terracota, "después (las conservadas se multiplican por 1/(1−p))"], [api.colors().muted, "unidad apagada"]]);
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Tasa de Dropout (p)", min: 0, max: 0.8, step: 0.1, value: rate, fmt: function (v) { return v.toFixed(1).replace(".", ","); }, onInput: function (v) { rate = v; newMask(); update(); } });
  ui.segmented({ label: "Modo", options: [[true, "entrenamiento (training=True)"], [false, "predicción (training=False)"]], value: train, onChange: function (v) { train = v; update(); } });
  ui.button("Nuevo paso de entrenamiento (otra máscara)", function () { newMask(); update(); }, "primary");
  function after() { return VALS.map(function (v, i) { return train ? (mask[i] ? v / (1 - rate) : 0) : v; }); }
  view.draw(function (ctx, w, h, C) {
    var A = after(), left = 8, bw = (w - 2 * left) / NU, base = h - 22, top0 = 10, sc = (base - top0) / 2.6, i;
    api.d.line(ctx, left, base, w - left, base, C.line, 1);
    for (i = 0; i < NU; i++) {
      var x = left + i * bw, off = !train ? false : !mask[i];
      api.d.rect(ctx, x + bw * 0.1, base - VALS[i] * sc, bw * 0.38, VALS[i] * sc, off ? C.muted : C.cobalto);
      if (!off) api.d.rect(ctx, x + bw * 0.52, base - A[i] * sc, bw * 0.38, A[i] * sc, C.terracota);
      else api.d.text(ctx, "×", x + bw * 0.71, base - 4, { size: 13, align: "center", color: C.muted, weight: 700 });
      api.d.text(ctx, String(i + 1), x + bw / 2, h - 7, { size: 10, align: "center", color: C.muted });
    }
  });
  function update() {
    view.redraw();
    var A = after(), s0 = VALS.reduce(function (a, b) { return a + b; }, 0), s1 = A.reduce(function (a, b) { return a + b; }, 0), off = mask.filter(function (m) { return !m; }).length;
    var g = api.rng(99), tot = 0, T = 2000, t, k;
    for (t = 0; t < T; t++) for (k = 0; k < NU; k++) if (g.next() >= rate) tot += VALS[k] / (1 - rate);
    out.set((train ? "Unidades apagadas en este paso: <b>" + off + "</b> de " + NU + " (se espera " + (rate * NU).toFixed(1).replace(".", ",") + ") · factor de las que sobreviven: 1/(1−" + rate.toFixed(1).replace(".", ",") + ") = <b>" + (1 / (1 - rate)).toFixed(3).replace(".", ",") + "</b>" : "En predicción Dropout no apaga nada ni reescala: la salida es igual a la entrada.") + "<br>" +
      "Suma de la capa: antes <b>" + s0.toFixed(2).replace(".", ",") + "</b> · después <b>" + s1.toFixed(2).replace(".", ",") + "</b> · media de la suma en " + T + " pasos con p = " + rate.toFixed(1).replace(".", ",") + ": <b>" + (tot / T).toFixed(2).replace(".", ",") + "</b> (se conserva la media, por eso se reescala)");
  }
  update();
});
