/* Experimento: muestreo inverso con una red REAL que predice el ruido (3×64 neuronas swish, 9 090 parámetros, entrenada en Keras con el fragmento 10).
   DDPM (40 pasos con ruido) o DDIM (determinista, saltando pasos). Los pesos están en datos/c3m4-datos-difusion.js. */
Lab.register("curso3/c3m4-difusion-inversa", function (root, api) {
  var D = api.d, M = api.math, N = 500, DIF;
  function needData(cb) {
    if (window.C3M4_DIF) return cb();
    var s = document.createElement("script");
    s.src = (document.body.getAttribute("data-root") || "./") + "assets/js/demos/curso3/c3m4-datos-difusion.js";
    s.onload = cb; s.onerror = function () { root.innerHTML = '<p class="demo-error">No se pudieron cargar los pesos de la red.</p>'; };
    document.head.appendChild(s);
  }
  var handle = { destroy: function () { if (handle.loop) handle.loop.stop(); } };
  needData(init);
  return handle;

  function init() {
    DIF = window.C3M4_DIF; var T = DIF.T, betas = DIF.betas, alphas = [], abar = [], p = 1, t, i;
    betas.forEach(function (b) { alphas.push(1 - b); p *= 1 - b; abar.push(p); });
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
    // datos de referencia (mismas lunas que en el entrenamiento, ruido nuevo)
    var rr = api.rng(5), REF = [], NR = 800;
    for (i = 0; i < NR; i++) {
      var up = i < NR / 2, th = Math.PI * (up ? i / (NR / 2 - 1) : (i - NR / 2) / (NR / 2 - 1));
      var x = (up ? Math.cos(th) : 1 - Math.cos(th)) + rr.normal(0, 0.1), y = (up ? Math.sin(th) : 0.5 - Math.sin(th)) + rr.normal(0, 0.1);
      REF.push([(x - DIF.mean[0]) / DIF.std[0], (y - DIF.mean[1]) / DIF.std[1]]);
    }
    var rr2 = api.rng(77), REF2 = [];
    for (i = 0; i < 250; i++) {
      var up2 = i < 125, th2 = Math.PI * (up2 ? i / 124 : (i - 125) / 124);
      var x2 = (up2 ? Math.cos(th2) : 1 - Math.cos(th2)) + rr2.normal(0, 0.1), y2 = (up2 ? Math.sin(th2) : 0.5 - Math.sin(th2)) + rr2.normal(0, 0.1);
      REF2.push([(x2 - DIF.mean[0]) / DIF.std[0], (y2 - DIF.mean[1]) / DIF.std[1]]);
    }
    var S = { sampler: "ddpm", steps: 10, seed: 31, pts: [], i: 0, order: [], trail: [], last: null, arrows: true };
    var view = api.view(root, { aspect: 1.2, minH: 280, maxH: 440, label: "Puntos de ruido que la red convierte en dos lunas paso a paso" });
    var ui = api.controls(root), out = api.readout(root);
    ui.segmented({ label: "Muestreador", value: "ddpm", options: [["ddpm", "DDPM (40 pasos, con ruido)"], ["ddim", "DDIM (determinista, menos pasos)"]], onChange: function (v) { S.sampler = v; restart(S.seed); } });
    var sst = ui.slider({ label: "Pasos del DDIM", min: 2, max: 40, step: 1, value: S.steps, fmt: function (v) { return v; }, onInput: function (v) { S.steps = v; if (S.sampler === "ddim") restart(S.seed); } });
    ui.toggle({ label: "Flechas del campo de limpieza", value: true, onChange: function (v) { S.arrows = v; view.redraw(); } });
    ui.button("Un paso hacia atrás en el tiempo ▶", function () { stepOnce(); }, "primary");
    ui.button("Animar hasta el final", function () {
      if (api.reduceMotion) { while (S.i < S.order.length) stepOnce(true); update(); return; }
      if (S.i >= S.order.length) restart(S.seed + 1);
      if (!handle.loop) handle.loop = api.loop(function (dt) { acc += dt; if (acc > 0.18) { acc = 0; stepOnce(); if (S.i >= S.order.length) return false; } }, { fps: 30 });
      acc = 0; handle.loop.start();
    });
    var acc = 0;
    ui.button("Nuevo ruido inicial", function () { restart(S.seed + 1); });

    function restart(seed) {
      if (handle.loop) handle.loop.stop();
      S.seed = seed; var r = api.rng(seed); S.rng = r;
      S.pts = []; for (i = 0; i < N; i++) S.pts.push([r.normal(0, 1), r.normal(0, 1)]);
      if (S.sampler === "ddpm") { S.order = []; for (t = T - 1; t >= 0; t--) S.order.push(t); }
      else { var n = Math.min(S.steps, T), set = {}; S.order = []; for (i = 0; i < n; i++) { var tt = Math.round((T - 1) * (1 - i / (n - 1 || 1))); if (!set[tt]) { set[tt] = 1; S.order.push(tt); } } }
      S.i = 0; S.trail = [S.pts[0].slice()]; S.last = null; dNoise = nearest(); update();
    }
    function nearestOf(P) { var tot = 0, n, j; for (n = 0; n < P.length; n += 2) { var b = 1e9; for (j = 0; j < REF.length; j++) { var dx = P[n][0] - REF[j][0], dy = P[n][1] - REF[j][1], d = dx * dx + dy * dy; if (d < b) b = d; } tot += Math.sqrt(b); } return tot / Math.ceil(P.length / 2); }
    function nearest() { return nearestOf(S.pts); }
    var dReal = nearestOf(REF2), dNoise = null;
    function stepOnce(silent) {
      if (S.i >= S.order.length) return;
      var t0 = S.order[S.i], tprev = S.i + 1 < S.order.length ? S.order[S.i + 1] : -1, n, info = null;
      for (n = 0; n < S.pts.length; n++) {
        var x = S.pts[n], e = epsHat(x, (t0 + 1) / T), nx;
        if (S.sampler === "ddpm") {
          var c = betas[t0] / Math.sqrt(1 - abar[t0]), mean = [(x[0] - c * e[0]) / Math.sqrt(alphas[t0]), (x[1] - c * e[1]) / Math.sqrt(alphas[t0])];
          var sig = t0 > 0 ? Math.sqrt(betas[t0] * (1 - abar[t0 - 1]) / (1 - abar[t0])) : 0, z = [S.rng.normal(0, 1), S.rng.normal(0, 1)];
          nx = [mean[0] + sig * z[0], mean[1] + sig * z[1]];
          if (n === 0) info = { t: t0, x: x.slice(), e: e, c: c, mean: mean, sig: sig, z: z, nx: nx };
        } else {
          var ab = abar[t0], abp = tprev >= 0 ? abar[tprev] : 1, x0 = [(x[0] - Math.sqrt(1 - ab) * e[0]) / Math.sqrt(ab), (x[1] - Math.sqrt(1 - ab) * e[1]) / Math.sqrt(ab)];
          nx = [Math.sqrt(abp) * x0[0] + Math.sqrt(1 - abp) * e[0], Math.sqrt(abp) * x0[1] + Math.sqrt(1 - abp) * e[1]];
          if (n === 0) info = { t: t0, tprev: tprev, x: x.slice(), e: e, x0: x0, ab: ab, abp: abp, nx: nx };
        }
        S.pts[n] = nx;
      }
      S.i++; S.last = info; S.trail.push(S.pts[0].slice());
      if (!silent) update();
    }
    var pl = api.plot(view, { xr: [-3, 3], yr: [-3, 3], pad: { l: 30, r: 8, t: 8, b: 24 }, xticks: 6, yticks: 6, xfmt: function (v) { return Math.round(v); }, yfmt: function (v) { return Math.round(v); } });
    function draw(ctx, w, h, C) {
      if (!S.pts.length) return;
      pl.axes(ctx); ctx.save(); pl.clip(ctx);
      REF.forEach(function (q, k) { if (k % 2) return; ctx.globalAlpha = 0.28; D.circle(ctx, pl.x(q[0]), pl.y(q[1]), 2, C.cobalto); });
      ctx.globalAlpha = 1;
      var tcur = S.i < S.order.length ? S.order[S.i] : -1;
      if (S.arrows && tcur >= 0) {
        for (var gx = -2.5; gx <= 2.51; gx += 1) for (var gy = -2.5; gy <= 2.51; gy += 1) {
          var e = epsHat([gx, gy], (tcur + 1) / T), len = Math.hypot(e[0], e[1]) || 1, sc = 0.38 / Math.max(len, 0.38) ;
          ctx.save(); ctx.globalAlpha = 0.55; D.arrow(ctx, pl.x(gx), pl.y(gy), pl.x(gx - e[0] * sc), pl.y(gy - e[1] * sc), C.muted, 1.2); ctx.restore();
        }
      }
      S.pts.forEach(function (q, k) { if (k === 0) return; ctx.globalAlpha = 0.8; D.circle(ctx, pl.x(q[0]), pl.y(q[1]), 2.5, C.terracota); });
      ctx.globalAlpha = 1;
      var tr = S.trail.map(function (q) { return [pl.x(q[0]), pl.y(q[1])]; }); D.path(ctx, tr, C.ink, 1.4);
      var q0 = S.pts[0]; D.circle(ctx, pl.x(q0[0]), pl.y(q0[1]), 6, C.ink, C.paper, 2);
      if (S.last && S.sampler === "ddpm") { D.arrow(ctx, pl.x(S.last.x[0]), pl.y(S.last.x[1]), pl.x(S.last.x[0] + S.last.e[0] * 0.7), pl.y(S.last.x[1] + S.last.e[1] * 0.7), C.terracotaInk, 2.2); }
      ctx.restore();
      var tl = S.i >= S.order.length ? "FIN: x₀ generado" : "siguiente: t = " + (S.order[S.i] + 1) + " de " + T;
      D.text(ctx, tl, pl.box.x + 6, pl.box.y + 16, { size: 12, weight: 700, mono: true, color: C.ink });
      D.text(ctx, "azul = datos reales · naranja = puntos que se limpian · flechas = hacia dónde empuja la red", pl.box.x + 6, pl.box.y + pl.box.h - 7, { size: 10, color: C.muted });
    }
    function f(v, k) { return v.toFixed(k === undefined ? 3 : k).replace("-", "−"); }
    function fv(v) { return "(" + f(v[0]) + ", " + f(v[1]) + ")"; }
    function update() {
      var L = S.last, s = "<b>Paso " + S.i + " de " + S.order.length + "</b> · distancia media al dato real más cercano: <b>" + f(nearest(), 3) + "</b> (ruido inicial " + f(dNoise, 3) + " · datos reales nuevos " + f(dReal, 3) + ")<br>";
      if (!L) s += "Todos los puntos son ruido x<sub>T</sub> ~ N(0, I). Pulsa «Un paso hacia atrás»: la red mira cada punto y su t, predice ε̂ y se lo restamos.";
      else if (S.sampler === "ddpm") {
        s += "<b>Punto marcado, t = " + (L.t + 1) + ":</b> x = " + fv(L.x) + ", ε̂ = red(x, t) = " + fv(L.e) + "<br>" +
          "x<sub>t−1</sub> = (x − β/√(1−ᾱ)·ε̂)/√α + σ·z = (x − " + f(L.c) + "·ε̂)/" + f(Math.sqrt(alphas[L.t])) + " + " + f(L.sig) + "·" + fv(L.z) + " = <b>" + fv(L.nx) + "</b>";
      } else {
        s += "<b>Punto marcado, de t = " + (L.t + 1) + " a " + (L.tprev >= 0 ? L.tprev + 1 : 0) + ":</b> ε̂ = " + fv(L.e) + " → x̂₀ = (x − √(1−ᾱ)·ε̂)/√ᾱ = " + fv(L.x0) + " → x_prev = √ᾱ_prev·x̂₀ + √(1−ᾱ_prev)·ε̂ = <b>" + fv(L.nx) + "</b> (sin ruido nuevo: determinista)";
      }
      out.set(s); view.redraw();
    }
    view.draw(draw); restart(S.seed);
  }
});
