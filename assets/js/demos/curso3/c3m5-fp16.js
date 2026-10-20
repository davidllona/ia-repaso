/* Experimento: precisión mixta (mixed_float16) y loss scaling.
   Un float16 solo representa magnitudes entre ≈6·10⁻⁸ (el subnormal más pequeño) y 65504; por debajo se redondea a 0 («underflow»)
   y por encima se convierte en inf («overflow»). Se simulan 3000 gradientes con log10|g| ~ Normal(μ, 1) y se redondean de verdad a
   float16 (redondeo al par más cercano, con subnormales). Multiplicar la pérdida por S antes de derivar multiplica todos los gradientes por S;
   luego se dividen entre S en float32. */
Lab.register("curso3/c3m5-fp16", function (root, api) {
  var D = api.d, M = api.math, N = 3000;
  var S = { mu: -6.5, e: 0, g: null };
  function rnd(q) { var f = Math.floor(q), d = q - f; if (d > 0.5) return f + 1; if (d < 0.5) return f; return f % 2 === 0 ? f : f + 1; }
  function half(x) {
    if (!isFinite(x) || x === 0) return x;
    var s = x < 0 ? -1 : 1, a = Math.abs(x), e, q;
    if (a >= 65520) return s * Infinity;
    if (a < Math.pow(2, -14)) return s * rnd(a / Math.pow(2, -24)) * Math.pow(2, -24);
    e = Math.floor(Math.log(a) / Math.LN2); if (Math.pow(2, e) > a) e--; if (Math.pow(2, e + 1) <= a) e++;
    q = a / Math.pow(2, e) * 1024; return s * rnd(q) / 1024 * Math.pow(2, e);
  }
  function make() { var R = api.rng(31), i; S.z = []; for (i = 0; i < N; i++) S.z.push(R.normal(0, 1)); }
  function stats(e) {
    var sc = Math.pow(2, e), under = 0, over = 0, errSum = 0, ok = 0, i, g, h, back;
    for (i = 0; i < N; i++) {
      g = Math.pow(10, S.mu + S.z[i]); h = half(g * sc);
      if (h === Infinity) over++; else if (h === 0) under++; else { back = h / sc; errSum += Math.abs(back - g) / g; ok++; }
    }
    return { under: under / N, over: over / N, err: ok ? errSum / ok : 0, ok: ok / N };
  }
  make();
  var view = api.view(root, { aspect: 2.3, minH: 220, maxH: 330, label: "Histograma de magnitudes de gradientes frente al rango representable en float16" });
  var pl = api.plot(view, { xr: [-12, 6], yr: [0, 1], xticks: 6, yticks: 1, xlabel: "log10 de la magnitud guardada en float16 (g · S)", pad: { l: 12, r: 12, t: 14, b: 36 }, xfmt: function (v) { return Math.round(v); }, yfmt: function () { return ""; } });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Gradientes típicos: log10 de su magnitud media", min: -10, max: -2, step: 0.5, value: S.mu, fmt: function (v) { return "10^" + v.toFixed(1); }, onInput: function (v) { S.mu = v; update(); } });
  var se = ui.slider({ label: "Loss scale S (potencia de 2)", min: 0, max: 24, step: 1, value: S.e, fmt: function (v) { return "2^" + v + " = " + Math.pow(2, v); }, onInput: function (v) { S.e = v; update(); } });
  ui.button("Dinámico: empezar en 2^15 y bajar mientras haya overflow", function () {
    var e = 15; while (e > 0 && stats(e).over > 0) e--;
    S.e = e; se.set(e, true); update();
  }, "primary");
  ui.button("Sin escalar (S = 1)", function () { S.e = 0; se.set(0, true); update(); });
  api.legend(root, [[api.colors().cobalto, "se representa bien"], [api.colors().terracota, "underflow: se pierde (0)"], [api.colors().marker, "overflow: inf"]]);

  function draw(ctx, w, h, C) {
    pl.axes(ctx);
    var b = pl.box, bins = 36, cnt = [], i, g, v, mx = 1, lg;
    for (i = 0; i < bins; i++) cnt.push(0);
    var shift = S.e * Math.log(2) / Math.LN10;
    for (i = 0; i < N; i++) { lg = S.mu + S.z[i] + shift; var k = Math.floor((lg + 12) / 0.5); if (k >= 0 && k < bins) cnt[k]++; else if (k >= bins) cnt[bins - 1]++; else cnt[0]++; mx = Math.max(mx, 0); }
    mx = Math.max.apply(null, cnt);
    var lo = Math.log(Math.pow(2, -24)) / Math.LN10, hi = Math.log(65504) / Math.LN10, nlo = Math.log(Math.pow(2, -14)) / Math.LN10;
    ctx.save(); pl.clip(ctx);
    D.rect(ctx, pl.x(-12), b.y, pl.x(lo) - pl.x(-12), b.h, C.terracotaWash);
    D.rect(ctx, pl.x(hi), b.y, pl.x(6) - pl.x(hi), b.h, C.markerWash);
    for (i = 0; i < bins; i++) {
      var x0 = -12 + i * 0.5, mid = x0 + 0.25, bh = cnt[i] / mx * (b.h - 22), col = mid < lo ? C.terracota : (mid >= hi ? C.marker : C.cobalto);
      D.rect(ctx, pl.x(x0) + 1, b.y + b.h - bh, pl.x(x0 + 0.5) - pl.x(x0) - 2, bh, col);
    }
    D.line(ctx, pl.x(lo), b.y, pl.x(lo), b.y + b.h, C.ink, 1.8, [5, 3]); D.line(ctx, pl.x(nlo), b.y, pl.x(nlo), b.y + b.h, C.ink2, 1.2, [2, 3]); D.line(ctx, pl.x(hi), b.y, pl.x(hi), b.y + b.h, C.ink, 1.8, [5, 3]);
    ctx.restore();
    D.text(ctx, "mín. 6·10⁻⁸", pl.x(lo) + 4, b.y + 12, { size: 10.5, weight: 600, color: C.ink });
    D.text(ctx, "máx. 65504", pl.x(hi) - 4, b.y + 12, { align: "right", size: 10.5, weight: 600, color: C.ink });
    D.text(ctx, "underflow", pl.x(-12) + 6, b.y + b.h - 6, { size: 10.5, color: C.terracotaInk, weight: 600 });
  }
  view.draw(draw);

  function update() {
    var a = stats(0), c = stats(S.e), sc = Math.pow(2, S.e);
    function pct(v) { return (100 * v).toFixed(1) + " %"; }
    out.set("Sin escalar (S = 1): <b class='" + (a.under > 0.05 ? "bad" : "good") + "'>" + pct(a.under) + "</b> de los gradientes se convierten en 0 · " + pct(a.over) + " en inf" +
      "<br>Con S = 2^" + S.e + " (" + sc + "): <b class='" + (c.under > 0.05 ? "bad" : "good") + "'>" + pct(c.under) + "</b> en 0 · <b class='" + (c.over > 0 ? "bad" : "good") + "'>" + pct(c.over) + "</b> en inf · error relativo medio de los que sobreviven: <b>" + (100 * c.err).toFixed(3) + " %</b>" +
      (c.over > 0 ? "<br><span class='bad'>Hay overflow: un solo inf o nan estropea el paso entero. El loss scaling dinámico de Keras salta ese paso y reduce S a la mitad.</span>" : ""));
    view.redraw();
  }
  update();
});
