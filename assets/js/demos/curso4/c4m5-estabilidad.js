/* Experimento: por qué la softmax ingenua revienta en float32 y cómo lo evita restar el máximo (log-sum-exp).
   Se emula float32 con Math.fround. Parte 1: logits (c, c+1, c+2). Parte 2: logits (0, −d) y el logaritmo. */
Lab.register("curso4/c4m5-estabilidad", function (root, api) {
  var D = api.d, M = api.math, fr = Math.fround;
  var F32MAX = 3.4028234663852886e38, LOGMAX10 = Math.log10(F32MAX);
  var S = { c: 80, d: 90 };
  var view = api.view(root, { aspect: 2.2, minH: 190, maxH: 300, drag: false, label: "Logaritmo decimal de e elevado a x, con el límite de float32" });
  var plot = api.plot(view, { xr: [0, 120], yr: [0, 52], xticks: 6, yticks: 4, xlabel: "x (un logit)", ylabel: "log10(e^x)", pad: { l: 46, r: 12, t: 12, b: 38 }, yfmt: function (v) { return Math.round(v); }, xfmt: function (v) { return Math.round(v); } });
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.68rem, 2.5vw, .8rem)";
  ui.slider({ label: "c: logits (c, c+1, c+2)", min: 0, max: 120, step: 1, value: S.c, fmt: function (v) { return v; }, onInput: function (v) { S.c = v; update(); } });
  ui.slider({ label: "d: logits (0, −d), pérdida de la clase 1", min: 0, max: 200, step: 1, value: S.d, fmt: function (v) { return v; }, onInput: function (v) { S.d = v; update(); } });
  function e32(x) { return fr(Math.exp(x)); }
  function naive(z) {
    var e = z.map(e32), s = 0, i; for (i = 0; i < e.length; i++) s = fr(s + e[i]);
    return { e: e, s: s, p: e.map(function (v) { return fr(v / s); }) };
  }
  function stable(z) {
    var m = Math.max.apply(null, z), e = z.map(function (v) { return e32(v - m); }), s = 0, i; for (i = 0; i < e.length; i++) s = fr(s + e[i]);
    return e.map(function (v) { return fr(v / s); });
  }
  function fmt(v) {
    if (v === Infinity) return "inf"; if (isNaN(v)) return "nan";
    if (v !== 0 && Math.abs(v) < 1e-3) return v.toExponential(1);
    if (Math.abs(v) >= 1e5) return v.toExponential(2);
    return v.toFixed(4);
  }
  view.draw(function (ctx, w, h, C) {
    plot.axes(ctx); ctx.save(); plot.clip(ctx);
    var b = plot.box;
    D.rect(ctx, b.x, b.y, b.w, plot.y(LOGMAX10) - b.y, C.terracotaWash);
    D.path(ctx, [[plot.x(0), plot.y(0)], [plot.x(120), plot.y(120 / Math.LN10)]], C.cobalto, 2.6);
    D.line(ctx, b.x, plot.y(LOGMAX10), b.x + b.w, plot.y(LOGMAX10), C.terracota, 1.6, [5, 3]);
    var xs = [S.c, S.c + 1, S.c + 2];
    xs.forEach(function (x, i) {
      var px = plot.x(Math.min(x, 120)), py = plot.y(Math.min(x / Math.LN10, 52)), over = x / Math.LN10 > LOGMAX10;
      D.circle(ctx, px, py, 5.5, over ? C.terracota : C.oliva, C.paper, 2);
    });
    var lx = plot.x(Math.min(S.c + 2, 120)), ly = plot.y(Math.min((S.c + 2) / Math.LN10, 52));
    D.text(ctx, "tus 3 logits", lx - 12, ly - 8, { size: 10.5, weight: 700, color: C.ink, align: "right" });
    ctx.restore();
    D.text(ctx, "máximo de float32 ≈ 3,4·10^38 (x ≈ 88,72)", b.x + 8, plot.y(LOGMAX10) - 7, { size: 10.5, weight: 600, color: C.terracotaInk });
    D.text(ctx, "desbordamiento → inf", b.x + b.w - 6, b.y + 14, { size: 10.5, color: C.terracotaInk, align: "right" });
  });
  function update() {
    var z = [S.c, S.c + 1, S.c + 2], nv = naive(z), st = stable(z);
    var line1 = "<b>Parte 1.</b> logits = (" + z.join(", ") + ")<br>" +
      "e<sup>z</sup> en float32 = (" + nv.e.map(fmt).join(", ") + ") · suma = " + fmt(nv.s) + "<br>" +
      "softmax ingenua = (" + nv.p.map(fmt).join(", ") + ")" + (nv.p.some(function (v) { return isNaN(v); }) ? " <span class='bad'>← NaN</span>" : (Math.abs(M.sum(nv.p) - 1) > 1e-3 ? " <span class='bad'>← no suma 1</span>" : " <span class='good'>← correcta</span>")) + "<br>" +
      "restando el máximo = (" + st.map(fmt).join(", ") + ") <span class='good'>← siempre correcta</span>";
    var p1 = fr(e32(-S.d) / fr(1 + e32(-S.d))), ln = Math.log(p1);
    var line2 = "<br><b>Parte 2.</b> logits = (0, −" + S.d + ") · clase 1 · p1 ingenua = " + (p1 === 0 ? "0" : p1.toExponential(2)) + "<br>" +
      "ln(p1) ingenuo = <b>" + (ln === -Infinity ? "−inf" : ln.toFixed(2)) + "</b> · log_softmax = −d = <b>−" + S.d + "</b>" + (ln === -Infinity ? " <span class='bad'>← ¡pérdida infinita!</span>" : "");
    out.set(line1 + line2);
    view.redraw();
  }
  update();
});
