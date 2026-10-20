/* Experimento: tres clases con una capa oculta. La capa de salida tiene K = 3 neuronas (una por clase); softmax convierte
   sus tres logits en probabilidades y CrossEntropyLoss mide el error. Haz clic en el mapa para ver los números de un punto. */
Lab.register("curso5/c5m1-multiclase", function (root, api) {
  var D = api.d, M = api.math, C0 = api.colors();
  var S = { data: "spiral3", H: 12, act: "tanh", lrExp: -1.5, seed: 3, dseed: 4, step: 0, run: false, hist: [], probe: [0.55, 0.35] };
  var HM = 1.6, GRID = 36, STEPS = 5, MAXSTEPS = 4000, K = 3;
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

  var net, Xtr, Ytr, Xte, Yte;
  function data3(kind, seed) {
    var r = api.rng(seed * 29 + 3), X = [], Y = [], c, i, n = 70;
    for (c = 0; c < K; c++) for (i = 0; i < n; i++) {
      var p;
      if (kind === "spiral3") { var t = i / n, rad = 0.15 + 1.25 * t, a = c * 2 * Math.PI / K + 3.2 * t + r.normal(0, 0.12); p = [rad * Math.cos(a), rad * Math.sin(a)]; }
      else { var ang = c * 2 * Math.PI / K + Math.PI / 6; p = [0.85 * Math.cos(ang) + r.normal(0, 0.38), 0.85 * Math.sin(ang) + r.normal(0, 0.38)]; }
      X.push(Float64Array.of(p[0], p[1])); Y.push(c);
    }
    return { X: X, Y: Y };
  }
  function genData() {
    var d = data3(S.data, S.dseed), X = [], Y = [], Xt = [], Yt = [], idx = d.X.map(function (_, i) { return i; });
    api.rng(S.dseed + 99).shuffle(idx);
    idx.forEach(function (i, q) { if (q % 4 === 3) { Xt.push(d.X[i]); Yt.push(d.Y[i]); } else { X.push(d.X[i]); Y.push(d.Y[i]); } });
    Xtr = X; Ytr = Y; Xte = Xt; Yte = Yt;
  }
  function build() {
    stop(); net = new Net(S.H, 2, K, S.act, api.rng(S.seed * 101 + 7), false); S.step = 0;
    S.hist = [[0, net.lossAcc(Xtr, Ytr).loss]]; update();
  }
  var row = api.el("div", { class: "lab-row" }), colA = api.el("div"), colB = api.el("div");
  row.appendChild(colA); row.appendChild(colB); root.appendChild(row);
  var view = api.view(colA, { aspect: 1.0, minH: 250, maxH: 420, drag: true, label: "Mapa de la clase que predice la red, con los puntos de entrenamiento" });
  var plot = api.plot(view, { xr: [-HM, HM], yr: [-HM, HM], xticks: 4, yticks: 4, pad: { l: 30, r: 14, t: 8, b: 22 }, xfmt: function (v) { return +v.toFixed(1); }, yfmt: function (v) { return +v.toFixed(1); } });
  var viewP = api.view(colB, { aspect: 1.25, minH: 190, maxH: 300, label: "Logits y probabilidades del punto marcado" });
  var viewL = api.view(colB, { aspect: 2.4, minH: 110, maxH: 180, label: "Curva de pérdida" });
  var plotL = api.plot(viewL, { xr: [0, 100], yr: [0, 1.2], xticks: 4, yticks: 2, xlabel: "pasos", pad: { l: 40, r: 24, t: 20, b: 34 }, xfmt: function (v) { return Math.round(v); } });
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.72rem, 2.7vw, .84rem)";
  ui.select({ label: "Datos", value: S.data, options: [["spiral3", "Tres espirales"], ["blobs3", "Tres nubes"]], onChange: function (v) { S.data = v; genData(); build(); } });
  ui.slider({ label: "H: neuronas ocultas", min: 2, max: 24, step: 1, value: S.H, fmt: function (v) { return v; }, onInput: function (v) { S.H = v; build(); } });
  ui.select({ label: "Activación oculta", value: S.act, options: Object.keys(ACTS).map(function (k) { return [k, ACTS[k].n]; }), onChange: function (v) { S.act = v; build(); } });
  var btn = ui.button("▶ Entrenar", function () {
    if (S.run) { stop(); return; }
    if (api.reduceMotion) { for (var i = 0; i < 1500; i++) one(); update(); return; }
    S.run = true; btn.textContent = "❚❚ Pausa"; loop.start();
  }, "primary");
  ui.button("+100 pasos", function () { stop(); for (var i = 0; i < 100; i++) one(); update(); });
  ui.button("Reiniciar pesos", function () { S.seed++; build(); });
  ui.button("Otros datos", function () { S.dseed++; genData(); build(); });
  api.legend(root, [[C0.cobalto, "clase 0"], [C0.terracota, "clase 1"], [C0.oliva, "clase 2"], [C0.ink, "tu punto de prueba (clic en el mapa)"]]);

  function one() {
    net.step(Xtr, Ytr, Math.pow(10, S.lrExp), "adam"); S.step++;
    if (S.step % 10 === 0) { S.hist.push([S.step, net.lossAcc(Xtr, Ytr).loss]); if (S.hist.length > 600) S.hist.splice(1, 1); }
  }
  var loop = api.loop(function () { for (var i = 0; i < STEPS; i++) one(); update(); if (S.step >= MAXSTEPS) { stop(); return false; } }, { fps: 30 });
  function stop() { S.run = false; if (loop) loop.stop(); btn.textContent = "▶ Entrenar"; }
  function setProbe(px, py) { if (!plot.inside(px, py)) return; S.probe = [plot.ix(px), plot.iy(py)]; update(); }
  view.pointer({ down: setProbe, drag: setProbe });

  var off = document.createElement("canvas"), octx = off.getContext("2d");
  function cls(C) { return [C.cobalto, C.terracota, C.oliva]; }
  view.draw(function (ctx, w, h, C) {
    if (!net) return;
    plot.axes(ctx); var b = plot.box, cs = cls(C).map(rgb), N = GRID, i, j, k;
    off.width = N; off.height = N; var img = octx.createImageData(N, N);
    for (j = 0; j < N; j++) for (i = 0; i < N; i++) {
      var o = net.forward([-HM + 2 * HM * (i + 0.5) / N, HM - 2 * HM * (j + 0.5) / N]), q = 4 * (j * N + i), r = 0, g = 0, bl = 0;
      for (k = 0; k < K; k++) { r += o[k] * cs[k][0]; g += o[k] * cs[k][1]; bl += o[k] * cs[k][2]; }
      img.data[q] = r; img.data[q + 1] = g; img.data[q + 2] = bl; img.data[q + 3] = 255;
    }
    octx.putImageData(img, 0, 0);
    ctx.save(); plot.clip(ctx); ctx.globalAlpha = 0.5; ctx.imageSmoothingEnabled = true; ctx.drawImage(off, b.x, b.y, b.w, b.h); ctx.globalAlpha = 1;
    var cl = cls(C);
    Xte.forEach(function (p, q) { D.circle(ctx, plot.x(p[0]), plot.y(p[1]), 3.6, null, cl[Yte[q]], 1.8); });
    Xtr.forEach(function (p, q) { D.circle(ctx, plot.x(p[0]), plot.y(p[1]), 3.8, cl[Ytr[q]], C.paper, 1.2); });
    var px = plot.x(S.probe[0]), py = plot.y(S.probe[1]);
    D.circle(ctx, px, py, 8, null, C.ink, 2.6); D.line(ctx, px - 12, py, px + 12, py, C.ink, 1.2); D.line(ctx, px, py - 12, px, py + 12, C.ink, 1.2);
    ctx.restore();
  });
  viewP.draw(function (ctx, w, h, C) {
    if (!net) return;
    net.forward(S.probe);
    var raw = [], k; net.forward(S.probe);
    for (k = 0; k < K; k++) { var s = net.b2[k], j; for (j = 0; j < net.H; j++) s += net.W2[k * net.H + j] * net.h[j]; raw.push(s); }
    var p = net.o, cl = cls(C), mx = Math.max.apply(null, raw.map(Math.abs).concat([1])), midx = w * 0.36, bh = Math.min(26, (h - 40) / 3 - 8);
    D.text(ctx, "logits z", midx / 2, 14, { size: 11, weight: 700, align: "center", color: C.ink2 });
    D.text(ctx, "softmax → probabilidades", (w + midx) / 2, 14, { size: 11, weight: 700, align: "center", color: C.ink2 });
    for (k = 0; k < K; k++) {
      var y = 26 + k * (bh + 14);
      var zx = 40 + (midx - 44) / 2, zw = (midx - 44) / 2 * raw[k] / mx;
      D.text(ctx, raw[k].toFixed(1).replace("-", "−"), 4, y + bh / 2 + 4, { size: 10.5, mono: true, color: C.ink2 });
      D.line(ctx, zx, y - 3, zx, y + bh + 3, C.muted, 1);
      D.rect(ctx, Math.min(zx, zx + zw), y, Math.abs(zw), bh, cl[k]);
      var x0 = midx + 22, wmax = w - x0 - 52;
      D.text(ctx, String(k), midx + 10, y + bh / 2 + 5, { size: 13, weight: 700, align: "center", color: C.ink });
      D.rect(ctx, x0, y, wmax, bh, C.surface, C.line, 1);
      D.rect(ctx, x0, y, Math.max(1, wmax * p[k]), bh, cl[k]);
      D.text(ctx, (p[k] * 100).toFixed(1) + "%", x0 + wmax + 4, y + bh / 2 + 4, { size: 10.5, mono: true });
    }
  });
  viewL.draw(function (ctx, w, h, C) {
    if (!S.hist.length) return;
    var H = S.hist, xmax = Math.max(100, H[H.length - 1][0]), ymax = Math.max(1.2, Math.ceil(H[0][1] * 5) / 5);
    plotL.xr = [0, xmax]; plotL.yr = [0, ymax]; plotL.axes(ctx); ctx.save(); plotL.clip(ctx);
    D.path(ctx, H.map(function (q) { return [plotL.x(q[0]), plotL.y(Math.min(q[1], ymax))]; }), C.cobalto, 2.5);
    D.line(ctx, plotL.box.x, plotL.y(Math.log(3)), plotL.box.x + plotL.box.w, plotL.y(Math.log(3)), C.muted, 1.2, [4, 3]);
    ctx.restore(); D.text(ctx, "pérdida (línea de puntos: ln 3 = 1.099, adivinar al azar)", plotL.box.x + 4, 13, { size: 10, color: C.cobaltoInk, weight: 600 });
  });
  function update() {
    var a = net.lossAcc(Xtr, Ytr), b = net.lossAcc(Xte, Yte);
    net.forward(S.probe);
    var p = net.o, best = 0, k; for (k = 1; k < K; k++) if (p[k] > p[best]) best = k;
    out.set("Paso <b>" + S.step + "</b> · parámetros: <b>" + net.nparams() + "</b> (capa de salida: <b>" + K + "</b> neuronas × " + S.H + " + " + K + " sesgos) · pérdida = <b>" + a.loss.toFixed(3) + "</b><br>" +
      "acierto train = <b>" + (a.acc * 100).toFixed(0) + " %</b> · test = <b>" + (b.acc * 100).toFixed(0) + " %</b><br>" +
      "Punto (" + S.probe[0].toFixed(2) + ", " + S.probe[1].toFixed(2) + "): probabilidades " + [0, 1, 2].map(function (q) { return (p[q] * 100).toFixed(1) + "%"; }).join(" / ") + " → <b>argmax = clase " + best + "</b>");
    view.redraw(); viewP.redraw(); viewL.redraw();
  }
  genData(); build();
  return { destroy: function () { stop(); } };
});
