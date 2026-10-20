/* Experimento: el viaje de una imagen por ResNet-18. Calcula con la fórmula de la convolución el tamaño de cada etapa para el lado
   de entrada elegido y lo compara con los parámetros de cada etapa (que NO dependen del tamaño de la imagen). */
Lab.register("curso5/c5m4-resnet-tamanos", function (root, api) {
  var D = api.d;
  var S = { lado: 224 };
  /* etapa: nombre, kernel, stride, padding de la operación que cambia el tamaño, canales de salida, parámetros reales de ResNet-18 */
  var ET = [
    { n: "conv1", k: 7, s: 2, p: 3, c: 64, par: 9536 },
    { n: "maxpool", k: 3, s: 2, p: 1, c: 64, par: 0 },
    { n: "layer1", k: 3, s: 1, p: 1, c: 64, par: 147968 },
    { n: "layer2", k: 3, s: 2, p: 1, c: 128, par: 525568 },
    { n: "layer3", k: 3, s: 2, p: 1, c: 256, par: 2099712 },
    { n: "layer4", k: 3, s: 2, p: 1, c: 512, par: 8393728 },
    { n: "avgpool", k: 0, s: 0, p: 0, c: 512, par: 0 },
    { n: "fc", k: 0, s: 0, p: 0, c: 1000, par: 513000 }
  ];
  function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  function sizes(lado) {
    var res = [], n = lado, i, e;
    for (i = 0; i < ET.length; i++) {
      e = ET[i];
      if (e.n === "avgpool") n = 1;
      else if (e.n !== "fc") n = Math.floor((n + 2 * e.p - e.k) / e.s) + 1;
      res.push({ lado: n, c: e.c, n: e.n });
    }
    return res;
  }

  var view = api.view(root, { aspect: 1.9, minH: 190, maxH: 280, label: "Tamaño del mapa de características en cada etapa de ResNet-18" });
  var ui = api.controls(root), out = api.readout(root);
  var sl = ui.slider({ label: "Lado de la imagen de entrada (píxeles)", min: 32, max: 448, step: 32, value: S.lado, onInput: function (v) { S.lado = v; update(); } });
  ui.button("Volver a 224 (el tamaño de ImageNet)", function () { sl.set(224); }, "primary");

  function draw(ctx, w, h, C) {
    var z = sizes(S.lado), n = z.length, i, cellW = (w - 8) / n, baseY = h - 46, maxPx = h - 80, fs = w < 420 ? 9.5 : 11;
    for (i = 0; i < n; i++) {
      var side = z[i].n === "fc" ? 5 : Math.max(5, Math.min(maxPx, z[i].lado * (maxPx / 224) * 0.9));
      var cx = 4 + cellW * (i + 0.5), layers = z[i].n === "fc" ? 1 : Math.max(1, Math.round(Math.log2(z[i].c / 3)) - 2), j;
      for (j = layers - 1; j >= 0; j--) {
        var off = j * 2.4;
        D.rect(ctx, cx - side / 2 + off, baseY - side - off, side, side, j === 0 ? C.cobaltoWash : C.surface, C.cobalto, 1.2);
      }
      D.text(ctx, z[i].n, cx, h - 30, { size: fs, mono: true, color: C.ink2, align: "center" });
      D.text(ctx, z[i].n === "fc" ? "1000" : (z[i].lado + "²"), cx, h - 16, { size: fs, mono: true, color: C.cobaltoInk, align: "center", weight: 600 });
      D.text(ctx, z[i].n === "fc" ? "" : ("×" + z[i].c), cx, 14, { size: fs, mono: true, color: C.terracotaInk, align: "center" });
    }
    D.text(ctx, w < 460 ? "lado² abajo · canales arriba" : "lado² (abajo) y canales (arriba); el tamaño del cuadrado es proporcional al lado", w / 2, h - 3, { size: 9.5, color: C.muted, align: "center" });
  }
  view.draw(draw);

  function update() {
    var z = sizes(S.lado), i, tot = 0, s = "";
    for (i = 0; i < ET.length; i++) tot += ET[i].par;
    s += "Entrada <b>" + S.lado + "×" + S.lado + "×3</b> = " + fmt(S.lado * S.lado * 3) + " números → ";
    for (i = 0; i < 6; i++) s += z[i].n + " <b>" + z[i].lado + "×" + z[i].lado + "×" + z[i].c + "</b>" + (i < 5 ? " → " : "");
    s += "<br><b>avgpool</b> promedia los " + z[5].lado + "×" + z[5].lado + " = " + (z[5].lado * z[5].lado) + " posiciones de cada canal en un vector de <b>512</b> números y <b>fc</b> da 1000 puntuaciones: con cualquier lado la red funciona, pero sus pesos se entrenaron con 224.";
    s += "<br>Parámetros totales: <b>" + fmt(tot) + "</b> (layer4: <b>" + (100 * 8393728 / tot).toFixed(1).replace(".", ",") + " %</b>) <b>sin depender del lado</b>; lo que sí crece con el lado es la memoria: conv1 produce <b>" + fmt(z[0].lado * z[0].lado * 64) + "</b> números por imagen.";
    if (z[5].lado < 2) s += "<br><span class='bad'>layer4 se queda en 1×1: ya casi no hay estructura espacial que promediar.</span>";
    else if (S.lado !== 224) s += "<br><span class='bad'>No es el tamaño con que se entrenó (224): funciona, pero los objetos se ven a otra escala y suele rendir peor.</span>";
    else s += "<br><span class='good'>Es el tamaño de ImageNet: 7×7×512 justo antes de avgpool.</span>";
    out.set(s); view.redraw();
  }
  update();
});
