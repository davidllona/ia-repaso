/* Experimento: la escala de los pesos iniciales decide qué le pasa a la señal capa a capa (solo forward, con datos y pesos reales).
   x ~ N(0, 1) con 100 valores; cada capa es Linear(100, 100) con pesos N(0, σ²) y bias 0. */
Lab.register("curso5/c5m2-init-varianza", function (root, api) {
  var D = api.d, C0 = api.colors(), N = 100, B = 120, LMAX = 20;
  var S = { act: "tanh", sigma: 0.1, depth: 10 };
  var r = api.rng(11), X0 = new Float64Array(B * N), Z = [], i, l;
  for (i = 0; i < B * N; i++) X0[i] = r.normal(0, 1);
  for (l = 0; l < LMAX; l++) { var z = new Float64Array(N * N); for (i = 0; i < N * N; i++) z[i] = r.normal(0, 1); Z.push(z); }
  var PRE = { small: ["N(0; 0,01)", 0.01], big: ["N(0; 1)", 1], torch: ["Por defecto de nn.Linear", 1 / Math.sqrt(3 * N)], xavier: ["Xavier", Math.sqrt(2 / (2 * N))], he: ["He", Math.sqrt(2 / N)] };

  function run() {
    var a = X0, res = { std: [], layers: [] }, k, s, j;
    for (l = 0; l < S.depth; l++) {
      var nx = new Float64Array(B * N), W = Z[l], sg = S.sigma;
      for (s = 0; s < B; s++) for (j = 0; j < N; j++) {
        var sum = 0, base = j * N, off = s * N;
        for (k = 0; k < N; k++) sum += W[base + k] * a[off + k];
        sum *= sg; nx[off + j] = S.act === "tanh" ? Math.tanh(sum) : (sum > 0 ? sum : 0);
      }
      a = nx;
      var m = 0, v = 0; for (k = 0; k < a.length; k++) m += a[k]; m /= a.length; for (k = 0; k < a.length; k++) v += (a[k] - m) * (a[k] - m); v /= a.length;
      res.std.push(Math.sqrt(v)); res.layers.push(a);
    }
    return res;
  }

  var vA = api.view(root, { aspect: 2.2, minH: 210, maxH: 300, label: "Desviación típica de las activaciones en cada capa, en escala logarítmica" });
  var po = { xr: [0.5, 20.5], yr: [-12, 12], xticks: 1, yticks: 6, xlabel: "capa", pad: { l: 50, r: 10, t: 12, b: 36 }, xfmt: function () { return ""; }, yfmt: function (v) { return "1e" + Math.round(v); } };
  var pA = api.plot(vA, po);
  var vH = api.view(root, { aspect: 3.0, minH: 150, maxH: 210, label: "Histogramas de las activaciones en la primera capa, en una capa intermedia y en la última" });
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.72rem, 2.7vw, .84rem)";
  ui.select({ label: "Activación", value: S.act, options: [["tanh", "tanh"], ["relu", "ReLU"]], onChange: function (v) { S.act = v; update(); } });
  var sl = ui.slider({ label: "Desviación σ de los pesos (escala log)", min: -2, max: 0.5, step: 0.01, value: Math.log10(S.sigma), fmt: function (v) { return Math.pow(10, v).toFixed(3); }, onInput: function (v) { S.sigma = Math.pow(10, v); update(); } });
  ui.slider({ label: "Capas", min: 1, max: LMAX, step: 1, value: S.depth, onInput: function (v) { S.depth = v; update(); } });
  Object.keys(PRE).forEach(function (k) { ui.button(PRE[k][0], function () { S.sigma = PRE[k][1]; sl.set(Math.log10(S.sigma), true); update(); }); });
  var R;

  function drawA(ctx, w, h, C) {
    pA.xr = [0.5, S.depth + 0.5];
    var fac = S.sigma * Math.sqrt(N) / (S.act === "relu" ? Math.SQRT2 : 1), s1 = R.std[0], pts = [], i;
    var lg = R.std.map(function (v) { return Math.log10(Math.max(1e-300, v)); }), lt = [];
    for (i = 0; i < S.depth; i++) lt.push(Math.log10(Math.max(1e-300, s1 * Math.pow(fac, i))));
    var lo = Math.floor(Math.min(Math.min.apply(null, lg), 0)) - 1, hi = Math.ceil(Math.max(Math.max.apply(null, lg), 0)) + 1;
    lo = Math.max(lo, -40); hi = Math.min(hi, 40);
    if (hi - lo < 4) { hi += 2; lo -= 2; }
    var stp = (hi - lo) > 24 ? 8 : (hi - lo) > 12 ? 4 : (hi - lo) > 6 ? 2 : 1;
    lo = stp * Math.floor(lo / stp); hi = stp * Math.ceil(hi / stp);
    pA.yr = [lo, hi]; po.yticks = (hi - lo) / stp;
    pA.axes(ctx); ctx.save(); pA.clip(ctx);
    var th = []; for (i = 0; i < S.depth; i++) th.push([pA.x(i + 1), pA.y(Math.max(lo - 5, Math.min(hi + 5, lt[i])))]);
    D.path(ctx, th, C.terracota, 1.6, [5, 4]);
    for (i = 0; i < S.depth; i++) pts.push([pA.x(i + 1), pA.y(lg[i])]);
    D.path(ctx, pts, C.cobalto, 2.6);
    pts.forEach(function (p) { D.circle(ctx, p[0], p[1], 3.2, C.cobalto, C.paper, 1); });
    D.line(ctx, pA.box.x, pA.y(0), pA.box.x + pA.box.w, pA.y(0), C.muted, 1, [2, 3]);
    ctx.restore();
    var step = S.depth > 12 ? 2 : 1;
    for (i = 1; i <= S.depth; i += step) D.text(ctx, String(i), pA.x(i), pA.box.y + pA.box.h + 14, { size: 11, mono: true, align: "center", color: C.muted });
    D.text(ctx, "medida", pA.box.x + 8, pA.box.y + 14, { size: 11, color: C.cobaltoInk, weight: 600 });
    D.text(ctx, "cuenta lineal: σ·√n" + (S.act === "relu" ? "/√2" : "") + " por capa", pA.box.x + 62, pA.box.y + 14, { size: 11, color: C.terracotaInk, weight: 600 });
  }
  function drawH(ctx, w, h, C) {
    var idx = [0, Math.floor((S.depth - 1) / 2), S.depth - 1], names = ["capa 1", "capa " + (idx[1] + 1), "capa " + S.depth];
    if (S.depth === 1) { idx = [0]; names = ["capa 1"]; }
    var pw = w / idx.length, k, b;
    idx.forEach(function (li, p) {
      var a = R.layers[li], lo = S.act === "tanh" ? -1 : 0, hi = S.act === "tanh" ? 1 : Math.max(1e-12, Math.max.apply(null, Array.prototype.slice.call(a.subarray(0, Math.min(a.length, 4000)))));
      var nb = 20, cnt = new Array(nb).fill(0), sat = 0;
      for (k = 0; k < a.length; k++) { var bi = Math.min(nb - 1, Math.max(0, Math.floor((a[k] - lo) / (hi - lo) * nb))); cnt[bi]++; if (S.act === "tanh" && Math.abs(a[k]) > 0.99) sat++; }
      var mx = Math.max.apply(null, cnt), x0 = p * pw + 8, bw = pw - 16, y0 = h - 34, hh = h - 56;
      D.line(ctx, x0, y0, x0 + bw, y0, C.ink2, 1.2);
      for (b = 0; b < nb; b++) { var bh = hh * cnt[b] / mx; D.rect(ctx, x0 + bw * b / nb + 0.5, y0 - bh, bw / nb - 1, bh, S.act === "tanh" && (b === 0 || b === nb - 1) && cnt[b] / a.length > 0.2 ? C.terracota : C.cobalto, null); }
      D.text(ctx, names[p], x0 + bw / 2, 14, { size: 11.5, align: "center", weight: 600, color: C.ink2 });
      D.text(ctx, S.act === "tanh" ? "−1" : "0", x0, y0 + 13, { size: 10.5, mono: true, color: C.muted });
      D.text(ctx, S.act === "tanh" ? "1" : (hi < 100 ? hi.toFixed(1) : hi.toExponential(0)), x0 + bw, y0 + 13, { size: 10.5, mono: true, color: C.muted, align: "right" });
      D.text(ctx, S.act === "tanh" ? "|h|>0,99: " + (100 * sat / a.length).toFixed(0) + " %" : "std " + R.std[li].toExponential(1), x0 + bw / 2, y0 + 27, { size: 10.5, mono: true, color: C.ink2, align: "center" });
    });
  }
  function sci(v) { if (v === 0) return "0"; var e = v.toExponential(1).split("e"); return e[0] + "·10<sup>" + String(parseInt(e[1], 10)).replace("-", "−") + "</sup>"; }
  function update() {
    R = run(); vA.draw(drawA); vH.draw(drawH);
    var fac = S.sigma * Math.sqrt(N) / (S.act === "relu" ? Math.SQRT2 : 1), last = R.std[R.std.length - 1], v;
    if (last < 1e-3) v = "<span class='bad'>La señal se APAGA: tras " + S.depth + " capas la desviación es " + sci(last) + ". Las capas finales casi no reciben información de la entrada.</span>";
    else if (last > 1e3 || (S.act === "tanh" && S.sigma > 0.5)) v = "<span class='bad'>" + (S.act === "tanh" ? "Las tanh se SATURAN (casi todas valen ±1): su derivada es ≈ 0 y no hay gradiente." : "La señal EXPLOTA: desviación " + sci(last) + " en la última capa.") + "</span>";
    else v = "<span class='good'>La señal conserva su escala de capa a capa (desviación " + last.toFixed(2) + " al final).</span>";
    out.set("σ = <b>" + S.sigma.toFixed(3) + "</b> · factor teórico por capa σ·√n" + (S.act === "relu" ? "/√2" : "") + " = <b>" + fac.toFixed(3) + "</b> · desviación en la capa 1: <b>" + R.std[0].toFixed(3) + "</b>, en la última: <b>" + sci(last) + "</b><br>" + v);
  }
  update();
});
