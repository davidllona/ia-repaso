/* Experimento: impureza de un nodo (Gini y entropía) según la mezcla de clases. */
Lab.register("curso1/c1m3-impureza", function (root, api) {
  var N = 20, k = 8, D = api.d;

  function gini(p) { return 1 - p * p - (1 - p) * (1 - p); }
  function ent(p) { return (p <= 0 || p >= 1) ? 0 : -p * Math.log2(p) - (1 - p) * Math.log2(1 - p); }
  function f3(v) { return (Math.abs(v) < 5e-4 ? 0 : v).toFixed(3); }

  var vDots = api.view(root, { aspect: 5.5, minH: 56, maxH: 120, label: "Clientes del nodo: los que cancelan en naranja y los que se quedan en azul" });
  var vCurve = api.view(root, { aspect: 1.9, minH: 220, label: "Curvas de Gini y de entropía según la proporción de clientes que cancelan" });
  var plot = api.plot(vCurve, { xr: [0, 1], yr: [0, 1], xticks: 5, yticks: 5, xlabel: "proporción p de clientes que cancelan en el nodo",
    ylabel: "impureza", pad: { l: 46, r: 14, t: 16, b: 38 }, xfmt: function (v) { return v.toFixed(1); }, yfmt: function (v) { return v.toFixed(1); } });
  var ui = api.controls(root), out = api.readout(root);
  var sK = ui.slider({ label: "Clientes que cancelan", min: 0, max: N, step: 1, value: k, onInput: function (v) { k = v; update(); } });
  var sN = ui.slider({ label: "Clientes en el nodo", min: 4, max: 40, step: 2, value: N, onInput: function (v) {
    N = v; k = Math.min(k, N); sK.input.max = N; sK.set(k, true); update(); } });
  api.legend(root, [[api.colors().cobalto, "se quedan"], [api.colors().terracota, "cancelan"], [api.colors().ink, "curva de Gini"], [api.colors().oliva, "curva de entropía"]]);

  vDots.draw(function (ctx, w, h, C) {
    var perRow = Math.min(N, 20), rows = Math.ceil(N / perRow);
    var r = Math.max(4, Math.min(11, (w - 24) / (perRow * 2.5), (h - 10) / (rows * 2.5)));
    var gap = r * 2.5, x0 = w / 2 - (perRow - 1) * gap / 2, y0 = h / 2 - (rows - 1) * gap / 2;
    for (var i = 0; i < N; i++) {
      var cx = x0 + (i % perRow) * gap, cy = y0 + Math.floor(i / perRow) * gap;
      D.circle(ctx, cx, cy, r, i < k ? C.terracota : C.cobalto, C.paper, 1.5);
    }
  });

  vCurve.draw(function (ctx, w, h, C) {
    plot.axes(ctx);
    var i, g = [], e = [], p = k / N;
    for (i = 0; i <= 100; i++) { var q = i / 100; g.push([plot.x(q), plot.y(gini(q))]); e.push([plot.x(q), plot.y(ent(q))]); }
    D.path(ctx, g, C.ink, 2.5);
    D.path(ctx, e, C.oliva, 2.5);
    D.line(ctx, plot.x(p), plot.box.y, plot.x(p), plot.box.y + plot.box.h, C.muted, 1.2, [4, 3]);
    D.circle(ctx, plot.x(p), plot.y(gini(p)), 6, C.ink, C.paper, 2);
    D.circle(ctx, plot.x(p), plot.y(ent(p)), 6, C.oliva, C.paper, 2);
  });

  function update() {
    var p = k / N, q = 1 - p;
    vDots.redraw(); vCurve.redraw();
    var pure = (k === 0 || k === N);
    out.set("Nodo con <b>" + N + "</b> clientes: <b>" + k + "</b> cancelan y <b>" + (N - k) + "</b> se quedan → p = " + k + "/" + N + " = <b>" + p.toFixed(2) + "</b><br>" +
      "Gini = 1 − " + p.toFixed(2) + "² − " + q.toFixed(2) + "² = <b>" + f3(gini(p)) + "</b><br>" +
      "Entropía = −" + p.toFixed(2) + "·log₂(" + p.toFixed(2) + ") − " + q.toFixed(2) + "·log₂(" + q.toFixed(2) + ") = <b>" + f3(ent(p)) + "</b> bits" +
      (pure ? "<br><span class='good'>Nodo puro: todos son de la misma clase, impureza 0. No hace falta preguntar nada más.</span>" :
        (Math.abs(p - 0.5) < 1e-9 ? "<br><span class='bad'>Mezcla 50/50: es el peor caso (Gini 0.5, entropía 1). El nodo no sabe qué decir.</span>" : "")));
  }
  update();
});
