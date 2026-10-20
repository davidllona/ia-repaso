/* Experimento: el duelo generador contra discriminador sobre una distribución 1D. Las dos redes (1→16→16→1) se entrenan EN EL NAVEGADOR
   con la pérdida no saturante y Adam. Se ve la curva D(x), la distribución real y la generada, las pérdidas y la distancia W1 entre ambas. */
Lab.register("curso3/c3m4-duelo-gan", function (root, api) {
  var D = api.d, M = api.math, H = 16, MAXS = 4000;
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
    var NN = window.C3M4_NN;
    var PRE = { uno: [[2, 0.6, 1]], dos: [[-2, 0.5, 0.5], [2, 0.5, 0.5]], tres: [[-3, 0.4, 1 / 3], [0, 0.4, 1 / 3], [3, 0.4, 1 / 3]] };
    var S = { target: "uno", lrD: 0.003, lrG: 0.003, kD: 1, step: 0, hist: [], G: null, D: null, r: null, running: false, last: null, seed: 5, Z: [], REAL: [], stats: null };
    var view = api.view(root, { aspect: 1.65, minH: 250, maxH: 400, label: "Distribución real, distribución generada y curva del discriminador" });
    var view2 = api.view(root, { aspect: 5, minH: 90, maxH: 130, label: "Pérdidas del discriminador y del generador" });
    var ui = api.controls(root), out = api.readout(root);
    ui.select({ label: "Distribución real", value: "uno", options: [["uno", "Una campana"], ["dos", "Dos campanas"], ["tres", "Tres campanas"]], onChange: function (v) { S.target = v; fresh(); } });
    var sD = ui.slider({ label: "Learning rate de D", min: 0.0001, max: 0.01, step: 0.0001, value: S.lrD, fmt: function (v) { return v.toFixed(4).replace(".", ","); }, onInput: function (v) { S.lrD = v; } });
    var sG = ui.slider({ label: "Learning rate de G", min: 0.0001, max: 0.01, step: 0.0001, value: S.lrG, fmt: function (v) { return v.toFixed(4).replace(".", ","); }, onInput: function (v) { S.lrG = v; } });
    var sK = ui.slider({ label: "Pasos de D por cada paso de G", min: 1, max: 6, step: 1, value: S.kD, fmt: function (v) { return v; }, onInput: function (v) { S.kD = v; } });
    ui.button("▶ Entrenar / pausa", function () { toggle(); }, "primary");
    ui.button("+100 pasos", function () { burst(100); });
    function preset(a, b, k) { S.lrD = a; S.lrG = b; S.kD = k; sD.set(a, true); sG.set(b, true); sK.set(k, true); fresh(); }
    ui.button("Equilibrado", function () { preset(0.003, 0.003, 1); });
    ui.button("D abruma a G", function () { preset(0.01, 0.0002, 5); }, "warm");
    ui.button("G demasiado rápido", function () { preset(0.0003, 0.01, 1); }, "warm");

    function comps() { return PRE[S.target]; }
    function sampleReal(n) {
      var a = new Float64Array(n), i, cs = comps();
      for (i = 0; i < n; i++) { var u = S.r.next(), c = cs[0], q; for (q = 0; q < cs.length; q++) { if (u < cs[q][2]) { c = cs[q]; break; } u -= cs[q][2]; } a[i] = c[0] + c[1] * S.r.normal(0, 1); }
      return a;
    }
    function noise(n) { var a = new Float64Array(n), i; for (i = 0; i < n; i++) a[i] = S.r.normal(0, 1); return a; }
    function realDens(x) { var s = 0; comps().forEach(function (c) { s += c[2] * Math.exp(-0.5 * Math.pow((x - c[0]) / c[1], 2)) / (c[1] * Math.sqrt(2 * Math.PI)); }); return s; }
    function fresh() {
      if (handle.loop) handle.loop.stop(); S.running = false;
      var r = api.rng(S.seed); S.r = r;
      S.G = new NN.MLP([1, H, H, 1], ["relu", "relu", "lin"], r); S.D = new NN.MLP([1, H, H, 1], ["leaky", "leaky", "lin"], r);
      S.step = 0; S.hist = []; S.last = null;
      var rz = api.rng(77); S.Z = new Float64Array(500); for (var i = 0; i < 500; i++) S.Z[i] = rz.normal(0, 1);
      var rq = api.rng(78), save = S.r; S.r = rq; S.REAL = Array.prototype.slice.call(sampleReal(500)).sort(function (a, b) { return a - b; }); S.r = save;
      measure(); update();
    }
    function measure() {
      var o = S.G.forward(S.Z, 500).out, g = Array.prototype.slice.call(o).sort(function (a, b) { return a - b; }), i, w = 0, m = M.mean(g), sd = M.std(g);
      for (i = 0; i < 500; i++) w += Math.abs(g[i] - S.REAL[i]) / 500;
      var xs = new Float64Array(g.length), dr = S.D.forward(new Float64Array(S.REAL), 500).out, df = S.D.forward(o, 500).out, pr = 0, pf = 0;
      for (i = 0; i < 500; i++) { pr += NN.sigmoid(dr[i]) / 500; pf += NN.sigmoid(df[i]) / 500; }
      S.stats = { w1: w, mean: m, sd: sd, g: g, pr: pr, pf: pf };
    }
    function burst(k) {
      var j, l; for (j = 0; j < k && S.step < MAXS; j++) { l = NN.ganStep(S.G, S.D, sampleReal, noise, { n: 64, lrD: S.lrD, lrG: S.lrG, kD: S.kD, loss: "ns" }); S.step++; if (S.step % 10 === 0) S.hist.push([S.step, l.dLoss, l.gLoss]); }
      if (l) S.last = l; measure(); update();
    }
    var acc = 0;
    function toggle() {
      if (S.step >= MAXS) fresh();
      if (api.reduceMotion) { burst(500); return; }
      if (S.running) { handle.loop.stop(); S.running = false; return; }
      if (!handle.loop) handle.loop = api.loop(function () { burst(10); if (S.step >= MAXS) { S.running = false; return false; } }, { fps: 24, onState: function (on) { S.running = on; } });
      S.running = true; handle.loop.start();
    }
    var pl = api.plot(view, { xr: [-5, 5], yr: [0, 1.2], pad: { l: 34, r: 34, t: 10, b: 28 }, xticks: 5, yticks: 4, xlabel: "x", xfmt: function (v) { return Math.round(v); }, yfmt: function (v) { return v.toFixed(1).replace(".", ","); } });
    function curve(fn, C, col, wash, wd) {
      var pts = [], x; for (x = -5; x <= 5.001; x += 0.08) pts.push([pl.x(x), pl.y(Math.min(1.19, fn(x)))]);
      if (wash) { ctx_fill(pts, wash); } D.path(view.ctx, pts, col, wd);
    }
    function ctx_fill(pts, wash) { var c = view.ctx, b = pl.box; c.save(); c.beginPath(); c.moveTo(pts[0][0], b.y + b.h); pts.forEach(function (p) { c.lineTo(p[0], p[1]); }); c.lineTo(pts[pts.length - 1][0], b.y + b.h); c.closePath(); c.globalAlpha = 0.55; c.fillStyle = wash; c.fill(); c.restore(); }
    function draw(ctx, w, h, C) {
      if (!S.stats) return;
      pl.axes(ctx); ctx.save(); pl.clip(ctx);
      var bw = 0.18, g = S.stats.g, n = g.length;
      curve(realDens, C, C.cobalto, C.cobaltoWash, 2.4);
      curve(function (x) { var s = 0, i; for (i = 0; i < n; i++) { var u = (x - g[i]) / bw; s += Math.exp(-0.5 * u * u); } return s / (n * bw * Math.sqrt(2 * Math.PI)); }, C, C.terracota, C.terracotaWash, 2.6);
      // D(x) en escala 0..1 → 0..1.2
      var xsF = new Float64Array(126), k, pts = []; for (k = 0; k < 126; k++) xsF[k] = -5 + k * 0.08;
      var dd = S.D.forward(xsF, 126).out; for (k = 0; k < 126; k++) pts.push([pl.x(xsF[k]), pl.y(NN.sigmoid(dd[k]) * 1.2)]);
      D.path(ctx, pts, C.oliva, 2.6, [7, 4]);
      D.line(ctx, pl.x(-5), pl.y(0.6), pl.x(5), pl.y(0.6), C.muted, 1, [2, 4]);
      ctx.restore();
      var b = pl.box; D.text(ctx, "D = 1", b.x + b.w + 4, b.y + 4, { size: 10, color: C.olivaInk, mono: true }); D.text(ctx, "0,5", b.x + b.w + 4, pl.y(0.6) + 4, { size: 10, color: C.olivaInk, mono: true }); D.text(ctx, "0", b.x + b.w + 4, b.y + b.h, { size: 10, color: C.olivaInk, mono: true });
      D.text(ctx, "— real", b.x + 6, b.y + 14, { size: 11, weight: 700, color: C.cobaltoInk });
      D.text(ctx, "— generador", b.x + 6, b.y + 28, { size: 11, weight: 700, color: C.terracotaInk });
      D.text(ctx, "- - D(x) (derecha)", b.x + 6, b.y + 42, { size: 11, weight: 700, color: C.olivaInk });
      D.text(ctx, "paso " + S.step, b.x + b.w - 6, b.y + 14, { size: 11, mono: true, weight: 700, color: C.ink, align: "right" });
    }
    var pl2 = api.plot(view2, { xr: [0, MAXS], yr: [0, 2.4], pad: { l: 34, r: 14, t: 8, b: 36 }, xticks: 4, yticks: 2, xlabel: "pasos", xfmt: function (v) { return Math.round(v); }, yfmt: function (v) { return v.toFixed(1).replace(".", ","); } });
    function draw2(ctx, w, h, C) {
      pl2.axes(ctx); ctx.save(); pl2.clip(ctx);
      D.line(ctx, pl2.x(0), pl2.y(1.386), pl2.x(MAXS), pl2.y(1.386), C.cobalto, 1, [3, 4]); D.line(ctx, pl2.x(0), pl2.y(0.693), pl2.x(MAXS), pl2.y(0.693), C.terracota, 1, [3, 4]);
      [[1, C.cobalto], [2, C.terracota]].forEach(function (cc) { var pts = S.hist.map(function (q) { return [pl2.x(q[0]), pl2.y(Math.min(2.4, q[cc[0]]))]; }); if (pts.length > 1) D.path(ctx, pts, cc[1], 1.8); });
      ctx.restore();
      D.text(ctx, "D (azul) · G (naranja) · equilibrio: 1,386 y 0,693", pl2.box.x + 4, pl2.box.y + 12, { size: 10, color: C.muted });
    }
    function f(v, k) { return v.toFixed(k === undefined ? 2 : k).replace(".", ",").replace("-", "−"); }
    function update() {
      var st = S.stats, l = S.last, tgt = comps(), tm = 0, tv = 0;
      tgt.forEach(function (c) { tm += c[2] * c[0]; }); tgt.forEach(function (c) { tv += c[2] * (c[1] * c[1] + c[0] * c[0]); }); tv = Math.sqrt(tv - tm * tm);
      var msg;
      if (S.step < 200) msg = "Pulsa «Entrenar» (o un preset) y observa cómo D separa y G persigue.";
      else if (st.sd < 0.12 * tv) msg = "<span class='bad'>El generador ha colapsado: casi todas sus muestras caen en el mismo punto (σ = " + f(st.sd) + " frente a " + f(tv) + " de la distribución real).</span>";
      else if (l && l.gLoss > 1.1) msg = "<span class='bad'>D gana con claridad (pérdida de G alta): G recibe gradientes pero va muy por detrás.</span>";
      else if (st.w1 < 0.3) msg = "<span class='good'>Las dos curvas se parecen y D(x) ronda 0,5: casi un empate.</span>";
      else msg = "Todavía lejos: sigue entrenando.";
      out.set("<b>Paso " + S.step + "</b>" + (l ? " · pérdida D = " + f(l.dLoss) + " · pérdida G = " + f(l.gLoss) : "") + "<br>" +
        "D(real) medio = <b>" + f(st.pr) + "</b> · D(falso) medio = <b>" + f(st.pf) + "</b> (en equilibrio ambos 0,50) · distancia W1 real↔generado = <b>" + f(st.w1) + "</b><br>" +
        "Media generada " + f(st.mean) + " (real " + f(tm) + ") · desviación generada " + f(st.sd) + " (real " + f(tv) + ")<br>" + msg);
      view.redraw(); view2.redraw();
    }
    view.draw(draw); view2.draw(draw2); fresh();
  }
});
