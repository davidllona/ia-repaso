/* Experimento: la misma tabla, distinto target. Elige la columna que quieres predecir
   y mira cómo se reparten las demás en X (lo que el modelo sabe) e y (lo que debe adivinar). */
Lab.register("curso1/c1m1-features-target", function (root, api) {
  var cols = ["Edad", "Plan", "HorasMes", "Canceló"];
  var rows = [[23, "Básico", 5, "Sí"], [41, "Premium", 37, "No"], [32, "Estándar", 22, "No"], [58, "Básico", 2, "Sí"]];
  var tipo = { Edad: "número", Plan: "categoría (3 planes)", HorasMes: "número", "Canceló": "categoría (sí / no)" };
  var target = 3, fuga = false;

  var view = api.view(root, { aspect: 2, minH: 250, maxH: 300, label: "Columnas de la tabla repartidas entre X (features), el modelo e y (target)" });
  var ui = api.controls(root), out = api.readout(root);
  ui.segmented({ label: "¿Qué quiero predecir? (target)", value: 3,
    options: cols.map(function (c, i) { return [i, c]; }),
    onChange: function (v) { target = +v; update(); } });
  ui.toggle({ label: "Colar «FechaCancelación» en X", value: false, onChange: function (v) { fuga = v; update(); } });
  var tbl = api.table(root, ["Fila", "X (features)", "y (target)"]);

  function box(ctx, D, C, x, y, bw, bh, titulo, sub, fill, stroke, subColor) {
    D.rect(ctx, x, y, bw, bh, fill, stroke, 1.5);
    D.text(ctx, titulo, x + bw / 2, y + bh / 2 - 3, { size: 11, align: "center", weight: 600, color: C.ink });
    D.text(ctx, sub, x + bw / 2, y + bh / 2 + 12, { size: 10, align: "center", mono: true, color: subColor });
  }
  function draw(ctx, w, h, C) {
    var D = api.d, cx = w / 2;
    var xs = cols.map(function (c, i) { return i; }).filter(function (i) { return i !== target; });
    if (fuga) xs.push(-1);
    var n = xs.length, gap = 8, bw = Math.min(118, (w - 24 - gap * (n - 1)) / n), bh = 40;
    var x0 = cx - (n * bw + (n - 1) * gap) / 2, y1 = 24;
    D.text(ctx, "X · lo que el modelo sabe", cx, 15, { size: 12, align: "center", weight: 600, color: C.cobaltoInk });
    xs.forEach(function (ci, k) {
      var bad = ci === -1;
      box(ctx, D, C, x0 + k * (bw + gap), y1, bw, bh, bad ? "FechaCancel." : cols[ci], bad ? "¡trampa!" : tipo[cols[ci]].split(" ")[0],
        bad ? C.terracotaWash : C.cobaltoWash, bad ? C.terracota : C.cobalto, bad ? C.terracotaInk : C.muted);
    });
    var y2 = y1 + bh + 28;
    D.arrow(ctx, cx, y1 + bh + 3, cx, y2 - 3, C.ink, 1.5);
    box(ctx, D, C, cx - 80, y2, 160, 42, "MODELO", "las reglas aprendidas", C.surface, C.ink, C.muted);
    var y3 = y2 + 42 + 28;
    D.arrow(ctx, cx, y2 + 45, cx, y3 - 3, C.ink, 1.5);
    box(ctx, D, C, cx - 70, y3, 140, bh, cols[target], tipo[cols[target]].split(" ")[0], C.terracotaWash, C.terracota, C.terracotaInk);
    D.text(ctx, "y · lo que debe adivinar", cx, y3 + bh + 16, { size: 12, align: "center", weight: 600, color: C.terracotaInk });
    var fam = tipo[cols[target]].indexOf("número") === 0 ? "→ REGRESIÓN: la respuesta es un número" : "→ CLASIFICACIÓN: la respuesta es una categoría";
    D.text(ctx, fam, cx, h - 8, { size: 12, align: "center", weight: 600, color: C.ink });
  }
  function update() {
    view.redraw();
    tbl.set(rows.map(function (r, i) {
      var xs = r.filter(function (_, k) { return k !== target; }).map(String);
      if (fuga) xs.push(r[3] === "Sí" ? "12/03" : "—");
      return [i + 1, xs.join(" · "), "<b>" + r[target] + "</b>"];
    }));
    var t = cols[target];
    var txt = "Target = <b>" + t + "</b> (" + tipo[t] + "). " +
      (tipo[t].indexOf("número") === 0 ? "El modelo devolverá un número: <b>regresión</b>." : "El modelo elegirá una opción de una lista cerrada: <b>clasificación</b>.") +
      " Las otras " + (cols.length - 1) + " columnas forman X.";
    if (fuga) txt += "<br><span class='bad'>La fecha de cancelación solo existe para quien ya canceló: el modelo tendría la respuesta dentro de X. Acertaría todo hoy y nada mañana (data leakage).</span>";
    else txt += "<br><span class='good'>X solo tiene cosas que se conocen antes de saber la respuesta.</span>";
    out.set(txt);
  }
  view.draw(draw); update();
});
