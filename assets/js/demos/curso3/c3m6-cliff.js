/* Experimento: SARSA (on-policy) frente a Q-learning (off-policy) en el acantilado. Misma exploración ε, mismo α;
   solo cambia el objetivo: SARSA usa la acción que de verdad va a tomar, Q-learning usa el máximo. */
Lab.register("curso3/c3m6-cliff", function (root, api) {
  var D = api.d, M = api.math;
  var R = 4, Cn = 12, START = 36, GOAL = 47, ALPHA = 0.5, EPIS = 500, SEEDS = 10;
  var S = { eps: 0.1, seed0: 1, res: null };
  var DR = [-1, 0, 1, 0], DC = [0, 1, 0, -1]; // arriba, derecha, abajo, izquierda
  function isCliff(s) { return s > 36 && s < 47; }
  function step(s, a) {
    var r = Math.floor(s / Cn), c = s % Cn, nr = r + DR[a], nc = c + DC[a];
    if (nr < 0 || nr >= R || nc < 0 || nc >= Cn) { nr = r; nc = c; }
    var s2 = nr * Cn + nc;
    if (isCliff(s2)) return { s: START, r: -100, done: false };
    return { s: s2, r: -1, done: s2 === GOAL };
  }
  function choose(Q, s, eps, rg) {
    if (rg.next() < eps) return Math.floor(rg.next() * 4);
    var m = Math.max.apply(null, Q[s]), cand = [];
    for (var a = 0; a < 4; a++) if (Q[s][a] === m) cand.push(a);
    return cand[Math.floor(rg.next() * cand.length)];
  }
  function train(alg, seed, eps) {
    var rg = api.rng(seed), Q = [], i, rew = [];
    for (i = 0; i < R * Cn; i++) Q.push([0, 0, 0, 0]);
    for (var ep = 0; ep < EPIS; ep++) {
      var s = START, a = choose(Q, s, eps, rg), tot = 0, k = 0;
      while (k++ < 400) {
        var o = step(s, a), a2 = choose(Q, o.s, eps, rg);
        var nxt = alg === "sarsa" ? Q[o.s][a2] : Math.max.apply(null, Q[o.s]);
        Q[s][a] += ALPHA * (o.r + (o.done ? 0 : nxt) - Q[s][a]);
        tot += o.r; s = o.s; a = a2;
        if (o.done) break;
      }
      rew.push(tot);
    }
    return { Q: Q, rew: rew };
  }
  function greedyPath(Q) {
    var s = START, path = [s], k = 0;
    while (s !== GOAL && k++ < 60) {
      var q = Q[s], a = q.indexOf(Math.max.apply(null, q)), o = step(s, a);
      s = o.s; path.push(s);
    }
    return { path: path, ok: s === GOAL };
  }
  function run() {
    S.res = {};
    ["qlearning", "sarsa"].forEach(function (alg) {
      var avg = new Array(EPIS).fill(0), first = null;
      for (var k = 0; k < SEEDS; k++) {
        var t = train(alg, S.seed0 * 100 + k, S.eps);
        t.rew.forEach(function (v, i) { avg[i] += v / SEEDS; });
        if (k === 0) first = t;
      }
      S.res[alg] = { avg: avg, gp: greedyPath(first.Q) };
    });
    update();
  }
  var v1 = api.view(root, { aspect: 3.1, minH: 112, maxH: 190, label: "Mundo del acantilado de 4 por 12 (los botones de cancelar suscripción, −100, son la fila de abajo) con los caminos greedy de Q-learning y de SARSA" });
  var v2 = api.view(root, { aspect: 1.9, minH: 200, maxH: 320, label: "Recompensa por episodio durante el entrenamiento para SARSA y Q-learning" });
  var p = api.plot(v2, { xr: [0, EPIS], yr: [-140, 20], xticks: 5, yticks: 4, xlabel: "episodio", ylabel: "recompensa del episodio", pad: { l: 54, r: 16, t: 10, b: 36 } });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Exploración ε durante el entrenamiento", min: 0, max: 0.3, step: 0.01, value: S.eps, fmt: function (v) { return v.toFixed(2).replace(".", ","); }, onInput: function (v) { S.eps = v; run(); } });
  ui.button("Otro entrenamiento (otras semillas)", function () { S.seed0++; run(); }, "primary");

  function smooth(a, w) { return a.map(function (_, i) { var s = 0, n = 0; for (var j = Math.max(0, i - w + 1); j <= i; j++) { s += a[j]; n++; } return s / n; }); }
  function drawGrid(ctx, w, h, C) {
    var m = 6, cw = (w - 2 * m) / Cn, ch = (h - 2 * m - 12) / R;
    for (var r = 0; r < R; r++) for (var c = 0; c < Cn; c++) {
      var s = r * Cn + c, x = m + c * cw, y = m + r * ch, fill = C.surface;
      if (isCliff(s)) fill = C.terracotaWash; else if (s === GOAL) fill = C.olivaWash; else if (s === START) fill = C.cobaltoWash;
      D.rect(ctx, x + 0.5, y + 0.5, cw - 1, ch - 1, fill, C.line, 1);
      if (r === 3) {
        var t = isCliff(s) ? "✖" : (s === GOAL ? "G" : (s === START ? "S" : ""));
        if (t) D.text(ctx, t, x + cw / 2, y + ch / 2 + 5, { align: "center", size: Math.min(14, cw * 0.55), weight: 700, color: isCliff(s) ? C.terracotaInk : C.ink });
      }
    }
    if (!S.res) return;
    function pathPts(p, off) { return p.map(function (s) { return [m + (s % Cn) * cw + cw / 2 + off, m + Math.floor(s / Cn) * ch + ch / 2 + off]; }); }
    D.path(ctx, pathPts(S.res.sarsa.gp.path, -2), C.cobalto, 3.2);
    D.path(ctx, pathPts(S.res.qlearning.gp.path, 2), C.terracota, 3.2);
    D.text(ctx, "camino greedy:  ■ Q-learning (naranja)   ■ SARSA (azul)", w / 2, h - 2, { align: "center", size: 10.5, color: C.ink2 });
  }
  function drawCurve(ctx, w, h, C) {
    p.axes(ctx);
    if (!S.res) return;
    ctx.save(); p.clip(ctx);
    D.path(ctx, smooth(S.res.sarsa.avg, 10).map(function (v, i) { return [p.x(i + 1), p.y(Math.max(v, -140))]; }), C.cobalto, 2.6);
    D.path(ctx, smooth(S.res.qlearning.avg, 10).map(function (v, i) { return [p.x(i + 1), p.y(Math.max(v, -140))]; }), C.terracota, 2.6);
    ctx.restore();
    D.text(ctx, "— SARSA (azul)", p.box.x + 8, p.box.y + 16, { size: 11.5, weight: 700, color: C.cobaltoInk });
    D.text(ctx, "— Q-learning (naranja)", p.box.x + 8, p.box.y + 33, { size: 11.5, weight: 700, color: C.terracotaInk });
  }
  function f(v, k) { return (v < 0 ? "−" : "") + Math.abs(v).toFixed(k === undefined ? 1 : k).replace(".", ","); }
  function update() {
    if (!S.res) return;
    function row(name, key) {
      var r = S.res[key], last = M.mean(r.avg.slice(EPIS - 100)), gp = r.gp;
      return "<b>" + name + "</b>: recompensa media de los últimos 100 episodios (entrenando, con ε = " + S.eps.toFixed(2).replace(".", ",") + ") = <b>" + f(last) + "</b> · camino greedy " + (gp.ok ? "de <b>" + (gp.path.length - 1) + "</b> pasos (recompensa " + f(-(gp.path.length - 1), 0) + ")" : "<span class='bad'>no llega a la meta</span>");
    }
    out.set(row("Q-learning", "qlearning") + "<br>" + row("SARSA", "sarsa") + "<br><i>Media de " + SEEDS + " semillas para la curva; el camino dibujado es el de la primera semilla.</i>");
    v1.redraw(); v2.redraw();
  }
  v1.draw(drawGrid); v2.draw(drawCurve); run();
});
