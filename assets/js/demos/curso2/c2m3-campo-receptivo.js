/* Experimento: el campo receptivo crece al apilar capas (cada neurona profunda "ve" una zona mayor de la imagen). */
Lab.register("curso2/c2m3-campo-receptivo", function (root, api) {
  var N0 = 28, stack = [{ t: "c", k: 5 }, { t: "p", k: 2 }, { t: "c", k: 5 }, { t: "p", k: 2 }];
  function calc() {
    var r = 1, j = 1, n = N0, rows = [], ok = true;
    stack.forEach(function (L, i) {
      var s = L.t === "p" ? 2 : 1;
      r = r + (L.k - 1) * j; j = j * s;
      n = n >= L.k ? Math.floor((n - L.k) / s) + 1 : 0;
      rows.push({ name: (L.t === "c" ? "Conv " : "MaxPool ") + L.k + "×" + L.k, n: n, r: r, j: j });
    });
    return rows;
  }
  var view = api.view(root, { aspect: 1.5, minH: 250, maxH: 340, label: "Fotograma de 28 por 28 con cuadrados concéntricos: la zona que ve una neurona de cada capa" });
  var tbl = api.table(root, ["Capa", "Mapa", "Campo receptivo", "Salto"]);
  (function () { var t = root.querySelector("table.lab-table"), w = api.el("div", { style: { overflowX: "auto" } }); t.style.minWidth = "440px"; t.parentNode.insertBefore(w, t); w.appendChild(t); })();
  var ui = api.controls(root), out = api.readout(root);
  ui.button("+ Conv 3×3", function () { if (stack.length < 8) stack.push({ t: "c", k: 3 }); update(); }, "primary");
  ui.button("+ Conv 5×5", function () { if (stack.length < 8) stack.push({ t: "c", k: 5 }); update(); }, "primary");
  ui.button("+ MaxPool 2×2", function () { if (stack.length < 8) stack.push({ t: "p", k: 2 }); update(); });
  ui.button("Quitar la última", function () { stack.pop(); update(); });
  ui.button("Cargar: tres Conv 3×3", function () { stack = [{ t: "c", k: 3 }, { t: "c", k: 3 }, { t: "c", k: 3 }]; update(); });
  ui.button("Cargar: CNN del curso", function () { stack = [{ t: "c", k: 5 }, { t: "p", k: 2 }, { t: "c", k: 5 }, { t: "p", k: 2 }]; update(); });

  view.draw(function (ctx, w, h, C) {
    var D = api.d, rows = calc(), s = Math.min((w - 16) / N0, (h - 22) / N0), x0 = (w - s * N0) / 2, y0 = 18, i, j;
    D.text(ctx, "Fotograma 28×28 · cuadrado = lo que ve una neurona", w / 2, 12, { size: 11, weight: 600, align: "center", color: C.ink2 });
    for (i = 0; i < N0; i++) for (j = 0; j < N0; j++) D.rect(ctx, x0 + j * s, y0 + i * s, s, s, C.surface, C.line, 1);
    var cols = [C.cobalto, C.terracota, C.oliva, C.marker, C.ink, C.cobalto, C.terracota, C.oliva];
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, s * N0, s * N0); ctx.clip();
    rows.forEach(function (R, t) {
      var lo = 14 - Math.floor((R.r - 1) / 2), hiEdge = lo + R.r;
      ctx.globalAlpha = 0.10; D.rect(ctx, x0 + lo * s, y0 + lo * s, R.r * s, R.r * s, cols[t]); ctx.globalAlpha = 1;
      D.rect(ctx, x0 + lo * s, y0 + lo * s, R.r * s, R.r * s, null, cols[t], 2.2);
    });
    ctx.restore();
    if (rows.length) D.circle(ctx, x0 + 14.5 * s, y0 + 14.5 * s, Math.max(2, s * 0.3), C.ink);
    D.rect(ctx, x0, y0, s * N0, s * N0, null, C.ink, 1.5);
  });
  function update() {
    var rows = calc();
    view.redraw();
    tbl.set(rows.map(function (R, t) { return [(t + 1) + ". " + R.name, R.n ? R.n + "×" + R.n : "<span class='bad'>vacío</span>", "<b>" + R.r + "×" + R.r + "</b>", R.j]; }));
    var last = rows[rows.length - 1];
    out.set(rows.length ? "Fórmula por capa: r ← r + (k − 1)·salto ; salto ← salto·stride<br>Una neurona de la última capa depende de un cuadrado de <b>" + last.r + "×" + last.r + "</b> píxeles de la imagen" +
      (last.r > N0 ? " <span class='good'>(más que la imagen entera: ya lo ve todo)</span>" : " (" + (100 * last.r * last.r / (N0 * N0)).toFixed(0) + " % de la imagen)") : "Sin capas: cada neurona ve solo su propio píxel (1×1).");
  }
  update();
});
