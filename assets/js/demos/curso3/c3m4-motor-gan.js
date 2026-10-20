/* Motor compartido de los experimentos de GAN del módulo 4: perceptrones multicapa diminutos con retropropagación y Adam, en JavaScript puro.
   Las dos demos de GAN lo cargan bajo demanda; no registra ningún experimento. */
(function () {
  "use strict";
  function MLP(sizes, acts, rng) {
    var self = this, i;
    self.sizes = sizes; self.acts = acts; self.L = [];
    for (i = 0; i < sizes.length - 1; i++) {
      var nin = sizes[i], nout = sizes[i + 1], lim = Math.sqrt(6 / (nin + nout)), W = new Float64Array(nin * nout), j;
      for (j = 0; j < W.length; j++) W[j] = rng.range(-lim, lim);
      self.L.push({ nin: nin, nout: nout, W: W, b: new Float64Array(nout), gW: new Float64Array(nin * nout), gb: new Float64Array(nout),
        mW: new Float64Array(nin * nout), vW: new Float64Array(nin * nout), mb: new Float64Array(nout), vb: new Float64Array(nout), act: acts[i] });
    }
    self.t = 0;
  }
  function actF(a, z) { return a === "tanh" ? Math.tanh(z) : a === "relu" ? (z > 0 ? z : 0) : a === "leaky" ? (z > 0 ? z : 0.2 * z) : z; }
  function actD(a, z, h) { return a === "tanh" ? 1 - h * h : a === "relu" ? (z > 0 ? 1 : 0) : a === "leaky" ? (z > 0 ? 1 : 0.2) : 1; }
  /* X: Float64Array de n × nin. Devuelve {out: Float64Array n × nout, cache}. */
  MLP.prototype.forward = function (X, n) {
    var cache = { n: n, x: [X], z: [] }, cur = X, li, i, j, k;
    for (li = 0; li < this.L.length; li++) {
      var L = this.L[li], z = new Float64Array(n * L.nout), h = new Float64Array(n * L.nout);
      for (i = 0; i < n; i++) for (j = 0; j < L.nout; j++) {
        var s = L.b[j];
        for (k = 0; k < L.nin; k++) s += cur[i * L.nin + k] * L.W[k * L.nout + j];
        z[i * L.nout + j] = s; h[i * L.nout + j] = actF(L.act, s);
      }
      cache.z.push(z); cache.x.push(h); cur = h;
    }
    return { out: cur, cache: cache };
  };
  MLP.prototype.zeroGrad = function () { this.L.forEach(function (L) { L.gW.fill(0); L.gb.fill(0); }); };
  /* dOut: gradiente de la pérdida respecto a la salida (n × nout). Acumula en gW/gb y devuelve el gradiente respecto a la entrada. */
  MLP.prototype.backward = function (cache, dOut) {
    var n = cache.n, d = dOut, li, i, j, k;
    for (li = this.L.length - 1; li >= 0; li--) {
      var L = this.L[li], z = cache.z[li], h = cache.x[li + 1], xin = cache.x[li], dz = new Float64Array(n * L.nout), dx = new Float64Array(n * L.nin);
      for (i = 0; i < n; i++) for (j = 0; j < L.nout; j++) {
        var g = d[i * L.nout + j] * actD(L.act, z[i * L.nout + j], h[i * L.nout + j]);
        dz[i * L.nout + j] = g; L.gb[j] += g;
        for (k = 0; k < L.nin; k++) { L.gW[k * L.nout + j] += xin[i * L.nin + k] * g; dx[i * L.nin + k] += g * L.W[k * L.nout + j]; }
      }
      d = dx;
    }
    return d;
  };
  MLP.prototype.adam = function (lr, b1, clip) {
    this.t++; var b2 = 0.999, t = this.t, c1 = 1 - Math.pow(b1, t), c2 = 1 - Math.pow(b2, t);
    this.L.forEach(function (L) {
      var j;
      for (j = 0; j < L.W.length; j++) { L.mW[j] = b1 * L.mW[j] + (1 - b1) * L.gW[j]; L.vW[j] = b2 * L.vW[j] + (1 - b2) * L.gW[j] * L.gW[j]; L.W[j] -= lr * (L.mW[j] / c1) / (Math.sqrt(L.vW[j] / c2) + 1e-8); if (clip) L.W[j] = Math.max(-clip, Math.min(clip, L.W[j])); }
      for (j = 0; j < L.b.length; j++) { L.mb[j] = b1 * L.mb[j] + (1 - b1) * L.gb[j]; L.vb[j] = b2 * L.vb[j] + (1 - b2) * L.gb[j] * L.gb[j]; L.b[j] -= lr * (L.mb[j] / c1) / (Math.sqrt(L.vb[j] / c2) + 1e-8); if (clip) L.b[j] = Math.max(-clip, Math.min(clip, L.b[j])); }
    });
  };
  function sigmoid(s) { return 1 / (1 + Math.exp(-s)); }
  /* Un paso de entrenamiento de GAN. G, D: MLP. sampleReal(n) → Float64Array n × dim. noise(n) → Float64Array n × zdim.
     o = {n, lrD, lrG, kD, loss: "ns" | "minimax" | "wgan"}. Devuelve {dLoss, gLoss}. */
  function ganStep(G, D, sampleReal, noise, o) {
    var n = o.n, dl = 0, gl = 0, rep, i, dim = G.sizes[G.sizes.length - 1];
    var wg = o.loss === "wgan", clip = wg ? 0.05 : 0;
    for (rep = 0; rep < o.kD; rep++) {
      var xr = sampleReal(n), xf = G.forward(noise(n), n).out, fr = D.forward(xr, n), ff = D.forward(xf, n);
      D.zeroGrad();
      var gr = new Float64Array(n), gf = new Float64Array(n);
      dl = 0;
      for (i = 0; i < n; i++) {
        var sr = fr.out[i], sf = ff.out[i];
        if (wg) { dl += (sf - sr) / n; gr[i] = -1 / n; gf[i] = 1 / n; }
        else { dl += (-Math.log(Math.max(sigmoid(sr), 1e-9)) - Math.log(Math.max(1 - sigmoid(sf), 1e-9))) / n; gr[i] = (sigmoid(sr) - 1) / n; gf[i] = sigmoid(sf) / n; }
      }
      D.backward(fr.cache, gr); D.backward(ff.cache, gf); D.adam(o.lrD, wg ? 0 : 0.5, clip);
    }
    var gz = G.forward(noise(n), n), fd = D.forward(gz.out, n), gg = new Float64Array(n);
    G.zeroGrad(); D.zeroGrad();
    for (i = 0; i < n; i++) {
      var s = fd.out[i], p = sigmoid(s);
      if (wg) { gl += -s / n; gg[i] = -1 / n; }
      else if (o.loss === "minimax") { gl += Math.log(Math.max(1 - p, 1e-9)) / n; gg[i] = -p / n; }
      else { gl += -Math.log(Math.max(p, 1e-9)) / n; gg[i] = (p - 1) / n; }
    }
    var dIn = D.backward(fd.cache, gg);
    G.backward(gz.cache, dIn); G.adam(o.lrG, wg ? 0 : 0.5);
    return { dLoss: dl, gLoss: gl };
  }
  window.C3M4_NN = { MLP: MLP, ganStep: ganStep, sigmoid: sigmoid };
})();
