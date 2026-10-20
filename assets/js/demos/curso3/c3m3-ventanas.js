/* Experimento: ventanas deslizantes sobre una serie temporal sintética (tendencia + dos senos + ruido, semilla fija).
   Se ve qué es X (la ventana), qué es y (el valor 'horizonte' pasos después), cuántos ejemplos salen y por qué las ventanas
   que cruzan la frontera train/val/test no existen cuando se corta la serie ANTES de hacer ventanas. */
Lab.register("curso3/c3m3-ventanas", function (root, api) {
  var D = api.d, N = 160;
  var S = { w: 12, h: 3, s: 1, k: 10 };
  var serie = (function () {
    var r = api.rng(4), out = [], t;
    for (t = 0; t < N; t++) out.push(0.006 * t + Math.sin(2 * Math.PI * t / 40) + 0.5 * Math.sin(2 * Math.PI * t / 10) + r.normal(0, 0.12));
    return out;
  })();
  var cuts = [Math.round(N * 0.70), Math.round(N * 0.85), N];       // 112, 136, 160
  var segs = [[0, cuts[0], "train"], [cuts[0], cuts[1], "val"], [cuts[1], cuts[2], "test"]];
  function nwin(len) { var m = len - S.w - S.h; return m < 0 ? 0 : Math.floor(m / S.s) + 1; }
  function n(v, k) { return v.toFixed(k === undefined ? 2 : k).replace(".", ",").replace("-", "−"); }
  function segOf(i) { return i < cuts[0] ? 0 : (i < cuts[1] ? 1 : 2); }

  var view = api.view(root, { aspect: 2.1, minH: 230, maxH: 330, label: "Serie temporal con una ventana de entrada marcada en azul y su valor objetivo marcado en naranja" });
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.72rem, 2.7vw, .84rem)";
  var sw = ui.slider({ label: "Tamaño de la ventana (sequence_length)", min: 4, max: 40, step: 1, value: S.w, onInput: function (v) { S.w = v; fix(); } });
  var sh = ui.slider({ label: "Horizonte (cuántos pasos adelante)", min: 1, max: 20, step: 1, value: S.h, onInput: function (v) { S.h = v; fix(); } });
  var ss = ui.slider({ label: "Paso entre ventanas (sequence_stride)", min: 1, max: 10, step: 1, value: S.s, onInput: function (v) { S.s = v; fix(); } });
  var sk = ui.slider({ label: "Ventana nº", min: 0, max: 100, step: 1, value: S.k, onInput: function (v) { S.k = v; update(); } });
  var plot = api.plot(view, { xr: [0, N], yr: [-2, 3.2], xticks: 8, yticks: 4, xlabel: "instante t", pad: { l: 34, r: 8, t: 24, b: 36 }, xfmt: function (v) { return Math.round(v); } });

  function totalStarts() { var a = 0; return Math.floor((N - S.w - S.h) / S.s) + 1; }
  function fix() {
    var tot = totalStarts();
    sk.input.max = Math.max(0, tot - 1);
    if (S.k > tot - 1) { S.k = tot - 1; sk.set(S.k, true); }
    update();
  }
  function draw(ctx, w, h, C) {
    plot.axes(ctx);
    var b = plot.box, i, st = S.k * S.s, a = st, e = st + S.w - 1, ty = st + S.w + S.h - 1;
    ctx.save(); plot.clip(ctx);
    for (i = 0; i < 3; i++) {
      ctx.fillStyle = i === 0 ? C.cobaltoWash : (i === 1 ? C.markerWash : C.terracotaWash);
      ctx.globalAlpha = 0.35; ctx.fillRect(plot.x(segs[i][0]), b.y, plot.x(segs[i][1]) - plot.x(segs[i][0]), b.h); ctx.globalAlpha = 1;
    }
    ctx.fillStyle = C.cobalto; ctx.globalAlpha = 0.18;
    ctx.fillRect(plot.x(a), b.y, plot.x(e) - plot.x(a), b.h); ctx.globalAlpha = 1;
    D.path(ctx, serie.map(function (v, t) { return [plot.x(t), plot.y(v)]; }), C.muted, 1.4);
    for (i = a; i <= e; i++) D.circle(ctx, plot.x(i), plot.y(serie[i]), 3, C.cobalto);
    if (ty < N) {
      D.line(ctx, plot.x(e), plot.y(serie[e]), plot.x(ty), plot.y(serie[ty]), C.terracota, 1.2, [4, 3]);
      D.circle(ctx, plot.x(ty), plot.y(serie[ty]), 6, C.terracota, C.ink, 2);
    }
    ctx.restore();
    segs.forEach(function (sg) { D.text(ctx, sg[2], (plot.x(sg[0]) + plot.x(sg[1])) / 2, b.y - 7, { size: 11, align: "center", weight: 600, color: C.ink2 }); });
  }
  function update() {
    view.redraw();
    var st = S.k * S.s, ty = st + S.w + S.h - 1, e = st + S.w - 1, sa = segOf(st), sb = segOf(Math.min(ty, N - 1));
    var cnt = segs.map(function (sg) { return nwin(sg[1] - sg[0]); }), all = Math.floor((N - S.w - S.h) / S.s) + 1;
    var cruza = sa !== sb;
    out.set("Ventana <b>X = serie[" + st + " : " + (e + 1) + "]</b> (" + S.w + " valores, forma <b>(" + S.w + ", 1)</b>) → objetivo <b>y = serie[" + ty + "]</b> = <b>" + n(serie[ty]) + "</b> (" + S.h + " paso(s) después del último valor de X)<br>" +
      "Ejemplos si hicieras ventanas con toda la serie: <b>" + all + "</b> = ⌊(" + N + " − " + S.w + " − " + S.h + ") / " + S.s + "⌋ + 1<br>" +
      "Cortando primero en train/val/test: <b>" + cnt[0] + " + " + cnt[1] + " + " + cnt[2] + " = " + (cnt[0] + cnt[1] + cnt[2]) + "</b> (se pierden " + (all - cnt[0] - cnt[1] - cnt[2]) + ")<br>" +
      (cruza ? "<span class='bad'>Esta ventana cruza la frontera " + segs[sa][2] + "/" + segs[sb][2] + ": con el corte previo NO existe (su objetivo pertenece a otro conjunto).</span>" : "<span class='good'>Esta ventana vive entera en <b>" + segs[sa][2] + "</b>.</span>"));
  }
  view.draw(draw); fix();
});
