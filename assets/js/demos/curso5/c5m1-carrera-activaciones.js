/* Experimento: la carrera de las cuatro activaciones. La misma red 2-H-1, los mismos datos y los MISMOS pesos iniciales;
   solo cambia la activación de la capa oculta. Se ven las cuatro curvas de pérdida y las fronteras. */
Lab.register("curso5/c5m1-carrera-activaciones", function (root, api) {
  var D = api.d, M = api.math;
  var KEYS = ["sigmoid", "tanh", "relu", "leaky"];
  var DATASETS = { moons: "Dos lunas", circles: "Círculos concéntricos", xor4: "XOR (cuatro nubes)" };
  var S = { data: "moons", H: 8, lrExp: -1, opt: "sgd", seed: 2, dseed: 3, step: 0, run: false, hist: [] };
  var HM = 1.6, STEPS = 10, MAXSTEPS = 3000, TG = 20;
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
    var d = makeData(api, S.data, S.dseed, 240, 1.4), X = [], Y = [], Xt = [], Yt = [];
    d.X.forEach(function (p, i) { if (i % 3 === 2) { Xt.push(p); Yt.push(d.Y[i]); } else { X.push(p); Y.push(d.Y[i]); } });
    Xtr = X; Ytr = Y; Xte = Xt; Yte = Yt;
  }
  function build() {
    stop(); S.step = 0; S.hist = [];
    nets = KEYS.map(function (k) { return new Net(S.H, 2, 1, k, api.rng(S.seed * 53 + 1), false); });  // misma semilla = mismos pesos iniciales
    S.hist.push([0].concat(nets.map(function (n) { return n.lossAcc(Xtr, Ytr).loss; })));
    update();
  }
  var viewL = api.view(root, { aspect: 2.1, minH: 190, maxH: 320, label: "Pérdida de entrenamiento de las cuatro activaciones" });
  var plotL = api.plot(viewL, { xr: [0, 100], yr: [0, 1], xticks: 5, yticks: 4, xlabel: "pasos de entrenamiento", ylabel: "pérdida", pad: { l: 46, r: 24, t: 12, b: 38 }, xfmt: function (v) { return Math.round(v); } });
  var viewM = api.view(root, { aspect: 4.2, minH: 80, maxH: 150, label: "Frontera de decisión de cada activación" });
  var ui = api.controls(root), tb = api.table(root, ["activación", "pérdida", "% train", "% test", "muertas"]), out = api.readout(root);
  var C0 = api.colors();
  api.legend(root, [[C0.cobalto, "sigmoide"], [C0.terracota, "tanh"], [C0.oliva, "ReLU"], [C0.ink2, "LeakyReLU (0.01)"]]);
  ui.select({ label: "Datos", value: S.data, options: Object.keys(DATASETS).map(function (k) { return [k, DATASETS[k]]; }), onChange: function (v) { S.data = v; genData(); build(); } });
  ui.slider({ label: "H: neuronas ocultas", min: 2, max: 16, step: 1, value: S.H, fmt: function (v) { return v; }, onInput: function (v) { S.H = v; build(); } });
  ui.select({ label: "Optimizador", value: S.opt, options: [["sgd", "SGD (descenso simple)"], ["adam", "Adam"]], onChange: function (v) { S.opt = v; build(); } });
  ui.slider({ label: "Learning rate (escala log.)", min: -2, max: 1, step: 0.1, value: S.lrExp, fmt: function (v) { return Math.pow(10, v).toPrecision(2); }, onInput: function (v) { S.lrExp = v; build(); } });
  var btn = ui.button("▶ Empezar la carrera", function () {
    if (S.run) { stop(); return; }
    if (S.step >= MAXSTEPS) build();
    if (api.reduceMotion) { while (S.step < MAXSTEPS) tick(); update(); return; }
    S.run = true; btn.textContent = "❚❚ Pausa"; loop.start();
  }, "primary");
  ui.button("Otros pesos iniciales", function () { S.seed++; build(); });
  ui.button("Otros datos", function () { S.dseed++; genData(); build(); });

  function tick() {
    var lr = Math.pow(10, S.lrExp);
    nets.forEach(function (n) { n.step(Xtr, Ytr, lr, S.opt); }); S.step++;
    if (S.step % 15 === 0) S.hist.push([S.step].concat(nets.map(function (n) { return n.lossAcc(Xtr, Ytr).loss; })));
  }
  var loop = api.loop(function () { for (var i = 0; i < STEPS && S.step < MAXSTEPS; i++) tick(); update(); if (S.step >= MAXSTEPS) { stop(); return false; } }, { fps: 30 });
  function stop() { S.run = false; if (loop) loop.stop(); btn.textContent = "▶ Empezar la carrera"; }

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
  function colOf(C, k) { return [C.cobalto, C.terracota, C.oliva, C.ink2][k]; }
  viewL.draw(function (ctx, w, h, C) {
    if (!S.hist.length) return;
    var H = S.hist, xmax = Math.max(100, H[H.length - 1][0]), ymax = 0.8;
    var m = 0; H.forEach(function (r) { for (var k = 1; k <= 4; k++) m = Math.max(m, r[k]); });
    ymax = Math.max(0.8, Math.min(2, Math.ceil(m * 5) / 5));
    plotL.xr = [0, xmax]; plotL.yr = [0, ymax]; plotL.axes(ctx); ctx.save(); plotL.clip(ctx);
    for (var k = 0; k < 4; k++) D.path(ctx, H.map(function (r) { return [plotL.x(r[0]), plotL.y(Math.min(r[k + 1], ymax))]; }), colOf(C, k), 2.4, k === 3 ? [5, 3] : null);
    ctx.restore();
  });
  viewM.draw(function (ctx, w, h, C) {
    if (!nets.length) return;
    var gap = 6, cw = (w - gap * 5) / 4, sz = Math.min(cw, h - 22), k;
    for (k = 0; k < 4; k++) {
      var n = nets[k], px = gap + k * (cw + gap) + (cw - sz) / 2, py = 18;
      heat(ctx, px, py, sz, sz, TG, function (x, y) { return n.forward([x, y])[0]; }, rgb(C.terracota), rgb(C.cobalto), 0.55);
      ctx.save(); ctx.beginPath(); ctx.rect(px, py, sz, sz); ctx.clip();
      var sx = function (v) { return px + (v + HM) / (2 * HM) * sz; }, sy = function (v) { return py + (HM - v) / (2 * HM) * sz; };
      Xtr.forEach(function (p, i) { D.circle(ctx, sx(p[0]), sy(p[1]), 1.8, Ytr[i] ? C.cobalto : C.terracota, null); });
      ctx.restore(); D.rect(ctx, px, py, sz, sz, null, C.ink, 1.2);
      D.text(ctx, ACTS[KEYS[k]].n.split(" ")[0], px + sz / 2, 12, { size: 10.5, weight: 700, align: "center", color: C.ink2 });
    }
  });
  function dead(n) { var c = 0, j, i; for (j = 0; j < n.H; j++) { var any = false; for (i = 0; i < Xtr.length; i++) { var z = n.b1[j] + n.W1[2 * j] * Xtr[i][0] + n.W1[2 * j + 1] * Xtr[i][1]; if (z > 0) { any = true; break; } } if (!any) c++; } return c; }
  function update() {
    var rows = nets.map(function (n, k) {
      var a = n.lossAcc(Xtr, Ytr), b = n.lossAcc(Xte, Yte), isRelu = KEYS[k] === "relu" || KEYS[k] === "leaky";
      return [ACTS[KEYS[k]].n, a.loss.toFixed(3), (a.acc * 100).toFixed(0) + " %", (b.acc * 100).toFixed(0) + " %", isRelu ? dead(n) + " de " + n.H : "—"];
    });
    tb.set(rows);
    var ls = nets.map(function (n) { return n.lossAcc(Xtr, Ytr).loss; }), best = ls.indexOf(Math.min.apply(null, ls));
    out.set("Paso <b>" + S.step + " / " + MAXSTEPS + "</b> · learning rate = <b>" + Math.pow(10, S.lrExp).toPrecision(2) + "</b> · " + (S.opt === "sgd" ? "SGD" : "Adam") + "<br>" +
      (S.step === 0 ? "Pulsa «Empezar la carrera»: las cuatro redes empiezan con los mismos pesos." : "Va ganando (menor pérdida): <b>" + ACTS[KEYS[best]].n + "</b>.") +
      " «Neuronas muertas» = ocultas cuyo z es ≤ 0 para todos los puntos de entrenamiento (en LeakyReLU significa «solo en su tramo con pendiente 0.01»).");
    viewL.redraw(); viewM.redraw();
  }
  genData(); build();
  return { destroy: function () { stop(); } };
});
