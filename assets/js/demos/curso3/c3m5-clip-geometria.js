/* Experimento: recorte de gradientes en 2D. Arrastra la punta del gradiente g = (g₁, g₂).
   clipnorm=c: si ‖g‖ > c, g se reescala a norma c (conserva la DIRECCIÓN).
   clipvalue=v: cada componente se recorta a [−v, v] (puede CAMBIAR la dirección). */
Lab.register("curso3/c3m5-clip-geometria", function (root, api) {
  var D = api.d, M = api.math;
  var S = { g: [4.2, 1.2], c: 2, v: 1.5, showN: true, showV: true };
  var view = api.view(root, { aspect: 1.5, minH: 260, maxH: 420, drag: true, label: "Plano del gradiente con el círculo de clipnorm y el cuadrado de clipvalue" });
  var plot = api.plot(view, { xr: [-6, 6], yr: [-4, 4], grid: false, xticks: 1, yticks: 1, pad: { l: 34, r: 12, t: 12, b: 28 }, xfmt: function () { return ""; }, yfmt: function () { return ""; }, xlabel: "gradiente respecto a w₁", ylabel: "gradiente respecto a w₂" });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "clipnorm (radio del círculo)", min: 0.5, max: 5, step: 0.25, value: S.c, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.c = v; update(); } });
  ui.slider({ label: "clipvalue (lado del cuadrado ±v)", min: 0.5, max: 5, step: 0.25, value: S.v, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.v = v; update(); } });
  ui.toggle({ label: "ver clipnorm", value: true, onChange: function (v) { S.showN = v; update(); } });
  ui.toggle({ label: "ver clipvalue", value: true, onChange: function (v) { S.showV = v; update(); } });
  api.legend(root, [[api.colors().ink, "gradiente original g"], [api.colors().cobalto, "tras clipnorm"], [api.colors().terracota, "tras clipvalue"]]);

  function setG(px, py) {
    if (!plot.inside(px, py)) { px = M.clamp(px, plot.box.x, plot.box.x + plot.box.w); py = M.clamp(py, plot.box.y, plot.box.y + plot.box.h); }
    S.g = [Math.round(plot.ix(px) * 20) / 20, Math.round(plot.iy(py) * 20) / 20]; update();
  }
  view.pointer({ down: setG, drag: setG });
  function norm(v) { return Math.sqrt(v[0] * v[0] + v[1] * v[1]); }
  function clipN(g) { var n = norm(g); return n > S.c ? [g[0] * S.c / n, g[1] * S.c / n] : g.slice(); }
  function clipV(g) { return [M.clamp(g[0], -S.v, S.v), M.clamp(g[1], -S.v, S.v)]; }
  function ang(v) { return Math.atan2(v[1], v[0]) * 180 / Math.PI; }

  function draw(ctx, w, h, C) {
    var b = plot.box, sc = b.w / 12;                       // misma escala en x e y para que el círculo sea redondo
    plot.yr = [-(b.h / sc) / 2, (b.h / sc) / 2];
    plot.axes(ctx);
    var k, hh = Math.floor((b.h / sc) / 2);
    for (k = -6; k <= 6; k++) { D.line(ctx, plot.x(k), b.y, plot.x(k), b.y + b.h, C.line, 1); D.text(ctx, String(k), plot.x(k), b.y + b.h + 14, { align: "center", size: 11, color: C.muted, mono: true }); }
    for (k = -hh; k <= hh; k++) { D.line(ctx, b.x, plot.y(k), b.x + b.w, plot.y(k), C.line, 1); D.text(ctx, String(k), b.x - 6, plot.y(k) + 4, { align: "right", size: 11, color: C.muted, mono: true }); }
    D.rect(ctx, b.x, b.y, b.w, b.h, null, C.ink, 1.5);
    var ox = plot.x(0), oy = plot.y(0);
    ctx.save(); plot.clip(ctx);
    D.line(ctx, ox, b.y, ox, b.y + b.h, C.muted, 1); D.line(ctx, b.x, oy, b.x + b.w, oy, C.muted, 1);
    if (S.showN) { ctx.beginPath(); ctx.arc(ox, oy, S.c * sc, 0, 6.2832); ctx.strokeStyle = C.cobalto; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.stroke(); ctx.setLineDash([]); }
    if (S.showV) { ctx.strokeStyle = C.terracota; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.strokeRect(plot.x(-S.v), plot.y(S.v), 2 * S.v * sc, 2 * S.v * sc); ctx.setLineDash([]); }
    var gN = clipN(S.g), gV = clipV(S.g);
    if (S.showV) D.arrow(ctx, ox, oy, plot.x(gV[0]), plot.y(gV[1]), C.terracota, 3);
    if (S.showN) D.arrow(ctx, ox, oy, plot.x(gN[0]), plot.y(gN[1]), C.cobalto, 3);
    D.arrow(ctx, ox, oy, plot.x(S.g[0]), plot.y(S.g[1]), C.ink, 1.8);
    ctx.restore();
    D.circle(ctx, plot.x(S.g[0]), plot.y(S.g[1]), 7, C.paper, C.ink, 2.5);
    D.text(ctx, "arrástrame", plot.x(S.g[0]) + (S.g[0] > 3 ? -10 : 10), plot.y(S.g[1]) - 12, { align: S.g[0] > 3 ? "right" : "left", size: 11, color: C.ink2, weight: 600 });
  }
  view.draw(draw);

  function f2(v) { return v.toFixed(2).replace("-", "−"); }
  function update() {
    var g = S.g, n = norm(g), gN = clipN(g), gV = clipV(g);
    var dN = Math.abs(ang(gN) - ang(g)), dV = Math.abs(ang(gV) - ang(g));
    if (n < 1e-9) dN = dV = 0;
    out.set("g = (<b>" + f2(g[0]) + "</b>, <b>" + f2(g[1]) + "</b>) · ‖g‖ = √(" + f2(g[0] * g[0]) + " + " + f2(g[1] * g[1]) + ") = <b>" + f2(n) + "</b> · ángulo = " + ang(g).toFixed(1) + "°" +
      "<br><span style='color:var(--cobalto-ink)'>clipnorm=" + S.c.toFixed(2) + "</span> → (" + f2(gN[0]) + ", " + f2(gN[1]) + "), norma " + f2(norm(gN)) + (n > S.c ? " · reescalado por " + f2(S.c / n) : " · no hace nada (‖g‖ ≤ c)") + " · cambio de ángulo: <b class='good'>" + dN.toFixed(1) + "°</b>" +
      "<br><span style='color:var(--terracota-ink)'>clipvalue=" + S.v.toFixed(2) + "</span> → (" + f2(gV[0]) + ", " + f2(gV[1]) + "), norma " + f2(norm(gV)) + " · cambio de ángulo: <b class='" + (dV > 0.05 ? "bad" : "good") + "'>" + dV.toFixed(1) + "°</b>");
    view.redraw();
  }
  update();
});
