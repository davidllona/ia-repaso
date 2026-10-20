/* Experimento: el forward de una red 2-2-1 número a número (la misma del ejemplo a mano y del fragmento 6).
   Se cambian las entradas, la activación oculta o cualquier peso, y se recalcula cada z y cada h. */
Lab.register("curso5/c5m1-forward-red", function (root, api) {
  var D = api.d, M = api.math;
  var W = { w11: 0.5, w12: -0.5, w21: 1.0, w22: 0.5, b1: 0.0, b2: -1.0, v1: 1.0, v2: -1.0, c: 0.0 };
  var S = { x1: 1, x2: 2, act: "sigmoid" };
  var ACT = {
    sigmoid: { n: "sigmoide", f: M.sigmoid },
    tanh: { n: "tanh", f: Math.tanh },
    relu: { n: "ReLU", f: function (z) { return Math.max(0, z); } },
    leaky: { n: "LeakyReLU (0.1)", f: function (z) { return z > 0 ? z : 0.1 * z; } },
    id: { n: "ninguna (identidad)", f: function (z) { return z; } }
  };
  var NAMES = { w11: "W1[0,0]  (x1 → h1)", w12: "W1[0,1]  (x2 → h1)", w21: "W1[1,0]  (x1 → h2)", w22: "W1[1,1]  (x2 → h2)",
    b1: "b1[0]  (bias de h1)", b2: "b1[1]  (bias de h2)", v1: "W2[0,0]  (h1 → salida)", v2: "W2[0,1]  (h2 → salida)", c: "b2[0]  (bias de la salida)" };
  var DEFAULTS = JSON.parse(JSON.stringify(W));

  var view = api.view(root, { aspect: 1.75, minH: 250, maxH: 400, label: "Red 2-2-1 que calcula la probabilidad de que un usuario termine la serie, con el valor de cada neurona y el peso de cada conexión" });
  var ui = api.controls(root), out = api.readout(root);
  var sel = "w11";

  function calc() {
    var f = ACT[S.act].f;
    var z1 = W.w11 * S.x1 + W.w12 * S.x2 + W.b1, z2 = W.w21 * S.x1 + W.w22 * S.x2 + W.b2;
    var h1 = f(z1), h2 = f(z2), z3 = W.v1 * h1 + W.v2 * h2 + W.c;
    return { z1: z1, z2: z2, h1: h1, h2: h2, z3: z3, p: M.sigmoid(z3) };
  }
  function n2(v) { var s = (Math.abs(v) < 0.005 ? 0 : v).toFixed(2); return s.replace("-", "−"); }

  ui.slider({ label: "x1 · gusto por la acción", min: -3, max: 3, step: 0.1, value: S.x1, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.x1 = v; update(); } });
  ui.slider({ label: "x2 · gusto por la comedia", min: -3, max: 3, step: 0.1, value: S.x2, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.x2 = v; update(); } });
  ui.select({ label: "Activación de la capa oculta", value: S.act, options: Object.keys(ACT).map(function (k) { return [k, ACT[k].n]; }), onChange: function (v) { S.act = v; update(); } });
  var selW = ui.select({ label: "Parámetro que quieres cambiar", value: sel, options: Object.keys(NAMES).map(function (k) { return [k, NAMES[k]]; }),
    onChange: function (v) { sel = v; sW.set(W[v], true); } });
  var sW = ui.slider({ label: "valor de ese parámetro", min: -3, max: 3, step: 0.1, value: W[sel], fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { W[sel] = v; update(); } });
  ui.button("Restaurar los pesos del ejemplo", function () { Object.keys(DEFAULTS).forEach(function (k) { W[k] = DEFAULTS[k]; }); sW.set(W[sel], true); update(); });

  view.draw(function (ctx, w, h, C) {
    var r = Math.max(17, Math.min(23, w / 17)), cx = [w * 0.13, w * 0.5, w * 0.87];
    var yIn = [h * 0.27, h * 0.7], yOut = [h * 0.5];
    var c = calc();
    var nodes = {
      x1: [cx[0], yIn[0]], x2: [cx[0], yIn[1]], h1: [cx[1], yIn[0]], h2: [cx[1], yIn[1]], o: [cx[2], yOut[0]]
    };
    function edge(a, b, wt, t) {
      var A = nodes[a], B = nodes[b], mag = Math.min(1, Math.abs(wt) / 2.5);
      ctx.save(); ctx.globalAlpha = 0.25 + 0.65 * mag;
      D.line(ctx, A[0], A[1], B[0], B[1], wt >= 0 ? C.cobalto : C.terracota, 1 + 3.2 * mag); ctx.restore();
      var lx = A[0] + (B[0] - A[0]) * t, ly = A[1] + (B[1] - A[1]) * t, txt = n2(wt);
      ctx.save(); ctx.font = "500 10.5px 'IBM Plex Mono',monospace"; var tw = ctx.measureText(txt).width; ctx.restore();
      D.rect(ctx, lx - tw / 2 - 2, ly - 8, tw + 4, 15, C.paper);
      D.text(ctx, txt, lx, ly + 3.5, { size: 10.5, align: "center", mono: true, weight: 500, color: wt >= 0 ? C.cobaltoInk : C.terracotaInk });
    }
    edge("x1", "h1", W.w11, 0.62); edge("x2", "h1", W.w12, 0.62);
    edge("x1", "h2", W.w21, 0.62); edge("x2", "h2", W.w22, 0.62);
    edge("h1", "o", W.v1, 0.6); edge("h2", "o", W.v2, 0.6);
    function node(key, label, val, fill, sub) {
      var P = nodes[key];
      D.circle(ctx, P[0], P[1], r, fill, C.ink, 1.6);
      D.text(ctx, n2(val), P[0], P[1] + 4, { size: 11.5, align: "center", weight: 600, mono: true });
      D.text(ctx, label, P[0], P[1] - r - 5, { size: 11, align: "center", color: C.ink2, weight: 600 });
      if (sub) D.text(ctx, sub, P[0], P[1] + r + 13, { size: 10, align: "center", color: C.muted, mono: true });
    }
    node("x1", "x1 acción", S.x1, C.paper); node("x2", "x2 comedia", S.x2, C.paper);
    node("h1", "h1", c.h1, C.cobaltoWash, "z=" + n2(c.z1) + "  b=" + n2(W.b1));
    node("h2", "h2", c.h2, C.cobaltoWash, "z=" + n2(c.z2) + "  b=" + n2(W.b2));
    node("o", "p (termina)", c.p, C.terracotaWash, "z=" + n2(c.z3) + "  b=" + n2(W.c));
    D.text(ctx, "capa de entrada", cx[0], h - 5, { size: 10, align: "center", color: C.muted });
    D.text(ctx, "capa oculta: " + ACT[S.act].n, cx[1], h - 5, { size: 10, align: "center", color: C.muted });
    D.text(ctx, "salida: sigmoide", cx[2], h - 5, { size: 10, align: "center", color: C.muted });
  });

  function update() {
    var c = calc(), a = ACT[S.act].n;
    out.set(
      "z(h1) = " + n2(W.w11) + "·" + n2(S.x1) + " + " + n2(W.w12) + "·" + n2(S.x2) + " + " + n2(W.b1) + " = <b>" + n2(c.z1) + "</b> → " + a + " → <b>h1 = " + n2(c.h1) + "</b><br>" +
      "z(h2) = " + n2(W.w21) + "·" + n2(S.x1) + " + " + n2(W.w22) + "·" + n2(S.x2) + " + " + n2(W.b2) + " = <b>" + n2(c.z2) + "</b> → " + a + " → <b>h2 = " + n2(c.h2) + "</b><br>" +
      "z(salida) = " + n2(W.v1) + "·" + n2(c.h1) + " + " + n2(W.v2) + "·" + n2(c.h2) + " + " + n2(W.c) + " = <b>" + n2(c.z3) + "</b> → σ → <b>p = " + c.p.toFixed(4) + "</b> (prob. de que termine la serie)" +
      (S.act === "sigmoid" && S.x1 === 1 && S.x2 === 2 && Object.keys(DEFAULTS).every(function (k) { return W[k] === DEFAULTS[k]; }) ? "<br><span class='good'>Con estos valores coincide con el ejemplo a mano (p = 0.4125: un 41 % de que termine la serie).</span>" : ""));
    view.redraw();
  }
  update();
});
