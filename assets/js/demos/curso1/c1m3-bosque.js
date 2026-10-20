/* Experimento: Random Forest. Cada árbol ve una muestra bootstrap (y variables al azar) y el bosque vota. */
Lab.register("curso1/c1m3-bosque", function (root, api) {
  var D = api.d, M = api.math;
  var seed = 3, noise = 0.3, B = 15, depth = 6, useBoot = true, useFeat = true, MAXT = 40, MAXD = 12;
  var train, test, trees = [], XR = [-1.6, 2.6], YR = [-1.1, 1.6];

  function moons(n, nz, r) {
    var out = [], i, t, c;
    for (i = 0; i < n; i++) {
      c = i % 2; t = r.range(0, Math.PI);
      out.push(c === 0 ? [Math.cos(t) + r.normal(0, nz), Math.sin(t) + r.normal(0, nz), 0] : [1 - Math.cos(t) + r.normal(0, nz), 0.5 - Math.sin(t) + r.normal(0, nz), 1]);
    }
    return out;
  }
  function gini(a, b) { var n = a + b; return n ? 1 - (a / n) * (a / n) - (b / n) * (b / n) : 0; }
  function bestSplit(set, f) {
    var s = set.slice().sort(function (a, b) { return a[f] - b[f]; }), n = s.length, c1 = 0, i, l0 = 0, l1 = 0, best = null;
    s.forEach(function (p) { c1 += p[2]; });
    for (i = 0; i < n - 1; i++) {
      if (s[i][2]) l1++; else l0++;
      if (s[i][f] === s[i + 1][f]) continue;
      var r1 = c1 - l1, r0 = n - c1 - l0, g = ((l0 + l1) * gini(l0, l1) + (r0 + r1) * gini(r0, r1)) / n;
      if (!best || g < best.g - 1e-12) best = { g: g, f: f, t: (s[i][f] + s[i + 1][f]) / 2 };
    }
    return best;
  }
  function grow(set, dep, rg) {
    var c1 = 0; set.forEach(function (p) { c1 += p[2]; });
    var node = { depth: dep, pred: c1 * 2 > set.length ? 1 : 0 };
    if (c1 === 0 || c1 === set.length || dep >= MAXD) return node;
    var feats = useFeat ? (rg.next() < 0.5 ? [0, 1] : [1, 0]) : [0, 1], best = null;
    if (useFeat) { best = bestSplit(set, feats[0]); if (!best) best = bestSplit(set, feats[1]); }   /* max_features = 1 de 2 */
    else { var b0 = bestSplit(set, 0), b1 = bestSplit(set, 1); best = !b0 ? b1 : (!b1 ? b0 : (b1.g < b0.g - 1e-12 ? b1 : b0)); }
    if (!best) return node;
    node.f = best.f; node.t = best.t;
    node.left = grow(set.filter(function (p) { return p[best.f] <= best.t; }), dep + 1, rg);
    node.right = grow(set.filter(function (p) { return p[best.f] > best.t; }), dep + 1, rg);
    return node;
  }
  function pred(tr, p, cap) { var nd = tr.root; while (nd.left && nd.depth < cap) nd = p[nd.f] <= nd.t ? nd.left : nd.right; return nd.pred; }
  function build() {
    train = moons(100, noise, api.rng(seed)); test = moons(300, noise, api.rng(2000 + seed)); trees = [];
    for (var k = 0; k < MAXT; k++) {
      var rg = api.rng(seed * 100 + k + 1), sample = [], inBag = {}, i;
      if (useBoot) { for (i = 0; i < train.length; i++) { var j = rg.int(0, train.length - 1); sample.push(train[j]); inBag[j] = 1; } }
      else { sample = train.slice(); for (i = 0; i < train.length; i++) inBag[i] = 1; }
      trees.push({ root: grow(sample, 0, rg), inBag: inBag, sample: sample });
    }
  }
  function forestVotes(p) { var s = 0; for (var k = 0; k < B; k++) s += pred(trees[k], p, depth); return s; }
  function mix(a, b, t) {
    function h(x) { return [parseInt(x.slice(1, 3), 16), parseInt(x.slice(3, 5), 16), parseInt(x.slice(5, 7), 16)]; }
    var u = h(a), v = h(b); return "rgb(" + Math.round(u[0] + (v[0] - u[0]) * t) + "," + Math.round(u[1] + (v[1] - u[1]) * t) + "," + Math.round(u[2] + (v[2] - u[2]) * t) + ")";
  }
  function accTree(k, set) { var ok = 0; set.forEach(function (p) { if (pred(trees[k], p, depth) === p[2]) ok++; }); return ok / set.length; }
  function accForest(set) { var ok = 0; set.forEach(function (p) { if ((forestVotes(p) * 2 > B ? 1 : 0) === p[2]) ok++; }); return ok / set.length; }
  function oob() {
    if (!useBoot) return null;
    var ok = 0, cnt = 0;
    train.forEach(function (p, i) {
      var v = 0, n = 0; for (var k = 0; k < B; k++) if (!trees[k].inBag[i]) { v += pred(trees[k], p, depth); n++; }
      if (n) { cnt++; if ((v * 2 > n ? 1 : 0) === p[2]) ok++; }
    });
    return cnt ? ok / cnt : null;
  }

  var view = api.view(root, { aspect: 1.7, minH: 250, label: "Películas infantiles y thrillers según su violencia y su suspense; el color del fondo mezcla los votos de todos los árboles del bosque" });
  var plot = api.plot(view, { xr: XR, yr: YR, xticks: 6, yticks: 3, xlabel: "nivel de violencia →", ylabel: "nivel de suspense →", pad: { l: 26, r: 10, t: 10, b: 36 }, xfmt: function () { return ""; }, yfmt: function () { return ""; } });
  var view2 = api.view(root, { aspect: 2.2, minH: 150, label: "Frontera de los primeros seis árboles del bosque, cada uno entrenado con una muestra distinta" });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Número de árboles (n_estimators)", min: 1, max: MAXT, step: 1, value: B, onInput: function (v) { B = v; update(); } });
  ui.slider({ label: "Profundidad máxima de cada árbol", min: 1, max: 10, step: 1, value: depth, onInput: function (v) { depth = v; update(); } });
  ui.toggle({ label: "Muestras bootstrap", value: useBoot, onChange: function (v) { useBoot = v; build(); update(); } });
  ui.toggle({ label: "Una variable al azar por pregunta (max_features)", value: useFeat, onChange: function (v) { useFeat = v; build(); update(); } });
  ui.button("Generar otros datos", function () { seed += 4; build(); update(); });
  api.legend(root, [[api.colors().cobalto, "infantiles"], [api.colors().terracota, "thrillers"]]);

  function draw(ctx, w, h, C) {
    plot.axes(ctx);
    var b = plot.box, cs = 7, nx = Math.ceil(b.w / cs), ny = Math.ceil(b.h / cs), i, j;
    ctx.save(); plot.clip(ctx);
    for (i = 0; i < nx; i++) for (j = 0; j < ny; j++) {
      var px = b.x + i * cs, py = b.y + j * cs, v = forestVotes([plot.ix(px + cs / 2), plot.iy(py + cs / 2)]) / B;
      ctx.globalAlpha = 0.3; ctx.fillStyle = mix(C.cobalto, C.terracota, v); ctx.fillRect(px, py, cs + 0.6, cs + 0.6); ctx.globalAlpha = 1;
    }
    train.forEach(function (p) { D.circle(ctx, plot.x(p[0]), plot.y(p[1]), 4.5, p[2] ? C.terracota : C.cobalto, C.paper, 1.3); });
    ctx.restore();
    D.rect(ctx, b.x, b.y, b.w, b.h, null, C.ink, 1.5);
  }
  function draw2(ctx, w, h, C) {
    var cols = 3, rows = 2, pw = (w - 8 * (cols + 1)) / cols, ph = (h - 8 * (rows + 1)) / rows, k, i, j;
    for (k = 0; k < 6; k++) {
      var ox = 8 + (k % cols) * (pw + 8), oy = 8 + Math.floor(k / cols) * (ph + 8), cs = 5, nx = Math.ceil(pw / cs), ny = Math.ceil(ph / cs);
      ctx.save(); ctx.beginPath(); ctx.rect(ox, oy, pw, ph); ctx.clip();
      for (i = 0; i < nx; i++) for (j = 0; j < ny; j++) {
        var p = [XR[0] + (XR[1] - XR[0]) * (i * cs + cs / 2) / pw, YR[1] - (YR[1] - YR[0]) * (j * cs + cs / 2) / ph];
        ctx.fillStyle = (k < B ? (pred(trees[k], p, depth) ? C.terracotaWash : C.cobaltoWash) : C.paper2); ctx.fillRect(ox + i * cs, oy + j * cs, cs + 0.5, cs + 0.5);
      }
      if (k < B) trees[k].sample.forEach(function (q) { D.circle(ctx, ox + (q[0] - XR[0]) / (XR[1] - XR[0]) * pw, oy + (YR[1] - q[1]) / (YR[1] - YR[0]) * ph, 1.8, q[2] ? C.terracota : C.cobalto); });
      ctx.restore();
      D.rect(ctx, ox, oy, pw, ph, null, C.ink, 1);
      D.text(ctx, "árbol " + (k + 1), ox + 4, oy + 12, { size: 10, color: C.ink2, weight: 600 });
    }
  }
  function update() {
    view.redraw(); view2.redraw();
    var accs = [], k; for (k = 0; k < B; k++) accs.push(accTree(k, test));
    var fo = accForest(test), o = oob(), mean = M.mean(accs);
    out.set("Árboles individuales (test): media <b>" + (mean * 100).toFixed(1) + " %</b> (de " + (Math.min.apply(null, accs) * 100).toFixed(1) + " % a " + (Math.max.apply(null, accs) * 100).toFixed(1) + " %)<br>" +
      "Bosque de <b>" + B + "</b> " + (B === 1 ? "árbol" : "árboles") + " votando (test): <b>" + (fo * 100).toFixed(1) + " %</b>" + (fo > mean ? " <span class='good'>(+" + ((fo - mean) * 100).toFixed(1) + " puntos sobre el árbol medio)</span>" : "") + "<br>" +
      (o === null ? "Sin bootstrap no hay muestras «fuera de bolsa»: no se puede calcular el OOB." : "Acierto OOB (cada película de train la votan solo los árboles que no la vieron): <b>" + (o * 100).toFixed(1) + " %</b>") +
      (!useBoot && !useFeat ? "<br><span class='bad'>Sin bootstrap ni variables al azar los " + B + " árboles son idénticos: votar no aporta nada.</span>" : ""));
  }
  build(); view.draw(draw); view2.draw(draw2); update();
});
