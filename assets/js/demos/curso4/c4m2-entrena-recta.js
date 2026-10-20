/* Experimento: entrenar y = w·x + b con mini-batches. Las mismas 240 películas (x = nota de la crítica, y = valoración de los usuarios = 3x + 1 + ruido 0.1) y los mismos hiperparámetros,
   con batch_size = 240, 40, 8 y 1. Cada paso calcula el gradiente del MSE del lote y actualiza w y b (descenso del gradiente real, en JavaScript).
   Se pinta la pérdida con TODOS los datos tras cada paso, frente a las épocas. */
Lab.register("curso4/c4m2-entrena-recta", function (root, api) {
  var D = api.d, M = api.math, N = 240, BS = [240, 40, 8, 1];
  var R0 = api.rng(5), xs = [], ys = [], i;
  for (i = 0; i < N; i++) { var x = R0.range(-1, 1); xs.push(x); ys.push(3 * x + 1 + R0.normal(0, 0.1)); }
  var S = { lr: 0.1, E: 5, sel: 40, seed: 1 }, runs = {};

  function lossAll(w, b) { var s = 0, k; for (k = 0; k < N; k++) { var e = w * xs[k] + b - ys[k]; s += e * e; } return s / N; }
  function train(B) {
    var R = api.rng(S.seed * 13 + B), w = 0, b = 0, idx = [], k, e, pts = [{ x: 0, l: lossAll(0, 0) }], steps = 0, spe = Math.ceil(N / B);
    for (k = 0; k < N; k++) idx.push(k);
    for (e = 0; e < S.E; e++) {
      R.shuffle(idx);
      for (var s0 = 0; s0 < N; s0 += B) {
        var gw = 0, gb = 0, n = Math.min(B, N - s0), j;
        for (j = s0; j < s0 + n; j++) { var err = w * xs[idx[j]] + b - ys[idx[j]]; gw += 2 * err * xs[idx[j]]; gb += 2 * err; }
        w -= S.lr * gw / n; b -= S.lr * gb / n; steps++;
        if (!isFinite(w) || Math.abs(w) > 1e6) { w = NaN; }
        pts.push({ x: steps / spe, l: lossAll(w, b) });
      }
      if (isNaN(w)) break;
    }
    return { w: w, b: b, steps: steps, pts: pts, loss: lossAll(w, b), spe: spe };
  }
  var vA = api.view(root, { aspect: 2.2, minH: 220, maxH: 290, label: "Pérdida con las 240 películas frente al número de épocas, para cuatro tamaños de lote" });
  var vB = api.view(root, { aspect: 2.4, minH: 180, maxH: 250, label: "Las 240 películas (nota de la crítica frente a valoración de los usuarios) y la recta aprendida con el tamaño de lote elegido" });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "learning rate", min: 0.01, max: 0.5, step: 0.01, value: S.lr, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.lr = v; update(); } });
  ui.slider({ label: "épocas", min: 1, max: 10, step: 1, value: S.E, onInput: function (v) { S.E = v; update(); } });
  ui.segmented({ label: "recta del panel inferior (batch_size)", options: BS.map(function (b) { return [b, String(b)]; }), value: S.sel, onChange: function (v) { S.sel = +v; update(); } });
  ui.button("Otro orden de los datos", function () { S.seed++; update(); }, "primary");
  var C0 = api.colors();
  api.legend(root, [[C0.cobalto, "B = 240 (lote completo)"], [C0.terracota, "B = 40 (mini-batch)"], [C0.oliva, "B = 8"], [C0.marker, "B = 1 (SGD)"]]);

  var pl = api.plot(vA, { xr: [0, 5], yr: [-3, 1], xticks: 5, yticks: 4, xlabel: "épocas", ylabel: "pérdida (MSE) · escala log₁₀", pad: { l: 58, r: 12, t: 12, b: 36 }, yfmt: function (v) { return "1e" + (v >= 0 ? "+" : "") + Math.round(v); } });
  var pl2 = api.plot(vB, { xr: [-1, 1], yr: [-3, 5], xticks: 4, yticks: 4, xlabel: "nota de la crítica (centrada)", ylabel: "valoración usuarios", pad: { l: 40, r: 12, t: 10, b: 36 } });
  function drawA(ctx, w, h, C) {
    pl.xr = [0, S.E]; pl.axes(ctx); ctx.save(); pl.clip(ctx);
    var cols = [C.cobalto, C.terracota, C.oliva, C.marker];
    BS.forEach(function (B, k) {
      var r = runs[B]; if (!r) return;
      var pts = r.pts.filter(function (p, q) { return r.pts.length < 600 || q % Math.ceil(r.pts.length / 600) === 0 || q === r.pts.length - 1; });
      D.path(ctx, pts.map(function (p) { return [pl.x(p.x), pl.y(M.clamp(Math.log10(Math.max(p.l, 1e-9)), -3, 1))]; }), cols[k], B === S.sel ? 2.6 : 1.4);
    });
    ctx.restore();
  }
  function drawB(ctx, w, h, C) {
    pl2.axes(ctx); ctx.save(); pl2.clip(ctx);
    for (var k = 0; k < N; k += 1) D.circle(ctx, pl2.x(xs[k]), pl2.y(ys[k]), 2.2, C.cobaltoWash, C.cobalto, 0.8);
    D.line(ctx, pl2.x(-1), pl2.y(3 * -1 + 1), pl2.x(1), pl2.y(3 * 1 + 1), C.muted, 1.5, [5, 4]);
    var r = runs[S.sel];
    if (r && isFinite(r.w)) D.line(ctx, pl2.x(-1), pl2.y(-r.w + r.b), pl2.x(1), pl2.y(r.w + r.b), C.terracota, 3);
    ctx.restore();
  }
  vA.draw(drawA); vB.draw(drawB);

  function update() {
    BS.forEach(function (B) { runs[B] = train(B); });
    var rows = BS.map(function (B) { var r = runs[B]; return "B = <b>" + B + "</b>: " + r.steps + " pasos · w = " + (isFinite(r.w) ? r.w.toFixed(3) : "NaN") + ", b = " + (isFinite(r.b) ? r.b.toFixed(3) : "NaN") + " · pérdida = <b class='" + (r.loss < 0.03 ? "good" : "bad") + "'>" + (isFinite(r.loss) ? r.loss.toFixed(4) : "explota") + "</b>"; });
    out.set(rows.join("<br>") + "<br>Objetivo: w = 3, b = 1 (la línea discontinua) y pérdida ≈ 0.01 (el ruido). Recta naranja = la aprendida con B = " + S.sel + ".");
    vA.redraw(); vB.redraw();
  }
  update();
});
