/* Experimento: tamaño de la salida de una convolución según n, f, stride y padding. */
Lab.register("curso2/c2m3-stride-padding", function (root, api) {
  var n = 7, f = 3, s = 1, p = 0, pos = 0, playing = false;
  function outSize() { return (n + 2 * p - f) >= 0 ? Math.floor((n + 2 * p - f) / s) + 1 : 0; }

  var grid = api.el("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,230px),1fr))", gap: "10px" } });
  root.appendChild(grid);
  function cellDiv() { var c = api.el("div", { style: { minWidth: "0" } }); grid.appendChild(c); return c; }
  var vIn = api.view(cellDiv(), { aspect: 1, minH: 220, maxH: 400, label: "Fotograma de entrada con su borde de padding y la ventana del filtro" });
  var vOut = api.view(cellDiv(), { aspect: 1, minH: 220, maxH: 400, label: "Mapa de salida: una casilla por cada posición de la ventana" });
  var ui = api.controls(root), out = api.readout(root);
  var slN = ui.slider({ label: "n = lado del fotograma", min: 3, max: 10, step: 1, value: n, onInput: function (v) { n = v; fix(); update(); } });
  var slF = ui.slider({ label: "f = lado del filtro", min: 1, max: 7, step: 1, value: f, onInput: function (v) { f = v; fix(); update(); } });
  var slS = ui.slider({ label: "s = stride (paso)", min: 1, max: 4, step: 1, value: s, onInput: function (v) { s = v; fix(); update(); } });
  var slP = ui.slider({ label: "p = padding (ceros por cada lado)", min: 0, max: 3, step: 1, value: p, onInput: function (v) { p = v; fix(); update(); } });
  var slK = ui.slider({ label: "Posición de la ventana", min: 0, max: 1, step: 1, value: 0, fmt: function (v) { var m = outSize(); return m ? (v + 1) + " de " + (m * m) : "—"; }, onInput: function (v) { pos = v; update(true); } });
  ui.button("padding = valid (p = 0)", function () { p = 0; slP.set(0, true); fix(); update(); });
  ui.button("padding = same (s = 1)", function () { s = 1; slS.set(1, true); p = Math.min(3, Math.floor((f - 1) / 2)); slP.set(p, true); fix(); update(); });
  var playBtn = ui.button("Reproducir", function () { if (playing) loop.stop(); else start(); });
  var loop = api.loop(function () {
    var m = outSize(); if (pos >= m * m - 1) return false;
    slK.set(pos + 1); return true;
  }, { fps: 3, onState: function (st) { playing = st; playBtn.textContent = st ? "Pausa" : "Reproducir"; } });
  function start() { var m = outSize(); if (!m) return; if (api.reduceMotion) { slK.set(m * m - 1); return; } if (pos >= m * m - 1) slK.set(0); loop.start(); }

  function fix() {
    var m = outSize();
    slK.input.max = Math.max(0, m * m - 1);
    if (pos > m * m - 1) { pos = Math.max(0, m * m - 1); }
    slK.set(pos, true);
  }
  function geom(v, cells, top) {
    var sz = Math.max(8, Math.min((v.w - 14) / cells, (v.h - top - 8) / cells));
    return { sz: sz, x0: (v.w - sz * cells) / 2, y0: top };
  }
  vIn.draw(function (ctx, w, h, C) {
    var D = api.d, T = n + 2 * p, g = geom(vIn, T, 22), m = outSize(), i, j;
    D.text(ctx, "Fotograma " + n + "×" + n + (p ? " + padding " + p : ""), w / 2, 14, { size: 11, weight: 600, align: "center", color: C.ink2 });
    var wi = m ? Math.floor(pos / m) : 0, wj = m ? pos % m : 0;
    var used = m ? (m - 1) * s + f : 0;
    for (i = 0; i < T; i++) for (j = 0; j < T; j++) {
      var real = i >= p && i < p + n && j >= p && j < p + n;
      var x = g.x0 + j * g.sz, y = g.y0 + i * g.sz;
      D.rect(ctx, x, y, g.sz, g.sz, real ? C.cobaltoWash : C.markerWash, C.line, 1);
      if (m && (i >= used || j >= used)) {
        D.line(ctx, x + 2, y + 2, x + g.sz - 2, y + g.sz - 2, C.terracota, 1.2);
        D.line(ctx, x + g.sz - 2, y + 2, x + 2, y + g.sz - 2, C.terracota, 1.2);
      }
    }
    if (p) D.rect(ctx, g.x0 + p * g.sz, g.y0 + p * g.sz, n * g.sz, n * g.sz, null, C.cobalto, 2);
    if (m) {
      ctx.save(); ctx.globalAlpha = 0.3;
      D.rect(ctx, g.x0 + wj * s * g.sz, g.y0 + wi * s * g.sz, f * g.sz, f * g.sz, C.terracota);
      ctx.restore();
      D.rect(ctx, g.x0 + wj * s * g.sz, g.y0 + wi * s * g.sz, f * g.sz, f * g.sz, null, C.terracota, 3);
    } else {
      D.text(ctx, "El filtro no cabe", w / 2, h / 2, { size: 14, weight: 600, align: "center", color: C.terracotaInk });
    }
  });
  vOut.draw(function (ctx, w, h, C) {
    var D = api.d, m = outSize(), i, j;
    D.text(ctx, "Salida " + m + "×" + m, w / 2, 14, { size: 11, weight: 600, align: "center", color: C.ink2 });
    if (!m) { D.text(ctx, "sin salida", w / 2, h / 2, { size: 13, align: "center", color: C.muted }); return; }
    var g = geom(vOut, m, 22);
    for (i = 0; i < m; i++) for (j = 0; j < m; j++) {
      var k = i * m + j, x = g.x0 + j * g.sz, y = g.y0 + i * g.sz;
      D.rect(ctx, x, y, g.sz, g.sz, k <= pos ? C.oliva : C.surface, C.line, 1);
      if (k <= pos && g.sz >= 18) D.text(ctx, String(k + 1), x + g.sz / 2, y + g.sz / 2 + 4, { size: Math.min(12, g.sz * 0.4), align: "center", mono: true, color: C.paper });
    }
    D.rect(ctx, g.x0 + (pos % m) * g.sz, g.y0 + Math.floor(pos / m) * g.sz, g.sz, g.sz, null, C.terracota, 3);
  });
  function update(onlyPos) {
    if (!onlyPos) fix();
    vIn.redraw(); vOut.redraw();
    var m = outSize(), num = n + 2 * p - f, T = n + 2 * p;
    var html = "Fórmula: ⌊(n + 2p − f) / s⌋ + 1 = ⌊(" + n + " + " + (2 * p) + " − " + f + ") / " + s + "⌋ + 1 = ";
    if (num < 0) html += "<span class='bad'>el filtro (" + f + ") es mayor que la imagen con padding (" + T + "): no hay ninguna posición válida</span>";
    else {
      html += "⌊" + num + " / " + s + "⌋ + 1 = <b>" + m + "</b> → salida de <b>" + m + "×" + m + "</b> (" + (m * m) + " posiciones)";
      var sob = num % s;
      html += sob ? "<br><span class='bad'>Sobran " + sob + " fila(s) y columna(s) del borde que ninguna ventana llega a mirar (marcadas con ×).</span>" : "<br><span class='good'>La ventana aprovecha toda la imagen: " + num + " es múltiplo de " + s + ".</span>";
    }
    html += "<br>En Keras: padding='valid' daría " + (n - f >= 0 ? Math.floor((n - f) / s) + 1 : 0) + "×" + (n - f >= 0 ? Math.floor((n - f) / s) + 1 : 0) + " · padding='same' daría ⌈n/s⌉ = " + Math.ceil(n / s) + "×" + Math.ceil(n / s);
    out.set(html);
  }
  fix(); update();
  return { destroy: function () { loop.stop(); } };
});
