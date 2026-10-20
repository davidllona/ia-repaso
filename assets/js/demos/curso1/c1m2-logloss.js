/* Experimento: log-loss. Penaliza poco al que acierta con seguridad y brutalmente al que se equivoca con seguridad. */
Lab.register("curso1/c1m2-logloss", function (root, api) {
  var M = api.math, pv = 0.9, showSq = false;
  var ys = [1, 0, 1, 0], ps = [0.95, 0.2, 0.6, 0.7], names = ["Ana", "Luis", "Marta", "Pablo"];

  var vA = api.view(root, { aspect: 2.0, minH: 250, label: "Curvas de la pérdida −ln(p) cuando la realidad es 1 y −ln(1−p) cuando la realidad es 0, según la probabilidad que da el modelo" });
  var poA = { xr: [0, 1], yr: [0, 5], xticks: 10, yticks: 5, xlabel: "probabilidad de «cancela» que da el modelo (p̂)", ylabel: "pérdida", pad: { l: 42, r: 12, t: 12, b: 40 } };
  var pA = api.plot(vA, poA);
  var ui = api.controls(root);
  ui.slider({ label: "p̂ que da el modelo", min: 0.01, max: 0.99, step: 0.01, value: pv, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { pv = v; update(); } });
  ui.toggle({ label: "Comparar con el error al cuadrado (1 − p̂)²", value: false, onChange: function (v) { showSq = v; update(); } });
  var out = api.readout(root);

  var vB = api.view(root, { aspect: 2.6, minH: 190, label: "Pérdida de cada uno de los cuatro clientes y log-loss medio" });
  var pB = api.plot(vB, { xr: [0, 4], yr: [0, 3], xticks: 4, yticks: 3, ylabel: "pérdida del cliente", xfmt: function () { return ""; }, pad: { l: 42, r: 12, t: 12, b: 40 } });
  api.legend(root, [[api.colors().terracota, "cliente que canceló (realidad = 1)"], [api.colors().cobalto, "cliente que se quedó (realidad = 0)"], [api.colors().ink, "línea de puntos: log-loss medio"]]);
  var ui2 = api.controls(root);
  names.forEach(function (nm, k) {
    ui2.slider({ label: nm + " (" + (ys[k] ? "canceló" : "se quedó") + "): p̂ de cancelar", min: 0.01, max: 0.99, step: 0.01, value: ps[k], fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { ps[k] = v; update(); } });
  });
  var out2 = api.readout(root);

  function loss(y, p) { return y ? -Math.log(p) : -Math.log(1 - p); }
  function drawA(ctx, w, h, C) {
    var D = api.d, b = pA.box, i, c1 = [], c0 = [], cs = [];
    poA.xticks = w < 480 ? 5 : 10;
    pA.axes(ctx); ctx.save(); pA.clip(ctx);
    for (i = 1; i <= 199; i++) { var p = i / 200; c1.push([pA.x(p), pA.y(-Math.log(p))]); c0.push([pA.x(p), pA.y(-Math.log(1 - p))]); cs.push([pA.x(p), pA.y((1 - p) * (1 - p))]); }
    if (showSq) D.path(ctx, cs, C.muted, 2.5, [6, 5]);
    D.path(ctx, c1, C.terracota, 3); D.path(ctx, c0, C.cobalto, 3);
    D.line(ctx, pA.x(pv), b.y, pA.x(pv), b.y + b.h, C.ink2, 1.3, [4, 3]);
    D.circle(ctx, pA.x(pv), pA.y(-Math.log(pv)), 6.5, C.terracota, C.ink, 2);
    D.circle(ctx, pA.x(pv), pA.y(-Math.log(1 - pv)), 6.5, C.cobalto, C.ink, 2);
    if (showSq) D.circle(ctx, pA.x(pv), pA.y((1 - pv) * (1 - pv)), 5, C.muted, C.ink, 1.5);
    ctx.restore();
    D.text(ctx, "si canceló (realidad = 1): −ln(p̂)", pA.x(0.2), pA.y(4.65), { size: 11, color: C.terracotaInk, weight: 600 });
    D.text(ctx, "si se quedó (realidad = 0): −ln(1−p̂)", pA.x(0.92), pA.y(4.1), { size: 11, color: C.cobaltoInk, weight: 600, align: "right" });
    if (showSq) D.text(ctx, "a trazos: (1−p̂)² cuando la realidad es 1", b.x + b.w / 2, b.y + b.h - 8, { size: 10.5, color: C.muted, align: "center" });
  }
  function drawB(ctx, w, h, C) {
    var D = api.d, b = pB.box, k, L = ps.map(function (p, q) { return loss(ys[q], p); }), mean = M.mean(L), slot = b.w / 4;
    pB.axes(ctx); ctx.save(); pB.clip(ctx);
    for (k = 0; k < 4; k++) {
      var bh = b.h * Math.min(L[k], 3) / 3, bx = b.x + k * slot + slot * 0.22;
      D.rect(ctx, bx, b.y + b.h - bh, slot * 0.56, bh, ys[k] ? C.terracota : C.cobalto, C.ink, 1.2);
    }
    D.line(ctx, b.x, pB.y(mean), b.x + b.w, pB.y(mean), C.ink, 2, [6, 4]);
    ctx.restore();
    for (k = 0; k < 4; k++) {
      D.text(ctx, names[k], b.x + (k + 0.5) * slot, b.y + b.h + 15, { size: 11, align: "center", color: C.ink2, weight: 600 });
      D.text(ctx, "p̂ " + ps[k].toFixed(2), b.x + (k + 0.5) * slot, b.y + b.h + 29, { size: 10, align: "center", color: C.muted, mono: true });
    }
  }
  function update() {
    vA.redraw(); vB.redraw();
    var a1 = -Math.log(pv), a0 = -Math.log(1 - pv);
    out.set("p̂ = <b>" + pv.toFixed(2) + "</b><br>Si en realidad canceló (1): pérdida = −ln(" + pv.toFixed(2) + ") = <b>" + a1.toFixed(3) + "</b>" + (showSq ? " · error al cuadrado = " + ((1 - pv) * (1 - pv)).toFixed(3) : "") + "<br>" +
      "Si en realidad se quedó (0): pérdida = −ln(" + (1 - pv).toFixed(2) + ") = <b>" + a0.toFixed(3) + "</b>" + (showSq ? " · error al cuadrado = " + (pv * pv).toFixed(3) : "") + "<br>" +
      (pv > 0.9 ? "<span class='good'>Si cancela, casi no hay castigo; si se queda, el castigo se dispara.</span>" : (pv < 0.1 ? "<span class='good'>Si se queda, casi no hay castigo; si cancela, el castigo se dispara.</span>" : "Con p̂ intermedia el castigo es moderado en los dos casos.")));
    var L = ps.map(function (p, q) { return loss(ys[q], p); }), mean = M.mean(L), acc = 0;
    ps.forEach(function (p, q) { if ((p >= 0.5 ? 1 : 0) === ys[q]) acc++; });
    out2.set("Pérdidas: " + L.map(function (v, q) { return names[q] + " <b>" + v.toFixed(3) + "</b>"; }).join(" · ") + "<br>" +
      "log-loss medio = <b>" + mean.toFixed(4) + "</b> · accuracy (umbral 0,5) = <b>" + (100 * acc / 4).toFixed(0) + " %</b>");
  }
  vA.draw(drawA); vB.draw(drawB); update();
});
