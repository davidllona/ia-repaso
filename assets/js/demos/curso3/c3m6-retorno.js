/* Experimento: retorno descontado G = Σ γ^t · r_t. Dos caminos con recompensas editables (arrastra las barras);
   el slider de γ pondera el futuro y puede cambiar cuál de los dos caminos es mejor. */
Lab.register("curso3/c3m6-retorno", function (root, api) {
  var D = api.d, M = api.math;
  var N = 8;
  var PRESETS = {
    moneda: { n: "Moneda ya (+10) o meta lejos (+30 al final)", A: [10, 0, 0, 0, 0, 0, 0, 0], B: [0, 0, 0, 0, 0, 0, 0, 30] },
    camino: { n: "Un paso de −1 en cada casilla y premio final", A: [-1, -1, -1, 12, 0, 0, 0, 0], B: [-1, -1, -1, -1, -1, -1, -1, 20] },
    riesgo: { n: "Atajo con castigo al final (−15) o rodeo seguro", A: [1, 1, 1, 8, -15, 0, 0, 0], B: [1, 1, 1, 1, 1, 1, 1, 4] }
  };
  var S = { gamma: 0.9, A: PRESETS.moneda.A.slice(), B: PRESETS.moneda.B.slice() };
  var view = api.view(root, { aspect: 1.55, minH: 250, maxH: 380, drag: true, label: "Barras de recompensa de dos caminos A y B, y su contribución tras descontar con γ" });
  var p = api.plot(view, { xr: [0, N], yr: [-20, 40], xticks: N, yticks: 6, ylabel: "recompensa r", pad: { l: 44, r: 10, t: 12, b: 46 }, xfmt: function () { return ""; }, yfmt: function (v) { return Math.round(v); } });
  api.legend(root, [[api.colors().cobalto, "camino A"], [api.colors().terracota, "camino B"], [api.colors().muted, "contorno = recompensa r · relleno = γᵗ·r (lo que cuenta)"]]);
  var ui = api.controls(root), out = api.readout(root);
  var sl = ui.slider({ label: "Factor de descuento γ", min: 0.3, max: 1, step: 0.01, value: S.gamma, fmt: function (v) { return v.toFixed(2).replace(".", ","); }, onInput: function (v) { S.gamma = v; update(); } });
  var sel = ui.select({ label: "Ejemplo", options: Object.keys(PRESETS).map(function (k) { return [k, PRESETS[k].n]; }), value: "moneda", onChange: function (k) { S.A = PRESETS[k].A.slice(); S.B = PRESETS[k].B.slice(); update(); } });

  function G(seq, g) { var s = 0; for (var t = 0; t < seq.length; t++) s += Math.pow(g, t) * seq[t]; return s; }
  function draw(ctx, w, h, C) {
    p.axes(ctx);
    var b = p.box, y0 = p.y(0);
    D.line(ctx, b.x, y0, b.x + b.w, y0, C.ink, 1.5);
    ctx.save(); p.clip(ctx);
    for (var t = 0; t < N; t++) {
      var x0 = p.x(t), cw = p.x(1) - p.x(0), bw = cw * 0.38;
      [[S.A, C.cobalto, x0 + cw * 0.08], [S.B, C.terracota, x0 + cw * 0.54]].forEach(function (q) {
        var v = q[0][t], d = Math.pow(S.gamma, t) * v, top = p.y(v), topd = p.y(d);
        ctx.strokeStyle = q[1]; ctx.lineWidth = 1.6; ctx.strokeRect(q[2], Math.min(y0, top), bw, Math.abs(top - y0));
        ctx.globalAlpha = 0.85; ctx.fillStyle = q[1]; ctx.fillRect(q[2], Math.min(y0, topd), bw, Math.abs(topd - y0)); ctx.globalAlpha = 1;
      });
    }
    ctx.restore();
    var small = b.w / N < 42;
    for (t = 0; t < N; t++) {
      var cx = p.x(t + 0.5);
      D.text(ctx, "t=" + t, cx, b.y + b.h + 14, { align: "center", size: small ? 9.5 : 11, color: C.muted, mono: true });
      D.text(ctx, "×" + Math.pow(S.gamma, t).toFixed(2).replace(".", ","), cx, b.y + b.h + 28, { align: "center", size: small ? 9 : 10.5, color: C.ink2, mono: true, weight: 600 });
    }
    D.text(ctx, "peso γᵗ", b.x - 4, b.y + b.h + 28, { align: "right", size: 9.5, color: C.ink2 });
  }
  var drag = null;
  function hit(px, py) {
    var b = p.box; if (px < b.x || px > b.x + b.w || py < b.y - 6 || py > b.y + b.h + 6) return null;
    var f = (px - b.x) / b.w * N, t = Math.min(N - 1, Math.floor(f)), frac = f - t;
    return { seq: frac < 0.5 ? S.A : S.B, t: t };
  }
  function setv(y) { drag.seq[drag.t] = M.clamp(Math.round(p.iy(y)), -20, 40); update(); }
  view.pointer({ down: function (x, y) { drag = hit(x, y); if (drag) setv(y); }, drag: function (x, y) { if (drag) setv(y); }, up: function () { drag = null; } });

  function terms(seq, g) {
    var parts = [];
    for (var t = 0; t < N; t++) if (seq[t] !== 0) parts.push((t === 0 ? "" : g.toFixed(2).replace(".", ",") + "<sup>" + t + "</sup>·") + "(" + seq[t] + ")");
    return parts.join(" + ") || "0";
  }
  function update() {
    var gA = G(S.A, S.gamma), gB = G(S.B, S.gamma), g1A = G(S.A, 1), g1B = G(S.B, 1);
    var win = Math.abs(gA - gB) < 0.005 ? "empatan" : (gA > gB ? "gana A" : "gana B");
    var hor = S.gamma >= 0.995 ? "∞ (sin descuento)" : (1 / (1 - S.gamma)).toFixed(1).replace(".", ",") + " pasos";
    out.set(
      "<b style='color:inherit'>A</b>: G = " + terms(S.A, S.gamma) + " = <b>" + gA.toFixed(2).replace(".", ",") + "</b> &nbsp;(sin descontar: " + g1A + ")<br>" +
      "<b>B</b>: G = " + terms(S.B, S.gamma) + " = <b>" + gB.toFixed(2).replace(".", ",") + "</b> &nbsp;(sin descontar: " + g1B + ")<br>" +
      "Con γ = <b>" + S.gamma.toFixed(2).replace(".", ",") + "</b> ⇒ <span class='" + (win === "empatan" ? "" : "good") + "'><b>" + win + "</b></span> · horizonte efectivo ≈ 1/(1−γ) = " + hor);
    view.redraw();
  }
  view.draw(draw); update();
});
