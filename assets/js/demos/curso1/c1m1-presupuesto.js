/* Experimento: optimización de decisiones. Repartir 100.000 € para anunciar el estreno de una película entre canales con rendimientos decrecientes. */
Lab.register("curso1/c1m1-presupuesto", function (root, api) {
  var CAN = [["YouTube", 2], ["Instagram", Math.sqrt(3)], ["TikTok", Math.sqrt(2)], ["Email", 1]], TOTAL = 100, S = 3;
  var w = [25, 25, 25, 25], sl = [];
  var ui = api.controls(root);
  CAN.forEach(function (c, i) {
    sl.push(ui.slider({ label: c[0] + " (peso)", min: 0, max: 100, step: 5, value: w[i], onInput: function (v) { w[i] = v; update(); } }));
  });
  ui.button("Reparto igual", function () { set([25, 25, 25, 25]); });
  ui.button("Todo en YouTube", function () { set([100, 0, 0, 0]); });
  ui.button("Reparto óptimo", function () { set(CAN.map(function (c) { return c[1] * c[1] * 10; })); }, "primary");
  var tabla = api.table(root, ["Canal", "Inv. k€", "Ventas k€", "Último €"]);
  (function () { var st = document.createElement("style"); st.textContent = ".lab-table.c1m1-tb td,.lab-table.c1m1-tb th{padding:.3rem .28rem!important}@media (max-width:560px){.lab-table.c1m1-tb{font-size:.7rem!important}.lab-table.c1m1-tb th{font-size:.6rem!important}}"; root.appendChild(st); tabla.el.firstChild.classList.add("c1m1-tb"); })();
  var out = api.readout(root);

  function set(v) { w = v.slice(); sl.forEach(function (s, i) { s.set(w[i], true); }); update(); }
  function reparto(pesos) {
    var t = pesos.reduce(function (a, b) { return a + b; }, 0);
    return pesos.map(function (p) { return t ? TOTAL * p / t : TOTAL / pesos.length; });
  }
  /* Ventas (miles de €) = 3 · a · √inversión (miles de €): cada euro extra rinde menos que el anterior. */
  function ventas(x) { return x.reduce(function (s, xi, i) { return s + S * CAN[i][1] * Math.sqrt(xi); }, 0); }
  function update() {
    var x = reparto(w), tot = ventas(x), opt = reparto(CAN.map(function (c) { return c[1] * c[1]; })), vOpt = ventas(opt), vIgual = ventas([25, 25, 25, 25]);
    tabla.set(x.map(function (xi, i) {
      var marg = xi > 0 ? S * CAN[i][1] / (2 * Math.sqrt(xi)) : Infinity;
      return [CAN[i][0], xi.toFixed(1), (S * CAN[i][1] * Math.sqrt(xi)).toFixed(1), isFinite(marg) ? marg.toFixed(3) : "∞"];
    }));
    out.set("Tu reparto de <b>100.000 €</b> genera <b>" + tot.toFixed(1) + " k€</b> de ventas esperadas<br>" +
      "Reparto igual (25 % cada uno): <b>" + vIgual.toFixed(1) + " k€</b> · reparto óptimo (" + opt.map(function (o) { return Math.round(o); }).join(" / ") + " k€): <b>" + vOpt.toFixed(1) + " k€</b><br>" +
      (tot >= vOpt - 0.05 ? "<span class='good'>Has encontrado el óptimo: el último euro rinde lo mismo en todos los canales.</span>" : "<span class='bad'>Te faltan " + (vOpt - tot).toFixed(1) + " k€ respecto al óptimo.</span> Pasa dinero de un canal donde el «último €» rinde poco a otro donde rinde mucho."));
  }
  update();
});
