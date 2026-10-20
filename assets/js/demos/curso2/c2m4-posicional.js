/* Experimento: codificación posicional sinusoidal. Mapa de calor PE[pos, dim], una dimensión como onda y la similitud
   de una posición con todas las demás (depende de la DISTANCIA entre posiciones, no de cuáles sean). */
Lab.register("curso2/c2m4-posicional", function (root, api) {
  var D = api.d, C0 = api.colors();
  var NP = 40;
  var S = { d: 16, pos: 5, dim: 0 };

  function n(v, k) { return v.toFixed(k === undefined ? 3 : k).replace(".", ",").replace("-", "−"); }
  function pe(p, j, d) {
    var i = Math.floor(j / 2), w = p / Math.pow(10000, 2 * i / d);
    return j % 2 === 0 ? Math.sin(w) : Math.cos(w);
  }
  function hexToRgb(h) {
    h = String(h).trim();
    if (h.charAt(0) === "#") {
      if (h.length === 4) h = "#" + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
      return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)];
    }
    var m = h.match(/\d+(\.\d+)?/g);
    return m ? [+m[0], +m[1], +m[2]] : [128, 128, 128];
  }
  function mix(a, b, t) {
    var x = hexToRgb(a), y = hexToRgb(b);
    return "rgb(" + Math.round(x[0] + (y[0] - x[0]) * t) + "," + Math.round(x[1] + (y[1] - x[1]) * t) + "," + Math.round(x[2] + (y[2] - x[2]) * t) + ")";
  }
  function heat(v, C) { return v >= 0 ? mix(C.surface, C.terracota, v) : mix(C.surface, C.cobalto, -v); }

  var view = api.view(root, { aspect: 1.9, minH: 250, maxH: 400, drag: true, label: "Mapa de calor de la codificación posicional: filas = posiciones, columnas = dimensiones" });
  var view2 = api.view(root, { aspect: 2.4, minH: 220, maxH: 300, label: "Una dimensión de la codificación posicional a lo largo de las posiciones, y su similitud con la posición elegida" });
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.72rem, 2.7vw, .84rem)";
  var sd = ui.slider({ label: "Tamaño del vector d_model (dimensiones)", min: 4, max: 64, step: 2, value: S.d, fmt: function (v) { return v; }, onInput: function (v) { S.d = v; if (S.dim >= v) { S.dim = v - 1; sdim.set(S.dim, true); } sdim.input.max = v - 1; update(); } });
  var sp = ui.slider({ label: "Posición elegida (fila)", min: 0, max: NP - 1, step: 1, value: S.pos, fmt: function (v) { return v; }, onInput: function (v) { S.pos = v; update(); } });
  var sdim = ui.slider({ label: "Dimensión elegida (columna)", min: 0, max: S.d - 1, step: 1, value: S.dim, fmt: function (v) { return v; }, onInput: function (v) { S.dim = v; update(); } });
  api.legend(root, [[C0.terracota, "valor +1"], [C0.line, "valor 0"], [C0.cobalto, "valor −1"]]);

  var box1 = { l: 40, r: 10, t: 22, b: 8 };
  function drawHeat(ctx, w, h, C) {
    var d = S.d, x0 = box1.l, y0 = box1.t, bw = w - box1.l - box1.r, bh = h - box1.t - box1.b, cw = bw / d, ch = bh / NP, p, j;
    for (p = 0; p < NP; p++) for (j = 0; j < d; j++) {
      ctx.fillStyle = heat(pe(p, j, d), C); ctx.fillRect(x0 + j * cw, y0 + p * ch, cw + 0.6, ch + 0.6);
    }
    D.rect(ctx, x0, y0, bw, bh, null, C.ink, 1.5);
    // fila y columna elegidas
    D.rect(ctx, x0, y0 + S.pos * ch, bw, ch, null, C.ink, 2);
    D.rect(ctx, x0 + S.dim * cw, y0, cw, bh, null, C.marker, 2.5);
    D.text(ctx, w < 440 ? "dimensiones → (izq.: ondas rápidas · der.: lentas)" : "dimensiones → (izquierda: ondas rápidas · derecha: ondas lentas)", x0, 13, { size: 11, color: C.ink2 });
    D.text(ctx, "pos", 6, y0 + 10, { size: 11, color: C.ink2 });
    [0, 10, 20, 30, 39].forEach(function (q) { D.text(ctx, String(q), x0 - 5, y0 + q * ch + ch * 0.75, { size: 10.5, mono: true, color: C.muted, align: "right" }); });
  }
  var plot2 = api.plot(view2, { xr: [0, NP - 1], yr: [-1, 1], xticks: 8, yticks: 4, xlabel: "posición (nº de capítulo o de palabra)", pad: { l: 40, r: 12, t: 40, b: 36 }, yfmt: function (v) { return n(v, 1); }, xfmt: function (v) { return Math.round(v); } });
  function simil(a, b) { var s = 0, j; for (j = 0; j < S.d; j++) s += pe(a, j, S.d) * pe(b, j, S.d); return s / (S.d / 2); }
  function draw2(ctx, w, h, C) {
    plot2.axes(ctx);
    var p, ptsW = [], ptsS = [];
    for (p = 0; p < NP; p++) { ptsW.push([plot2.x(p), plot2.y(pe(p, S.dim, S.d))]); ptsS.push([plot2.x(p), plot2.y(simil(S.pos, p))]); }
    D.path(ctx, ptsS, C.terracota, 2.4);
    D.path(ctx, ptsW, C.cobalto, 2);
    for (p = 0; p < NP; p++) D.circle(ctx, ptsW[p][0], ptsW[p][1], 2.6, C.cobalto);
    D.line(ctx, plot2.x(S.pos), plot2.box.y, plot2.x(S.pos), plot2.box.y + plot2.box.h, C.ink, 1.2, [4, 3]);
    D.circle(ctx, plot2.x(S.pos), plot2.y(pe(S.pos, S.dim, S.d)), 5.5, C.cobalto, C.ink, 2);
    D.text(ctx, "azul: onda de la dimensión " + S.dim, plot2.box.x, 14, { size: 11, color: C.cobaltoInk, weight: 600 });
    D.text(ctx, "naranja: similitud de la posición " + S.pos + " con cada posición", plot2.box.x, 29, { size: 11, color: C.terracotaInk, weight: 600 });
  }
  view.draw(drawHeat); view2.draw(draw2);
  view.pointer({
    down: pick, drag: pick
  });
  function pick(px, py) {
    var bw = view.w - box1.l - box1.r, bh = view.h - box1.t - box1.b;
    var j = Math.floor((px - box1.l) / (bw / S.d)), p = Math.floor((py - box1.t) / (bh / NP));
    if (j >= 0 && j < S.d && p >= 0 && p < NP) { S.dim = j; S.pos = p; sdim.set(j, true); sp.set(p, true); update(); }
  }
  function update() {
    view.redraw(); view2.redraw();
    var i = Math.floor(S.dim / 2), wl = 2 * Math.PI * Math.pow(10000, 2 * i / S.d), kind = S.dim % 2 === 0 ? "seno" : "coseno";
    var first = [0, 1, 2, 3].filter(function (j) { return j < S.d; }).map(function (j) { return n(pe(S.pos, j, S.d), 3); });
    function otro(k) { return S.pos + k <= NP - 1 ? S.pos + k : S.pos - k; }
    out.set("Posición <b>" + S.pos + "</b>, vector PE = (<b>" + first.join("</b>, <b>") + "</b>, …) con d_model = " + S.d + "<br>" +
      "Dimensión <b>" + S.dim + "</b> = " + kind + "(pos / 10000<sup>" + n(2 * i / S.d, 2) + "</sup>) \u2192 una onda que se repite cada <b>" + (wl > 1e6 ? n(wl, 0) : n(wl, 1)) + "</b> posiciones<br>" +
      "Similitud entre dos posiciones a distancia 1: <b>" + n(simil(S.pos, otro(1)), 3) + "</b> · a distancia 5: <b>" + n(simil(S.pos, otro(5)), 3) + "</b> · a distancia 20: <b>" + n(simil(S.pos, otro(20)), 3) + "</b><br>" +
      "<span class='good'>Solo depende de la distancia, no de la posición concreta: la red puede aprender «el token anterior» o «dos tokens más allá».</span>");
  }
  update();
});
