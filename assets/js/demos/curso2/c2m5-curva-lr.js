/* Experimento: fine-tuning con distintos learning rates frente a congelar la base. Juguete: una red pequeña "preentrenada" en una tarea A y adaptada a una tarea B con 30 puntos. */
Lab.register("curso2/c2m5-curva-lr", function (root, api) {
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
  var LRS = [0.001, 0.003, 0.01, 0.03, 0.1, 0.3, 1], li = 3, STEPS = 150;
  var r = api.rng(1), i;
  function lab(p, ang) { var u = p[0] * Math.cos(ang) + p[1] * Math.sin(ang), v = -p[0] * Math.sin(ang) + p[1] * Math.cos(ang); return v > 0.4 * Math.sin(2.5 * u) ? 1 : 0; }
  function pts(n, ang) { var X = [], Y = [], q; for (q = 0; q < n; q++) { var p = [r.range(-1.5, 1.5), r.range(-1.5, 1.5)]; X.push(p); Y.push([lab(p, ang)]); } return [X, Y]; }
  var A = pts(400, 0), B = pts(30, 0.25), V = pts(300, 0.25);
  var pre = makeMLP([2, 10, 1], ["tanh", "sigmoid"], api.rng(7), 0.03), idxA = A[0].map(function (_, q) { return q; }), sh = api.rng(3);
  for (i = 0; i < 250; i++) { sh.shuffle(idxA); for (var b = 0; b < 400; b += 40) pre.step(A[0], A[1], idxA.slice(b, b + 40)); }
  function ev(net, D) {
    var l = 0, c = 0; D[0].forEach(function (x, q) { var o = net.predict(x)[0], y = D[1][q][0]; l += -(y * Math.log(Math.max(o, 1e-7)) + (1 - y) * Math.log(Math.max(1 - o, 1e-7))); c += ((o > 0.5 ? 1 : 0) === y) ? 1 : 0; });
    return [l / D[0].length, c / D[0].length];
  }
  function run(freeze, lr) {
    var net = makeMLP([2, 10, 1], ["tanh", "sigmoid"], api.rng(9), lr), idx = B[0].map(function (_, q) { return q; }), vl = [], tl = [], s;
    net.W[0].set(pre.W[0]); net.B[0].set(pre.B[0]);
    vl.push(ev(net, V)[0]); tl.push(ev(net, B)[0]);
    for (s = 0; s < STEPS; s++) { net.step(B[0], B[1], idx, { bce: true, freeze: freeze }); vl.push(ev(net, V)[0]); tl.push(ev(net, B)[0]); }
    var drift = 0; for (s = 0; s < pre.W[0].length; s++) drift += Math.pow(net.W[0][s] - pre.W[0][s], 2);
    return { v: vl, t: tl, acc: ev(net, V)[1], drift: Math.sqrt(drift) };
  }
  var frozen = run(1, 0.05), ft = run(0, LRS[li]);
  var view = api.view(root, { aspect: 1.6, minH: 260, maxH: 400, label: "Error en validación durante el entrenamiento: base congelada o fine-tuning" });
  var P = api.plot(view, { xr: [0, STEPS], yr: [0, 1], xticks: 5, yticks: 5, xlabel: "pasos de entrenamiento", ylabel: "error (binary crossentropy)", pad: { l: 52 } });
  api.legend(root, [[api.colors().oliva, "validación · base congelada (el crítico no cambia)"], [api.colors().terracota, "validación · fine-tuning (el crítico se retoca)"], [api.colors().muted, "entrenamiento · fine-tuning (discontinua)"]]);
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Learning rate del fine-tuning", min: 0, max: LRS.length - 1, step: 1, value: li, fmt: function (v) { return String(LRS[v]).replace(".", ","); }, onInput: function (v) { li = v; update(); } });
  function drawC(ctx, arr, col, w, dash) { api.d.path(ctx, arr.map(function (v, s) { return [P.x(s), P.y(Math.min(v, 1.04))]; }), col, w, dash); }
  view.draw(function (ctx, w, h, C) {
    P.axes(ctx); P.clip(ctx);
    drawC(ctx, frozen.v, C.oliva, 2.5); drawC(ctx, ft.t, C.muted, 1.8, [5, 4]); drawC(ctx, ft.v, C.terracota, 2.5);
  });
  function f2(v) { return v.toFixed(2).replace(".", ","); }
  function update() {
    ft = run(0, LRS[li]); view.redraw();
    out.set("Con la base congelada: error final <b>" + f2(frozen.v[STEPS]) + "</b> · acierto <b>" + Math.round(100 * frozen.acc) + " %</b> · la base no se mueve (deriva 0)<br>" +
      "Fine-tuning con lr = <b>" + String(LRS[li]).replace(".", ",") + "</b>: error en validación <span class='" + (ft.v[STEPS] <= frozen.v[STEPS] * 1.2 ? "good" : "bad") + "'><b>" + f2(ft.v[STEPS]) + "</b></span> · error en entrenamiento <b>" + f2(ft.t[STEPS]) + "</b> · acierto <b>" + Math.round(100 * ft.acc) + " %</b><br>" +
      "Cuánto se ha alejado la base de lo preentrenado (distancia entre pesos): <b>" + f2(ft.drift) + "</b>");
  }
  update();
});
