/* Experimento: los resultados REALES de los fragmentos de la lección 6 (miniaturas sintéticas 32×32,
   «título arriba / abajo», 10 épocas, test de 400). Se elige qué métrica mirar y se comparan CNN, ViT e
   híbrido en Keras y en PyTorch. Los tiempos son de este ordenador (2 núcleos, un hilo) y cambian en el tuyo. */
Lab.register("curso6/c6m3-comparar", function (root, api) {
  var MOD = ["CNN", "ViT", "Híbrido"];
  var DATOS = {
    a100: { t: "Acierto en test, entrenando con 100 pósters", k: [1.000, 0.472, 1.000], p: [1.000, 0.762, 1.000], max: 1, f: function (v) { return v.toFixed(3).replace(".", ","); } },
    a800: { t: "Acierto en test, entrenando con 800 pósters", k: [1.000, 1.000, 1.000], p: [1.000, 1.000, 1.000], max: 1, f: function (v) { return v.toFixed(3).replace(".", ","); } },
    par:  { t: "Parámetros", k: [9186, 23970, 16930], p: [9186, 23906, 25410], max: 26000, f: function (v) { return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); } },
    seg:  { t: "Segundos para 10 épocas con 800 pósters", k: [2.7, 6.3, 6.5], p: [1.6, 1.5, 4.4], max: 7, f: function (v) { return v.toFixed(1).replace(".", ",") + " s"; } }
  };
  var NOTA = {
    a100: "Con 100 pósters el ViT se queda corto en los dos frameworks; la CNN y el híbrido traen de serie «mirar cerca» y aciertan todo.",
    a800: "Con 800 pósters todos llegan a 1,000: con datos suficientes, el ViT aprende solo lo que la CNN trae de fábrica.",
    par: "Mismo diseño, casi mismos parámetros: el ViT de Keras tiene 64 más (su norma final). El híbrido de Keras usa 1 bloque y el de PyTorch 2.",
    seg: "Keras paga un coste fijo al compilar el grafo, que en modelos diminutos pesa mucho. El híbrido es el más lento: 65 tokens frente a 17."
  };
  var S = { m: "a100" };
  var view = api.view(root, { aspect: 1.7, minH: 250, maxH: 340, label: "Barras agrupadas con la métrica elegida para CNN, ViT e híbrido, en Keras y en PyTorch" });
  var ui = api.controls(root), out = api.readout(root);
  ui.select({ label: "Qué comparas", value: S.m,
    options: [["a100", "Acierto con 100 pósters"], ["a800", "Acierto con 800 pósters"], ["par", "Parámetros"], ["seg", "Tiempo (800 pósters)"]],
    onChange: function (v) { S.m = v; update(); } });
  var C0 = api.colors();
  api.legend(root, [[C0.terracota, "Keras"], [C0.cobalto, "PyTorch"]]);

  function draw(ctx, w, h, C) {
    var D = DATOS[S.m], l = 12, r = 12, t = 44, b = 30, gw = (w - l - r) / 3, bw = Math.min(46, gw * 0.3), base = h - b, alto = h - t - b, i;
    api.d.text(ctx, D.t, w / 2, 16, { align: "center", size: 12, weight: 600, color: C.ink2 });
    api.d.line(ctx, l, base, w - r, base, C.line, 1);
    for (i = 0; i < 3; i++) {
      var cx = l + gw * (i + 0.5);
      [[D.k[i], C.terracota, -1], [D.p[i], C.cobalto, 1]].forEach(function (it) {
        var hh = alto * it[0] / D.max, x = cx + (it[2] < 0 ? -bw - 3 : 3);
        api.d.rect(ctx, x, base - hh, bw, hh, it[1]);
        api.d.text(ctx, D.f(it[0]), x + bw / 2, base - hh - 5, { align: "center", size: w < 420 ? 10 : 11, weight: 600, color: C.ink, mono: true });
      });
      api.d.text(ctx, MOD[i], cx, base + 18, { align: "center", size: 12, weight: 600, color: C.ink });
    }
  }
  function update() { view.redraw(); out.set(NOTA[S.m]); }
  view.draw(draw); update();
});
