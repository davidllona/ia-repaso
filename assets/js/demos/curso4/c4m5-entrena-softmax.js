/* Experimento: una regresión softmax (UNA sola capa lineal: K×2 pesos + K sesgos) entrenada de verdad con SGD y
   entropía cruzada, en 2D. Se ve la pérdida bajar desde ln K, el efecto de lr y del tamaño de lote, y el límite:
   las fronteras de una sola capa son rectas, así que con anillos concéntricos no basta. */
Lab.register("curso4/c4m5-entrena-softmax", function (root, api) {
  var D = api.d, M = api.math, HM = 1.8, GRID = 36, MAXEP = 400;
  var S = { data: "blobs3", lrExp: -0.7, batch: "16", dseed: 3, wseed: 1, ep: 0, run: false, K: 3 };
  var net, Xtr, Ytr, Xte, Yte, hist = [];
  function rgb(h) {
    h = (h || "#888").trim();
    if (h.charAt(0) === "#") { if (h.length === 4) h = "#" + h[1] + h[1] + h[2] + h[2] + h[3] + h[3]; return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
    var m = h.match(/\d+/g); return m ? [+m[0], +m[1], +m[2]] : [128, 128, 128];
  }
  function gen() {
    var r = api.rng(S.dseed * 37 + 11), X = [], Y = [], K, c, i, n = 60, a, rad;
    if (S.data === "blobs3") { K = 3; for (c = 0; c < K; c++) for (i = 0; i < n; i++) { a = (90 + 120 * c) * Math.PI / 180; X.push([0.95 * Math.cos(a) + r.normal(0, 0.55), 0.95 * Math.sin(a) + r.normal(0, 0.55)]); Y.push(c); } }
    else if (S.data === "blobs4") { K = 4; var cx = [[-0.8, 0.8], [0.8, 0.8], [-0.8, -0.8], [0.8, -0.8]]; for (c = 0; c < K; c++) for (i = 0; i < n; i++) { X.push([cx[c][0] + r.normal(0, 0.45), cx[c][1] + r.normal(0, 0.45)]); Y.push(c); } }
    else { K = 3; var rr = [0.3, 0.95, 1.55]; for (c = 0; c < K; c++) for (i = 0; i < n; i++) { a = r.range(0, 6.2832); rad = rr[c] + r.normal(0, 0.1); X.push([rad * Math.cos(a), rad * Math.sin(a)]); Y.push(c); } }
    var idx = X.map(function (_, q) { return q; }); api.rng(S.dseed + 5).shuffle(idx);
    Xtr = []; Ytr = []; Xte = []; Yte = [];
    idx.forEach(function (q, t) { if (t % 4 === 3) { Xte.push(X[q]); Yte.push(Y[q]); } else { Xtr.push(X[q]); Ytr.push(Y[q]); } });
    S.K = K;
  }
  function initNet() {
    var r = api.rng(S.wseed * 101 + 9), a = 1 / Math.sqrt(2), k;
    net = { W: [], b: [] };
    for (k = 0; k < S.K; k++) { net.W.push([r.range(-a, a), r.range(-a, a)]); net.b.push(r.range(-a, a)); }
  }
  function fwd(x) { var z = [], k; for (k = 0; k < S.K; k++) z.push(net.W[k][0] * x[0] + net.W[k][1] * x[1] + net.b[k]); return M.softmax(z); }
  function evalSet(X, Y) {
    var L = 0, ok = 0, i, p, k, best;
    for (i = 0; i < X.length; i++) { p = fwd(X[i]); L -= Math.log(Math.max(1e-12, p[Y[i]])); best = 0; for (k = 1; k < S.K; k++) if (p[k] > p[best]) best = k; if (best === Y[i]) ok++; }
    return { loss: L / X.length, acc: ok / X.length };
  }
  var order = [];
  function epoch() {
    var N = Xtr.length, B = S.batch === "all" ? N : +S.batch, lr = Math.pow(10, S.lrExp), i, s, k;
    order = Xtr.map(function (_, q) { return q; }); api.rng(S.wseed * 1000 + S.ep).shuffle(order);
    for (s = 0; s < N; s += B) {
      var gW = [], gb = []; for (k = 0; k < S.K; k++) { gW.push([0, 0]); gb.push(0); }
      var m = Math.min(B, N - s);
      for (i = s; i < s + m; i++) {
        var x = Xtr[order[i]], y = Ytr[order[i]], p = fwd(x);
        for (k = 0; k < S.K; k++) { var d = p[k] - (k === y ? 1 : 0); gW[k][0] += d * x[0]; gW[k][1] += d * x[1]; gb[k] += d; }
      }
      for (k = 0; k < S.K; k++) { net.W[k][0] -= lr * gW[k][0] / m; net.W[k][1] -= lr * gW[k][1] / m; net.b[k] -= lr * gb[k] / m; }
    }
    S.ep++; hist.push([S.ep, evalSet(Xtr, Ytr).loss]);
  }
  function build() { stop(); S.ep = 0; initNet(); hist = [[0, evalSet(Xtr, Ytr).loss]]; update(); }
  var row = api.el("div", { class: "lab-row" }), colA = api.el("div"), colB = api.el("div");
  row.appendChild(colA); row.appendChild(colB); root.appendChild(row);
  var view = api.view(colA, { aspect: 1.0, minH: 240, maxH: 400, label: "Mapa del género que predice la regresión softmax con los tráilers de entrenamiento y de test (dos rasgos por tráiler)" });
  var plot = api.plot(view, { xr: [-HM, HM], yr: [-HM, HM], xticks: 4, yticks: 4, pad: { l: 30, r: 12, t: 8, b: 22 }, xfmt: function (v) { return +v.toFixed(1); }, yfmt: function (v) { return +v.toFixed(1); } });
  var viewL = api.view(colB, { aspect: 1.0, minH: 240, maxH: 400, label: "Curva de la pérdida de entrenamiento por época" });
  var optL = { xr: [0, 40], yr: [0, 1.5], xticks: 4, yticks: 3, xlabel: "épocas", pad: { l: 40, r: 12, t: 24, b: 36 }, xfmt: function (v) { return Math.round(v); } };
  var plotL = api.plot(viewL, optL);
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.68rem, 2.5vw, .8rem)";
  ui.select({ label: "Catálogo de tráilers", value: S.data, options: [["blobs3", "Tres géneros (tres grupos)"], ["blobs4", "Cuatro géneros (cuatro grupos)"], ["rings", "Tres géneros mezclados en anillos"]], onChange: function (v) { S.data = v; gen(); build(); } });
  ui.select({ label: "Tamaño del lote (batch)", value: S.batch, options: [["1", "1 muestra (SGD puro)"], ["16", "16 muestras (mini-batch)"], ["all", "todas (batch completo)"]], onChange: function (v) { S.batch = v; update(); } });
  ui.slider({ label: "tasa de aprendizaje lr", min: -2, max: 1, step: 0.05, value: S.lrExp, fmt: function (v) { return Math.pow(10, v).toFixed(2); }, onInput: function (v) { S.lrExp = v; update(); } });
  var btn = ui.button("▶ Entrenar", function () {
    if (S.run) { stop(); return; }
    if (api.reduceMotion) { for (var i = 0; i < 60 && S.ep < MAXEP; i++) epoch(); update(); return; }
    S.run = true; btn.textContent = "❚❚ Pausa"; loop.start();
  }, "primary");
  ui.button("+10 épocas", function () { stop(); for (var i = 0; i < 10 && S.ep < MAXEP; i++) epoch(); update(); });
  ui.button("Pesos nuevos", function () { S.wseed++; build(); });
  ui.button("Otros tráilers", function () { S.dseed++; gen(); build(); });
  api.legend(root, [[api.colors().cobalto, "acción (clase 0)"], [api.colors().terracota, "comedia (clase 1)"], [api.colors().oliva, "terror (clase 2)"], [api.colors().marker, "animación (clase 3, solo con 4 géneros)"]]);
  var loop = api.loop(function () { var n = S.batch === "all" ? 4 : 1; for (var i = 0; i < n && S.ep < MAXEP; i++) epoch(); update(); if (S.ep >= MAXEP) { stop(); return false; } }, { fps: 24 });
  function stop() { S.run = false; if (loop) loop.stop(); btn.textContent = "▶ Entrenar"; }
  function cls(C) { return [C.cobalto, C.terracota, C.oliva, C.marker]; }
  var off = document.createElement("canvas"), octx = off.getContext("2d");
  view.draw(function (ctx, w, h, C) {
    if (!net) return;
    plot.axes(ctx);
    var b = plot.box, cs = cls(C).map(rgb), N = GRID, i, j, k;
    off.width = N; off.height = N; var img = octx.createImageData(N, N);
    for (j = 0; j < N; j++) for (i = 0; i < N; i++) {
      var p = fwd([-HM + 2 * HM * (i + 0.5) / N, HM - 2 * HM * (j + 0.5) / N]), q = 4 * (j * N + i), r = 0, g = 0, bl = 0;
      for (k = 0; k < S.K; k++) { r += p[k] * cs[k][0]; g += p[k] * cs[k][1]; bl += p[k] * cs[k][2]; }
      img.data[q] = r; img.data[q + 1] = g; img.data[q + 2] = bl; img.data[q + 3] = 255;
    }
    octx.putImageData(img, 0, 0);
    ctx.save(); plot.clip(ctx); ctx.globalAlpha = 0.5; ctx.imageSmoothingEnabled = true; ctx.drawImage(off, b.x, b.y, b.w, b.h); ctx.globalAlpha = 1;
    var cl = cls(C);
    Xte.forEach(function (p, q) { D.circle(ctx, plot.x(p[0]), plot.y(p[1]), 3.6, null, cl[Yte[q]], 1.8); });
    Xtr.forEach(function (p, q) { D.circle(ctx, plot.x(p[0]), plot.y(p[1]), 3.6, cl[Ytr[q]], C.paper, 1.1); });
    ctx.restore();
  });
  viewL.draw(function (ctx, w, h, C) {
    if (!hist.length) return;
    var xmax = Math.max(40, Math.ceil(hist[hist.length - 1][0] / 40) * 40), lnK = Math.log(S.K), ymax = Math.ceil(lnK * 1.1 * 2) / 2;
    plotL.xr = [0, xmax]; plotL.yr = [0, ymax]; optL.yticks = Math.round(ymax * 2); plotL.axes(ctx); ctx.save(); plotL.clip(ctx);
    D.path(ctx, hist.map(function (q) { return [plotL.x(q[0]), plotL.y(Math.min(q[1], ymax))]; }), C.cobalto, 2.6);
    D.line(ctx, plotL.box.x, plotL.y(lnK), plotL.box.x + plotL.box.w, plotL.y(lnK), C.terracota, 1.4, [5, 3]);
    ctx.restore();
    D.text(ctx, "pérdida (línea de puntos: ln " + S.K + " = " + lnK.toFixed(3) + ", adivinar)", plotL.box.x, 14, { size: 10, weight: 600, color: C.cobaltoInk });
  });
  function update() {
    var a = evalSet(Xtr, Ytr), b = evalSet(Xte, Yte), N = Xtr.length, B = S.batch === "all" ? N : +S.batch, per = Math.ceil(N / B);
    out.set("Época <b>" + S.ep + "</b> · actualizaciones de pesos = " + S.ep + " × " + per + " = <b>" + (S.ep * per) + "</b> · parámetros = " + S.K + "·2 + " + S.K + " = <b>" + (S.K * 3) + "</b><br>" +
      "pérdida (train) = <b>" + a.loss.toFixed(3) + "</b> · acierto train = <b>" + (a.acc * 100).toFixed(0) + " %</b> · test = <b>" + (b.acc * 100).toFixed(0) + " %</b> · lr = " + Math.pow(10, S.lrExp).toFixed(2) +
      (S.data === "rings" && a.acc < 0.7 ? "<br><span class='bad'>Con los géneros mezclados en anillos una sola capa lineal no puede: las fronteras son rectas.</span>" : ""));
    view.redraw(); viewL.redraw();
  }
  gen(); build();
  return { destroy: function () { stop(); } };
});
