/* Experimento: qué se entrena en ResNet-18 al congelar. Parámetros y multiplicaciones-acumulaciones (MACs) REALES de cada etapa a 224×224
   (medidos con ganchos en PyTorch); el coste del backward es una ESTIMACIÓN (gradiente de pesos + gradiente de activaciones). */
Lab.register("curso5/c5m4-congelar", function (root, api) {
  var D = api.d;
  var S = { m: 1, K: 10, nueva: true };
  var B = [
    { n: "conv1\n+bn1", par: 9536, mac: 118013952 },
    { n: "layer1", par: 147968, mac: 462422016 },
    { n: "layer2", par: 525568, mac: 411041792 },
    { n: "layer3", par: 2099712, mac: 411041792 },
    { n: "layer4", par: 8393728, mac: 411041792 },
    { n: "fc", par: 513000, mac: 512000 }
  ];
  function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  function pf(i) { return i === 5 ? (S.nueva ? 512 * S.K + S.K : 513000) : B[i].par; }
  function mf(i) { return i === 5 ? (S.nueva ? 512 * S.K : 512000) : B[i].mac; }

  var view = api.view(root, { aspect: 2.1, minH: 190, maxH: 270, drag: true, label: "Bloques de ResNet-18: cuáles se entrenan y hasta dónde llega el backward. Se puede pulsar un bloque." });
  var ui = api.controls(root), out = api.readout(root);
  var sm = ui.slider({ label: "Bloques entrenables (contando desde el final)", min: 1, max: 6, step: 1, value: S.m, onInput: function (v) { S.m = v; update(); } });
  ui.slider({ label: "Número de géneros que quieres distinguir (K)", min: 2, max: 200, step: 1, value: S.K, onInput: function (v) { S.K = v; update(); } });
  ui.toggle({ label: "Sustituir fc por una capa nueva", value: S.nueva, onChange: function (v) { S.nueva = v; update(); } });

  view.pointer({ down: function (x, y) {
    var n = B.length, cw = (view.w - 8) / n, i = Math.floor((x - 4) / cw);
    if (i >= 0 && i < n) { S.m = n - i; sm.set(S.m, true); update(); }
  } });

  function draw(ctx, w, h, C) {
    var n = B.length, cw = (w - 8) / n, e = n - S.m, i, bw = cw - 6, bh = Math.min(86, h * 0.42), y0 = h * 0.30, fs = w < 420 ? 9.5 : 11;
    for (i = 0; i < n; i++) {
      var x = 4 + cw * i + 3, tr = i >= e;
      D.rect(ctx, x, y0, bw, bh, tr ? C.terracotaWash : C.cobaltoWash, tr ? C.terracota : C.cobalto, tr ? 2.2 : 1.2);
      var lines = B[i].n.split("\n");
      lines.forEach(function (t, k) { D.text(ctx, t, x + bw / 2, y0 + 16 + k * 13, { size: fs, mono: true, color: C.ink, align: "center", weight: 600 }); });
      D.text(ctx, tr ? "entrena" : "congelado", x + bw / 2, y0 + bh - 30, { size: fs - 1, color: tr ? C.terracotaInk : C.cobaltoInk, align: "center", weight: 600 });
      D.text(ctx, w < 420 ? (pf(i) > 99999 ? Math.round(pf(i) / 1000) + " k" : fmt(pf(i))) : fmt(pf(i)), x + bw / 2, y0 + bh - 12, { size: fs - 0.5, mono: true, color: C.ink2, align: "center" });
    }
    // forward
    D.arrow(ctx, 8, y0 - 14, w - 8, y0 - 14, C.cobalto, 1.6);
    D.text(ctx, "forward (todos)", 10, y0 - 20, { size: fs, color: C.cobaltoInk });
    // backward: desde la pérdida hasta el primer bloque entrenable
    var ya = y0 + bh + 18, xe = 4 + cw * e + 3 + bw / 2;
    D.arrow(ctx, w - 10, ya, xe, ya, C.terracota, 2.2);
    D.line(ctx, 8, ya, xe, ya, C.line, 1, [3, 4]);
    D.text(ctx, e === 0 ? "backward llega hasta el principio" : "backward se detiene aquí", Math.max(10, xe - 4), ya + 15, { size: fs, color: C.terracotaInk, align: e === 0 ? "left" : "center", weight: 600 });
    if (e > 0) D.text(ctx, "sin gradiente", 10, ya - 6, { size: fs - 1, color: C.muted });
  }
  view.draw(draw);

  function update() {
    var n = B.length, e = n - S.m, i, tot = 0, tr = 0, F = 0, Wg = 0, Ag = 0, Wg0 = 0, Ag0 = 0;
    for (i = 0; i < n; i++) { tot += pf(i); F += mf(i); if (i >= e) { tr += pf(i); Wg += mf(i); } if (i > e) Ag += mf(i); Wg0 += mf(i); if (i > 0) Ag0 += mf(i); }
    var coste = (F + Wg + Ag) / (F + Wg0 + Ag0);
    var s = "Entrenables: <b>" + fmt(tr) + "</b> de <b>" + fmt(tot) + "</b> parámetros (<b>" + (100 * tr / tot).toFixed(2).replace(".", ",") + " %</b>)";
    s += "<br>fc " + (S.nueva ? "nueva: 512·" + S.K + " + " + S.K + " = <b>" + fmt(512 * S.K + S.K) + "</b>" : "original (1000 clases): <b>513.000</b>") + " · el optimizador solo recibe los parámetros de los bloques que entrenan";
    s += "<br>Coste estimado de un paso (forward + backward): <b>" + (100 * coste).toFixed(0) + " %</b> del de entrenar toda la red. El ahorro viene de no calcular gradientes en los bloques anteriores al primero que entrena; congelar bloques del <i>medio</i> no evita pasar el gradiente por ellos.";
    if (S.m === 1) s += "<br><span class='good'>Solo la cabeza: es la fase 1 del transfer learning (el crítico no cambia su forma de ver cine, solo aprende tus géneros).</span>";
    else if (S.m === 6) s += "<br><span class='bad'>Todo entrenable: con pocos datos y learning rate alto se destruye lo preentrenado (el crítico olvida lo que sabía de cine).</span>";
    out.set(s); view.redraw();
  }
  update();
});
