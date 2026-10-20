/* Experimento: Ridge y Lasso. Trayectorias de los coeficientes al subir alpha, y error en train / test / validación cruzada.
   Ridge se calcula en forma cerrada; Lasso por descenso de coordenadas (misma función objetivo que scikit-learn). */
Lab.register("curso1/c1m5-regularizacion", function (root, api) {
  var M = api.math, D = api.d;
  var P = 10, NTR = 24, NTE = 300, SIGMA = 3, BETA = [3, -2, 1.5, 0, 0, 0, 0, 0, 0, 0];
  var RANGE = { ridge: [-2, 3], lasso: [-3, 1] }, STEPS = 60;
  var st = { mode: "lasso", idx: 28, seed: 37 };
  var data, cache = {};

  function gen() {
    var r = api.rng(st.seed * 101 + 7), i, j;
    function sample(n) {
      var X = [], y = [];
      for (i = 0; i < n; i++) {
        var f = r.normal(0, 1), row = [], t = 0;
        for (j = 0; j < P; j++) { var v = 0.6 * f + 0.8 * r.normal(0, 1); row.push(v); t += BETA[j] * v; }
        X.push(row); y.push(t + r.normal(0, SIGMA));
      }
      return { X: X, y: y };
    }
    data = { tr: sample(NTR), te: sample(NTE) };
    cache = {};
  }
  function standardize(X) {
    var mu = [], sd = [], j;
    for (j = 0; j < P; j++) { var col = X.map(function (r) { return r[j]; }); mu.push(M.mean(col)); sd.push(M.std(col) || 1); }
    return { mu: mu, sd: sd };
  }
  function applyS(X, s) { return X.map(function (r) { return r.map(function (v, j) { return (v - s.mu[j]) / s.sd[j]; }); }); }

  function fitRidge(X, y, a) {
    var n = X.length, A = [], b = [], i, j, k;
    for (i = 0; i < P; i++) { A.push(new Array(P).fill(0)); b.push(0); }
    for (k = 0; k < n; k++) for (i = 0; i < P; i++) { b[i] += X[k][i] * y[k]; for (j = 0; j < P; j++) A[i][j] += X[k][i] * X[k][j]; }
    for (i = 0; i < P; i++) A[i][i] += a;
    return M.solve(A, b);
  }
  function fitLasso(X, y, a) {
    var n = X.length, w = new Array(P).fill(0), res = y.slice(), it, j, k, z = [];
    for (j = 0; j < P; j++) { var s = 0; for (k = 0; k < n; k++) s += X[k][j] * X[k][j]; z.push(s / n); }
    for (it = 0; it < 400; it++) {
      var maxd = 0;
      for (j = 0; j < P; j++) {
        var rho = 0; for (k = 0; k < n; k++) rho += X[k][j] * (res[k] + w[j] * X[k][j]); rho /= n;
        var nw = rho > a ? (rho - a) / z[j] : rho < -a ? (rho + a) / z[j] : 0, dw = nw - w[j];
        if (dw !== 0) { for (k = 0; k < n; k++) res[k] -= dw * X[k][j]; w[j] = nw; maxd = Math.max(maxd, Math.abs(dw)); }
      }
      if (maxd < 1e-7) break;
    }
    return w;
  }
  function fit(mode, X, y, a) { return mode === "ridge" ? fitRidge(X, y, a) : fitLasso(X, y, a); }
  function mse(X, y, w, b0) {
    var s = 0; for (var k = 0; k < X.length; k++) { var p = b0; for (var j = 0; j < P; j++) p += X[k][j] * w[j]; s += (p - y[k]) * (p - y[k]); } return s / X.length;
  }
  function alphaAt(mode, i) { var R = RANGE[mode]; return Math.pow(10, R[0] + (R[1] - R[0]) * i / STEPS); }

  function compute(mode) {
    if (cache[mode]) return cache[mode];
    var tr = data.tr, te = data.te, sc = standardize(tr.X), Xs = applyS(tr.X, sc), Xt = applyS(te.X, sc), ym = M.mean(tr.y);
    var out = [], i, K = 5, fold = [];
    for (i = 0; i < NTR; i++) fold.push(i % K);
    for (i = 0; i <= STEPS; i++) {
      var a = alphaAt(mode, i), w = fit(mode, Xs, tr.y.map(function (v) { return v - ym; }), a);
      var cv = 0;
      for (var f = 0; f < K; f++) {
        var Xa = [], ya = [], Xb = [], yb = [];
        for (var k = 0; k < NTR; k++) (fold[k] === f ? (Xb.push(tr.X[k]), yb.push(tr.y[k])) : (Xa.push(tr.X[k]), ya.push(tr.y[k])));
        var s2 = standardize(Xa), m2 = M.mean(ya), w2 = fit(mode, applyS(Xa, s2), ya.map(function (v) { return v - m2; }), a);
        cv += mse(applyS(Xb, s2), yb, w2, m2);
      }
      out.push({ a: a, w: w, tr: mse(Xs, tr.y, w, ym), te: mse(Xt, te.y, w, ym), cv: cv / K });
    }
    cache[mode] = out; return out;
  }
  function argmin(arr, key) { var b = 0; arr.forEach(function (o, i) { if (o[key] < arr[b][key]) b = i; }); return b; }

  var vA = api.view(root, { aspect: 1.9, minH: 250, maxH: 400, label: "Trayectorias de los diez coeficientes del modelo al aumentar alpha" });
  var vB = api.view(root, { aspect: 2.7, minH: 180, maxH: 280, label: "Error de entrenamiento, de test y de validación cruzada según alpha" });
  var poA = { xr: [-3, 1], yr: [-6, 6], xticks: 4, yticks: 4, ylabel: "coeficiente", pad: { l: 46, r: 12, t: 14, b: 34 }, xfmt: fmtA };
  var poB = { xr: [-3, 1], yr: [0, 60], xticks: 4, yticks: 4, xlabel: "alpha (escala logarítmica)", ylabel: "error (MSE)", pad: { l: 46, r: 12, t: 12, b: 36 }, xfmt: fmtA };
  var pA = api.plot(vA, poA), pB = api.plot(vB, poB);
  function fmtA(v) { var a = Math.pow(10, v); return a >= 1 ? String(Math.round(a)) : String(+a.toFixed(3)); }
  var ui = api.controls(root), out = api.readout(root);
  var seg = ui.segmented({ label: "Penalización", options: [["ridge", "Ridge (L2)"], ["lasso", "Lasso (L1)"]], value: st.mode, onChange: function (v) { st.mode = v; update(); } });
  var sl = ui.slider({ label: "alpha (fuerza de la regularización)", min: 0, max: STEPS, step: 1, value: st.idx, fmt: function (v) { return fmtAlpha(alphaAt(st.mode, v)); }, onInput: function (v) { st.idx = v; update(); } });
  ui.button("Ir al alpha elegido por validación cruzada", function () { var res = compute(st.mode); st.idx = argmin(res, "cv"); sl.set(st.idx, true); update(); }, "primary");
  ui.button("Nuevos datos", function () { st.seed++; gen(); update(); });
  var C0 = api.colors();
  api.legend(root, [[C0.cobalto, "x1 (β = 3)"], [C0.terracota, "x2 (β = −2)"], [C0.oliva, "x3 (β = 1,5)"], [C0.muted, "x4 … x10 (ruido, β = 0)"]]);
  function fmtAlpha(a) { return a >= 100 ? a.toFixed(0) : a >= 1 ? a.toFixed(1) : a >= 0.1 ? a.toFixed(2) : a.toFixed(3); }

  function drawA(ctx, w, h, C) {
    var res = compute(st.mode), R = RANGE[st.mode], j, i, big = 1;
    res.forEach(function (o) { o.w.forEach(function (v) { big = Math.max(big, Math.abs(v)); }); });
    var top = Math.ceil(big * 1.1); poA.xr = R; pA.xr = R; pA.yr = [-top, top];
    pA.axes(ctx); ctx.save(); pA.clip(ctx);
    D.line(ctx, pA.x(R[0]), pA.y(0), pA.x(R[1]), pA.y(0), C.ink, 1);
    var cols = [C.cobalto, C.terracota, C.oliva];
    for (j = 0; j < 3; j++) D.line(ctx, pA.x(R[0]), pA.y(BETA[j]), pA.x(R[1]), pA.y(BETA[j]), cols[j], 1, [2, 4]);
    for (j = P - 1; j >= 0; j--) {
      var pts = res.map(function (o, i2) { return [pA.x(R[0] + (R[1] - R[0]) * i2 / STEPS), pA.y(o.w[j])]; });
      D.path(ctx, pts, j < 3 ? cols[j] : C.muted, j < 3 ? 2.8 : 1.3);
    }
    var sx = pA.x(R[0] + (R[1] - R[0]) * st.idx / STEPS);
    D.line(ctx, sx, pA.box.y, sx, pA.box.y + pA.box.h, C.ink, 1.8, [5, 3]);
    for (j = 0; j < P; j++) D.circle(ctx, sx, pA.y(res[st.idx].w[j]), j < 3 ? 4.5 : 3, j < 3 ? cols[j] : C.muted, C.paper, 1);
    ctx.restore();
    var left = st.idx < STEPS * 0.55;
    D.text(ctx, "alpha = " + fmtAlpha(res[st.idx].a), sx + (left ? 8 : -8), pA.box.y + 14, { size: 11.5, weight: 700, align: left ? "left" : "right", color: C.ink });
  }
  function drawB(ctx, w, h, C) {
    var res = compute(st.mode), R = RANGE[st.mode], i, tmax = 0;
    res.forEach(function (o) { tmax = Math.max(tmax, o.te, o.cv); });
    var floor = SIGMA * SIGMA, yt = Math.min(Math.ceil(Math.min(tmax, floor * 5) / 20) * 20, 80);
    pB.xr = R; pB.yr = [0, yt]; pB.axes(ctx); ctx.save(); pB.clip(ctx);
    function xi(i2) { return pB.x(R[0] + (R[1] - R[0]) * i2 / STEPS); }
    D.line(ctx, pB.x(R[0]), pB.y(floor), pB.x(R[1]), pB.y(floor), C.muted, 1.3, [3, 4]);
    D.path(ctx, res.map(function (o, i2) { return [xi(i2), pB.y(o.tr)]; }), C.cobalto, 2.5);
    D.path(ctx, res.map(function (o, i2) { return [xi(i2), pB.y(o.cv)]; }), C.oliva, 2.2, [6, 3]);
    D.path(ctx, res.map(function (o, i2) { return [xi(i2), pB.y(o.te)]; }), C.terracota, 2.8);
    var bt = argmin(res, "te"), bc = argmin(res, "cv");
    D.circle(ctx, xi(bt), pB.y(res[bt].te), 5.5, C.terracota, C.ink, 1.8);
    D.circle(ctx, xi(bc), pB.y(res[bc].cv), 5.5, C.oliva, C.ink, 1.8);
    var sx = xi(st.idx); D.line(ctx, sx, pB.box.y, sx, pB.box.y + pB.box.h, C.ink, 1.8, [5, 3]);
    ctx.restore();
    D.text(ctx, "train", pB.box.x + 6, pB.box.y + pB.box.h - 8, { size: 10.5, weight: 600, color: C.cobaltoInk });
    D.text(ctx, "test", pB.box.x + 46, pB.box.y + pB.box.h - 8, { size: 10.5, weight: 600, color: C.terracotaInk });
    D.text(ctx, "validación cruzada", pB.box.x + 80, pB.box.y + pB.box.h - 8, { size: 10.5, weight: 600, color: C.olivaInk });
    D.text(ctx, (w < 520 ? "ruido = " : "ruido irreducible = ") + floor, pB.box.x + pB.box.w - 6, pB.y(floor) - 5, { size: 10, align: "right", color: C.muted });
  }
  function update() {
    var res = compute(st.mode), o = res[st.idx], nz = o.w.filter(function (v) { return Math.abs(v) > 1e-9; }).length;
    var noiseZero = o.w.slice(3).filter(function (v) { return Math.abs(v) <= 1e-9; }).length;
    var bt = argmin(res, "te"), bc = argmin(res, "cv");
    vA.redraw(); vB.redraw();
    out.set(st.mode.toUpperCase() + " · alpha = <b>" + fmtAlpha(o.a) + "</b> · coeficientes distintos de cero: <b>" + nz + "</b> de 10" + (st.mode === "lasso" ? " (ruido a cero: <b>" + noiseZero + "</b> de 7)" : " (Ridge nunca llega a 0 exacto)") + "<br>" +
      "error train = <b>" + o.tr.toFixed(2) + "</b> · error test = <b>" + o.te.toFixed(2) + "</b> · error validación cruzada (solo con train) = <b>" + o.cv.toFixed(2) + "</b><br>" +
      "alpha elegido por validación cruzada = <b>" + fmtAlpha(res[bc].a) + "</b> (test <b>" + res[bc].te.toFixed(2) + "</b>) · el mejor mirando el test habría sido " + fmtAlpha(res[bt].a) + " (test " + res[bt].te.toFixed(2) + ", no se puede usar de verdad: sería data snooping)");
  }
  gen(); vA.draw(drawA); vB.draw(drawB); update();
});
