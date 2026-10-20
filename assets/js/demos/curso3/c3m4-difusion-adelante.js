/* Experimento: proceso hacia delante. Dos lunas (500 puntos) y un dígito 8×8 se convierten en ruido con T = 40 pasos, β lineal de 0,001 a 0,2.
   Dos formas de llegar a x_t: paso a paso (x_t = √(1−β_t)·x_{t−1} + √β_t·ε_t) o de un salto (x_t = √ᾱ_t·x0 + √(1−ᾱ_t)·ε). */
Lab.register("curso3/c3m4-difusion-adelante", function (root, api) {
  var D = api.d, M = api.math, T = 40, N = 500, NP = 64;
  var DIG = [0, 0, 9, 16, 13, 6, 0, 0, 0, 0, 6, 5, 16, 16, 0, 0, 0, 0, 0, 8, 15, 5, 0, 0, 0, 0, 0, 5, 14, 3, 0, 0, 0, 0, 0, 0, 9, 15, 2, 0, 0, 0, 0, 0, 0, 11, 12, 0, 0, 0, 4, 8, 11, 15, 12, 0, 0, 0, 11, 14, 12, 8, 0, 0];
  var betas = [], alphas = [], abar = [], p = 1, t, i, k;
  for (t = 0; t < T; t++) { var b = 0.001 + (0.2 - 0.001) * t / (T - 1); betas.push(b); alphas.push(1 - b); p *= 1 - b; abar.push(p); }
  var r = api.rng(12), X0 = [], mx = 0, my = 0;
  for (i = 0; i < N; i++) {
    var th = Math.PI * (i < N / 2 ? i / (N / 2 - 1) : (i - N / 2) / (N / 2 - 1)), up = i < N / 2;
    var x = (up ? Math.cos(th) : 1 - Math.cos(th)) + r.normal(0, 0.1), y = (up ? Math.sin(th) : 0.5 - Math.sin(th)) + r.normal(0, 0.1);
    X0.push([x, y]); mx += x / N; my += y / N;
  }
  var sx = 0, sy = 0; X0.forEach(function (q) { sx += (q[0] - mx) * (q[0] - mx) / N; sy += (q[1] - my) * (q[1] - my) / N; }); sx = Math.sqrt(sx); sy = Math.sqrt(sy);
  X0 = X0.map(function (q) { return [(q[0] - mx) / sx, (q[1] - my) / sy]; });
  // ruido fijo: uno para el salto y T para el paso a paso
  var E1 = [], ES = [];
  for (i = 0; i < N; i++) { E1.push([r.normal(0, 1), r.normal(0, 1)]); var row = []; for (t = 0; t < T; t++) row.push([r.normal(0, 1), r.normal(0, 1)]); ES.push(row); }
  var PE1 = [], PES = []; for (i = 0; i < NP; i++) { PE1.push(r.normal(0, 1)); var rr = []; for (t = 0; t < T; t++) rr.push(r.normal(0, 1)); PES.push(rr); }
  // trayectorias paso a paso precalculadas
  var TR = X0.map(function (q, n) { var tr = [q.slice()], cur = q.slice(); for (var s = 0; s < T; s++) { cur = [Math.sqrt(alphas[s]) * cur[0] + Math.sqrt(betas[s]) * ES[n][s][0], Math.sqrt(alphas[s]) * cur[1] + Math.sqrt(betas[s]) * ES[n][s][1]]; tr.push(cur); } return tr; });
  var PTR = []; (function () { var cur = DIG.map(function (v) { return 2 * v / 16 - 1; }), tr = [cur.slice()]; for (var s = 0; s < T; s++) { cur = cur.map(function (v, j) { return Math.sqrt(alphas[s]) * v + Math.sqrt(betas[s]) * PES[j][s]; }); tr.push(cur); } PTR = tr; })();

  var S = { t: 0, mode: "salto" };
  var wrap = api.el("div", { style: { display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "flex-start" } });
  var left = api.el("div", { style: { flex: "1 1 300px", minWidth: "0" } }), right = api.el("div", { style: { flex: "0 1 170px", minWidth: "140px" } });
  wrap.appendChild(left); wrap.appendChild(right); root.appendChild(wrap);
  var view = api.view(left, { aspect: 1.15, minH: 260, maxH: 400, label: "Dos lunas convirtiéndose en ruido gaussiano" });
  var viewImg = api.view(right, { aspect: 1, minH: 140, maxH: 170, label: "Un dígito 8 por 8 con ruido" });
  var ui = api.controls(root), out = api.readout(root);
  var sl = ui.slider({ label: "Paso t del proceso", min: 0, max: T, step: 1, value: 0, fmt: function (v) { return v + " / " + T; }, onInput: function (v) { S.t = v; update(); } });
  ui.segmented({ label: "Cómo se llega a x_t", value: "salto", options: [["salto", "Fórmula cerrada (un salto)"], ["pasos", "Paso a paso (t pasos)"]], onChange: function (v) { S.mode = v; update(); } });
  var loop = null, acc = 0;
  ui.button("▶ Animar", function () {
    if (api.reduceMotion) { S.t = T; sl.set(T, true); update(); return; }
    if (S.t >= T) { S.t = 0; sl.set(0, true); }
    if (!loop) loop = api.loop(function (dt) { acc += dt; if (acc > 0.12) { acc = 0; S.t++; sl.set(S.t, true); update(); if (S.t >= T) return false; } }, { fps: 30 });
    acc = 0; loop.start();
  }, "primary");
  ui.button("Ir a ruido puro (t = 40)", function () { S.t = T; sl.set(T, true); update(); });

  var pl = api.plot(view, { xr: [-3.4, 3.4], yr: [-3.4, 3.4], pad: { l: 30, r: 8, t: 8, b: 24 }, xticks: 4, yticks: 4, grid: true, xfmt: function (v) { return Math.round(v); }, yfmt: function (v) { return Math.round(v); } });
  function pos(n, t) {
    if (t === 0) return X0[n];
    if (S.mode === "pasos") return TR[n][t];
    var a = abar[t - 1], s1 = Math.sqrt(a), s2 = Math.sqrt(1 - a);
    return [s1 * X0[n][0] + s2 * E1[n][0], s1 * X0[n][1] + s2 * E1[n][1]];
  }
  function draw(ctx, w, h, C) {
    pl.axes(ctx); ctx.save(); pl.clip(ctx);
    var n, q;
    for (n = N - 1; n >= 1; n--) { q = pos(n, S.t); ctx.globalAlpha = 0.75; D.circle(ctx, pl.x(q[0]), pl.y(q[1]), 2.4, n < N / 2 ? C.cobalto : C.terracota); }
    ctx.globalAlpha = 1;
    // punto seguido
    if (S.mode === "pasos") { var pts = []; for (k = 0; k <= S.t; k++) pts.push([pl.x(TR[0][k][0]), pl.y(TR[0][k][1])]); D.path(ctx, pts, C.ink, 1.4); }
    else if (S.t > 0) { var q1 = pos(0, S.t); D.line(ctx, pl.x(X0[0][0]), pl.y(X0[0][1]), pl.x(q1[0]), pl.y(q1[1]), C.ink, 1.4, [4, 3]); }
    q = pos(0, S.t);
    D.circle(ctx, pl.x(X0[0][0]), pl.y(X0[0][1]), 4, C.paper, C.ink, 2);
    D.circle(ctx, pl.x(q[0]), pl.y(q[1]), 6, C.ink, C.paper, 2);
    ctx.restore();
    D.text(ctx, "t = " + S.t, pl.box.x + 6, pl.box.y + 16, { size: 13, weight: 700, mono: true, color: C.ink });
  }
  function imgAt(t) {
    var res = [], j;
    if (t === 0) return DIG.map(function (v) { return 2 * v / 16 - 1; });
    if (S.mode === "pasos") return PTR[t];
    var a = abar[t - 1];
    for (j = 0; j < NP; j++) res.push(Math.sqrt(a) * (2 * DIG[j] / 16 - 1) + Math.sqrt(1 - a) * PE1[j]);
    return res;
  }
  function drawImg(ctx, w, h, C) {
    var size = Math.min(w, h) - 8, c = size / 8, im = imgAt(S.t), j;
    D.rect(ctx, 4, 4, size, size, C.surface, C.ink, 1.5);
    for (j = 0; j < 64; j++) { ctx.save(); ctx.globalAlpha = M.clamp((im[j] + 1) / 2, 0, 1); ctx.fillStyle = C.ink; ctx.fillRect(4 + (j % 8) * c, 4 + Math.floor(j / 8) * c, c + 0.4, c + 0.4); ctx.restore(); }
  }
  function f(v, kk) { return v.toFixed(kk === undefined ? 2 : kk).replace("-", "−"); }
  function update() {
    var tt = S.t, a = tt === 0 ? 1 : abar[tt - 1], xs = [], ys = [], dots = 0, n, q, x0s = [];
    for (n = 0; n < N; n++) { q = pos(n, tt); xs.push(q[0]); ys.push(q[1]); x0s.push(X0[n][0]); }
    var mxv = M.mean(xs), cxy = 0, sxv = M.std(xs), s0 = M.std(x0s);
    for (n = 0; n < N; n++) cxy += (xs[n] - mxv) * (x0s[n] - M.mean(x0s)) / N;
    var corr = cxy / (sxv * s0), q0 = pos(0, tt), x0p = X0[0], e = E1[0];
    var line1 = "<b>t = " + tt + "</b> · β_t = " + (tt === 0 ? "—" : f(betas[tt - 1], 3)) + " · ᾱ_t = <b>" + f(a, 3) + "</b> · √ᾱ_t = " + f(Math.sqrt(a), 3) + " · √(1 − ᾱ_t) = " + f(Math.sqrt(1 - a), 3) + "<br>";
    var line2 = S.mode === "salto" && tt > 0 ? "<b>Punto marcado, componente x:</b> x_t = √ᾱ·x₀ + √(1−ᾱ)·ε = " + f(Math.sqrt(a), 3) + "·(" + f(x0p[0]) + ") + " + f(Math.sqrt(1 - a), 3) + "·(" + f(e[0]) + ") = <b>" + f(q0[0]) + "</b><br>" :
      (tt > 0 ? "<b>Punto marcado:</b> ha dado " + tt + " pasos pequeños y está en (" + f(q0[0]) + ", " + f(q0[1]) + ").<br>" : "<b>Punto marcado:</b> aún en su sitio original (" + f(x0p[0]) + ", " + f(x0p[1]) + ").<br>");
    out.set(line1 + line2 + "<b>Nube de " + N + " puntos:</b> desviación de x = " + f(sxv) + " (la teoría dice √(ᾱ·1 + (1 − ᾱ)) = 1: el proceso conserva la varianza) · correlación con la posición inicial = <b>" + f(corr) + "</b> (≈ √ᾱ = " + f(Math.sqrt(a)) + ")");
    view.redraw(); viewImg.redraw();
  }
  view.draw(draw); viewImg.draw(drawImg); update();
  return { destroy: function () { if (loop) loop.stop(); } };
});
