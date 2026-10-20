/* Experimento: capacidad de una capa oculta. Se entrenan a la vez redes 2-H-1 con H = 1, 2, 3, 5, 10 y 30 neuronas
   sobre los MISMOS datos y se ve cómo cambia la frontera, el acierto en train y en test y el número de parámetros. */
Lab.register("curso5/c5m1-capacidad", function (root, api) {
  var D = api.d, M = api.math;
  var DATASETS = { moons: "Dos lunas", circles: "Círculos concéntricos", spiral: "Dos espirales", xor4: "XOR (cuatro nubes)" };
  var HS = [1, 2, 3, 5, 10, 30];
  var S = { data: "moons", act: "relu", noise: 1.6, epochs: 1500, dseed: 5, step: 0, run: false };
  var HM = 1.6, STEPS = 25, TG = 24;
  /* ===== Motor: red 2-H-K con una capa oculta (entrenada de verdad en el navegador) ===== */
  var ACTS = {
    sigmoid: { n: "sigmoide", f: function (z) { return 1 / (1 + Math.exp(-z)); }, d: function (z, a) { return a * (1 - a); } },
    tanh: { n: "tanh", f: Math.tanh, d: function (z, a) { return 1 - a * a; } },
    relu: { n: "ReLU", f: function (z) { return z > 0 ? z : 0; }, d: function (z) { return z > 0 ? 1 : 0; } },
    leaky: { n: "LeakyReLU (0.01)", f: function (z) { return z > 0 ? z : 0.01 * z; }, d: function (z) { return z > 0 ? 1 : 0.01; } }
  };
  /* Net(H, D, K): D entradas, H ocultas, K salidas (K = 1: sigmoide + BCE; K > 1: softmax + entropía cruzada).
     Pesos iniciales como nn.Linear de PyTorch: uniforme en (−1/√fan_in, 1/√fan_in). */
  function Net(H, D, K, act, rng, sym) {
    var i, a1 = 1 / Math.sqrt(D), a2 = 1 / Math.sqrt(H);
    this.H = H; this.D = D; this.K = K; this.act = ACTS[act]; this.t = 0;
    this.W1 = new Float64Array(H * D); this.b1 = new Float64Array(H); this.W2 = new Float64Array(K * H); this.b2 = new Float64Array(K);
    for (i = 0; i < this.W1.length; i++) this.W1[i] = rng.range(-a1, a1);
    for (i = 0; i < H; i++) this.b1[i] = rng.range(-a1, a1);
    for (i = 0; i < this.W2.length; i++) this.W2[i] = rng.range(-a2, a2);
    for (i = 0; i < K; i++) this.b2[i] = rng.range(-a2, a2);
    if (sym) {                                        // todas las neuronas ocultas empiezan idénticas
      var j, k;
      for (j = 1; j < H; j++) { for (i = 0; i < D; i++) this.W1[j * D + i] = this.W1[i]; this.b1[j] = this.b1[0]; }
      for (k = 0; k < K; k++) for (j = 1; j < H; j++) this.W2[k * H + j] = this.W2[k * H];
    }
    this.P = [this.W1, this.b1, this.W2, this.b2];
    this.M = this.P.map(function (p) { return new Float64Array(p.length); });
    this.V = this.P.map(function (p) { return new Float64Array(p.length); });
    this.z1 = new Float64Array(H); this.h = new Float64Array(H); this.o = new Float64Array(K);
  }
  Net.prototype.nparams = function () { return this.H * this.D + this.H + this.K * this.H + this.K; };
  Net.prototype.forward = function (x) {
    var H = this.H, D = this.D, K = this.K, j, d, k, s;
    for (j = 0; j < H; j++) {
      s = this.b1[j]; for (d = 0; d < D; d++) s += this.W1[j * D + d] * x[d];
      this.z1[j] = s; this.h[j] = this.act.f(s);
    }
    for (k = 0; k < K; k++) { s = this.b2[k]; for (j = 0; j < H; j++) s += this.W2[k * H + j] * this.h[j]; this.o[k] = s; }
    if (K === 1) this.o[0] = 1 / (1 + Math.exp(-this.o[0]));
    else {
      var m = -Infinity, e = 0; for (k = 0; k < K; k++) m = Math.max(m, this.o[k]);
      for (k = 0; k < K; k++) { this.o[k] = Math.exp(this.o[k] - m); e += this.o[k]; }
      for (k = 0; k < K; k++) this.o[k] /= e;
    }
    return this.o;
  };
  Net.prototype.lossAcc = function (X, Y) {
    var L = 0, ok = 0, i, p;
    for (i = 0; i < X.length; i++) {
      this.forward(X[i]);
      if (this.K === 1) { p = Math.min(1 - 1e-12, Math.max(1e-12, this.o[0])); L -= Y[i] ? Math.log(p) : Math.log(1 - p); if ((this.o[0] > 0.5) === (Y[i] === 1)) ok++; }
      else { L -= Math.log(Math.max(1e-12, this.o[Y[i]])); var am = 0, k; for (k = 1; k < this.K; k++) if (this.o[k] > this.o[am]) am = k; if (am === Y[i]) ok++; }
    }
    return { loss: L / X.length, acc: ok / X.length };
  };
  /* un paso de descenso con TODO el conjunto (batch completo); opt: "adam" o "sgd" */
  Net.prototype.step = function (X, Y, lr, opt) {
    var H = this.H, D = this.D, K = this.K, N = X.length, g = this.P.map(function (p) { return new Float64Array(p.length); });
    var i, j, k, d, dh = new Float64Array(H), d2 = new Float64Array(K);
    for (i = 0; i < N; i++) {
      this.forward(X[i]);
      if (K === 1) d2[0] = (this.o[0] - Y[i]) / N; else for (k = 0; k < K; k++) d2[k] = (this.o[k] - (k === Y[i] ? 1 : 0)) / N;
      dh.fill(0);
      for (k = 0; k < K; k++) { g[3][k] += d2[k]; for (j = 0; j < H; j++) { g[2][k * H + j] += d2[k] * this.h[j]; dh[j] += this.W2[k * H + j] * d2[k]; } }
      for (j = 0; j < H; j++) {
        var dz = dh[j] * this.act.d(this.z1[j], this.h[j]);
        g[1][j] += dz; for (d = 0; d < D; d++) g[0][j * D + d] += dz * X[i][d];
      }
    }
    this.t++;
    var t = this.t, b1 = 0.9, b2 = 0.999, c1 = 1 - Math.pow(b1, t), c2 = 1 - Math.pow(b2, t), q, n;
    for (q = 0; q < 4; q++) for (n = 0; n < this.P[q].length; n++) {
      if (opt === "sgd") this.P[q][n] -= lr * g[q][n];
      else {
        this.M[q][n] = b1 * this.M[q][n] + (1 - b1) * g[q][n]; this.V[q][n] = b2 * this.V[q][n] + (1 - b2) * g[q][n] * g[q][n];
        this.P[q][n] -= lr * (this.M[q][n] / c1) / (Math.sqrt(this.V[q][n] / c2) + 1e-8);
      }
    }
  };
  /* colores "#rrggbb" o "rgb(...)" → [r,g,b] */
  function rgb(h) {
    h = (h || "#888").trim();
    if (h.charAt(0) === "#") { if (h.length === 4) h = "#" + h[1] + h[1] + h[2] + h[2] + h[3] + h[3]; return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
    var m = h.match(/\d+/g); return m ? [+m[0], +m[1], +m[2]] : [128, 128, 128];
  }
  /* conjuntos de datos 2D, dominio aproximado [−1.6, 1.6]² */
  function makeData(api, kind, seed, n, ns) {
    ns = ns || 1; var r = api.rng(seed * 31 + 5), X = [], Y = [], i, lab, a, rad, t, x, y;
    for (i = 0; i < n; i++) {
      lab = i % 2;
      if (kind === "circles") { a = r.range(0, 6.2832); rad = lab ? r.range(0, 0.5) : r.range(0.85, 1.3); x = rad * Math.cos(a) + r.normal(0, 0.05 * ns); y = rad * Math.sin(a) + r.normal(0, 0.05 * ns); }
      else if (kind === "xor4") { var sx = r.next() < 0.5 ? -1 : 1, sy = (lab ? -1 : 1) * sx; x = sx * 0.75 + r.normal(0, 0.26 * ns); y = sy * 0.75 + r.normal(0, 0.26 * ns); }
      else if (kind === "moons") { t = r.range(0, Math.PI); if (lab) { x = Math.cos(t) - 0.5 + r.normal(0, 0.12 * ns); y = Math.sin(t) - 0.25 + r.normal(0, 0.12 * ns); } else { x = 0.5 - Math.cos(t) + r.normal(0, 0.12 * ns); y = 0.25 - Math.sin(t) + r.normal(0, 0.12 * ns); } x *= 1.05; y *= 1.3; }
      else { t = r.range(0.25, 1) * 3.4 * Math.PI; rad = t / (3.4 * Math.PI) * 1.4; var sg = lab ? 1 : -1; x = sg * rad * Math.cos(t) + r.normal(0, 0.05 * ns); y = sg * rad * Math.sin(t) + r.normal(0, 0.05 * ns); }
      X.push(Float64Array.of(x, y)); Y.push(lab);
    }
    return { X: X, Y: Y };
  }

  var nets = [], Xtr, Ytr, Xte, Yte;
  function genData() {
    var d = makeData(api, S.data, S.dseed, 240, S.noise), X = [], Y = [], Xt = [], Yt = [];
    d.X.forEach(function (p, i) { if (i % 4 > 1) { Xt.push(p); Yt.push(d.Y[i]); } else { X.push(p); Y.push(d.Y[i]); } });
    Xtr = X; Ytr = Y; Xte = Xt; Yte = Yt;
  }
  function build() {
    stop(); S.step = 0;
    nets = HS.map(function (H) { return new Net(H, 2, 1, S.act, api.rng(11 + H), false); });
    update();
  }
  var view = api.view(root, { aspect: 1.55, minH: 250, maxH: 460, label: "Seis redes con distinto número de neuronas ocultas sobre los mismos datos" });
  var ui = api.controls(root), tb = api.table(root, ["H", "parámetros", "% train", "% test"]), out = api.readout(root);
  ui.select({ label: "Datos", value: S.data, options: Object.keys(DATASETS).map(function (k) { return [k, DATASETS[k]]; }), onChange: function (v) { S.data = v; genData(); build(); } });
  ui.select({ label: "Activación oculta", value: S.act, options: [["relu", "ReLU"], ["tanh", "tanh"], ["sigmoid", "sigmoide"]], onChange: function (v) { S.act = v; build(); } });
  ui.slider({ label: "Ruido de los datos", min: 0.5, max: 3, step: 0.1, value: S.noise, fmt: function (v) { return "×" + v.toFixed(1); }, onInput: function (v) { S.noise = v; genData(); build(); } });
  ui.slider({ label: "Pasos de entrenamiento (Adam, lr 0.03)", min: 200, max: 4000, step: 100, value: S.epochs, fmt: function (v) { return v; }, onInput: function (v) { S.epochs = v; } });
  var btn = ui.button("▶ Entrenar las seis", function () {
    if (S.run) { stop(); return; }
    if (S.step >= S.epochs) build();
    if (api.reduceMotion) { while (S.step < S.epochs) tick(); update(); return; }
    S.run = true; btn.textContent = "❚❚ Pausa"; loop.start();
  }, "primary");
  ui.button("Otros datos", function () { S.dseed++; genData(); build(); });
  ui.button("Reiniciar pesos", function () { build(); });
  api.legend(root, [[api.colors().cobalto, "clase 1"], [api.colors().terracota, "clase 0"], [api.colors().muted, "lleno = entrenamiento · aro = test"]]);

  function tick() { nets.forEach(function (n) { n.step(Xtr, Ytr, 0.03, "adam"); }); S.step++; }
  var loop = api.loop(function () { for (var i = 0; i < STEPS && S.step < S.epochs; i++) tick(); update(); if (S.step >= S.epochs) { stop(); return false; } }, { fps: 30 });
  function stop() { S.run = false; if (loop) loop.stop(); btn.textContent = "▶ Entrenar las seis"; }

  var off = document.createElement("canvas"), octx = off.getContext("2d");
  function heat(ctx, x, y, w, h, N, fn, c0, c1, alpha) {
    off.width = N; off.height = N; var img = octx.createImageData(N, N), i, j;
    for (j = 0; j < N; j++) for (i = 0; i < N; i++) {
      var q = fn(-HM + 2 * HM * (i + 0.5) / N, HM - 2 * HM * (j + 0.5) / N), k = 4 * (j * N + i);
      img.data[k] = c0[0] + (c1[0] - c0[0]) * q; img.data[k + 1] = c0[1] + (c1[1] - c0[1]) * q; img.data[k + 2] = c0[2] + (c1[2] - c0[2]) * q; img.data[k + 3] = 255;
    }
    octx.putImageData(img, 0, 0);
    ctx.save(); ctx.globalAlpha = alpha; ctx.imageSmoothingEnabled = true; ctx.drawImage(off, x, y, w, h); ctx.restore();
  }
  view.draw(function (ctx, w, h, C) {
    if (!nets.length) return;
    var cols = w < 520 ? 2 : 3, rows = Math.ceil(HS.length / cols), gap = 6, cw = (w - gap * (cols + 1)) / cols, ch = (h - gap * (rows + 1)) / rows, sz = Math.min(cw, ch);
    var k;
    for (k = 0; k < HS.length; k++) {
      var n = nets[k], px = gap + (k % cols) * (cw + gap) + (cw - sz) / 2, py = gap + Math.floor(k / cols) * (ch + gap) + (ch - sz) / 2;
      D.rect(ctx, px, py, sz, sz, C.surface);
      heat(ctx, px, py, sz, sz, TG, function (x, y) { return n.forward([x, y])[0]; }, rgb(C.terracota), rgb(C.cobalto), 0.5);
      ctx.save(); ctx.beginPath(); ctx.rect(px, py, sz, sz); ctx.clip();
      var sx = function (v) { return px + (v + HM) / (2 * HM) * sz; }, sy = function (v) { return py + (HM - v) / (2 * HM) * sz; };
      Xte.forEach(function (p, i) { D.circle(ctx, sx(p[0]), sy(p[1]), 2.4, null, Yte[i] ? C.cobalto : C.terracota, 1.2); });
      Xtr.forEach(function (p, i) { D.circle(ctx, sx(p[0]), sy(p[1]), 2.6, Ytr[i] ? C.cobalto : C.terracota, C.paper, 0.8); });
      ctx.restore();
      D.rect(ctx, px, py, sz, sz, null, C.ink, 1.2);
      var tag = "H = " + HS[k];
      D.rect(ctx, px + 3, py + 3, 8 + tag.length * 6.4, 16, C.paper);
      D.text(ctx, tag, px + 7, py + 15, { size: 11, weight: 700, mono: true });
    }
  });
  function update() {
    var rows = nets.map(function (n, k) {
      var a = n.lossAcc(Xtr, Ytr), b = n.lossAcc(Xte, Yte), gap = a.acc - b.acc;
      return [HS[k], n.nparams(), (a.acc * 100).toFixed(0) + " %", (b.acc * 100).toFixed(0) + " %" + (gap > 0.07 ? " <span class='bad'>(−" + (gap * 100).toFixed(0) + ")</span>" : "")];
    });
    tb.set(rows);
    var best = 0, bk = 0; nets.forEach(function (n, k) { var a = n.lossAcc(Xte, Yte).acc; if (a > best + 1e-9) { best = a; bk = k; } });
    out.set("Paso <b>" + S.step + " / " + S.epochs + "</b> · datos: " + Xtr.length + " de entrenamiento y " + Xte.length + " de test.<br>" +
      (S.step === 0 ? "Pulsa «Entrenar las seis». Todas parten de pesos al azar distintos pero ven exactamente los mismos puntos." :
        "Mejor en test: <b>H = " + HS[bk] + "</b> (" + (best * 100).toFixed(0) + " %). Si una red acierta mucho más en train que en test, está memorizando el ruido."));
    view.redraw();
  }
  genData(); build();
  return { destroy: function () { stop(); } };
});
