/* Experimento: ds[i] y len(ds) en un Dataset de CSV (las 8 casas del fragmento del módulo).
   El lector pide la muestra i, con o sin transform (estandarizar las entradas), y ve el error al salirse del rango. */
Lab.register("curso4/c4m2-getitem", function (root, api) {
  var D = api.d, M = api.math;
  var T = [[108, 1, 25, 208.5], [91, 4, 22, 209], [81, 3, 22, 179], [61, 4, 38, 125], [64, 3, 11, 161.5], [43, 3, 33, 86.5], [46, 4, 27, 111.5], [41, 3, 0, 132]];
  var N = T.length, names = ["metros", "habit.", "antig.", "precio"], mean = [], sd = [], c;
  for (c = 0; c < 3; c++) {
    var col = T.map(function (r) { return r[c]; }), m = M.mean(col), s = 0;
    col.forEach(function (v) { s += (v - m) * (v - m); });
    mean.push(m); sd.push(Math.sqrt(s / (N - 1)));
  }
  var S = { i: 0, tr: false };
  var view = api.view(root, { aspect: 2.2, minH: 250, maxH: 285, label: "Tabla de 8 casas con la fila pedida resaltada" });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "índice i en ds[i]", min: 0, max: N + 1, step: 1, value: 0, onInput: function (v) { S.i = v; update(); } });
  ui.toggle({ label: "transform = estandarizar", value: false, onChange: function (v) { S.tr = v; update(); } });

  function f(v, d) { return (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d); }
  function draw(ctx, w, h, C) {
    var padL = 8, colW = (w - 16 - 36) / 4, rowH = Math.min(26, (h - 70) / (N + 1)), y0 = 40, r, k;
    D.text(ctx, "casas.csv  →  Dataset (len = " + N + ")", 10, 17, { size: 12, color: C.ink2, weight: 600 });
    D.rect(ctx, padL, y0 - 4, w - 16, rowH, C.paper, C.line, 1);
    D.text(ctx, "i", padL + 8, y0 + rowH - 10, { size: 11, color: C.muted, mono: true });
    for (k = 0; k < 4; k++) D.text(ctx, names[k], padL + 36 + k * colW + colW / 2, y0 + rowH - 10, { size: 11, color: k === 3 ? C.terracotaInk : C.cobaltoInk, align: "center", weight: 600 });
    for (r = 0; r < N; r++) {
      var y = y0 - 4 + (r + 1) * rowH, sel = r === S.i;
      D.rect(ctx, padL, y, w - 16, rowH, sel ? C.markerWash : (r % 2 ? C.paper : C.surface), sel ? C.marker : C.line, sel ? 2 : 1);
      D.text(ctx, String(r), padL + 8, y + rowH - 9, { size: 11, color: sel ? C.ink : C.muted, mono: true, weight: sel ? 700 : 400 });
      for (k = 0; k < 4; k++) D.text(ctx, k === 3 ? f(T[r][k], 1) : String(T[r][k]), padL + 36 + k * colW + colW / 2, y + rowH - 9, { size: 11.5, color: C.ink, align: "center", mono: true, weight: sel ? 700 : 400 });
    }
    if (S.i >= N) D.text(ctx, "no hay fila " + S.i + ": los índices llegan hasta " + (N - 1), w / 2, y0 - 4 + (N + 1) * rowH + 18, { size: 11.5, color: C.terracotaInk, align: "center", weight: 600 });
  }
  view.draw(draw);

  function update() {
    var i = S.i, t;
    if (i >= N) {
      t = "<code>len(ds)</code> → <b>" + N + "</b><br><code>ds[" + i + "]</code> → <span class='bad'><b>IndexError</b>: index " + i + " is out of bounds for dimension 0 with size " + N + "</span><br>" +
        "Así sabe Python que un recorrido con <code>for</code> ha terminado, y por eso el <code>DataLoader</code> usa <code>len(ds)</code> para no pedir más muestras de las que hay.";
    } else {
      var x = T[i].slice(0, 3), y = T[i][3];
      var xs = S.tr ? x.map(function (v, k) { return (v - mean[k]) / sd[k]; }) : x;
      var dd = S.tr ? 4 : 1;
      t = "<code>len(ds)</code> → <b>" + N + "</b><br><code>ds[" + i + "]</code> → <b>(tensor([" + xs.map(function (v) { return f(v, dd); }).join(", ") + "]), tensor([" + f(y, 4) + "]))</b><br>" +
        (S.tr ? "transform: cada entrada pasa por <code>(x − media) / desv</code> con media = [" + mean.map(function (v) { return f(v, 2); }).join(", ") + "] y desv = [" + sd.map(function (v) { return f(v, 2); }).join(", ") + "]; la etiqueta (precio) <b>no</b> se toca." +
          "<br>Ejemplo: metros: (" + x[0] + " − " + f(mean[0], 3) + ") / " + f(sd[0], 3) + " = <b>" + f(xs[0], 4) + "</b>"
          : "Sin transform: los números salen tal cual están en el CSV (entradas = metros, habitaciones, antigüedad; etiqueta = precio).");
    }
    view.redraw(); out.set(t);
  }
  update();
});
