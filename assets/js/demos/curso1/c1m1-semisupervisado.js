/* Experimento: aprendizaje semisupervisado con pseudo-etiquetas (1-vecino más cercano + las predicciones más seguras se convierten en etiquetas). */
Lab.register("curso1/c1m1-semisupervisado", function (root, api) {
  var SEEDS = [2, 3, 5], si = 0, K = 2, PER = 8, P = [], lab = [], src = [], ultima = [], ronda = 0, base = 1, loop = null;
  var C0 = api.colors();

  var view = api.view(root, { aspect: 1.75, minH: 270, maxH: 400, label: "Dos lunas de películas, comedias y terror; unas pocas con género anotado se van extendiendo a las vecinas más seguras" });
  var plot = api.plot(view, { xr: [-1.5, 2.5], yr: [-1, 1.5], xticks: 4, yticks: 5, pad: { l: 14, r: 14, t: 12, b: 12 }, grid: false });
  api.legend(root, [[C0.terracota, "Comedia"], [C0.cobalto, "Terror"], [C0.muted, "Película sin género anotado (aún)"]]);
  root.appendChild(api.el("p", { style: { margin: "0", fontSize: "0.78rem", color: "var(--muted)", lineHeight: "1.45" },
    html: "Cada punto es una película. Círculo grande con borde = género anotado por una persona · punto relleno claro = pseudo-etiqueta · cruz = pseudo-etiqueta equivocada (el programa lo sabe, el modelo no)." }));
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Películas con género anotado, por género, al empezar", min: 1, max: 5, step: 1, value: K, onInput: function (v) { K = v; reset(); } });
  ui.slider({ label: "Pseudo-etiquetas que añadimos por ronda", min: 2, max: 20, step: 1, value: PER, onInput: function (v) { PER = v; update(); } });
  var bRonda = ui.button("Ronda siguiente", function () { stop(); paso(); }, "primary");
  var bTodas = ui.button("Todas las rondas", function () { todas(); });
  ui.button("Otros datos", function () { si = (si + 1) % SEEDS.length; reset(); });

  function gen() {
    var r = api.rng(SEEDS[si]), n = 60, i, c0 = [], c1 = [], noise = 0.1;
    P = [];
    for (i = 0; i < n; i++) { var t = Math.PI * i / (n - 1); P.push({ x: Math.cos(t) + r.normal(0, noise), y: Math.sin(t) + r.normal(0, noise), c: 0 }); }
    for (i = 0; i < n; i++) { var t2 = Math.PI * i / (n - 1); P.push({ x: 1 - Math.cos(t2) + r.normal(0, noise), y: 0.5 - Math.sin(t2) + r.normal(0, noise), c: 1 }); }
    P.forEach(function (p, k) { (p.c ? c1 : c0).push(k); });
    r.shuffle(c0); r.shuffle(c1);
    return [c0, c1];
  }
  function reset() {
    stop();
    var g = gen(), i;
    lab = P.map(function () { return -1; }); src = P.map(function () { return -1; }); ultima = []; ronda = 0;
    for (i = 0; i < K; i++) { lab[g[0][i]] = 0; lab[g[1][i]] = 1; }
    base = acc();
    update();
  }
  function nn(i) {
    var best = -1, bd = Infinity, j;
    for (j = 0; j < P.length; j++) if (lab[j] >= 0) { var d = Math.hypot(P[i].x - P[j].x, P[i].y - P[j].y); if (d < bd) { bd = d; best = j; } }
    return { j: best, c: lab[best], d: bd };
  }
  /* Acierto de «1-vecino más cercano» sobre los puntos que aún no tienen etiqueta. */
  function acc() {
    var ok = 0, n = 0, i;
    for (i = 0; i < P.length; i++) if (lab[i] < 0) { n++; if (nn(i).c === P[i].c) ok++; }
    return n ? ok / n : 1;
  }
  function paso() {
    var cand = [], i;
    for (i = 0; i < P.length; i++) if (lab[i] < 0) { var q = nn(i); cand.push({ i: i, c: q.c, d: q.d, j: q.j }); }
    if (!cand.length) return false;
    cand.sort(function (a, b) { return a.d - b.d; });
    ultima = cand.slice(0, PER);
    ultima.forEach(function (c) { lab[c.i] = c.c; src[c.i] = c.j; });
    ronda++; update();
    return cand.length > PER;
  }
  function stop() { if (loop) loop.stop(); }
  function todas() {
    stop();
    if (api.reduceMotion) { while (paso()) { } return; }
    loop = api.loop(function () { return paso(); }, { fps: 4 });
    loop.start();
  }
  function draw(ctx, w, h, C) {
    var D = api.d, b = plot.box;
    D.rect(ctx, b.x, b.y, b.w, b.h, C.surface, C.ink, 1.5);
    ctx.save(); plot.clip(ctx);
    ultima.forEach(function (c) { D.line(ctx, plot.x(P[c.i].x), plot.y(P[c.i].y), plot.x(P[src[c.i]].x), plot.y(P[src[c.i]].y), C.ink2, 1.2, [3, 3]); });
    P.forEach(function (p, i) {
      var x = plot.x(p.x), y = plot.y(p.y), col = p.c ? C.cobalto : C.terracota;
      if (lab[i] < 0) D.circle(ctx, x, y, 4.2, null, C.muted, 1.6);
      else if (src[i] < 0) D.circle(ctx, x, y, 8, lab[i] ? C.cobalto : C.terracota, C.ink, 2.5);
      else {
        ctx.save(); ctx.globalAlpha = 0.55; D.circle(ctx, x, y, 4.8, lab[i] ? C.cobalto : C.terracota); ctx.restore();
        if (lab[i] !== p.c) {
          ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 6, y - 6); ctx.lineTo(x + 6, y + 6); ctx.moveTo(x + 6, y - 6); ctx.lineTo(x - 6, y + 6); ctx.stroke(); ctx.restore();
        }
      }
    });
    ctx.restore();
  }
  function update() {
    view.redraw();
    var real = 0, pseudo = 0, mal = 0, sin = 0, i;
    for (i = 0; i < P.length; i++) { if (lab[i] < 0) sin++; else if (src[i] < 0) real++; else { pseudo++; if (lab[i] !== P[i].c) mal++; } }
    out.set("Ronda <b>" + ronda + "</b> · etiquetas reales: <b>" + real + "</b> · pseudo-etiquetas: <b>" + pseudo + "</b> · sin etiqueta: <b>" + sin + "</b><br>" +
      "Si nos quedáramos solo con las <b>" + real + "</b> etiquetas reales (1-vecino más cercano) acertaríamos <b>" + (base * 100).toFixed(0) + " %</b> de las " + (P.length - real) + " películas restantes<br>" +
      (pseudo ? "Pseudo-etiquetas acertadas hasta ahora: <b>" + (pseudo - mal) + " de " + pseudo + "</b> (" + (100 * (pseudo - mal) / pseudo).toFixed(0) + " %)" + (mal ? " <span class='bad'>· " + mal + " equivocada" + (mal > 1 ? "s" : "") + ": un error se propaga a sus vecinos</span>" : " <span class='good'>· ninguna equivocada</span>") : "Pulsa «Ronda siguiente»: el modelo etiqueta los puntos de los que está más seguro (los más cercanos a uno etiquetado)."));
    bRonda.disabled = sin === 0; bTodas.disabled = sin === 0;
  }
  view.draw(draw); reset();
  return { destroy: stop };
});
