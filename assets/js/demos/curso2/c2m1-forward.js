/* Experimento: forward propagation paso a paso en una red 2-2-1 (todas las multiplicaciones y sumas a la vista). */
Lab.register("curso2/c2m1-forward", function (root, api) {
  var M = api.math, D = api.d;
  var P0 = { w11: 0.4, w12: -0.6, b1: 0.1, w21: 0.7, w22: 0.2, b2: -0.3, v1: 0.5, v2: -0.8, c: 0.2 };
  var S = { x1: 1, x2: 0.5, y: 1, step: 0, act: "sigmoid", P: Object.assign({}, P0), seed: 3 };
  var ACT = {
    sigmoid: { f: function (z) { return 1 / (1 + Math.exp(-z)); }, sym: "σ", def: function (z) { return "1 / (1 + e^(−" + n4(z) + "))"; } },
    tanh: { f: Math.tanh, sym: "tanh", def: function (z) { return "tanh(" + n4(z) + ")"; } },
    relu: { f: function (z) { return Math.max(0, z); }, sym: "ReLU", def: function (z) { return "max(0, " + n4(z) + ")"; } }
  };
  var sig = function (z) { return 1 / (1 + Math.exp(-z)); };
  function mi(s) { return s.replace(/-/g, "−"); }
  function n4(v) { return mi((Math.abs(v) < 5e-5 ? 0 : v).toFixed(4)); }
  function n2(v) { return mi((Math.abs(v) < 5e-3 ? 0 : v).toFixed(2)); }
  function par(v, k) { return v < 0 ? "(" + mi(v.toFixed(k)) + ")" : v.toFixed(k); }

  function calc() {
    var P = S.P, A = ACT[S.act], R = {};
    R.z1 = P.w11 * S.x1 + P.w12 * S.x2 + P.b1; R.h1 = A.f(R.z1);
    R.z2 = P.w21 * S.x1 + P.w22 * S.x2 + P.b2; R.h2 = A.f(R.z2);
    R.zo = P.v1 * R.h1 + P.v2 * R.h2 + P.c; R.yh = sig(R.zo);
    R.L = -(S.y * Math.log(R.yh) + (1 - S.y) * Math.log(1 - R.yh));
    return R;
  }

  var view = api.view(root, { aspect: 2.0, minH: 290, maxH: 400, label: "Red neuronal 2-2-1 con los valores calculados paso a paso" });
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.72rem, 2.7vw, .84rem)";
  function upd() { S.step = Math.min(S.step, 7); update(); }
  ui.slider({ label: "Entrada x₁", min: -2, max: 2, step: 0.1, value: S.x1, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.x1 = v; upd(); } });
  ui.slider({ label: "Entrada x₂", min: -2, max: 2, step: 0.1, value: S.x2, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.x2 = v; upd(); } });
  ui.select({ label: "Activación de la capa oculta", value: "sigmoid", options: [["sigmoid", "Sigmoide"], ["tanh", "tanh"], ["relu", "ReLU"]], onChange: function (v) { S.act = v; upd(); } });
  ui.segmented({ label: "Respuesta correcta y (para la pérdida)", value: 1, options: [[1, "y = 1"], [0, "y = 0"]], onChange: function (v) { S.y = v; upd(); } });
  ui.button("◀ Paso anterior", function () { S.step = Math.max(0, S.step - 1); update(); });
  ui.button("Paso siguiente ▶", function () { S.step = Math.min(7, S.step + 1); update(); }, "primary");
  ui.button("Calcular todo", function () { S.step = 7; update(); });
  ui.button("Pesos al azar", function () {
    var r = api.rng(S.seed++); Object.keys(S.P).forEach(function (k) { S.P[k] = Math.round(r.normal(0, 0.8) * 10) / 10; }); update();
  });
  ui.button("Pesos del ejemplo", function () { S.P = Object.assign({}, P0); update(); });

  function draw(ctx, w, h, C) {
    var R = calc(), P = S.P, st = S.step, r = M.clamp(w * 0.05, 15, 26), fs = w > 600 ? 12 : 11;
    var N = { x1: [0.1 * w, 0.27 * h], x2: [0.1 * w, 0.73 * h], h1: [0.46 * w, 0.27 * h], h2: [0.46 * w, 0.73 * h], o: [0.84 * w, 0.5 * h] };
    var active = { 1: ["x1h1", "x2h1"], 3: ["x1h2", "x2h2"], 5: ["h1o", "h2o"] }[st] || [];
    function edge(id, a, b, wt, t) {
      var A = N[a], B = N[b], on = active.indexOf(id) >= 0;
      var col = on ? C.marker : (wt >= 0 ? C.cobalto : C.terracota);
      ctx.save(); ctx.globalAlpha = on ? 1 : 0.7;
      D.line(ctx, A[0], A[1], B[0], B[1], on ? C.ink : col, on ? 4.5 : 1 + Math.min(2.2, Math.abs(wt) * 1.6));
      if (on) D.line(ctx, A[0], A[1], B[0], B[1], C.marker, 2.5);
      ctx.restore();
      var lx = A[0] + (B[0] - A[0]) * t, ly = A[1] + (B[1] - A[1]) * t, s = n2(wt);
      ctx.save(); ctx.font = "600 11px 'IBM Plex Mono',monospace"; var tw = ctx.measureText(s).width + 6; ctx.restore();
      D.rect(ctx, lx - tw / 2, ly - 8, tw, 16, C.surface, on ? C.ink : null, 1);
      D.text(ctx, s, lx, ly + 4, { size: 11, mono: true, weight: 600, align: "center", color: C.ink });
    }
    edge("x1h1", "x1", "h1", P.w11, 0.5); edge("x1h2", "x1", "h2", P.w21, 0.72);
    edge("x2h1", "x2", "h1", P.w12, 0.72); edge("x2h2", "x2", "h2", P.w22, 0.5);
    edge("h1o", "h1", "o", P.v1, 0.5); edge("h2o", "h2", "o", P.v2, 0.5);
    function node(k, txt, fill, hot, known) {
      var p = N[k]; D.circle(ctx, p[0], p[1], r, fill, hot ? C.terracota : C.ink, hot ? 4 : 2);
      D.text(ctx, known ? txt : "?", p[0], p[1] + 4, { size: r > 19 ? 13 : 11, mono: true, weight: 600, align: "center", color: known ? C.ink : C.muted });
    }
    node("x1", S.x1.toFixed(1), C.paper, false, true); node("x2", S.x2.toFixed(1), C.paper, false, true);
    node("h1", n2(R.h1), C.cobaltoWash, st === 2, st >= 2); node("h2", n2(R.h2), C.cobaltoWash, st === 4, st >= 4);
    node("o", n2(R.yh), C.terracotaWash, st === 6, st >= 6);
    function lines(k, arr, below) {
      var p = N[k], y0 = below ? p[1] + r + 15 : p[1] - r - 7 - 14 * (arr.length - 1);
      arr.forEach(function (t, i) { D.text(ctx, t[0], p[0], y0 + 14 * i, { size: fs, mono: true, align: "center", weight: t[1] ? 600 : 400, color: t[1] ? C.ink : C.muted }); });
    }
    lines("x1", [["x₁", true]], false); lines("x2", [["x₂", true]], true);
    lines("h1", [[st >= 1 ? "z₁ = " + n4(R.z1) : "z₁ = ?", st === 1], ["b₁ = " + n2(P.b1), false], ["h₁", true]], false);
    lines("h2", [["h₂", true], ["b₂ = " + n2(P.b2), false], [st >= 3 ? "z₂ = " + n4(R.z2) : "z₂ = ?", st === 3]], true);
    lines("o", [[st >= 5 ? "z_o = " + n4(R.zo) : "z_o = ?", st === 5], ["c = " + n2(P.c), false], ["ŷ", true]], false);
    lines("o", [["y = " + S.y, false], [st >= 7 ? "L = " + n4(R.L) : "L = ?", st === 7]], true);
  }

  function update() {
    var R = calc(), P = S.P, A = ACT[S.act], st = S.step, s = "";
    var titles = ["Paso 0 · Entran los datos", "Paso 1 · Suma ponderada de la neurona oculta 1", "Paso 2 · Activación de la neurona oculta 1",
      "Paso 3 · Suma ponderada de la neurona oculta 2", "Paso 4 · Activación de la neurona oculta 2", "Paso 5 · Suma ponderada de la salida",
      "Paso 6 · Activación de la salida: la predicción", "Paso 7 · Pérdida (entropía cruzada binaria)"];
    s += "<b>" + titles[st] + "</b><br>";
    if (st === 0) s += "x₁ = " + S.x1.toFixed(1) + " · x₂ = " + S.x2.toFixed(1) + ". Pulsa «Paso siguiente» y sigue cada multiplicación.";
    if (st === 1) s += "z₁ = w₁₁·x₁ + w₁₂·x₂ + b₁<br>&nbsp;&nbsp;&nbsp;= " + par(P.w11, 2) + "·" + par(S.x1, 1) + " + " + par(P.w12, 2) + "·" + par(S.x2, 1) + " + " + par(P.b1, 2) + "<br>&nbsp;&nbsp;&nbsp;= " + n4(P.w11 * S.x1) + " + " + par(P.w12 * S.x2, 4) + " + " + par(P.b1, 4) + " = <b>" + n4(R.z1) + "</b>";
    if (st === 2) s += "h₁ = " + A.sym + "(z₁) = " + A.def(R.z1) + " = <b>" + n4(R.h1) + "</b>";
    if (st === 3) s += "z₂ = w₂₁·x₁ + w₂₂·x₂ + b₂<br>&nbsp;&nbsp;&nbsp;= " + par(P.w21, 2) + "·" + par(S.x1, 1) + " + " + par(P.w22, 2) + "·" + par(S.x2, 1) + " + " + par(P.b2, 2) + "<br>&nbsp;&nbsp;&nbsp;= " + n4(P.w21 * S.x1) + " + " + par(P.w22 * S.x2, 4) + " + " + par(P.b2, 4) + " = <b>" + n4(R.z2) + "</b>";
    if (st === 4) s += "h₂ = " + A.sym + "(z₂) = " + A.def(R.z2) + " = <b>" + n4(R.h2) + "</b>";
    if (st === 5) s += "z_o = v₁·h₁ + v₂·h₂ + c<br>&nbsp;&nbsp;&nbsp;= " + par(P.v1, 2) + "·" + n4(R.h1) + " + " + par(P.v2, 2) + "·" + n4(R.h2) + " + " + par(P.c, 2) + "<br>&nbsp;&nbsp;&nbsp;= " + n4(P.v1 * R.h1) + " + " + par(P.v2 * R.h2, 4) + " + " + par(P.c, 4) + " = <b>" + n4(R.zo) + "</b>";
    if (st === 6) s += "ŷ = σ(z_o) = 1 / (1 + e^(−" + n4(R.zo) + ")) = <b>" + n4(R.yh) + "</b> → la red dice «" + (R.yh > 0.5 ? "sí, probabilidad " : "no, probabilidad de «sí» ") + (R.yh * 100).toFixed(1) + " %»";
    if (st === 7) s += "L = −[y·ln(ŷ) + (1 − y)·ln(1 − ŷ)]<br>&nbsp;&nbsp;= " + (S.y === 1 ? "−ln(" + n4(R.yh) + ")" : "−ln(1 − " + n4(R.yh) + ")") + " = <b>" + n4(R.L) + "</b>" +
      (R.L > 0.6 ? "<br><span class='bad'>Pérdida alta: la red todavía no acierta.</span>" : "<br><span class='good'>Pérdida baja: la red acierta.</span>");
    out.set(s);
    view.redraw();
  }
  view.draw(draw); update();
});
