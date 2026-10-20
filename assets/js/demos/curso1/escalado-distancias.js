/* Experimento: sin escalar, la variable con números grandes decide TODO en una distancia. */
Lab.register("curso1/escalado-distancias", function (root, api) {
  var M = api.math, r = api.rng(21), people = [], i;
  for (i = 0; i < 46; i++) people.push({ age: Math.round(r.range(18, 70)), sal: Math.round(r.range(16000, 150000) / 1000) * 1000 });
  var q = { age: 30, sal: 60000 }, K = 4, scaled = false;
  var mAge = M.mean(people.map(function (p) { return p.age; })), sAge = M.std(people.map(function (p) { return p.age; }));
  var mSal = M.mean(people.map(function (p) { return p.sal; })), sSal = M.std(people.map(function (p) { return p.sal; }));

  var view = api.view(root, { aspect: 1.55, drag: true, minH: 300, label: "Personas según edad y salario, con las K más parecidas a la persona marcada" });
  var plot = api.plot(view, { xr: [15, 75], yr: [10000, 160000], xlabel: "Edad (años)", ylabel: "Salario (€)", xticks: 6, yticks: 5,
    yfmt: function (v) { return Math.round(v / 1000) + "k"; }, xfmt: function (v) { return Math.round(v); }, pad: { l: 52, r: 14, t: 12, b: 38 } });
  var ui = api.controls(root), out = api.readout(root);
  ui.segmented({ label: "Cómo medimos la distancia", options: [[false, "Sin escalar"], [true, "Con StandardScaler"]], value: false, onChange: function (v) { scaled = v; update(); } });
  ui.slider({ label: "K (vecinos que miramos)", min: 1, max: 8, step: 1, value: K, onInput: function (v) { K = v; update(); } });

  function dist(p) {
    var da = p.age - q.age, ds = p.sal - q.sal;
    if (scaled) { da /= sAge; ds /= sSal; }
    return { d: Math.sqrt(da * da + ds * ds), a2: da * da, s2: ds * ds };
  }
  function neigh() {
    return people.map(function (p) { var x = dist(p); return { p: p, d: x.d, a2: x.a2, s2: x.s2 }; }).sort(function (a, b) { return a.d - b.d; }).slice(0, K);
  }
  function draw(ctx, w, h, C) {
    var D = api.d, ns = neigh(), set = {};
    plot.axes(ctx);
    ns.forEach(function (n) { set[people.indexOf(n.p)] = 1; });
    ns.forEach(function (n) { D.line(ctx, plot.x(q.age), plot.y(q.sal), plot.x(n.p.age), plot.y(n.p.sal), C.terracota, 1.5, [4, 3]); });
    people.forEach(function (p, idx) {
      D.circle(ctx, plot.x(p.age), plot.y(p.sal), set[idx] ? 6.5 : 4.5, set[idx] ? C.cobalto : C.muted, C.paper, 1);
    });
    D.circle(ctx, plot.x(q.age), plot.y(q.sal), 9, C.terracota, C.ink, 2.5);
    D.text(ctx, "tú", plot.x(q.age), plot.y(q.sal) - 14, { size: 12, align: "center", weight: 600, color: C.terracotaInk });
  }
  function update() {
    view.redraw();
    var ns = neigh(), a = 0, s = 0;
    ns.forEach(function (n) { a += n.a2; s += n.s2; });
    var pa = 100 * a / (a + s || 1);
    var ages = ns.map(function (n) { return n.p.age; }), minA = Math.min.apply(null, ages), maxA = Math.max.apply(null, ages);
    out.set("Persona marcada: <b>" + Math.round(q.age) + " años</b>, <b>" + Math.round(q.sal / 1000) + "k €</b><br>" +
      "Vecinos elegidos: edades de <b>" + minA + "</b> a <b>" + maxA + " años</b><br>" +
      "Parte de la distancia (al cuadrado) que aporta la <b>edad</b>: <b>" + pa.toFixed(1) + " %</b> · el salario: <b>" + (100 - pa).toFixed(1) + " %</b>" +
      (!scaled && pa < 5 ? "<br><span class='bad'>La edad apenas cuenta: el modelo «ve» solo el salario.</span>" : scaled ? "<br><span class='good'>Con las dos variables en la misma escala, ambas influyen.</span>" : ""));
  }
  function move(px, py) {
    if (!plot.inside(px, py)) return;
    q.age = M.clamp(plot.ix(px), 15, 75); q.sal = M.clamp(plot.iy(py), 10000, 160000); update();
  }
  view.pointer({ down: move, drag: move });
  view.draw(draw); update();
});
