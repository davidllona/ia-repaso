/* Experimento: transfer learning en dos fases. El esquema cuenta de verdad los parámetros entrenables y congelados de la red del proyecto
   (base de 3 bloques + cabeza) según la fase y los bloques que descongeles. Las barras y las curvas son RESULTADOS REALES medidos en
   Python con ese mismo modelo (dígitos 5-9, 75 imágenes de entrenamiento; media de 3 semillas en las barras, semilla 0 en las curvas):
   los números se copiaron de la ejecución de los fragmentos del módulo. */
Lab.register("curso3/c3m7-fases", function (root, api) {
  var D = api.d;
  var DATA = {"scratch":0.946,"phase1":0.871,"sweep":{"1":{"1e-5":0.876,"1e-4":0.886,"1e-3":0.91},"2":{"1e-5":0.874,"1e-4":0.902,"1e-3":0.87},"3":{"1e-5":0.868,"1e-4":0.905,"1e-3":0.889}},"curve1":[0.3333,0.3467,0.64,0.6533,0.6667,0.7067,0.7067,0.7067,0.6933,0.72,0.7467,0.7333,0.76,0.7733,0.8133,0.7733,0.76,0.7733,0.7867,0.8133,0.7733,0.7467,0.8267,0.8267,0.8267,0.8267,0.8533,0.8267,0.8267,0.8133,0.84,0.8533,0.8267,0.7867,0.84,0.8533,0.8533,0.8533,0.84,0.8267,0.84,0.84,0.84,0.8667,0.8533,0.8533,0.88,0.8667,0.88,0.8533,0.8533,0.8533,0.8533,0.8533,0.8533,0.8533,0.8667,0.88,0.88,0.8533],"curve2":[0.8667,0.8667,0.88,0.8933,0.8933,0.8933,0.8933,0.8933,0.8933,0.8933,0.8933,0.8933,0.8933,0.8933,0.8933,0.8667,0.88,0.88,0.88,0.88,0.88,0.88,0.8667,0.8667,0.8667,0.8667,0.8667,0.8667,0.8667,0.8667]};
  // parámetros por bloque: [entrenables, no entrenables] cuando el bloque se entrena / cuando se congela se suman todos como congelados
  var BLOCKS = [
    { name: "bloque 1", sub: "Conv 3→16 + BN + ReLU + pool", conv: 432, bnT: 32, bnN: 32 },
    { name: "bloque 2", sub: "Conv 16→32 + BN + ReLU + pool", conv: 4608, bnT: 64, bnN: 64 },
    { name: "bloque 3", sub: "Conv 32→64 + BN + ReLU + pool", conv: 18432, bnT: 128, bnN: 128 }
  ];
  var HEAD = 5125;                     // Flatten + Dropout + Dense(1024 → 5): 1024·5 + 5
  var S = { phase: 1, n: 1, lr: "1e-4" };

  function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  function counts() {
    var tr = HEAD, fr = 0, unfrozen = S.phase === 2 ? S.n : 0, st = [];
    BLOCKS.forEach(function (b, i) {
      var train = i >= 3 - unfrozen, total = b.conv + b.bnT + b.bnN;
      if (train) tr += b.conv + b.bnT; else fr += b.conv + b.bnT;
      fr += b.bnN;                           // las medias y varianzas móviles de BatchNorm nunca se entrenan por gradiente
      st.push(train);
    });
    return { tr: tr, fr: fr, st: st };
  }

  var v1 = api.view(root, { aspect: 1.9, minH: 230, maxH: 300, label: "Esquema de la red con los bloques congelados y los entrenables según la fase" });
  var ui = api.controls(root), out = api.readout(root);
  var seg = ui.segmented({ label: "Fase", options: [[1, "1 · solo la cabeza"], [2, "2 · descongelar bloques"]], value: S.phase, onChange: function (v) { S.phase = v; update(); } });
  var sl = ui.slider({ label: "Bloques descongelados (desde el último)", min: 1, max: 3, step: 1, value: S.n, onInput: function (v) { S.n = v; update(); } });
  ui.segmented({ label: "Learning rate de la fase 2", options: [["1e-5", "1e-5"], ["1e-4", "1e-4"], ["1e-3", "1e-3"]], value: S.lr, onChange: function (v) { S.lr = v; update(); } });
  var v2 = api.view(root, { aspect: 1.45, minH: 270, maxH: 360, label: "Exactitud en el test medida para cada configuración" });
  var v3 = api.view(root, { aspect: 2.3, minH: 170, maxH: 250, label: "Curva de exactitud de validación durante las dos fases" });
  var p3 = api.plot(v3, { xr: [0, 90], yr: [0, 1], xticks: 6, yticks: 4, grid: true, pad: { l: 40, r: 12, t: 14, b: 32 }, xlabel: "época (60 de fase 1 + 30 de fase 2)", yfmt: function (v) { return Math.round(v * 100) + "%"; } });
  api.legend(root, [[api.colors().cobalto, "congelado"], [api.colors().terracota, "entrenable"], [api.colors().oliva, "configuración elegida"]]);

  function rows() {
    var r = [{ k: "scratch", label: "desde cero", v: DATA.scratch }, { k: "p1", label: "solo fase 1", v: DATA.phase1 }];
    [1, 2, 3].forEach(function (n) { ["1e-5", "1e-4", "1e-3"].forEach(function (lr) { r.push({ k: n + "|" + lr, label: (n === 3 ? "todo" : n === 1 ? "bloque 3" : "bloques 2-3") + " · " + lr, v: DATA.sweep[n][lr] }); }); });
    return r;
  }
  function sel() { return S.phase === 1 ? "p1" : S.n + "|" + S.lr; }

  v1.draw(function (ctx, w, h, C) {
    var c = counts(), x0 = 10, bw = Math.min(w - 20 - 78, 330), bh = (h - 20) / 5 - 8, y = 8, items = [
      { name: "imagen 32×32×3", sub: "→ aumento (solo al entrenar) → Rescaling", st: null, p: 0 }
    ].concat(BLOCKS.map(function (b, i) { return { name: b.name, sub: b.sub, st: c.st[i], p: b.conv + b.bnT + b.bnN }; })).concat([{ name: "cabeza nueva", sub: "Flatten + Dropout + Dense(5)", st: true, p: HEAD }]);
    items.forEach(function (it, i) {
      var col = it.st === null ? C.muted : it.st ? C.terracota : C.cobalto;
      var fill = it.st === null ? C.surface : it.st ? C.terracotaWash : C.cobaltoWash;
      D.rect(ctx, x0, y, bw, bh, fill, col, 2);
      D.text(ctx, it.name, x0 + 8, y + bh * 0.42, { size: 12.5, weight: 700, color: C.ink });
      D.text(ctx, it.sub, x0 + 8, y + bh * 0.8, { size: w < 420 ? 9.5 : 10.5, color: C.ink2 });
      D.text(ctx, it.st === null ? "" : it.st ? "ENTRENABLE" : "CONGELADO", x0 + bw + 8, y + bh * 0.42, { size: 10, weight: 700, color: it.st ? C.terracotaInk : C.cobaltoInk });
      if (it.p) D.text(ctx, fmt(it.p), x0 + bw + 8, y + bh * 0.82, { size: 10, color: C.muted, mono: true });
      y += bh + 8;
    });
  });
  v2.draw(function (ctx, w, h, C) {
    var r = rows(), lw = Math.min(118, w * 0.34), x0 = lw + 6, bw = w - x0 - 52, rh = (h - 12) / r.length, s = sel();
    r.forEach(function (it, i) {
      var y = 6 + i * rh, on = it.k === s;
      D.text(ctx, it.label, lw, y + rh * 0.68, { align: "right", size: w < 420 ? 10 : 11, weight: on ? 700 : 400, color: on ? C.ink : C.ink2 });
      D.rect(ctx, x0, y + 2, Math.max(1, bw * it.v), rh - 5, on ? C.oliva : C.cobalto, on ? C.ink : null, 1.5);
      D.text(ctx, (it.v * 100).toFixed(1).replace(".", ",") + " %", x0 + bw * it.v + 5, y + rh * 0.68, { size: 10.5, weight: on ? 700 : 400, color: C.ink2, mono: true });
    });
  });
  v3.draw(function (ctx, w, h, C) {
    p3.axes(ctx);
    var b = p3.box, h1 = DATA.curve1, h2 = DATA.curve2, i, pts = [];
    ctx.save(); p3.clip(ctx);
    D.line(ctx, p3.x(60), b.y, p3.x(60), b.y + b.h, C.ink, 1.5, [5, 4]);
    pts = h1.map(function (v, k) { return [p3.x(k + 1), p3.y(v)]; }); D.path(ctx, pts, C.cobalto, 2.4);
    pts = [[p3.x(60), p3.y(h1[h1.length - 1])]].concat(h2.map(function (v, k) { return [p3.x(61 + k), p3.y(v)]; })); D.path(ctx, pts, C.terracota, 2.4);
    ctx.restore();
    D.text(ctx, "fase 1 · lr 1e-3", p3.x(30), b.y + b.h - 8, { align: "center", size: 11, weight: 600, color: C.cobaltoInk });
    D.text(ctx, "fase 2 · lr 1e-4", p3.x(75), b.y + b.h - 8, { align: "center", size: 11, weight: 600, color: C.terracotaInk });
  });

  function update() {
    var c = counts(), tot = c.tr + c.fr, r = rows(), s = sel(), cur = r.filter(function (x) { return x.k === s; })[0];
    sl.input.disabled = S.phase === 1;
    out.set("<b>Parámetros entrenables:</b> " + fmt(c.tr) + " de " + fmt(tot) + " (" + (100 * c.tr / tot).toFixed(1).replace(".", ",") + " %) · <b>congelados:</b> " + fmt(c.fr) +
      "<br><b>Exactitud en el test</b> de esta configuración: <b>" + (cur.v * 100).toFixed(1).replace(".", ",") + " %</b>" + (S.phase === 2 ? " (media de 3 semillas, lr " + S.lr + ")" : " (media de 3 semillas)") +
      "<br>" + (S.phase === 1 ? "Solo se entrena la cabeza nueva: es rápido y seguro, pero la base solo sabe lo que aprendió con los dígitos 0-4." :
        (S.lr === "1e-3" ? "<span class='bad'>learning rate demasiado alto para afinar</span>: cada paso reescribe pesos que estaban bien." : "Learning rate bajo: los pesos preentrenados se ajustan con suavidad.")) +
      "<br>Referencia: entrenar la misma red desde cero da <b>" + (DATA.scratch * 100).toFixed(1).replace(".", ",") + " %</b>.");
    v1.redraw(); v2.redraw(); v3.redraw();
  }
  update();
});
