/* Experimento: una mini red (1 entrada → 16 tanh → 2 salidas) aprende Q en un pasillo de 8 casillas con la meta (+10) a la derecha.
   Se puede activar/desactivar el replay buffer y la red objetivo, y subir el learning rate hasta que todo se desestabilice. */
Lab.register("curso3/c3m6-dqn-mini", function (root, api) {
  var D = api.d, M = api.math;
  var N = 8, H = 16, GAMMA = 0.9, CAP = 500, BATCH = 16, EPS = 0.3, REC = 20, MAXH = 6000;
  var S = { replay: true, target: false, lr: 0.3, sync: 100, steps: 0, hist: [] };
  var net, tgt, buf, pos, env, rg, Qs;
  function trueQ() {
    var V = [], Q = [], s, it;
    for (s = 0; s < N; s++) { V.push(0); Q.push([0, 0]); }
    for (it = 0; it < 200; it++) for (s = 0; s < N - 1; s++) for (var a = 0; a < 2; a++) {
      var s2 = a === 1 ? s + 1 : Math.max(0, s - 1), r = s2 === N - 1 ? 10 : -1;
      Q[s][a] = r + (s2 === N - 1 ? 0 : GAMMA * Math.max(Q[s2][0], Q[s2][1]));
    }
    return Q;
  }
  Qs = trueQ();
  function init() {
    rg = api.rng(31 + (S.seedBump || 0));
    function nr(sc) { return rg.range(-sc, sc); }
    net = { W1: [], b1: [], W2: [[], []], b2: [0, 0] };
    for (var i = 0; i < H; i++) { net.W1.push(nr(1)); net.b1.push(0); net.W2[0].push(nr(0.5)); net.W2[1].push(nr(0.5)); }
    tgt = copy(net); buf = []; pos = 0; env = { s: 0, t: 0 }; S.steps = 0; S.hist = [];
    record();
  }
  function copy(n) { return JSON.parse(JSON.stringify(n)); }
  function fwd(n, x) {
    var h = [], q = [n.b2[0], n.b2[1]], i;
    for (i = 0; i < H; i++) h.push(Math.tanh(n.W1[i] * x + n.b1[i]));
    for (var a = 0; a < 2; a++) for (i = 0; i < H; i++) q[a] += n.W2[a][i] * h[i];
    return { h: h, q: q };
  }
  function x(s) { return s / (N - 1); }
  function trainOne(tr) {
    var f = fwd(net, x(tr.s)), y = tr.r + (tr.d ? 0 : GAMMA * Math.max.apply(null, fwd(S.target ? tgt : net, x(tr.s2)).q));
    var e = M.clamp(f.q[tr.a] - y, -1, 1);
    for (var i = 0; i < H; i++) {
      var dh = e * net.W2[tr.a][i] * (1 - f.h[i] * f.h[i]);
      net.W2[tr.a][i] -= S.lr * e * f.h[i]; net.W1[i] -= S.lr * dh * x(tr.s); net.b1[i] -= S.lr * dh;
    }
    net.b2[tr.a] -= S.lr * e;
  }
  function envStep() {
    var q = fwd(net, x(env.s)).q, a = rg.next() < EPS ? (rg.next() < 0.5 ? 0 : 1) : (q[1] > q[0] ? 1 : 0);
    var s2 = a === 1 ? env.s + 1 : Math.max(0, env.s - 1), d = s2 === N - 1, r = d ? 10 : -1;
    var tr = { s: env.s, a: a, r: r, s2: s2, d: d };
    env.t++; env.s = (d || env.t >= 60) ? 0 : s2; if (d || env.t >= 60) env.t = 0;
    return tr;
  }
  function stepOnce() {
    var tr = envStep();
    if (S.replay) {
      if (buf.length < CAP) buf.push(tr); else buf[pos] = tr; pos = (pos + 1) % CAP;
      for (var k = 0; k < BATCH; k++) trainOne(buf[Math.floor(rg.next() * buf.length)]);
    } else trainOne(tr);
    S.steps++;
    if (S.target && S.steps % S.sync === 0) tgt = copy(net);
    if (S.steps % REC === 0) record();
  }
  function err() {
    var e = 0;
    for (var s = 0; s < N - 1; s++) { var q = fwd(net, x(s)).q; e += (Math.abs(q[0] - Qs[s][0]) + Math.abs(q[1] - Qs[s][1])) / 2; }
    return e / (N - 1);
  }
  function probe() { return -1 + GAMMA * Math.max.apply(null, fwd(S.target ? tgt : net, x(4)).q); }
  function record() { S.hist.push([S.steps, err(), probe()]); if (S.hist.length > MAXH / REC) S.hist.shift(); }

  var v1 = api.view(root, { aspect: 2.1, minH: 190, maxH: 290, label: "Valores Q de la red frente a los Q verdaderos en cada pantalla del embudo de StreamFlix" });
  var p1 = api.plot(v1, { xr: [0, N - 1], yr: [-2, 12], xticks: N - 1, yticks: 7, xlabel: "pantalla (tras la 7 viene la película)", ylabel: "valor Q", pad: { l: 40, r: 18, t: 10, b: 34 }, xfmt: function (v) { return Math.round(v); }, yfmt: function (v) { return Math.round(v); } });
  var v2 = api.view(root, { aspect: 2.4, minH: 170, maxH: 250, label: "Error medio de la red y objetivo de una transición fija a lo largo del entrenamiento" });
  var p2 = api.plot(v2, { xr: [0, 1000], yr: [0, 14], xticks: 4, yticks: 7, xlabel: "pasos de entrenamiento", ylabel: "error / objetivo", pad: { l: 40, r: 18, t: 10, b: 34 }, yfmt: function (v) { return String(+v.toFixed(2)).replace(".", ","); } });
  api.legend(root, [[api.colors().cobalto, "error medio |Q red − Q verdadero|"], [api.colors().terracota, "objetivo y de la transición (4, avanzar): vale 4,58 si todo va bien"]]);
  var ui = api.controls(root), out = api.readout(root);
  ui.toggle({ label: "Replay buffer", value: true, onChange: function (v) { S.replay = v; stop(); init(); update(); } });
  ui.toggle({ label: "Red objetivo", value: false, onChange: function (v) { S.target = v; stop(); init(); update(); } });
  ui.slider({ label: "Learning rate", min: 0.01, max: 0.3, step: 0.01, value: S.lr, fmt: function (v) { return v.toFixed(2).replace(".", ","); }, onInput: function (v) { S.lr = v; update(); } });
  ui.slider({ label: "Copiar a la red objetivo cada … pasos", min: 10, max: 1000, step: 10, value: S.sync, fmt: function (v) { return v; }, onInput: function (v) { S.sync = v; update(); } });
  var running = false, loop = null;
  function stop() { running = false; if (loop) loop.stop(); bRun.textContent = "▶ Entrenar"; }
  var bRun = ui.button("▶ Entrenar", function () {
    if (running) { stop(); return; }
    if (api.reduceMotion) { for (var i = 0; i < 2000; i++) stepOnce(); update(); return; }
    running = true; bRun.textContent = "❚❚ Pausa"; loop.start();
  }, "primary");
  ui.button("+1000 pasos", function () { stop(); for (var i = 0; i < 1000; i++) stepOnce(); update(); });
  ui.button("Red nueva", function () { stop(); S.seedBump = (S.seedBump || 0) + 1; init(); update(); }, "warm");
  loop = api.loop(function () { for (var i = 0; i < 40; i++) stepOnce(); update(); if (S.steps >= 6000) { stop(); return false; } }, { fps: 20 });

  function f(v, k) { return (v < 0 ? "−" : "") + Math.abs(v).toFixed(k === undefined ? 2 : k).replace(".", ","); }
  function drawQ(ctx, w, h, C) {
    p1.axes(ctx); ctx.save(); p1.clip(ctx);
    var pts = function (a, fn) { var r = []; for (var s = 0; s < N - 1; s++) r.push([p1.x(s), p1.y(fn(s, a))]); return r; };
    D.path(ctx, pts(0, function (s, a) { return Qs[s][a]; }), C.cobalto, 2, [6, 4]);
    D.path(ctx, pts(1, function (s, a) { return Qs[s][a]; }), C.terracota, 2, [6, 4]);
    var l = pts(0, function (s) { return fwd(net, x(s)).q[0]; }), r = pts(1, function (s) { return fwd(net, x(s)).q[1]; });
    D.path(ctx, l, C.cobalto, 3); D.path(ctx, r, C.terracota, 3);
    l.forEach(function (q) { D.circle(ctx, q[0], q[1], 3.5, C.cobalto, C.paper, 1); }); r.forEach(function (q) { D.circle(ctx, q[0], q[1], 3.5, C.terracota, C.paper, 1); });
    ctx.restore();
    D.text(ctx, "Q(s, avanzar)", p1.box.x + 8, p1.box.y + 14, { size: 11, weight: 700, color: C.terracotaInk });
    D.text(ctx, "Q(s, retroceder)", p1.box.x + 8, p1.box.y + 28, { size: 11, weight: 700, color: C.cobaltoInk });
    D.text(ctx, (p1.box.w < 330 ? "línea = red · guiones = verdadero" : "trazo continuo = red · discontinuo = valor verdadero"), p1.box.x + p1.box.w - 6, p1.box.y + p1.box.h - 8, { align: "right", size: 10, color: C.muted });
  }
  function drawCurve(ctx, w, h, C) {
    var mx = Math.max(1000, Math.ceil(S.steps / 1000) * 1000);
    p2.xr = [0, mx]; p2.axes(ctx); ctx.save(); p2.clip(ctx);
    D.line(ctx, p2.x(0), p2.y(4.58), p2.x(mx), p2.y(4.58), C.olivaInk, 1.5, [5, 4]);
    D.path(ctx, S.hist.map(function (q) { return [p2.x(q[0]), p2.y(M.clamp(q[2], 0, 14))]; }), C.terracota, 2);
    D.path(ctx, S.hist.map(function (q) { return [p2.x(q[0]), p2.y(M.clamp(q[1], 0, 14))]; }), C.cobalto, 2.8);
    ctx.restore();
  }
  function update() {
    var e = err(), ok = 0;
    for (var s = 0; s < N - 1; s++) { var q = fwd(net, x(s)).q; if (q[1] > q[0]) ok++; }
    out.set("Pasos: <b>" + S.steps + "</b> · replay buffer: <b>" + (S.replay ? buf.length + " / " + CAP + " transiciones" : "apagado (se aprende solo de la última transición)") + "</b> · red objetivo: <b>" + (S.target ? "activada (se copia cada " + S.sync + " pasos)" : "apagada (el objetivo se mueve con cada actualización)") + "</b><br>" +
      "Error medio |Q red − Q verdadero| = <b>" + f(e) + "</b> · pantallas donde la red prefiere avanzar (lo correcto): <b>" + ok + " de " + (N - 1) + "</b> · objetivo y de la transición sonda = <b>" + f(probe()) + "</b> (valor exacto 4,58)");
    v1.redraw(); v2.redraw();
  }
  init(); v1.draw(drawQ); v2.draw(drawCurve); update();
  return { destroy: function () { stop(); } };
});
