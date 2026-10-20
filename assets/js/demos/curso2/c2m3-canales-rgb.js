/* Experimento: una imagen en color son tres matrices (rojo, verde, azul) de números 0-255. */
Lab.register("curso2/c2m3-canales-rgb", function (root, api) {
  var S = 24, k = [1, 1, 1], gris = false, sel = { i: 13, j: 8 }, img = [], names = ["Rojo (R)", "Verde (G)", "Azul (B)"];
  function build() {
    var i, j;
    for (i = 0; i < S; i++) {
      img.push([]);
      for (j = 0; j < S; j++) {
        var c = [110 + i * 3, 170 + i * 2, 235];
        if (Math.hypot(j - 19, i - 4) < 3) c = [255, 220, 40];
        if (i >= 17) c = [60, 150 + ((j * 7 + i * 3) % 20), 70];
        if (i >= 7 && i <= 10 && j >= 8.5 - (i - 6) * 1.2 && j <= 8.5 + (i - 6) * 1.2 + 1) c = [110, 50, 40];
        if (i >= 11 && i <= 17 && j >= 5 && j <= 12) c = [200, 60, 50];
        if (i >= 12 && i <= 13 && j >= 6 && j <= 7) c = [255, 255, 255];
        if (i >= 14 && i <= 17 && j >= 9 && j <= 10) c = [250, 230, 200];
        img[i].push(c);
      }
    }
  }
  var grid = api.el("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,135px),1fr))", gap: "8px", alignItems: "start" } });
  root.appendChild(grid);
  function cellDiv() { var c = api.el("div", { style: { minWidth: "0" } }); grid.appendChild(c); return c; }
  var vs = [0, 1, 2, 3].map(function (n) { return api.view(cellDiv(), { aspect: 1, minH: 120, maxH: 300, drag: true, label: n === 0 ? "Fotograma compuesto con los tres canales" : "Canal " + names[n - 1] }); });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Intensidad del canal rojo", min: 0, max: 100, step: 5, value: 100, fmt: function (v) { return v + " %"; }, onInput: function (v) { k[0] = v / 100; update(); } });
  ui.slider({ label: "Intensidad del canal verde", min: 0, max: 100, step: 5, value: 100, fmt: function (v) { return v + " %"; }, onInput: function (v) { k[1] = v / 100; update(); } });
  ui.slider({ label: "Intensidad del canal azul", min: 0, max: 100, step: 5, value: 100, fmt: function (v) { return v + " %"; }, onInput: function (v) { k[2] = v / 100; update(); } });
  ui.segmented({ label: "Canales como…", options: [[false, "color"], [true, "niveles de gris"]], value: false, onChange: function (v) { gris = v; update(); } });

  function rgb(a, b, c) { return "rgb(" + Math.round(a) + "," + Math.round(b) + "," + Math.round(c) + ")"; }
  function geom(v, top) { var s = Math.min(v.w / S, (v.h - top) / S); return { s: s, x0: (v.w - s * S) / 2, y0: top }; }
  build();
  vs.forEach(function (v, n) {
    v.draw(function (ctx, w, h, C) {
      var g = geom(v, 18), i, j;
      api.d.text(ctx, n === 0 ? "Fotograma 24×24×3" : names[n - 1], w / 2, 13, { size: 11, weight: 600, align: "center", color: C.ink2 });
      for (i = 0; i < S; i++) for (j = 0; j < S; j++) {
        var c = img[i][j], col;
        if (n === 0) col = rgb(c[0] * k[0], c[1] * k[1], c[2] * k[2]);
        else if (gris) { var q = c[n - 1] * k[n - 1]; col = rgb(q, q, q); }
        else col = rgb(n === 1 ? c[0] * k[0] : 0, n === 2 ? c[1] * k[1] : 0, n === 3 ? c[2] * k[2] : 0);
        ctx.fillStyle = col; ctx.fillRect(g.x0 + j * g.s, g.y0 + i * g.s, Math.ceil(g.s), Math.ceil(g.s));
      }
      api.d.rect(ctx, g.x0 + sel.j * g.s - 1, g.y0 + sel.i * g.s - 1, g.s + 2, g.s + 2, null, C.paper, 3);
      api.d.rect(ctx, g.x0 + sel.j * g.s - 1, g.y0 + sel.i * g.s - 1, g.s + 2, g.s + 2, null, C.ink, 1.2);
    });
    function pick(px, py) {
      var g = geom(v, 18), j = Math.floor((px - g.x0) / g.s), i = Math.floor((py - g.y0) / g.s);
      if (i >= 0 && i < S && j >= 0 && j < S) { sel.i = i; sel.j = j; update(); }
    }
    v.pointer({ down: pick, drag: pick });
  });
  function update() {
    vs.forEach(function (v) { v.redraw(); });
    var c = img[sel.i][sel.j], m = [c[0] * k[0], c[1] * k[1], c[2] * k[2]].map(Math.round);
    var g = Math.round(0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]);
    out.set("Píxel (fila <b>" + sel.i + "</b>, columna <b>" + sel.j + "</b>) = vector [R, G, B] = <b>[" + c.join(", ") + "]</b>" +
      (k[0] < 1 || k[1] < 1 || k[2] < 1 ? " → con tus controles: <b>[" + m.join(", ") + "]</b>" : "") + "<br>" +
      "Forma del tensor: <b>(24, 24, 3)</b> → 24 × 24 × 3 = <b>1728</b> números · en gris sería (24, 24, 1): 576 números<br>" +
      "Gris equivalente de ese píxel (0,299·R + 0,587·G + 0,114·B) = <b>" + g + "</b>");
  }
  update();
});
