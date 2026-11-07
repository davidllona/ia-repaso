/* Experimento: cargar todas las imágenes en memoria frente a un generador que trae un lote cada vez.
   Memoria = N · alto · ancho · 3 canales · bytes por número (todo en memoria) frente a B · alto · ancho · 3 · bytes (un lote).
   Ejes logarítmicos: cada marca multiplica por 10. El tiempo usa un supuesto de 2 ms por imagen (leer + decodificar). */
Lab.register("curso6/c6m1-memoria", function (root, api) {
  var D = api.d;
  var S = { logN: 4, lado: 224, B: 32, bytes: 4, ram: 16 };
  var T_IMG = 0.002; // segundos por imagen (supuesto)

  var view = api.view(root, { aspect: 1.6, minH: 240, maxH: 380, label: "Memoria necesaria frente al número de imágenes: la línea de cargar todo crece sin parar y la del generador es plana" });
  var plot = api.plot(view, { xr: [2, 6], yr: [4, 12], xticks: 4, yticks: 8, pad: { l: 58, r: 28, t: 16, b: 40 },
    xlabel: "nº de imágenes (escala ×10)", xfmt: function (v) { return ["100", "1 mil", "10 mil", "100 mil", "1 millón"][Math.round(v) - 2] || ""; },
    yfmt: function (v) { return ["10 KB", "100 KB", "1 MB", "10 MB", "100 MB", "1 GB", "10 GB", "100 GB", "1 TB"][Math.round(v) - 4] || ""; } });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Número de imágenes", min: 2, max: 6, step: 0.05, value: S.logN, fmt: function (v) { return fmtN(Math.round(Math.pow(10, v))); }, onInput: function (v) { S.logN = v; update(); } });
  ui.select({ label: "Tamaño de cada imagen", options: [["32", "32 × 32"], ["64", "64 × 64"], ["128", "128 × 128"], ["224", "224 × 224"]], value: String(S.lado), onChange: function (v) { S.lado = +v; update(); } });
  ui.select({ label: "Tipo de cada número", options: [["4", "float32 (4 bytes)"], ["1", "uint8 (1 byte)"]], value: "4", onChange: function (v) { S.bytes = +v; update(); } });
  ui.select({ label: "RAM del ordenador", options: [["8", "8 GB"], ["16", "16 GB"], ["32", "32 GB"]], value: "16", onChange: function (v) { S.ram = +v; update(); } });
  ui.slider({ label: "batch_size del generador", min: 8, max: 256, step: 8, value: S.B, fmt: function (v) { return v; }, onInput: function (v) { S.B = v; update(); } });
  var C0 = api.colors();
  api.legend(root, [[C0.terracota, "todo en memoria"], [C0.cobalto, "generador (un lote)"], [C0.ink2, "RAM disponible"]]);

  function fmtN(n) { return n.toLocaleString("es-ES"); }
  function fmtB(b) {
    if (b >= 1e12) return (b / 1e12).toFixed(1).replace(".", ",") + " TB";
    if (b >= 1e9) return (b / 1e9).toFixed(1).replace(".", ",") + " GB";
    if (b >= 1e6) return (b / 1e6).toFixed(1).replace(".", ",") + " MB";
    return (b / 1e3).toFixed(0) + " KB";
  }
  function fmtT(s) {
    if (s >= 3600) return (s / 3600).toFixed(1).replace(".", ",") + " h";
    if (s >= 60) return (s / 60).toFixed(1).replace(".", ",") + " min";
    if (s >= 1) return s.toFixed(1).replace(".", ",") + " s";
    return Math.round(s * 1000) + " ms";
  }
  function porImg() { return S.lado * S.lado * 3 * S.bytes; }
  function lg(b) { return Math.log(b) / Math.LN10; }

  function draw(ctx, w, h, C) {
    plot.axes(ctx);
    ctx.save(); plot.clip(ctx);
    var b = porImg(), yr = lg(S.ram * 1e9);
    D.line(ctx, plot.x(2), plot.y(yr), plot.x(6), plot.y(yr), C.ink2, 1.5, [6, 4]);
    D.text(ctx, "RAM " + S.ram + " GB", plot.x(2) + 6, plot.y(yr) - 6, { size: 11, color: C.ink2, weight: 600 });
    // todo en memoria: recta de pendiente 1 en log-log
    D.line(ctx, plot.x(2), plot.y(lg(100 * b)), plot.x(6), plot.y(lg(1e6 * b)), C.terracota, 2.5);
    // generador: plano (solo un lote)
    var yg = lg(S.B * b);
    D.line(ctx, plot.x(2), plot.y(yg), plot.x(6), plot.y(yg), C.cobalto, 2.5);
    ctx.restore();
    var xN = plot.x(S.logN), N = Math.pow(10, S.logN), ym = lg(N * b), cabe = N * b <= S.ram * 1e9;
    D.line(ctx, xN, plot.box.y, xN, plot.box.y + plot.box.h, C.muted, 1, [3, 3]);
    if (ym <= 12) D.circle(ctx, xN, plot.y(ym), 6, cabe ? C.terracota : C.surface, C.terracota, 2.5);
    D.circle(ctx, xN, plot.y(yg), 6, C.cobalto, C.surface, 2);
  }

  function update() {
    var N = Math.round(Math.pow(10, S.logN)), b = porImg(), todo = N * b, lote = S.B * b, cabe = todo <= S.ram * 1e9;
    out.set("Una imagen: " + S.lado + " · " + S.lado + " · 3 · " + S.bytes + " = <b>" + fmtB(b) + "</b><br>" +
      "Todo en memoria: " + fmtN(N) + " imágenes → <b>" + fmtB(todo) + "</b> " + (cabe ? "<span class='good'>cabe en " + S.ram + " GB</span>" : "<span class='bad'>no cabe en " + S.ram + " GB: el programa se queda sin memoria</span>") + "<br>" +
      "Generador: un lote de " + S.B + " → <b>" + fmtB(lote) + "</b>, cabe siempre (no depende de N)<br>" +
      "Espera antes del primer paso (supuesto 2 ms por imagen): todo en memoria <b>" + fmtT(N * T_IMG) + "</b> · generador <b>" + fmtT(S.B * T_IMG) + "</b>");
    view.redraw();
  }
  view.draw(draw); update();
});
