/* Experimento: un filtro 3×3 sobre una imagen en color es un bloque 3×3×3. Mira los tres canales a la vez
   y da UN número por posición (suma de 27 productos + sesgo). Con F filtros salen F mapas. */
Lab.register("curso2/c2m3-filtro-rgb", function (root, api) {
  var R = [[1, 2, 0, 1, 0], [0, 1, 3, 0, 2], [2, 1, 1, 2, 1], [0, 2, 1, 0, 3], [1, 0, 2, 1, 1]];
  var G = [[0, 1, 1, 0, 2], [2, 0, 1, 1, 0], [1, 1, 0, 2, 1], [0, 2, 1, 0, 1], [1, 0, 0, 1, 2]];
  var B = [[3, 0, 1, 2, 0], [1, 2, 0, 1, 1], [0, 1, 2, 0, 3], [2, 0, 1, 1, 0], [1, 2, 0, 0, 1]];
  var KR = [[1, 0, -1], [1, 0, -1], [1, 0, -1]];
  var KG = [[0, 1, 0], [1, -4, 1], [0, 1, 0]];
  var KB = [[1, 1, 1], [0, 0, 0], [-1, -1, -1]];
  var CH = [{ n: "Canal R", img: R, k: KR }, { n: "Canal G", img: G, k: KG }, { n: "Canal B", img: B, k: KB }];
  var N = 5, F = 3, M = N - F + 1;          // 5×5, filtro 3×3, mapa 3×3
  var pos = 0, bias = 2, ver = "pix", relu = true, nf = 16, visto = [true, false, false, false, false, false, false, false, false];
  var playing = false;

  var grid = api.el("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,140px),1fr))", gap: "8px" } });
  root.appendChild(grid);
  function cellDiv() { var c = api.el("div", { style: { minWidth: "0" } }); grid.appendChild(c); return c; }
  var vs = CH.map(function (c) { return api.view(cellDiv(), { aspect: 1, minH: 140, maxH: 260, label: c.n + " de la imagen 5×5, con la ventana 3×3 marcada" }); });
  var vOut = api.view(cellDiv(), { aspect: 1, minH: 140, maxH: 260, label: "Mapa de salida 3×3 del filtro" });
  var ui = api.controls(root), out = api.readout(root);

  var slPos = ui.slider({ label: "Posición de la ventana", min: 0, max: M * M - 1, step: 1, value: 0, fmt: function (v) { return (v + 1) + " de " + (M * M); }, onInput: function (v) { pos = v; visto[v] = true; update(); } });
  ui.slider({ label: "Sesgo del filtro (b)", min: -6, max: 6, step: 1, value: bias, onInput: function (v) { bias = v; update(); } });
  ui.segmented({ label: "Dentro de la ventana, ver…", options: [["pix", "píxeles"], ["pes", "pesos"], ["pro", "productos"]], value: ver, onChange: function (v) { ver = v; update(); } });
  ui.slider({ label: "Filtros en la capa (F)", min: 1, max: 64, step: 1, value: nf, onInput: function (v) { nf = v; update(); } });
  ui.button("Siguiente posición", function () { slPos.set((pos + 1) % (M * M)); });
  var playBtn = ui.button("Reproducir", function () { if (playing) loop.stop(); else start(); });
  ui.toggle({ label: "ReLU", value: relu, onChange: function (v) { relu = v; update(); } });
  var loop = api.loop(function () {
    if (pos >= M * M - 1) return false;
    slPos.set(pos + 1); return true;
  }, { fps: 1.2, onState: function (st) { playing = st; playBtn.textContent = st ? "Pausa" : "Reproducir"; } });
  function start() {
    if (api.reduceMotion) { for (var i = 0; i < M * M; i++) visto[i] = true; slPos.set(M * M - 1); return; }
    if (pos >= M * M - 1) slPos.set(0);
    loop.start();
  }

  function parcial(c, p) {
    var wi = Math.floor(p / M), wj = p % M, s = 0, a, b;
    for (a = 0; a < 3; a++) for (b = 0; b < 3; b++) s += c.img[wi + a][wj + b] * c.k[a][b];
    return s;
  }
  function total(p) { return parcial(CH[0], p) + parcial(CH[1], p) + parcial(CH[2], p) + bias; }
  function fin(p) { var t = total(p); return relu ? Math.max(0, t) : t; }
  function fmt(x) { return x < 0 ? "−" + (-x) : String(x); }
  function geom(v, cells, top) {
    var sz = Math.max(10, Math.min((v.w - 10) / cells, (v.h - top - 6) / cells));
    return { sz: sz, x0: (v.w - sz * cells) / 2, y0: top };
  }
  var wash = ["terracotaWash", "olivaWash", "cobaltoWash"], edge = ["terracota", "oliva", "cobalto"];
  vs.forEach(function (v, n) {
    v.draw(function (ctx, w, h, C) {
      var D = api.d, c = CH[n], g = geom(v, N, 22), wi = Math.floor(pos / M), wj = pos % M, i, j;
      D.text(ctx, c.n + " · suma " + fmt(parcial(c, pos)), w / 2, 14, { size: 11, weight: 600, align: "center", color: C.ink2 });
      for (i = 0; i < N; i++) for (j = 0; j < N; j++) {
        var inW = i >= wi && i < wi + 3 && j >= wj && j < wj + 3;
        var x = g.x0 + j * g.sz, y = g.y0 + i * g.sz;
        D.rect(ctx, x, y, g.sz, g.sz, inW ? C[wash[n]] : C.surface, C.line, 1);
        var val = c.img[i][j], txt = String(val), col = inW ? C.ink : C.muted;
        if (inW && ver === "pes") { txt = fmt(c.k[i - wi][j - wj]); col = C[edge[n]]; }
        if (inW && ver === "pro") { txt = fmt(val * c.k[i - wi][j - wj]); col = C.ink; }
        D.text(ctx, txt, x + g.sz / 2, y + g.sz / 2 + 4, { size: Math.max(11, Math.min(14, g.sz * 0.45)), align: "center", mono: true, color: col });
      }
      D.rect(ctx, g.x0 + wj * g.sz, g.y0 + wi * g.sz, 3 * g.sz, 3 * g.sz, null, C[edge[n]], 3);
    });
  });
  vOut.draw(function (ctx, w, h, C) {
    var D = api.d, g = geom(vOut, M, 22), i, j;
    D.text(ctx, "Mapa de salida 3×3", w / 2, 14, { size: 11, weight: 600, align: "center", color: C.ink2 });
    for (i = 0; i < M; i++) for (j = 0; j < M; j++) {
      var k = i * M + j, x = g.x0 + j * g.sz, y = g.y0 + i * g.sz;
      D.rect(ctx, x, y, g.sz, g.sz, visto[k] ? C.markerWash : C.surface, C.line, 1);
      if (visto[k]) D.text(ctx, fmt(fin(k)), x + g.sz / 2, y + g.sz / 2 + 5, { size: Math.max(11, Math.min(16, g.sz * 0.35)), align: "center", mono: true, weight: 600, color: C.ink });
    }
    D.rect(ctx, g.x0 + (pos % M) * g.sz, g.y0 + Math.floor(pos / M) * g.sz, g.sz, g.sz, null, C.marker, 3);
  });
  function update() {
    vs.forEach(function (v) { v.redraw(); }); vOut.redraw();
    var r = parcial(CH[0], pos), gg = parcial(CH[1], pos), b = parcial(CH[2], pos), t = r + gg + b + bias;
    out.set("Posición " + (pos + 1) + ": R <b>" + fmt(r) + "</b> + G <b>" + fmt(gg) + "</b> + B <b>" + fmt(b) + "</b> = " + fmt(r + gg + b) +
      "; más el sesgo " + fmt(bias) + " = <b>" + fmt(t) + "</b>" + (relu ? " · ReLU → <b>" + Math.max(0, t) + "</b>" : "") +
      "<br>Un filtro = 3·3·3 = <b>27 pesos</b> + 1 sesgo = 28 números, y da <b>un solo número</b> por posición." +
      "<br>Con <b>" + nf + "</b> filtro" + (nf > 1 ? "s" : "") + ": salida 3×3×" + nf + " (" + nf + " mapa" + (nf > 1 ? "s" : "") + ") · parámetros (3·3·3 + 1)·" + nf + " = <b>" + (28 * nf).toLocaleString("es-ES") + "</b>");
  }
  update();
  return { destroy: function () { loop.stop(); } };
});
