/* Experimento: BatchNorm1d con DOS características, como nn.BatchNorm1d(2). En entrenamiento normaliza con la media y la varianza (sesgada, ÷N)
   del lote y actualiza running_mean y running_var (momentum 0,1; varianza sin sesgo ÷(N−1)). En evaluación usa los valores acumulados. */
Lab.register("curso5/c5m2-batchnorm-batch", function (root, api) {
  var D = api.d, C0 = api.colors(), EPS = 1e-5;
  var S = { n: 16, mu1: 4, sd1: 3, gamma: 1, beta: 0, batches: 0, rm: [0, 0], rv: [1, 1], batch: null, seed: 3 };
  var R = api.rng(S.seed);
  var MU2 = -2, SD2 = 0.7;

  function newBatch() {
    var xs = [], i;
    for (i = 0; i < S.n; i++) { var a = R.normal(0, 1), b = R.normal(0, 1); xs.push([S.mu1 + S.sd1 * a, MU2 + SD2 * (0.6 * a + 0.8 * b)]); }
    var m = [0, 0], v = [0, 0], j;
    for (j = 0; j < 2; j++) { for (i = 0; i < S.n; i++) m[j] += xs[i][j]; m[j] /= S.n; for (i = 0; i < S.n; i++) v[j] += (xs[i][j] - m[j]) * (xs[i][j] - m[j]); v[j] /= S.n; }
    for (j = 0; j < 2; j++) { S.rm[j] = 0.9 * S.rm[j] + 0.1 * m[j]; S.rv[j] = 0.9 * S.rv[j] + 0.1 * v[j] * S.n / Math.max(1, S.n - 1); }
    S.batches++; S.batch = { xs: xs, m: m, v: v };
  }
  function reset() { R = api.rng(S.seed); S.batches = 0; S.rm = [0, 0]; S.rv = [1, 1]; newBatch(); }
  function trainOut(x) { var b = S.batch; return [0, 1].map(function (j) { return S.gamma * (x[j] - b.m[j]) / Math.sqrt(b.v[j] + EPS) + S.beta; }); }
  function evalOut(x) { return [0, 1].map(function (j) { return S.gamma * (x[j] - S.rm[j]) / Math.sqrt(S.rv[j] + EPS) + S.beta; }); }

  var row = api.el("div", { class: "lab-row" }), colA = api.el("div"), colB = api.el("div");
  row.appendChild(colA); row.appendChild(colB); root.appendChild(row);
  var vA = api.view(colA, { aspect: 1.15, minH: 230, maxH: 340, label: "Las dos características del lote antes de BatchNorm" });
  var pA = api.plot(vA, { xr: [-8, 16], yr: [-6, 3], xticks: 4, yticks: 3, pad: { l: 30, r: 8, t: 20, b: 24 }, xfmt: function (v) { return Math.round(v); }, yfmt: function (v) { return Math.round(v); } });
  var vB = api.view(colB, { aspect: 1.15, minH: 230, maxH: 340, label: "El mismo lote después de BatchNorm en modo entrenamiento y en modo evaluación" });
  var pB = api.plot(vB, { xr: [-4, 4], yr: [-4, 4], xticks: 4, yticks: 4, pad: { l: 30, r: 8, t: 20, b: 24 }, xfmt: function (v) { return Math.round(v); }, yfmt: function (v) { return Math.round(v); } });
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.72rem, 2.7vw, .84rem)";
  ui.slider({ label: "Tamaño del lote N", min: 2, max: 64, step: 1, value: S.n, onInput: function (v) { S.n = v; reset(); update(); } });
  ui.slider({ label: "Media de la característica 1", min: -4, max: 10, step: 0.5, value: S.mu1, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.mu1 = v; reset(); update(); } });
  ui.slider({ label: "Desviación de la característica 1", min: 0.5, max: 5, step: 0.5, value: S.sd1, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.sd1 = v; reset(); update(); } });
  ui.slider({ label: "γ (weight de BatchNorm)", min: 0.2, max: 3, step: 0.1, value: S.gamma, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.gamma = v; update(); } });
  ui.slider({ label: "β (bias de BatchNorm)", min: -2, max: 2, step: 0.1, value: S.beta, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.beta = v; update(); } });
  ui.button("Procesar un lote nuevo", function () { newBatch(); update(); }, "primary");
  ui.button("Procesar 20 lotes", function () { for (var i = 0; i < 20; i++) newBatch(); update(); });
  ui.button("Reiniciar la capa", function () { S.seed++; reset(); update(); });
  api.legend(root, [[C0.cobalto, "salida en train (estadísticas del lote)"], [C0.terracota, "salida en eval (running_mean / running_var)"]]);

  function drawA(ctx, w, h, C) {
    pA.axes(ctx); ctx.save(); pA.clip(ctx);
    S.batch.xs.forEach(function (x) { D.circle(ctx, pA.x(x[0]), pA.y(x[1]), 3.8, C.cobalto, C.paper, 1); });
    var b = S.batch; D.line(ctx, pA.x(b.m[0]), pA.box.y, pA.x(b.m[0]), pA.box.y + pA.box.h, C.cobaltoInk, 1.2, [4, 3]); D.line(ctx, pA.box.x, pA.y(b.m[1]), pA.box.x + pA.box.w, pA.y(b.m[1]), C.cobaltoInk, 1.2, [4, 3]);
    ctx.restore(); D.text(ctx, "antes: característica 1 (→) y 2 (↑)", pA.box.x + 2, 13, { size: 11, color: C.ink2, weight: 600 });
  }
  function drawB(ctx, w, h, C) {
    pB.axes(ctx); ctx.save(); pB.clip(ctx);
    S.batch.xs.forEach(function (x) { var e = evalOut(x); D.circle(ctx, pB.x(e[0]), pB.y(e[1]), 4, null, C.terracota, 1.6); });
    S.batch.xs.forEach(function (x) { var t = trainOut(x); D.circle(ctx, pB.x(t[0]), pB.y(t[1]), 3.4, C.cobalto, C.paper, 1); });
    ctx.restore(); D.text(ctx, "después de BatchNorm", pB.box.x + 2, 13, { size: 11, color: C.ink2, weight: 600 });
  }
  reset();
  vA.draw(drawA); vB.draw(drawB);
  function f2(v) { return v.toFixed(2).replace("-", "−"); }
  function update() {
    var b = S.batch, t = b.xs.map(trainOut), m = [0, 0], sd = [0, 0], j, i;
    for (j = 0; j < 2; j++) { t.forEach(function (o) { m[j] += o[j]; }); m[j] /= t.length; t.forEach(function (o) { sd[j] += (o[j] - m[j]) * (o[j] - m[j]); }); sd[j] = Math.sqrt(sd[j] / t.length); }
    var x0 = b.xs[0], to = trainOut(x0), eo = evalOut(x0);
    out.set("Lote nº <b>" + S.batches + "</b> (N = " + S.n + ") · media del lote = (<b>" + f2(b.m[0]) + "</b>; <b>" + f2(b.m[1]) + "</b>) · varianza (÷N) = (<b>" + f2(b.v[0]) + "</b>; <b>" + f2(b.v[1]) + "</b>)<br>" +
      "running_mean = (<b>" + f2(S.rm[0]) + "</b>; <b>" + f2(S.rm[1]) + "</b>) · running_var = (<b>" + f2(S.rv[0]) + "</b>; <b>" + f2(S.rv[1]) + "</b>) · valores reales: media (" + S.mu1.toFixed(1) + "; " + MU2.toFixed(1) + "), varianza (" + (S.sd1 * S.sd1).toFixed(2) + "; " + (SD2 * SD2).toFixed(2) + ")<br>" +
      "Salida en train: media (<b>" + f2(m[0]) + "</b>; <b>" + f2(m[1]) + "</b>) = β y desviación (<b>" + f2(sd[0]) + "</b>; <b>" + f2(sd[1]) + "</b>) ≈ γ · Primera muestra: train (" + f2(to[0]) + "; " + f2(to[1]) + ") frente a eval (" + f2(eo[0]) + "; " + f2(eo[1]) + ")" +
      (S.batches < 30 ? "<br><span class='bad'>Las medias móviles aún están lejos de la realidad (arrancan en 0 y 1): en eval los aros terracota se desplazan respecto a los puntos azules. Pulsa «Procesar 20 lotes».</span>" : "<br><span class='good'>Las medias móviles ya son estables: los aros terracota (eval) se parecen a los puntos azules (train); la diferencia que queda es la de este lote concreto.</span>") +
      (S.n < 8 ? "<br><span class='bad'>Con lotes tan pequeños, la media y la varianza del lote son ruidosas: cada lote normaliza distinto.</span>" : ""));
    vA.redraw(); vB.redraw();
  }
  reset(); update();
});
