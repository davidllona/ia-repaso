/* Experimento: PCA (una recta) frente a un autoencoder no lineal con cuello de botella de 1 número, sobre datos que forman un arco. */
Lab.register("curso2/c2m5-pca-vs-ae", function (root, api) {
  /* ---- Mini red densa con Adam (solo para esta demo) ---- */
  function makeMLP(sizes, acts, rng, lr) {
    var L = sizes.length - 1, W = [], B = [], gW = [], gB = [], mW = [], vW = [], mB = [], vB = [], A = [], t = 0, l;
    for (l = 0; l < L; l++) {
      var nin = sizes[l], nout = sizes[l + 1], s = Math.sqrt(2 / (nin + nout)), w = new Float64Array(nin * nout), i;
      for (i = 0; i < w.length; i++) w[i] = rng.normal(0, s);
      W.push(w); B.push(new Float64Array(nout));
      gW.push(new Float64Array(nin * nout)); gB.push(new Float64Array(nout));
      mW.push(new Float64Array(nin * nout)); vW.push(new Float64Array(nin * nout));
      mB.push(new Float64Array(nout)); vB.push(new Float64Array(nout));
    }
    for (l = 0; l <= L; l++) A.push(new Float64Array(sizes[l]));
    function act(a, z) { return a === "relu" ? (z > 0 ? z : 0) : a === "tanh" ? Math.tanh(z) : a === "sigmoid" ? 1 / (1 + Math.exp(-z)) : z; }
    function dact(a, y) { return a === "relu" ? (y > 0 ? 1 : 0) : a === "tanh" ? 1 - y * y : a === "sigmoid" ? y * (1 - y) : 1; }
    function fwd(x) {
      var i, j, l2;
      for (i = 0; i < x.length; i++) A[0][i] = x[i];
      for (l2 = 0; l2 < L; l2++) {
        var nin2 = sizes[l2], nout2 = sizes[l2 + 1], w2 = W[l2], a = A[l2], o = A[l2 + 1];
        for (j = 0; j < nout2; j++) {
          var z = B[l2][j], base = j * nin2;
          for (i = 0; i < nin2; i++) z += w2[base + i] * a[i];
          o[j] = act(acts[l2], z);
        }
      }
      return A[L];
    }
    var net = {
      W: W, B: B, A: A, nParams: 0, lr: lr,
      predict: function (x) { return Array.prototype.slice.call(fwd(x)); },
      layer: function (x, k) { fwd(x); return Array.prototype.slice.call(A[k]); },
      /* un paso de Adam con el lote idx; devuelve el error medio (MSE) del lote */
      step: function (X, Y, idx, opt) {
        opt = opt || {}; var bce = !!opt.bce, nfz = opt.freeze || 0;
        var l3, i, j, s, tot = 0, n = idx.length;
        for (l3 = 0; l3 < L; l3++) { gW[l3].fill(0); gB[l3].fill(0); }
        for (s = 0; s < n; s++) {
          var out = fwd(X[idx[s]]), y = Y[idx[s]], nout = sizes[L], d = new Float64Array(nout);
          for (j = 0; j < nout; j++) {
            var e = out[j] - y[j];
            if (bce) { tot += -(y[j] * Math.log(Math.max(out[j], 1e-7)) + (1 - y[j]) * Math.log(Math.max(1 - out[j], 1e-7))) / nout; d[j] = e / nout; }
            else { tot += e * e / nout; d[j] = 2 * e / nout * dact(acts[L - 1], out[j]); }
          }
          for (l3 = L - 1; l3 >= 0; l3--) {
            var nin3 = sizes[l3], no3 = sizes[l3 + 1], a3 = A[l3], w3 = W[l3], dp = l3 > 0 ? new Float64Array(nin3) : null;
            for (j = 0; j < no3; j++) {
              var dj = d[j], b3 = j * nin3; gB[l3][j] += dj;
              for (i = 0; i < nin3; i++) { gW[l3][b3 + i] += dj * a3[i]; if (dp) dp[i] += w3[b3 + i] * dj; }
            }
            if (dp) { for (i = 0; i < nin3; i++) dp[i] *= dact(acts[l3 - 1], a3[i]); d = dp; }
          }
        }
        t++;
        var b1 = 0.9, b2 = 0.999, c1 = 1 - Math.pow(b1, t), c2 = 1 - Math.pow(b2, t);
        for (l3 = nfz; l3 < L; l3++) {
          var arrs = [[W[l3], gW[l3], mW[l3], vW[l3]], [B[l3], gB[l3], mB[l3], vB[l3]]];
          for (var q = 0; q < 2; q++) {
            var p = arrs[q][0], g = arrs[q][1], m = arrs[q][2], v = arrs[q][3];
            for (i = 0; i < p.length; i++) {
              var gi = g[i] / n; m[i] = b1 * m[i] + (1 - b1) * gi; v[i] = b2 * v[i] + (1 - b2) * gi * gi;
              p[i] -= net.lr * (m[i] / c1) / (Math.sqrt(v[i] / c2) + 1e-8);
            }
          }
        }
        return tot / n;
      }
    };
    for (l = 0; l < L; l++) net.nParams += sizes[l] * sizes[l + 1] + sizes[l + 1];
    return net;
  }
  var N = 110, rg = api.rng(4), pts = [], i, mode = "pca", net, steps = 0, loop, MAXS = 2400;
  for (i = 0; i < N; i++) { var a = rg.range(-1.4, 1.4); pts.push([Math.sin(a) + rg.normal(0, 0.03), Math.cos(a) - 0.35 + rg.normal(0, 0.03)]); }
  /* PCA de 2 dimensiones: componente principal exacta */
  var mx = api.math.mean(pts.map(function (p) { return p[0]; })), my = api.math.mean(pts.map(function (p) { return p[1]; })), sxx = 0, syy = 0, sxy = 0;
  pts.forEach(function (p) { sxx += (p[0] - mx) * (p[0] - mx) / N; syy += (p[1] - my) * (p[1] - my) / N; sxy += (p[0] - mx) * (p[1] - my) / N; });
  var th = 0.5 * Math.atan2(2 * sxy, sxx - syy), ux = Math.cos(th), uy = Math.sin(th);
  function pcaRec(p) { var z = (p[0] - mx) * ux + (p[1] - my) * uy; return [mx + z * ux, my + z * uy]; }
  function init() {
    if (loop) loop.stop();
    net = makeMLP([2, 12, 1, 12, 2], ["tanh", "linear", "tanh", "linear"], api.rng(2), 0.02); steps = 0;
  }
  function aeRec(p) { return net.predict(p); }
  function decode(z) {
    var h = [], j, o = [0, 0];
    for (j = 0; j < 12; j++) h.push(Math.tanh(net.W[2][j] * z + net.B[2][j]));
    for (var q = 0; q < 2; q++) { o[q] = net.B[3][q]; for (j = 0; j < 12; j++) o[q] += net.W[3][q * 12 + j] * h[j]; }
    return o;
  }
  function mse() { var e = 0, f = mode === "pca" ? pcaRec : aeRec; pts.forEach(function (p) { var r = f(p); e += ((r[0] - p[0]) * (r[0] - p[0]) + (r[1] - p[1]) * (r[1] - p[1])) / 2; }); return e / N; }
  var idx = pts.map(function (_, q) { return q; });
  var btn;
  loop = api.loop(function () { for (var q = 0; q < 25 && steps < MAXS; q++) { net.step(pts, pts, idx); steps++; } update(); return steps < MAXS; },
    { fps: 30, onState: function (s) { if (btn) btn.textContent = s ? "Entrenando…" : "Entrenar el autoencoder"; } });
  init();
  var view = api.view(root, { aspect: 1.35, minH: 280, maxH: 460, label: "Puntos en un arco, su reconstrucción con PCA o con un autoencoder" });
  var P = api.plot(view, { xr: [-1.5, 1.5], yr: [-0.5, 1.0], xticks: 6, yticks: 3 });
  api.legend(root, [[api.colors().cobalto, "datos originales"], [api.colors().terracota, "reconstrucción (todo cae sobre la curva)"]]);
  var ui = api.controls(root), out = api.readout(root);
  ui.segmented({ label: "Modelo", options: [["pca", "PCA (recta, lineal)"], ["ae", "Autoencoder (no lineal)"]], value: mode, onChange: function (v) { mode = v; update(); } });
  btn = ui.button("Entrenar el autoencoder", function () { mode = "ae"; segSet(); if (steps >= MAXS) init(); if (api.reduceMotion) { while (steps < MAXS) { net.step(pts, pts, idx); steps++; } update(); } else loop.start(); }, "primary");
  function segSet() { var b = ui.el.querySelectorAll(".seg button"); b[0].setAttribute("aria-pressed", "false"); b[1].setAttribute("aria-pressed", "true"); }
  view.draw(function (ctx, w, h, C) {
    P.axes(ctx); P.clip(ctx);
    var f = mode === "pca" ? pcaRec : aeRec, line = [], z;
    if (mode === "pca") { line = [[P.x(mx - 2 * ux), P.y(my - 2 * uy)], [P.x(mx + 2 * ux), P.y(my + 2 * uy)]]; }
    else { var zs = pts.map(function (p) { return net.layer(p, 2)[0]; }), z0 = Math.min.apply(null, zs), z1 = Math.max.apply(null, zs); for (z = 0; z <= 60; z++) { var q = decode(z0 + (z1 - z0) * z / 60); line.push([P.x(q[0]), P.y(q[1])]); } }
    api.d.path(ctx, line, C.terracota, 2.5);
    pts.forEach(function (p) { var r = f(p); api.d.line(ctx, P.x(p[0]), P.y(p[1]), P.x(r[0]), P.y(r[1]), C.line, 1); });
    pts.forEach(function (p) { api.d.circle(ctx, P.x(p[0]), P.y(p[1]), 3.2, C.cobalto); });
    pts.forEach(function (p) { var r = f(p); api.d.circle(ctx, P.x(r[0]), P.y(r[1]), 2.4, C.terracota); });
    ctx.restore && 0;
  });
  function update() {
    view.redraw();
    var e = mse(), pe = 0; pts.forEach(function (p) { var r = pcaRec(p); pe += ((r[0] - p[0]) * (r[0] - p[0]) + (r[1] - p[1]) * (r[1] - p[1])) / 2; }); pe /= N;
    out.set("Cuello de botella: <b>1 número</b> por punto (de 2 a 1). " + (mode === "pca" ? "PCA: cada punto se proyecta a la recta." : "Autoencoder: pasos de entrenamiento = <b>" + steps + "</b>.") + "<br>" +
      "Error (MSE) del modelo mostrado: <b>" + e.toFixed(4).replace(".", ",") + "</b> · PCA: <b>" + pe.toFixed(4).replace(".", ",") + "</b>" +
      (mode === "ae" && steps > 0 ? " · el autoencoder " + (e < pe ? "<span class='good'>mejora a PCA " + (pe / e).toFixed(1).replace(".", ",") + " veces</span>" : "<span class='bad'>aún no supera a PCA</span>") : ""));
  }
  update();
  return { destroy: function () { loop.stop(); } };
});
