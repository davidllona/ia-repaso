/* Experimento: Q-learning tabular en un mundo de cuadrículas, paso a paso. Cada casilla muestra sus 4 valores Q(s,a);
   al dar un paso se ve la ecuación TD con todas las cuentas: objetivo = r + γ·máx Q(s′,·), error TD y nuevo Q. */
Lab.register("curso3/c3m6-q-gridworld", function (root, api) {
  var D = api.d, M = api.math;
  var COLS = 4, ROWS = 3, WALL = [1, 1], GOAL = [0, 3], PIT = [1, 3], START = [2, 0];
  var DIRS = [[-1, 0], [0, 1], [1, 0], [0, -1]], ARROW = ["↑", "→", "↓", "←"];
  var S = { alpha: 0.5, gamma: 0.9, eps: 0.3, Q: null, pos: START.slice(), steps: 0, eps_n: 0, last: null, lastRet: null, ret: 0, fresh: true, rng: api.rng(21), Qs: null };

  function isWall(r, c) { return r === WALL[0] && c === WALL[1]; }
  function term(r, c) { return (r === GOAL[0] && c === GOAL[1]) || (r === PIT[0] && c === PIT[1]); }
  function next(r, c, a) {
    var nr = r + DIRS[a][0], nc = c + DIRS[a][1];
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || isWall(nr, nc)) { nr = r; nc = c; }
    return [nr, nc];
  }
  function reward(n) { return (n[0] === GOAL[0] && n[1] === GOAL[1]) ? 10 : ((n[0] === PIT[0] && n[1] === PIT[1]) ? -10 : -1); }
  function zerosQ() { var q = []; for (var r = 0; r < ROWS; r++) { q.push([]); for (var c = 0; c < COLS; c++) q[r].push([0, 0, 0, 0]); } return q; }
  function optimal() {
    var Q = zerosQ(), it, r, c, a;
    for (it = 0; it < 300; it++) for (r = 0; r < ROWS; r++) for (c = 0; c < COLS; c++) {
      if (isWall(r, c) || term(r, c)) continue;
      for (a = 0; a < 4; a++) { var n = next(r, c, a); Q[r][c][a] = reward(n) + (term(n[0], n[1]) ? 0 : S.gamma * Math.max.apply(null, Q[n[0]][n[1]])); }
    }
    return Q;
  }
  function resetAll() { S.Q = zerosQ(); S.pos = START.slice(); S.steps = 0; S.eps_n = 0; S.last = null; S.lastRet = null; S.ret = 0; S.fresh = true; S.Qs = optimal(); }
  resetAll();

  var view = api.view(root, { aspect: 1.4, minH: 250, maxH: 400, label: "Pantalla de inicio de StreamFlix en cuadrícula con la tabla Q: cuatro valores por casilla, uno por botón del mando" });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Tasa de aprendizaje α", min: 0.05, max: 1, step: 0.05, value: S.alpha, fmt: function (v) { return v.toFixed(2).replace(".", ","); }, onInput: function (v) { S.alpha = v; update(); } });
  ui.slider({ label: "Descuento γ", min: 0, max: 0.99, step: 0.01, value: S.gamma, fmt: function (v) { return v.toFixed(2).replace(".", ","); }, onInput: function (v) { S.gamma = v; S.Qs = optimal(); update(); } });
  ui.slider({ label: "Exploración ε", min: 0, max: 1, step: 0.05, value: S.eps, fmt: function (v) { return v.toFixed(2).replace(".", ","); }, onInput: function (v) { S.eps = v; update(); } });
  ui.button("Dar un paso", function () { step(); update(); }, "primary");
  ui.button("Un episodio entero", function () { episode(); update(); });
  ui.button("100 episodios", function () { for (var i = 0; i < 100; i++) episode(); update(); });
  ui.button("Vaciar la tabla Q", function () { resetAll(); update(); }, "warm");

  function greedy(r, c) {
    var q = S.Q[r][c], m = Math.max.apply(null, q), cand = [];
    for (var a = 0; a < 4; a++) if (q[a] === m) cand.push(a);
    return cand[Math.floor(S.rng.next() * cand.length)];
  }
  function step() {
    if (S.fresh) { S.pos = START.slice(); S.ret = 0; S.fresh = false; }
    var r = S.pos[0], c = S.pos[1], explore = S.rng.next() < S.eps;
    var a = explore ? Math.floor(S.rng.next() * 4) : greedy(r, c);
    var n = next(r, c, a), rew = reward(n), tm = term(n[0], n[1]);
    var maxNext = tm ? 0 : Math.max.apply(null, S.Q[n[0]][n[1]]);
    var old = S.Q[r][c][a], target = rew + S.gamma * maxNext, delta = target - old;
    S.Q[r][c][a] = old + S.alpha * delta;
    S.last = { s: [r, c], a: a, r: rew, s2: n, term: tm, maxNext: maxNext, old: old, target: target, delta: delta, neu: S.Q[r][c][a], explore: explore };
    S.pos = n; S.steps++; S.ret += rew;
    if (tm) { S.fresh = true; S.eps_n++; S.lastRet = S.ret; }
  }
  function episode() { var k = 0; do { step(); k++; } while (!S.fresh && k < 200); }

  function geom(w, h) { var m = 6; return { m: m, cw: (w - 2 * m) / COLS, ch: (h - 2 * m) / ROWS }; }
  function fv(v) { return (v < -0.005 ? "−" : "") + Math.abs(v).toFixed(1).replace(".", ","); }
  function draw(ctx, w, h, C) {
    var g = geom(w, h), fs = Math.max(8.5, Math.min(11.5, g.cw / 7.5));
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
      var x = g.m + c * g.cw, y = g.m + r * g.ch, cx = x + g.cw / 2, cy = y + g.ch / 2;
      if (isWall(r, c)) { D.rect(ctx, x + 1, y + 1, g.cw - 2, g.ch - 2, C.line, C.ink, 1.2); D.text(ctx, "anuncio", cx, cy + 4, { align: "center", size: 11, color: C.muted }); continue; }
      if (term(r, c)) {
        var good = r === GOAL[0] && c === GOAL[1];
        D.rect(ctx, x + 1, y + 1, g.cw - 2, g.ch - 2, good ? C.olivaWash : C.terracotaWash, C.ink, 1.2);
        D.text(ctx, good ? "TU PELI" : "SALIR", cx, cy - 2, { align: "center", size: 13, weight: 700, color: good ? C.olivaInk : C.terracotaInk });
        D.text(ctx, good ? "+10" : "−10", cx, cy + 15, { align: "center", size: 13, mono: true, color: good ? C.olivaInk : C.terracotaInk });
        continue;
      }
      var q = S.Q[r][c], mx = Math.max.apply(null, q), mn = Math.min.apply(null, q);
      D.rect(ctx, x + 1, y + 1, g.cw - 2, g.ch - 2, C.surface, C.ink, 1.2);
      // diagonales que separan las 4 acciones
      D.line(ctx, x + 1, y + 1, x + g.cw - 1, y + g.ch - 1, C.line, 1); D.line(ctx, x + g.cw - 1, y + 1, x + 1, y + g.ch - 1, C.line, 1);
      var any = mx !== 0 || mn !== 0, best = -1;
      if (any) { best = q.indexOf(mx); }
      var pos = [[cx, y + fs + 4, "center"], [x + g.cw - 5, cy + 4, "right"], [cx, y + g.ch - 7, "center"], [x + 5, cy + 4, "left"]];
      for (var a = 0; a < 4; a++) {
        var isLast = S.last && S.last.s[0] === r && S.last.s[1] === c && S.last.a === a;
        var col = q[a] > 0.005 ? C.olivaInk : (q[a] < -0.005 ? C.terracotaInk : C.muted);
        if (isLast) { var tw = 30; D.rect(ctx, pos[a][2] === "center" ? pos[a][0] - tw / 2 : (pos[a][2] === "right" ? pos[a][0] - tw : pos[a][0] - 2), pos[a][1] - fs, tw, fs + 5, C.markerWash, C.marker, 1.5); }
        D.text(ctx, fv(q[a]), pos[a][0], pos[a][1], { align: pos[a][2], size: fs, mono: true, color: col, weight: (a === best || isLast) ? 700 : 400 });
      }
      if (any) D.text(ctx, ARROW[best], cx, cy + 7, { align: "center", size: Math.min(24, g.cw / 3.6), weight: 700, color: C.cobaltoInk });
    }
    // agente
    var ar = S.fresh ? START : S.pos, ax = g.m + ar[1] * g.cw + g.cw / 2, ay = g.m + ar[0] * g.ch + g.ch / 2;
    D.circle(ctx, ax, ay, Math.min(g.cw, g.ch) * 0.13, C.terracota, C.ink, 2);
  }
  function f(v, k) { return (v < -0.0005 ? "−" : "") + Math.abs(v).toFixed(k === undefined ? 2 : k).replace(".", ","); }
  function update() {
    var s = "", L = S.last;
    if (!L) s = "La tabla Q empieza vacía (todo 0): el agente (el cursor del mando) aún no sabe nada. Pulsa «Dar un paso».<br>";
    else {
      s += "<b>Paso " + S.steps + "</b> (" + (L.explore ? "exploró al azar" : "explotó: la mejor acción conocida") + "): en s=(" + L.s + ") hizo <b>" + ARROW[L.a] + "</b> → r = <b>" + (L.r > 0 ? "+" : "−") + Math.abs(L.r) + "</b>, s′=(" + L.s2 + ")" + (L.term ? " <i>(final)</i>" : "") + "<br>";
      s += "objetivo = r + γ·máx Q(s′,·) = " + f(L.r, 0) + " + " + f(S.gamma) + "·" + f(L.maxNext) + " = <b>" + f(L.target) + "</b><br>";
      s += "error TD = objetivo − Q(s,a) = " + f(L.target) + " − " + f(L.old) + " = <b>" + f(L.delta) + "</b><br>";
      s += "Q(s,a) nuevo = " + f(L.old) + " + " + f(S.alpha) + "·" + f(L.delta) + " = <b>" + f(L.neu) + "</b><br>";
    }
    var err = 0, n = 0;
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) { if (isWall(r, c) || term(r, c)) continue; for (var a = 0; a < 4; a++) { err += Math.abs(S.Q[r][c][a] - S.Qs[r][c][a]); n++; } }
    s += "Episodios terminados: <b>" + S.eps_n + "</b> · pasos: <b>" + S.steps + "</b>" + (S.lastRet !== null ? " · retorno del último episodio: <b>" + S.lastRet + "</b>" : "") + " · distancia media a Q* (la solución exacta): <b>" + f(err / n) + "</b>";
    out.set(s); view.redraw();
  }
  view.draw(draw); update();
});
