/* Experimento: KNN. Frontera de decisión según K y según si escalamos o no las variables. */
Lab.register("curso1/c1m3-knn", function (root, api) {
  var D = api.d, M = api.math;
  var K = 5, scaled = false, seed = 8, train, test, q = { a: 55, s: 70000 };
  var AR = [18, 70], SR = [10000, 150000], mA, sA, mS, sS;

  function gen() {
    var r = api.rng(seed), t = api.rng(900 + seed), i;
    function one(rr) {
      var age = Math.round(rr.range(18, 70)), sal = Math.round(rr.range(18000, 142000) / 1000) * 1000;
      var cls = age > 43 ? 1 : 0; if (rr.next() < 0.08) cls = 1 - cls;
      return { a: age, s: sal, c: cls };
    }
    train = []; test = [];
    for (i = 0; i < 60; i++) train.push(one(r));
    for (i = 0; i < 300; i++) test.push(one(t));
    mA = M.mean(train.map(function (p) { return p.a; })); sA = M.std(train.map(function (p) { return p.a; }));
    mS = M.mean(train.map(function (p) { return p.s; })); sS = M.std(train.map(function (p) { return p.s; }));
  }
  function dist(a, s, p) {
    var da = a - p.a, ds = s - p.s;
    if (scaled) { da /= sA; ds /= sS; }
    return Math.sqrt(da * da + ds * ds);
  }
  function neighbors(a, s) {
    return train.map(function (p) { return { p: p, d: dist(a, s, p) }; }).sort(function (x, y) { return x.d - y.d; }).slice(0, K);
  }
  function vote(ns) { var c1 = 0; ns.forEach(function (n) { c1 += n.p.c; }); return { c1: c1, c0: ns.length - c1, pred: c1 * 2 > ns.length ? 1 : (c1 * 2 < ns.length ? 0 : (ns[0].p.c)) }; }
  function predict(a, s) { return vote(neighbors(a, s)).pred; }
  function acc(set) { var ok = 0; set.forEach(function (p) { if (predict(p.a, p.s) === p.c) ok++; }); return ok / set.length; }

  var view = api.view(root, { aspect: 1.5, minH: 280, drag: true, label: "Series según la duración de sus capítulos y su número de reseñas; el color del fondo es la predicción de KNN y puedes arrastrar el punto marcado" });
  var plot = api.plot(view, { xr: AR, yr: SR, xticks: 4, yticks: 5, xlabel: "duración de los capítulos (minutos)", ylabel: "reseñas (miles)", pad: { l: 52, r: 12, t: 10, b: 38 },
    xfmt: function (v) { return Math.round(v); }, yfmt: function (v) { return Math.round(v / 1000) + "k"; } });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "K (vecinos que votan)", min: 1, max: 31, step: 1, value: K, onInput: function (v) { K = v; update(); } });
  ui.segmented({ label: "Distancia", options: [[false, "Sin escalar"], [true, "Con StandardScaler"]], value: scaled, onChange: function (v) { scaled = v; update(); } });
  ui.button("Generar otros datos", function () { seed += 3; gen(); update(); });
  api.legend(root, [[api.colors().cobalto, "la termina"], [api.colors().terracota, "la abandona"]]);

  function draw(ctx, w, h, C) {
    plot.axes(ctx);
    var b = plot.box, cs = 8, nx = Math.ceil(b.w / cs), ny = Math.ceil(b.h / cs), i, j;
    ctx.save(); plot.clip(ctx);
    for (i = 0; i < nx; i++) for (j = 0; j < ny; j++) {
      var px = b.x + i * cs, py = b.y + j * cs;
      ctx.fillStyle = predict(plot.ix(px + cs / 2), plot.iy(py + cs / 2)) ? C.terracotaWash : C.cobaltoWash;
      ctx.fillRect(px, py, cs + 0.6, cs + 0.6);
    }
    var ns = neighbors(q.a, q.s), set = {};
    ns.forEach(function (n) { set[train.indexOf(n.p)] = 1; D.line(ctx, plot.x(q.a), plot.y(q.s), plot.x(n.p.a), plot.y(n.p.s), C.ink, 1.2, [3, 3]); });
    train.forEach(function (p, idx) { D.circle(ctx, plot.x(p.a), plot.y(p.s), set[idx] ? 6.5 : 4.5, p.c ? C.terracota : C.cobalto, set[idx] ? C.ink : C.paper, set[idx] ? 2 : 1.2); });
    var v = vote(ns);
    D.circle(ctx, plot.x(q.a), plot.y(q.s), 9, v.pred ? C.terracota : C.cobalto, C.ink, 3);
    ctx.restore();
    D.rect(ctx, b.x, b.y, b.w, b.h, null, C.ink, 1.5);
  }
  function update() {
    view.redraw();
    var ns = neighbors(q.a, q.s), v = vote(ns), tr = acc(train), te = acc(test), ages = ns.map(function (n) { return n.p.a; });
    out.set("Serie marcada: capítulos de <b>" + Math.round(q.a) + " min</b>, <b>" + Math.round(q.s / 1000) + "k</b> reseñas · K = <b>" + K + "</b> (" + (scaled ? "con" : "sin") + " escalar)<br>" +
      (K === 1 ? "Vota la serie vecina más cercana (capítulos de <b>" + ages[0] + "</b> min): <b>" : "Votan las " + K + " series vecinas más cercanas (capítulos de <b>" + Math.min.apply(null, ages) + "</b> a <b>" + Math.max.apply(null, ages) + "</b> min): <b>") + v.c0 + "</b> «la termina» y <b>" + v.c1 + "</b> «la abandona» → predicción: <b>" + (v.pred ? "la abandona" : "la termina") + "</b><br>" +
      "Acierto en train (el punto se cuenta a sí mismo como vecino) = <b>" + (tr * 100).toFixed(1) + " %</b> · acierto en test (300 series nuevas) = <b>" + (te * 100).toFixed(1) + " %</b>" +
      (!scaled && te < 0.7 ? "<br><span class='bad'>Sin escalar, las reseñas (números enormes) deciden la distancia y la duración de los capítulos, que es lo que importa, apenas cuenta.</span>" : "") +
      (scaled && te >= 0.8 ? "<br><span class='good'>Con las variables en la misma escala, KNN encuentra la frontera de la duración.</span>" : ""));
  }
  function move(px, py) {
    if (!plot.inside(px, py)) return;
    q.a = M.clamp(plot.ix(px), AR[0], AR[1]); q.s = M.clamp(plot.iy(py), SR[0], SR[1]); update();
  }
  view.pointer({ down: move, drag: move });
  gen(); view.draw(draw); update();
});
