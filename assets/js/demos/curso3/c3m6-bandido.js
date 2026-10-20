/* Experimento: bandido de 5 brazos (5 películas que se pueden recomendar) con ε-greedy. Estimación incremental Q ← Q + (R − Q)/N. Se ve cuánto explora y cuánto gana. */
Lab.register("curso3/c3m6-bandido", function (root, api) {
  var D = api.d, M = api.math;
  var K = 5, NAMES = ["A", "B", "C", "D", "E"];
  var seedBase = 11, round = 0;
  var S = { eps: 0.1, mu: [], Q: [], N: [], hist: [], total: 0, last: null, show: true, rng: null };
  function init(newMeans) {
    if (newMeans) round++;
    var rg = api.rng(seedBase + round * 5);
    S.mu = []; for (var i = 0; i < K; i++) S.mu.push(Math.round(rg.normal(0, 1) * 10) / 10);
    S.Q = []; S.N = []; for (i = 0; i < K; i++) { S.Q.push(0); S.N.push(0); }
    S.hist = []; S.total = 0; S.last = null; S.rng = api.rng(500 + round);
  }
  init(false);
  var v1 = api.view(root, { aspect: 2.0, minH: 210, maxH: 290, label: "Cinco películas: valor estimado de cada una y número de veces que se ha recomendado" });
  var v2 = api.view(root, { aspect: 3.0, minH: 130, maxH: 190, label: "Recompensa media acumulada a lo largo de las recomendaciones" });
  var p2 = api.plot(v2, { xr: [0, 100], yr: [-1, 2], xticks: 4, yticks: 3, xlabel: "recomendación", ylabel: "media", pad: { l: 40, r: 16, t: 8, b: 32 }, yfmt: function (v) { return String(+v.toFixed(2)).replace(".", ","); } });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "ε (probabilidad de explorar)", min: 0, max: 1, step: 0.01, value: S.eps, fmt: function (v) { return v.toFixed(2).replace(".", ","); }, onInput: function (v) { S.eps = v; update(); } });
  ui.button("Recomendar 1 vez", function () { pull(); update(); }, "primary");
  ui.button("Recomendar 100 veces", function () { for (var i = 0; i < 100; i++) pull(); update(); });
  ui.button("Nuevas medias (otro catálogo)", function () { init(true); update(); }, "warm");
  ui.toggle({ label: "Mostrar los gustos reales (medias)", value: true, onChange: function (v) { S.show = v; update(); } });

  function best() { var b = 0; for (var i = 1; i < K; i++) if (S.mu[i] > S.mu[b]) b = i; return b; }
  function greedy() {
    var m = Math.max.apply(null, S.Q), c = []; for (var i = 0; i < K; i++) if (S.Q[i] === m) c.push(i);
    return c[Math.floor(S.rng.next() * c.length)];
  }
  function pull() {
    var explore = S.rng.next() < S.eps, a = explore ? Math.floor(S.rng.next() * K) : greedy();
    var R = Math.round(S.rng.normal(S.mu[a], 1) * 100) / 100, old = S.Q[a];
    S.N[a]++; S.Q[a] = old + (R - old) / S.N[a]; S.total += R;
    S.hist.push(S.total / (S.hist.length + 1));
    S.last = { a: a, explore: explore, R: R, old: old, n: S.N[a], neu: S.Q[a] };
  }
  function f(v, k) { return (v < 0 ? "−" : "") + Math.abs(v).toFixed(k === undefined ? 2 : k).replace(".", ","); }

  function drawBars(ctx, w, h, C) {
    var m = { l: 34, r: 8, t: 20, b: 44 }, bw = (w - m.l - m.r) / K, hi = Math.max(2.6, Math.ceil(Math.max.apply(null, S.Q.concat(S.mu)) + 0.4)), tot = hi + 2, y0 = m.t + (h - m.t - m.b) * (hi / tot), sc = (h - m.t - m.b) / tot;
    function Y(v) { return y0 - v * sc; }
    for (var g = -2; g <= Math.floor(hi); g++) { D.line(ctx, m.l, Y(g), w - m.r, Y(g), g === 0 ? C.ink : C.line, g === 0 ? 1.5 : 1); D.text(ctx, String(g).replace("-", "−"), m.l - 6, Y(g) + 4, { align: "right", size: 10.5, color: C.muted, mono: true }); }
    var b = best();
    for (var i = 0; i < K; i++) {
      var x = m.l + i * bw + bw * 0.2, ww = bw * 0.6, q = S.Q[i];
      ctx.save(); ctx.fillStyle = (S.last && S.last.a === i) ? C.terracota : C.cobalto; ctx.globalAlpha = 0.85;
      ctx.fillRect(x, Math.min(Y(0), Y(q)), ww, Math.abs(Y(q) - Y(0))); ctx.restore();
      if (S.show) { D.line(ctx, x - 4, Y(S.mu[i]), x + ww + 4, Y(S.mu[i]), C.olivaInk, 3); }
      D.text(ctx, "peli " + NAMES[i] + (S.show && i === b ? " ★" : ""), x + ww / 2, h - 28, { align: "center", size: 11.5, weight: 700, color: C.ink });
      D.text(ctx, "N=" + S.N[i], x + ww / 2, h - 13, { align: "center", size: 11, color: C.ink2, mono: true });
      D.text(ctx, f(q, 2), x + ww / 2, q >= 0 ? Y(q) - 5 : Y(q) + 13, { align: "center", size: 10.5, color: C.ink, mono: true, weight: 600 });
    }
    D.text(ctx, "barra = valor estimado Q" + (S.show ? (w < 520 ? " · raya = media real" : " · raya verde = media real (oculta para el agente)") : ""), m.l, 10, { size: 10.5, color: C.muted });
  }
  function drawCurve(ctx, w, h, C) {
    var n = S.hist.length, mx = Math.max(100, Math.ceil(n / 100) * 100), need = Math.ceil(Math.max(S.mu[best()], Math.max.apply(null, S.hist.concat([0]))) + 0.2), top = need <= 2 ? 2 : (need <= 5 ? 5 : 8);
    p2.xr = [0, mx]; p2.yr = [-1, top]; p2.axes(ctx); ctx.save(); p2.clip(ctx);
    D.line(ctx, p2.x(0), p2.y(S.mu[best()]), p2.x(mx), p2.y(S.mu[best()]), C.olivaInk, 1.8, [6, 4]);
    var pts = S.hist.map(function (v, i) { return [p2.x(i + 1), p2.y(M.clamp(v, -1, top))]; });
    D.path(ctx, pts, C.terracota, 2.4); ctx.restore();
    D.text(ctx, "mejor posible (" + f(S.mu[best()], 1) + ")", p2.box.x + p2.box.w - 4, p2.y(S.mu[best()]) - 5, { align: "right", size: 10.5, color: C.olivaInk, weight: 600 });
  }
  function update() {
    var s = "";
    if (!S.last) s = "Todavía no has recomendado ninguna película: todas las estimaciones valen 0 (no sabemos nada).";
    else {
      var L = S.last;
      s = "Última recomendación: <b>" + (L.explore ? "exploró" : "explotó") + "</b> → película <b>" + NAMES[L.a] + "</b>, recompensa <b>" + f(L.R) + "</b>.<br>" +
        "Q<sub>" + NAMES[L.a] + "</sub> nuevo = " + f(L.old) + " + (" + f(L.R) + " − " + f(L.old) + ")/" + L.n + " = <b>" + f(L.neu) + "</b>";
    }
    var n = S.hist.length;
    if (n) {
      var opt = S.N[best()] / n;
      s += "<br>Recomendaciones: <b>" + n + "</b> · recompensa media: <b>" + f(S.total / n) + "</b> · mejor posible: " + f(S.mu[best()], 1) + " · veces que recomendó la mejor película: <b>" + Math.round(100 * opt) + " %</b>";
    }
    out.set(s); v1.redraw(); v2.redraw();
  }
  v1.draw(drawBars); v2.draw(drawCurve); update();
});
