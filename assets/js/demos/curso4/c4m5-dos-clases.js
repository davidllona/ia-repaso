/* Experimento: con K = 2 la softmax es la sigmoide de la diferencia de logits: p1 = σ(z1 − z0). */
Lab.register("curso4/c4m5-dos-clases", function (root, api) {
  var D = api.d, M = api.math;
  var S = { z0: 0.5, z1: 1.5 };
  var row = api.el("div", { class: "lab-row" }), colA = api.el("div"), colB = api.el("div");
  row.appendChild(colA); row.appendChild(colB); root.appendChild(row);
  var viewA = api.view(colA, { aspect: 1.5, minH: 200, maxH: 300, label: "Curva sigmoide de la diferencia de logits con el punto actual" });
  var plot = api.plot(viewA, { xr: [-8, 8], yr: [0, 1], xticks: 4, yticks: 4, xlabel: "d = z1 − z0", pad: { l: 40, r: 14, t: 12, b: 36 } });
  var viewB = api.view(colB, { aspect: 1.5, minH: 200, maxH: 300, label: "Probabilidades de acción y comedia por softmax" });
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.7rem, 2.6vw, .82rem)";
  var s0 = ui.slider({ label: "logit z0 (acción, clase 0)", min: -5, max: 5, step: 0.1, value: S.z0, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.z0 = v; update(); } });
  var s1 = ui.slider({ label: "logit z1 (comedia, clase 1)", min: -5, max: 5, step: 0.1, value: S.z1, fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { S.z1 = v; update(); } });
  ui.button("Sumar 2 a los dos", function () { S.z0 = Math.min(5, S.z0 + 2); S.z1 = Math.min(5, S.z1 + 2); s0.set(S.z0, true); s1.set(S.z1, true); update(); });
  ui.button("z0 = z1", function () { S.z0 = S.z1; s0.set(S.z0, true); update(); });
  viewA.draw(function (ctx, w, h, C) {
    plot.axes(ctx); ctx.save(); plot.clip(ctx);
    var pts = [], i; for (i = 0; i <= 160; i++) { var d = -8 + 16 * i / 160; pts.push([plot.x(d), plot.y(M.sigmoid(d))]); }
    D.path(ctx, pts, C.cobalto, 2.6);
    D.line(ctx, plot.x(-8), plot.y(0.5), plot.x(8), plot.y(0.5), C.muted, 1, [4, 3]);
    var d0 = S.z1 - S.z0, dc = M.clamp(d0, -8, 8), px = plot.x(dc), py = plot.y(M.sigmoid(dc));
    D.line(ctx, px, plot.y(0), px, py, C.terracota, 1.4, [3, 3]); D.line(ctx, plot.x(-8), py, px, py, C.terracota, 1.4, [3, 3]);
    D.circle(ctx, px, py, 6.5, C.terracota, C.paper, 2);
    ctx.restore();
    D.text(ctx, "σ(d) = p de la clase 1", plot.box.x + 6, plot.box.y + 14, { size: 11, weight: 600, color: C.cobaltoInk });
  });
  viewB.draw(function (ctx, w, h, C) {
    var p = M.softmax([S.z0, S.z1]), cl = [C.cobalto, C.terracota], k, bh = Math.min(34, (h - 60) / 2 - 8), x0 = 40, wmax = w - x0 - 58;
    D.text(ctx, "softmax([z0, z1]): p0 = acción, p1 = comedia", 10, 18, { size: 11, weight: 700, color: C.ink2 });
    for (k = 0; k < 2; k++) {
      var y = 34 + k * (bh + 16);
      D.text(ctx, "p" + k, 10, y + bh / 2 + 5, { size: 13, weight: 700 });
      D.rect(ctx, x0, y, wmax, bh, C.surface, C.line, 1);
      D.rect(ctx, x0, y, Math.max(1, wmax * p[k]), bh, cl[k]);
      D.text(ctx, (p[k] * 100).toFixed(1) + "%", x0 + wmax + 5, y + bh / 2 + 4, { size: 10.5, mono: true });
    }
    D.text(ctx, "suma = " + (p[0] + p[1]).toFixed(3), 10, h - 10, { size: 11, mono: true, color: C.ink2 });
  });
  function update() {
    var p = M.softmax([S.z0, S.z1]), d = S.z1 - S.z0, sg = M.sigmoid(d);
    out.set("softmax: p1 = e^" + S.z1.toFixed(1) + " / (e^" + S.z0.toFixed(1) + " + e^" + S.z1.toFixed(1) + ") = <b>" + p[1].toFixed(4) + "</b><br>" +
      "sigmoide: σ(z1 − z0) = σ(" + d.toFixed(1) + ") = <b>" + sg.toFixed(4) + "</b> · diferencia = " + Math.abs(p[1] - sg).toExponential(1) + "<br>" +
      "Con 64 rasgos por tráiler: softmax de 2 géneros = 2·64 + 2 = <b>130</b> parámetros; una sigmoide = 64 + 1 = <b>65</b>. Solo cuenta la diferencia z1 − z0.");
    viewA.redraw(); viewB.redraw();
  }
  update();
});
