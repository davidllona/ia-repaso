/* Experimento: con dos variables casi iguales (colinealidad) los pesos de la regresión múltiple se vuelven inestables. */
Lab.register("curso1/c1m2-colinealidad", function (root, api) {
  var M = api.math, S = 60, maxN = 200;
  var rho = 0.2, N = 40, seed = 3, draws = [];
  var TRUE = [3, 3];                              // y = 3·x1 + 3·x2 + ruido (en unidades estandarizadas)

  function gen() {
    var r = api.rng(seed), s, k; draws = [];
    for (s = 0; s < S; s++) {
      var d = [];
      for (k = 0; k < maxN; k++) d.push([r.normal(0, 1), r.normal(0, 1), r.normal(0, 1)]);
      draws.push(d);
    }
  }
  // Ajusta y = θ0 + θ1·x1 + θ2·x2 a la muestra s (con N coches) para la correlación rho actual.
  function fit(s, withData) {
    var d = draws[s], k, A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], b = [0, 0, 0], k2 = Math.sqrt(1 - rho * rho), pts = [];
    for (k = 0; k < N; k++) {
      var x1 = d[k][0], x2 = rho * d[k][0] + k2 * d[k][1], y = 10 + TRUE[0] * x1 + TRUE[1] * x2 + 3 * d[k][2], f = [1, x1, x2], a, c;
      for (a = 0; a < 3; a++) { b[a] += f[a] * y; for (c = 0; c < 3; c++) A[a][c] += f[a] * f[c]; }
      if (withData) pts.push([x1, x2]);
    }
    var th = M.solve(A, b);
    return withData ? { th: th, pts: pts } : th;
  }

  var row = api.el("div", { class: "lab-row" }); root.appendChild(row);
  var boxA = api.el("div"), boxB = api.el("div"); row.appendChild(boxA); row.appendChild(boxB);
  var vA = api.view(boxA, { aspect: 1.15, minH: 230, label: "Las dos variables de una muestra de coches: cuanto más correlación, más pegadas a la diagonal" });
  var pA = api.plot(vA, { xr: [-3, 3], yr: [-3, 3], xticks: 6, yticks: 6, xlabel: "variable 1 (estandarizada)", ylabel: "variable 2", pad: { l: 40, r: 10, t: 10, b: 38 } });
  var vB = api.view(boxB, { aspect: 1.15, minH: 230, label: "Pesos θ1 y θ2 obtenidos en 60 muestras distintas de coches" });
  var pB = api.plot(vB, { xr: [-4, 10], yr: [-4, 10], xticks: 7, yticks: 7, xlabel: "peso θ₁ de la variable 1", ylabel: "peso θ₂ de la variable 2", pad: { l: 40, r: 10, t: 10, b: 38 } });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Correlación entre las dos variables (ρ)", min: 0, max: 0.995, step: 0.005, value: rho, fmt: function (v) { return v.toFixed(3); }, onInput: function (v) { rho = v; update(); } });
  ui.slider({ label: "Coches por muestra", min: 20, max: 200, step: 10, value: N, onInput: function (v) { N = v; update(); } });
  ui.button("Otras 60 muestras", function () { seed += 11; gen(); update(); }, "primary");

  function drawA(ctx, w, h, C) {
    var D = api.d, f = fit(0, true);
    pA.axes(ctx); ctx.save(); pA.clip(ctx);
    f.pts.forEach(function (p) { D.circle(ctx, pA.x(p[0]), pA.y(p[1]), 3.5, C.cobalto, C.paper, 1); });
    ctx.restore();
  }
  function drawB(ctx, w, h, C) {
    var D = api.d, s, ths = [];
    pB.axes(ctx); ctx.save(); pB.clip(ctx);
    // recta θ1 + θ2 = 6 (la combinación que sí se estima bien)
    D.line(ctx, pB.x(-4), pB.y(10), pB.x(10), pB.y(-4), C.muted, 1.5, [5, 4]);
    for (s = 0; s < S; s++) { var th = fit(s); ths.push(th); D.circle(ctx, pB.x(th[1]), pB.y(th[2]), 3.5, C.terracota, C.paper, 1); }
    D.circle(ctx, pB.x(TRUE[0]), pB.y(TRUE[1]), 7, C.marker, C.ink, 2.5);
    ctx.restore();
    D.text(ctx, "círculo amarillo = valores reales (3, 3)", pB.box.x + 6, pB.box.y + pB.box.h - 8, { size: 10.5, color: C.ink2 });
    D.text(ctx, "línea de puntos: θ₁ + θ₂ = 6", pB.box.x + pB.box.w - 6, pB.box.y + 15, { size: 10.5, color: C.muted, align: "right" });
    return ths;
  }
  function update() {
    vA.redraw(); vB.redraw();
    var t1 = [], t2 = [], sm = [], s;
    for (s = 0; s < S; s++) { var th = fit(s); t1.push(th[1]); t2.push(th[2]); sm.push(th[1] + th[2]); }
    out.set("Correlación ρ = <b>" + rho.toFixed(3) + "</b> con " + N + " coches por muestra<br>" +
      "Peso θ₁: media <b>" + M.mean(t1).toFixed(2) + "</b>, varía ± <b>" + M.std(t1).toFixed(2) + "</b> · Peso θ₂: media <b>" + M.mean(t2).toFixed(2) + "</b>, varía ± <b>" + M.std(t2).toFixed(2) + "</b><br>" +
      "Suma θ₁ + θ₂: media <b>" + M.mean(sm).toFixed(2) + "</b>, varía solo ± <b>" + M.std(sm).toFixed(2) + "</b>" +
      (M.std(t1) > 1.2 ? "<br><span class='bad'>Los pesos individuales bailan de una muestra a otra, aunque la suma se mantiene estable.</span>" : "<br><span class='good'>Con variables poco relacionadas, cada peso se estima con estabilidad.</span>"));
  }
  gen(); vA.draw(drawA); vB.draw(drawB); update();
});
