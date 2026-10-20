/* Experimento: Dropout con 8 neuronas. Se sortea una máscara (cada neurona se apaga con probabilidad p), las supervivientes se
   reescalan por 1/(1−p) y se calcula la suma ponderada z = w·h de la neurona siguiente. Después se repite con miles de máscaras. */
Lab.register("curso5/c5m2-dropout-mascara", function (root, api) {
  var D = api.d, C0 = api.colors();
  var H = [0.8, 0.5, 0.9, 0.3, 0.6, 0.2, 0.7, 0.4], W = [1.0, -0.5, 0.8, 1.2, -0.7, 0.9, 0.5, -0.3];
  var ZEVAL = 0; for (var q = 0; q < 8; q++) ZEVAL += H[q] * W[q];
  var S = { p: 0.5, scale: true, mask: null, zs: [] };
  var R = api.rng(5);

  function sample() {
    var m = [], sc = S.scale ? 1 / (1 - S.p) : 1, i;
    for (i = 0; i < 8; i++) m.push(R.next() < S.p ? 0 : sc);
    return m;
  }
  function zOf(m) { var z = 0; for (var i = 0; i < 8; i++) z += W[i] * H[i] * m[i]; return z; }
  function many(n) { S.zs = []; for (var k = 0; k < n; k++) S.zs.push(zOf(sample())); }

  var vA = api.view(root, { aspect: 2.5, minH: 170, maxH: 250, label: "Panel de ocho críticos: cuáles faltan con la máscara actual y cómo suenan los que están" });
  var vB = api.view(root, { aspect: 3.0, minH: 140, maxH: 210, label: "Histograma de la suma ponderada z de la neurona siguiente con 2000 máscaras distintas" });
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.72rem, 2.7vw, .84rem)";
  ui.slider({ label: "Probabilidad de que falte un crítico p (nn.Dropout(p))", min: 0, max: 0.9, step: 0.05, value: S.p, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.p = v; S.mask = sample(); many(2000); update(); } });
  ui.toggle({ label: "Los presentes hablan más alto: ×1/(1−p) (inverted dropout)", value: S.scale, onChange: function (v) { S.scale = v; S.mask = sample(); many(2000); update(); } });
  ui.button("Sortear otra máscara", function () { S.mask = sample(); update(); }, "primary");
  ui.button("Sortear 2000 máscaras", function () { many(2000); update(); });
  api.legend(root, [[C0.cobalto, "crítico presente (altura = su entusiasmo)"], [C0.line, "crítico ausente (su entusiasmo era el del contorno)"]]);

  function drawA(ctx, w, h, C) {
    var m = S.mask, bw = w / 8, base = h - 30, top = 22, ymax = Math.max(1, S.scale ? 1 / (1 - S.p) : 1) * 1.0, i;
    D.line(ctx, 4, base, w - 4, base, C.ink2, 1.2);
    for (i = 0; i < 8; i++) {
      var x = bw * i + bw * 0.14, bww = bw * 0.72, hh0 = (base - top) * H[i] / ymax, hh = (base - top) * H[i] * m[i] / ymax;
      if (m[i] === 0) { D.rect(ctx, x, base - hh0, bww, hh0, null, C.muted, 1.4); D.line(ctx, x, base - hh0, x + bww, base, C.terracota, 1.6); D.line(ctx, x + bww, base - hh0, x, base, C.terracota, 1.6); }
      else { D.rect(ctx, x, base - hh0, bww, hh0, null, C.muted, 1); D.rect(ctx, x, base - hh, bww, hh, C.cobalto, C.cobaltoInk, 1); }
      D.text(ctx, "h" + (i + 1) + "=" + H[i].toFixed(1), x + bww / 2, h - 16, { size: w < 420 ? 9 : 10.5, mono: true, align: "center", color: C.ink2 });
      D.text(ctx, m[i] === 0 ? "0" : (H[i] * m[i]).toFixed(2), x + bww / 2, h - 4, { size: w < 420 ? 9 : 10.5, mono: true, align: "center", color: m[i] === 0 ? C.terracotaInk : C.cobaltoInk, weight: 500 });
    }
    D.text(ctx, "arriba: entusiasmo del crítico · abajo: lo que se oye", 6, 13, { size: 10.5, color: C.muted });
  }
  function drawB(ctx, w, h, C) {
    var zs = S.zs, lo = -3, hi = 5, nb = 36, cnt = new Array(nb).fill(0), i, mean = 0;
    for (i = 0; i < zs.length; i++) { mean += zs[i]; var b = Math.min(nb - 1, Math.max(0, Math.floor((zs[i] - lo) / (hi - lo) * nb))); cnt[b]++; }
    mean /= zs.length;
    var mx = Math.max.apply(null, cnt), x0 = 10, bw = w - 20, y0 = h - 24, hh = h - 44;
    D.line(ctx, x0, y0, x0 + bw, y0, C.ink2, 1.2);
    for (i = 0; i < nb; i++) D.rect(ctx, x0 + bw * i / nb + 0.5, y0 - hh * cnt[i] / mx, bw / nb - 1, hh * cnt[i] / mx, C.cobalto, null);
    function px(v) { return x0 + bw * (v - lo) / (hi - lo); }
    D.line(ctx, px(ZEVAL), 14, px(ZEVAL), y0, C.ink, 2, [5, 3]);
    D.line(ctx, px(mean), 14, px(mean), y0, C.terracota, 2.2);
    for (var t = lo; t <= hi; t++) D.text(ctx, String(t), px(t), y0 + 13, { size: 10.5, mono: true, align: "center", color: C.muted });
    D.text(ctx, "z de la neurona siguiente (suma del panel)", x0 + bw / 2, h - 2, { size: 10.5, align: "center", color: C.ink2 });
    D.text(ctx, "sin dropout (eval): " + ZEVAL.toFixed(2), Math.min(px(ZEVAL) + 5, w - 150), 12, { size: 10.5, color: C.ink, weight: 600 });
  }
  S.mask = sample(); many(2000);
  vA.draw(drawA); vB.draw(drawB);
  function update() {
    var zs = S.zs, mean = 0, sd = 0, i; zs.forEach(function (z) { mean += z; }); mean /= zs.length; zs.forEach(function (z) { sd += (z - mean) * (z - mean); }); sd = Math.sqrt(sd / zs.length);
    var nOff = S.mask.filter(function (v) { return v === 0; }).length, ok = Math.abs(mean - ZEVAL) < 0.05 * Math.max(1, Math.abs(ZEVAL));
    out.set("Hoy faltan <b>" + nOff + "</b> de 8 críticos y la neurona siguiente da z = <b>" + zOf(S.mask).toFixed(2) + "</b> (sin dropout: <b>" + ZEVAL.toFixed(2) + "</b>)<br>" +
      "Media de z con " + zs.length + " máscaras: <b>" + mean.toFixed(2) + "</b> · desviación: <b>" + sd.toFixed(2) + "</b> · esperado: " + (S.scale ? ZEVAL.toFixed(2) + " (el reescalado conserva la media)" : "(1 − p)·" + ZEVAL.toFixed(2) + " = " + ((1 - S.p) * ZEVAL).toFixed(2)) +
      "<br>" + (S.scale ? (S.p === 0 ? "Con p = 0 no se apaga nada." : "<span class='good'>Con el reescalado, la media de z con dropout coincide con la de la red completa (la que se usa en eval).</span>") : "<span class='bad'>Sin reescalar, en entrenamiento z vale de media " + (1 - S.p).toFixed(2) + " veces lo que valdrá en eval: la red vería magnitudes distintas al predecir.</span>"));
    vA.redraw(); vB.redraw();
  }
  update();
});
