/* Experimento: el hiperparámetro lo eliges tú (máximo de preguntas); los parámetros (umbrales) los encuentra el modelo al entrenar. */
Lab.register("curso1/c1m1-hiper-param", function (root, api) {
  var D = api.d;
  var pts = [];
  [2, 5, 8, 11, 14, 16].forEach(function (x) { pts.push({ x: x, y: 0 }); });
  [20, 23, 26, 29, 32, 35, 38].forEach(function (x) { pts.push({ x: x, y: 1 }); });
  [41, 43, 46, 48].forEach(function (x) { pts.push({ x: x, y: 0 }); });
  [52, 55, 58].forEach(function (x) { pts.push({ x: x, y: 1 }); });
  var N = pts.length, cands = [], i;
  for (i = 0; i < N - 1; i++) cands.push((pts[i].x + pts[i + 1].x) / 2);

  var maxQ = 1, model = null, sweep = null, stale = false;
  var view = api.view(root, { aspect: 2.1, minH: 210, maxH: 300, label: "Veinte clientes colocados según sus días sin entrar. Al entrenar aparecen las líneas de corte (umbrales) que encuentra el modelo" });
  var ui = api.controls(root);
  var out = api.readout(root);
  api.legend(root, [[api.colors().cobalto, "se quedó"], [api.colors().terracota, "canceló"]]);

  // dados unos umbrales, cada tramo predice su clase mayoritaria; devuelve fallos y clase por tramo
  function evalua(ths) {
    var edges = [-1].concat(ths, [999]), err = 0, cls = [], s, a, b;
    for (s = 0; s < edges.length - 1; s++) {
      a = 0; b = 0;
      pts.forEach(function (p) { if (p.x > edges[s] && p.x <= edges[s + 1]) { if (p.y) b++; else a++; } });
      cls.push(b > a ? 1 : 0); err += Math.min(a, b);
    }
    return { ths: ths, cls: cls, err: err };
  }
  function entrena(k) {
    var best = evalua([]), n = cands.length, a, b, c, m;
    function prueba(t) { m = evalua(t); if (m.err < best.err) best = m; }
    for (a = 0; a < n; a++) prueba([cands[a]]);
    if (k >= 2) for (a = 0; a < n; a++) for (b = a + 1; b < n; b++) prueba([cands[a], cands[b]]);
    if (k >= 3) for (a = 0; a < n; a++) for (b = a + 1; b < n; b++) for (c = b + 1; c < n; c++) prueba([cands[a], cands[b], cands[c]]);
    return best;
  }

  var sl = ui.slider({ label: "Hiperparámetro: máximo de preguntas (lo eliges tú)", min: 1, max: 3, step: 1, value: 1,
    fmt: function (v) { return v + (v === 1 ? " pregunta" : " preguntas"); },
    onInput: function (v) { maxQ = v; if (model) stale = true; model = null; sweep = null; loop.stop(); btn.disabled = false; update(); } });
  var btn = ui.button("Entrenar", function () { train(); }, "primary");

  var loop = api.loop(function () {
    sweep += 1.1; if (sweep >= 60) { sweep = null; btn.disabled = false; update(); return false; }
    view.redraw();
  }, { fps: 40 });
  function train() {
    model = entrena(maxQ); stale = false;
    if (api.reduceMotion) { sweep = null; update(); return; }
    sweep = 0; btn.disabled = true; update(); loop.start();
  }

  function draw(ctx, w, h, C) {
    var L = 12, R = 12, top = 34, bot = h - 34, bw = w - L - R;
    function X(v) { return L + v / 60 * bw; }
    var lim = sweep === null ? 999 : sweep;
    D.rect(ctx, L, top, bw, bot - top, C.surface, C.ink, 1.5);
    if (model) {
      var edges = [0].concat(model.ths, [60]);
      model.cls.forEach(function (c, s) {
        var a = Math.min(edges[s], lim), b = Math.min(edges[s + 1], lim);
        if (b > a) { ctx.fillStyle = c ? C.terracotaWash : C.cobaltoWash; ctx.fillRect(X(a), top + 1, X(b) - X(a), bot - top - 2); }
      });
      model.ths.forEach(function (t, k) {
        if (t > lim) return;
        D.line(ctx, X(t), top - 6, X(t), bot + 4, C.ink, 2.5);
        D.text(ctx, t.toFixed(1).replace(".", ","), X(t), top - 12, { size: 12, align: "center", color: C.ink, mono: true, weight: 600 });
      });
    }
    if (sweep !== null) D.line(ctx, X(sweep), top, X(sweep), bot, C.muted, 1.5, [4, 3]);
    pts.forEach(function (p, k) {
      var px = X(p.x), py = (top + bot) / 2 + ((k % 3) - 1) * Math.min(22, (bot - top) / 4);
      D.circle(ctx, px, py, 6, p.y ? C.terracota : C.cobalto, C.paper, 1.5);
      if (model && p.x <= lim) {
        var seg = 0; model.ths.forEach(function (t) { if (p.x > t) seg++; });
        if (model.cls[seg] !== p.y) D.circle(ctx, px, py, 10, null, C.ink, 2);
      }
    });
    for (var t = 0; t <= 60; t += 20) D.text(ctx, String(t), X(t), bot + 15, { size: 11, align: t === 0 ? "left" : t === 60 ? "right" : "center", color: C.muted, mono: true });
    D.text(ctx, "días sin entrar", w / 2, bot + 29, { size: 12, align: "center", color: C.ink2, weight: 500 });
    if (!model) D.text(ctx, stale ? "modelo sin entrenar otra vez" : "modelo sin entrenar", w / 2, top - 12, { size: 12, align: "center", color: C.muted });
  }
  function update() {
    view.redraw();
    var tu = "Tú elegiste (hiperparámetro): <b>máximo " + maxQ + (maxQ === 1 ? " pregunta" : " preguntas") + "</b>";
    if (!model) { out.set(tu + "<br>" + (stale ? "<span class='bad'>Has cambiado el hiperparámetro: los umbrales de antes ya no valen.</span> Pulsa «Entrenar»." : "El modelo aún no ha encontrado nada (parámetros): pulsa «Entrenar».")); return; }
    var ths = model.ths.map(function (t) { return t.toFixed(1).replace(".", ","); });
    out.set(tu + "<br>El modelo encontró (parámetros): <b>" + (ths.length === 1 ? "umbral " : "umbrales ") + ths.join(" · ") + "</b><br>Fallos: " +
      (model.err ? "<span class='bad'>" + model.err + " de " + N + "</span> (círculos con aro)" : "<span class='good'>0 de " + N + "</span>"));
  }
  view.draw(draw); update();
  return { destroy: function () { loop.stop(); } };
});
