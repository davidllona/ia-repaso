/* Experimento: la ecuación de Bellman de optimalidad aplicada una y otra vez (iteración de valor) en el mundo de cuadrículas.
   V(s) ← máx_a [ r + γ·V(s′) ]. Cada barrido propaga el valor un paso hacia atrás desde la meta. Toca una casilla para ver sus cuatro opciones. */
Lab.register("curso3/c3m6-valor-iter", function (root, api) {
  var D = api.d, M = api.math;
  var COLS = 4, ROWS = 3, WALL = [1, 1], GOAL = [0, 3], PIT = [1, 3];
  var DIRS = [[-1, 0], [0, 1], [1, 0], [0, -1]], ARROW = ["↑", "→", "↓", "←"], NAME = ["arriba", "derecha", "abajo", "izquierda"];
  var S = { g: 0.9, V: [], sweeps: 0, sel: [2, 0], delta: null };
  function zeros() { var v = []; for (var r = 0; r < ROWS; r++) { v.push([]); for (var c = 0; c < COLS; c++) v[r].push(0); } return v; }
  S.V = zeros();
  function isWall(r, c) { return r === WALL[0] && c === WALL[1]; }
  function term(r, c) { return (r === GOAL[0] && c === GOAL[1]) || (r === PIT[0] && c === PIT[1]); }
  function next(r, c, a) {
    var nr = r + DIRS[a][0], nc = c + DIRS[a][1];
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || isWall(nr, nc)) { nr = r; nc = c; }
    return [nr, nc];
  }
  function reward(n) { return (n[0] === GOAL[0] && n[1] === GOAL[1]) ? 10 : ((n[0] === PIT[0] && n[1] === PIT[1]) ? -10 : -1); }
  function qvals(V, r, c) {
    return [0, 1, 2, 3].map(function (a) { var n = next(r, c, a); return reward(n) + S.g * (term(n[0], n[1]) ? 0 : V[n[0]][n[1]]); });
  }
  function sweep() {
    var NV = zeros(), delta = 0;
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
      if (isWall(r, c) || term(r, c)) continue;
      NV[r][c] = Math.max.apply(null, qvals(S.V, r, c)); delta = Math.max(delta, Math.abs(NV[r][c] - S.V[r][c]));
    }
    S.V = NV; S.sweeps++; S.delta = delta; return delta;
  }
  var view = api.view(root, { aspect: 1.5, minH: 230, maxH: 360, label: "Mundo de cuadrículas con el valor V de cada casilla y la mejor acción según Bellman" });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Factor de descuento γ", min: 0.5, max: 0.99, step: 0.01, value: S.g, fmt: function (v) { return v.toFixed(2).replace(".", ","); }, onInput: function (v) { S.g = v; S.V = zeros(); S.sweeps = 0; S.delta = null; update(); } });
  ui.button("Un barrido", function () { sweep(); update(); }, "primary");
  ui.button("Barrer hasta converger", function () { var k = 0; while (sweep() > 1e-4 && k++ < 500); update(); });
  ui.button("Volver a V = 0", function () { S.V = zeros(); S.sweeps = 0; S.delta = null; update(); }, "warm");

  function geom(w, h) { var m = 8; return { m: m, cw: (w - 2 * m) / COLS, ch: (h - 2 * m) / ROWS }; }
  view.pointer({ down: function (x, y) {
    var g = geom(view.w, view.h), c = Math.floor((x - g.m) / g.cw), r = Math.floor((y - g.m) / g.ch);
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS && !isWall(r, c) && !term(r, c)) { S.sel = [r, c]; update(); }
  } });
  function draw(ctx, w, h, C) {
    var g = geom(w, h), mx = 10, fs = Math.min(15, g.cw / 5.2);
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
      var x = g.m + c * g.cw, y = g.m + r * g.ch, fill = C.surface;
      if (isWall(r, c)) { D.rect(ctx, x + 1, y + 1, g.cw - 2, g.ch - 2, C.line, C.ink, 1.2); D.text(ctx, "muro", x + g.cw / 2, y + g.ch / 2 + 4, { align: "center", size: 11, color: C.muted }); continue; }
      if (term(r, c)) {
        var good = r === GOAL[0] && c === GOAL[1];
        D.rect(ctx, x + 1, y + 1, g.cw - 2, g.ch - 2, good ? C.olivaWash : C.terracotaWash, C.ink, 1.2);
        D.text(ctx, good ? "META" : "HOYO", x + g.cw / 2, y + g.ch / 2 - 2, { align: "center", size: fs, weight: 700, color: good ? C.olivaInk : C.terracotaInk });
        D.text(ctx, good ? "+10" : "−10", x + g.cw / 2, y + g.ch / 2 + fs + 2, { align: "center", size: fs, color: good ? C.olivaInk : C.terracotaInk, mono: true });
        continue;
      }
      var v = S.V[r][c], t = M.clamp(Math.abs(v) / mx, 0, 1);
      D.rect(ctx, x + 1, y + 1, g.cw - 2, g.ch - 2, C.surface, C.ink, 1.2);
      ctx.save(); ctx.globalAlpha = 0.12 + 0.55 * t; ctx.fillStyle = v >= 0 ? C.oliva : C.terracota; ctx.fillRect(x + 1, y + 1, g.cw - 2, g.ch - 2); ctx.restore();
      D.text(ctx, (v < 0 ? "−" : "") + Math.abs(v).toFixed(2).replace(".", ","), x + g.cw / 2, y + g.ch / 2 - 2, { align: "center", size: fs, weight: 700, mono: true, color: C.ink });
      if (S.sweeps > 0) {
        var q = qvals(S.V, r, c), best = q.indexOf(Math.max.apply(null, q));
        D.text(ctx, ARROW[best], x + g.cw / 2, y + g.ch / 2 + fs + 8, { align: "center", size: fs + 5, weight: 700, color: C.ink2 });
      }
      if (S.sel[0] === r && S.sel[1] === c) D.rect(ctx, x + 3, y + 3, g.cw - 6, g.ch - 6, null, C.cobalto, 3);
    }
  }
  function f(v) { return (v < 0 ? "−" : "") + Math.abs(v).toFixed(2).replace(".", ","); }
  function update() {
    var r = S.sel[0], c = S.sel[1], q = qvals(S.V, r, c), best = Math.max.apply(null, q), s = "";
    s += "Barridos: <b>" + S.sweeps + "</b>" + (S.delta !== null ? " · cambio máximo en el último barrido: <b>" + (S.delta < 1e-4 ? "0" : f(S.delta)) + "</b>" + (S.delta < 1e-4 ? " <span class='good'>(convergido: V = V*)</span>" : "") : "") + "<br>";
    s += "Casilla seleccionada <b>(" + r + "," + c + ")</b>: ";
    s += [0, 1, 2, 3].map(function (a) {
      var n = next(r, c, a), rew = reward(n), vn = term(n[0], n[1]) ? 0 : S.V[n[0]][n[1]];
      var txt = ARROW[a] + " " + (rew < 0 ? "−" : "") + Math.abs(rew) + " + " + S.g.toFixed(2).replace(".", ",") + "·" + f(vn) + " = " + f(q[a]);
      return q[a] === best ? "<b>" + txt + "</b>" : txt;
    }).join(" · ");
    s += "<br>Ahora V(s) = <b>" + f(S.V[r][c]) + "</b>. El máximo de esas cuatro opciones es <b>" + f(best) + "</b> (acción " + NAME[q.indexOf(best)] + "): eso es lo que escribirá el próximo barrido" + (Math.abs(S.V[r][c] - best) < 1e-4 ? " (ya coincide: aquí V no cambia)." : ".");
    out.set(s); view.redraw();
  }
  view.draw(draw); update();
});
