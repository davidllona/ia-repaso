/* Experimento: regresión múltiple en vivo (w1, w2, b) y el efecto de la escala de las variables. */
Lab.register("curso4/c4m3-multiple", function (root, api) {
  var n = 60, r = api.rng(8), F = [], Y = [], i, mode = "igual", lr = 0.1, w, b1, k, hist, status, loop, wopt, lossOpt, step0 = 0;
  var x1 = [], x2 = [];
  for (i = 0; i < n; i++) { x1.push(r.normal(0, 1)); x2.push(r.normal(0, 1)); }
  for (i = 0; i < n; i++) Y.push(1 + 2 * x1[i] - 3 * x2[i] + r.normal(0, 0.1));
  function stdz(a) { var m = api.math.mean(a), s = api.math.std(a); return a.map(function (v) { return (v - m) / s; }); }
  function build() {
    if (mode === "igual") F = x1.map(function (v, i) { return [v, x2[i]]; });
    else if (mode === "x10") F = x1.map(function (v, i) { return [v, 10 * x2[i]]; });
    else { var a = stdz(x1), c = stdz(x2.map(function (v) { return 10 * v; })); F = a.map(function (v, i) { return [v, c[i]]; }); }
  }
  function loss(p) { var s = 0, i; for (i = 0; i < n; i++) { var e = p[0] * F[i][0] + p[1] * F[i][1] + p[2] - Y[i]; s += e * e; } return s / n; }
  function grad(p) { var g = [0, 0, 0], i; for (i = 0; i < n; i++) { var e = p[0] * F[i][0] + p[1] * F[i][1] + p[2] - Y[i]; g[0] += 2 * e * F[i][0] / n; g[1] += 2 * e * F[i][1] / n; g[2] += 2 * e / n; } return g; }
  function optimum() {
    var A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], v = [0, 0, 0], i, p, q;
    for (i = 0; i < n; i++) { var f = [F[i][0], F[i][1], 1]; for (p = 0; p < 3; p++) { v[p] += f[p] * Y[i]; for (q = 0; q < 3; q++) A[p][q] += f[p] * f[q]; } }
    return api.math.solve(A, v);
  }
  function lamMax() {
    var H = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], i, p, q, v = [1, 1, 1], it, lam = 0;
    for (i = 0; i < n; i++) { var f = [F[i][0], F[i][1], 1]; for (p = 0; p < 3; p++) for (q = 0; q < 3; q++) H[p][q] += 2 * f[p] * f[q] / n; }
    for (it = 0; it < 60; it++) { var u = [0, 0, 0]; for (p = 0; p < 3; p++) for (q = 0; q < 3; q++) u[p] += H[p][q] * v[q]; lam = Math.sqrt(u[0] * u[0] + u[1] * u[1] + u[2] * u[2]); v = u.map(function (t) { return t / lam; }); }
    return lam;
  }
  var row = api.el("div", { class: "lab-row" }); root.appendChild(row);
  var p1 = api.el("div", { style: { minWidth: 0 } }), p2 = api.el("div", { style: { minWidth: 0 } }); row.appendChild(p1); row.appendChild(p2);
  var vA = api.view(p1, { aspect: 1.3, minH: 230, label: "MSE de entrenamiento en cada paso, escala logarítmica" });
  var pA = api.plot(vA, { xr: [0, 100], yr: [-3, 3], xticks: 5, yticks: 6, xlabel: "paso (época con todo el lote)", yfmt: function (t) { return "1e" + t; }, pad: { l: 46, r: 12, t: 12, b: 36 } });
  var vB = api.view(p2, { aspect: 1.3, minH: 230, label: "Los tres parámetros aprendidos frente a los óptimos" });
  var pB = api.plot(vB, { xr: [0, 3], yr: [-4, 4], xticks: 3, yticks: 4, grid: true, xfmt: function (t) { return ""; }, pad: { l: 40, r: 12, t: 12, b: 36 } });
  api.legend(root, [[api.colors().terracota, "MSE de entrenamiento"], [api.colors().oliva, "MSE mínimo posible (el ruido)"], [api.colors().cobalto, "parámetro actual (barra)"], [api.colors().marker, "óptimo de mínimos cuadrados (raya)"]]);
  var ui = api.controls(root);
  ui.segmented({ label: "Variables de entrada", options: [["igual", "x₁, x₂ misma escala"], ["x10", "x₂ ×10 sin escalar"], ["std", "x₂ ×10 estandarizadas"]], value: mode, onChange: function (v) { mode = v; init(); } });
  ui.slider({ label: "learning rate", min: 0.002, max: 0.5, step: 0.002, value: lr, fmt: function (v) { return v.toFixed(3); }, onInput: function (v) { lr = v; init(); } });
  ui.button("Un paso", function () { if (!loop.running) { advance(); redraw(); } }, "primary");
  var bPlay = ui.button("Entrenar", function () {
    if (loop.running) { loop.stop(); return; }
    if (status !== "run") init();
    if (api.reduceMotion) { for (var q = 0; q < 500 && status === "run"; q++) advance(); redraw(); } else loop.start();
  });
  ui.button("Volver a empezar", function () { init(); });
  var out = api.readout(root);

  function init() { if (loop) loop.stop(); build(); wopt = optimum(); lossOpt = loss(wopt); w = [0, 0, 0]; k = 0; hist = [loss(w)]; status = "run"; redraw(); }
  function advance() {
    var g = grad(w); for (var q = 0; q < 3; q++) w[q] -= lr * g[q];
    k++; var m = loss(w); hist.push(m);
    if (!isFinite(m) || m > 1e8) status = "diverge";
    else if (m < lossOpt * 1.01 + 1e-4) status = "converge";
    else if (k >= 600) status = "limit";
  }
  loop = api.loop(function () { for (var q = 0; q < 2 && status === "run"; q++) advance(); redraw(); return status === "run"; }, { fps: 30, onState: function (on) { bPlay.textContent = on ? "Pausa" : "Entrenar"; } });

  function drawA(ctx, W, H, C) {
    var D = api.d, mx = Math.max(100, Math.ceil((hist.length - 1) / 100) * 100);
    pA.xr = [0, mx]; pA.axes(ctx); ctx.save(); pA.clip(ctx);
    D.line(ctx, pA.x(0), pA.y(Math.log(Math.max(lossOpt, 1e-9)) / Math.LN10), pA.x(mx), pA.y(Math.log(Math.max(lossOpt, 1e-9)) / Math.LN10), C.oliva, 1.5, [5, 4]);
    D.path(ctx, hist.map(function (m, i) { return [pA.x(i), pA.y(api.math.clamp(Math.log(Math.max(m, 1e-9)) / Math.LN10, -3, 3))]; }), C.terracota, 2.5);
    ctx.restore();
  }
  function drawB(ctx, W, H, C) {
    var D = api.d, names = ["w₁ presup.", "w₂ rivales", "b sesgo"], q, bx = pB.box, gw = bx.w / 3;
    pB.axes(ctx); ctx.save(); pB.clip(ctx);
    D.line(ctx, bx.x, pB.y(0), bx.x + bx.w, pB.y(0), C.ink, 1.5);
    for (q = 0; q < 3; q++) {
      var cx = bx.x + gw * (q + 0.5), v = isFinite(w[q]) ? api.math.clamp(w[q], -4, 4) : 0, bw = Math.min(34, gw * 0.4);
      D.rect(ctx, cx - bw / 2, Math.min(pB.y(0), pB.y(v)), bw, Math.abs(pB.y(v) - pB.y(0)), C.cobalto);
      var t = api.math.clamp(wopt[q], -4, 4);
      D.line(ctx, cx - bw, pB.y(t), cx + bw, pB.y(t), C.marker, 4); D.line(ctx, cx - bw, pB.y(t), cx + bw, pB.y(t), C.ink, 1);
    }
    ctx.restore();
    for (q = 0; q < 3; q++) D.text(ctx, names[q], bx.x + gw * (q + 0.5), bx.y + bx.h + 16, { align: "center", size: 12, color: C.ink2, weight: 600 });
  }
  function f3(v) { return !isFinite(v) || Math.abs(v) > 1e5 ? "∞" : v.toFixed(3); }
  function redraw() {
    vA.redraw(); vB.redraw();
    var lam = lamMax(), msg = "";
    if (status === "converge") msg = "<br><span class='good'>CONVERGE en " + k + " pasos.</span>";
    else if (status === "diverge") msg = "<br><span class='bad'>DIVERGE: lr = " + lr.toFixed(3) + " es mayor que el límite 2/λ = " + (2 / lam).toFixed(4) + ".</span>";
    else if (status === "limit") msg = "<br><span class='bad'>600 pasos y todavía lejos del óptimo: la dirección «lenta» del valle apenas avanza.</span>";
    out.set("paso <b>" + k + "</b> · MSE = <b>" + (hist[k] > 1e5 ? "enorme" : hist[k].toFixed(4)) + "</b> · (w₁, w₂, b) = <b>(" + w.map(f3).join(", ") + ")</b><br>" +
      "óptimo (mínimos cuadrados) = (" + wopt.map(function (v) { return v.toFixed(3); }).join(", ") + ") · MSE mínimo ≈ " + lossOpt.toFixed(4) + "<br>" +
      "mayor curvatura λ ≈ <b>" + lam.toFixed(1) + "</b> → lr estable máximo ≈ 2/λ = <b>" + (2 / lam).toFixed(3) + "</b>" + msg);
  }
  init(); vA.draw(drawA); vB.draw(drawB);
  return { destroy: function () { loop.stop(); } };
});
