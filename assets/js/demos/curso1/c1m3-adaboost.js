/* Experimento: AdaBoost con stumps. Los puntos mal clasificados ganan peso y el siguiente stump se fija en ellos. */
Lab.register("curso1/c1m3-adaboost", function (root, api) {
  var D = api.d, M = api.math;
  var T = 3, MAXT = 12, pts = [], rounds = [], seed = 3, w0;
  var NAMES = ["x", "y"];

  function gen() {
    var r = api.rng(seed), i, n = 34; pts = [];
    for (i = 0; i < n; i++) { var x = r.range(0.5, 9.5), y = r.range(0.5, 9.5); pts.push([x, y, (x + y - 10 + r.normal(0, 1.4)) > 0 ? 1 : -1]); }
    train();
  }
  function hs(st, p) { return p[st.f] <= st.t ? st.s : -st.s; }
  function bestStump(w) {
    var best = null, f, i, s, n = pts.length;
    for (f = 0; f < 2; f++) {
      var vals = pts.map(function (p) { return p[f]; }).sort(function (a, b) { return a - b; });
      for (i = 0; i < n - 1; i++) {
        if (vals[i] === vals[i + 1]) continue;
        var t = (vals[i] + vals[i + 1]) / 2;
        for (s = -1; s <= 1; s += 2) {
          var st = { f: f, t: t, s: s }, e = 0;
          for (var k = 0; k < n; k++) if (hs(st, pts[k]) !== pts[k][2]) e += w[k];
          if (!best || e < best.e - 1e-12) best = { f: f, t: t, s: s, e: e };
        }
      }
    }
    return best;
  }
  function train() {
    var n = pts.length, w = pts.map(function () { return 1 / n; }), t, k;
    w0 = w.slice(); rounds = [];
    for (t = 0; t < MAXT; t++) {
      var st = bestStump(w), e = Math.max(st.e, 1e-10), a = 0.5 * Math.log((1 - e) / e), wn = w.slice(), z = 0;
      for (k = 0; k < n; k++) { wn[k] = w[k] * Math.exp(-a * pts[k][2] * hs(st, pts[k])); z += wn[k]; }
      for (k = 0; k < n; k++) wn[k] /= z;
      var wrongBefore = 0, wrongAfter = 0;
      for (k = 0; k < n; k++) if (hs(st, pts[k]) !== pts[k][2]) wrongAfter += wn[k];
      rounds.push({ st: st, e: st.e, a: a, w: wn, wrongAfter: wrongAfter });
      w = wn;
    }
  }
  function score(p, k) { var s = 0; for (var i = 0; i < k; i++) s += rounds[i].a * hs(rounds[i].st, p); return s; }
  function accEns(k) { var ok = 0; pts.forEach(function (p) { if ((score(p, k) > 0 ? 1 : -1) === p[2]) ok++; }); return ok / pts.length; }

  var view = api.view(root, { aspect: 1.45, minH: 290, label: "Puntos de dos clases; su tamaño es su peso; el fondo es la decisión del conjunto de stumps" });
  var plot = api.plot(view, { xr: [0, 10], yr: [0, 10], xticks: 5, yticks: 5, grid: false, pad: { l: 30, r: 10, t: 10, b: 24 }, xfmt: function (v) { return v; }, yfmt: function (v) { return v; } });
  var ui = api.controls(root), out = api.readout(root), tb = api.table(root, ["Ronda", "Stump (si no, lo contrario)", "ε", "α"]), sT;
  sT = ui.slider({ label: "Rondas de AdaBoost (n_estimators)", min: 0, max: MAXT, step: 1, value: T, onInput: function (v) { T = v; update(); } });
  ui.button("Siguiente ronda", function () { T = Math.min(MAXT, T + 1); sT.set(T, true); update(); }, "primary");
  ui.button("Generar otros datos", function () { seed += 4; gen(); update(); });
  api.legend(root, [[api.colors().cobalto, "clase −1"], [api.colors().terracota, "clase +1"], [api.colors().ink, "tamaño = peso; línea = último stump; aro = fallado por ese stump"]]);

  function draw(ctx, w, h, C) {
    plot.axes(ctx);
    var b = plot.box, cs = 7, nx = Math.ceil(b.w / cs), ny = Math.ceil(b.h / cs), i, j;
    ctx.save(); plot.clip(ctx);
    if (T > 0) for (i = 0; i < nx; i++) for (j = 0; j < ny; j++) {
      var px = b.x + i * cs, py = b.y + j * cs, sc = score([plot.ix(px + cs / 2), plot.iy(py + cs / 2)], T);
      ctx.fillStyle = sc > 0 ? C.terracotaWash : C.cobaltoWash; ctx.fillRect(px, py, cs + 0.6, cs + 0.6);
    }
    var wt = T === 0 ? w0 : rounds[T - 1].w, last = T > 0 ? rounds[T - 1].st : null;
    if (last) { if (last.f === 0) D.line(ctx, plot.x(last.t), b.y, plot.x(last.t), b.y + b.h, C.ink, 2.6, [7, 4]); else D.line(ctx, b.x, plot.y(last.t), b.x + b.w, plot.y(last.t), C.ink, 2.6, [7, 4]); }
    pts.forEach(function (p, k) {
      var r = Math.min(15, 3.5 + 5.5 * Math.sqrt(wt[k] * pts.length));
      D.circle(ctx, plot.x(p[0]), plot.y(p[1]), r, p[2] > 0 ? C.terracota : C.cobalto, C.paper, 1.3);
      if (last && hs(last, p) !== p[2]) D.circle(ctx, plot.x(p[0]), plot.y(p[1]), r + 3, null, C.ink, 1.8);
    });
    ctx.restore();
    D.rect(ctx, b.x, b.y, b.w, b.h, null, C.ink, 1.5);
  }
  function fmt(x) { return x.toFixed(3); }
  function update() {
    view.redraw();
    var rows = []; for (var t = 0; t < T; t++) { var r = rounds[t], st = r.st; rows.push([t + 1, NAMES[st.f] + " ≤ " + st.t.toFixed(2) + " ⇒ " + (st.s > 0 ? "+1" : "−1"), fmt(r.e), fmt(r.a)]); }
    tb.set(rows);
    var n = pts.length, txt;
    if (T === 0) txt = "Ronda 0: ningún stump todavía. Los " + n + " puntos pesan lo mismo: 1/" + n + " = <b>" + (1 / n).toFixed(3) + "</b>.";
    else {
      var r2 = rounds[T - 1], wt = r2.w, mx = Math.max.apply(null, wt), mn = Math.min.apply(null, wt);
      txt = "Ronda <b>" + T + "</b>: el stump falla con peso ε = <b>" + fmt(r2.e) + "</b> → α = ½·ln((1 − ε)/ε) = <b>" + fmt(r2.a) + "</b>. Tras reponderar, los puntos que falló suman <b>" + r2.wrongAfter.toFixed(3) + "</b> del peso total (siempre 0.5).<br>" +
        "Pesos ahora: el mayor es <b>" + (mx * n).toFixed(1) + "</b> veces el peso inicial y el menor <b>" + (mn * n).toFixed(2) + "</b>.<br>" +
        "Acierto del conjunto de " + T + " stumps sobre estos puntos: <b>" + (accEns(T) * 100).toFixed(1) + " %</b>";
    }
    out.set(txt);
  }
  gen(); view.draw(draw); update();
});
