/* Experimento: sin estratificar, el número de positivos que caen en test depende del azar. */
Lab.register("curso1/c1m5-estratificar", function (root, api) {
  var M = api.math, D = api.d;
  var st = { n: 300, prev: 5, test: 20, seed: 1, rs: 42 };
  var counts = [], hist = [], labels = [], strat = 0, nPos = 0, nTest = 0, mine = 0, REPS = 600;

  function setup() {
    nPos = Math.round(st.n * st.prev / 100); nTest = Math.round(st.n * st.test / 100);
    for (var k = 0; k < 1; k++) { /* nada */ }
    labels = new Array(st.n); for (var i = 0; i < st.n; i++) labels[i] = i < nPos ? 1 : 0;
  }
  function split(seedVal) {
    var r = api.rng(seedVal), idx = new Array(st.n), i, c = 0;
    for (i = 0; i < st.n; i++) idx[i] = i;
    for (i = 0; i < nTest; i++) { var j = i + Math.floor(r.next() * (st.n - i)), t = idx[i]; idx[i] = idx[j]; idx[j] = t; if (idx[i] < nPos) c++; }
    return c;
  }
  function recompute() {
    setup(); counts = []; var mx = 0, i;
    for (i = 0; i < REPS; i++) { var c = split(st.seed * 100003 + i * 7919 + 13); counts.push(c); if (c > mx) mx = c; }
    hist = new Array(Math.max(mx, Math.round(nPos * st.test / 100)) + 3).fill(0);
    counts.forEach(function (c) { hist[c]++; });
    strat = Math.round(nPos * st.test / 100);
    mine = split(st.rs + 1000);
  }

  var view = api.view(root, { aspect: 1.9, minH: 240, label: "Histograma de cuántos positivos caen en test en 600 repartos, con y sin estratificar" });
  var po = { xr: [-0.5, 10.5], yr: [0, 100], xticks: 11, yticks: 4, ylabel: "repartos (de 600)", xfmt: function () { return ""; }, pad: { l: 50, r: 12, t: 16, b: 52 } };
  var plot = api.plot(view, po);
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Muestras en total", min: 100, max: 1000, step: 50, value: st.n, onInput: function (v) { st.n = v; recompute(); update(); } });
  ui.slider({ label: "Positivos en el dataset", min: 1, max: 20, step: 1, value: st.prev, fmt: function (v) { return v + " %"; }, onInput: function (v) { st.prev = v; recompute(); update(); } });
  ui.slider({ label: "test_size", min: 10, max: 40, step: 5, value: st.test, fmt: function (v) { return (v / 100).toFixed(2); }, onInput: function (v) { st.test = v; recompute(); update(); } });
  ui.slider({ label: "random_state (un reparto concreto)", min: 0, max: 99, step: 1, value: st.rs, onInput: function (v) { st.rs = v; mine = split(st.rs + 1000); update(); } });
  ui.button("Otros 600 repartos", function () { st.seed++; recompute(); update(); }, "primary");
  var C0 = api.colors();
  api.legend(root, [[C0.terracota, "sin stratify (cada reparto cae donde le toca)"], [C0.olivaInk, "con stratify (siempre el mismo número)"], [C0.ink, "tu random_state"]]);

  function draw(ctx, w, h, C) {
    var xmax = Math.max(6, hist.length - 1), peak = Math.max.apply(null, hist), ytop = Math.ceil(peak * 1.25 / 40) * 40;
    plot.xr = [-0.5, xmax + 0.5]; po.xticks = xmax + 1; plot.yr = [0, ytop];
    plot.axes(ctx);
    var b = plot.box, bw = Math.max(3, b.w / (xmax + 1) * 0.7), k, every = xmax > 14 ? 2 : 1;
    for (k = 0; k <= xmax; k += every) D.text(ctx, String(k), plot.x(k), b.y + b.h + 15, { size: 11, align: "center", color: C.muted, mono: true });
    D.text(ctx, "positivos que caen en el conjunto de test", b.x + b.w / 2, h - 8, { size: 12, align: "center", color: C.ink2, weight: 500 });
    ctx.save(); plot.clip(ctx);
    hist.forEach(function (c, i) { if (c) D.rect(ctx, plot.x(i) - bw / 2, plot.y(c), bw, plot.y(0) - plot.y(c), C.terracota, null); });
    D.rect(ctx, plot.x(strat) - 3, b.y, 6, b.h, C.olivaInk, null);
    ctx.restore();
    var mx = plot.x(mine), left = mine < xmax / 2, sl = strat < xmax / 2;
    D.line(ctx, mx, b.y, mx, b.y + b.h, C.ink, 2, [5, 3]);
    D.circle(ctx, mx, b.y + 6, 4.5, C.ink);
    D.text(ctx, "tu reparto: " + mine, mx + (left ? 9 : -9), b.y + 16, { size: 11, weight: 600, align: left ? "left" : "right", color: C.ink });
    var sl2 = mx > plot.x(strat) ? false : true;
    D.text(ctx, (w < 520 ? "stratify" : "stratify: " + REPS + " de " + REPS), plot.x(strat) + (sl2 ? 8 : -8), b.y + 34, { size: 11, weight: 600, align: sl2 ? "left" : "right", color: C.olivaInk });
  }

  function update() {
    view.redraw();
    var mn = Math.min.apply(null, counts), mxv = Math.max.apply(null, counts), zero = counts.filter(function (c) { return c === 0; }).length;
    var low = counts.filter(function (c) { return c < strat * 0.5; }).length;
    out.set("dataset: <b>" + st.n + "</b> muestras, <b>" + nPos + "</b> positivos · test de <b>" + nTest + "</b> muestras → lo «justo» serían <b>" + (nPos * nTest / st.n).toFixed(1) + "</b> positivos en test<br>" +
      "sin stratify, en 600 repartos: de <b>" + mn + "</b> a <b>" + mxv + "</b> positivos en test · con <b>0</b> positivos: <span class='" + (zero ? "bad" : "good") + "'>" + zero + " repartos</span> · con menos de la mitad de lo justo: <b>" + low + "</b><br>" +
      "con stratify: <b>" + strat + "</b> positivos en test, siempre");
  }
  recompute(); view.draw(draw); update();
});
