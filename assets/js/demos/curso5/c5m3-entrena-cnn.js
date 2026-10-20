/* Experimento: una CNN diminuta y una red densa se entrenan A LA VEZ, en tu navegador, con SGD y retropropagación escritas a mano,
   para distinguir tres trazos (horizontal, vertical, diagonal) en imágenes de 7x7 con ruido.
   Se pueden entrenar con el trazo siempre en el centro o en cualquier sitio, y se prueban con el trazo centrado y con el trazo desplazado. */
(function () {
  var N = 7, NCLS = 3, F = 4;

  function rngMake(seed) {
    var a = seed >>> 0;
    function next() { a |= 0; a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
    var spare = null;
    return {
      next: next,
      int: function (lo, hi) { return Math.floor(lo + (hi - lo + 1) * next()); },
      normal: function (mu, sg) {
        var z; if (spare !== null) { z = spare; spare = null; } else { var u, v, s; do { u = next() * 2 - 1; v = next() * 2 - 1; s = u * u + v * v; } while (s >= 1 || s === 0); var f = Math.sqrt(-2 * Math.log(s) / s); spare = v * f; z = u * f; }
        return mu + sg * z;
      },
      shuffle: function (arr) { for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(next() * (i + 1)), t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; }
    };
  }

  /* imagen 7x7 aplanada (49) con el trazo `cls` en el cuadro 3x3 de origen (r0, c0) */
  function makeImage(cls, r0, c0, rng, noise) {
    var x = new Array(N * N), i;
    for (i = 0; i < N * N; i++) x[i] = rng.normal(0, noise);
    var cells = cls === 0 ? [[1, 0], [1, 1], [1, 2]] : cls === 1 ? [[0, 1], [1, 1], [2, 1]] : [[0, 0], [1, 1], [2, 2]];
    cells.forEach(function (c) { x[(r0 + c[0]) * N + (c0 + c[1])] += 1; });
    return x;
  }
  function makeSet(n, where, rng, noise) {
    var X = [], Y = [], i;
    for (i = 0; i < n; i++) {
      var cls = i % NCLS, r0, c0;
      if (where === "center") { r0 = 2; c0 = 2; }
      else if (where === "any") { r0 = rng.int(0, 4); c0 = rng.int(0, 4); }
      else { do { r0 = rng.int(0, 4); c0 = rng.int(0, 4); } while (r0 === 2 && c0 === 2); }
      X.push(makeImage(cls, r0, c0, rng, noise)); Y.push(cls);
    }
    return { X: X, Y: Y };
  }

  function softmaxCE(logits, y) {
    var m = Math.max.apply(null, logits), e = logits.map(function (v) { return Math.exp(v - m); }), s = e.reduce(function (a, b) { return a + b; }, 0);
    var p = e.map(function (v) { return v / s; });
    return { p: p, loss: -Math.log(Math.max(p[y], 1e-12)) };
  }

  /* ---------- CNN: conv F filtros 3x3 -> ReLU -> max global -> lineal ---------- */
  function cnnInit(rng) {
    var m = { W: [], b: [], V: [], c: [] }, f, k, a;
    for (f = 0; f < F; f++) { m.W.push([]); for (a = 0; a < 9; a++) m.W[f].push(rng.normal(0, 0.4)); m.b.push(0); }
    for (k = 0; k < NCLS; k++) { m.V.push([]); for (f = 0; f < F; f++) m.V[k].push(rng.normal(0, 0.5)); m.c.push(0); }
    return m;
  }
  function cnnForward(m, x) {
    var P = N - 2, z = [], pooled = [], arg = [], f, i, j, a, b;
    for (f = 0; f < F; f++) {
      var best = -Infinity, bi = 0, bj = 0;
      for (i = 0; i < P; i++) for (j = 0; j < P; j++) {
        var s = m.b[f];
        for (a = 0; a < 3; a++) for (b = 0; b < 3; b++) s += m.W[f][a * 3 + b] * x[(i + a) * N + j + b];
        if (s > best) { best = s; bi = i; bj = j; }
      }
      var r = Math.max(0, best);
      pooled.push(r); arg.push([bi, bj, best > 0]);
    }
    var logits = [], k;
    for (k = 0; k < NCLS; k++) { var s2 = m.c[k]; for (f = 0; f < F; f++) s2 += m.V[k][f] * pooled[f]; logits.push(s2); }
    return { logits: logits, pooled: pooled, arg: arg };
  }
  function cnnStep(m, batch, lr) {
    var g = { W: m.W.map(function (w) { return w.map(function () { return 0; }); }, 0), b: m.b.map(function () { return 0; }), V: m.V.map(function (v) { return v.map(function () { return 0; }); }), c: m.c.map(function () { return 0; }) };
    var total = 0, f, k, a, b;
    batch.forEach(function (s) {
      var fw = cnnForward(m, s.x), ce = softmaxCE(fw.logits, s.y); total += ce.loss;
      var dl = ce.p.slice(); dl[s.y] -= 1;
      for (k = 0; k < NCLS; k++) { g.c[k] += dl[k]; for (f = 0; f < F; f++) g.V[k][f] += dl[k] * fw.pooled[f]; }
      for (f = 0; f < F; f++) {
        var dp = 0; for (k = 0; k < NCLS; k++) dp += m.V[k][f] * dl[k];
        if (fw.arg[f][2]) {
          g.b[f] += dp;
          for (a = 0; a < 3; a++) for (b = 0; b < 3; b++) g.W[f][a * 3 + b] += dp * s.x[(fw.arg[f][0] + a) * N + fw.arg[f][1] + b];
        }
      }
    });
    var n = batch.length;
    for (f = 0; f < F; f++) { m.b[f] -= lr * g.b[f] / n; for (a = 0; a < 9; a++) m.W[f][a] -= lr * g.W[f][a] / n; }
    for (k = 0; k < NCLS; k++) { m.c[k] -= lr * g.c[k] / n; for (f = 0; f < F; f++) m.V[k][f] -= lr * g.V[k][f] / n; }
    return total / n;
  }
  function cnnLogits(m, x) { return cnnForward(m, x).logits; }

  /* ---------- Densa: 49 -> H ReLU -> 3 ---------- */
  var HID = 16;
  function denseInit(rng) {
    var m = { W1: [], b1: [], W2: [], b2: [] }, h, i, k;
    for (h = 0; h < HID; h++) { m.W1.push([]); for (i = 0; i < N * N; i++) m.W1[h].push(rng.normal(0, 0.2)); m.b1.push(0); }
    for (k = 0; k < NCLS; k++) { m.W2.push([]); for (h = 0; h < HID; h++) m.W2[k].push(rng.normal(0, 0.4)); m.b2.push(0); }
    return m;
  }
  function denseForward(m, x) {
    var h1 = [], h, i, k, logits = [];
    for (h = 0; h < HID; h++) { var s = m.b1[h]; for (i = 0; i < N * N; i++) s += m.W1[h][i] * x[i]; h1.push(Math.max(0, s)); }
    for (k = 0; k < NCLS; k++) { var s2 = m.b2[k]; for (h = 0; h < HID; h++) s2 += m.W2[k][h] * h1[h]; logits.push(s2); }
    return { h1: h1, logits: logits };
  }
  function denseStep(m, batch, lr) {
    var gW1 = m.W1.map(function (w) { return w.map(function () { return 0; }); }), gb1 = m.b1.map(function () { return 0; }), gW2 = m.W2.map(function (w) { return w.map(function () { return 0; }); }), gb2 = m.b2.map(function () { return 0; });
    var total = 0, h, i, k;
    batch.forEach(function (s) {
      var fw = denseForward(m, s.x), ce = softmaxCE(fw.logits, s.y); total += ce.loss;
      var dl = ce.p.slice(); dl[s.y] -= 1;
      for (k = 0; k < NCLS; k++) { gb2[k] += dl[k]; for (h = 0; h < HID; h++) gW2[k][h] += dl[k] * fw.h1[h]; }
      for (h = 0; h < HID; h++) {
        var dh = 0; for (k = 0; k < NCLS; k++) dh += m.W2[k][h] * dl[k];
        if (fw.h1[h] > 0) { gb1[h] += dh; for (i = 0; i < N * N; i++) gW1[h][i] += dh * s.x[i]; }
      }
    });
    var n = batch.length;
    for (h = 0; h < HID; h++) { m.b1[h] -= lr * gb1[h] / n; for (i = 0; i < N * N; i++) m.W1[h][i] -= lr * gW1[h][i] / n; }
    for (k = 0; k < NCLS; k++) { m.b2[k] -= lr * gb2[k] / n; for (h = 0; h < HID; h++) m.W2[k][h] -= lr * gW2[k][h] / n; }
    return total / n;
  }
  function denseLogits(m, x) { return denseForward(m, x).logits; }

  function accuracy(logitsFn, m, set) {
    var ok = 0;
    set.X.forEach(function (x, i) { var l = logitsFn(m, x), bi = 0; for (var k = 1; k < NCLS; k++) if (l[k] > l[bi]) bi = k; if (bi === set.Y[i]) ok++; });
    return ok / set.X.length;
  }
  var core = { rngMake: rngMake, makeSet: makeSet, cnnInit: cnnInit, cnnStep: cnnStep, cnnLogits: cnnLogits, denseInit: denseInit, denseStep: denseStep, denseLogits: denseLogits, accuracy: accuracy, F: F, HID: HID };
  if (typeof module !== "undefined" && module.exports) module.exports = core;
  if (typeof Lab === "undefined") return;

  Lab.register("curso5/c5m3-entrena-cnn", function (root, api) {
    var D = api.d, C0 = api.colors();
    var S = { where: "center", lr: 0.1, epoch: 0, remaining: 0, seed: 1 };
    var cm, dm, train, tc, ts, hist, shuf, examples;
    function init() {
      train = makeSet(150, S.where, rngMake(S.seed + 100), 0.2);
      tc = makeSet(150, "center", rngMake(7), 0.2); ts = makeSet(300, "shift", rngMake(8), 0.2);
      cm = cnnInit(rngMake(S.seed + 1)); dm = denseInit(rngMake(S.seed + 2)); shuf = rngMake(S.seed + 3);
      S.epoch = 0; hist = { c: [], d: [], acc: null };
      var er = rngMake(21); examples = [makeImage(0, 2, 2, er, 0.2), makeImage(1, 2, 2, er, 0.2), makeImage(2, 2, 2, er, 0.2), makeImage(0, 0, 4, er, 0.2), makeImage(1, 4, 0, er, 0.2), makeImage(2, 3, 3, er, 0.2)];
      measure();
    }
    function measure() {
      hist.acc = { cc: accuracy(cnnLogits, cm, tc), cs: accuracy(cnnLogits, cm, ts), dc: accuracy(denseLogits, dm, tc), ds: accuracy(denseLogits, dm, ts) };
    }
    function epoch() {
      var data = train.X.map(function (x, i) { return { x: x, y: train.Y[i] }; }), idx = shuf.shuffle(data.map(function (_, i) { return i; })), a = 0, b = 0, n = 0, s;
      for (s = 0; s < idx.length; s += 10) { var bt = idx.slice(s, s + 10).map(function (i) { return data[i]; }); a += cnnStep(cm, bt, S.lr) * bt.length; b += denseStep(dm, bt, S.lr) * bt.length; n += bt.length; }
      hist.c.push(a / n); hist.d.push(b / n); S.epoch++; measure();
    }
    function fmt2(x) { return x.toFixed(2); }
    function pct(x) { return Math.round(100 * x) + " %"; }

    var vLoss = api.view(root, { aspect: 2.3, minH: 190, maxH: 270, label: "Pérdida de entrenamiento de la CNN y de la red densa según las épocas" });
    api.legend(root, [[C0.cobalto, "CNN (55 parámetros)"], [C0.terracota, "red densa (851 parámetros)"]]);
    var vBars = api.view(root, { aspect: 2.3, minH: 190, maxH: 250, label: "Acierto de cada modelo con el trazo centrado y con el trazo desplazado" });
    var vFil = api.view(root, { aspect: 2.1, minH: 200, maxH: 280, label: "Filtros aprendidos por la CNN y ejemplos de imágenes de prueba" });
    var ui = api.controls(root), out = api.readout(root);
    ui.segmented({ label: "Entrenar con el trazo…", value: S.where, options: [["center", "siempre en el centro"], ["any", "en cualquier sitio"]], onChange: function (v) { S.where = v; stop(); init(); pretrain(); update(); } });
    ui.segmented({ label: "learning rate", value: S.lr, options: [[0.03, "0,03"], [0.1, "0,1"], [0.3, "0,3"]], onChange: function (v) { S.lr = +v; } });
    var loop = api.loop(function () { if (S.remaining <= 0) return false; epoch(); S.remaining--; update(); return S.remaining > 0; }, { fps: 14 });
    function stop() { loop.stop(); S.remaining = 0; }
    ui.button("Entrenar 20 épocas ▶", function () { if (api.reduceMotion) { for (var i = 0; i < 20; i++) epoch(); update(); } else { S.remaining += 20; loop.start(); } }, "primary");
    ui.button("Reiniciar pesos (época 0)", function () { stop(); init(); update(); });
    ui.button("Otra semilla", function () { stop(); S.seed += 11; init(); pretrain(); update(); });
    function pretrain() { for (var i = 0; i < 30; i++) epoch(); }

    function drawLoss(ctx, w, h, C) {
      var mx = Math.max(20, S.epoch), p = api.plot(vLoss, { xr: [0, mx], yr: [0, 1.2], xticks: 5, yticks: 4, xlabel: "época", ylabel: "pérdida", yfmt: function (t) { return t.toFixed(1); }, pad: { l: 46, r: 12, t: 10, b: 36 } });
      p.axes(ctx); ctx.save(); p.clip(ctx);
      [[hist.c, C.cobalto], [hist.d, C.terracota]].forEach(function (pair) {
        var pts = [[p.x(0), p.y(1.0986)]]; pair[0].forEach(function (v, i) { pts.push([p.x(i + 1), p.y(Math.min(1.2, v))]); });
        D.path(ctx, pts, pair[1], 2.5);
      });
      ctx.restore();
    }
    function drawBars(ctx, w, h, C) {
      var A = hist.acc, top = 40, bot = h - 40, bh = bot - top, groups = [["CNN", [A.cc, A.cs], C.cobalto], ["Densa", [A.dc, A.ds], C.terracota]], gw = (w - 40) / 2, i, j;
      D.text(ctx, "acierto con 450 imágenes de prueba que el modelo no ha visto", w / 2, 13, { size: 11, align: "center", weight: 600, color: C.ink2 });
      D.line(ctx, 20, bot - bh / 3, w - 20, bot - bh / 3, C.line, 1, [4, 4]);
      D.text(ctx, "azar 33 %", w / 2, bot - bh / 3 - 4, { size: 9.5, align: "center", color: C.muted });
      groups.forEach(function (g, gi) {
        var x0 = 20 + gi * gw, bw = Math.min(46, gw / 3.2);
        for (j = 0; j < 2; j++) {
          var x = x0 + gw / 2 - bw - 4 + j * (bw + 8), v = g[1][j], hh = bh * v;
          D.rect(ctx, x, bot - hh, bw, hh, g[2], null);
          if (j === 1) { ctx.save(); ctx.globalAlpha = 0.45; D.rect(ctx, x, bot - hh, bw, hh, C.paper, null); ctx.restore(); }
          D.text(ctx, pct(v), x + bw / 2, bot - hh - 4, { size: 11, mono: true, weight: 700, align: "center", color: C.ink });
          D.text(ctx, j === 0 ? "centrado" : "desplazado", x + bw / 2, bot + 14, { size: 10, align: "center", color: C.ink2 });
        }
        D.text(ctx, g[0], x0 + gw / 2, bot + 30, { size: 11.5, align: "center", weight: 700, color: C.ink });
      });
    }
    function heat(ctx, x, y, s, vals, n, scale, C) {
      var i, j;
      for (i = 0; i < n; i++) for (j = 0; j < n; j++) {
        var v = vals[i * n + j] / scale; ctx.save(); ctx.globalAlpha = Math.min(1, Math.abs(v)); D.rect(ctx, x + j * s, y + i * s, s, s, v >= 0 ? C.cobalto : C.terracota, null); ctx.restore();
        D.rect(ctx, x + j * s, y + i * s, s, s, null, C.line, 0.5);
      }
      D.rect(ctx, x, y, n * s, n * s, null, C.ink, 1);
    }
    function drawFil(ctx, w, h, C) {
      var f, cs = Math.min(16, (w - 40) / (F * 3 + (F - 1) * 1.2 + 0.1)), gapF = cs * 1.2, tot = F * 3 * cs + (F - 1) * gapF, x0 = (w - tot) / 2, mx = 0.01;
      cm.W.forEach(function (wf) { wf.forEach(function (v) { mx = Math.max(mx, Math.abs(v)); }); });
      D.text(ctx, "filtros 3×3 de la CNN (azul +, naranja −)", w / 2, 13, { size: 11, align: "center", weight: 600, color: C.ink2 });
      for (f = 0; f < F; f++) { heat(ctx, x0 + f * (3 * cs + gapF), 22, cs, cm.W[f], 3, mx, C); D.text(ctx, "f" + f, x0 + f * (3 * cs + gapF) + 1.5 * cs, 22 + 3 * cs + 12, { size: 10, align: "center", mono: true, color: C.muted }); }
      var es = Math.min(12, (w - 40) / (6 * 7 + 5 * 1.3)), eg = es * 1.3, et = 6 * 7 * es + 5 * eg, ex = (w - et) / 2, ey = 22 + 3 * cs + 52, k;
      D.text(ctx, "imágenes de prueba: 3 centradas y 3 desplazadas", w / 2, ey - 8, { size: 11, align: "center", weight: 600, color: C.ink2 });
      for (k = 0; k < 6; k++) heat(ctx, ex + k * (7 * es + eg), ey, es, examples[k].map(function (v) { return Math.max(0, Math.min(1, v)); }), 7, 1, C);
    }
    init(); pretrain();
    vLoss.draw(drawLoss); vBars.draw(drawBars); vFil.draw(drawFil);

    function update() {
      var A = hist.acc, nc = hist.c.length;
      vLoss.redraw(); vBars.redraw(); vFil.redraw();
      out.set("Época <b>" + S.epoch + "</b> · entrenando con el trazo " + (S.where === "center" ? "<b>siempre en el centro</b>" : "<b>en cualquier sitio</b>") + " (150 imágenes, minilotes de 10, SGD con lr = " + S.lr + ")<br>" +
        "pérdida: CNN <b>" + (nc ? fmt2(hist.c[nc - 1]) : "—") + "</b> · densa <b>" + (nc ? fmt2(hist.d[nc - 1]) : "—") + "</b><br>" +
        "acierto con el trazo centrado: CNN <b>" + pct(A.cc) + "</b>, densa <b>" + pct(A.dc) + "</b> · con el trazo desplazado: CNN <b>" + pct(A.cs) + "</b>, densa <b>" + pct(A.ds) + "</b>");
    }
    update();
    return { destroy: function () { loop.stop(); } };
  });
})();
