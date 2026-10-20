/* Experimento: una red con UNA capa oculta (2-H-1) entrenándose en vivo.
   El mapa muestra la probabilidad de la clase 1 y la recta z = 0 de cada neurona oculta;
   las miniaturas muestran qué «ve» cada neurona. Con la opción de pesos iniciales idénticos se ve el problema de la simetría. */
Lab.register("curso5/c5m1-capa-oculta-vivo", function (root, api) {
  var D = api.d, M = api.math, C0 = api.colors();
  var DATASETS = { xor4: "XOR (cuatro nubes)", circles: "Círculos concéntricos", moons: "Dos lunas" };
  var S = { data: "xor4", H: 4, act: "tanh", lrExp: -1.3, sym: false, seed: 3, dseed: 2, step: 0, run: false, hist: [] };
  var GRID = 40, TG = 14, HM = 1.6, STEPS = 5, MAXSTEPS = 6000;
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

  var train, test, net, Xtr, Ytr, Xte, Yte;
  function genData() {
    var d = makeData(api, S.data, S.dseed, 200), X = [], Y = [], Xt = [], Yt = [];
    d.X.forEach(function (p, i) { if (i % 5 === 4) { Xt.push(p); Yt.push(d.Y[i]); } else { X.push(p); Y.push(d.Y[i]); } });
    Xtr = X; Ytr = Y; Xte = Xt; Yte = Yt;
  }
  function build() {
    stop(); net = new Net(S.H, 2, 1, S.act, api.rng(S.seed * 101 + 7), S.sym); S.step = 0;
    var a = net.lossAcc(Xtr, Ytr); S.hist = [[0, a.loss]]; update();
  }

  var row = api.el("div", { class: "lab-row" }), colA = api.el("div"), colB = api.el("div");
  row.appendChild(colA); row.appendChild(colB); root.appendChild(row);
  var view = api.view(colA, { aspect: 1.0, minH: 250, maxH: 420, label: "Mapa de gustos de los usuarios con la probabilidad de que terminen la serie y las rectas de las neuronas ocultas" });
  var plot = api.plot(view, { xr: [-HM, HM], yr: [-HM, HM], xticks: 4, yticks: 4, xlabel: "x₁ · gusto por la acción", ylabel: "x₂ · comedia", pad: { l: 40, r: 14, t: 8, b: 38 }, xfmt: function (v) { return +v.toFixed(1); }, yfmt: function (v) { return +v.toFixed(1); } });
  var viewT = api.view(colB, { aspect: 1.45, minH: 170, maxH: 280, label: "Miniaturas de lo que calcula cada neurona oculta" });
  var viewL = api.view(colB, { aspect: 2.4, minH: 120, maxH: 190, label: "Curva de pérdida durante el entrenamiento" });
  var plotL = api.plot(viewL, { xr: [0, 100], yr: [0, 1], xticks: 4, yticks: 2, xlabel: "pasos", pad: { l: 40, r: 24, t: 20, b: 34 }, xfmt: function (v) { return Math.round(v); } });
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.72rem, 2.7vw, .84rem)";

  ui.select({ label: "Datos", value: S.data, options: Object.keys(DATASETS).map(function (k) { return [k, DATASETS[k]]; }), onChange: function (v) { S.data = v; genData(); build(); } });
  ui.slider({ label: "H: neuronas ocultas", min: 1, max: 12, step: 1, value: S.H, fmt: function (v) { return v; }, onInput: function (v) { S.H = v; build(); } });
  ui.select({ label: "Activación oculta", value: S.act, options: Object.keys(ACTS).map(function (k) { return [k, ACTS[k].n]; }), onChange: function (v) { S.act = v; build(); } });
  ui.slider({ label: "Learning rate (Adam)", min: -3, max: -0.5, step: 0.1, value: S.lrExp, fmt: function (v) { return Math.pow(10, v).toPrecision(2); }, onInput: function (v) { S.lrExp = v; update(); } });
  ui.toggle({ label: "Pesos iniciales idénticos (simetría)", value: S.sym, onChange: function (v) { S.sym = v; build(); } });
  var btn = ui.button("▶ Entrenar", function () {
    if (S.run) { stop(); return; }
    if (api.reduceMotion) { for (var i = 0; i < 1500; i++) one(); update(); return; }
    S.run = true; btn.textContent = "❚❚ Pausa"; loop.start();
  }, "primary");
  ui.button("+100 pasos", function () { stop(); for (var i = 0; i < 100; i++) one(); update(); });
  ui.button("Reiniciar pesos", function () { S.seed++; build(); });
  ui.button("Otros datos", function () { S.dseed++; genData(); build(); });
  api.legend(root, [[C0.cobalto, "termina la serie (clase 1)"], [C0.terracota, "la abandona (clase 0)"], [C0.muted, "cada punto es un usuario · lleno = entrenamiento · aro = test · rayas = z = 0 de cada neurona"]]);

  function one() {
    net.step(Xtr, Ytr, Math.pow(10, S.lrExp), "adam"); S.step++;
    if (S.step % 10 === 0) { S.hist.push([S.step, net.lossAcc(Xtr, Ytr).loss]); if (S.hist.length > 600) S.hist.splice(1, 1); }
  }
  var loop = api.loop(function () { for (var i = 0; i < STEPS; i++) one(); update(); if (S.step >= MAXSTEPS) { stop(); return false; } }, { fps: 30 });
  function stop() { S.run = false; if (loop) loop.stop(); btn.textContent = "▶ Entrenar"; }

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
    if (!net) return;
    plot.axes(ctx); var b = plot.box;
    ctx.save(); plot.clip(ctx);
    heat(ctx, b.x, b.y, b.w, b.h, GRID, function (x, y) { return net.forward([x, y])[0]; }, rgb(C.terracota), rgb(C.cobalto), 0.5);
    // recta z_j = 0 de cada neurona oculta: W1[j,0]·x + W1[j,1]·y + b1[j] = 0
    for (var j = 0; j < net.H; j++) {
      var a = net.W1[2 * j], c = net.W1[2 * j + 1], e = net.b1[j], p1, p2;
      if (Math.abs(c) > Math.abs(a)) { p1 = [-HM, -(a * -HM + e) / c]; p2 = [HM, -(a * HM + e) / c]; }
      else if (Math.abs(a) > 1e-9) { p1 = [-(c * -HM + e) / a, -HM]; p2 = [-(c * HM + e) / a, HM]; }
      else continue;
      D.line(ctx, plot.x(p1[0]), plot.y(p1[1]), plot.x(p2[0]), plot.y(p2[1]), C.ink, 1.4, [5, 4]);
    }
    Xte.forEach(function (p, i) { D.circle(ctx, plot.x(p[0]), plot.y(p[1]), 3.6, null, Yte[i] ? C.cobalto : C.terracota, 1.8); });
    Xtr.forEach(function (p, i) { D.circle(ctx, plot.x(p[0]), plot.y(p[1]), 3.8, Ytr[i] ? C.cobalto : C.terracota, C.paper, 1.2); });
    ctx.restore();
  });
  viewT.draw(function (ctx, w, h, C) {
    if (!net) return;
    var n = net.H + 1, cols = Math.max(1, Math.min(n, Math.round(Math.sqrt(n * w / h * 1.1)))), rows = Math.ceil(n / cols);
    var cw = w / cols, ch = h / rows, sz = Math.min(cw, ch) - 8, k;
    for (k = 0; k < n; k++) {
      var cx = (k % cols) * cw + (cw - sz) / 2, cy = Math.floor(k / cols) * ch + (ch - sz) / 2 + 4;
      var isOut = k === net.H, vals = [], mn = Infinity, mx = -Infinity, i, j;
      for (j = 0; j < TG; j++) for (i = 0; i < TG; i++) {
        net.forward([-HM + 2 * HM * (i + 0.5) / TG, HM - 2 * HM * (j + 0.5) / TG]);
        var v = isOut ? net.o[0] : net.h[k]; vals.push(v); mn = Math.min(mn, v); mx = Math.max(mx, v);
      }
      var span = Math.max(mx - mn, 1e-9);
      heat(ctx, cx, cy, sz, sz, TG, function (x, y) {
        var ii = Math.min(TG - 1, Math.floor((x + HM) / (2 * HM) * TG)), jj = Math.min(TG - 1, Math.floor((HM - y) / (2 * HM) * TG));
        return isOut ? vals[jj * TG + ii] : (vals[jj * TG + ii] - mn) / span;
      }, isOut ? rgb(C.terracota) : rgb(C.paper), isOut ? rgb(C.cobalto) : rgb(C.cobalto), 1);
      D.rect(ctx, cx, cy, sz, sz, null, C.ink, 1);
      D.text(ctx, isOut ? "salida" : "h" + (k + 1), cx + sz / 2, cy - 1.5, { size: 9.5, align: "center", color: C.muted, weight: 600 });
    }
  });
  viewL.draw(function (ctx, w, h, C) {
    if (!S.hist.length) return;
    var H = S.hist, xmax = Math.max(100, H[H.length - 1][0]), ymax = Math.max(0.8, Math.ceil(H[0][1] * 5) / 5);
    plotL.xr = [0, xmax]; plotL.yr = [0, ymax]; plotL.axes(ctx); ctx.save(); plotL.clip(ctx);
    D.path(ctx, H.map(function (q) { return [plotL.x(q[0]), plotL.y(Math.min(q[1], ymax))]; }), C.cobalto, 2.5);
    ctx.restore(); D.text(ctx, "pérdida de entrenamiento", plotL.box.x + 4, 13, { size: 11, color: C.cobaltoInk, weight: 600 });
  });

  function distinct() {
    var H = net.H, groups = [], j, k, sig = [];
    for (j = 0; j < H; j++) {
      var v = [net.W1[2 * j], net.W1[2 * j + 1], net.b1[j]], nr = Math.hypot(v[0], v[1], v[2]) || 1; sig.push(v.map(function (x) { return x / nr; }));
    }
    for (j = 0; j < H; j++) {
      var same = false;
      for (k = 0; k < groups.length; k++) { var u = sig[groups[k]]; if (u[0] * sig[j][0] + u[1] * sig[j][1] + u[2] * sig[j][2] > 0.999) { same = true; break; } }
      if (!same) groups.push(j);
    }
    return groups.length;
  }
  function update() {
    var a = net.lossAcc(Xtr, Ytr), b = net.lossAcc(Xte, Yte), nd = distinct(), msg;
    if (S.step === 0) msg = "Pulsa «Entrenar». Los pesos iniciales son aleatorios" + (S.sym ? " <b>pero idénticos en todas las neuronas</b>." : " (distintos en cada neurona).");
    else if (nd < net.H && net.H > 1) msg = "<span class='bad'>Solo " + nd + " neurona" + (nd > 1 ? "s" : "") + " distinta" + (nd > 1 ? "s" : "") + " de " + net.H + ": las demás son copias exactas y no aportan nada.</span>";
    else if (a.acc >= 0.97 && b.acc >= 0.9) msg = "<span class='good'>Resuelto: la red separa a quien termina la serie de quien la abandona y acierta también con usuarios nuevos (test).</span>";
    else if (a.acc < 0.9) msg = "Todavía no la separa bien: más pasos, más neuronas u otra activación.";
    else msg = "Casi resuelto.";
    out.set("Paso <b>" + S.step + "</b> · parámetros: <b>" + net.nparams() + "</b> · pérdida = <b>" + a.loss.toFixed(3) + "</b><br>" +
      "acierto train = <b>" + (a.acc * 100).toFixed(0) + " %</b> · test = <b>" + (b.acc * 100).toFixed(0) + " %</b> · neuronas ocultas distintas: <b>" + nd + " de " + net.H + "</b><br>" + msg);
    view.redraw(); viewT.redraw(); viewL.redraw();
  }
  genData(); build();
  return { destroy: function () { stop(); } };
});
