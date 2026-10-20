/* Experimento: autoencoder que elimina ruido (entrada ruidosa, objetivo limpio) frente a uno entrenado con entrada = objetivo = limpia. */
Lab.register("curso2/c2m5-denoising", function (root, api) {
  /* ---- Mini red densa con Adam (solo para esta demo) ---- */
  function makeMLP(sizes, acts, rng, lr) {
    var L = sizes.length - 1, W = [], B = [], gW = [], gB = [], mW = [], vW = [], mB = [], vB = [], A = [], t = 0, l;
    for (l = 0; l < L; l++) {
      var nin = sizes[l], nout = sizes[l + 1], s = Math.sqrt(2 / (nin + nout)), w = new Float64Array(nin * nout), i;
      for (i = 0; i < w.length; i++) w[i] = rng.normal(0, s);
      W.push(w); B.push(new Float64Array(nout));
      gW.push(new Float64Array(nin * nout)); gB.push(new Float64Array(nout));
      mW.push(new Float64Array(nin * nout)); vW.push(new Float64Array(nin * nout));
      mB.push(new Float64Array(nout)); vB.push(new Float64Array(nout));
    }
    for (l = 0; l <= L; l++) A.push(new Float64Array(sizes[l]));
    function act(a, z) { return a === "relu" ? (z > 0 ? z : 0) : a === "tanh" ? Math.tanh(z) : a === "sigmoid" ? 1 / (1 + Math.exp(-z)) : z; }
    function dact(a, y) { return a === "relu" ? (y > 0 ? 1 : 0) : a === "tanh" ? 1 - y * y : a === "sigmoid" ? y * (1 - y) : 1; }
    function fwd(x) {
      var i, j, l2;
      for (i = 0; i < x.length; i++) A[0][i] = x[i];
      for (l2 = 0; l2 < L; l2++) {
        var nin2 = sizes[l2], nout2 = sizes[l2 + 1], w2 = W[l2], a = A[l2], o = A[l2 + 1];
        for (j = 0; j < nout2; j++) {
          var z = B[l2][j], base = j * nin2;
          for (i = 0; i < nin2; i++) z += w2[base + i] * a[i];
          o[j] = act(acts[l2], z);
        }
      }
      return A[L];
    }
    var net = {
      W: W, B: B, A: A, nParams: 0, lr: lr,
      predict: function (x) { return Array.prototype.slice.call(fwd(x)); },
      layer: function (x, k) { fwd(x); return Array.prototype.slice.call(A[k]); },
      /* un paso de Adam con el lote idx; devuelve el error medio (MSE) del lote */
      step: function (X, Y, idx, opt) {
        opt = opt || {}; var bce = !!opt.bce, nfz = opt.freeze || 0;
        var l3, i, j, s, tot = 0, n = idx.length;
        for (l3 = 0; l3 < L; l3++) { gW[l3].fill(0); gB[l3].fill(0); }
        for (s = 0; s < n; s++) {
          var out = fwd(X[idx[s]]), y = Y[idx[s]], nout = sizes[L], d = new Float64Array(nout);
          for (j = 0; j < nout; j++) {
            var e = out[j] - y[j];
            if (bce) { tot += -(y[j] * Math.log(Math.max(out[j], 1e-7)) + (1 - y[j]) * Math.log(Math.max(1 - out[j], 1e-7))) / nout; d[j] = e / nout; }
            else { tot += e * e / nout; d[j] = 2 * e / nout * dact(acts[L - 1], out[j]); }
          }
          for (l3 = L - 1; l3 >= 0; l3--) {
            var nin3 = sizes[l3], no3 = sizes[l3 + 1], a3 = A[l3], w3 = W[l3], dp = l3 > 0 ? new Float64Array(nin3) : null;
            for (j = 0; j < no3; j++) {
              var dj = d[j], b3 = j * nin3; gB[l3][j] += dj;
              for (i = 0; i < nin3; i++) { gW[l3][b3 + i] += dj * a3[i]; if (dp) dp[i] += w3[b3 + i] * dj; }
            }
            if (dp) { for (i = 0; i < nin3; i++) dp[i] *= dact(acts[l3 - 1], a3[i]); d = dp; }
          }
        }
        t++;
        var b1 = 0.9, b2 = 0.999, c1 = 1 - Math.pow(b1, t), c2 = 1 - Math.pow(b2, t);
        for (l3 = nfz; l3 < L; l3++) {
          var arrs = [[W[l3], gW[l3], mW[l3], vW[l3]], [B[l3], gB[l3], mB[l3], vB[l3]]];
          for (var q = 0; q < 2; q++) {
            var p = arrs[q][0], g = arrs[q][1], m = arrs[q][2], v = arrs[q][3];
            for (i = 0; i < p.length; i++) {
              var gi = g[i] / n; m[i] = b1 * m[i] + (1 - b1) * gi; v[i] = b2 * v[i] + (1 - b2) * gi * gi;
              p[i] -= net.lr * (m[i] / c1) / (Math.sqrt(v[i] / c2) + 1e-8);
            }
          }
        }
        return tot / n;
      }
    };
    for (l = 0; l < L; l++) net.nParams += sizes[l] * sizes[l + 1] + sizes[l + 1];
    return net;
  }
  var S = 8, H = 32, K = 16, NTR = 200, NTE = 100, NS = 5, BATCH = 25, EP = 120, TS = 0.25;
  var data = api.rng(21), clean = [], test = [], zTr = [], zTe = [], i, q;
  function rect() { var x1 = data.int(1, 3), y1 = data.int(1, 3), x2 = data.int(5, 7), y2 = data.int(5, 7), im = new Array(64).fill(0), x, y; for (y = y1; y < y2; y++) for (x = x1; x < x2; x++) im[y * 8 + x] = 1; return im; }
  for (i = 0; i < NTR; i++) { clean.push(rect()); zTr.push(new Array(64).fill(0).map(function () { return data.normal(0, 1); })); }
  for (i = 0; i < NTE; i++) { test.push(rect()); zTe.push(new Array(64).fill(0).map(function () { return data.normal(0, 1); })); }
  function noisy(x, z, s) { return x.map(function (v, j) { return Math.min(1, Math.max(0, v + s * z[j])); }); }
  var withNoise = true, sigma = 0.25, net, epochs = 0, order = [], shuf = api.rng(8), loop, btn, trained = false;
  function init() {
    if (loop) loop.stop();
    net = makeMLP([64, H, K, H, 64], ["relu", "linear", "relu", "sigmoid"], api.rng(5), 0.01); epochs = 0; order = clean.map(function (_, j) { return j; });
    Xin = withNoise ? clean.map(function (x, j) { return noisy(x, zTr[j], TS); }) : clean;
  }
  var Xin;
  function whenVisible(fn) {
    if (!window.IntersectionObserver) { fn(); return; }
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); fn(); } });
    io.observe(root);
  }
  function epoch() { shuf.shuffle(order); for (var b = 0; b < NTR; b += BATCH) net.step(Xin, clean, order.slice(b, b + BATCH)); epochs++; }
  loop = api.loop(function () { for (var j = 0; j < 3 && epochs < EP; j++) epoch(); update(); return epochs < EP; }, { fps: 30, onState: function (s) { if (btn) btn.disabled = s; } });
  function train() { init(); if (api.reduceMotion) { while (epochs < EP) epoch(); update(); } else loop.start(); }
  init();
  var view = api.view(root, { aspect: 1.4, minH: 300, maxH: 410, label: "Imágenes limpias, ruidosas y limpiadas por el autoencoder" });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Ruido de las imágenes de prueba (σ)", min: 0, max: 0.6, step: 0.05, value: sigma, fmt: function (v) { return v.toFixed(2).replace(".", ","); }, onInput: function (v) { sigma = v; update(); } });
  ui.segmented({ label: "El autoencoder se entrena con…", options: [[true, "entrada ruidosa → objetivo limpio"], [false, "entrada limpia → objetivo limpio"]], value: withNoise, onChange: function (v) { withNoise = v; train(); } });
  btn = ui.button("Volver a entrenar (120 épocas)", function () { train(); }, "primary");
  function mix(a, b, t) {
    function p(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
    var u = p(a), v = p(b); return "rgb(" + [0, 1, 2].map(function (k) { return Math.round(u[k] + (v[k] - u[k]) * t); }).join(",") + ")";
  }
  function drawImg(ctx, im, x0, y0, s, C) { var r, c; for (r = 0; r < 8; r++) for (c = 0; c < 8; c++) api.d.rect(ctx, x0 + c * s, y0 + r * s, s + 0.5, s + 0.5, mix(C.surface, C.cobalto, Math.max(0, Math.min(1, im[r * 8 + c])))); api.d.rect(ctx, x0, y0, s * 8, s * 8, null, C.line, 1); }
  view.draw(function (ctx, w, h, C) {
    var gap = 8, cell = Math.min(100, (w - 20 - gap * (NS - 1)) / NS), s = cell / 8, x0 = (w - (cell * NS + gap * (NS - 1))) / 2, y = 18, rows = ["Limpias (lo que queremos)", "Con ruido (lo que entra)", "Salida del autoencoder"];
    rows.forEach(function (t, r) {
      var yy = y + r * (cell + 26);
      api.d.text(ctx, t, x0, yy - 5, { size: 11, weight: 600, color: C.ink2 });
      for (var k = 0; k < NS; k++) {
        var x = test[k], nz = noisy(x, zTe[k], sigma), im = r === 0 ? x : r === 1 ? nz : net.predict(nz);
        drawImg(ctx, im, x0 + k * (cell + gap), yy, s, C);
      }
    });
  });
  function update() {
    view.redraw();
    var en = 0, ed = 0, bl = 0, nb = 0, j, k;
    test.forEach(function (x, t) {
      var nz = noisy(x, zTe[t], sigma), o = net.predict(nz);
      for (k = 0; k < 64; k++) { en += (nz[k] - x[k]) * (nz[k] - x[k]) / 64; ed += (o[k] - x[k]) * (o[k] - x[k]) / 64; if (x[k] === 0) { bl += nz[k]; nb++; } }
    });
    en /= NTE; ed /= NTE;
    function f(v) { return v.toFixed(4).replace(".", ","); }
    out.set("σ de prueba = <b>" + sigma.toFixed(2).replace(".", ",") + "</b> · épocas: <b>" + epochs + "</b> (" + (withNoise ? "entrenado con ruido σ = 0,25" : "entrenado sin ruido") + ")<br>" +
      "Error de la imagen ruidosa: <b>" + f(en) + "</b> · error tras el autoencoder: <span class='" + (ed < en ? "good" : "bad") + "'><b>" + f(ed) + "</b></span>" +
      (ed < en ? " (" + (en / ed).toFixed(1).replace(".", ",") + " veces menos)" : " (no mejora)") + "<br>" +
      "Los píxeles negros ya no valen 0 tras el ruido y el <code>clip</code>: su media es <b>" + (bl / nb).toFixed(3).replace(".", ",") + "</b>.");
  }
  update();
  whenVisible(train);
  return { destroy: function () { loop.stop(); } };
});
