/* Experimento: elige optimizador(es) y mira cómo bajan por una superficie 2D (un valle curvo tipo «plátano»).
   f(x, y) = (1 − x)² + 3·(y − x²)². Mínimo en (1, 1). Se puede mover el punto de partida arrastrando, cambiar el learning rate
   y añadir ruido al gradiente (como el ruido del mini-batch). Las reglas son las de Keras: SGD, SGD+momentum 0,9,
   Nesterov, RMSprop (rho 0,9) y Adam (β1 0,9; β2 0,999). */
Lab.register("curso3/c3m5-optimizadores", function (root, api) {
  var D = api.d, C0 = api.colors();
  var A = 3, MAXSTEPS = 400;
  var KINDS = [["sgd", "SGD", "ink"], ["mom", "SGD + momentum", "terracota"], ["nes", "Nesterov", "marker"], ["rms", "RMSprop", "oliva"], ["adam", "Adam", "cobalto"]];
  var S = { lrExp: -2, noise: 0, start: [-1.5, 2.4], on: { sgd: true, mom: true, nes: false, rms: false, adam: true }, t: 0, run: null };
  function f(x, y) { return (1 - x) * (1 - x) + A * (y - x * x) * (y - x * x); }
  function grad(x, y) { return [-2 * (1 - x) - 4 * A * x * (y - x * x), 2 * A * (y - x * x)]; }
  function lr() { return Math.pow(10, S.lrExp); }

  function init() {
    S.t = 0;
    S.run = KINDS.map(function (k) { return { id: k[0], p: S.start.slice(), v: [0, 0], s: [0, 0], m: [0, 0], trail: [S.start.slice()], dead: false, R: api.rng(11) }; });
  }
  function stepOne(o) {
    if (o.dead) return;
    var g = grad(o.p[0], o.p[1]), t = S.t + 1, i, L = lr();
    for (i = 0; i < 2; i++) g[i] += S.noise * o.R.normal(0, 1);
    for (i = 0; i < 2; i++) {
      if (o.id === "sgd") o.p[i] -= L * g[i];
      else if (o.id === "mom") { o.v[i] = 0.9 * o.v[i] - L * g[i]; o.p[i] += o.v[i]; }
      else if (o.id === "nes") { o.v[i] = 0.9 * o.v[i] - L * g[i]; o.p[i] += 0.9 * o.v[i] - L * g[i]; }
      else if (o.id === "rms") { o.s[i] = 0.9 * o.s[i] + 0.1 * g[i] * g[i]; o.p[i] -= L * g[i] / (Math.sqrt(o.s[i]) + 1e-7); }
      else {
        o.m[i] = 0.9 * o.m[i] + 0.1 * g[i]; o.s[i] = 0.999 * o.s[i] + 0.001 * g[i] * g[i];
        o.p[i] -= L * (o.m[i] / (1 - Math.pow(0.9, t))) / (Math.sqrt(o.s[i] / (1 - Math.pow(0.999, t))) + 1e-7);
      }
    }
    if (!isFinite(o.p[0]) || !isFinite(o.p[1]) || Math.abs(o.p[0]) > 1e3 || Math.abs(o.p[1]) > 1e3) o.dead = true;
    o.trail.push(o.p.slice());
  }
  function stepAll() { S.run.forEach(function (o) { if (S.on[o.id]) stepOne(o); }); S.t++; }

  var view = api.view(root, { aspect: 1.9, minH: 250, maxH: 400, drag: true, label: "Curvas de nivel de un valle curvo con los recorridos de los optimizadores elegidos" });
  var plot = api.plot(view, { xr: [-2, 2], yr: [-1, 3], xticks: 4, yticks: 4, xlabel: "peso w₁", ylabel: "w₂", pad: { l: 40, r: 12, t: 12, b: 36 } });
  var ui = api.controls(root);
  ui.slider({ label: "Learning rate η (el mismo para todos)", min: -3, max: -0.7, step: 0.05, value: S.lrExp, fmt: function (v) { return Math.pow(10, v).toFixed(3); }, onInput: function (v) { S.lrExp = v; restart(); } });
  ui.slider({ label: "Ruido del gradiente (como un mini-batch pequeño)", min: 0, max: 3, step: 0.25, value: S.noise, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.noise = v; restart(); } });
  KINDS.forEach(function (k) {
    ui.toggle({ label: k[1], value: S.on[k[0]], onChange: function (v) { S.on[k[0]] = v; restart(); } });
  });
  var running = false, loop = null;
  var btn = ui.button("▶ Correr", function () {
    if (running) { halt(); return; }
    if (S.t >= MAXSTEPS) restart();
    if (api.reduceMotion) { while (S.t < MAXSTEPS) stepAll(); update(); return; }
    running = true; btn.textContent = "❚❚ Pausa"; loop.start();
  }, "primary");
  ui.button("Dar 1 paso", function () { halt(); if (S.t < MAXSTEPS) stepAll(); update(); });
  ui.button("Reiniciar", function () { restart(); });
  api.legend(root, KINDS.map(function (k) { return [k[2] === "ink" ? C0.ink : C0[k[2]], k[1]]; }));
  var table = api.table(root, ["Optimizador", "f(w)", "dist.", "estado"]);
  var out = api.readout(root);
  function halt() { running = false; if (loop) loop.stop(); btn.textContent = "▶ Correr"; }
  function restart() { halt(); init(); update(); }
  loop = api.loop(function () { stepAll(); stepAll(); stepAll(); update(); if (S.t >= MAXSTEPS) { halt(); return false; } }, { fps: 24 });

  view.pointer({
    down: function (px, py) { setStart(px, py); }, drag: function (px, py) { setStart(px, py); }
  });
  function setStart(px, py) {
    if (!plot.inside(px, py)) return;
    S.start = [Math.round(plot.ix(px) * 20) / 20, Math.round(plot.iy(py) * 20) / 20]; restart();
  }

  var bg = null;
  function paintBackground(ctx, C) {
    var b = plot.box, nx = Math.max(40, Math.round(b.w / 5)), ny = Math.max(24, Math.round(b.h / 5)), cw = b.w / nx, ch = b.h / ny, i, j;
    for (i = 0; i < nx; i++) for (j = 0; j < ny; j++) {
      var v = f(plot.ix(b.x + (i + 0.5) * cw), plot.iy(b.y + (j + 0.5) * ch));
      var lvl = Math.floor(Math.log(v + 0.02) / Math.log(2.2) + 4);
      lvl = Math.max(0, Math.min(10, lvl));
      var x0 = Math.round(b.x + i * cw), x1 = Math.round(b.x + (i + 1) * cw), y0 = Math.round(b.y + j * ch), y1 = Math.round(b.y + (j + 1) * ch);
      ctx.globalAlpha = 0.05 + 0.055 * lvl; ctx.fillStyle = C.cobalto; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    }
    ctx.globalAlpha = 1;
  }
  function draw(ctx, w, h, C) {
    plot.axes(ctx);
    ctx.save(); plot.clip(ctx);
    paintBackground(ctx, C);
    S.run.forEach(function (o, idx) {
      if (!S.on[o.id]) return;
      var col = KINDS[idx][2] === "ink" ? C.ink : C[KINDS[idx][2]], pts = [], i;
      for (i = 0; i < o.trail.length; i++) pts.push([plot.x(o.trail[i][0]), plot.y(o.trail[i][1])]);
      D.path(ctx, pts, col, 2);
      var last = o.trail[o.trail.length - 1];
      if (!o.dead) D.circle(ctx, plot.x(last[0]), plot.y(last[1]), 4.5, col, C.paper, 1.5);
    });
    ctx.restore();
    D.circle(ctx, plot.x(1), plot.y(1), 6, null, C.ink, 2);
    D.text(ctx, "mínimo", plot.x(1) + 9, plot.y(1) + 4, { size: 11, weight: 600, color: C.ink });
    D.circle(ctx, plot.x(S.start[0]), plot.y(S.start[1]), 5, C.paper, C.ink, 2);
    D.text(ctx, "inicio (arrástralo)", plot.x(S.start[0]) + 9, plot.y(S.start[1]) - 7, { size: 11, color: C.ink2 });
  }
  init();
  view.draw(draw);

  function update() {
    var rows = [];
    S.run.forEach(function (o, idx) {
      if (!S.on[o.id]) return;
      var p = o.p, fv = f(p[0], p[1]), d = Math.sqrt((p[0] - 1) * (p[0] - 1) + (p[1] - 1) * (p[1] - 1));
      var st = o.dead ? "<span class='bad'>diverge</span>" : (d < 0.05 ? "<span class='good'>llegó</span>" : "en camino");
      rows.push(["<b>" + KINDS[idx][1] + "</b>", o.dead ? "—" : fv.toFixed(4), o.dead ? "—" : d.toFixed(3), st]);
    });
    table.set(rows);
    out.set("Paso <b>" + S.t + "</b> de " + MAXSTEPS + " · η = <b>" + lr().toFixed(3) + "</b> · ruido = <b>" + S.noise.toFixed(2) + "</b> · inicio = (" + S.start[0].toFixed(2) + ", " + S.start[1].toFixed(2) + ")");
    view.redraw();
  }
  update();
});
