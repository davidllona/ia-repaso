/* Experimento: un árbol de decisión creciendo por profundidad: frontera, acierto en train/test y sobreajuste. */
Lab.register("curso1/c1m3-arbol-profundidad", function (root, api) {
  var D = api.d, M = api.math;
  var seed = 3, noise = 0.3, depth = 2, MAXD = 12;
  var train, test, tree, accs, XR = [-1.6, 2.6], YR = [-1.1, 1.6];

  function moons(n, nz, r) {
    var out = [], i, t, c;
    for (i = 0; i < n; i++) {
      c = i % 2; t = r.range(0, Math.PI);
      out.push(c === 0 ? [Math.cos(t) + r.normal(0, nz), Math.sin(t) + r.normal(0, nz), 0] : [1 - Math.cos(t) + r.normal(0, nz), 0.5 - Math.sin(t) + r.normal(0, nz), 1]);
    }
    return out;
  }
  function gen() {
    train = moons(70, noise, api.rng(seed)); test = moons(240, noise, api.rng(1000 + seed));
    tree = grow(train, 0); accs = [];
    for (var d = 1; d <= MAXD; d++) accs.push([d, acc(train, d), acc(test, d)]);
  }
  /* CART con Gini: prueba todas las preguntas «variable ≤ umbral» y se queda con la de menor impureza ponderada */
  function gini(a, b) { var n = a + b; return n ? 1 - (a / n) * (a / n) - (b / n) * (b / n) : 0; }
  function grow(set, dep) {
    var c1 = 0, i; set.forEach(function (p) { c1 += p[2]; });
    var node = { depth: dep, n: set.length, pred: c1 * 2 > set.length ? 1 : 0, c1: c1 };
    if (c1 === 0 || c1 === set.length || dep >= MAXD) return node;
    var best = null;
    for (var f = 0; f < 2; f++) {
      var s = set.slice().sort(function (a, b) { return a[f] - b[f]; }), l0 = 0, l1 = 0, n = s.length;
      for (i = 0; i < n - 1; i++) {
        if (s[i][2]) l1++; else l0++;
        if (s[i][f] === s[i + 1][f]) continue;
        var r1 = c1 - l1, r0 = n - c1 - l0, g = ((l0 + l1) * gini(l0, l1) + (r0 + r1) * gini(r0, r1)) / n;
        if (!best || g < best.g - 1e-12) best = { g: g, f: f, t: (s[i][f] + s[i + 1][f]) / 2 };
      }
    }
    if (!best) return node;
    node.f = best.f; node.t = best.t;
    node.left = grow(set.filter(function (p) { return p[best.f] <= best.t; }), dep + 1);
    node.right = grow(set.filter(function (p) { return p[best.f] > best.t; }), dep + 1);
    return node;
  }
  function predict(p, cap) { var nd = tree; while (nd.left && nd.depth < cap) nd = p[nd.f] <= nd.t ? nd.left : nd.right; return nd.pred; }
  function acc(set, cap) { var ok = 0; set.forEach(function (p) { if (predict(p, cap) === p[2]) ok++; }); return ok / set.length; }
  function leaves(nd, cap) { return (nd.left && nd.depth < cap) ? leaves(nd.left, cap) + leaves(nd.right, cap) : 1; }

  var view = api.view(root, { aspect: 1.7, minH: 250, label: "Frontera de decisión de un árbol de decisión con la profundidad elegida" });
  var plot = api.plot(view, { xr: XR, yr: YR, xticks: 6, yticks: 3, pad: { l: 34, r: 10, t: 10, b: 26 }, xfmt: function (v) { return v.toFixed(1); }, yfmt: function (v) { return v.toFixed(1); } });
  var view2 = api.view(root, { aspect: 3.2, minH: 130, maxH: 200, label: "Acierto en train y en test según la profundidad máxima" });
  var plot2 = api.plot(view2, { xr: [1, MAXD], yr: [0.5, 1], xticks: 11, yticks: 2, xlabel: "profundidad máxima (max_depth)", pad: { l: 40, r: 10, t: 10, b: 34 }, yfmt: function (v) { return Math.round(v * 100) + "%"; } });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Profundidad máxima (max_depth)", min: 1, max: MAXD, step: 1, value: depth, onInput: function (v) { depth = v; update(); } });
  ui.slider({ label: "Ruido de los datos", min: 0.1, max: 0.5, step: 0.05, value: noise, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { noise = v; gen(); update(); } });
  ui.button("Generar otros datos", function () { seed += 5; gen(); update(); });
  api.legend(root, [[api.colors().cobalto, "clase A (train)"], [api.colors().terracota, "clase B (train)"], [api.colors().ink, "círculos pequeños huecos: datos de test"]]);

  function draw(ctx, w, h, C) {
    plot.axes(ctx);
    var b = plot.box, cs = 7, nx = Math.ceil(b.w / cs), ny = Math.ceil(b.h / cs), i, j;
    ctx.save(); plot.clip(ctx);
    for (i = 0; i < nx; i++) for (j = 0; j < ny; j++) {
      var px = b.x + i * cs, py = b.y + j * cs, p = [plot.ix(px + cs / 2), plot.iy(py + cs / 2)];
      ctx.fillStyle = predict(p, depth) ? C.terracotaWash : C.cobaltoWash; ctx.fillRect(px, py, cs + 0.6, cs + 0.6);
    }
    test.forEach(function (p) { D.circle(ctx, plot.x(p[0]), plot.y(p[1]), 2.6, null, p[2] ? C.terracotaInk : C.cobaltoInk, 1); });
    train.forEach(function (p) { D.circle(ctx, plot.x(p[0]), plot.y(p[1]), 5, p[2] ? C.terracota : C.cobalto, C.paper, 1.5); });
    ctx.restore();
    D.rect(ctx, b.x, b.y, b.w, b.h, null, C.ink, 1.5);
  }
  function draw2(ctx, w, h, C) {
    plot2.axes(ctx);
    D.path(ctx, accs.map(function (a) { return [plot2.x(a[0]), plot2.y(a[1])]; }), C.cobalto, 2.5);
    D.path(ctx, accs.map(function (a) { return [plot2.x(a[0]), plot2.y(a[2])]; }), C.terracota, 2.5);
    D.line(ctx, plot2.x(depth), plot2.box.y, plot2.x(depth), plot2.box.y + plot2.box.h, C.ink, 1.5, [4, 3]);
    D.text(ctx, "train", plot2.box.x + 8, plot2.box.y + 14, { size: 11, color: C.cobaltoInk, weight: 600 });
    D.text(ctx, "test", plot2.box.x + 48, plot2.box.y + 14, { size: 11, color: C.terracotaInk, weight: 600 });
  }
  function update() {
    view.redraw(); view2.redraw();
    var a = accs[depth - 1], tr = a[1], te = a[2], v, cls;
    if (tr < 0.8 && te < 0.8) { v = "Infraajuste: el árbol es demasiado simple y ni siquiera acierta bien con los datos que ha visto."; cls = "bad"; }
    else if (tr - te > 0.08) { v = "Sobreajuste: acierta casi todo el entrenamiento, pero falla bastante más en datos nuevos."; cls = "bad"; }
    else { v = "Buen equilibrio: acierto parecido y alto en train y en test."; cls = "good"; }
    out.set("max_depth = <b>" + depth + "</b> · hojas = <b>" + leaves(tree, depth) + "</b> · acierto en train = <b>" + (tr * 100).toFixed(1) + " %</b> · en test = <b>" + (te * 100).toFixed(1) + " %</b><br><span class='" + cls + "'>" + v + "</span>");
  }
  gen(); view.draw(draw); view2.draw(draw2); update();
});
