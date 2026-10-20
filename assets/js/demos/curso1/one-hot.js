/* Experimento: codificar categorías con números inventa distancias que no existen. */
Lab.register("curso1/one-hot", function (root, api) {
  var plans = ["Basic", "Standard", "Premium"], A = 0, B = 2;
  var view = api.view(root, { aspect: 2.3, minH: 220, label: "Comparación de dos codificaciones de la categoría plan" });
  var ui = api.controls(root), out = api.readout(root);
  ui.select({ label: "Plan A", options: plans.map(function (p, i) { return [i, p]; }), value: A, onChange: function (v) { A = +v; update(); } });
  ui.select({ label: "Plan B", options: plans.map(function (p, i) { return [i, p]; }), value: B, onChange: function (v) { B = +v; update(); } });
  var tbl = api.table(root, ["Codificación", "Plan A", "Plan B", "Distancia A–B"]);

  function draw(ctx, w, h, C) {
    var D = api.d, half = w / 2;
    D.text(ctx, "Con números: Basic=1, Standard=2, Premium=3", half / 2, 20, { size: 12, align: "center", weight: 600, color: C.ink });
    D.text(ctx, "One-Hot: una columna por plan", half + half / 2, 20, { size: 12, align: "center", weight: 600, color: C.ink });
    D.line(ctx, half, 8, half, h - 8, C.line, 1);
    // izquierda: recta numérica
    var y = h * 0.58, x0 = 40, x1 = half - 40;
    function X(i) { return x0 + (x1 - x0) * i / 2; }
    D.line(ctx, x0 - 10, y, x1 + 10, y, C.ink, 2);
    plans.forEach(function (p, i) {
      var sel = i === A || i === B;
      D.circle(ctx, X(i), y, sel ? 10 : 7, sel ? C.terracota : C.muted, C.paper, 2);
      D.text(ctx, p, X(i), y + 30, { size: 12, align: "center", weight: sel ? 600 : 400, color: C.ink });
      D.text(ctx, String(i + 1), X(i), y - 18, { size: 12, align: "center", mono: true, color: C.muted });
    });
    if (A !== B) { D.line(ctx, X(A), y - 36, X(B), y - 36, C.terracota, 3); D.text(ctx, "distancia " + Math.abs(A - B), (X(A) + X(B)) / 2, y - 44, { size: 12, align: "center", color: C.terracotaInk, weight: 600 }); }
    // derecha: triángulo equilátero
    var cx = half + half / 2, cy = h * 0.6, R = Math.min(half / 2 - 40, h * 0.34);
    var P = [0, 1, 2].map(function (i) { var a = -Math.PI / 2 + i * 2 * Math.PI / 3; return [cx + R * Math.cos(a), cy + R * Math.sin(a)]; });
    [[0, 1], [1, 2], [0, 2]].forEach(function (e) { D.line(ctx, P[e[0]][0], P[e[0]][1], P[e[1]][0], P[e[1]][1], C.line, 1.5); });
    if (A !== B) D.line(ctx, P[A][0], P[A][1], P[B][0], P[B][1], C.terracota, 3);
    plans.forEach(function (p, i) {
      var sel = i === A || i === B;
      D.circle(ctx, P[i][0], P[i][1], sel ? 10 : 7, sel ? C.terracota : C.muted, C.paper, 2);
      var vec = [0, 0, 0]; vec[i] = 1;
      D.text(ctx, p + " " + JSON.stringify(vec).replace(/,/g, ", "), P[i][0], P[i][1] + (i === 0 ? -16 : 24), { size: 11, align: "center", mono: true, color: C.ink, weight: sel ? 600 : 400 });
    });
    if (A !== B) D.text(ctx, "distancia 1,41", cx, h - 8, { size: 12, align: "center", color: C.terracotaInk, weight: 600 });
  }
  function vecs(i) { var v = [0, 0, 0]; v[i] = 1; return "[" + v.join(", ") + "]"; }
  function update() {
    view.redraw();
    var dn = Math.abs(A - B);
    tbl.set([["Números (1, 2, 3)", A + 1, B + 1, dn.toFixed(2)], ["One-Hot", vecs(A), vecs(B), (A === B ? 0 : Math.SQRT2).toFixed(2)]]);
    out.set(A === B ? "Mismo plan: la distancia es 0 en las dos codificaciones." :
      (dn === 2 ? "<span class='bad'>Con números, Basic y Premium parecen estar «el doble de lejos» que Basic y Standard. Es una relación que nosotros hemos inventado.</span>" :
        "Con números, estos dos planes parecen estar a distancia 1.") + "<br><span class='good'>Con One-Hot, todas las parejas de planes distintos están a la misma distancia (1,41): ninguna se considera más parecida.</span>");
  }
  view.draw(draw); update();
});
