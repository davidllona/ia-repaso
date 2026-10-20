/* Experimento: UN paso del bucle de entrenamiento con cinco usuarios (x = días sin abrir la app, y = canceló), columna a columna.
   z = w·x + b -> p = sigmoide(z) -> error p - y -> (p - y)·x -> medias = gradientes -> w y b nuevos.
   Es el fragmento 8: con w = 0, b = 0 y lr = 1 salen dw = -0.3, db = 0.1. */
Lab.register("curso4/c4m4-paso-a-mano", function (root, api) {
  var M = api.math, D = api.d;
  var X = [1, 2, 3, 4, 5], Y = [0, 0, 0, 1, 1];
  var S = { w: 0, b: 0, lr: 1, pasos: 0 };

  var view = api.view(root, { aspect: 2.0, minH: 200, maxH: 320, label: "Cinco usuarios, la curva actual y la curva después del paso" });
  var plot = api.plot(view, { xr: [0, 6], yr: [-0.2, 1.2], xticks: 6, yticks: 7, xlabel: "x (días sin abrir)", ylabel: "p", pad: { l: 40, r: 10, t: 10, b: 36 }, yfmt: function (v) { return (+v.toFixed(1)).toString(); } });
  var tabla = api.table(root, ["x", "y", "z = w·x + b", "p = σ(z)", "p − y", "(p − y)·x", "pérdida"]);
  var ui = api.controls(root), out = api.readout(root);
  var sW = ui.slider({ label: "w", min: -2, max: 3, step: 0.05, value: S.w, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.w = v; update(); } });
  var sB = ui.slider({ label: "b", min: -6, max: 4, step: 0.05, value: S.b, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.b = v; update(); } });
  var sL = ui.slider({ label: "learning rate", min: 0.1, max: 5, step: 0.1, value: S.lr, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.lr = v; update(); } });
  ui.button("Dar el paso (w, b ← w − lr·dw, b − lr·db)", function () { var c = calc(); S.w = c.w2; S.b = c.b2; S.pasos++; sW.set(M.clamp(S.w, -2, 3), true); sB.set(M.clamp(S.b, -6, 4), true); update(); }, "primary");
  ui.button("Volver a w = 0, b = 0", function () { S.w = 0; S.b = 0; S.pasos = 0; sW.set(0, true); sB.set(0, true); update(); });

  function sig(z) { return 1 / (1 + Math.exp(-z)); }
  function calc() {
    var n = X.length, rows = [], gw = 0, gb = 0, L = 0, i, z, p, e, li;
    for (i = 0; i < n; i++) {
      z = S.w * X[i] + S.b; p = sig(z); e = p - Y[i]; li = -(Y[i] ? Math.log(p) : Math.log(1 - p));
      rows.push({ z: z, p: p, e: e, ex: e * X[i], l: li }); gw += e * X[i]; gb += e; L += li;
    }
    gw /= n; gb /= n; L /= n;
    var w2 = S.w - S.lr * gw, b2 = S.b - S.lr * gb, L2 = 0;
    for (i = 0; i < n; i++) { p = sig(w2 * X[i] + b2); L2 -= Y[i] ? Math.log(p) : Math.log(1 - p); }
    return { rows: rows, gw: gw, gb: gb, L: L, w2: w2, b2: b2, L2: L2 / n };
  }
  function f(v, k) { return (v < 0 ? "−" : "") + Math.abs(v).toFixed(k === undefined ? 4 : k); }

  view.draw(function (ctx, w, h, C) {
    plot.axes(ctx); ctx.save(); plot.clip(ctx);
    var c = calc(), i, a = [], b = [], xx;
    D.line(ctx, plot.x(0), plot.y(0.5), plot.x(6), plot.y(0.5), C.line, 1.2, [5, 4]);
    for (i = 0; i <= 90; i++) { xx = 6 * i / 90; a.push([plot.x(xx), plot.y(sig(S.w * xx + S.b))]); b.push([plot.x(xx), plot.y(sig(c.w2 * xx + c.b2))]); }
    D.path(ctx, b, C.terracota, 2.5, [6, 4]); D.path(ctx, a, C.ink, 3);
    for (i = 0; i < X.length; i++) D.circle(ctx, plot.x(X[i]), plot.y(Y[i]), 6.5, Y[i] ? C.cobalto : C.terracota, C.paper, 1.5);
    ctx.restore();
    D.text(ctx, "curva actual", plot.box.x + 8, plot.box.y + 14, { size: 11, color: C.ink, weight: 600 });
    D.text(ctx, "curva tras el paso (trazos)", plot.box.x + 8, plot.box.y + 28, { size: 11, color: C.terracotaInk, weight: 600 });
  });

  function update() {
    var c = calc(), n = X.length;
    tabla.set(c.rows.map(function (r, i) { return [X[i], Y[i], f(r.z, 3), f(r.p, 4), f(r.e, 4), f(r.ex, 4), f(r.l, 4)]; }).concat([["<b>media</b>", "", "", "", "<b>db = " + f(c.gb) + "</b>", "<b>dw = " + f(c.gw) + "</b>", "<b>" + f(c.L) + "</b>"]]));
    out.set("dw = media de (p−y)·x = <b>" + f(c.gw) + "</b> · db = media de (p−y) = <b>" + f(c.gb) + "</b><br>" +
      "w nuevo = " + f(S.w, 2) + " − " + S.lr.toFixed(1) + "·(" + f(c.gw) + ") = <b>" + f(c.w2) + "</b> · b nuevo = " + f(S.b, 2) + " − " + S.lr.toFixed(1) + "·(" + f(c.gb) + ") = <b>" + f(c.b2) + "</b><br>" +
      "Pérdida BCE: <b>" + f(c.L) + "</b> → <b>" + f(c.L2) + "</b> " + (c.L2 < c.L - 1e-9 ? "<span class='good'>(baja)</span>" : "<span class='bad'>(no baja: el paso es demasiado grande o ya estás en el fondo)</span>") + (S.pasos ? " · pasos dados: <b>" + S.pasos + "</b>" : ""));
    view.redraw();
  }
  update();
});
