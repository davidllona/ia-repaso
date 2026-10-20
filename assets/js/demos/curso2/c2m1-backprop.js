/* Experimento: backpropagation en la red 2-2-1: el error viaja hacia atrás, cada peso recibe su gradiente (regla de la cadena)
   y se actualiza w ← w − η·g. La pérdida es la entropía cruzada binaria; la salida, una sigmoide. */
Lab.register("curso2/c2m1-backprop", function (root, api) {
  var M = api.math, D = api.d;
  var P0 = { w11: 0.4, w12: -0.6, b1: 0.1, w21: 0.7, w22: 0.2, b2: -0.3, v1: 0.5, v2: -0.8, c: 0.2 };
  var S = { x1: 1, x2: 0.5, y: 1, eta: 0.5, act: "sigmoid", P: Object.assign({}, P0), phase: 0, iter: 0, seed: 11, hist: null, before: null, prevP: null };
  var sig = function (z) { return 1 / (1 + Math.exp(-z)); };
  var ACT = {
    sigmoid: { f: sig, d: function (z, h) { return h * (1 - h); }, name: "σ′(z) = h·(1 − h)" },
    tanh: { f: Math.tanh, d: function (z, h) { return 1 - h * h; }, name: "tanh′(z) = 1 − h²" },
    relu: { f: function (z) { return Math.max(0, z); }, d: function (z) { return z > 0 ? 1 : 0; }, name: "ReLU′(z) = 1 si z &gt; 0, si no 0" }
  };
  function mi(s) { return s.replace(/-/g, "−"); }
  function nk(v, k) { return mi((Math.abs(v) < Math.pow(10, -k) / 2 ? 0 : v).toFixed(k)); }
  function par(v, k) { return v < 0 ? "(" + nk(v, k) + ")" : nk(v, k); }

  function fwd(P) {
    var A = ACT[S.act], R = {};
    R.z1 = P.w11 * S.x1 + P.w12 * S.x2 + P.b1; R.h1 = A.f(R.z1);
    R.z2 = P.w21 * S.x1 + P.w22 * S.x2 + P.b2; R.h2 = A.f(R.z2);
    R.zo = P.v1 * R.h1 + P.v2 * R.h2 + P.c; R.yh = sig(R.zo);
    R.L = -(S.y * Math.log(R.yh) + (1 - S.y) * Math.log(1 - R.yh));
    return R;
  }
  function bwd(P, R) {
    var A = ACT[S.act], G = {};
    G.do = R.yh - S.y;
    G.v1 = G.do * R.h1; G.v2 = G.do * R.h2; G.c = G.do;
    G.a1 = A.d(R.z1, R.h1); G.a2 = A.d(R.z2, R.h2);
    G.d1 = G.do * P.v1 * G.a1; G.d2 = G.do * P.v2 * G.a2;
    G.w11 = G.d1 * S.x1; G.w12 = G.d1 * S.x2; G.b1 = G.d1;
    G.w21 = G.d2 * S.x1; G.w22 = G.d2 * S.x2; G.b2 = G.d2;
    return G;
  }
  var KEYS = ["w11", "w12", "b1", "w21", "w22", "b2", "v1", "v2", "c"];
  var PRETTY = { w11: "w₁₁", w12: "w₁₂", b1: "b₁", w21: "w₂₁", w22: "w₂₂", b2: "b₂", v1: "v₁", v2: "v₂", c: "c" };
  function applyUpdate() {
    var R = fwd(S.P), G = bwd(S.P, R);
    S.before = { R: R, G: G, P: Object.assign({}, S.P) };
    S.prevP = Object.assign({}, S.P);
    KEYS.forEach(function (k) { S.P[k] = S.P[k] - S.eta * G[k]; });
    S.hist.push(fwd(S.P).L);
  }
  function resetAll() { S.P = Object.assign({}, P0); S.phase = 0; S.iter = 0; S.before = null; S.hist = [fwd(S.P).L]; }
  S.hist = [fwd(S.P).L];

  var view = api.view(root, { aspect: 2.0, minH: 290, maxH: 400, label: "Red 2-2-1 con los gradientes que viajan hacia atrás" });
  var view2 = api.view(root, { aspect: 4.2, minH: 120, maxH: 170, label: "Pérdida en cada iteración" });
  var plot2 = api.plot(view2, { xr: [0, 20], yr: [0, 1], xticks: 5, yticks: 2, xlabel: "iteraciones (actualizaciones de pesos)", ylabel: "pérdida", pad: { l: 46, r: 12, t: 10, b: 34 }, xfmt: function (v) { return Math.round(v); } });
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.72rem, 2.7vw, .84rem)";
  function reset2() { S.phase = 0; S.before = null; S.iter = 0; S.hist = [fwd(S.P).L]; }
  ui.slider({ label: "Learning rate η", min: 0.05, max: 3, step: 0.05, value: S.eta, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.eta = v; update(); } });
  ui.slider({ label: "Entrada x₁", min: -2, max: 2, step: 0.1, value: S.x1, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.x1 = v; reset2(); update(); } });
  ui.slider({ label: "Entrada x₂", min: -2, max: 2, step: 0.1, value: S.x2, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.x2 = v; reset2(); update(); } });
  ui.select({ label: "Activación de la capa oculta", value: "sigmoid", options: [["sigmoid", "Sigmoide"], ["tanh", "tanh"], ["relu", "ReLU"]], onChange: function (v) { S.act = v; reset2(); update(); } });
  ui.button("◀ Paso anterior", function () { goBack(); }, null);
  ui.button("Paso siguiente ▶", function () { goNext(); }, "primary");
  ui.button("Ejecutar 20 iteraciones", function () {
    for (var i = 0; i < 20; i++) { applyUpdate(); S.iter++; }
    S.phase = 0; S.before = null; update();
  });
  ui.button("Pesos al azar", function () { var r = api.rng(S.seed++); KEYS.forEach(function (k) { S.P[k] = Math.round(r.normal(0, 0.8) * 10) / 10; }); reset2(); update(); });
  ui.button("Pesos del ejemplo", function () { resetAll(); update(); });

  function goNext() {
    if (S.phase === 5) { S.phase = 1; S.iter = S.iter; update(); return; }
    S.phase++;
    if (S.phase === 5) { applyUpdate(); S.iter++; }
    update();
  }
  function goBack() {
    if (S.phase === 5) { S.P = Object.assign({}, S.prevP); S.hist.pop(); S.iter--; S.phase = 4; }
    else if (S.phase > 0) S.phase--;
    update();
  }

  function draw(ctx, w, h, C) {
    var P = S.P, R = fwd(P), G = S.phase >= 1 && S.phase <= 4 ? bwd(P, R) : null, ph = S.phase;
    var r = M.clamp(w * 0.05, 15, 26), fs = w > 600 ? 12 : 11;
    var N = { x1: [0.1 * w, 0.27 * h], x2: [0.1 * w, 0.73 * h], h1: [0.46 * w, 0.27 * h], h2: [0.46 * w, 0.73 * h], o: [0.84 * w, 0.5 * h] };
    var E = [["x1", "h1", "w11", 0.5, 4], ["x1", "h2", "w21", 0.72, 4], ["x2", "h1", "w12", 0.72, 4], ["x2", "h2", "w22", 0.5, 4], ["h1", "o", "v1", 0.5, 2], ["h2", "o", "v2", 0.5, 2]];
    E.forEach(function (e) {
      var A = N[e[0]], B = N[e[1]], wt = P[e[2]], showG = G && ph === e[4], back = G && (ph === e[4] || (ph === 3 && e[1] === "o"));
      var col = wt >= 0 ? C.cobalto : C.terracota;
      ctx.save(); ctx.globalAlpha = 0.75;
      D.line(ctx, A[0], A[1], B[0], B[1], col, 1 + Math.min(2.2, Math.abs(wt) * 1.6)); ctx.restore();
      if (back) {
        D.line(ctx, A[0], A[1], B[0], B[1], C.terracota, 3.2, [7, 5]);
        var mx = A[0] + (B[0] - A[0]) * 0.28, my = A[1] + (B[1] - A[1]) * 0.28, ang = Math.atan2(B[1] - A[1], B[0] - A[0]);
        D.arrow(ctx, mx + Math.cos(ang) * 11, my + Math.sin(ang) * 11, mx - Math.cos(ang) * 11, my - Math.sin(ang) * 11, C.terracota, 3);
      }
      var t = e[3], lx = A[0] + (B[0] - A[0]) * t, ly = A[1] + (B[1] - A[1]) * t;
      var s = showG ? nk(G[e[2]], 3) : nk(wt, 2);
      ctx.save(); ctx.font = "600 11px 'IBM Plex Mono',monospace"; var tw = ctx.measureText(s).width + 8; ctx.restore();
      D.rect(ctx, lx - tw / 2, ly - 8, tw, 16, showG ? C.terracotaWash : C.surface, showG ? C.terracota : null, 1.5);
      D.text(ctx, s, lx, ly + 4, { size: 11, mono: true, weight: 600, align: "center", color: showG ? C.terracotaInk : C.ink });
    });
    function node(k, txt, fill, hot) {
      var p = N[k]; D.circle(ctx, p[0], p[1], r, fill, hot ? C.terracota : C.ink, hot ? 4 : 2);
      D.text(ctx, txt, p[0], p[1] + 4, { size: r > 19 ? 13 : 11, mono: true, weight: 600, align: "center", color: C.ink });
    }
    node("x1", S.x1.toFixed(1), C.paper); node("x2", S.x2.toFixed(1), C.paper);
    node("h1", nk(R.h1, 2), C.cobaltoWash, ph === 3); node("h2", nk(R.h2, 2), C.cobaltoWash, ph === 3); node("o", nk(R.yh, 2), C.terracotaWash, ph === 1);
    function lines(k, arr, below) {
      var p = N[k], y0 = below ? p[1] + r + 15 : p[1] - r - 7 - 14 * (arr.length - 1);
      arr.forEach(function (t, i) { D.text(ctx, t[0], p[0], y0 + 14 * i, { size: fs, mono: true, align: "center", weight: t[1] === 2 ? 700 : t[1] ? 600 : 400, color: t[1] === 2 ? C.terracotaInk : t[1] ? C.ink : C.muted }); });
    }
    var showD1 = G && ph >= 3, showDo = G && ph >= 1;
    lines("x1", [["x₁", 1]], false); lines("x2", [["x₂", 1]], true);
    lines("h1", [[showD1 ? "δ₁ = " + nk(G.d1, 4) : "δ₁ = ?", showD1 ? 2 : 0], ["b₁ = " + nk(P.b1, 2), 0], ["h₁ = " + nk(R.h1, 4), 1]], false);
    lines("h2", [["h₂ = " + nk(R.h2, 4), 1], ["b₂ = " + nk(P.b2, 2), 0], [showD1 ? "δ₂ = " + nk(G.d2, 4) : "δ₂ = ?", showD1 ? 2 : 0]], true);
    lines("o", [[showDo ? "δ_o = " + nk(G.do, 4) : "δ_o = ?", showDo ? 2 : 0], ["c = " + nk(P.c, 2), 0], ["ŷ = " + nk(R.yh, 4), 1]], false);
    lines("o", [["y = " + S.y, 0], ["L = " + nk(R.L, 4), 1]], true);
  }

  function drawLoss(ctx, w, h, C) {
    var H = S.hist, n = H.length, xmax = Math.max(20, n - 1), ymax = Math.max(0.2, Math.ceil(Math.max.apply(null, H.filter(isFinite)) * 5) / 5);
    plot2.xr = [0, xmax]; plot2.yr = [0, ymax];
    plot2.axes(ctx); ctx.save(); plot2.clip(ctx);
    var pts = H.map(function (v, i) { return [plot2.x(i), plot2.y(Math.min(v, ymax))]; });
    D.path(ctx, pts, C.terracota, 2.5);
    pts.forEach(function (q) { D.circle(ctx, q[0], q[1], n > 40 ? 2 : 3.5, C.terracota, C.paper, 1); });
    ctx.restore();
  }

  function update() {
    var R = fwd(S.P), ph = S.phase, G = (ph >= 1 && ph <= 4) ? bwd(S.P, R) : null, s = "", A = ACT[S.act], P = S.P;
    var titles = ["Fase 0 · Forward hecho: ya conocemos la predicción y la pérdida", "Fase 1 · El error en la salida", "Fase 2 · Gradientes de la capa de salida (v₁, v₂, c)",
      "Fase 3 · El error viaja hacia atrás hasta las neuronas ocultas", "Fase 4 · Gradientes de la capa oculta (w y b)", "Fase 5 · Actualizar: w ← w − η·g"];
    s += "<b>" + titles[ph] + "</b> · iteración " + S.iter + "<br>";
    if (ph === 0) s += "ŷ = " + nk(R.yh, 4) + " · y = " + S.y + " → L = <b>" + nk(R.L, 4) + "</b>. Ahora hay que repartir la «culpa» de ese error entre los 9 parámetros. Pulsa «Paso siguiente».";
    if (ph === 1) s += "δ_o = ∂L/∂z_o = (∂L/∂ŷ)·(∂ŷ/∂z_o) = ŷ − y<br>&nbsp;&nbsp;&nbsp;&nbsp;= " + nk(R.yh, 4) + " − " + S.y + " = <b>" + nk(G.do, 4) + "</b><br>(Con sigmoide + entropía cruzada la cuenta se simplifica a «predicción − realidad».)";
    if (ph === 2) s += "∂L/∂v₁ = δ_o·h₁ = " + par(G.do, 4) + "·" + nk(R.h1, 4) + " = <b>" + nk(G.v1, 4) + "</b><br>∂L/∂v₂ = δ_o·h₂ = " + par(G.do, 4) + "·" + nk(R.h2, 4) + " = <b>" + nk(G.v2, 4) + "</b><br>∂L/∂c &nbsp;= δ_o = <b>" + nk(G.c, 4) + "</b>";
    if (ph === 3) s += "δ₁ = δ_o·v₁·f′(z₁) = " + par(G.do, 4) + "·" + par(P.v1, 2) + "·" + nk(G.a1, 4) + " = <b>" + nk(G.d1, 4) + "</b><br>δ₂ = δ_o·v₂·f′(z₂) = " + par(G.do, 4) + "·" + par(P.v2, 2) + "·" + nk(G.a2, 4) + " = <b>" + nk(G.d2, 4) + "</b><br>con " + A.name;
    if (ph === 4) s += "∂L/∂w₁₁ = δ₁·x₁ = " + nk(G.d1, 4) + "·" + par(S.x1, 1) + " = <b>" + nk(G.w11, 4) + "</b> · ∂L/∂w₁₂ = δ₁·x₂ = <b>" + nk(G.w12, 4) + "</b> · ∂L/∂b₁ = δ₁ = <b>" + nk(G.b1, 4) + "</b><br>" +
      "∂L/∂w₂₁ = δ₂·x₁ = " + nk(G.d2, 4) + "·" + par(S.x1, 1) + " = <b>" + nk(G.w21, 4) + "</b> · ∂L/∂w₂₂ = δ₂·x₂ = <b>" + nk(G.w22, 4) + "</b> · ∂L/∂b₂ = δ₂ = <b>" + nk(G.b2, 4) + "</b>";
    if (ph === 5 && S.before) {
      var B = S.before, e = S.eta, L1 = fwd(S.P).L;
      s += KEYS.map(function (k) { return PRETTY[k] + ": " + nk(B.P[k], 4) + " − " + nk(e, 2) + "·(" + nk(B.G[k], 4) + ") = <b>" + nk(S.P[k], 4) + "</b>"; }).join("<br>") +
        "<br>Pérdida: " + nk(B.R.L, 4) + " → <b>" + nk(L1, 4) + "</b> " + (L1 < B.R.L ? "<span class='good'>(ha bajado)</span>" : "<span class='bad'>(¡ha subido! η demasiado grande)</span>");
    }
    if (ph === 0 && S.iter > 0) s += "<br>Tras " + S.iter + " actualizaciones la pérdida es " + nk(R.L, 4) + " y la predicción ŷ = " + nk(R.yh, 4) + ".";
    out.set(s);
    view.redraw(); view2.redraw();
  }
  view.draw(draw); view2.draw(drawLoss); update();
});
