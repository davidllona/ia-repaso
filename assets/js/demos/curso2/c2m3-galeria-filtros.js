/* Experimento: la misma imagen con distintos filtros 3x3 (desenfoque, nitidez, bordes, relieve o uno propio). */
Lab.register("curso2/c2m3-galeria-filtros", function (root, api) {
  var S = 32, noise = 0, relu = false, kernel = [[0, 0, 0], [0, 1, 0], [0, 0, 0]], base = [], z = [], img = [], res = null, kInputs = [], sel;
  var F = {
    id: ["Identidad (no cambia nada)", [[0, 0, 0], [0, 1, 0], [0, 0, 0]]],
    media: ["Desenfoque (media 3×3)", [[1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9]]],
    gauss: ["Desenfoque gaussiano", [[1 / 16, 2 / 16, 1 / 16], [2 / 16, 4 / 16, 2 / 16], [1 / 16, 2 / 16, 1 / 16]]],
    nitidez: ["Nitidez (sharpen)", [[0, -1, 0], [-1, 5, -1], [0, -1, 0]]],
    sobelx: ["Borde vertical (Sobel)", [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]]],
    sobely: ["Borde horizontal (Sobel)", [[-1, -2, -1], [0, 0, 0], [1, 2, 1]]],
    lap: ["Todos los bordes (Laplaciano)", [[0, 1, 0], [1, -4, 1], [0, 1, 0]]],
    relieve: ["Relieve (emboss)", [[-2, -1, 0], [-1, 1, 1], [0, 1, 2]]],
    custom: ["Personalizado (edita las cajas)", null]
  };
  function build() {
    var x, y, r = api.rng(3); base = []; z = [];
    for (y = 0; y < S; y++) {
      base.push([]); z.push([]);
      for (x = 0; x < S; x++) {
        var v = 0.2 + 0.08 * x / S;
        if (x >= 4 && x <= 13 && y >= 5 && y <= 14) v = 0.9;
        if (Math.abs(Math.hypot(x - 23, y - 10) - 6) < 1.2) v = 0.85;
        if (x >= 3 && x <= 14 && Math.abs(y - (32 - x)) < 0.8) v = 0.9;
        if ((Math.abs(x - 23) <= 0.8 && Math.abs(y - 24) <= 4) || (Math.abs(y - 24) <= 0.8 && Math.abs(x - 23) <= 4)) v = 0.9;
        base[y].push(v); z[y].push(r.normal(0, 1));
      }
    }
  }
  function mix() {
    img = base.map(function (row, y) { return row.map(function (v, x) { return api.math.clamp(v + noise * z[y][x], 0, 1); }); });
  }
  function conv() {
    var n = S - 2, o = [], i, j, a, b, mn = Infinity, mx = -Infinity;
    for (i = 0; i < n; i++) {
      o.push([]);
      for (j = 0; j < n; j++) {
        var s = 0;
        for (a = 0; a < 3; a++) for (b = 0; b < 3; b++) s += img[i + a][j + b] * kernel[a][b];
        if (relu) s = Math.max(0, s);
        o[i].push(s); mn = Math.min(mn, s); mx = Math.max(mx, s);
      }
    }
    res = { o: o, mn: mn, mx: mx };
  }
  function ksum() { var s = 0; kernel.forEach(function (r) { r.forEach(function (v) { s += v; }); }); return s; }

  var grid = api.el("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,230px),1fr))", gap: "10px" } });
  root.appendChild(grid);
  function cellDiv() { var c = api.el("div", { style: { minWidth: "0" } }); grid.appendChild(c); return c; }
  var vA = api.view(cellDiv(), { aspect: 1, minH: 200, maxH: 420, label: "Imagen original sintética de 32 por 32 píxeles" });
  var vB = api.view(cellDiv(), { aspect: 1, minH: 200, maxH: 420, label: "Imagen resultante tras aplicar el filtro" });
  var ui = api.controls(root), out = api.readout(root);
  sel = ui.select({ label: "Filtro", options: Object.keys(F).map(function (k) { return [k, F[k][0]]; }), value: "sobelx", onChange: function (v) { if (F[v][1]) setK(F[v][1]); update(); } });
  ui.slider({ label: "Ruido en la imagen", min: 0, max: 0.35, step: 0.01, value: 0, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { noise = v; mix(); update(); } });
  ui.toggle({ label: "Aplicar ReLU a la salida", value: false, onChange: function (v) { relu = v; update(); } });

  var kbox = api.el("div", { style: { display: "grid", gridTemplateColumns: "repeat(3,70px)", gap: "4px" } });
  var kwrap = api.el("div", { style: { display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" } },
    api.el("span", { style: { fontSize: ".82rem", fontWeight: "500" }, text: "Valores del filtro:" }), kbox);
  root.insertBefore(kwrap, root.querySelector(".lab-controls"));
  for (var a = 0; a < 3; a++) kInputs.push([]);
  for (a = 0; a < 3; a++) for (var b = 0; b < 3; b++) (function (a, b) {
    var inp = api.el("input", { type: "number", step: "0.1", "aria-label": "Peso fila " + (a + 1) + " columna " + (b + 1),
      style: { width: "70px", padding: ".3rem", font: "inherit", fontFamily: "'IBM Plex Mono',monospace", textAlign: "center", border: "1px solid currentColor", background: "transparent", color: "inherit" } });
    inp.addEventListener("input", function () { var v = parseFloat(inp.value); kernel[a][b] = isFinite(v) ? v : 0; sel.set("custom"); update(); });
    kInputs[a][b] = inp; kbox.appendChild(inp);
  })(a, b);
  function setK(k) { for (var a = 0; a < 3; a++) for (var b = 0; b < 3; b++) { kernel[a][b] = k[a][b]; kInputs[a][b].value = Math.round(k[a][b] * 1000) / 1000; } }

  function gray(v) { var g = Math.round(255 * api.math.clamp(v, 0, 1)); return "rgb(" + g + "," + g + "," + g + ")"; }
  function drawPixels(ctx, w, h, val, off, n) {
    var s = Math.min(w, h) / S, x0 = (w - s * S) / 2, y0 = (h - s * S) / 2, i, j;
    for (i = 0; i < n; i++) for (j = 0; j < n; j++) {
      ctx.fillStyle = gray(val(i, j)); ctx.fillRect(x0 + (j + off) * s, y0 + (i + off) * s, Math.ceil(s) , Math.ceil(s));
    }
    return { s: s, x0: x0, y0: y0 };
  }
  build(); setK(F.sobelx[1]); mix(); conv();
  vA.draw(function (ctx, w, h, C) {
    api.d.rect(ctx, 0, 0, w, h, C.surface);
    drawPixels(ctx, w, h, function (i, j) { return img[i][j]; }, 0, S);
    api.d.rect(ctx, 0, 0, 112, 20, C.surface);
    api.d.text(ctx, "Original (32×32)", 6, 14, { size: 11, weight: 600, color: C.ink2 });
  });
  vB.draw(function (ctx, w, h, C) {
    api.d.rect(ctx, 0, 0, w, h, C.surface);
    if (!res) return;
    var signed = Math.abs(ksum()) < 0.05;
    var amp = Math.max(Math.abs(res.mn), Math.abs(res.mx), 1e-6);
    var f = signed ? function (v) { return relu ? v / amp : 0.5 + 0.5 * v / amp; } : function (v) { return v; };
    drawPixels(ctx, w, h, function (i, j) { return f(res.o[i][j]); }, 1, S - 2);
    api.d.rect(ctx, 0, 0, 128, 20, C.surface);
    api.d.text(ctx, "Resultado (30×30)", 6, 14, { size: 11, weight: 600, color: C.ink2 });
  });
  function update() {
    mix(); conv();
    vA.redraw(); vB.redraw();
    var ks = ksum(), signed = Math.abs(ks) < 0.05;
    var rows = kernel.map(function (r) { return r.map(function (v) { return (Math.round(v * 100) / 100).toString().padStart(5, " "); }).join(" "); }).join("<br>");
    out.set("Filtro 3×3 (valid: la salida es 30×30)<br><span style='white-space:pre'>" + rows.replace(/<br>/g, "\n") + "</span><br>" +
      "Suma de los pesos = <b>" + (Math.round(ks * 100) / 100) + "</b> · salida mínima <b>" + res.mn.toFixed(2) + "</b>, máxima <b>" + res.mx.toFixed(2) + "</b><br>" +
      (signed ? "Suma ≈ 0: en zonas lisas la salida es 0 (se pinta gris medio); solo reaccionan los cambios." : "Suma ≈ " + (Math.abs(ks - 1) < 0.05 ? "1: el brillo medio se conserva." : "distinta de 1: cambia el brillo global."))
      + (relu ? "<br>Con ReLU los valores negativos pasan a 0 (negro)." : ""));
  }
  update();
});
