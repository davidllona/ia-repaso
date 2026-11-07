/* Experimento: de carpetas a etiquetas. Cada subcarpeta es una clase y la etiqueta (0, 1, 2…) sale del ORDEN ALFABÉTICO
   de los nombres de carpeta, igual en image_dataset_from_directory (Keras) que en ImageFolder (PyTorch).
   Se alterna el caso de Coursera (satélite: agrícola / no agrícola) con el de la web (pósters) y se puede añadir
   una tercera carpeta para ver cómo se mueven los índices. También calcula train/val y lotes por época. */
Lab.register("curso6/c6m1-carpetas", function (root, api) {
  var D = api.d;
  var MODOS = {
    pos: { raiz: "posters/", clases: ["animacion", "accion"], extra: "amor" },
    sat: { raiz: "satelite/", clases: ["no_agricola", "agricola"], extra: "bosque" }
  };
  var S = { modo: "pos", extra: false, n: 100 };

  var view = api.view(root, { aspect: 1.45, minH: 250, maxH: 380, label: "Árbol de carpetas con miniaturas de cada clase y la etiqueta numérica que recibe cada carpeta" });
  var ui = api.controls(root), out = api.readout(root);
  ui.segmented({ label: "Datos", options: [["pos", "Aquí: pósters"], ["sat", "Coursera: satélite"]], value: S.modo, onChange: function (v) { S.modo = v; update(); } });
  ui.slider({ label: "Imágenes por carpeta", min: 50, max: 3000, step: 50, value: S.n, fmt: function (v) { return v; }, onInput: function (v) { S.n = v; update(); } });
  var tg = ui.toggle({ label: "Añadir una tercera carpeta", value: false, onChange: function (v) { S.extra = v; update(); } });

  function carpetas() {
    var m = MODOS[S.modo], l = m.clases.slice();
    if (S.extra) l.push(m.extra);
    return l; // en el orden en que «las creaste» (el disco no garantiza ningún orden)
  }
  function ordenadas() { return carpetas().slice().sort(); }

  /* Miniaturas dibujadas a mano: cada clase tiene un patrón distinto */
  function mini(ctx, clase, x, y, s, seed, C) {
    var R = api.rng(seed), i;
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, s, s); ctx.clip();
    if (clase === "animacion") {
      D.rect(ctx, x, y, s, s, C.markerWash);
      D.circle(ctx, x + s * R.range(0.3, 0.7), y + s * R.range(0.3, 0.6), s * R.range(0.18, 0.28), R.pick([C.terracota, C.cobalto, C.oliva]));
    } else if (clase === "accion") {
      D.rect(ctx, x, y, s, s, C.ink2);
      var off = R.range(0, s / 4);
      for (i = -2; i < 6; i++) D.line(ctx, x + i * s / 4 + off, y + s, x + i * s / 4 + off + s, y, C.terracota, Math.max(2, s / 10));
    } else if (clase === "amor") {
      D.rect(ctx, x, y, s, s, C.terracotaWash);
      var cx = x + s * R.range(0.4, 0.6), cy = y + s * 0.45, r = s * 0.14;
      D.circle(ctx, cx - r * 0.8, cy, r, C.terracota); D.circle(ctx, cx + r * 0.8, cy, r, C.terracota);
      ctx.fillStyle = C.terracota; ctx.beginPath(); ctx.moveTo(cx - r * 1.75, cy + r * 0.3); ctx.lineTo(cx + r * 1.75, cy + r * 0.3); ctx.lineTo(cx, cy + r * 2.4); ctx.fill();
    } else if (clase === "agricola") {
      D.rect(ctx, x, y, s, s, C.olivaWash);
      var ang = R.range(-0.5, 0.5), n = 6;
      ctx.translate(x + s / 2, y + s / 2); ctx.rotate(ang);
      for (i = -n; i <= n; i++) D.line(ctx, -s, i * s / n, s, i * s / n, C.oliva, Math.max(1.5, s / 14));
    } else if (clase === "no_agricola") {
      D.rect(ctx, x, y, s, s, C.paper2 || C.surface);
      for (i = 0; i < 5; i++) D.rect(ctx, x + s * R.range(0, 0.75), y + s * R.range(0, 0.75), s * R.range(0.15, 0.3), s * R.range(0.15, 0.3), C.muted);
      D.line(ctx, x, y + s * R.range(0.3, 0.7), x + s, y + s * R.range(0.3, 0.7), C.ink2, Math.max(2, s / 9));
    } else { // bosque
      D.rect(ctx, x, y, s, s, C.olivaWash);
      for (i = 0; i < 7; i++) D.circle(ctx, x + s * R.range(0.1, 0.9), y + s * R.range(0.1, 0.9), s * R.range(0.1, 0.18), C.olivaInk);
    }
    ctx.restore();
    D.rect(ctx, x, y, s, s, null, C.line, 1);
  }

  function draw(ctx, w, h, C) {
    var l = ordenadas(), m = MODOS[S.modo], nueva = S.extra ? m.extra : null;
    var narrow = w < 480, top = 30, rowH = (h - top - 10) / 3, s = Math.min(rowH * 0.62, narrow ? 30 : 54);
    var nThumb = narrow ? 3 : 4, xName = 16, xThumbs = narrow ? 112 : 160, xArrow = xThumbs + nThumb * (s + 5) + 8;
    var xLab = w - 16;
    D.text(ctx, m.raiz, 8, 18, { size: 13, weight: 700, color: C.ink, mono: true });
    D.text(ctx, "etiqueta y", xLab, 18, { size: 11, color: C.muted, align: "right" });
    l.forEach(function (c, k) {
      var y = top + k * rowH + (rowH - s) / 2, mid = y + s / 2;
      D.line(ctx, 10, top - 4, 10, mid, C.line, 1.5); D.line(ctx, 10, mid, xName - 2, mid, C.line, 1.5);
      D.text(ctx, c + "/", xName + 2, mid - 2, { size: narrow ? 11.5 : 13, weight: 600, color: c === nueva ? C.terracotaInk : C.ink, mono: true });
      D.text(ctx, S.n + " imágenes", xName + 2, mid + 13, { size: 10.5, color: C.muted });
      for (var j = 0; j < nThumb; j++) mini(ctx, c, xThumbs + j * (s + 5), y, s, 11 + j * 7 + c.length * 31, C);
      var x2 = xLab - 34;
      if (x2 - xArrow > 18) D.arrow(ctx, xArrow, mid, x2, mid, C.muted, 1.5);
      var orig = MODOS[S.modo].clases.slice().sort().indexOf(c), cambia = S.extra && orig >= 0 && orig !== k;
      D.rect(ctx, xLab - 28, mid - 13, 28, 26, cambia ? C.terracotaWash : C.cobaltoWash, cambia ? C.terracota : C.cobalto, 1.5);
      D.text(ctx, String(k), xLab - 14, mid + 6, { size: 16, weight: 700, align: "center", color: cambia ? C.terracotaInk : C.cobaltoInk, mono: true });
    });
  }

  function update() {
    var l = ordenadas(), N = S.n * l.length, nVal = Math.floor(0.2 * N), nTr = N - nVal, idx = {};
    l.forEach(function (c, k) { idx[c] = k; });
    var m = MODOS[S.modo], orig = m.clases.slice().sort(), cambios = [];
    orig.forEach(function (c, k) { if (idx[c] !== k) cambios.push("<b>" + c + "</b> pasa de " + k + " a <b>" + idx[c] + "</b>"); });
    out.set("<code>class_names</code> = [" + l.map(function (c) { return "'" + c + "'"; }).join(", ") + "] → " +
      l.map(function (c, k) { return c + " = <b>" + k + "</b>"; }).join(", ") + "<br>" +
      "Total <b>" + N.toLocaleString("es-ES") + "</b> imágenes · con 20 % de validación: <b>" + nTr.toLocaleString("es-ES") + "</b> train y <b>" + nVal.toLocaleString("es-ES") + "</b> val · lotes de 32: <b>" + Math.ceil(nTr / 32) + "</b> pasos por época" +
      (S.extra ? (cambios.length ? "<br><span class='bad'>Ojo: " + cambios.join("; ") + ". Un modelo entrenado con las 2 carpetas ya no casa con estas etiquetas.</span>"
        : "<br><span class='good'>La carpeta nueva va al final del alfabeto: los índices antiguos no cambian.</span>") : ""));
    view.redraw();
  }
  view.draw(draw); update();
});
