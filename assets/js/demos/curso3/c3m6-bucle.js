/* Experimento: el bucle agente-entorno a mano. Tú eres el agente (el cursor del mando sobre la pantalla de inicio de StreamFlix, una cuadrícula de carátulas): eliges una acción, el entorno
   devuelve un nuevo estado y una recompensa, y el retorno (suma de recompensas) se va acumulando. */
Lab.register("curso3/c3m6-bucle", function (root, api) {
  var D = api.d, M = api.math;
  var COLS = 4, ROWS = 3, GAMMA = 0.9;
  var WALL = [1, 1], GOAL = [0, 3], PIT = [1, 3], START = [2, 0];
  var DIRS = [[-1, 0], [0, 1], [1, 0], [0, -1]], ARROW = ["↑", "→", "↓", "←"], NAME = ["arriba", "derecha", "abajo", "izquierda"];
  var rnd = api.rng(7);
  var S = { pos: START.slice(), t: 0, G: 0, Gd: 0, path: [START.slice()], done: false, last: null, hist: [], slip: false, ep: 1 };

  var view = api.view(root, { aspect: 1.5, minH: 230, maxH: 360, label: "Pantalla de inicio de StreamFlix en cuadrícula de 4 por 3: el cursor parte de abajo a la izquierda, tu película da +10 y el botón Salir −10" });
  var ui = api.controls(root);
  var out = api.readout(root);
  var tbl = api.table(root, ["t", "s", "a", "r", "s′"]);

  function isWall(r, c) { return r === WALL[0] && c === WALL[1]; }
  function move(pos, a) {
    var r = pos[0] + DIRS[a][0], c = pos[1] + DIRS[a][1];
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS || isWall(r, c)) return pos.slice();
    return [r, c];
  }
  function act(a) {
    if (S.done) return;
    var real = a;
    if (S.slip) { var u = rnd.next(); if (u < 0.1) real = (a + 1) % 4; else if (u < 0.2) real = (a + 3) % 4; }
    var from = S.pos.slice(), to = move(S.pos, real), r = -1;
    if (to[0] === GOAL[0] && to[1] === GOAL[1]) { r = 10; S.done = true; }
    else if (to[0] === PIT[0] && to[1] === PIT[1]) { r = -10; S.done = true; }
    S.Gd += Math.pow(GAMMA, S.t) * r; S.G += r; S.t++;
    S.pos = to; S.path.push(to.slice());
    S.last = { from: from, a: a, real: real, r: r, to: to };
    S.hist.push([S.t, "(" + from[0] + "," + from[1] + ")", ARROW[a] + (real !== a ? " <span class='bad'>(falló: " + ARROW[real] + ")</span>" : ""), (r > 0 ? "+" : "") + r, "(" + to[0] + "," + to[1] + ")" + (S.done ? " <b>fin</b>" : "")]);
    update();
  }
  function reset() {
    S.pos = START.slice(); S.t = 0; S.G = 0; S.Gd = 0; S.path = [START.slice()]; S.done = false; S.last = null; S.hist = []; S.ep++;
    update();
  }
  ["↑ arriba", "→ derecha", "↓ abajo", "← izquierda"].forEach(function (t, i) { ui.button(t, function () { act(i); }, "primary"); });
  ui.button("Nuevo episodio", reset, "warm");
  ui.toggle({ label: "Mando con fallos (20 % de pulsar otra dirección)", value: false, onChange: function (v) { S.slip = v; reset(); } });

  function geom(w, h) {
    var m = 8, cw = (w - 2 * m) / COLS, ch = (h - 2 * m - 16) / ROWS;
    return { m: m, cw: cw, ch: ch };
  }
  function draw(ctx, w, h, C) {
    var g = geom(w, h), r, c;
    for (r = 0; r < ROWS; r++) for (c = 0; c < COLS; c++) {
      var x = g.m + c * g.cw, y = g.m + r * g.ch, fill = C.surface, lab = null, col = C.ink2;
      if (isWall(r, c)) { fill = C.line; lab = "anuncio"; col = C.muted; }
      else if (r === GOAL[0] && c === GOAL[1]) { fill = C.olivaWash; lab = "TU PELI +10"; col = C.olivaInk; }
      else if (r === PIT[0] && c === PIT[1]) { fill = C.terracotaWash; lab = "SALIR −10"; col = C.terracotaInk; }
      else if (r === START[0] && c === START[1]) { lab = "inicio"; col = C.muted; }
      D.rect(ctx, x + 1, y + 1, g.cw - 2, g.ch - 2, fill, C.ink, 1.2);
      if (lab) D.text(ctx, lab, x + g.cw / 2, y + 15, { align: "center", size: Math.min(12, g.cw / 7), weight: 600, color: col });
      D.text(ctx, r + "," + c, x + 5, y + g.ch - 7, { size: 9.5, color: C.muted, mono: true });
    }
    // rastro
    var pts = S.path.map(function (p) { return [g.m + p[1] * g.cw + g.cw / 2, g.m + p[0] * g.ch + g.ch / 2]; });
    D.path(ctx, pts, C.cobalto, 3);
    pts.forEach(function (p, i) { if (i < pts.length - 1) D.circle(ctx, p[0], p[1], 3, C.cobalto); });
    var ap = pts[pts.length - 1], rad = Math.min(g.cw, g.ch) * 0.2;
    D.circle(ctx, ap[0], ap[1], rad, C.terracota, C.ink, 2);
    D.text(ctx, "naranja = cursor · cada pulsación −1 · casilla (fila,col)", w / 2, h - 5, { align: "center", size: 10.5, color: C.muted });
  }
  function update() {
    var s = "";
    if (S.t === 0) s = "Episodio <b>" + S.ep + "</b>: el agente (el cursor) está en el estado <b>(2,0)</b>. Elige una acción con los botones.";
    else {
      var L = S.last;
      s = "Episodio <b>" + S.ep + "</b> · paso <b>" + S.t + "</b>: en (" + L.from + ") hizo <b>" + NAME[L.a] + "</b>" + (L.real !== L.a ? " (el botón falló y fue " + NAME[L.real] + ")" : "") + " → recibió <b>r = " + L.r + "</b> y pasó a (" + L.to + ").";
    }
    s += "<br>Retorno sin descontar G = <b>" + S.G + "</b> · retorno descontado (γ = 0,9) = <b>" + S.Gd.toFixed(2).replace(".", ",") + "</b>";
    if (S.done) s += "<br><span class='" + (S.G > 0 ? "good" : "bad") + "'>Episodio terminado: " + (S.pos[0] === GOAL[0] && S.pos[1] === GOAL[1] ? "llegaste a tu película." : "pulsaste «Salir».") + "</span> Pulsa «Nuevo episodio».";
    out.set(s);
    tbl.set(S.hist.slice(-6));
    view.redraw();
  }
  view.draw(draw); update();
});
