/* Experimento: una red neuronal entrenándose EN VIVO en tu navegador (forward + backpropagation + SGD o Adam reales).
   Clasificación binaria en 2D: capa de salida sigmoide + entropía cruzada binaria. */
Lab.register("curso2/c2m1-mini-red", function (root, api) {
  var M = api.math, D = api.d, C0 = api.colors();
  var S = { data: "circles", layers: 2, width: 6, act: "tanh", opt: "adam", lrExp: -1.8, seed: 1, dseed: 4, step: 0, hist: [], run: false };
  var STEPS_PER_FRAME = 6, GRID = 44, HM = 1.6;
  var ACT = {
    tanh: { f: Math.tanh, d: function (z, a) { return 1 - a * a; }, name: "tanh" },
    relu: { f: function (z) { return z > 0 ? z : 0; }, d: function (z) { return z > 0 ? 1 : 0; }, name: "ReLU" },
    sigmoid: { f: function (z) { return 1 / (1 + Math.exp(-z)); }, d: function (z, a) { return a * (1 - a); }, name: "Sigmoide" },
    linear: { f: function (z) { return z; }, d: function () { return 1; }, name: "Lineal (sin activación)" }
  };
  var DATASETS = { circles: "Círculos concéntricos", xor: "XOR (4 grupos)", moons: "Dos lunas", spiral: "Espiral" };
  function sigm(z) { return 1 / (1 + Math.exp(-z)); }

  /* ---------- datos ---------- */
  var train, test;
  function genData() {
    var r = api.rng(S.dseed * 17 + 3), pts = [], i, N = 240, t, rad, a, lab;
    for (i = 0; i < N; i++) {
      lab = i % 2; var x, y;
      if (S.data === "circles") { a = r.range(0, 6.2832); rad = lab ? r.range(0, 0.55) : r.range(0.85, 1.35); x = rad * Math.cos(a) + r.normal(0, 0.05); y = rad * Math.sin(a) + r.normal(0, 0.05); }
      else if (S.data === "xor") { var sx = r.next() < 0.5 ? -1 : 1, sy = (lab ? -1 : 1) * sx; x = sx * 0.7 + r.normal(0, 0.25); y = sy * 0.7 + r.normal(0, 0.25); }
      else if (S.data === "moons") { t = r.range(0, Math.PI); if (lab) { x = Math.cos(t) - 0.5 + r.normal(0, 0.1); y = Math.sin(t) - 0.25 + r.normal(0, 0.1); } else { x = 0.5 - Math.cos(t) + r.normal(0, 0.1); y = 0.25 - Math.sin(t) + r.normal(0, 0.1); } x *= 1.1; y *= 1.3; }
      else { t = r.range(0.25, 1) * 3.4 * Math.PI; rad = t / (3.4 * Math.PI) * 1.4; var sg = lab ? 1 : -1; x = sg * rad * Math.cos(t) + r.normal(0, 0.05); y = sg * rad * Math.sin(t) + r.normal(0, 0.05); }
      pts.push({ x: x, y: y, l: lab });
    }
    train = []; test = [];
    pts.forEach(function (p, k) { (k % 3 === 2 ? test : train).push(p); });
  }

  /* ---------- red ---------- */
  var net;
  function buildNet() {
    var r = api.rng(S.seed * 101 + 7), sizes = [2], i, j, k;
    for (i = 0; i < S.layers; i++) sizes.push(S.width); sizes.push(1);
    var off = [], tot = 0;
    for (i = 0; i < sizes.length - 1; i++) { off.push(tot); tot += (sizes[i] + 1) * sizes[i + 1]; }
    var p = new Float64Array(tot);
    for (i = 0; i < sizes.length - 1; i++) {
      var nin = sizes[i], nout = sizes[i + 1], sd = (S.act === "relu" || S.act === "linear") ? Math.sqrt(2 / nin) : Math.sqrt(2 / (nin + nout));
      for (j = 0; j < nout; j++) for (k = 0; k < nin; k++) p[off[i] + j * nin + k] = r.normal(0, sd);
    }
    net = { sizes: sizes, off: off, p: p, m: new Float64Array(tot), v: new Float64Array(tot), t: 0 };
    S.step = 0; S.hist = [];
    S.hist.push([0, evalLoss(train), evalLoss(test)]);
  }
  function forward(X) {
    var A = [X], Z = [], L = net.sizes.length - 1, l, s, i, j, ac = ACT[S.act];
    for (l = 0; l < L; l++) {
      var nin = net.sizes[l], nout = net.sizes[l + 1], off = net.off[l], An = [], Zn = [], p = net.p, bo = off + nin * nout;
      for (s = 0; s < X.length; s++) {
        var a = A[l][s], z = new Float64Array(nout), o = new Float64Array(nout);
        for (j = 0; j < nout; j++) { var sum = p[bo + j], base = off + j * nin; for (i = 0; i < nin; i++) sum += p[base + i] * a[i]; z[j] = sum; o[j] = l === L - 1 ? sigm(sum) : ac.f(sum); }
        Zn.push(z); An.push(o);
      }
      Z.push(Zn); A.push(An);
    }
    return { A: A, Z: Z };
  }
  function toX(set) { return set.map(function (p) { return Float64Array.of(p.x, p.y); }); }
  function evalLoss(set) {
    var o = forward(toX(set)).A[net.sizes.length - 1], s = 0;
    for (var i = 0; i < set.length; i++) { var q = Math.min(1 - 1e-12, Math.max(1e-12, o[i][0])); s -= set[i].l ? Math.log(q) : Math.log(1 - q); }
    return s / set.length;
  }
  function evalAcc(set) {
    var o = forward(toX(set)).A[net.sizes.length - 1], c = 0;
    for (var i = 0; i < set.length; i++) if ((o[i][0] > 0.5) === (set[i].l === 1)) c++;
    return c / set.length;
  }
  var Xtr;
  function trainStep() {
    var L = net.sizes.length - 1, n = train.length, F = forward(Xtr), g = new Float64Array(net.p.length), l, s, i, j, ac = ACT[S.act];
    var delta = [];
    for (s = 0; s < n; s++) delta.push(Float64Array.of((F.A[L][s][0] - train[s].l) / n));
    for (l = L - 1; l >= 0; l--) {
      var nin = net.sizes[l], nout = net.sizes[l + 1], off = net.off[l], bo = off + nin * nout, prev = [];
      for (s = 0; s < n; s++) {
        var d = delta[s], a = F.A[l][s], pd = l > 0 ? new Float64Array(nin) : null;
        for (j = 0; j < nout; j++) {
          var dj = d[j]; g[bo + j] += dj; var base = off + j * nin;
          for (i = 0; i < nin; i++) { g[base + i] += dj * a[i]; if (pd) pd[i] += net.p[base + i] * dj; }
        }
        if (pd) { var zz = F.Z[l - 1][s], aa = F.A[l][s]; for (i = 0; i < nin; i++) pd[i] *= ac.d(zz[i], aa[i]); prev.push(pd); }
      }
      delta = prev;
    }
    var lr = Math.pow(10, S.lrExp), p = net.p, k;
    if (S.opt === "sgd") { for (k = 0; k < p.length; k++) p[k] -= lr * g[k]; }
    else {
      net.t++; var b1 = 0.9, b2 = 0.999, c1 = 1 - Math.pow(b1, net.t), c2 = 1 - Math.pow(b2, net.t);
      for (k = 0; k < p.length; k++) {
        net.m[k] = b1 * net.m[k] + (1 - b1) * g[k]; net.v[k] = b2 * net.v[k] + (1 - b2) * g[k] * g[k];
        p[k] -= lr * (net.m[k] / c1) / (Math.sqrt(net.v[k] / c2) + 1e-7);
      }
    }
    S.step++;
    if (S.step % 10 === 0) { S.hist.push([S.step, evalLoss(train), evalLoss(test)]); if (S.hist.length > 700) S.hist.splice(1, 1); }
  }

  /* ---------- interfaz ---------- */
  var row = api.el("div", { class: "lab-row" }), colA = api.el("div"), colB = api.el("div");
  row.appendChild(colA); row.appendChild(colB); root.appendChild(row);
  var view = api.view(colA, { aspect: 1.0, minH: 260, maxH: 440, label: "Frontera de decisión de la red sobre los puntos de entrenamiento y de test" });
  var plot = api.plot(view, { xr: [-HM, HM], yr: [-HM, HM], xticks: 4, yticks: 4, pad: { l: 30, r: 8, t: 8, b: 22 }, xfmt: function (v) { return +v.toFixed(1); }, yfmt: function (v) { return +v.toFixed(1); } });
  var viewN = api.view(colB, { aspect: 1.5, minH: 170, maxH: 280, label: "Esquema de la red con el color de cada conexión según el signo del peso" });
  var viewL = api.view(colB, { aspect: 2.3, minH: 130, maxH: 200, label: "Pérdida de entrenamiento y de test durante el entrenamiento" });
  var plotL = api.plot(viewL, { xr: [0, 100], yr: [0, 1], xticks: 4, yticks: 2, xlabel: "pasos de entrenamiento", pad: { l: 40, r: 10, t: 22, b: 32 }, xfmt: function (v) { return Math.round(v); } });
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.72rem, 2.7vw, .84rem)";
  function rebuild() { stop(); Xtr = toX(train); buildNet(); update(); }
  ui.select({ label: "Datos", value: S.data, options: Object.keys(DATASETS).map(function (k) { return [k, DATASETS[k]]; }), onChange: function (v) { S.data = v; genData(); rebuild(); } });
  ui.slider({ label: "Capas ocultas", min: 0, max: 4, step: 1, value: S.layers, fmt: function (v) { return v; }, onInput: function (v) { S.layers = v; rebuild(); } });
  ui.slider({ label: "Neuronas por capa", min: 1, max: 12, step: 1, value: S.width, fmt: function (v) { return v; }, onInput: function (v) { S.width = v; rebuild(); } });
  ui.select({ label: "Activación de las capas ocultas", value: S.act, options: Object.keys(ACT).map(function (k) { return [k, ACT[k].name]; }), onChange: function (v) { S.act = v; rebuild(); } });
  ui.select({ label: "Optimizador", value: S.opt, options: [["adam", "Adam"], ["sgd", "SGD (descenso de gradiente simple)"]], onChange: function (v) { S.opt = v; rebuild(); } });
  ui.slider({ label: "Learning rate (escala logarítmica)", min: -4, max: 0, step: 0.1, value: S.lrExp, fmt: function (v) { return Math.pow(10, v).toPrecision(2); }, onInput: function (v) { S.lrExp = v; updateText(); } });
  var btn = ui.button("▶ Entrenar", function () {
    if (S.run) { stop(); return; }
    if (api.reduceMotion) { for (var i = 0; i < 1500; i++) trainStep(); update(); return; }
    S.run = true; btn.textContent = "❚❚ Pausa"; loop.start();
  }, "primary");
  ui.button("Dar 100 pasos", function () { stop(); for (var i = 0; i < 100; i++) trainStep(); update(); });
  ui.button("Reiniciar pesos", function () { S.seed++; rebuild(); });
  ui.button("Otros datos", function () { S.dseed++; genData(); rebuild(); });
  api.legend(root, [[C0.cobalto, "clase 1"], [C0.terracota, "clase 0"], [C0.muted, "punto lleno = entrenamiento · aro = test (la red no lo ve)"]]);
  var loop = api.loop(function () { for (var i = 0; i < STEPS_PER_FRAME; i++) trainStep(); update(); if (S.step > 40000) { stop(); return false; } }, { fps: 30 });
  function stop() { S.run = false; if (loop) loop.stop(); btn.textContent = "▶ Entrenar"; }

  /* ---------- dibujo ---------- */
  function rgb(h) {
    h = (h || "#888").trim();
    if (h.charAt(0) === "#") { if (h.length === 4) h = "#" + h[1] + h[1] + h[2] + h[2] + h[3] + h[3]; return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
    var m = h.match(/\d+/g); return m ? [+m[0], +m[1], +m[2]] : [128, 128, 128];
  }
  var off = document.createElement("canvas"); off.width = GRID; off.height = GRID; var octx = off.getContext("2d"), img = octx.createImageData(GRID, GRID);
  function drawMap(ctx, w, h, C) {
    plot.axes(ctx);
    var b = plot.box, pts = [], i, j, c1 = rgb(C.cobalto), c0 = rgb(C.terracota);
    for (j = 0; j < GRID; j++) for (i = 0; i < GRID; i++) pts.push(Float64Array.of(-HM + 2 * HM * (i + 0.5) / GRID, HM - 2 * HM * (j + 0.5) / GRID));
    var o = forward(pts).A[net.sizes.length - 1];
    for (j = 0; j < GRID; j++) for (i = 0; i < GRID; i++) {
      var q = o[j * GRID + i][0], k = 4 * (j * GRID + i);
      img.data[k] = c0[0] + (c1[0] - c0[0]) * q; img.data[k + 1] = c0[1] + (c1[1] - c0[1]) * q; img.data[k + 2] = c0[2] + (c1[2] - c0[2]) * q; img.data[k + 3] = 255;
    }
    octx.putImageData(img, 0, 0);
    ctx.save(); plot.clip(ctx); ctx.globalAlpha = 0.5; ctx.imageSmoothingEnabled = true; ctx.drawImage(off, b.x, b.y, b.w, b.h); ctx.globalAlpha = 1;
    test.forEach(function (p) { D.circle(ctx, plot.x(p.x), plot.y(p.y), 3.6, null, p.l ? C.cobalto : C.terracota, 1.8); });
    train.forEach(function (p) { D.circle(ctx, plot.x(p.x), plot.y(p.y), 3.8, p.l ? C.cobalto : C.terracota, C.paper, 1.2); });
    ctx.restore();
  }
  function drawNet(ctx, w, h, C) {
    var sz = net.sizes, nl = sz.length, i, j, l, pos = [];
    var mx = w * 0.07, colx = function (l) { return mx + (w - 2 * mx) * l / (nl - 1); };
    for (l = 0; l < nl; l++) {
      var n = sz[l], gap = Math.min(24, (h - 28) / Math.max(n, 1)), y0 = h / 2 - gap * (n - 1) / 2, col = [];
      for (i = 0; i < n; i++) col.push([colx(l), y0 + gap * i]);
      pos.push(col);
    }
    var maxw = 0, k; for (k = 0; k < net.p.length; k++) maxw = Math.max(maxw, Math.abs(net.p[k]));
    for (l = 0; l < nl - 1; l++) {
      var nin = sz[l], nout = sz[l + 1], off2 = net.off[l];
      for (j = 0; j < nout; j++) for (i = 0; i < nin; i++) {
        var wt = net.p[off2 + j * nin + i], mag = Math.abs(wt) / (maxw || 1);
        ctx.save(); ctx.globalAlpha = 0.12 + 0.7 * mag;
        D.line(ctx, pos[l][i][0], pos[l][i][1], pos[l + 1][j][0], pos[l + 1][j][1], wt >= 0 ? C.cobalto : C.terracota, 0.6 + 2.6 * mag); ctx.restore();
      }
    }
    var rr = Math.max(3.5, Math.min(8, (h - 28) / (Math.max.apply(null, sz) * 2.6)));
    for (l = 0; l < nl; l++) pos[l].forEach(function (q) { D.circle(ctx, q[0], q[1], rr, l === 0 ? C.paper : l === nl - 1 ? C.terracotaWash : C.cobaltoWash, C.ink, 1.3); });
    D.text(ctx, "entrada", colx(0), h - 6, { size: 10, align: "center", color: C.muted });
    D.text(ctx, "salida", colx(nl - 1), h - 6, { size: 10, align: "center", color: C.muted });
    if (nl > 2) D.text(ctx, S.layers + " capa" + (S.layers > 1 ? "s" : "") + " oculta" + (S.layers > 1 ? "s" : "") + " de " + S.width, w / 2, h - 6, { size: 10, align: "center", color: C.muted });
    else D.text(ctx, "sin capas ocultas: una sola neurona", w / 2, h - 6, { size: 10, align: "center", color: C.muted });
  }
  function drawLoss(ctx, w, h, C) {
    var H = S.hist, xmax = Math.max(100, H[H.length - 1][0]), ymax = Math.max(0.8, Math.min(2, Math.ceil(Math.max(H[0][1], H[0][2]) * 5) / 5));
    plotL.xr = [0, xmax]; plotL.yr = [0, ymax];
    plotL.axes(ctx); ctx.save(); plotL.clip(ctx);
    D.path(ctx, H.map(function (q) { return [plotL.x(q[0]), plotL.y(Math.min(q[2], ymax))]; }), C.terracota, 2, [5, 3]);
    D.path(ctx, H.map(function (q) { return [plotL.x(q[0]), plotL.y(Math.min(q[1], ymax))]; }), C.cobalto, 2.5);
    ctx.restore();
    D.line(ctx, plotL.box.x, 11, plotL.box.x + 22, 11, C.cobalto, 2.5);
    D.text(ctx, "pérdida train", plotL.box.x + 27, 15, { size: 11, color: C.cobaltoInk, weight: 600 });
    D.line(ctx, plotL.box.x + plotL.box.w * 0.55, 11, plotL.box.x + plotL.box.w * 0.55 + 22, 11, C.terracota, 2.5, [5, 3]);
    D.text(ctx, "test", plotL.box.x + plotL.box.w * 0.55 + 27, 15, { size: 11, color: C.terracotaInk, weight: 600 });
  }

  function updateText() {
    var np = net.p.length, ltr = evalLoss(train), lte = evalLoss(test), atr = evalAcc(train), ate = evalAcc(test), msg = "";
    var gap = atr - ate;
    if (S.step === 0) msg = "Pulsa «Entrenar». La red empieza con pesos al azar: la frontera no significa nada todavía.";
    else if (S.layers === 0 && S.data !== "moons" && ate < 0.8) msg = "Sin capas ocultas la red es UNA neurona (una regresión logística): solo sabe dibujar una recta. Añade capas ocultas.";
    else if (atr >= 0.9 && ate >= 0.9 && gap < 0.07) msg = "<span class='good'>La red ha aprendido el patrón y generaliza: acierta casi igual en train y en test.</span>";
    else if (atr >= 0.9 && gap >= 0.08) msg = "<span class='bad'>Sobreajuste: acierta mucho más en train que en test (está memorizando ruido).</span>";
    else if (atr < 0.85) msg = "Todavía no ha aprendido (acierto de train " + (atr * 100).toFixed(0) + " %): entrena más pasos, o prueba más neuronas / capas, otra activación o un learning rate distinto.";
    else msg = "Casi: sigue entrenando un poco más.";
    out.set("Paso <b>" + S.step + "</b> · parámetros: <b>" + np + "</b> · learning rate = <b>" + Math.pow(10, S.lrExp).toPrecision(2) + "</b><br>" +
      "Pérdida train = <b>" + ltr.toFixed(3) + "</b> · test = <b>" + lte.toFixed(3) + "</b> · acierto train = <b>" + (atr * 100).toFixed(0) + " %</b> · test = <b>" + (ate * 100).toFixed(0) + " %</b><br>" + msg);
  }
  function update() { updateText(); view.redraw(); viewN.redraw(); viewL.redraw(); }

  genData(); Xtr = toX(train); buildNet();
  view.draw(drawMap); viewN.draw(drawNet); viewL.draw(drawLoss); update();
  return { destroy: function () { stop(); } };
});
