/* Experimento: BCELoss(sigmoid(z)) frente a BCEWithLogitsLoss(z) en float32 (el tipo de PyTorch).
   Se emula la aritmética de 32 bits con Math.fround. Para |z| grande, la sigmoide se satura a 0 o 1 y el
   logaritmo ingenuo pierde la información (BCELoss recorta el log a -100). Mismas cuentas que el fragmento 7. */
Lab.register("curso4/c4m4-estabilidad", function (root, api) {
  var M = api.math, D = api.d, f32 = Math.fround, S = { z: -115, y: 1 };

  function sigma32(z) { var e = f32(Math.exp(-z)); return f32(1 / f32(1 + e)); }
  function log32(p) { return p <= 0 ? -Infinity : Math.log(p); }
  function ingenua(z, y) {
    var p = sigma32(z), q = f32(1 - p);
    var lp = Math.max(log32(p), -100), lq = Math.max(log32(q), -100);
    return -(y * lp + (1 - y) * lq);
  }
  function estable(z, y) { return Math.max(z, 0) - z * y + Math.log(1 + Math.exp(-Math.abs(z))); }

  var view = api.view(root, { aspect: 1.9, minH: 230, maxH: 360, label: "Pérdida calculada de forma ingenua y de forma estable en función de z" });
  var plot = api.plot(view, { xr: [-130, 130], yr: [0, 135], xticks: 4, yticks: 3, xlabel: "z (la puntuación del modelo)", ylabel: "pérdida", pad: { l: 44, r: 10, t: 10, b: 36 } });
  api.legend(root, [[api.colors().terracota, "BCELoss(sigmoid(z))  (ingenua)"], [api.colors().cobalto, "BCEWithLogitsLoss(z)  (estable)"]]);
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "z", min: -130, max: 130, step: 1, value: S.z, fmt: function (v) { return String(v); }, onInput: function (v) { S.z = v; update(); } });
  ui.segmented({ label: "Respuesta correcta", options: [[1, "y = 1"], [0, "y = 0"]], value: S.y, onChange: function (v) { S.y = v; update(); } });

  view.draw(function (ctx, w, h, C) {
    plot.axes(ctx);
    D.text(ctx, "tope del logaritmo: −100", plot.x(-55), plot.y(100) - 6, { size: 10.5, color: C.terracotaInk, weight: 600 });
    ctx.save(); plot.clip(ctx);
    var i, a = [], b = [], zz;
    for (i = 0; i <= 260; i++) { zz = -130 + i; a.push([plot.x(zz), plot.y(Math.min(135, ingenua(zz, S.y)))]); b.push([plot.x(zz), plot.y(Math.min(135, estable(zz, S.y)))]); }
    D.path(ctx, b, C.cobalto, 3); D.path(ctx, a, C.terracota, 3);
    D.line(ctx, plot.x(S.z), plot.box.y, plot.x(S.z), plot.box.y + plot.box.h, C.ink2, 1.2, [3, 4]);
    D.circle(ctx, plot.x(S.z), plot.y(ingenua(S.z, S.y)), 6, C.terracota, C.ink, 2);
    D.circle(ctx, plot.x(S.z), plot.y(estable(S.z, S.y)), 5, C.cobalto, C.ink, 2);
    ctx.restore();
  });
  function g(v) { return Math.abs(v) < 1e-3 && v !== 0 ? v.toExponential(2) : v.toFixed(4); }
  function update() {
    var p = sigma32(S.z), q = f32(1 - p), a = ingenua(S.z, S.y), b = estable(S.z, S.y), bad = Math.abs(a - b) > 0.01 * Math.max(1, b);
    out.set("z = <b>" + S.z + "</b>, y = <b>" + S.y + "</b><br>" +
      "float32: p = σ(z) = <b>" + (p === 0 ? "0 (se aplastó)" : p === 1 ? "1 (se aplastó)" : p.toExponential(3)) + "</b> · 1 − p = <b>" + (q === 0 ? "0 (se aplastó)" : q.toExponential(3)) + "</b><br>" +
      "BCELoss(sigmoid(z)) = <b>" + g(a) + "</b> · BCEWithLogitsLoss(z) = <b>" + g(b) + "</b> " + (bad ? "<span class='bad'>← no coinciden: la versión ingenua ha perdido información</span>" : "<span class='good'>← coinciden</span>"));
    view.redraw();
  }
  update();
});
