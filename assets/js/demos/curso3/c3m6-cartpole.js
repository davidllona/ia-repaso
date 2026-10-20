/* Experimento: CartPole (la misma física que Gymnasium: gravedad 9,8, fuerza ±10 N, paso de 0,02 s, método de Euler).
   El estado son 4 números, hay 2 acciones y cada paso vivo da +1. Una política es solo una función estado → acción. */
Lab.register("curso3/c3m6-cartpole", function (root, api) {
  var D = api.d, M = api.math;
  var TH_MAX = 12 * 2 * Math.PI / 360, X_MAX = 2.4;
  var S = { s: [0, 0, 0, 0], t: 0, done: false, why: "", ret: 0, pol: "manual", w1: 1, w2: 0.5, rng: api.rng(3), meas: null, running: false };

  function physics(s, action) {
    var g = 9.8, mp = 0.1, mt = 1.1, l = 0.5, pml = 0.05, F = 10, tau = 0.02;
    var x = s[0], xd = s[1], th = s[2], thd = s[3], force = action === 1 ? F : -F, c = Math.cos(th), sn = Math.sin(th);
    var temp = (force + pml * thd * thd * sn) / mt, tha = (g * sn - c * temp) / (l * (4 / 3 - mp * c * c / mt)), xa = temp - pml * tha * c / mt;
    return [x + tau * xd, xd + tau * xa, th + tau * thd, thd + tau * tha];
  }
  function policy(name, s, rg) {
    if (name === "azar") return rg.next() < 0.5 ? 0 : 1;
    if (name === "derecha") return 1;
    if (name === "regla") return (S.w1 * s[2] + S.w2 * s[3]) > 0 ? 1 : 0;
    return 1;
  }
  function newState(rg) { return [0, 0, 0, 0].map(function () { return rg.range(-0.05, 0.05); }); }
  function reset() { S.s = newState(S.rng); S.t = 0; S.done = false; S.why = ""; S.ret = 0; S.running = false; if (loop) loop.stop(); update(); }
  function advance(a) {
    if (S.done) return;
    S.s = physics(S.s, a); S.t++; S.ret++;
    if (Math.abs(S.s[0]) > X_MAX) { S.done = true; S.why = "el carro se salió de la pista (|x| > 2,4)"; }
    else if (Math.abs(S.s[2]) > TH_MAX) { S.done = true; S.why = "el palo se inclinó más de 12°"; }
    else if (S.t >= 500) { S.done = true; S.why = "llegó a 500 pasos (truncado: se acaba el tiempo, no se ha caído)"; }
  }

  var view = api.view(root, { aspect: 2.3, minH: 170, maxH: 250, label: "CartPole: un carro sobre una pista que sostiene un palo en equilibrio" });
  var ui = api.controls(root), out = api.readout(root);
  var sel = ui.select({ label: "Política (quién decide la acción)", options: [["manual", "Manual: tú con los botones"], ["azar", "Al azar"], ["derecha", "Siempre empujar a la derecha"], ["regla", "Mi regla: derecha si w₁·θ + w₂·θ̇ > 0"]], value: "manual", onChange: function (v) { S.pol = v; S.meas = null; update(); } });
  ui.slider({ label: "w₁ (peso del ángulo θ)", min: -2, max: 2, step: 0.1, value: S.w1, fmt: function (v) { return v.toFixed(1).replace(".", ","); }, onInput: function (v) { S.w1 = v; S.meas = null; update(); } });
  ui.slider({ label: "w₂ (peso de la velocidad angular θ̇)", min: -2, max: 2, step: 0.1, value: S.w2, fmt: function (v) { return v.toFixed(1).replace(".", ","); }, onInput: function (v) { S.w2 = v; S.meas = null; update(); } });
  ui.button("← empujar izquierda", function () { advance(0); update(); }, "primary");
  ui.button("empujar derecha →", function () { advance(1); update(); }, "primary");
  var bRun = ui.button("▶ Ejecutar la política", function () {
    if (S.pol === "manual") { S.pol = "regla"; sel.set("regla"); }
    if (S.done) { S.s = newState(S.rng); S.t = 0; S.done = false; S.ret = 0; }
    if (api.reduceMotion) { var k = 0; while (!S.done && k++ < 600) advance(policy(S.pol, S.s, S.rng)); update(); return; }
    S.running = true; loop.start();
  });
  ui.button("Nuevo episodio", reset);
  ui.button("Medir 100 episodios", function () {
    if (S.pol === "manual") { S.pol = "regla"; sel.set("regla"); }
    var rg = api.rng(99), tot = 0, mn = 1e9, mx = 0, save = { s: S.s, t: S.t, done: S.done, ret: S.ret };
    for (var e = 0; e < 100; e++) {
      var s = newState(rg), n = 0;
      while (n < 500 && Math.abs(s[0]) <= X_MAX && Math.abs(s[2]) <= TH_MAX) { s = physics(s, policy(S.pol, s, rg)); n++; }
      tot += n; mn = Math.min(mn, n); mx = Math.max(mx, n);
    }
    S.meas = { mean: tot / 100, mn: mn, mx: mx }; update();
  }, "warm");
  var loop = api.loop(function () {
    if (!S.running) return false;
    for (var i = 0; i < 2 && !S.done; i++) advance(policy(S.pol, S.s, S.rng));
    update();
    if (S.done) { S.running = false; return false; }
  }, { fps: 30 });
  S.s = newState(S.rng);

  function draw(ctx, w, h, C) {
    var sc = w / 5.6, cx = w / 2, gy = h * 0.72, x = S.s[0], th = S.s[2];
    // pista y límites
    D.line(ctx, cx - X_MAX * sc - 14, gy, cx + X_MAX * sc + 14, gy, C.ink, 2);
    [-1, 1].forEach(function (sg) { D.line(ctx, cx + sg * X_MAX * sc, gy - 22, cx + sg * X_MAX * sc, gy + 6, C.terracota, 3); });
    D.text(ctx, "−2,4", cx - X_MAX * sc, gy + 20, { align: "center", size: 10.5, color: C.terracotaInk, mono: true });
    D.text(ctx, "+2,4", cx + X_MAX * sc, gy + 20, { align: "center", size: 10.5, color: C.terracotaInk, mono: true });
    // cono de ±12°
    var pl = 1.0 * sc, bx = cx + x * sc, by = gy - 14;
    [-1, 1].forEach(function (sg) { D.line(ctx, bx, by, bx + Math.sin(sg * TH_MAX) * pl * 1.15, by - Math.cos(TH_MAX) * pl * 1.15, C.line, 1.5, [4, 4]); });
    // carro
    D.rect(ctx, bx - 22, gy - 24, 44, 20, C.cobaltoWash, C.ink, 2);
    D.circle(ctx, bx - 12, gy - 3, 4, C.ink); D.circle(ctx, bx + 12, gy - 3, 4, C.ink);
    // palo
    D.line(ctx, bx, by, bx + Math.sin(th) * pl, by - Math.cos(th) * pl, S.done && Math.abs(th) > TH_MAX ? C.terracota : C.ink, 5);
    D.circle(ctx, bx + Math.sin(th) * pl, by - Math.cos(th) * pl, 5, C.terracota, C.ink, 1.5);
    D.circle(ctx, bx, by, 3, C.paper, C.ink, 1.5);
  }
  function f(v, k) { return (v < 0 ? "−" : "") + Math.abs(v).toFixed(k).replace(".", ","); }
  function update() {
    var s = S.s, a = S.pol === "manual" ? "tú decides" : (S.pol === "regla" ? "w₁·θ + w₂·θ̇ = " + f(S.w1 * s[2] + S.w2 * s[3], 3) + " → " + ((S.w1 * s[2] + S.w2 * s[3]) > 0 ? "derecha (1)" : "izquierda (0)") : "");
    var txt = "Paso <b>" + S.t + "</b> · retorno = <b>" + S.ret + "</b> (+1 por cada paso que el palo sigue en pie)<br>" +
      "Estado (lo que ve el agente): x = <b>" + f(s[0], 3) + "</b> m · ẋ = <b>" + f(s[1], 3) + "</b> m/s · θ = <b>" + f(s[2] * 180 / Math.PI, 2) + "°</b> · θ̇ = <b>" + f(s[3], 3) + "</b> rad/s" + (a ? "<br>" + a : "");
    if (S.done) txt += "<br><span class='" + (S.t >= 500 ? "good" : "bad") + "'>Fin: " + S.why + ".</span>";
    if (S.meas) txt += "<br>Con esta política, 100 episodios: media <b>" + f(S.meas.mean, 1) + "</b> pasos (mínimo " + S.meas.mn + ", máximo " + S.meas.mx + ").";
    out.set(txt); view.redraw();
  }
  view.draw(draw); update();
  return { destroy: function () { loop.stop(); } };
});
