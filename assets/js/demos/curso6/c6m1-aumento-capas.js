/* Experimento: las capas de aumento de Keras sobre un póster. RandomFlip("horizontal") voltea con probabilidad 1/2,
   RandomRotation(f) gira un ángulo al azar entre −f·360° y +f·360°, y RandomZoom(f) acerca o aleja entre −f y +f
   (positivo = alejar). Los huecos se rellenan con fill_mode: "reflect" (espejo, el valor por defecto) o "constant".
   Con training=False las capas no hacen nada: así se comportan al evaluar y al predecir. */
Lab.register("curso6/c6m1-aumento-capas", function (root, api) {
  var D = api.d;
  var S = { flip: true, rot: 0.1, zoom: 0.2, fill: "reflect", training: true, epoca: 1 };

  var view = api.view(root, { aspect: 2.4, minH: 230, maxH: 330, label: "Un póster original y varias versiones aumentadas por las capas de Keras" });
  var ui = api.controls(root), out = api.readout(root);
  ui.toggle({ label: "RandomFlip(\"horizontal\")", value: S.flip, onChange: function (v) { S.flip = v; update(); } });
  ui.slider({ label: "RandomRotation(factor)", min: 0, max: 0.5, step: 0.01, value: S.rot, fmt: function (v) { return v.toFixed(2) + " → ±" + Math.round(v * 360) + "°"; }, onInput: function (v) { S.rot = v; update(); } });
  ui.slider({ label: "RandomZoom(factor)", min: 0, max: 0.5, step: 0.05, value: S.zoom, fmt: function (v) { return v.toFixed(2) + " → ±" + Math.round(v * 100) + " %"; }, onInput: function (v) { S.zoom = v; update(); } });
  ui.select({ label: "fill_mode (huecos)", options: [["reflect", "reflect (por defecto)"], ["constant", "constant (un color fijo)"]], value: S.fill, onChange: function (v) { S.fill = v; update(); } });
  ui.segmented({ label: "Al llamar al modelo", options: [["t", "training=True"], ["f", "training=False"]], value: "t", onChange: function (v) { S.training = v === "t"; update(); } });
  ui.button("Otra época (nuevo sorteo)", function () { S.epoca++; update(); }, "primary");

  function sorteos(n) {
    var R = api.rng(1000 + S.epoca * 97), l = [];
    for (var i = 0; i < n; i++) {
      var f = R.next() < 0.5, a = R.range(-1, 1) * S.rot * 360, z = R.range(-1, 1) * S.zoom;
      l.push(S.training ? { flip: S.flip && f, ang: a, zoom: z } : { flip: false, ang: 0, zoom: 0 });
    }
    return l;
  }

  /* El póster, en coordenadas −50..50 (asimétrico para que se note el volteo) */
  function poster(ctx, C) {
    ctx.fillStyle = C.markerWash; ctx.fillRect(-50, -50, 100, 100);
    ctx.fillStyle = C.terracota; ctx.beginPath(); ctx.arc(-22, -24, 14, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = C.oliva; ctx.beginPath(); ctx.moveTo(-50, 26); ctx.lineTo(-8, -10); ctx.lineTo(18, 14); ctx.lineTo(34, 2); ctx.lineTo(50, 26); ctx.closePath(); ctx.fill();
    ctx.fillStyle = C.cobalto; ctx.fillRect(-50, 26, 100, 24);
    ctx.fillStyle = C.surface; ctx.font = "700 17px 'IBM Plex Sans',system-ui,sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillText("TOY", -42, 38);
  }
  function celda(ctx, x, y, s, t, C) {
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, s, s); ctx.clip();
    if (S.fill === "constant") D.rect(ctx, x, y, s, s, C.ink);
    ctx.translate(x + s / 2, y + s / 2);
    ctx.scale(s / 100, s / 100);
    ctx.rotate(-t.ang * Math.PI / 180);            // positivo = antihorario, como en Keras
    var k = 1 / (1 + t.zoom);                      // zoom positivo = alejar (se ve más pequeño)
    ctx.scale(t.flip ? -k : k, k);
    var tiles = S.fill === "reflect" ? [-1, 0, 1] : [0];
    tiles.forEach(function (i) { tiles.forEach(function (j) {
      ctx.save(); ctx.translate(i * 100, j * 100); ctx.scale(i ? -1 : 1, j ? -1 : 1); poster(ctx, C); ctx.restore();
    }); });
    ctx.restore();
    D.rect(ctx, x, y, s, s, null, C.line, 1);
  }

  function draw(ctx, w, h, C) {
    var narrow = w < 520, cols = narrow ? 3 : 4, rows = 2, gap = 8, lab = 16;
    var so = Math.min(h - lab - 10, w * (narrow ? 0.3 : 0.32));
    var area = w - so - 40, s = Math.min((area - gap * (cols - 1)) / cols, (h - lab - 10 - gap * (rows - 1) - 14) / rows);
    D.text(ctx, "original", 8 + so / 2, 12, { size: 11, color: C.muted, align: "center" });
    celda(ctx, 8, lab + 4, so, { flip: false, ang: 0, zoom: 0 }, C);
    var xg = 8 + so + 20;
    D.text(ctx, "época " + S.epoca + (S.training ? ": lo que ve la red" : ": training=False"), xg, 12, { size: 11, color: C.muted });
    var l = sorteos(cols * rows);
    l.forEach(function (t, k) {
      var cx = xg + (k % cols) * (s + gap), cy = lab + 4 + Math.floor(k / cols) * (s + gap + 14);
      celda(ctx, cx, cy, s, t, C);
      D.text(ctx, Math.round(t.ang) + "° " + (t.zoom >= 0 ? "+" : "") + Math.round(t.zoom * 100) + "%", cx + s / 2, cy + s + 11, { size: 10, color: C.ink2, align: "center", mono: true });
    });
  }

  function update() {
    var l = sorteos(6), vol = l.filter(function (t) { return t.flip; }).length;
    out.set(S.training
      ? "Giro entre <b>−" + Math.round(S.rot * 360) + "°</b> y <b>+" + Math.round(S.rot * 360) + "°</b> · zoom entre <b>−" + Math.round(S.zoom * 100) + " %</b> (acerca) y <b>+" + Math.round(S.zoom * 100) + " %</b> (aleja) · volteadas " + vol + " de 6<br>" +
        "Primera versión: " + (l[0].flip ? "volteada, " : "sin voltear, ") + "giro <b>" + l[0].ang.toFixed(1).replace(".", ",") + "°</b>, zoom <b>" + (l[0].zoom * 100).toFixed(1).replace(".", ",") + " %</b>. La etiqueta sigue siendo «animación»." +
        (S.flip ? "<br><span class='bad'>Fíjate en el título: el volteo invierte el texto. Si tu clase dependiera del texto, no voltees.</span>" : "")
      : "<span class='good'>training=False: las capas de aumento dejan pasar el póster tal cual.</span> Así funcionan en <code>evaluate</code> y <code>predict</code>.");
    view.redraw();
  }
  view.draw(draw); update();
});
