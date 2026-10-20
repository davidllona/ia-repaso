/* Experimento: por qué se divide entre raiz(d_k). Con q y k de componentes N(0,1), la desviación de q·k es raiz(d_k): sin dividir, el softmax se
   satura (un peso ≈ 1) y su gradiente se anula. Se ven los 8 pesos de una consulta y, para d_k = 2…1024, el peso máximo medio y el gradiente medio. */
Lab.register("curso3/c3m3-raiz-d", function (root, api) {
  var D = api.d, NK = 8, TR = 150;
  var S = { e: 6, scale: false, seed: 11 };
  function n(v, k) { return v.toFixed(k === undefined ? 2 : k).replace(".", ",").replace("-", "−"); }
  function sm(a) { var m = Math.max.apply(null, a), e = a.map(function (v) { return Math.exp(v - m); }), s = 0; e.forEach(function (v) { s += v; }); return e.map(function (v) { return v / s; }); }
  function jac(p) { var s = 0, i, j; for (i = 0; i < p.length; i++) for (j = 0; j < p.length; j++) { var v = i === j ? p[i] * (1 - p[i]) : -p[i] * p[j]; s += v * v; } return Math.sqrt(s); }
  function scores(r, dk) { var out = [], j, k; for (j = 0; j < NK; j++) { var s = 0; for (k = 0; k < dk; k++) s += r.normal(0, 1) * r.normal(0, 1); out.push(s); } return out; }
  var curves = {};
  function stats(e, sc) {
    var key = e + "/" + sc + "/" + S.seed; if (curves[key]) return curves[key];
    var dk = Math.pow(2, e), r = api.rng(S.seed * 100 + e), mx = 0, gr = 0, t;
    for (t = 0; t < TR; t++) { var s = scores(r, dk); if (sc) s = s.map(function (v) { return v / Math.sqrt(dk); }); var p = sm(s); mx += Math.max.apply(null, p); gr += jac(p); }
    return (curves[key] = { mx: mx / TR, gr: gr / TR });
  }
  var sample;
  function newSample() { var dk = Math.pow(2, S.e), r = api.rng(S.seed * 7 + S.e + Math.floor(Math.random() * 1000)); sample = scores(r, dk); }

  var view = api.view(root, { aspect: 2.6, minH: 170, maxH: 230, label: "Los 8 pesos de atención de una consulta sobre 8 títulos de un historial, con la dimensión elegida" });
  var view2 = api.view(root, { aspect: 2.5, minH: 190, maxH: 250, label: "Peso máximo medio y gradiente medio según d_k, con y sin dividir entre raíz de d_k" });
  var plot2 = api.plot(view2, { xr: [1, 10], yr: [0, 1], xticks: 9, yticks: 4, xlabel: "d_k = 2^x", pad: { l: 36, r: 10, t: 12, b: 36 }, xfmt: function (v) { return Math.round(v); } });
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.72rem, 2.7vw, .84rem)";
  ui.slider({ label: "Tamaño de q y k (d_k = 2^x)", min: 1, max: 10, step: 1, value: S.e, fmt: function (v) { return "2^" + v + " = " + Math.pow(2, v); }, onInput: function (v) { S.e = v; newSample(); update(); } });
  ui.toggle({ label: "Dividir entre √d_k", value: false, onChange: function (v) { S.scale = v; update(); } });
  ui.button("Otra consulta", function () { newSample(); update(); });
  api.legend(root, [[api.colors().terracota, "sin dividir"], [api.colors().cobalto, "dividiendo entre √d_k"]]);
  root.appendChild(api.el("p", { text: "Gráfico de abajo: línea continua = peso máximo medio; línea discontinua = gradiente medio ‖J‖ (norma de la matriz de derivadas de la softmax).", style: { fontSize: ".78rem", margin: ".2rem 0 0" } }));

  function weights() { var dk = Math.pow(2, S.e); return sm(sample.map(function (v) { return S.scale ? v / Math.sqrt(dk) : v; })); }
  newSample();
  view.draw(function (ctx, w, h, C) {
    var p = weights(), L = 34, B = 26, T = 12, bw = (w - L - 10) / NK, i, bi = 0;
    for (i = 0; i < NK; i++) if (p[i] > p[bi]) bi = i;
    D.line(ctx, L, h - B, w - 8, h - B, C.ink, 1.2);
    [0, 0.5, 1].forEach(function (v) { var y = h - B - v * (h - B - T); D.line(ctx, L, y, w - 8, y, C.line, 1); D.text(ctx, n(v, 1), L - 5, y + 4, { size: 10, align: "right", color: C.muted, mono: true }); });
    for (i = 0; i < NK; i++) {
      var hh = p[i] * (h - B - T), x = L + bw * i + bw * 0.15;
      D.rect(ctx, x, h - B - hh, bw * 0.7, hh, i === bi ? C.terracota : C.cobalto);
      D.text(ctx, n(p[i], 2), x + bw * 0.35, Math.max(T + 8, h - B - hh - 4), { size: 10.5, align: "center", mono: true, color: C.ink });
      D.text(ctx, "k" + (i + 1), x + bw * 0.35, h - B + 14, { size: 11, align: "center", color: C.muted });
    }
  });
  view2.draw(function (ctx, w, h, C) {
    plot2.axes(ctx); var e, pts, k;
    [[false, C.terracota], [true, C.cobalto]].forEach(function (cfg) {
      [0, 1].forEach(function (what) {
        pts = []; for (e = 1; e <= 10; e++) { var s = stats(e, cfg[0]); pts.push([plot2.x(e), plot2.y(what ? Math.min(1, s.gr) : s.mx)]); }
        D.path(ctx, pts, cfg[1], what ? 1.8 : 2.6, what ? [5, 4] : []);
        pts.forEach(function (q, i) { if (i + 1 === S.e) D.circle(ctx, q[0], q[1], 4.5, cfg[1], C.paper, 1.5); });
      });
    });
    D.line(ctx, plot2.x(S.e), plot2.box.y, plot2.x(S.e), plot2.box.y + plot2.box.h, C.ink2, 1, [3, 3]);
  });
  function update() {
    view.redraw(); view2.redraw();
    var dk = Math.pow(2, S.e), a = stats(S.e, false), b = stats(S.e, true), p = weights(), mx = Math.max.apply(null, p);
    out.set("d_k = <b>" + dk + "</b> → las puntuaciones q·k tienen desviación ≈ √d_k = <b>" + n(Math.sqrt(dk), 1) + "</b>. Esta consulta: peso mayor = <b>" + n(mx, 2) + "</b> (" + (S.scale ? "dividiendo" : "sin dividir") + ").<br>" +
      "Media de " + TR + " consultas — <span class='bad'>sin dividir</span>: peso máximo <b>" + n(a.mx, 2) + "</b>, gradiente <b>" + n(a.gr, 3) + "</b> · <span class='good'>dividiendo</span>: peso máximo <b>" + n(b.mx, 2) + "</b>, gradiente <b>" + n(b.gr, 3) + "</b>" +
      (a.mx > 0.85 ? "<br><span class='bad'>Sin dividir, el softmax casi es un «ganador se lo lleva todo»: el recomendador mira un solo título del historial y su gradiente es casi 0, así que apenas puede aprender a cambiar de opinión.</span>" : ""));
  }
  newSample(); update();
});
