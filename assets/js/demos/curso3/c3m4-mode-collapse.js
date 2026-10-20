/* Experimento: mode collapse. Una GAN pequeña (G: 4→32→32→2, D: 2→32→32→1) entrena EN EL NAVEGADOR sobre 8 gaussianas en círculo.
   Se mide cuántas de las 8 «modas» cubre el generador. Motor: datos/c3m4-motor-gan.js (retropropagación y Adam en JavaScript). */
Lab.register("curso3/c3m4-mode-collapse", function (root, api) {
  var D = api.d, M = api.math, K = 8, ZD = 4, H = 32, MAXS = 3000;
  var handle = { destroy: function () { if (handle.loop) handle.loop.stop(); } };
  function needNN(cb) {
    if (window.C3M4_NN) return cb();
    var s = document.createElement("script");
    s.src = (document.body.getAttribute("data-root") || "./") + "assets/js/demos/curso3/c3m4-motor-gan.js";
    s.onload = cb; s.onerror = function () { root.innerHTML = '<p class="demo-error">No se pudo cargar el motor de la GAN.</p>'; };
    document.head.appendChild(s);
  }
  needNN(init);
  return handle;

  function init() {
    var NN = window.C3M4_NN, S = { lrD: 0.002, lrG: 0.002, loss: "ns", step: 0, hist: [], G: null, D: null, r: null, running: false, out: null, seed: 3 };
    var cen = [], i; for (i = 0; i < K; i++) cen.push([2 * Math.cos(2 * Math.PI * i / K), 2 * Math.sin(2 * Math.PI * i / K)]);
    var rr = api.rng(99), REAL = []; for (i = 0; i < 400; i++) { var c = cen[rr.int(0, K - 1)]; REAL.push([c[0] + 0.05 * rr.normal(0, 1), c[1] + 0.05 * rr.normal(0, 1)]); }
    var view = api.view(root, { aspect: 1.2, minH: 270, maxH: 440, label: "Puntos generados frente a ocho gaussianas en círculo" });
    var view2 = api.view(root, { aspect: 5.2, minH: 90, maxH: 130, label: "Modas cubiertas a lo largo del entrenamiento" });
    var ui = api.controls(root), out = api.readout(root);
    var sD = ui.slider({ label: "Learning rate del discriminador", min: 0.0005, max: 0.01, step: 0.0005, value: S.lrD, fmt: function (v) { return v.toFixed(4).replace(".", ","); }, onInput: function (v) { S.lrD = v; } });
    var sG = ui.slider({ label: "Learning rate del generador", min: 0.0001, max: 0.005, step: 0.0001, value: S.lrG, fmt: function (v) { return v.toFixed(4).replace(".", ","); }, onInput: function (v) { S.lrG = v; } });
    ui.select({ label: "Pérdida", value: "ns", options: [["ns", "Original, no saturante"], ["minimax", "Minimax (saturante)"], ["wgan", "WGAN (recorte de pesos)"]], onChange: function (v) { S.loss = v; fresh(); } });
    ui.button("▶ Entrenar / pausa", function () { toggle(); }, "primary");
    ui.button("+100 pasos", function () { burst(100); });
    ui.button("Preset: equilibrado", function () { S.lrD = 0.002; S.lrG = 0.002; sD.set(0.002, true); sG.set(0.002, true); fresh(); });
    ui.button("Preset: D mucho más rápido", function () { S.lrD = 0.005; S.lrG = 0.0003; sD.set(0.005, true); sG.set(0.0003, true); fresh(); }, "warm");
    function fresh() {
      if (handle.loop) handle.loop.stop(); S.running = false;
      var r = api.rng(S.seed); S.r = r; S.rm = api.rng(S.seed + 1000);
      S.G = new NN.MLP([ZD, H, H, 2], ["relu", "relu", "lin"], r); S.D = new NN.MLP([2, H, H, 1], ["leaky", "leaky", "lin"], r);
      S.step = 0; S.hist = []; S.out = null; measure(); update();
    }
    function real(n) { var a = new Float64Array(n * 2), j; for (j = 0; j < n; j++) { var c = cen[Math.floor(S.r.next() * K)]; a[2 * j] = c[0] + 0.05 * S.r.normal(0, 1); a[2 * j + 1] = c[1] + 0.05 * S.r.normal(0, 1); } return a; }
    function noise(n) { var a = new Float64Array(n * ZD), j; for (j = 0; j < a.length; j++) a[j] = S.r.normal(0, 1); return a; }
    var meas = { cov: 0, cnt: new Array(K).fill(0), inside: 0, pts: [] };
    function measure() {
      var n = 500, nz = new Float64Array(n * ZD), q, o;
      for (q = 0; q < nz.length; q++) nz[q] = S.rm.normal(0, 1);
      o = S.G.forward(nz, n).out;
      var  cnt = new Array(K).fill(0), inside = 0, j, k, pts = [];
      for (j = 0; j < n; j++) {
        var b = 1e9, bi = 0; for (k = 0; k < K; k++) { var d = Math.hypot(o[2 * j] - cen[k][0], o[2 * j + 1] - cen[k][1]); if (d < b) { b = d; bi = k; } }
        if (b < 0.3) { cnt[bi]++; inside++; } pts.push([o[2 * j], o[2 * j + 1]]);
      }
      meas = { cov: cnt.filter(function (c) { return c >= n * 0.05; }).length, cnt: cnt, inside: inside / n, pts: pts };
      S.hist.push([S.step, meas.cov]);
    }
    function burst(k) {
      var last, j; for (j = 0; j < k && S.step < MAXS; j++) { last = NN.ganStep(S.G, S.D, real, noise, { n: 64, lrD: S.lrD, lrG: S.lrG, kD: 1, loss: S.loss }); S.step++; }
      if (last) S.out = last; measure(); update();
    }
    var acc = 0;
    function toggle() {
      if (S.step >= MAXS) fresh();
      if (api.reduceMotion) { burst(600); return; }
      if (S.running) { handle.loop.stop(); S.running = false; return; }
      if (!handle.loop) handle.loop = api.loop(function () { burst(20); if (S.step >= MAXS) { S.running = false; return false; } }, { fps: 20, onState: function (on) { S.running = on; } });
      S.running = true; handle.loop.start();
    }
    var pl = api.plot(view, { xr: [-3.2, 3.2], yr: [-3.2, 3.2], pad: { l: 30, r: 8, t: 8, b: 24 }, xticks: 4, yticks: 4, xfmt: function (v) { return Math.round(v * 10) / 10; }, yfmt: function (v) { return Math.round(v * 10) / 10; } });
    function draw(ctx, w, h, C) {
      pl.axes(ctx); ctx.save(); pl.clip(ctx);
      var rpx = Math.abs(pl.x(0.3) - pl.x(0));
      cen.forEach(function (c, k) { ctx.save(); ctx.globalAlpha = meas.cnt[k] >= 5 ? 0.35 : 0.0; D.circle(ctx, pl.x(c[0]), pl.y(c[1]), rpx, C.olivaWash); ctx.restore(); D.circle(ctx, pl.x(c[0]), pl.y(c[1]), rpx, null, meas.cnt[k] >= 5 ? C.oliva : C.muted, 1.5); });
      REAL.forEach(function (q) { ctx.globalAlpha = 0.5; D.circle(ctx, pl.x(q[0]), pl.y(q[1]), 1.8, C.cobalto); });
      ctx.globalAlpha = 0.75; meas.pts.forEach(function (q) { D.circle(ctx, pl.x(q[0]), pl.y(q[1]), 2.3, C.terracota); });
      ctx.restore();
      D.text(ctx, "paso " + S.step, pl.box.x + 6, pl.box.y + 15, { size: 12, weight: 700, mono: true, color: C.ink });
      D.text(ctx, "azul = pelis reales · naranja = pelis falsas", pl.box.x + 6, pl.box.y + pl.box.h - 7, { size: 10, color: C.muted });
    }
    var pl2 = api.plot(view2, { xr: [0, MAXS], yr: [0, K], pad: { l: 30, r: 14, t: 8, b: 36 }, xticks: 3, yticks: 2, xlabel: "pasos de entrenamiento", xfmt: function (v) { return Math.round(v); }, yfmt: function (v) { return Math.round(v); } });
    function draw2(ctx, w, h, C) {
      pl2.axes(ctx); ctx.save(); pl2.clip(ctx);
      var pts = S.hist.map(function (q) { return [pl2.x(q[0]), pl2.y(q[1])]; });
      if (pts.length > 1) D.path(ctx, pts, C.oliva, 2.6); if (pts.length) { var l = pts[pts.length - 1]; D.circle(ctx, l[0], l[1], 4, C.oliva, C.paper, 1.5); }
      ctx.restore(); D.text(ctx, "géneros (modas) cubiertos, de 8", pl2.box.x + 6, pl2.box.y + 13, { size: 10, weight: 600, color: C.olivaInk });
    }
    function f(v, k) { return v.toFixed(k === undefined ? 2 : k).replace(".", ","); }
    function update() {
      var o = S.out;
      out.set("<b>Paso " + S.step + " de " + MAXS + "</b>" + (o ? " · pérdida de D = " + f(o.dLoss, S.loss === "wgan" ? 3 : 2) + " · pérdida de G = " + f(o.gLoss, S.loss === "wgan" ? 3 : 2) : "") + "<br>" +
        "<b>Modas (géneros) cubiertas: " + meas.cov + " de 8</b> (una moda cuenta si recibe ≥ 5 % de las muestras) · puntos generados dentro de alguna moda: " + Math.round(meas.inside * 100) + " % · reparto de las muestras por moda (%): " + meas.cnt.map(function (c) { return Math.round(c / 5); }).join(" · ") + "<br>" +
        (S.step < 300 ? "Pulsa «Entrenar» y mira cómo el generador va encontrando las modas." :
          meas.cov >= 7 && meas.inside >= 0.5 ? "<span class='good'>El generador reparte sus muestras por casi todas las modas: GAN sana.</span>" :
            meas.cov >= 7 ? "Las ocho modas tienen alguna muestra, pero la mayoría de los puntos aún caen entre ellas (o el generador sigue oscilando): no es un colapso, es entrenamiento inestable." :
            meas.cov <= 4 && meas.inside < 0.5 ? "Las muestras están dispersas y casi ninguna ha llegado a una moda: no es un colapso (no se concentran en pocas), es que el generador aún no ha afinado." :
            meas.cov <= 4 ? "<span class='bad'>Mode collapse: el generador se ha quedado en pocas modas, y el discriminador, tan veloz, ya no le enseña el resto.</span>" : "Cobertura parcial: sigue entrenando."));
      view.redraw(); view2.redraw();
    }
    view.draw(draw); view2.draw(draw2); fresh();
  }
});
