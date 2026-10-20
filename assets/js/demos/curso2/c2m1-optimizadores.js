/* Experimento: carrera de optimizadores (SGD, Momentum, RMSprop, Adam) sobre un valle estrecho y alargado.
   Coste: f(x, y) = ½·(0,25·u² + 40·v²), con (u, v) = (x, y) girados un ángulo (0° o 30°). Mínimo en (0, 0).
   Disfraz: dos «perillas» del recomendador de Netflix: w1 = peso de la popularidad (poco sensible), w2 = peso del género (muy sensible). */
Lab.register("curso2/c2m1-optimizadores", function (root, api) {
  var M = api.math, D = api.d, C0 = api.colors();
  var A = 0.25, B = 40, START = [-4, 0.8], MAXSTEPS = 250;
  var S = { lr: 0.04, beta: 0.9, theta: 0, t: 0, run: null };
  var KINDS = [["sgd", "SGD", "ink"], ["mom", "Momentum", "terracota"], ["rms", "RMSprop", "oliva"], ["adam", "Adam", "cobalto"]];

  function ang() { return S.theta * Math.PI / 180; }
  function f(p) { var c = Math.cos(ang()), s = Math.sin(ang()), u = p[0] * c + p[1] * s, v = -p[0] * s + p[1] * c; return 0.5 * (A * u * u + B * v * v); }
  function grad(p) { var c = Math.cos(ang()), s = Math.sin(ang()), u = p[0] * c + p[1] * s, v = -p[0] * s + p[1] * c; return [A * u * c - B * v * s, A * u * s + B * v * c]; }

  function init() {
    S.t = 0;
    S.run = KINDS.map(function (k) { return { id: k[0], p: START.slice(), v: [0, 0], s: [0, 0], m: [0, 0], trail: [START.slice()], dead: false }; });
  }
  function stepOne(o) {
    if (o.dead) return;
    var g = grad(o.p), i, t = S.t + 1, lr = S.lr;
    for (i = 0; i < 2; i++) {
      if (o.id === "sgd") o.p[i] -= lr * g[i];
      else if (o.id === "mom") { o.v[i] = S.beta * o.v[i] - lr * g[i]; o.p[i] += o.v[i]; }
      else if (o.id === "rms") { o.s[i] = 0.9 * o.s[i] + 0.1 * g[i] * g[i]; o.p[i] -= lr * g[i] / (Math.sqrt(o.s[i]) + 1e-7); }
      else {
        o.m[i] = 0.9 * o.m[i] + 0.1 * g[i]; o.s[i] = 0.999 * o.s[i] + 0.001 * g[i] * g[i];
        o.p[i] -= lr * (o.m[i] / (1 - Math.pow(0.9, t))) / (Math.sqrt(o.s[i] / (1 - Math.pow(0.999, t))) + 1e-7);
      }
    }
    if (!isFinite(f(o.p)) || f(o.p) > 1e7) o.dead = true;
    o.trail.push(o.p.slice());
  }
  function stepAll() { S.run.forEach(stepOne); S.t++; }

  var view = api.view(root, { aspect: 2.5, minH: 240, maxH: 380, label: "Curvas de nivel del coste de ajustar dos perillas del recomendador, con los recorridos de cuatro optimizadores" });
  var po = { xr: [-5, 5], yr: [-1.6, 1.6], xticks: 10, yticks: 4, xlabel: "perilla w₁ · popularidad (valle largo)", ylabel: "w₂ · género", pad: { l: 40, r: 12, t: 12, b: 36 }, xfmt: function (v) { return Math.round(v); }, yfmt: function (v) { return +v.toFixed(1); } };
  var plot = api.plot(view, po);
  var ui = api.controls(root);
  var table = api.table(root, ["Optimizador", "coste f", "dist. al mínimo"]);
  (function () { var tt = table.el.querySelector("table"); if (tt) tt.style.fontSize = "clamp(.72rem, 3.2vw, .9rem)"; })();   // que quepa en móvil
  var out = api.readout(root);
  out.el.style.fontSize = "clamp(.72rem, 2.7vw, .84rem)";
  ui.slider({ label: "Learning rate η (el mismo para los cuatro)", min: 0.005, max: 0.1, step: 0.005, value: S.lr, fmt: function (v) { return v.toFixed(3); }, onInput: function (v) { S.lr = v; restart(); } });
  ui.slider({ label: "β del momentum", min: 0.5, max: 0.99, step: 0.01, value: S.beta, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.beta = v; restart(); } });
  ui.segmented({ label: "Forma del valle", value: 0, options: [[0, "Alineado con los ejes"], [30, "Inclinado 30°"]], onChange: function (v) { S.theta = v; restart(); } });
  var running = false, loop = null;
  var btn = ui.button("▶ Correr la carrera", function () {
    if (running) { halt(); return; }
    if (S.t >= MAXSTEPS) restart();
    if (api.reduceMotion) { while (S.t < MAXSTEPS) stepAll(); update(); return; }
    running = true; btn.textContent = "❚❚ Pausa"; loop.start();
  }, "primary");
  ui.button("Dar 1 paso", function () { halt(); if (S.t < MAXSTEPS) stepAll(); update(); });
  ui.button("Reiniciar carrera", function () { restart(); });
  var lg = api.legend(root, KINDS.map(function (k) { return [k[2] === "ink" ? C0.ink : C0[k[2]], k[1]]; }));

  function halt() { running = false; if (loop) loop.stop(); btn.textContent = "▶ Correr la carrera"; }
  function restart() { halt(); init(); update(); }
  loop = api.loop(function () { stepAll(); stepAll(); update(); if (S.t >= MAXSTEPS) { halt(); return false; } }, { fps: 20 });

  function colorOf(C, k) { return k === "ink" ? C.ink : C[k]; }
  function draw(ctx, w, h, C) {
    var b = plot.box, k = b.h / b.w; plot.yr = [-5 * k, 5 * k];
    plot.axes(ctx); ctx.save(); plot.clip(ctx);
    var lv = [0.05, 0.25, 1, 3, 8, f(START)], c = Math.cos(ang()), s = Math.sin(ang()), i, j;
    lv.forEach(function (L, idx) {
      var pts = [];
      for (j = 0; j <= 90; j++) {
        var t = 2 * Math.PI * j / 90, u = Math.sqrt(2 * L / A) * Math.cos(t), v = Math.sqrt(2 * L / B) * Math.sin(t);
        pts.push([plot.x(u * c - v * s), plot.y(u * s + v * c)]);
      }
      D.path(ctx, pts, C.muted, idx === lv.length - 1 ? 1.4 : 1, idx === lv.length - 1 ? [4, 3] : null);
    });
    S.run.forEach(function (o, ki) {
      var col = colorOf(C, KINDS[ki][2]), pts = o.trail.map(function (q) { return [plot.x(q[0]), plot.y(q[1])]; });
      D.path(ctx, pts, col, 2);
      if (pts.length < 70) pts.forEach(function (q) { D.circle(ctx, q[0], q[1], 2.2, col); });
    });
    ctx.restore();
    D.circle(ctx, plot.x(0), plot.y(0), 5, null, C.olivaInk, 2);
    D.text(ctx, "ajuste ideal", plot.x(0) + 8, plot.y(0) + 18, { size: 11, color: C.olivaInk, weight: 600 });
    D.text(ctx, "inicio", plot.x(START[0]) + 6, plot.y(START[1]) - 10, { size: 11, color: C.ink2, weight: 600 });
    S.run.forEach(function (o, ki) {
      if (o.dead) return;
      var q = o.p; if (plot.inside(plot.x(q[0]), plot.y(q[1]))) D.circle(ctx, plot.x(q[0]), plot.y(q[1]), 6, colorOf(C, KINDS[ki][2]), C.paper, 2);
    });
  }

  function update() {
    var C = api.colors(), fs = S.run.map(function (o) { return o.dead ? Infinity : f(o.p); }), best = Math.min.apply(null, fs);
    table.set(S.run.map(function (o, ki) {
      var v = fs[ki], isBest = v === best && S.t > 0;
      return ["<span style='white-space:nowrap;color:" + (KINDS[ki][2] === "ink" ? C.ink : C[KINDS[ki][2]]) + ";font-weight:700'>● " + KINDS[ki][1] + "</span>",
        o.dead ? "<span class='bad'>diverge</span>" : (isBest ? "<b>" + v.toPrecision(3) + "</b>" : v.toPrecision(3)),
        o.dead ? "—" : Math.hypot(o.p[0], o.p[1]).toFixed(2)];
    }));
    out.set("Paso <b>" + S.t + "</b> de " + MAXSTEPS + " · coste inicial f = " + f(START).toFixed(2) + " (el mínimo vale 0).<br>" +
      (S.t === 0 ? "Pulsa «Correr la carrera». Todos salen del mismo punto con el mismo learning rate." :
        "Va ganando: <b>" + KINDS[fs.indexOf(best)][1] + "</b>. SGD zigzaguea en la dirección estrecha y avanza despacio por la larga; Momentum acumula velocidad; RMSprop y Adam dan pasos de tamaño ≈ η en cada coordenada.") +
      (S.run.some(function (o) { return o.dead; }) ? "<br><span class='bad'>Algún optimizador ha divergido: con este η el paso es demasiado grande para la dirección estrecha.</span>" : ""));
    view.redraw();
  }
  init(); view.draw(draw); update();
  return { destroy: function () { halt(); } };
});
