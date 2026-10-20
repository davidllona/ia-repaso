/* Experimento: softmax puesta DOS veces (una en el modelo y otra dentro de CrossEntropyLoss). La clase correcta
   tiene el logit z0; las otras K−1 clases valen 0. Se compara pérdida y gradiente con el caso correcto. */
Lab.register("curso4/c4m5-doble-softmax", function (root, api) {
  var D = api.d, M = api.math;
  var S = { z0: 5, K: 10 };
  var row = api.el("div", { class: "lab-row" }), colA = api.el("div"), colB = api.el("div");
  row.appendChild(colA); row.appendChild(colB); root.appendChild(row);
  var vA = api.view(colA, { aspect: 1.45, minH: 190, maxH: 300, label: "Pérdida de la clase correcta según su logit, bien y con doble softmax" });
  var optA = { xr: [0, 20], yr: [0, 2.6], xticks: 4, yticks: 4, xlabel: "z0 (logit de la clase correcta)", pad: { l: 40, r: 10, t: 22, b: 36 } };
  var pA = api.plot(vA, optA);
  var vB = api.view(colB, { aspect: 1.45, minH: 190, maxH: 300, label: "Gradiente respecto a z0, bien y con doble softmax" });
  var pB = api.plot(vB, { xr: [0, 20], yr: [-1, 0], xticks: 4, yticks: 4, xlabel: "z0 (logit de la clase correcta)", pad: { l: 44, r: 10, t: 22, b: 36 } });
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.68rem, 2.5vw, .8rem)";
  ui.slider({ label: "z0: logit de la clase correcta (las demás valen 0)", min: 0, max: 20, step: 0.1, value: S.z0, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.z0 = v; update(); } });
  ui.slider({ label: "K: número de clases", min: 2, max: 20, step: 1, value: S.K, fmt: function (v) { return v; }, onInput: function (v) { S.K = v; update(); } });
  function calc(z0, K) {
    var e0 = Math.exp(z0), p0 = e0 / (e0 + K - 1), po = (1 - p0) / (K - 1);
    var L1 = -Math.log(p0), g1 = p0 - 1;
    var a = Math.exp(p0), b = Math.exp(po), q0 = a / (a + (K - 1) * b), qo = b / (a + (K - 1) * b);
    var L2 = -Math.log(q0);
    // dL2/dz0 = Σ_j (q_j − y_j)·dp_j/dz0 ;  dp_0/dz0 = p0(1−p0) ;  dp_j/dz0 = −p_j·p0
    var g2 = (q0 - 1) * p0 * (1 - p0) + (K - 1) * qo * (-po * p0);
    return { L1: L1, g1: g1, L2: L2, g2: g2, p0: p0, q0: q0 };
  }
  function curves(ctx, pl, key1, key2, C, ylab) {
    pl.axes(ctx); ctx.save(); pl.clip(ctx);
    var i, a = [], b = [];
    for (i = 0; i <= 120; i++) { var z = 20 * i / 120, r = calc(z, S.K); a.push([pl.x(z), pl.y(r[key1])]); b.push([pl.x(z), pl.y(r[key2])]); }
    D.path(ctx, a, C.cobalto, 2.6); D.path(ctx, b, C.terracota, 2.6);
    var r0 = calc(S.z0, S.K), px = pl.x(S.z0);
    D.line(ctx, px, pl.box.y, px, pl.box.y + pl.box.h, C.muted, 1, [3, 3]);
    D.circle(ctx, px, pl.y(r0[key1]), 5, C.cobalto, C.paper, 2); D.circle(ctx, px, pl.y(r0[key2]), 5, C.terracota, C.paper, 2);
    ctx.restore();
  }
  vA.draw(function (ctx, w, h, C) {
    var ymA = Math.max(1, Math.ceil(Math.log(S.K) * 2 + 0.05) / 2); pA.yr = [0, ymA]; optA.yticks = Math.round(ymA * 2);
    curves(ctx, pA, "L1", "L2", C);
    var floor = Math.log(1 + (S.K - 1) / Math.E);
    ctx.save(); pA.clip(ctx); D.line(ctx, pA.box.x, pA.y(floor), pA.box.x + pA.box.w, pA.y(floor), C.terracota, 1.2, [5, 3]); ctx.restore();
    D.text(ctx, "pérdida", 8, 14, { size: 11, weight: 700, color: C.ink2 });
    D.text(ctx, "bien", pA.box.x + 6, pA.box.y + 12, { size: 10.5, weight: 700, color: C.cobaltoInk });
    D.text(ctx, "doble softmax (suelo " + floor.toFixed(2) + ")", pA.box.x + pA.box.w - 4, pA.y(floor) - 5, { size: 10, weight: 700, color: C.terracotaInk, align: "right" });
  });
  vB.draw(function (ctx, w, h, C) {
    pB.yr = [-1, 0];
    curves(ctx, pB, "g1", "g2", C);
    D.text(ctx, "gradiente dL/dz0", 8, 14, { size: 11, weight: 700, color: C.ink2 });
  });
  function update() {
    var r = calc(S.z0, S.K);
    out.set("K = <b>" + S.K + "</b> · z0 = <b>" + S.z0.toFixed(1) + "</b> · la red dice p0 = <b>" + (r.p0 * 100).toFixed(2) + "%</b> a la clase correcta<br>" +
      "<span class='good'>bien</span>: pérdida <b>" + r.L1.toFixed(4) + "</b>, gradiente <b>" + (r.g1 >= 0 ? "+" : "") + r.g1.toFixed(5) + "</b><br>" +
      "<span class='bad'>doble softmax</span>: pérdida <b>" + r.L2.toFixed(4) + "</b>, gradiente <b>" + (r.g2 >= 0 ? "+" : "") + r.g2.toFixed(5) + "</b> · suelo ln(1 + (K−1)/e) = " + Math.log(1 + (S.K - 1) / Math.E).toFixed(4));
    vA.redraw(); vB.redraw();
  }
  update();
});
