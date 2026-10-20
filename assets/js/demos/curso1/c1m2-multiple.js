/* Experimento: regresión múltiple. Cada variable aporta peso × valor; «manteniendo lo demás constante». */
Lab.register("curso1/c1m2-multiple", function (root, api) {
  var M = api.math, r = api.rng(8), n = 400, rows = [], i;
  // Coches inventados con una receta conocida (la "verdad"), igual que en el fragmento de código.
  var extra = { X: 0, D: 25, E: -40 };
  for (i = 0; i < n; i++) {
    var mo = Math.round(M.clamp(r.normal(3.3, 1.3), 1, 6.5) * 10) / 10;
    var ci = M.clamp(2 * Math.round(1 + 0.65 * mo + r.normal(0, 0.35)), 4, 12);
    var co = Math.max(4.1, 4 + 1.9 * mo + 0.35 * ci + r.normal(0, 1.5));
    var u = r.next(), fu = u < 0.8 ? "X" : (u < 0.9 ? "D" : "E");
    rows.push({ f: [1, mo, ci, co, fu === "D" ? 1 : 0, fu === "E" ? 1 : 0], y: 60 + 12 * mo + 4 * ci + 12 * co + extra[fu] + r.normal(0, 22) });
  }
  // Mínimos cuadrados con las ecuaciones normales (XᵀX θ = Xᵀy)
  var p = 6, A = [], b = [], a, c;
  for (a = 0; a < p; a++) { A.push(new Array(p).fill(0)); b.push(0); }
  rows.forEach(function (rw) { for (a = 0; a < p; a++) { b[a] += rw.f[a] * rw.y; for (c = 0; c < p; c++) A[a][c] += rw.f[a] * rw.f[c]; } });
  var th = M.solve(A, b);
  var names = ["intercepto", "motor (L)", "cilindros", "consumo (L/100 km)", "es diésel", "es etanol"];

  var car = { mo: 2.0, ci: 4, co: 8.0, fu: "X" }, ref = null;
  var view = api.view(root, { aspect: 2.1, minH: 250, label: "Cascada que suma las aportaciones de cada variable hasta la predicción de emisiones" });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Motor (litros)", min: 1, max: 6, step: 0.1, value: car.mo, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { car.mo = v; update(); } });
  ui.slider({ label: "Cilindros", min: 4, max: 12, step: 2, value: car.ci, onInput: function (v) { car.ci = v; update(); } });
  ui.slider({ label: "Consumo (L/100 km)", min: 4, max: 20, step: 0.1, value: car.co, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { car.co = v; update(); } });
  ui.segmented({ label: "Combustible", options: [["X", "Gasolina"], ["D", "Diésel"], ["E", "Etanol"]], value: "X", onChange: function (v) { car.fu = v; update(); } });
  ui.button("Fijar este coche como referencia", function () { ref = terms(); update(); }, "primary");
  ui.button("Quitar referencia", function () { ref = null; update(); });

  function terms() {
    return [th[0], th[1] * car.mo, th[2] * car.ci, th[3] * car.co, th[4] * (car.fu === "D" ? 1 : 0), th[5] * (car.fu === "E" ? 1 : 0)];
  }
  function total(t) { return M.sum(t); }
  function draw(ctx, w, h, C) {
    var D = api.d, t = terms(), L = Math.min(150, w * 0.34), R = 56, T = 14, rowH = (h - T - 26) / 7, x0 = L, W = w - L - R;
    var maxV = 480, X = function (v) { return x0 + v / maxV * W; };
    var cols = [C.muted, C.cobalto, C.cobalto, C.cobalto, C.marker, C.marker], run = 0, k;
    for (var g = 0; g <= 4; g++) {
      var gv = g * 120; D.line(ctx, X(gv), T, X(gv), h - 26, C.line, 1);
      D.text(ctx, String(gv), X(gv), h - 10, { size: 10, align: "center", color: C.muted, mono: true });
    }
    for (k = 0; k < 6; k++) {
      var y = T + k * rowH + 3, v = t[k], s = Math.min(Math.max(run, 0), maxV), e = Math.min(Math.max(run + v, 0), maxV);
      if (ref) { var rr = 0; for (var q = 0; q < k; q++) rr += ref[q]; D.rect(ctx, X(Math.min(rr, rr + ref[k])), y - 1, Math.abs(X(rr + ref[k]) - X(rr)), rowH - 4, null, C.ink2, 1.2); }
      D.rect(ctx, Math.min(X(s), X(e)), y + 1, Math.max(2, Math.abs(X(e) - X(s))), rowH - 8, cols[k], null);
      D.text(ctx, names[k], L - 8, y + rowH / 2 + 1, { size: 11, align: "right", color: C.ink2, baseline: "middle" });
      D.text(ctx, (v >= 0 ? "+" : "") + v.toFixed(1), Math.max(X(s), X(e)) + 5, y + rowH / 2 + 1, { size: 11, color: C.ink, mono: true, baseline: "middle" });
      run += v;
    }
    var yT = T + 6 * rowH + 3, tt = total(t);
    D.rect(ctx, x0, yT + 1, X(tt) - x0, rowH - 8, C.terracota, null);
    D.text(ctx, "ŷ = suma", L - 8, yT + rowH / 2 + 1, { size: 11, align: "right", color: C.terracotaInk, weight: 600, baseline: "middle" });
    D.text(ctx, tt.toFixed(1), X(tt) + 5, yT + rowH / 2 + 1, { size: 11, color: C.terracotaInk, mono: true, weight: 600, baseline: "middle" });
  }
  function update() {
    view.redraw();
    var t = terms(), tt = total(t);
    var s = "Pesos aprendidos: " + names.slice(1).map(function (nm, k) { return nm + " <b>" + th[k + 1].toFixed(1) + "</b>"; }).join(" · ") + "<br>" +
      "Predicción: ŷ = <b>" + tt.toFixed(1) + " g/km</b>";
    if (ref) { var d = tt - total(ref); s += "<br>Frente a la referencia: <b>" + (d >= 0 ? "+" : "") + d.toFixed(1) + " g/km</b>"; }
    s += "<br>Subir 1 L de motor <i>manteniendo lo demás constante</i> suma <b>" + th[1].toFixed(1) + " g/km</b> (la verdad era 12).";
    out.set(s);
  }
  view.draw(draw); update();
});
