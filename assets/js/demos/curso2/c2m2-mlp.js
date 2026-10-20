/* Biblioteca compartida por los experimentos del Curso 2 · Módulo 2.
   Un perceptrón multicapa (MLP) real, escrito desde cero, que se entrena en el navegador:
   capas densas, activaciones, tres combinaciones salida+pérdida (lineal+MSE, sigmoide+BCE,
   softmax+crossentropy), mini-lotes y optimizador Adam o SGD. No usa librerías externas.
   Se carga con <script src> en la propia página del módulo. */
(function (g) {
  "use strict";

  var ACT = {
    relu: { f: function (z) { return z > 0 ? z : 0; }, d: function (z, a) { return z > 0 ? 1 : 0; } },
    tanh: { f: Math.tanh, d: function (z, a) { return 1 - a * a; } },
    sigmoid: { f: function (z) { return 1 / (1 + Math.exp(-z)); }, d: function (z, a) { return a * (1 - a); } },
    linear: { f: function (z) { return z; }, d: function () { return 1; } }
  };
  var EPS = 1e-12;

  /* sizes = [entradas, oculta1, ..., salida]; hidden = nombre de la activación oculta;
     out = "linear" | "sigmoid" | "softmax"; loss = "mse" | "bce" | "cce" (por defecto: la pareja habitual). */
  function MLP(sizes, hidden, out, loss, rng, opt) {
    this.sizes = sizes.slice();
    this.L = sizes.length - 1;
    this.hid = ACT[hidden || "relu"];
    this.hidName = hidden || "relu";
    this.out = out || "linear";
    this.loss = loss || (this.out === "softmax" ? "cce" : this.out === "sigmoid" ? "bce" : "mse");
    this.opt = opt || "adam";
    this.t = 0;
    this.W = []; this.b = []; this.gW = []; this.gb = [];
    this.mW = []; this.vW = []; this.mb = []; this.vb = [];
    this.a = []; this.z = []; this.d = [];
    var l, n;
    for (l = 0; l < this.L; l++) {
      var nin = sizes[l], nout = sizes[l + 1], lim = Math.sqrt(6 / (nin + nout)), w = new Float64Array(nin * nout);
      for (n = 0; n < w.length; n++) w[n] = rng.range(-lim, lim);          // Glorot uniforme, como Keras
      this.W.push(w); this.b.push(new Float64Array(nout));
      this.gW.push(new Float64Array(nin * nout)); this.gb.push(new Float64Array(nout));
      this.mW.push(new Float64Array(nin * nout)); this.vW.push(new Float64Array(nin * nout));
      this.mb.push(new Float64Array(nout)); this.vb.push(new Float64Array(nout));
    }
    for (l = 0; l < sizes.length; l++) {
      this.a.push(new Float64Array(sizes[l])); this.z.push(new Float64Array(sizes[l])); this.d.push(new Float64Array(sizes[l]));
    }
  }

  MLP.prototype.nParams = function () {
    var s = 0;
    for (var l = 0; l < this.L; l++) s += this.sizes[l] * this.sizes[l + 1] + this.sizes[l + 1];
    return s;
  };

  /* Propagación hacia delante de una muestra x. Devuelve el vector de salida (buffer interno). */
  MLP.prototype.forward = function (x) {
    var L = this.L, a0 = this.a[0], i, j, l;
    for (i = 0; i < a0.length; i++) a0[i] = x[i];
    for (l = 0; l < L; l++) {
      var nin = this.sizes[l], nout = this.sizes[l + 1], W = this.W[l], b = this.b[l], ain = this.a[l], z = this.z[l + 1], a = this.a[l + 1];
      for (j = 0; j < nout; j++) {
        var s = b[j];
        for (i = 0; i < nin; i++) s += ain[i] * W[i * nout + j];
        z[j] = s;
      }
      var last = l === L - 1;
      if (!last) { for (j = 0; j < nout; j++) a[j] = this.hid.f(z[j]); }
      else if (this.out === "softmax") {
        var m = -Infinity, sum = 0;
        for (j = 0; j < nout; j++) if (z[j] > m) m = z[j];
        for (j = 0; j < nout; j++) { a[j] = Math.exp(z[j] - m); sum += a[j]; }
        for (j = 0; j < nout; j++) a[j] /= sum;
      } else { var fa = ACT[this.out]; for (j = 0; j < nout; j++) a[j] = fa.f(z[j]); }
    }
    return this.a[L];
  };

  MLP.prototype.predict = function (x) { return Array.prototype.slice.call(this.forward(x)); };

  /* Pérdida de una muestra ya propagada (y = vector objetivo). */
  MLP.prototype.sampleLoss = function (y) {
    var o = this.a[this.L], n = o.length, s = 0, j;
    if (this.loss === "mse") { for (j = 0; j < n; j++) s += (o[j] - y[j]) * (o[j] - y[j]); return s / n; }
    if (this.loss === "bce") {
      for (j = 0; j < n; j++) { var p = Math.min(1 - EPS, Math.max(EPS, o[j])); s -= y[j] * Math.log(p) + (1 - y[j]) * Math.log(1 - p); }
      return s / n;
    }
    for (j = 0; j < n; j++) if (y[j] > 0) s -= y[j] * Math.log(Math.max(EPS, o[j]));
    return s;
  };

  MLP.prototype.evaluate = function (X, Y) {
    var tot = 0, ok = 0, k, j;
    for (k = 0; k < X.length; k++) {
      var o = this.forward(X[k]); tot += this.sampleLoss(Y[k]);
      if (this.out === "softmax") {
        var pi = 0, ti = 0;
        for (j = 1; j < o.length; j++) { if (o[j] > o[pi]) pi = j; if (Y[k][j] > Y[k][ti]) ti = j; }
        if (pi === ti) ok++;
      } else if (this.out === "sigmoid") { if ((o[0] > 0.5) === (Y[k][0] > 0.5)) ok++; }
    }
    return { loss: tot / (X.length || 1), acc: ok / (X.length || 1) };
  };

  /* Retropropagación de una muestra (ya propagada): acumula los gradientes en gW y gb. */
  MLP.prototype._backward = function (y) {
    var L = this.L, o = this.a[L], n = o.length, dOut = this.d[L], j, i, l;
    for (j = 0; j < n; j++) {
      var dLda;
      if (this.out === "softmax" && this.loss === "cce") { dOut[j] = o[j] - y[j]; continue; }
      if (this.loss === "mse") dLda = 2 * (o[j] - y[j]) / n;
      else { var p = Math.min(1 - EPS, Math.max(EPS, o[j])); dLda = (-(y[j] / p) + (1 - y[j]) / (1 - p)) / n; }
      dOut[j] = dLda * ACT[this.out].d(this.z[L][j], o[j]);
    }
    for (l = L - 1; l >= 0; l--) {
      var nin = this.sizes[l], nout = this.sizes[l + 1], W = this.W[l], gW = this.gW[l], gb = this.gb[l], ain = this.a[l], dn = this.d[l + 1], dp = this.d[l];
      for (j = 0; j < nout; j++) gb[j] += dn[j];
      for (i = 0; i < nin; i++) {
        var ai = ain[i], acc = 0, base = i * nout;
        for (j = 0; j < nout; j++) { gW[base + j] += ai * dn[j]; acc += W[base + j] * dn[j]; }
        if (l > 0) dp[i] = acc * this.hid.d(this.z[l][i], ain[i]);
      }
    }
  };

  MLP.prototype._step = function (lr, bs) {
    var l, k, W, b, gW, gb, mW, vW, mb, vb, g1, mh, vh;
    this.t++;
    var b1 = 0.9, b2 = 0.999, c1 = 1 - Math.pow(b1, this.t), c2 = 1 - Math.pow(b2, this.t);
    for (l = 0; l < this.L; l++) {
      W = this.W[l]; b = this.b[l]; gW = this.gW[l]; gb = this.gb[l]; mW = this.mW[l]; vW = this.vW[l]; mb = this.mb[l]; vb = this.vb[l];
      for (k = 0; k < W.length; k++) {
        g1 = gW[k] / bs;
        if (this.opt === "sgd") W[k] -= lr * g1;
        else { mW[k] = b1 * mW[k] + (1 - b1) * g1; vW[k] = b2 * vW[k] + (1 - b2) * g1 * g1; mh = mW[k] / c1; vh = vW[k] / c2; W[k] -= lr * mh / (Math.sqrt(vh) + 1e-7); }
        gW[k] = 0;
      }
      for (k = 0; k < b.length; k++) {
        g1 = gb[k] / bs;
        if (this.opt === "sgd") b[k] -= lr * g1;
        else { mb[k] = b1 * mb[k] + (1 - b1) * g1; vb[k] = b2 * vb[k] + (1 - b2) * g1 * g1; mh = mb[k] / c1; vh = vb[k] / c2; b[k] -= lr * mh / (Math.sqrt(vh) + 1e-7); }
        gb[k] = 0;
      }
    }
  };

  /* Una época completa: baraja, recorre los lotes y actualiza. Devuelve la pérdida media de la época. */
  MLP.prototype.epoch = function (X, Y, batch, lr, rng) {
    var n = X.length, idx = new Array(n), k, s = 0;
    for (k = 0; k < n; k++) idx[k] = k;
    if (rng) rng.shuffle(idx);
    for (var start = 0; start < n; start += batch) {
      var end = Math.min(n, start + batch);
      for (k = start; k < end; k++) { this.forward(X[idx[k]]); s += this.sampleLoss(Y[idx[k]]); this._backward(Y[idx[k]]); }
      this._step(lr, end - start);
    }
    return s / n;
  };

  MLP.prototype.getState = function () {
    return { W: this.W.map(function (w) { return Float64Array.from(w); }), b: this.b.map(function (w) { return Float64Array.from(w); }) };
  };
  MLP.prototype.setState = function (st) {
    for (var l = 0; l < this.L; l++) { this.W[l].set(st.W[l]); this.b[l].set(st.b[l]); }
  };

  /* ---------- Conjuntos de datos 2-D (coordenadas dentro de [-1.2, 1.2]) ---------- */
  var data = {
    moons: function (rng, n, noise) {
      var X = [], Y = [], m = Math.floor(n / 2), i, t;
      for (i = 0; i < n; i++) {
        var c = i < m ? 0 : 1; t = rng.range(0, Math.PI);
        var x = c === 0 ? Math.cos(t) : 1 - Math.cos(t), y = c === 0 ? Math.sin(t) : 0.5 - Math.sin(t);
        X.push([(x - 0.5) * 1.1 + rng.normal(0, noise), (y - 0.25) * 1.5 + rng.normal(0, noise)]); Y.push([c]);
      }
      return { X: X, Y: Y };
    },
    circles: function (rng, n, noise) {
      var X = [], Y = [], i;
      for (i = 0; i < n; i++) {
        var c = i % 2, r = c === 0 ? 0.45 : 0.95, t = rng.range(0, 2 * Math.PI);
        X.push([r * Math.cos(t) + rng.normal(0, noise), r * Math.sin(t) + rng.normal(0, noise)]); Y.push([c]);
      }
      return { X: X, Y: Y };
    },
    spiral: function (rng, n, noise, turns) {
      var X = [], Y = [], i, T = 2 * Math.PI * (turns || 1.25);
      for (i = 0; i < n; i++) {
        var c = i % 2, t = rng.range(0.12, 1) * T, r = t / T * 1.05, ang = t + c * Math.PI;
        X.push([r * Math.cos(ang) + rng.normal(0, noise), r * Math.sin(ang) + rng.normal(0, noise)]); Y.push([c]);
      }
      return { X: X, Y: Y };
    },
    xor: function (rng, n, noise) {
      var X = [], Y = [], i;
      for (i = 0; i < n; i++) {
        var x = rng.range(-1, 1), y = rng.range(-1, 1);
        X.push([x + rng.normal(0, noise * 0.3), y + rng.normal(0, noise * 0.3)]); Y.push([(x * y > 0) ? 1 : 0]);
      }
      return { X: X, Y: Y };
    }
  };

  /* ---------- Colores y dibujo de la frontera de decisión ---------- */
  function rgb(c) {
    var m;
    if (!c) return [128, 128, 128];
    if ((m = /^#([0-9a-f]{6})$/i.exec(c))) return [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)];
    if ((m = /^#([0-9a-f]{3})$/i.exec(c))) return [parseInt(m[1][0] + m[1][0], 16), parseInt(m[1][1] + m[1][1], 16), parseInt(m[1][2] + m[1][2], 16)];
    if ((m = /rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)/i.exec(c))) return [+m[1], +m[2], +m[3]];
    return [128, 128, 128];
  }

  /* Pinta una malla gx×gy dentro de la caja del gráfico; prob(x, y) devuelve P(clase 1). */
  function paintBoundary(ctx, plot, prob, C, grid) {
    var b = plot.box, n = grid || 34, cw = b.w / n, ch = b.h / n, i, j;
    var c0 = rgb(C.cobalto), c1 = rgb(C.terracota);
    for (j = 0; j < n; j++) for (i = 0; i < n; i++) {
      var x = plot.ix(b.x + (i + 0.5) * cw), y = plot.iy(b.y + (j + 0.5) * ch), p = prob(x, y);
      var c = p > 0.5 ? c1 : c0, al = 0.10 + 0.42 * Math.min(1, Math.abs(2 * p - 1));
      ctx.fillStyle = "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + al.toFixed(3) + ")";
      ctx.fillRect(b.x + i * cw - 0.3, b.y + j * ch - 0.3, cw + 0.6, ch + 0.6);
    }
  }

  function mix(a, b, t) { var A = rgb(a), B = rgb(b); return "rgb(" + Math.round(A[0] + (B[0] - A[0]) * t) + "," + Math.round(A[1] + (B[1] - A[1]) * t) + "," + Math.round(A[2] + (B[2] - A[2]) * t) + ")"; }

  /* Fondo translúcido detrás de una etiqueta de texto, para que se lea encima de curvas y rejillas.
     Se dibuja ANTES del texto con las mismas x, y, align y size. */
  function halo(ctx, text, x, y, o) {
    o = o || {};
    var size = o.size || 12;
    ctx.save();
    ctx.font = (o.weight || 600) + " " + size + "px 'IBM Plex Sans',system-ui,sans-serif";
    var w = ctx.measureText(text).width + 8, x0 = o.align === "right" ? x - w + 4 : o.align === "center" ? x - w / 2 : x - 4;
    ctx.globalAlpha = 0.88; ctx.fillStyle = o.bg; ctx.fillRect(x0, y - size - 1, w, size + 6);
    ctx.restore();
  }

  g.C2M2 = { MLP: MLP, ACT: ACT, data: data, rgb: rgb, paintBoundary: paintBoundary, mix: mix, halo: halo };
})(typeof window !== "undefined" ? window : globalThis);
