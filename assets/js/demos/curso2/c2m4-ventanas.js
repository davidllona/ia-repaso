/* Experimento: convertir una serie (horas que ve Ana cada semana) en ejemplos «entrada → respuesta»
   con una ventana deslizante. Se elige el tamaño de la ventana y qué ejemplo mirar; se ve cuántos
   ejemplos salen (n − k) y la forma del tensor que espera Keras: (ejemplos, pasos, variables). */
Lab.register("curso2/c2m4-ventanas", function (root, api) {
  var serie = [10, 12, 14, 13, 15, 17, 16];
  var S = { k: 3, i: 0 };

  var view = api.view(root, { aspect: 1.9, minH: 220, maxH: 340, label: "Barras con las horas que ve Ana cada semana; una ventana resalta las semanas de entrada y la semana que hay que adivinar" });
  var plot = api.plot(view, { xr: [0, serie.length + 1], yr: [0, 20], xticks: serie.length + 1, yticks: 4,
    xlabel: "semana", ylabel: "horas vistas", pad: { l: 46, r: 12, t: 26, b: 40 },
    xfmt: function (v) { var r = Math.round(v); return r < 1 || r > serie.length ? "" : r; }, yfmt: function (v) { return Math.round(v); } });
  var ui = api.controls(root), out = api.readout(root);
  var nEj = function () { return serie.length - S.k; };

  var sk = ui.slider({ label: "Tamaño de la ventana k (semanas de entrada)", min: 1, max: 6, step: 1, value: S.k,
    fmt: function (v) { return v; }, onInput: function (v) { S.k = v; S.i = Math.min(S.i, nEj() - 1); si.input.max = nEj(); si.set(S.i + 1, true); update(); } });
  var si = ui.slider({ label: "Ejemplo que miras", min: 1, max: nEj(), step: 1, value: 1,
    fmt: function (v) { return v; }, onInput: function (v) { S.i = v - 1; update(); } });
  ui.button("Siguiente ejemplo →", function () { S.i = (S.i + 1) % nEj(); si.set(S.i + 1, true); update(); }, "primary");
  var C0 = api.colors();
  api.legend(root, [[C0.cobalto, "entrada (lo que ve la red)"], [C0.terracota, "respuesta (lo que debe adivinar)"], [C0.line, "fuera de este ejemplo"]]);
  var tabla = api.table(root, ["Ejemplo", "Entrada", "Respuesta"]);

  function draw(ctx, w, h, C) {
    plot.axes(ctx);
    var bw = Math.max(10, (plot.x(2) - plot.x(1)) * 0.62), t;
    for (t = 0; t < serie.length; t++) {
      var enVentana = t >= S.i && t < S.i + S.k, esResp = t === S.i + S.k;
      var col = enVentana ? C.cobalto : esResp ? C.terracota : C.line;
      var x = plot.x(t + 1) - bw / 2, y = plot.y(serie[t]);
      api.d.rect(ctx, x, y, bw, plot.y(0) - y, col);
      api.d.text(ctx, String(serie[t]), plot.x(t + 1), y - 5, { align: "center", size: 12, weight: 600, color: enVentana || esResp ? C.ink : C.muted });
    }
    var x0 = plot.x(S.i + 1) - bw / 2 - 4, x1 = plot.x(S.i + S.k) + bw / 2 + 4;
    api.d.rect(ctx, x0, plot.box.y - 18, x1 - x0, plot.y(0) - plot.box.y + 18, null, C.cobalto, 1.5);
    api.d.text(ctx, "ventana", (x0 + x1) / 2, plot.box.y - 6, { align: "center", size: 11, color: C.cobaltoInk, weight: 600 });
  }

  function update() {
    view.redraw();
    var ent = serie.slice(S.i, S.i + S.k), resp = serie[S.i + S.k], filas = [], j;
    for (j = 0; j < nEj(); j++) filas.push([String(j + 1) + (j === S.i ? " ◀" : ""), serie.slice(j, j + S.k).join(", "), String(serie[j + S.k])]);
    tabla.set(filas);
    out.set("Ejemplo " + (S.i + 1) + ": entrada <b>" + ent.join(", ") + "</b> → respuesta <b>" + resp + "</b><br>" +
      "Con " + serie.length + " semanas y ventana " + S.k + " salen " + serie.length + " − " + S.k + " = <b>" + nEj() + "</b> ejemplos.<br>" +
      "Tensor para Keras: <b>(" + nEj() + ", " + S.k + ", 1)</b> = (ejemplos, pasos, variables)" +
      (S.k >= 5 ? "<br><span class='bad'>Ventana muy larga: con solo " + serie.length + " semanas apenas quedan ejemplos para aprender.</span>" : ""));
  }
  view.draw(draw); update();
});
