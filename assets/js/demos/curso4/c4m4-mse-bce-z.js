/* Experimento: una sola muestra, y = 1 (o 0). Pérdida y GRADIENTE respecto a z para MSE y para BCE.
   MSE:  L = (p - y)^2        dL/dz = 2 (p - y) p (1 - p)   -> se apaga cuando p se satura
   BCE:  L = -ln(p)  (y = 1) dL/dz = p - y                  -> sigue creciendo cuanto más error */
Lab.register("curso4/c4m4-mse-bce-z", function (root, api) {
  var M = api.math, D = api.d, S = { z: -6, y: 1 };
  var grid = api.el("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "10px" } });
  root.appendChild(grid);
  var cellA = api.el("div"), cellB = api.el("div");
  grid.appendChild(cellA); grid.appendChild(cellB);
  var vA = api.view(cellA, { aspect: 1.5, minH: 210, maxH: 330, label: "Pérdida MSE y BCE en función de z" });
  var vB = api.view(cellB, { aspect: 1.5, minH: 210, maxH: 330, label: "Gradiente respecto a z para MSE y BCE" });
  var pA = api.plot(vA, { xr: [-8, 8], yr: [0, 8], xticks: 4, yticks: 4, xlabel: "z (la salida lineal)", ylabel: "pérdida", pad: { l: 42, r: 10, t: 10, b: 36 } });
  var pB = api.plot(vB, { xr: [-8, 8], yr: [-1, 1], xticks: 4, yticks: 4, xlabel: "z (la salida lineal)", ylabel: "gradiente dL/dz", pad: { l: 46, r: 10, t: 10, b: 36 }, yfmt: function (v) { return (+v.toFixed(2)).toString(); } });
  api.legend(root, [[api.colors().terracota, "MSE: (p − y)²"], [api.colors().cobalto, "BCE: entropía cruzada"]]);
  var ui = api.controls(root), out = api.readout(root);
  var sZ = ui.slider({ label: "z (puntuación del modelo)", min: -8, max: 8, step: 0.1, value: S.z, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.z = v; update(); } });
  ui.segmented({ label: "Respuesta correcta", options: [[1, "y = 1 (canceló)"], [0, "y = 0 (se quedó)"]], value: S.y, onChange: function (v) { S.y = v; update(); } });

  function sig(z) { return 1 / (1 + Math.exp(-z)); }
  function Lmse(z) { var p = sig(z); return (p - S.y) * (p - S.y); }
  function Lbce(z) { var p = sig(z); return S.y ? -Math.log(Math.max(p, 1e-12)) : -Math.log(Math.max(1 - p, 1e-12)); }
  function Gmse(z) { var p = sig(z); return 2 * (p - S.y) * p * (1 - p); }
  function Gbce(z) { return sig(z) - S.y; }

  function drawCurves(plot, f1, f2, clipTop) {
    return function (ctx, w, h, C) {
      plot.axes(ctx); ctx.save(); plot.clip(ctx);
      var i, a = [], b = [], zz;
      D.line(ctx, plot.x(-8), plot.y(0), plot.x(8), plot.y(0), C.line, 1.5);
      for (i = 0; i <= 160; i++) { zz = -8 + 16 * i / 160; a.push([plot.x(zz), plot.y(M.clamp(f1(zz), plot.yr[0] - 1, plot.yr[1] + 1))]); b.push([plot.x(zz), plot.y(M.clamp(f2(zz), plot.yr[0] - 1, plot.yr[1] + 1))]); }
      D.path(ctx, a, C.terracota, 3); D.path(ctx, b, C.cobalto, 3);
      D.line(ctx, plot.x(S.z), plot.box.y, plot.x(S.z), plot.box.y + plot.box.h, C.ink2, 1.2, [3, 4]);
      ctx.restore();
      D.circle(ctx, plot.x(S.z), plot.y(M.clamp(f1(S.z), plot.yr[0], plot.yr[1])), 6, C.terracota, C.ink, 2);
      D.circle(ctx, plot.x(S.z), plot.y(M.clamp(f2(S.z), plot.yr[0], plot.yr[1])), 6, C.cobalto, C.ink, 2);
    };
  }
  vA.draw(function (ctx, w, h, C) { drawCurves(pA, Lmse, Lbce)(ctx, w, h, C); });
  vB.draw(function (ctx, w, h, C) { drawCurves(pB, Gmse, Gbce)(ctx, w, h, C); });

  function update() {
    var p = sig(S.z), gm = Gmse(S.z), gb = Gbce(S.z), ratio = Math.abs(gm) < 1e-12 ? Infinity : Math.abs(gb / gm);
    var wrong = (p >= 0.5) !== (S.y === 1);
    out.set("z = <b>" + S.z.toFixed(1) + "</b> → p = σ(z) = <b>" + p.toFixed(5) + "</b> · el modelo " + (wrong ? "<span class='bad'>se equivoca" + (Math.abs(S.z) > 3 ? " con seguridad" : "") + "</span>" : "<span class='good'>acierta</span>") + "<br>" +
      "<span style='color:" + api.colors().terracotaInk + "'>MSE</span>: pérdida <b>" + Lmse(S.z).toFixed(4) + "</b> · gradiente 2(p−y)·p(1−p) = <b>" + gm.toFixed(5) + "</b><br>" +
      "<span style='color:" + api.colors().cobaltoInk + "'>BCE</span>: pérdida <b>" + Lbce(S.z).toFixed(4) + "</b> · gradiente p−y = <b>" + gb.toFixed(5) + "</b><br>" +
      "El gradiente de BCE es <b>" + (isFinite(ratio) ? ratio.toFixed(1) : "∞") + "</b> veces el de MSE" + (ratio > 20 && wrong ? " <span class='bad'>(MSE casi no empuja)</span>" : ""));
    vA.redraw(); vB.redraw();
  }
  update();
});
