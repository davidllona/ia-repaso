/* Experimento: tamaño de la salida con kernel (k), stride (s), padding (p) y DILATACIÓN (d).
   Una dilatación d separa los "dientes" del kernel: el filtro cubre k_ef casillas con solo k pesos. */
Lab.register("curso3/c3m2-tamano-dilatacion", function (root, api) {
  var st = { n: 12, k: 3, s: 1, p: 0, d: 2, pos: 0 };

  function kef() { return st.k + (st.k - 1) * (st.d - 1); }
  function outSize() { var T = st.n + 2 * st.p, ke = kef(); return T - ke >= 0 ? Math.floor((T - ke) / st.s) + 1 : 0; }

  var grid = api.el("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))", gap: "10px" } });
  root.appendChild(grid);
  function cellDiv() { var c = api.el("div", { style: { minWidth: "0" } }); grid.appendChild(c); return c; }
  var vA = api.view(cellDiv(), { aspect: 2.0, minH: 190, maxH: 260, label: "Fila de la entrada, dientes del kernel dilatado y fila de salida" });
  var vB = api.view(cellDiv(), { aspect: 1.2, minH: 190, maxH: 260, label: "Huella 2D del kernel dilatado" });
  var ui = api.controls(root), out = api.readout(root);
  var sN = ui.slider({ label: "n = entrada", min: 5, max: 20, step: 1, value: st.n, onInput: function (v) { st.n = v; fix(); update(); } });
  var sK = ui.slider({ label: "k = pesos por lado del kernel", min: 1, max: 7, step: 1, value: st.k, onInput: function (v) { st.k = v; fix(); update(); } });
  var sS = ui.slider({ label: "s = stride", min: 1, max: 4, step: 1, value: st.s, onInput: function (v) { st.s = v; fix(); update(); } });
  var sP = ui.slider({ label: "p = padding por lado", min: 0, max: 4, step: 1, value: st.p, onInput: function (v) { st.p = v; fix(); update(); } });
  var sD = ui.slider({ label: "d = dilation_rate", min: 1, max: 5, step: 1, value: st.d, onInput: function (v) { st.d = v; fix(); update(); } });
  var sW = ui.slider({ label: "Posición de la ventana", min: 0, max: 0, step: 1, value: 0, fmt: function (v) { return (v + 1) + " de " + Math.max(1, outSize()); }, onInput: function (v) { st.pos = v; update(true); } });
  ui.button("Ejemplo del texto (n=12, k=3, d=2)", function () { set(12, 3, 1, 0, 2); });
  ui.button("Sin dilatación (d=1)", function () { set(12, 3, 1, 0, 1); });
  function set(n, k, s, p, d) { st.n = n; st.k = k; st.s = s; st.p = p; st.d = d; sN.set(n, true); sK.set(k, true); sS.set(s, true); sP.set(p, true); sD.set(d, true); fix(); update(); }
  function fix() { var m = outSize(); sW.input.max = Math.max(0, m - 1); if (st.pos > Math.max(0, m - 1)) st.pos = Math.max(0, m - 1); sW.set(st.pos, true); }

  vA.draw(function (ctx, w, h, C) {
    var D = api.d, T = st.n + 2 * st.p, m = outSize(), ke = kef(), maxC = Math.max(T, m, 8), cw = Math.min(30, (w - 12) / maxC), x0 = 6, i;
    var rowH = (h - 10) / 3, ch = Math.min(cw, rowH - 24);
    function label(t, y) { D.text(ctx, t, x0, y, { size: Math.min(11, w / 34), weight: 600, color: C.ink2 }); }
    label("Entrada (n = " + st.n + ") con padding p = " + st.p + " → " + T + " casillas", 14);
    var y1 = 20;
    var start = m ? st.pos * st.s : 0;
    for (i = 0; i < T; i++) {
      var real = i >= st.p && i < st.p + st.n, x = x0 + i * cw, inWin = m && i >= start && i < start + ke, tap = inWin && ((i - start) % st.d === 0);
      D.rect(ctx, x, y1, cw, ch, real ? C.cobaltoWash : C.markerWash, C.line, 1);
      if (inWin) { ctx.save(); ctx.globalAlpha = tap ? 0.55 : 0.12; D.rect(ctx, x, y1, cw, ch, C.terracota); ctx.restore(); }
      if (tap) D.circle(ctx, x + cw / 2, y1 + ch / 2, Math.min(5, cw * 0.22), C.terracota);
    }
    if (m) D.rect(ctx, x0 + start * cw, y1 - 1, ke * cw, ch + 2, null, C.terracota, 2.5);
    var y2 = 20 + rowH + 6;
    label("Salida: m = " + m + " casillas", y2 - 4);
    for (i = 0; i < m; i++) {
      D.rect(ctx, x0 + i * cw, y2, cw, ch, i === st.pos ? C.oliva : C.surface, C.line, 1);
      if (cw >= 16) D.text(ctx, String(i + 1), x0 + i * cw + cw / 2, y2 + ch / 2 + 4, { size: Math.min(10, cw * 0.38), align: "center", mono: true, color: i === st.pos ? C.paper : C.muted });
    }
    if (!m) D.text(ctx, "el kernel dilatado no cabe", x0, y2 + 14, { size: 12, weight: 600, color: C.terracotaInk });
    var y3 = 20 + 2 * rowH + 8;
    label("k_ef = k + (k − 1)(d − 1) = " + st.k + " + " + (st.k - 1) + "·" + (st.d - 1) + " = " + ke + " casillas cubiertas con solo " + st.k + " pesos", y3 + 4);
    D.text(ctx, "● = diente del kernel (usa un peso) · casillas claras entre dientes = huecos", x0, y3 + 20, { size: Math.min(10, w / 38), color: C.muted });
  });

  vB.draw(function (ctx, w, h, C) {
    var D = api.d, ke = kef(), sz = Math.max(8, Math.min((w - 12) / ke, (h - 40) / ke)), x0 = (w - sz * ke) / 2, y0 = 26, i, j;
    D.text(ctx, "Huella 2D del kernel " + st.k + "×" + st.k + " con d = " + st.d + " (" + ke + "×" + ke + ")", w / 2, 15, { size: Math.min(11, w / 30), weight: 600, align: "center", color: C.ink2 });
    for (i = 0; i < ke; i++) for (j = 0; j < ke; j++) {
      var tap = (i % st.d === 0) && (j % st.d === 0), x = x0 + j * sz, y = y0 + i * sz;
      D.rect(ctx, x, y, sz, sz, tap ? C.terracota : C.surface, C.line, 1);
    }
    D.rect(ctx, x0, y0, sz * ke, sz * ke, null, C.ink, 1.5);
    D.text(ctx, st.k * st.k + " pesos reales · " + (ke * ke - st.k * st.k) + " huecos", w / 2, h - 6, { size: Math.min(10.5, w / 32), align: "center", color: C.ink2 });
  });

  function update(only) {
    if (!only) fix();
    vA.redraw(); vB.redraw();
    var T = st.n + 2 * st.p, ke = kef(), m = outSize(), num = T - ke;
    var html = "k_ef = " + st.k + " + (" + st.k + " − 1)·(" + st.d + " − 1) = <b>" + ke + "</b><br>";
    if (num < 0) html += "<span class='bad'>n + 2p = " + T + " es menor que k_ef = " + ke + ": no hay ninguna posición válida.</span>";
    else html += "m = ⌊(n + 2p − k_ef)/s⌋ + 1 = ⌊(" + st.n + " + " + (2 * st.p) + " − " + ke + ")/" + st.s + "⌋ + 1 = ⌊" + num + "/" + st.s + "⌋ + 1 = <b>" + m + "</b>";
    html += "<br>Parámetros por filtro (1 canal): " + st.k + "×" + st.k + " = <b>" + st.k * st.k + "</b> con cualquier d. Campo receptivo de una neurona de esta capa: <b>" + ke + "×" + ke + "</b>.";
    if (st.s === 1) html += "<br>Apilando 3 capas iguales (stride 1): campo receptivo = 1 + 3·(k_ef − 1) = <b>" + (1 + 3 * (ke - 1)) + "</b>.";
    out.set(html);
  }
  fix(); update();
});
