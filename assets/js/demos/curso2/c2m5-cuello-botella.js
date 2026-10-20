/* Experimento: un autoencoder denso que se entrena en tu navegador. Cuanto más estrecho el cuello de botella, peor reconstruye. */
Lab.register("curso2/c2m5-cuello-botella", function (root, api) {
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
  var S = 8, H = 16, NTR = 200, NTE = 100, NS = 6, BATCH = 25, CHUNK = 120;
  var data = api.rng(11), X = [], Xt = [], shown, pca, baseMse, k = 4, net = null, hist = [], epochs = 0, order = [], shuf = api.rng(5), loop;
  function rect() {
    var x1 = data.int(1, 3), y1 = data.int(1, 3), x2 = data.int(5, 7), y2 = data.int(5, 7), im = new Array(S * S).fill(0), x, y;
    for (y = y1; y < y2; y++) for (x = x1; x < x2; x++) im[y * S + x] = 1;
    return im;
  }
  var i, j;
  for (i = 0; i < NTR; i++) X.push(rect());
  for (i = 0; i < NTE; i++) Xt.push(rect());
  shown = Xt.slice(0, NS);
  function mix(a, b, t) {
    function p(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
    var u = p(a), v = p(b);
    return "rgb(" + [0, 1, 2].map(function (q) { return Math.round(u[q] + (v[q] - u[q]) * t); }).join(",") + ")";
  }
  /* PCA por iteración de potencias (con deflación): reconstrucción con las j primeras componentes */
  (function () {
    var n = S * S, mean = new Array(n).fill(0), cov = [], r, c, s, comps = [];
    X.forEach(function (x) { for (r = 0; r < n; r++) mean[r] += x[r] / NTR; });
    for (r = 0; r < n; r++) cov.push(new Array(n).fill(0));
    X.forEach(function (x) { for (r = 0; r < n; r++) for (c = 0; c < n; c++) cov[r][c] += (x[r] - mean[r]) * (x[c] - mean[c]) / NTR; });
    var seed = api.rng(3);
    for (s = 0; s < 16; s++) {
      var v = []; for (r = 0; r < n; r++) v.push(seed.normal(0, 1));
      for (var it = 0; it < 120; it++) {
        var w = new Array(n).fill(0), nr = 0;
        for (r = 0; r < n; r++) for (c = 0; c < n; c++) w[r] += cov[r][c] * v[c];
        for (r = 0; r < n; r++) nr += w[r] * w[r];
        nr = Math.sqrt(nr) || 1; v = w.map(function (q) { return q / nr; });
      }
      var lam = 0, cv = new Array(n).fill(0);
      for (r = 0; r < n; r++) for (c = 0; c < n; c++) cv[r] += cov[r][c] * v[c];
      for (r = 0; r < n; r++) lam += v[r] * cv[r];
      for (r = 0; r < n; r++) for (c = 0; c < n; c++) cov[r][c] -= lam * v[r] * v[c];
      comps.push(v);
    }
    pca = {};
    for (var kk = 1; kk <= 16; kk++) {
      var e = 0;
      Xt.forEach(function (x) {
        var rec = mean.slice(), q;
        for (q = 0; q < kk; q++) { var pr = 0; for (r = 0; r < n; r++) pr += (x[r] - mean[r]) * comps[q][r]; for (r = 0; r < n; r++) rec[r] += pr * comps[q][r]; }
        for (r = 0; r < n; r++) e += (rec[r] - x[r]) * (rec[r] - x[r]) / n;
      });
      pca[kk] = e / NTE;
    }
    baseMse = 0; Xt.forEach(function (x) { for (r = 0; r < n; r++) baseMse += (mean[r] - x[r]) * (mean[r] - x[r]) / n; }); baseMse /= NTE;
  })();
  function testMse() {
    var e = 0; Xt.forEach(function (x) { var o = net.predict(x); for (var q = 0; q < S * S; q++) e += (o[q] - x[q]) * (o[q] - x[q]) / (S * S); });
    return e / NTE;
  }
  function init() {
    if (loop) loop.stop();
    net = makeMLP([S * S, H, k, H, S * S], ["relu", "linear", "relu", "sigmoid"], api.rng(3), 0.01);
    hist = []; epochs = 0; order = X.map(function (_, q) { return q; });
    hist.push(testMse());
  }
  function epoch() {
    shuf.shuffle(order);
    for (var b = 0; b < NTR; b += BATCH) net.step(X, X, order.slice(b, b + BATCH));
    epochs++; hist.push(testMse());
  }
  var target = 0;
  loop = api.loop(function () {
    for (var q = 0; q < 3 && epochs < target; q++) epoch();
    update();
    return epochs < target;
  }, { fps: 30, onState: function (s) { if (btn) btn.disabled = s; } });
  function train(n) {
    target = epochs + n;
    if (api.reduceMotion) { while (epochs < target) epoch(); update(); } else loop.start();
  }

  init();
  function whenVisible(fn) {
    if (!window.IntersectionObserver) { fn(); return; }
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); fn(); } });
    io.observe(root);
  }
  var view = api.view(root, { aspect: 1.15, minH: 330, maxH: 470, label: "Pósters de juguete originales y reconstruidos por el autoencoder, y curva del error" });
  api.legend(root, [[api.colors().cobalto, "Autoencoder (error en pósters de test)"], [api.colors().terracota, "PCA con k componentes"], [api.colors().muted, "imagen media (no usa información)"]]);
  var ui = api.controls(root), out = api.readout(root), btn;
  ui.segmented({ label: "Tamaño del cuello de botella (k)", options: [[1, "1"], [2, "2"], [4, "4"], [8, "8"], [16, "16"]], value: k,
    onChange: function (v) { k = v; init(); train(CHUNK); update(); } });
  btn = ui.button("Entrenar " + CHUNK + " épocas más", function () { train(CHUNK); }, "primary");

  function drawImg(ctx, im, x0, y0, s, C) {
    var q, r;
    for (r = 0; r < S; r++) for (q = 0; q < S; q++) { api.d.rect(ctx, x0 + q * s, y0 + r * s, s + 0.5, s + 0.5, mix(C.surface, C.cobalto, Math.max(0, Math.min(1, im[r * S + q])))); }
    api.d.rect(ctx, x0, y0, s * S, s * S, null, C.line, 1);
  }
  view.draw(function (ctx, w, h, C) {
    var padX = 10, gap = 6, cell = Math.min(92, (w - 2 * padX - gap * (NS - 1)) / NS), s = cell / S;
    var x0 = (w - (cell * NS + gap * (NS - 1))) / 2, y1 = 22, y2 = y1 + cell + 30;
    api.d.text(ctx, "Pósters de juguete (8×8 = 64 números)", x0, 14, { size: 11, weight: 600, color: C.ink2 });
    api.d.text(ctx, "Reconstruidos desde " + k + " número" + (k > 1 ? "s" : ""), x0, y2 - 8, { size: 11, weight: 600, color: C.ink2 });
    shown.forEach(function (im, q) {
      drawImg(ctx, im, x0 + q * (cell + gap), y1, s, C);
      drawImg(ctx, net.predict(im), x0 + q * (cell + gap), y2, s, C);
    });
    /* gráfico del error (escala logarítmica) */
    var cy = y2 + cell + 26, cb = h - 26, cx0 = 46, cx1 = w - 12, lo = Math.log10(0.0005), hi = Math.log10(0.4);
    if (cb - cy < 50) return;
    function Y(v) { return cb - (Math.log10(Math.max(v, 0.0005)) - lo) / (hi - lo) * (cb - cy); }
    var maxE = Math.max(CHUNK, epochs), E = function (e) { return cx0 + e / maxE * (cx1 - cx0); };
    api.d.rect(ctx, cx0, cy, cx1 - cx0, cb - cy, C.surface, C.line, 1);
    [0.001, 0.01, 0.1].forEach(function (v) {
      api.d.line(ctx, cx0, Y(v), cx1, Y(v), C.line, 1);
      api.d.text(ctx, String(v).replace(".", ","), cx0 - 5, Y(v) + 4, { size: 10, align: "right", color: C.muted, mono: true });
    });
    api.d.text(ctx, "épocas: 0", cx0, cb + 14, { size: 10, color: C.muted });
    api.d.text(ctx, String(maxE), cx1, cb + 14, { size: 10, align: "right", color: C.muted });
    api.d.line(ctx, cx0, Y(baseMse), cx1, Y(baseMse), C.muted, 1.5, [5, 4]);
    api.d.line(ctx, cx0, Y(pca[k]), cx1, Y(pca[k]), C.terracota, 2, [6, 4]);
    var pts = hist.map(function (v, e) { return [E(e), Y(v)]; });
    api.d.path(ctx, pts, C.cobalto, 2.5);
    api.d.text(ctx, "error (MSE, escala log)", 4, cy - 6, { size: 10, color: C.muted });
  });
  function f4(v) { return v.toFixed(4).replace(".", ","); }
  function update() {
    var m = hist[hist.length - 1], np = net.nParams, comp = (S * S) / k;
    var cls = m < pca[k] ? "good" : "bad";
    out.set("Cuello k = <b>" + k + "</b> → compresión " + (S * S) + "/" + k + " = <b>" + (comp % 1 ? comp.toFixed(1).replace(".", ",") : comp) + "×</b> · parámetros: <b>" + np + "</b> · épocas entrenadas: <b>" + epochs + "</b><br>" +
      "Error en test: autoencoder <span class='" + cls + "'><b>" + f4(m) + "</b></span> · PCA con " + k + " componentes <b>" + f4(pca[k]) + "</b> · imagen media <b>" + f4(baseMse) + "</b>");
    view.redraw();
  }
  update();
  whenVisible(function () { train(CHUNK); });
  return { destroy: function () { loop.stop(); } };
});
