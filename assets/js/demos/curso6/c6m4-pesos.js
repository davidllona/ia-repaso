/* Experimento: la tabla comparativa no elige sola; elige con los pesos que tú pones. Cuatro modelos de ejemplo
   (CNN Keras, CNN PyTorch, ViT afinado, híbrido CNN-ViT) y cuatro criterios. Cada criterio se normaliza de 0 a 1
   (min-max; en tiempo y tamaño, menos es mejor) y la nota final es la media ponderada. Mismos números que el fragmento. */
Lab.register("curso6/c6m4-pesos", function (root, api) {
  var D = api.d;
  var MOD = ["CNN Keras", "CNN PyTorch", "ViT afinado", "Híbrido CNN-ViT"];
  var CRIT = [
    { k: "acc", nom: "Accuracy", v: [0.905, 0.910, 0.955, 0.940], sube: true },
    { k: "min", nom: "Tiempo de entrenamiento", v: [6, 5, 25, 15], sube: false },
    { k: "mb", nom: "Tamaño en disco", v: [4.8, 4.8, 330, 40], sube: false },
    { k: "dep", nom: "Facilidad de despliegue", v: [5, 4, 3, 2], sube: true }
  ];
  CRIT.forEach(function (c) {
    var mn = Math.min.apply(null, c.v), mx = Math.max.apply(null, c.v);
    c.n = c.v.map(function (x) { var t = (x - mn) / (mx - mn); return c.sube ? t : 1 - t; });
  });
  var W = [1, 1, 1, 1];

  var view = api.view(root, { aspect: 1.9, minH: 220, maxH: 300, label: "Barras con la nota ponderada de cada modelo según los pesos elegidos" });
  var ui = api.controls(root), out = api.readout(root);
  var sl = CRIT.map(function (c, i) {
    return ui.slider({ label: "Peso · " + c.nom, min: 0, max: 3, step: 1, value: W[i], fmt: function (v) { return v; }, onInput: function (v) { W[i] = v; update(); } });
  });
  function preset(p) { p.forEach(function (v, i) { W[i] = v; sl[i].set(v, true); }); update(); }
  ui.button("Solo accuracy", function () { preset([1, 0, 0, 0]); });
  ui.button("App en el móvil", function () { preset([2, 0, 2, 1]); }, "primary");
  ui.button("Todo igual", function () { preset([1, 1, 1, 1]); });

  function notas() {
    var sw = W.reduce(function (a, b) { return a + b; }, 0);
    return MOD.map(function (_, m) {
      if (!sw) return 0;
      var s = 0; CRIT.forEach(function (c, i) { s += W[i] * c.n[m]; });
      return s / sw;
    });
  }

  function draw(ctx, w, h, C) {
    var t = notas(), best = t.indexOf(Math.max.apply(null, t)), sw = W.reduce(function (a, b) { return a + b; }, 0);
    var lw = w < 420 ? 104 : 140, x0 = lw + 8, x1 = w - 52, bh = Math.min(34, (h - 40) / 4 - 10), i;
    for (i = 0; i <= 4; i++) {
      var gx = x0 + (x1 - x0) * i / 4;
      D.line(ctx, gx, 10, gx, h - 24, C.line, 1);
      D.text(ctx, (i / 4).toFixed(2).replace(".", ","), gx, h - 8, { align: "center", size: 10, mono: true, color: C.muted });
    }
    MOD.forEach(function (m, k) {
      var y = 16 + k * (bh + 12), win = sw && k === best;
      D.text(ctx, w < 420 ? m.replace("Híbrido CNN-ViT", "Híbrido") : m, lw, y + bh / 2 + 4, { align: "right", size: 12, color: C.ink, weight: win ? 600 : 400 });
      D.rect(ctx, x0, y, (x1 - x0) * t[k], bh, win ? C.oliva : C.cobaltoWash, win ? null : C.cobalto, 1);
      D.text(ctx, t[k].toFixed(3).replace(".", ","), x0 + (x1 - x0) * t[k] + 6, y + bh / 2 + 4, { size: 11, mono: true, color: win ? C.olivaInk : C.ink2, weight: win ? 600 : 400 });
    });
  }

  function update() {
    view.redraw();
    var t = notas(), sw = W.reduce(function (a, b) { return a + b; }, 0);
    if (!sw) { out.set("<span class='bad'>Todos los pesos a 0: sin criterios no hay ganador.</span>"); return; }
    var orden = t.map(function (v, i) { return [v, i]; }).sort(function (a, b) { return b[0] - a[0]; });
    var g = orden[0][1], partes = [];
    CRIT.forEach(function (c, i) { if (W[i]) partes.push(W[i] + "·" + c.n[g].toFixed(2).replace(".", ",")); });
    var margen = orden[0][0] - orden[1][0];
    out.set("Gana <b>" + MOD[g] + "</b>: (" + partes.join(" + ") + ") / " + sw + " = <b>" + orden[0][0].toFixed(3).replace(".", ",") + "</b><br>" +
      "Segundo: " + MOD[orden[1][1]] + " a " + margen.toFixed(3).replace(".", ",") + " puntos" +
      (margen < 0.05 ? "<br><span class='bad'>Empate técnico: justifica con otro argumento (equipo, despliegue, riesgo).</span>" : ""));
  }
  view.draw(draw); update();
});
