/* Experimento: qué predice la red cuando se le da un x_t. Con la red real (fragmento 10) se calcula ε̂ y de ahí la estimación de un solo golpe
   x̂₀ = (x_t − √(1−ᾱ_t)·ε̂)/√ᾱ_t. Con poco ruido acierta; con mucho ruido da una media borrosa → por eso se quita el ruido poco a poco. */
Lab.register("curso3/c3m4-estimar-x0", function (root, api) {
  var D = api.d, M = api.math, N = 300, DIF;
  function needData(cb) {
    if (window.C3M4_DIF) return cb();
    var s = document.createElement("script");
    s.src = (document.body.getAttribute("data-root") || "./") + "assets/js/demos/curso3/c3m4-datos-difusion.js";
    s.onload = cb; s.onerror = function () { root.innerHTML = '<p class="demo-error">No se pudieron cargar los pesos de la red.</p>'; };
    document.head.appendChild(s);
  }
  needData(init);
  function init() {
    DIF = window.C3M4_DIF; var T = DIF.T, abar = [], p = 1, i;
    DIF.betas.forEach(function (b) { p *= 1 - b; abar.push(p); });
    function epsHat(x, tau) {
      var h = [x[0], x[1], tau], k;
      for (k = 0; k < 3; k++) h.push(Math.sin(Math.PI * Math.pow(2, k) * tau));
      for (k = 0; k < 3; k++) h.push(Math.cos(Math.PI * Math.pow(2, k) * tau));
      DIF.layers.forEach(function (L, li) {
        var o = new Array(L.m), j, ii;
        for (j = 0; j < L.m; j++) { var s = L.b[j]; for (ii = 0; ii < L.n; ii++) s += h[ii] * L.W[ii * L.m + j]; o[j] = li < DIF.layers.length - 1 ? s / (1 + Math.exp(-s)) : s; }
        h = o;
      });
      return h;
    }
    var r = api.rng(41), X0 = [], E = [];
    for (i = 0; i < N; i++) {
      var up = i < N / 2, th = Math.PI * (up ? i / (N / 2 - 1) : (i - N / 2) / (N / 2 - 1));
      var x = (up ? Math.cos(th) : 1 - Math.cos(th)) + r.normal(0, 0.1), y = (up ? Math.sin(th) : 0.5 - Math.sin(th)) + r.normal(0, 0.1);
      X0.push([(x - DIF.mean[0]) / DIF.std[0], (y - DIF.mean[1]) / DIF.std[1]]); E.push([r.normal(0, 1), r.normal(0, 1)]);
    }
    var rr = api.rng(42), REF = []; for (i = 0; i < 600; i++) { var u2 = i < 300, t2 = Math.PI * (u2 ? i / 299 : (i - 300) / 299); REF.push([((u2 ? Math.cos(t2) : 1 - Math.cos(t2)) - DIF.mean[0]) / DIF.std[0], ((u2 ? Math.sin(t2) : 0.5 - Math.sin(t2)) - DIF.mean[1]) / DIF.std[1]]); }
    var S = { t: 20 }, view = api.view(root, { aspect: 1.2, minH: 280, maxH: 440, label: "Estimación de x0 en un solo golpe a partir de x_t" });
    var ui = api.controls(root), out = api.readout(root);
    ui.slider({ label: "Paso t desde el que intentamos recuperar x₀", min: 1, max: T, step: 1, value: S.t, fmt: function (v) { return v + " / " + T; }, onInput: function (v) { S.t = v; update(); } });
    var pl = api.plot(view, { xr: [-3, 3], yr: [-3, 3], pad: { l: 30, r: 8, t: 8, b: 24 }, xticks: 6, yticks: 6, xfmt: function (v) { return Math.round(v); }, yfmt: function (v) { return Math.round(v); } });
    var cache = null;
    function compute() {
      var t = S.t, ab = abar[t - 1], s1 = Math.sqrt(ab), s2 = Math.sqrt(1 - ab), xt = [], x0h = [], n, errTrue = 0, errMan = 0;
      for (n = 0; n < N; n++) {
        var a = [s1 * X0[n][0] + s2 * E[n][0], s1 * X0[n][1] + s2 * E[n][1]], e = epsHat(a, t / T), h = [(a[0] - s2 * e[0]) / s1, (a[1] - s2 * e[1]) / s1];
        xt.push(a); x0h.push(h); errTrue += Math.hypot(h[0] - X0[n][0], h[1] - X0[n][1]) / N;
        var b = 1e9, j; for (j = 0; j < REF.length; j++) { var d = Math.hypot(h[0] - REF[j][0], h[1] - REF[j][1]); if (d < b) b = d; } errMan += b / N;
      }
      cache = { xt: xt, x0h: x0h, errTrue: errTrue, errMan: errMan, ab: ab, s1: s1, s2: s2 };
    }
    function draw(ctx, w, h, C) {
      if (!cache) return;
      pl.axes(ctx); ctx.save(); pl.clip(ctx);
      REF.forEach(function (q, k) { if (k % 2) return; ctx.globalAlpha = 0.3; D.circle(ctx, pl.x(q[0]), pl.y(q[1]), 2, C.cobalto); });
      ctx.globalAlpha = 0.5; var n;
      for (n = 0; n < N; n += 15) D.line(ctx, pl.x(cache.xt[n][0]), pl.y(cache.xt[n][1]), pl.x(cache.x0h[n][0]), pl.y(cache.x0h[n][1]), C.muted, 1);
      cache.xt.forEach(function (q) { D.circle(ctx, pl.x(q[0]), pl.y(q[1]), 1.8, C.muted); });
      ctx.globalAlpha = 0.9; cache.x0h.forEach(function (q) { D.circle(ctx, pl.x(q[0]), pl.y(q[1]), 2.6, C.terracota); });
      ctx.restore();
      D.text(ctx, "gris = x_t (con nieve) · naranja = x̂₀ estimado · azul = pelis reales", pl.box.x + 6, pl.box.y + pl.box.h - 7, { size: 10, color: C.muted });
      D.text(ctx, "t = " + S.t, pl.box.x + 6, pl.box.y + 16, { size: 13, weight: 700, mono: true, color: C.ink });
    }
    function f(v, k) { return v.toFixed(k === undefined ? 3 : k).replace(".", ",").replace("-", "−"); }
    function update() {
      compute(); var c = cache;
      out.set("<b>t = " + S.t + "</b> · ᾱ_t = " + f(c.ab) + " → √ᾱ = " + f(c.s1) + ", √(1−ᾱ) = " + f(c.s2) + " (proporción señal : ruido ≈ " + f(c.s1 / c.s2, 2) + " : 1)<br>" +
        "Error medio de x̂₀ respecto al x₀ verdadero: <b>" + f(c.errTrue, 3) + "</b> · distancia media de x̂₀ a la luna más cercana: <b>" + f(c.errMan, 3) + "</b><br>" +
        (S.t <= 8 ? "<span class='good'>Con poco ruido la red recupera x₀ casi exacto: apenas hay que adivinar.</span>" : S.t >= 28 ? "<span class='bad'>Con casi solo ruido x̂₀ se amontona en el centro, entre las dos lunas: es la media de todos los x₀ posibles. Una estimación de un golpe no sirve para generar; hay que ir limpiando poco a poco.</span>" : "Zona intermedia: x̂₀ ya se pega a la forma de las lunas pero todavía es borroso."));
      view.redraw();
    }
    view.draw(draw); update();
  }
});
