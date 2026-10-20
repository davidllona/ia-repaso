/* Experimento: nn.BatchNorm2d(2) con un lote de 2 imágenes de 2 canales y mapas de 3x3.
   Entrenamiento: una media y una varianza POR CANAL, calculadas sobre N·H·W = 18 valores. Evaluación: usa running_mean y running_var. */
(function () {
  var N = 2, C = 2, H = 3, W = 3, EPS = 1e-5, MOM = 0.1;

  /* data[n][c][h][w] */
  function stats(data, c) {
    var vals = [], n, h, w, s = 0, q = 0;
    for (n = 0; n < N; n++) for (h = 0; h < H; h++) for (w = 0; w < W; w++) vals.push(data[n][c][h][w]);
    vals.forEach(function (v) { s += v; });
    var mean = s / vals.length;
    vals.forEach(function (v) { q += (v - mean) * (v - mean); });
    return { mean: mean, varB: q / vals.length, varU: q / (vals.length - 1), count: vals.length };
  }
  function normalize(data, c, mean, variance, gamma, beta) {
    return data.map(function (img) {
      return img[c].map(function (row) { return row.map(function (v) { return gamma * (v - mean) / Math.sqrt(variance + EPS) + beta; }); });
    });
  }
  var core = { stats: stats, normalize: normalize, EPS: EPS, MOM: MOM };
  if (typeof module !== "undefined" && module.exports) module.exports = core;
  if (typeof Lab === "undefined") return;

  Lab.register("curso5/c5m3-batchnorm2d", function (root, api) {
    var D = api.d;
    var S = { mu1: 20, sd1: 8, gamma: 1, beta: 0, train: true, seed: 11, rm: [0, 0], rv: [1, 1], tracked: 0, data: null };
    function fmt1(x) { return (Math.round(x * 10) / 10).toFixed(1).replace("-0.0", "0.0"); }
    function fmtc(x) { return Math.abs(x) >= 10 ? String(Math.round(x)) : fmt1(x); }
    function fmt2(x) { return (Math.round(x * 100) / 100).toFixed(2); }

    function sample() {
      var r = api.rng(S.seed), d = [], n, c, h, w;
      for (n = 0; n < N; n++) { d.push([]); for (c = 0; c < C; c++) { d[n].push([]); for (h = 0; h < H; h++) { d[n][c].push([]); for (w = 0; w < W; w++) d[n][c][h].push(c === 0 ? r.normal(2, 1) : r.normal(S.mu1, S.sd1)); } } }
      return d;
    }
    function resample(raw) {
      S.data = sample();
      if (S.train && !raw) {
        for (var c = 0; c < C; c++) { var st = stats(S.data, c); S.rm[c] = (1 - MOM) * S.rm[c] + MOM * st.mean; S.rv[c] = (1 - MOM) * S.rv[c] + MOM * st.varU; }
        S.tracked++;
      }
    }

    var view = api.view(root, { aspect: 1.6, minH: 230, maxH: 300, label: "Mapas de características de dos imágenes y dos canales, antes y después de BatchNorm2d" });
    var ui = api.controls(root), out = api.readout(root);
    ui.slider({ label: "Media del canal 1 (el canal 0 tiene media 2)", min: 0, max: 40, step: 1, value: S.mu1, onInput: function (v) { S.mu1 = v; S.data = sample(); update(); } });
    ui.slider({ label: "Desviación del canal 1 (el canal 0 tiene 1)", min: 1, max: 15, step: 1, value: S.sd1, onInput: function (v) { S.sd1 = v; S.data = sample(); update(); } });
    ui.slider({ label: "γ (weight)", min: 0.5, max: 3, step: 0.5, value: S.gamma, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.gamma = v; update(); } });
    ui.slider({ label: "β (bias)", min: -2, max: 2, step: 0.5, value: S.beta, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.beta = v; update(); } });
    ui.segmented({ label: "Modo", value: "train", options: [["train", "model.train()"], ["eval", "model.eval()"]], onChange: function (v) { S.train = v === "train"; update(); } });
    ui.button("Nuevo lote ▶", function () { S.seed += 7; resample(); update(); }, "primary");
    ui.button("Reiniciar running stats", function () { S.rm = [0, 0]; S.rv = [1, 1]; S.tracked = 0; update(); });

    function used(c) {
      if (S.train) { var st = stats(S.data, c); return { mean: st.mean, v: st.varB }; }
      return { mean: S.rm[c], v: S.rv[c] };
    }
    function out4() { var res = []; for (var c = 0; c < C; c++) { var u = used(c); res.push(normalize(S.data, c, u.mean, u.v, S.gamma, S.beta)); } return res; }  // res[c][n][h][w]

    function draw(ctx, w, h, C0) {
      var cell = Math.max(16, Math.min(28, (w - 40) / 12.6)), mapW = cell * 3, gap = (w - 4 * mapW) / 5, rowsY = [30, 30 + mapW + 54], n, c, i, j, outv = out4();
      var maxAbs = 0; outv.forEach(function (ch) { ch.forEach(function (m) { m.forEach(function (r) { r.forEach(function (v) { maxAbs = Math.max(maxAbs, Math.abs(v)); }); }); }); });
      var maxIn = 0; S.data.forEach(function (im) { im.forEach(function (ch) { ch.forEach(function (r) { r.forEach(function (v) { maxIn = Math.max(maxIn, Math.abs(v)); }); }); }); });
      D.text(ctx, "ANTES (valores que llegan)", 4, 12, { size: 11, weight: 700, color: C0.ink2 });
      D.text(ctx, "DESPUÉS" + (S.train ? " (con la media y varianza del lote)" : " (con running_mean y running_var)"), 4, rowsY[1] - 18 + 0, { size: 11, weight: 700, color: C0.ink2 });
      var k = 0;
      for (c = 0; c < C; c++) for (n = 0; n < N; n++) {
        var x0 = gap + k * (mapW + gap);
        D.text(ctx, "canal " + c + " · img " + n, x0 + mapW / 2, rowsY[0] - 4, { size: 9.5, align: "center", color: c === 0 ? C0.cobaltoInk : C0.terracotaInk, weight: 600 });
        D.text(ctx, "canal " + c + " · img " + n, x0 + mapW / 2, rowsY[1] - 4, { size: 9.5, align: "center", color: c === 0 ? C0.cobaltoInk : C0.terracotaInk, weight: 600 });
        for (i = 0; i < H; i++) for (j = 0; j < W; j++) {
          var vin = S.data[n][c][i][j], vout = outv[c][n][i][j];
          D.rect(ctx, x0 + j * cell, rowsY[0] + i * cell, cell, cell, vin >= 0 ? C0.cobaltoWash : C0.terracotaWash, C0.line, 1);
          D.text(ctx, fmtc(vin), x0 + (j + 0.5) * cell, rowsY[0] + (i + 0.5) * cell + 3.5, { size: Math.min(10, cell * 0.36), align: "center", mono: true, color: C0.ink });
          D.rect(ctx, x0 + j * cell, rowsY[1] + i * cell, cell, cell, vout >= 0 ? C0.cobaltoWash : C0.terracotaWash, C0.line, 1);
          D.text(ctx, fmtc(vout), x0 + (j + 0.5) * cell, rowsY[1] + (i + 0.5) * cell + 3.5, { size: Math.min(10, cell * 0.36), align: "center", mono: true, color: C0.ink });
        }
        k++;
      }
    }
    S.data = sample(); view.draw(draw);

    function update() {
      var t = "", c, o = out4();
      for (c = 0; c < C; c++) {
        var st = stats(S.data, c), u = used(c), vals = [];
        o[c].forEach(function (m) { m.forEach(function (r) { r.forEach(function (v) { vals.push(v); }); }); });
        var m2 = api.math.mean(vals), s2 = api.math.std(vals);
        t += "<b>canal " + c + "</b> (" + st.count + " valores = N·H·W): antes media <b>" + fmt2(st.mean) + "</b>, varianza <b>" + fmt2(st.varB) + "</b> → después media <b>" + fmt2(m2) + "</b>, desviación <b>" + fmt2(s2) + "</b>" +
          " &nbsp;(usa " + (S.train ? "las del lote" : "running: " + fmt2(u.mean) + " y " + fmt2(u.v)) + ")<br>";
      }
      t += "running_mean = [" + fmt2(S.rm[0]) + ", " + fmt2(S.rm[1]) + "] · running_var = [" + fmt2(S.rv[0]) + ", " + fmt2(S.rv[1]) + "] · num_batches_tracked = " + S.tracked;
      if (!S.train && S.tracked < 20) t += "<br><span class='bad'>En eval con pocas actualizaciones las estadísticas acumuladas aún no se parecen a las del lote: pulsa «Nuevo lote» en modo train unas 30 veces.</span>";
      if (S.train) t += "<br>Con γ = " + S.gamma.toFixed(1) + " y β = " + S.beta.toFixed(1) + ", cada canal sale con media β y desviación ≈ |γ|, aunque entrase con escalas muy distintas.";
      out.set(t); view.redraw();
    }
    resample(); update();
  });
})();
