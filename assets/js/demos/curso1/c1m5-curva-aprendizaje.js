/* Experimento: curva de aprendizaje. Error de train y de validación al aumentar el tamaño del conjunto de entrenamiento. */
Lab.register("curso1/c1m5-curva-aprendizaje", function (root, api) {
  var M = api.math, D = api.d, i;
  var SIZES = [6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 65, 80, 100], R = 30;
  var st = { deg: 1, noise: 0.2 }, cache = {}, val = [];

  function f(x) { return Math.sin(3.4 * x); }
  function buildVal() {
    var t = api.rng(4242); val = [];
    for (i = 0; i < 600; i++) { var x = t.range(-1, 1); val.push([x, f(x)]); }       // y sin ruido: medimos el error "de verdad"
  }
  function curve() {
    var key = st.deg + "|" + st.noise;
    if (cache[key]) return cache[key];
    var res = SIZES.map(function (n) {
      var trS = 0, vaS = 0;
      for (var rep = 0; rep < R; rep++) {
        var r = api.rng(n * 977 + rep * 31 + 5), xs = [], ys = [];
        for (var q = 0; q < n; q++) { var x = r.range(-1, 1); xs.push(x); ys.push(f(x) + r.normal(0, st.noise)); }
        var c = M.polyfit(xs, ys, st.deg, 1e-6), e = 0;
        for (q = 0; q < n; q++) { var d = M.polyval(c, xs[q]) - ys[q]; e += d * d; }
        trS += e / n;
        var ev = 0; val.forEach(function (p) { var dd = M.polyval(c, p[0]) - p[1]; ev += dd * dd; });
        vaS += ev / val.length + st.noise * st.noise;           // error esperado sobre datos nuevos CON ruido
      }
      return { n: n, tr: trS / R, va: vaS / R };
    });
    cache[key] = res; return res;
  }

  var view = api.view(root, { aspect: 1.75, minH: 270, maxH: 430, label: "Curva de aprendizaje: error de entrenamiento y de validación según el número de muestras de entrenamiento" });
  var lo = Math.log10(SIZES[0]), hi = Math.log10(SIZES[SIZES.length - 1]);
  var plot = api.plot(view, { xr: [lo - 0.03, hi + 0.03], yr: [-2, 1], xticks: 3, yticks: 3, ylabel: "error (MSE, escala log)", xlabel: "muestras de entrenamiento", pad: { l: 52, r: 12, t: 14, b: 38 },
    xfmt: function () { return ""; }, yfmt: function (v) { return String(+Math.pow(10, v).toPrecision(2)); } });
  var ui = api.controls(root), out = api.readout(root);
  var sDeg = ui.slider({ label: "Complejidad del modelo (grado del polinomio)", min: 1, max: 10, step: 1, value: st.deg, onInput: function (v) { st.deg = v; update(); } });
  ui.slider({ label: "Ruido de los datos (σ)", min: 0.1, max: 0.5, step: 0.05, value: st.noise, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { st.noise = Math.round(v * 100) / 100; update(); } });
  ui.button("Demasiado simple (grado 1)", function () { st.deg = 1; sDeg.set(1, true); update(); });
  ui.button("Adecuado (grado 3)", function () { st.deg = 3; sDeg.set(3, true); update(); });
  ui.button("Demasiado flexible (grado 9)", function () { st.deg = 9; sDeg.set(9, true); update(); });
  var C0 = api.colors();
  api.legend(root, [[C0.cobalto, "error en train"], [C0.terracota, "error en validación (datos nuevos)"], [C0.muted, "ruido irreducible σ²"]]);

  function X(n) { return Math.log10(n); }
  function draw(ctx, w, h, C) {
    var res = curve(), fl = st.noise * st.noise, b = plot.box;
    plot.axes(ctx);
    [10, 20, 40, 80].forEach(function (n) { D.text(ctx, String(n), plot.x(X(n)), b.y + b.h + 15, { size: 10.5, align: "center", color: C.muted, mono: true }); });
    ctx.save(); plot.clip(ctx);
    D.line(ctx, b.x, plot.y(Math.log10(fl)), b.x + b.w, plot.y(Math.log10(fl)), C.muted, 1.6, [6, 4]);
    function pts(key) { return res.map(function (o) { return [plot.x(X(o.n)), plot.y(Math.log10(M.clamp(o[key], 0.0101, 9.9)))]; }); }
    D.path(ctx, pts("tr"), C.cobalto, 2.8); D.path(ctx, pts("va"), C.terracota, 2.8);
    pts("tr").forEach(function (p) { D.circle(ctx, p[0], p[1], 3.2, C.cobalto, C.paper, 1); });
    pts("va").forEach(function (p) { D.circle(ctx, p[0], p[1], 3.2, C.terracota, C.paper, 1); });
    ctx.restore();
    D.text(ctx, "ruido σ² = " + fl.toFixed(3), b.x + 6, plot.y(Math.log10(fl)) - 6, { size: 10.5, align: "left", color: C.muted });
  }
  function update() {
    view.redraw();
    var res = curve(), last = res[res.length - 1], first = res[0], mid = res[7], fl = st.noise * st.noise, gap = last.va - last.tr, gapMid = mid.va - mid.tr, verdict, cls;
    if (last.va > 2.2 * fl && gap < 0.45 * last.va) { verdict = "Sesgo alto (infraajuste): las dos curvas se juntan en un error alto. Más datos NO ayudan; hace falta un modelo más flexible o mejores variables."; cls = "bad"; }
    else if (gap > 0.35 * last.va && gap > 0.5 * fl) { verdict = "Varianza alta (sobreajuste): sigue habiendo un hueco grande entre train y validación. Ayudan más datos, menos complejidad o regularización."; cls = "bad"; }
    else if (gapMid > 0.6 * mid.va && gapMid > fl) { verdict = "Varianza alta con pocos datos: con " + mid.n + " muestras el hueco es de " + gapMid.toFixed(3) + " y se va cerrando al añadir datos (con " + last.n + " ya es " + gap.toFixed(3) + "). Aquí MÁS DATOS SÍ AYUDAN."; cls = "bad"; }
    else { verdict = "Buen ajuste: las dos curvas se acercan al ruido irreducible. Más datos apenas cambiarían nada."; cls = "good"; }
    out.set("con <b>" + first.n + "</b> muestras: train = <b>" + first.tr.toFixed(3) + "</b>, validación = <b>" + (first.va > 9.9 ? ">9.9" : first.va.toFixed(3)) + "</b><br>" +
      "con <b>" + last.n + "</b> muestras: train = <b>" + last.tr.toFixed(3) + "</b>, validación = <b>" + last.va.toFixed(3) + "</b> · hueco = <b>" + gap.toFixed(3) + "</b> · ruido σ² = " + fl.toFixed(3) + "<br><span class='" + cls + "'>" + verdict + "</span>");
  }
  buildVal(); view.draw(draw); update();
});
