/* Experimento: vanishing / exploding gradient. Una red de N capas ocultas (12 neuronas cada una), pesos al azar y UN backpropagation real:
   se mide el tamaño del gradiente de los pesos de cada capa. Escala logarítmica. */
Lab.register("curso2/c2m1-desvanece", function (root, api) {
  var M = api.math, D = api.d, C0 = api.colors();
  var WID = 12, NIN = 6, BATCH = 24;
  var S = { depth: 10, act: "sigmoid", init: "xavier", seed: 5, res: null };

  var ACT = {
    sigmoid: { f: function (z) { return 1 / (1 + Math.exp(-z)); }, d: function (z, a) { return a * (1 - a); }, name: "Sigmoide" },
    tanh: { f: Math.tanh, d: function (z, a) { return 1 - a * a; }, name: "tanh" },
    relu: { f: function (z) { return z > 0 ? z : 0; }, d: function (z) { return z > 0 ? 1 : 0; }, name: "ReLU" },
    leaky: { f: function (z) { return z > 0 ? z : 0.1 * z; }, d: function (z) { return z > 0 ? 1 : 0.1; }, name: "Leaky ReLU" }
  };
  var INIT = { small: "Pequeños (σ = 0,1)", xavier: "Xavier / Glorot", he: "He", big: "Grandes (σ = 1)" };

  function stdFor(nin, nout) {
    if (S.init === "small") return 0.1; if (S.init === "big") return 1;
    if (S.init === "he") return Math.sqrt(2 / nin); return Math.sqrt(2 / (nin + nout));
  }
  function matmul(A, B) {
    var n = A.length, m = B.length, p = B[0].length, R = [], i, j, k;
    for (i = 0; i < n; i++) { var row = new Array(p).fill(0); for (k = 0; k < m; k++) { var a = A[i][k]; if (a !== 0) for (j = 0; j < p; j++) row[j] += a * B[k][j]; } R.push(row); }
    return R;
  }
  function T(A) { var R = [], i, j; for (j = 0; j < A[0].length; j++) { var r = []; for (i = 0; i < A.length; i++) r.push(A[i][j]); R.push(r); } return R; }
  function fro(A) { var s = 0; A.forEach(function (r) { r.forEach(function (v) { s += v * v; }); }); return Math.sqrt(s); }

  function compute() {
    var r = api.rng(S.seed), L = S.depth + 1, sizes = [NIN], i, j, k;
    for (i = 0; i < S.depth; i++) sizes.push(WID); sizes.push(1);
    var Ws = [];
    for (i = 0; i < L; i++) { var sd = stdFor(sizes[i], sizes[i + 1]), W = []; for (j = 0; j < sizes[i]; j++) { var row = []; for (k = 0; k < sizes[i + 1]; k++) row.push(r.normal(0, sd)); W.push(row); } Ws.push(W); }
    var X = [], tg = []; for (i = 0; i < BATCH; i++) { var x = []; for (j = 0; j < NIN; j++) x.push(r.normal(0, 1)); X.push(x); tg.push([r.normal(0, 1)]); }
    var A = ACT[S.act], as = [X], zs = [], ds = [];
    for (i = 0; i < L; i++) {
      var z = matmul(as[i], Ws[i]);
      if (i === L - 1) { as.push(z); zs.push(z); ds.push(z.map(function (rw) { return rw.map(function () { return 1; }); })); }
      else { var a = z.map(function (rw) { return rw.map(A.f); }); as.push(a); zs.push(z); ds.push(z.map(function (rw, ii) { return rw.map(function (zv, jj) { return A.d(zv, a[ii][jj]); }); })); }
    }
    var out = as[L], loss = 0; out.forEach(function (rw, ii) { loss += 0.5 * Math.pow(rw[0] - tg[ii][0], 2); }); loss /= BATCH;
    var delta = out.map(function (rw, ii) { return [(rw[0] - tg[ii][0]) / BATCH]; });
    var norms = new Array(L);
    for (i = L - 1; i >= 0; i--) {
      norms[i] = fro(matmul(T(as[i]), delta));
      if (i > 0) { var back = matmul(delta, T(Ws[i])); delta = back.map(function (rw, ii) { return rw.map(function (v, jj) { return v * ds[i - 1][ii][jj]; }); }); }
    }
    return { norms: norms, loss: loss, out: out };
  }

  var view = api.view(root, { aspect: 2.1, minH: 250, maxH: 380, label: "Tamaño del gradiente en cada capa de la red, en escala logarítmica" });
  var po = { xr: [0.5, 11.5], yr: [-8, 2], xticks: 1, yticks: 5, xlabel: "capa (1 = junto a la entrada · última = la salida)", ylabel: "tamaño del gradiente", pad: { l: 52, r: 12, t: 14, b: 40 },
    xfmt: function () { return ""; }, yfmt: function (v) { return "1e" + Math.round(v); } };
  var plot = api.plot(view, po);
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.72rem, 2.7vw, .84rem)";
  ui.slider({ label: "Capas ocultas (profundidad)", min: 2, max: 30, step: 1, value: S.depth, fmt: function (v) { return v; }, onInput: function (v) { S.depth = v; update(); } });
  ui.select({ label: "Activación", value: S.act, options: Object.keys(ACT).map(function (k) { return [k, ACT[k].name]; }), onChange: function (v) { S.act = v; update(); } });
  ui.select({ label: "Inicialización de los pesos", value: S.init, options: Object.keys(INIT).map(function (k) { return [k, INIT[k]]; }), onChange: function (v) { S.init = v; update(); } });
  ui.button("Nueva red (otra semilla)", function () { S.seed += 3; update(); });
  api.legend(root, [[C0.terracota, "se desvanece (< 1 % del gradiente de la salida)"], [C0.cobalto, "tamaño razonable"], [C0.marker, "explota (> 1000)"]]);

  function draw(ctx, w, h, C) {
    var R = S.res, n = R.norms.length, lg = R.norms.map(function (v) { return Math.log10(Math.max(v, 1e-300)); });
    var lo = Math.floor(Math.min.apply(null, lg)) - 1, hi = Math.ceil(Math.max.apply(null, lg)) + 1;
    if (hi - lo < 6) { var m = (hi + lo) / 2; lo = Math.floor(m - 3); hi = lo + 6; }
    var span = hi - lo, step = span > 20 ? 5 : span > 10 ? 2 : 1;
    lo = step * Math.floor(lo / step); hi = lo + step * Math.ceil((hi - lo) / step);
    plot.xr = [0.5, n + 0.5]; plot.yr = [lo, hi]; po.yticks = (hi - lo) / step;
    plot.axes(ctx); ctx.save(); plot.clip(ctx);
    var last = R.norms[n - 1], bw = Math.max(3, Math.min(26, plot.box.w / n * 0.72));
    R.norms.forEach(function (v, i) {
      var col = v < last * 0.01 ? C.terracota : (v > 1000 ? C.marker : C.cobalto), y0 = plot.y(lo), y1 = plot.y(Math.max(lg[i], lo));
      D.rect(ctx, plot.x(i + 1) - bw / 2, y1, bw, y0 - y1, col, C.ink, 1);
    });
    ctx.restore();
    var every = n > 20 ? 5 : n > 11 ? 2 : 1;
    for (var i = 1; i <= n; i++) if (i === 1 || i === n || (i % every === 0 && n - i >= every / 2 + 0.5)) D.text(ctx, String(i), plot.x(i), plot.box.y + plot.box.h + 14, { size: 11, mono: true, align: "center", color: C.muted });
  }

  function sci(v) { if (v === 0) return "0"; var e = v.toExponential(1).split("e"); return e[0] + "·10<sup>" + String(parseInt(e[1], 10)).replace("-", "−") + "</sup>"; }
  function update() {
    S.res = compute();
    var R = S.res, n = R.norms.length, first = R.norms[0], last = R.norms[n - 1], ratio = first / last;
    var verdict;
    if (!isFinite(first) || first > 1e6) verdict = "<span class='bad'>Los gradientes EXPLOTAN: los pesos darían saltos enormes y el entrenamiento se rompería (NaN).</span>";
    else if (ratio < 0.01) verdict = "<span class='bad'>Gradiente DESVANECIDO: la primera capa recibe " + sci(ratio) + " veces el gradiente de la última. Casi no aprende.</span>";
    else if (ratio > 100) verdict = "<span class='bad'>El gradiente CRECE hacia la entrada: la primera capa recibe " + ratio.toFixed(0) + " veces el de la última. Empieza a explotar.</span>";
    else verdict = "<span class='good'>Gradientes en un rango razonable: la primera capa recibe " + (ratio >= 1 ? ratio.toFixed(1) + " veces el gradiente de la última" : (ratio * 100).toFixed(ratio < 0.1 ? 1 : 0) + " % del gradiente de la última") + ", así que la red puede aprender.</span>";
    out.set(
      "Capa 1: <b>" + first.toExponential(2) + "</b> · última capa: <b>" + last.toExponential(2) + "</b> · cociente capa 1 / última = <b>" + ratio.toExponential(1) + "</b><br>" +
      verdict + "<br>" +
      "Referencia (sigmoide en cadena): 0,25<sup>" + S.depth + "</sup> = " + sci(Math.pow(0.25, S.depth)) + " (el máximo de σ′ es 0,25)."
    );
    view.redraw();
  }
  S.res = compute(); view.draw(draw); update();
});
