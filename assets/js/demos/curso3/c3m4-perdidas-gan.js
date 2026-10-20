/* Experimento: pérdida saturante log(1 − D(G(z))) frente a la no saturante −log D(G(z)). Se dibujan la pérdida y su gradiente respecto al logit
   s del discriminador (lo que recibe el generador) en función de p = D(G(z)) = σ(s). */
Lab.register("curso3/c3m4-perdidas-gan", function (root, api) {
  var D = api.d, M = api.math;
  var S = { s: -4 };
  var v1 = api.view(root, { aspect: 2.5, minH: 150, maxH: 230, label: "Pérdida del generador según lo que opina el discriminador" });
  var v2 = api.view(root, { aspect: 2.5, minH: 150, maxH: 230, label: "Gradiente que recibe el generador según lo que opina el discriminador" });
  var ui = api.controls(root), out = api.readout(root);
  var sl = ui.slider({ label: "Logit s del crítico D sobre un póster falso (p = σ(s))", min: -7, max: 7, step: 0.1, value: S.s, fmt: function (v) { return v.toFixed(1).replace(".", ",").replace("-", "−"); }, onInput: function (v) { S.s = v; update(); } });
  ui.button("El crítico lo huele (p ≈ 0)", function () { sl.set(-6); });
  ui.button("Crítico indeciso (p = 0,5)", function () { sl.set(0); });
  ui.button("Crítico engañado (p ≈ 1)", function () { sl.set(6); });
  var sig = function (s) { return 1 / (1 + Math.exp(-s)); };
  var P1 = api.plot(v1, { xr: [0, 1], yr: [-4, 4], pad: { l: 40, r: 10, t: 10, b: 26 }, xticks: 5, yticks: 4, xfmt: function (v) { return v.toFixed(1).replace(".", ","); }, yfmt: function (v) { return Math.round(v); } });
  var P2 = api.plot(v2, { xr: [0, 1], yr: [-1.2, 0.2], pad: { l: 40, r: 10, t: 10, b: 34 }, xticks: 5, yticks: 7, xlabel: "p = D(G(z))  (prob. de «real» según el crítico)", xfmt: function (v) { return v.toFixed(1).replace(".", ","); }, yfmt: function (v) { return v.toFixed(1).replace(".", ",").replace("-", "−"); } });
  function curves(P, ctx, f1, f2, C, p) {
    var a = [], b = [], x;
    for (x = 0.003; x < 0.9975; x += 0.004) { a.push([P.x(x), P.y(f1(x))]); b.push([P.x(x), P.y(f2(x))]); }
    ctx.save(); P.clip(ctx); D.path(ctx, a, C.cobalto, 2.8); D.path(ctx, b, C.terracota, 2.8);
    D.line(ctx, P.x(p), P.box.y, P.x(p), P.box.y + P.box.h, C.ink, 1.2, [4, 3]);
    D.circle(ctx, P.x(p), P.y(f1(p)), 5.5, C.cobalto, C.paper, 2); D.circle(ctx, P.x(p), P.y(f2(p)), 5.5, C.terracota, C.paper, 2);
    ctx.restore();
  }
  function d1(ctx, w, h, C) {
    var p = sig(S.s); P1.axes(ctx);
    curves(P1, ctx, function (x) { return Math.log(1 - x); }, function (x) { return -Math.log(x); }, C, p);
    D.text(ctx, "pérdida de G", P1.box.x + 6, P1.box.y + 14, { size: 11, weight: 700, color: C.ink2 });
    D.text(ctx, "— saturante: log(1 − p)", P1.box.x + P1.box.w * 0.42, P1.box.y + 14, { size: 11, weight: 700, color: C.cobaltoInk });
    D.text(ctx, "— no saturante: −log p", P1.box.x + P1.box.w * 0.42, P1.box.y + 29, { size: 11, weight: 700, color: C.terracotaInk });
  }
  function d2(ctx, w, h, C) {
    var p = sig(S.s); P2.axes(ctx);
    curves(P2, ctx, function (x) { return -x; }, function (x) { return -(1 - x); }, C, p);
    D.text(ctx, "gradiente ∂L/∂s", P2.box.x + 6, P2.box.y + 14, { size: 11, weight: 700, color: C.ink2 });
    D.text(ctx, "saturante: −p", P2.box.x + P2.box.w * 0.62, P2.box.y + P2.box.h - 22, { size: 11, weight: 700, color: C.cobaltoInk });
    D.text(ctx, "no saturante: −(1 − p)", P2.box.x + P2.box.w * 0.34, P2.box.y + 29, { size: 11, weight: 700, color: C.terracotaInk });
  }
  function f(v, k) { return v.toFixed(k === undefined ? 3 : k).replace(".", ",").replace("-", "−"); }
  function update() {
    var p = sig(S.s), Ls = Math.log(1 - p), Ln = -Math.log(p), gs = -p, gn = -(1 - p);
    out.set("s = " + f(S.s, 1) + " → p = σ(s) = 1/(1 + e^" + f(-S.s, 1) + ") = <b>" + f(p, 4) + "</b><br>" +
      "<b>Saturante:</b> L = log(1 − p) = " + f(Ls) + " · gradiente ∂L/∂s = −p = <b>" + f(gs, 4) + "</b><br>" +
      "<b>No saturante:</b> L = −log p = " + f(Ln) + " · gradiente ∂L/∂s = −(1 − p) = <b>" + f(gn, 4) + "</b><br>" +
      (p < 0.05 ? "<span class='bad'>D lo tiene clarísimo (así empieza el entrenamiento): con la pérdida saturante el gradiente es " + f(Math.abs(gs), 3) + ", casi nada; con la no saturante es " + f(Math.abs(gn), 3) + ".</span>" :
        p > 0.95 ? "<span class='good'>D está engañado: G ya casi no necesita aprender más, y ambos gradientes lo reflejan.</span>" : "Zona intermedia: los dos gradientes son comparables."));
    v1.redraw(); v2.redraw();
  }
  v1.draw(d1); v2.draw(d2); update();
});
