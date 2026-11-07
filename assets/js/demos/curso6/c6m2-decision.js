/* Experimento: matriz de decisión ponderada para elegir framework. Las notas (1–5) salen de lo medido en
   el módulo (accuracy empatada, 9 frente a 21 líneas, latencias, formatos de despliegue); los pesos los
   pone el proyecto. Se ve que «el mejor framework» depende de qué pesa más en tu caso. */
Lab.register("curso6/c6m2-decision", function (root, api) {
  var CRIT = [
    { id: "rend", nombre: "Rendimiento medido", k: 4, p: 4, porque: "accuracy 0,932 ± 0,031 frente a 0,948 ± 0,010: empate" },
    { id: "proto", nombre: "Prototipar rápido", k: 5, p: 3, porque: "9 líneas con fit y callbacks frente a 21 de bucle" },
    { id: "ctrl", nombre: "Control e investigación", k: 3, p: 5, porque: "bucle a mano y la mayoría de modelos nuevos se publican en PyTorch" },
    { id: "movil", nombre: "Despliegue móvil o web", k: 5, p: 3, porque: "LiteRT (TFLite) y TF.js muy rodados; ExecuTorch y ONNX, más jóvenes" },
    { id: "equipo", nombre: "Lo que sabe el equipo", k: 3, p: 3, porque: "" }
  ];
  var PRESETS = {
    clase: { rend: 3, proto: 4, ctrl: 2, movil: 1, equipo: 3 },
    movil: { rend: 3, proto: 2, ctrl: 1, movil: 5, equipo: 2 },
    lab: { rend: 3, proto: 2, ctrl: 5, movil: 0, equipo: 2 }
  };
  var W = { rend: 3, proto: 4, ctrl: 2, movil: 1, equipo: 3 }, EQ = "ninguno", sliders = {};

  var view = api.view(root, { aspect: 3.2, minH: 150, maxH: 220, label: "Dos barras apiladas con la puntuación ponderada de Keras y de PyTorch, un tramo por criterio" });
  var ui = api.controls(root), out = api.readout(root);
  ui.segmented({ label: "Tipo de proyecto", value: "clase", options: [["clase", "Proyecto de curso"], ["movil", "App móvil"], ["lab", "Investigación"]],
    onChange: function (v) { var p = PRESETS[v]; for (var k in p) { W[k] = p[k]; sliders[k].set(p[k], true); } update(); } });
  CRIT.forEach(function (c) {
    sliders[c.id] = ui.slider({ label: "Peso: " + c.nombre.toLowerCase(), min: 0, max: 5, step: 1, value: W[c.id],
      fmt: function (v) { return v; }, onInput: function (v) { W[c.id] = v; update(); } });
  });
  ui.select({ label: "El equipo ya domina", value: EQ, options: [["ninguno", "Ninguno de los dos"], ["keras", "Keras"], ["torch", "PyTorch"]],
    onChange: function (v) { EQ = v; update(); } });
  var C0 = api.colors(), COLS = [C0.cobalto, C0.terracota, C0.oliva, C0.marker, C0.ink2];
  api.legend(root, CRIT.map(function (c, i) { return [COLS[i], c.nombre]; }));

  function notas() {
    CRIT[4].k = EQ === "keras" ? 5 : EQ === "torch" ? 2 : 3;
    CRIT[4].p = EQ === "torch" ? 5 : EQ === "keras" ? 2 : 3;
    var suma = 0; CRIT.forEach(function (c) { suma += W[c.id]; });
    var r = { k: 0, p: 0, partes: [], suma: suma };
    CRIT.forEach(function (c) {
      var pk = suma ? W[c.id] * c.k / suma : 0, pp = suma ? W[c.id] * c.p / suma : 0;
      r.k += pk; r.p += pp; r.partes.push([pk, pp]);
    });
    return r;
  }

  function draw(ctx, w, h, C) {
    var r = notas(), cols = [C.cobalto, C.terracota, C.oliva, C.marker, C.ink2];
    var left = 72, right = w - 44, bh = Math.min(52, (h - 50) / 2.6), ys = [16, 16 + bh + 18];
    var xs = function (v) { return left + (right - left) * v / 5; };
    for (var t = 0; t <= 5; t++) {
      api.d.line(ctx, xs(t), 8, xs(t), ys[1] + bh + 6, C.line, 1, [2, 3]);
      api.d.text(ctx, String(t), xs(t), ys[1] + bh + 20, { align: "center", size: 10, color: C.muted });
    }
    ["Keras", "PyTorch"].forEach(function (nom, j) {
      var x = left;
      api.d.text(ctx, nom, left - 8, ys[j] + bh / 2 + 4, { align: "right", size: 12, weight: 600 });
      r.partes.forEach(function (p, i) {
        var ancho = xs(p[j]) - left;
        if (ancho > 0) { api.d.rect(ctx, x, ys[j], ancho, bh, cols[i], C.paper, 1); x += ancho; }
      });
      api.d.text(ctx, (j ? r.p : r.k).toFixed(2), x + 6, ys[j] + bh / 2 + 4, { size: 12, weight: 700 });
    });
  }

  function update() {
    view.redraw();
    var r = notas();
    if (!r.suma) { out.set("Pon algún peso por encima de 0."); return; }
    var dif = r.k - r.p, gana = dif > 0 ? "Keras" : "PyTorch", rel = Math.abs(dif) / Math.max(r.k, r.p);
    out.set("Keras <b>" + r.k.toFixed(2) + "</b> · PyTorch <b>" + r.p.toFixed(2) + "</b> (sobre 5)<br>" +
      (rel < 0.05 ? "<span class='good'>Empate práctico (menos de un 5 %): decide lo que el equipo mantendrá mejor.</span>"
        : "Gana <b>" + gana + "</b> por " + Math.abs(dif).toFixed(2) + " puntos. El rendimiento empatado no decide: deciden los pesos."));
  }
  view.draw(draw); update();
});
