/* Experimento: el gradiente que viaja hacia atrás en el tiempo se multiplica por un factor en CADA paso.
   Se compara una RNN simple (factor = w·tanh') con la puerta de olvido de una LSTM (factor = f). Escala logarítmica. */
Lab.register("curso2/c2m4-gradiente-tiempo", function (root, api) {
  var D = api.d, C0 = api.colors();
  var S = { fr: 0.9, fl: 0.98, L: 50 };

  function n(v, k) { return v.toFixed(k).replace(".", ",").replace("-", "−"); }
  function sci(v) {
    if (v === 0) return "0";
    var e = v.toExponential(1).split("e"), ex = parseInt(e[1], 10);
    return n(parseFloat(e[0]), 1) + "·10<sup>" + String(ex).replace("-", "−") + "</sup>";
  }
  function lg(factor, k) { return k * Math.log10(factor); }

  var view = api.view(root, { aspect: 1.9, minH: 250, maxH: 380, label: "Tamaño del gradiente al retroceder en el tiempo, en escala logarítmica, para una RNN simple y para una LSTM" });
  var po = { xr: [0, S.L], yr: [-12, 4], xticks: 5, yticks: 8, xlabel: "pasos hacia atrás desde el final de la secuencia", ylabel: "tamaño del gradiente", pad: { l: 54, r: 14, t: 14, b: 40 },
    xfmt: function (v) { return Math.round(v); }, yfmt: function (v) { return "1e" + String(Math.round(v)).replace("-", "−"); } };
  var plot = api.plot(view, po);
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.72rem, 2.7vw, .84rem)";
  ui.slider({ label: "Factor por paso de la RNN simple (w · tanh′)", min: 0.3, max: 1.6, step: 0.01, value: S.fr, fmt: function (v) { return n(v, 2); }, onInput: function (v) { S.fr = v; update(); } });
  ui.slider({ label: "Puerta de olvido f de la LSTM", min: 0.5, max: 1, step: 0.005, value: S.fl, fmt: function (v) { return n(v, 3); }, onInput: function (v) { S.fl = v; update(); } });
  ui.slider({ label: "Longitud de la secuencia (pasos)", min: 5, max: 100, step: 1, value: S.L, fmt: function (v) { return v; }, onInput: function (v) { S.L = v; update(); } });
  api.legend(root, [[C0.terracota, "RNN simple: (factor)ᵏ"], [C0.cobalto, "LSTM: fᵏ"], [C0.muted, "1 = el gradiente llega intacto"]]);

  function bounds() {
    var vals = [lg(S.fr, S.L), lg(S.fl, S.L), 0], lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    lo = Math.min(-2, Math.floor(lo) - 1); hi = Math.max(1, Math.ceil(hi) + 1);
    var span = hi - lo, step = span > 24 ? 6 : span > 12 ? 3 : span > 6 ? 2 : 1;
    lo = step * Math.floor(lo / step); hi = step * Math.ceil(hi / step);
    return [lo, hi, step];
  }
  function line(ctx, factor, color, w) {
    var pts = [], k, b = plot.box;
    for (k = 0; k <= S.L; k++) pts.push([plot.x(k), plot.y(lg(factor, k))]);
    ctx.save(); plot.clip(ctx); D.path(ctx, pts, color, w); ctx.restore();
  }
  function draw(ctx, w, h, C) {
    var bd = bounds();
    plot.xr = [0, S.L]; plot.yr = [bd[0], bd[1]]; po.yticks = (bd[1] - bd[0]) / bd[2]; po.xticks = S.L <= 20 ? S.L : 5;
    plot.axes(ctx);
    var b = plot.box;
    D.line(ctx, b.x, plot.y(0), b.x + b.w, plot.y(0), C.muted, 1.5, [5, 4]);
    D.line(ctx, b.x, plot.y(-2), b.x + b.w, plot.y(-2), C.line, 1, [2, 3]);
    D.text(ctx, "1 % del gradiente original", b.x + 6, plot.y(-2) - 4, { size: 10.5, color: C.muted });
    line(ctx, S.fr, C.terracota, 2.6);
    line(ctx, S.fl, C.cobalto, 2.6);
    var yr = plot.y(Math.max(bd[0], Math.min(bd[1], lg(S.fr, S.L)))), yl = plot.y(Math.max(bd[0], Math.min(bd[1], lg(S.fl, S.L))));
    D.circle(ctx, b.x + b.w, yr, 5, C.terracota, C.paper, 1.5);
    D.circle(ctx, b.x + b.w, yl, 5, C.cobalto, C.paper, 1.5);
  }
  function pasos(f) {
    if (f < 0.9995) return "baja al 1 % en <b>" + Math.ceil(Math.log(0.01) / Math.log(f)) + "</b> pasos";
    if (f > 1.0005) return "se multiplica por 100 en <b>" + Math.ceil(Math.log(100) / Math.log(f)) + "</b> pasos";
    return "se mantiene";
  }
  function update() {
    view.redraw();
    var gr = Math.pow(S.fr, S.L), gl = Math.pow(S.fl, S.L);
    var msg;
    if (S.fr < 1) msg = "<span class='bad'>La RNN simple ya no recibe señal de lo que pasó al principio: no puede aprender dependencias largas.</span>";
    else if (S.fr > 1.0005) msg = "<span class='bad'>La RNN simple recibe un gradiente enorme: los pesos se disparan (exploding gradient).</span>";
    else msg = "<span class='good'>Factor exacto 1: el gradiente llega intacto (en la práctica es muy difícil de mantener).</span>";
    out.set("RNN simple: " + n(S.fr, 2) + "<sup>" + S.L + "</sup> = <b>" + sci(gr) + "</b> → " + pasos(S.fr) + "<br>" +
      "LSTM (f = " + n(S.fl, 3) + "): " + n(S.fl, 3) + "<sup>" + S.L + "</sup> = <b>" + sci(gl) + "</b> → " + pasos(S.fl) + "<br>" +
      "Cociente LSTM / RNN: <b>" + (gr > 0 ? sci(gl / gr) : "∞") + "</b><br>" + msg);
  }
  view.draw(draw); update();
});
