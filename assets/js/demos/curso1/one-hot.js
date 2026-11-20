/* Experimento: codificar categorías con números inventa distancias que no existen. */
Lab.register("curso1/one-hot", function (root, api) {
  var plans = ["Basic", "Standard", "Premium"], A = 0, B = 2;
  var narrow = (root.clientWidth || 600) < 520;   // en móvil, los dos paneles uno encima del otro
  var view = api.view(root, { aspect: narrow ? 0.82 : 2.3, minH: 220, label: "Comparación de dos codificaciones de la categoría plan" });
  var ui = api.controls(root), out = api.readout(root);
  ui.select({ label: "Plan A", options: plans.map(function (p, i) { return [i, p]; }), value: A, onChange: function (v) { A = +v; update(); } });
  ui.select({ label: "Plan B", options: plans.map(function (p, i) { return [i, p]; }), value: B, onChange: function (v) { B = +v; update(); } });
  var tbl = api.table(root, ["Codificación", "Plan A", "Plan B", "Distancia A–B"]);

  function numeros(ctx, D, C, px, py, pw, ph, n) {
    D.text(ctx, n ? "Con números: 1, 2, 3" : "Con números: Basic=1, Standard=2, Premium=3", px + pw / 2, py + 20, { size: 12, align: "center", weight: 600, color: C.ink });
    var y = py + ph * 0.6, x0 = px + 40, x1 = px + pw - 40;
    function X(i) { return x0 + (x1 - x0) * i / 2; }
    D.line(ctx, x0 - 10, y, x1 + 10, y, C.ink, 2);
    plans.forEach(function (p, i) {
      var sel = i === A || i === B;
      D.circle(ctx, X(i), y, sel ? 10 : 7, sel ? C.terracota : C.muted, C.paper, 2);
      D.text(ctx, p, X(i), y + 30, { size: 12, align: "center", weight: sel ? 600 : 400, color: C.ink });
      D.text(ctx, String(i + 1), X(i), y - 18, { size: 12, align: "center", mono: true, color: C.muted });
    });
    if (A !== B) { D.line(ctx, X(A), y - 36, X(B), y - 36, C.terracota, 3); D.text(ctx, "distancia " + Math.abs(A - B), (X(A) + X(B)) / 2, y - 44, { size: 12, align: "center", color: C.terracotaInk, weight: 600 }); }
  }
  function onehot(ctx, D, C, px, py, pw, ph, n) {
    D.text(ctx, "One-Hot: una columna por plan", px + pw / 2, py + 20, { size: 12, align: "center", weight: 600, color: C.ink });
    var cx = px + pw / 2, cy = py + ph * 0.55, R = Math.min(pw / 2 - 50, ph * 0.3);
    var P = [0, 1, 2].map(function (i) { var a = -Math.PI / 2 + i * 2 * Math.PI / 3; return [cx + R * Math.cos(a), cy + R * Math.sin(a)]; });
    [[0, 1], [1, 2], [0, 2]].forEach(function (e) { D.line(ctx, P[e[0]][0], P[e[0]][1], P[e[1]][0], P[e[1]][1], C.line, 1.5); });
    if (A !== B) D.line(ctx, P[A][0], P[A][1], P[B][0], P[B][1], C.terracota, 3);
    plans.forEach(function (p, i) {
      var sel = i === A || i === B, o = { size: 11, align: "center", mono: true, color: C.ink, weight: sel ? 600 : 400 };
      D.circle(ctx, P[i][0], P[i][1], sel ? 10 : 7, sel ? C.terracota : C.muted, C.paper, 2);
      var vec = [0, 0, 0]; vec[i] = 1; var v = JSON.stringify(vec).replace(/,/g, ", ");
      if (i === 0) { D.text(ctx, p + " " + v, P[i][0], P[i][1] - 16, o); }
      else { D.text(ctx, p, P[i][0], P[i][1] + 24, o); D.text(ctx, v, P[i][0], P[i][1] + 38, o); }
    });
    if (A !== B) D.text(ctx, "distancia 1,41", cx, py + ph - 8, { size: 12, align: "center", color: C.terracotaInk, weight: 600 });
  }
  function draw(ctx, w, h, C) {
    var D = api.d;
    if (w < 520) {
      var h1 = Math.round(h * 0.42);
      numeros(ctx, D, C, 0, 0, w, h1, true);
      D.line(ctx, 8, h1, w - 8, h1, C.line, 1);
      onehot(ctx, D, C, 0, h1, w, h - h1, true);
    } else {
      var half = w / 2;
      numeros(ctx, D, C, 0, 0, half, h, false);
      D.line(ctx, half, 8, half, h - 8, C.line, 1);
      onehot(ctx, D, C, half, 0, half, h, false);
    }
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
