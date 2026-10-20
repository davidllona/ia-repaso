/* Experimento: la ecuación de Bellman en un MDP de 3 estados (A, B y el final T), con la política fija.
   El lector propone V(A) y V(B); la demo calcula el lado derecho de Bellman y muestra cuánto falla. Con "Barrido" se aplica V ← lado derecho. */
Lab.register("curso3/c3m6-bellman", function (root, api) {
  var D = api.d, M = api.math;
  var S = { g: 0.5, VA: 0, VB: 0, sweeps: 0 };
  var view = api.view(root, { aspect: 2.9, minH: 170, maxH: 215, label: "Grafo de tres estados: A y B con sus probabilidades y recompensas, y el estado final T" });
  var ui = api.controls(root), out = api.readout(root);
  var sg = ui.slider({ label: "Factor de descuento γ", min: 0, max: 0.95, step: 0.05, value: S.g, fmt: function (v) { return v.toFixed(2).replace(".", ","); }, onInput: function (v) { S.g = v; S.sweeps = 0; update(); } });
  var sa = ui.slider({ label: "Tu valor V(A)", min: 0, max: 12, step: 0.1, value: 0, fmt: function (v) { return v.toFixed(1).replace(".", ","); }, onInput: function (v) { S.VA = v; update(); } });
  var sb = ui.slider({ label: "Tu valor V(B)", min: 0, max: 12, step: 0.1, value: 0, fmt: function (v) { return v.toFixed(1).replace(".", ","); }, onInput: function (v) { S.VB = v; update(); } });
  ui.button("Un barrido de Bellman (V ← lado derecho)", function () {
    var r = rhs(); S.VA = Math.round(r.A * 100) / 100; S.VB = Math.round(r.B * 100) / 100; S.sweeps++; sa.set(Math.min(12, S.VA), true); sb.set(Math.min(12, S.VB), true); update();
  }, "primary");
  ui.button("Poner la solución exacta", function () {
    var e = exact(); S.VA = Math.round(e.A * 10) / 10; S.VB = Math.round(e.B * 10) / 10; sa.set(S.VA, true); sb.set(S.VB, true); update();
  }, "warm");
  ui.button("Todo a cero", function () { S.VA = 0; S.VB = 0; S.sweeps = 0; sa.set(0, true); sb.set(0, true); update(); });

  /* A: 50 % se queda (r=0), 50 % pasa a B (r=+4).  B: 40 % vuelve a A (r=0), 60 % pasa a T (r=+10). */
  function rhs() {
    return { A: 0.5 * (0 + S.g * S.VA) + 0.5 * (4 + S.g * S.VB), B: 0.4 * (0 + S.g * S.VA) + 0.6 * (10 + S.g * 0) };
  }
  function exact() {
    var g = S.g, VA = (2 + 3 * g) / (1 - 0.5 * g - 0.2 * g * g), VB = 6 + 0.4 * g * VA;
    return { A: VA, B: VB };
  }
  function f(v, k) { return v.toFixed(k === undefined ? 2 : k).replace(".", ","); }

  function draw(ctx, w, h, C) {
    var r = rhs(), e = exact(), ay = h * 0.52, ax = w * 0.17, bx = w * 0.5, tx = w * 0.85, R = Math.min(30, w * 0.075);
    var fs = w < 460 ? 9.5 : 11.5;
    function node(x, y, name, v, ok, sq) {
      var fill = ok ? C.olivaWash : C.cobaltoWash;
      if (sq) D.rect(ctx, x - R, y - R, 2 * R, 2 * R, C.paper, C.ink, 2); else D.circle(ctx, x, y, R, fill, ok ? C.oliva : C.ink, 2.4);
      D.text(ctx, name, x, y - 2, { align: "center", size: 15, weight: 700, color: C.ink });
      D.text(ctx, sq ? "V = 0" : "V = " + f(v, 1), x, y + 13, { align: "center", size: fs - 1, color: C.ink2, mono: true });
    }
    // flechas
    D.arrow(ctx, ax + R + 3, ay - 9, bx - R - 3, ay - 9, C.cobalto, 2);
    D.text(ctx, "p 0,5 · r +4", (ax + bx) / 2, ay - 16, { align: "center", size: fs, color: C.cobaltoInk, weight: 600 });
    D.arrow(ctx, bx - R - 3, ay + 9, ax + R + 3, ay + 9, C.terracota, 2);
    D.text(ctx, "p 0,4 · r 0", (ax + bx) / 2, ay + 26, { align: "center", size: fs, color: C.terracotaInk, weight: 600 });
    D.arrow(ctx, bx + R + 3, ay, tx - R - 3, ay, C.cobalto, 2);
    D.text(ctx, "p 0,6 · r +10", (bx + tx) / 2, ay - 8, { align: "center", size: fs, color: C.cobaltoInk, weight: 600 });
    // bucle en A
    ctx.save(); ctx.strokeStyle = C.terracota; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ax, ay - R - 12, 12, 0.35 * Math.PI, 2.65 * Math.PI); ctx.stroke(); ctx.restore();
    D.text(ctx, "p 0,5 · r 0", ax, ay - R - 31, { align: "center", size: fs, color: C.terracotaInk, weight: 600 });
    node(ax, ay, "A", S.VA, Math.abs(r.A - S.VA) < 0.05);
    node(bx, ay, "B", S.VB, Math.abs(r.B - S.VB) < 0.05);
    node(tx, ay, "T", 0, true, true);
    D.text(ctx, "final", tx, ay + R + 14, { align: "center", size: fs, color: C.muted });
    D.text(ctx, "el verde = el valor ya cumple Bellman", w / 2, h - 6, { align: "center", size: fs - 0.5, color: C.muted });
  }
  function update() {
    var r = rhs(), e = exact(), g = S.g;
    var dA = r.A - S.VA, dB = r.B - S.VB, okA = Math.abs(dA) < 0.05, okB = Math.abs(dB) < 0.05;
    out.set(
      "<b>Estado A</b>: 0,5·(0 + " + f(g) + "·" + f(S.VA, 1) + ") + 0,5·(4 + " + f(g) + "·" + f(S.VB, 1) + ") = <b>" + f(r.A) + "</b> · tu V(A) = " + f(S.VA, 1) + " → <span class='" + (okA ? "good" : "bad") + "'>desfase " + f(dA) + "</span><br>" +
      "<b>Estado B</b>: 0,4·(0 + " + f(g) + "·" + f(S.VA, 1) + ") + 0,6·(10 + " + f(g) + "·0) = <b>" + f(r.B) + "</b> · tu V(B) = " + f(S.VB, 1) + " → <span class='" + (okB ? "good" : "bad") + "'>desfase " + f(dB) + "</span><br>" +
      "Solución exacta (sistema 2×2): V(A) = <b>" + f(e.A) + "</b>, V(B) = <b>" + f(e.B) + "</b>" + (S.sweeps ? " · barridos dados: " + S.sweeps : "") +
      (okA && okB ? "<br><span class='good'>Tus dos valores cumplen la ecuación de Bellman: ya son los valores verdaderos.</span>" : ""));
    view.redraw();
  }
  view.draw(draw); update();
});
