/* Experimento: si pruebas muchos modelos que no saben nada y te quedas con el mejor, su nota sale inflada por pura suerte (data snooping). */
Lab.register("curso1/c1m5-loteria", function (root, api) {
  var D = api.d;
  var st = { N: 20, n: 50, tanda: 1, shown: 0 };
  var aciertos = [], best = 0;

  function tanda() {
    var r = api.rng(st.tanda * 7919 + st.N * 31 + st.n), i, j, c;
    aciertos = [];
    for (i = 0; i < st.N; i++) { c = 0; for (j = 0; j < st.n; j++) if (r.next() < 0.5) c++; aciertos.push(c); }
    best = Math.max.apply(null, aciertos);
  }
  /* Máximo esperado exacto de N binomiales(n, 0,5): suma de k · [F(k)^N − F(k−1)^N] */
  function maxEsperado(N, n) {
    var pmf = Math.pow(0.5, n), F = 0, Fprev = 0, e = 0, k;
    for (k = 0; k <= n; k++) {
      if (k > 0) pmf = pmf * (n - k + 1) / k;
      F = Math.min(1, F + pmf);
      e += k * (Math.pow(F, N) - Math.pow(Fprev, N));
      Fprev = F;
    }
    return e / n;
  }

  var view = api.view(root, { aspect: 1.9, minH: 250, label: "Cada punto es un modelo que lanza una moneda. Se colocan según su porcentaje de aciertos en el test; el mejor se marca aparte" });
  var po = { xr: [0.2, 0.8], yr: [0, 1], xticks: 6, yticks: 1, xfmt: function (v) { return Math.round(v * 100) + " %"; }, yfmt: function () { return ""; }, pad: { l: 24, r: 24, t: 34, b: 44 }, grid: false };
  var plot = api.plot(view, po);
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Modelos probados", min: 1, max: 100, step: 1, value: st.N, onInput: function (v) { st.N = v; nueva(false); } });
  ui.slider({ label: "Películas en el test", min: 10, max: 200, step: 10, value: st.n, onInput: function (v) { st.n = v; nueva(false); } });
  ui.button("Otra tanda", function () { st.tanda++; nueva(true); }, "primary");
  var C0 = api.colors();
  api.legend(root, [[C0.cobalto, "un modelo que lanza una moneda"], [C0.terracota, "el mejor de la tanda"], [C0.olivaInk, "lo que valen de verdad: 50 %"]]);

  var loop = api.loop(function () {
    st.shown += Math.max(1, Math.round(st.N / 25));
    if (st.shown >= st.N) { st.shown = st.N; view.redraw(); texto(); return false; }
    view.redraw();
  }, { fps: 30 });

  function nueva(animar) {
    tanda();
    if (animar && !api.reduceMotion) { st.shown = 0; loop.start(); }
    else { loop.stop(); st.shown = st.N; }
    view.redraw(); texto();
  }

  function draw(ctx, w, h, C) {
    var lo = 0.5 - 3.2 * Math.sqrt(0.25 / st.n), hi = 0.5 + 3.2 * Math.sqrt(0.25 / st.n);
    var paso5 = (hi - lo) / 0.05 > (w < 520 ? 6 : 12) ? 0.1 : 0.05;
    lo = Math.max(0, Math.floor(lo / paso5) * paso5); hi = Math.min(1, Math.ceil(hi / paso5) * paso5);
    plot.xr = [lo, hi]; po.xticks = Math.round((hi - lo) / paso5);
    plot.axes(ctx);
    var b = plot.box;
    D.text(ctx, "porcentaje de aciertos en el test", b.x + b.w / 2, h - 6, { size: 12, align: "center", color: C.ink2, weight: 500 });
    /* columnas de puntos: un punto por modelo, apilados si empatan */
    var cuenta = {}, maxPila = 1, i;
    aciertos.forEach(function (k) { cuenta[k] = (cuenta[k] || 0) + 1; if (cuenta[k] > maxPila) maxPila = cuenta[k]; });
    var paso = b.w / (hi - lo) / st.n;                 /* píxeles entre dos valores posibles */
    var rad = Math.max(2.5, Math.min(7, paso * 0.45, (b.h - 6) / (2 * maxPila + 1)));
    var pila = {};
    for (i = 0; i < st.shown; i++) {
      var k = aciertos[i]; pila[k] = (pila[k] || 0) + 1;
      var x = plot.x(k / st.n), y = b.y + b.h - rad - (pila[k] - 1) * rad * 2.1 - 2;
      var esMejor = st.shown === st.N && k === best;
      D.circle(ctx, x, y, rad, esMejor ? C.terracota : C.cobalto, esMejor ? C.ink : null, 1.5);
    }
    /* línea del 50 % */
    var x50 = plot.x(0.5);
    D.line(ctx, x50, b.y - 8, x50, b.y + b.h, C.olivaInk, 2, [6, 4]);
    D.text(ctx, w < 520 ? "de verdad: 50 %" : "lo que valen de verdad: 50 %", x50 - 6, b.y - 14, { size: 11, align: "right", color: C.olivaInk, weight: 600 });
    /* etiqueta del mejor, arriba a la derecha, con flecha */
    if (st.shown === st.N) {
      var xb = plot.x(best / st.n), yTop = b.y + b.h - rad - (cuenta[best] - 1) * rad * 2.1 - 2;
      var lx = w - 14, ly = b.y - 14;
      D.text(ctx, "el mejor: " + Math.round(best / st.n * 100) + " %", lx, ly, { size: 12, align: "right", color: C.terracota, weight: 700 });
      if (Math.abs(xb - x50) > 2) D.arrow(ctx, Math.min(lx - 30, Math.max(xb + 10, x50 + 20)), ly + 6, xb, yTop - rad - 3, C.terracota, 1.5);
    }
  }

  function texto() {
    if (st.shown < st.N) return;
    var media = aciertos.reduce(function (a, b) { return a + b; }, 0) / st.N;
    out.set("tanda nº <b>" + st.tanda + "</b>: " + st.N + " modelos de moneda, test de " + st.n + " películas<br>" +
      "media de todos: <b>" + (media / st.n * 100).toFixed(1).replace(".", ",") + " %</b> · el mejor: <span class='bad'>" + best + " de " + st.n + " = " + Math.round(best / st.n * 100) + " %</span><br>" +
      "lo que se espera del mejor de " + st.N + " (cuenta exacta): <b>" + (maxEsperado(st.N, st.n) * 100).toFixed(1).replace(".", ",") + " %</b>");
  }

  tanda(); st.shown = st.N; view.draw(draw); texto();
  return { destroy: function () { loop.stop(); } };
});
