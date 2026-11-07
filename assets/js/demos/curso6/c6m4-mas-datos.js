/* Experimento: «con más datos iría mejor», ¿cuánto mejor? Curva de aprendizaje REAL del fragmento de la lección
   (regresión logística sobre pósters sintéticos de 16×16, test fijo de 2.000): accuracy de entrenamiento y de test
   para 25 … 1.600 pósters. Eliges un tamaño y ves cuánto se gana al duplicarlo y cuánto queda de brecha. */
Lab.register("curso6/c6m4-mas-datos", function (root, api) {
  var D = api.d;
  var N = [25, 50, 100, 200, 400, 800, 1600];
  var TR = [1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 0.978];
  var TE = [0.659, 0.742, 0.804, 0.839, 0.848, 0.862, 0.862];
  var S = { i: 2 };

  var view = api.view(root, { aspect: 1.8, minH: 240, maxH: 330, label: "Curva de aprendizaje: accuracy de entrenamiento y de test frente al número de pósters, en escala logarítmica" });
  var p = api.plot(view, { xr: [0, 6], yr: [0.6, 1.0], xticks: 6, yticks: 4, xlabel: "pósters de entrenamiento (cada paso, el doble)", ylabel: "accuracy",
    pad: { l: 50, r: 16, t: 20, b: 42 }, xfmt: function (v) { return N[Math.round(v)] || ""; }, yfmt: function (v) { return v.toFixed(1); } });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Pósters de entrenamiento", min: 0, max: 6, step: 1, value: S.i, fmt: function (v) { return N[v]; }, onInput: function (v) { S.i = v; update(); } });
  var C0 = api.colors();
  api.legend(root, [[C0.cobalto, "entrenamiento"], [C0.terracota, "test"]]);

  function draw(ctx, w, h, C) {
    p.axes(ctx);
    var k;
    D.path(ctx, TR.map(function (v, j) { return [p.x(j), p.y(v)]; }), C.cobalto, 2.5);
    D.path(ctx, TE.map(function (v, j) { return [p.x(j), p.y(v)]; }), C.terracota, 2.5);
    for (k = 0; k < N.length; k++) {
      D.circle(ctx, p.x(k), p.y(TR[k]), k === S.i ? 6 : 3.5, C.cobalto);
      D.circle(ctx, p.x(k), p.y(TE[k]), k === S.i ? 6 : 3.5, C.terracota);
    }
    var x = p.x(S.i);
    D.line(ctx, x, p.y(TE[S.i]), x, p.y(TR[S.i]), C.ink2, 1.5, [4, 3]);
    var gap = TR[S.i] - TE[S.i];
    D.text(ctx, "brecha " + gap.toFixed(3).replace(".", ","), S.i > 3 ? x - 8 : x + 8, (p.y(TE[S.i]) + p.y(TR[S.i])) / 2 + 4,
      { align: S.i > 3 ? "right" : "left", size: 11, mono: true, color: C.ink2 });
  }

  function update() {
    view.redraw();
    var i = S.i, f = function (v) { return v.toFixed(3).replace(".", ","); };
    var msg = "Con <b>" + N[i] + "</b> pósters: test <b>" + f(TE[i]) + "</b>, entrenamiento " + f(TR[i]) + ".<br>";
    if (i < N.length - 1) {
      var gan = (TE[i + 1] - TE[i]) * 100;
      msg += "Duplicar a " + N[i + 1] + " gana <b>" + gan.toFixed(1).replace(".", ",") + " puntos</b> de test. " +
        (gan >= 3 ? "<span class='good'>Aquí más datos sí es un buen próximo paso.</span>" : "<span class='bad'>Casi nada: más pósters ya no es la palanca; prueba otro modelo o mejores etiquetas.</span>");
    } else {
      msg += "De 800 a 1.600 la ganancia fue <b>0,0 puntos</b>: este modelo ha tocado techo.";
    }
    out.set(msg);
  }
  view.draw(draw); update();
});
