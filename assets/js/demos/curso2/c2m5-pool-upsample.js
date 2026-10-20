/* Experimento: MaxPooling2D seguido de UpSampling2D: el tamaño vuelve, los detalles no. */
Lab.register("curso2/c2m5-pool-upsample", function (root, api) {
  var N = 6, M = N / 2, PRE = {
    alineado: ["Recuadro alineado a bloques 2×2", [[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,9,9,9,9],[0,0,9,9,9,9],[0,0,9,9,9,9],[0,0,9,9,9,9]]],
    movido: ["Mismo recuadro, corrido 1 píxel", [[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,9,9,9],[0,0,9,9,9,9],[0,0,9,9,9,9],[0,0,9,9,9,9]]],
    ruido: ["Grano de película (textura fina)", [[9,0,9,0,9,0],[0,9,0,9,0,9],[9,0,9,0,9,0],[0,9,0,9,0,9],[9,0,9,0,9,0],[0,9,0,9,0,9]]],
    linea: ["Subtítulo: línea fina de 1 píxel", [[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[9,9,9,9,9,9],[0,0,0,0,0,0],[0,0,0,0,0,0]]]
  };
  var img, mode = "max", wrap = api.el("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,150px),1fr))", gap: "10px", alignItems: "start" } });
  root.appendChild(wrap);
  function cell() { var c = api.el("div", { style: { minWidth: "0" } }); wrap.appendChild(c); return c; }
  var vA = api.view(cell(), { aspect: 1, minH: 140, maxH: 300, label: "Carátula original 6×6" });
  var vB = api.view(cell(), { aspect: 1, minH: 140, maxH: 300, label: "Tras el pooling 3×3" });
  var vC = api.view(cell(), { aspect: 1, minH: 140, maxH: 300, label: "Tras UpSampling2D 6×6" });
  var ui = api.controls(root), out = api.readout(root);
  function load(k) { img = PRE[k][1].map(function (r) { return r.slice(); }); }
  load("alineado");
  ui.select({ label: "Carátula de prueba", options: Object.keys(PRE).map(function (k) { return [k, PRE[k][0]]; }), value: "alineado", onChange: function (v) { load(v); update(); } });
  ui.segmented({ label: "Pooling", options: [["max", "máximo"], ["avg", "media"]], value: mode, onChange: function (v) { mode = v; update(); } });
  function pooled() {
    var o = [], i, j;
    for (i = 0; i < M; i++) { o.push([]); for (j = 0; j < M; j++) { var a = [img[2*i][2*j], img[2*i][2*j+1], img[2*i+1][2*j], img[2*i+1][2*j+1]]; o[i].push(mode === "max" ? Math.max.apply(null, a) : (a[0]+a[1]+a[2]+a[3]) / 4); } }
    return o;
  }
  function upsampled(p) { var o = [], i, j; for (i = 0; i < N; i++) { o.push([]); for (j = 0; j < N; j++) o[i].push(p[i >> 1][j >> 1]); } return o; }
  function fmt(x) { return Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : (Math.round(x * 100) / 100).toString().replace(".", ","); }
  function gray(v) { var g = Math.round(255 * Math.max(0, Math.min(9, v)) / 9); return "rgb(" + g + "," + g + "," + g + ")"; }
  function grid(v, title, get, c, diffFrom) {
    v.draw(function (ctx, w, h, C) {
      var s = Math.min((w - 12) / c, (h - 26) / c), x0 = (w - s * c) / 2, y0 = 22, i, j;
      api.d.text(ctx, title, w / 2, 14, { size: 11, weight: 600, align: "center", color: C.ink2 });
      for (i = 0; i < c; i++) for (j = 0; j < c; j++) {
        var val = get(i, j);
        api.d.rect(ctx, x0 + j * s, y0 + i * s, s, s, gray(val), diffFrom && Math.abs(val - diffFrom(i, j)) > 1e-9 ? C.terracota : C.line, diffFrom && Math.abs(val - diffFrom(i, j)) > 1e-9 ? 2.5 : 1);
        api.d.text(ctx, fmt(val), x0 + (j + .5) * s, y0 + (i + .5) * s + 4, { size: Math.min(13, s * 0.38), align: "center", mono: true, color: val > 4 ? gray(0) : gray(9) });
      }
    });
  }
  var P = pooled(), U = upsampled(P);
  vA.pointer({ down: function (px, py) {
    var s = Math.min((vA.w - 12) / N, (vA.h - 26) / N), x0 = (vA.w - s * N) / 2, j = Math.floor((px - x0) / s), i = Math.floor((py - 22) / s);
    if (i >= 0 && i < N && j >= 0 && j < N) { img[i][j] = img[i][j] >= 9 ? 0 : (img[i][j] === 0 ? 9 : 0); update(); }
  } });
  vA.canvas.classList.remove("no-cursor"); vA.canvas.style.cursor = "pointer";
  grid(vA, "Carátula 6×6 (toca para cambiar)", function (i, j) { return img[i][j]; }, N);
  grid(vB, "Tras el pooling 3×3", function (i, j) { return P[i][j]; }, M);
  grid(vC, "Tras UpSampling2D 6×6", function (i, j) { return U[i][j]; }, N, function (i, j) { return img[i][j]; });
  function update() {
    P = pooled(); U = upsampled(P);
    var i, j, same = 0, e = 0;
    for (i = 0; i < N; i++) for (j = 0; j < N; j++) { if (Math.abs(U[i][j] - img[i][j]) < 1e-9) same++; e += Math.pow((U[i][j] - img[i][j]) / 9, 2); }
    e /= N * N;
    vA.redraw(); vB.redraw(); vC.redraw();
    out.set("Valores: 36 → 9 → 36 · casillas idénticas al original: <b>" + same + "</b> de 36 (las que cambian llevan borde naranja) · error cuadrático medio (con valores entre 0 y 1): <span class='" + (e < 1e-9 ? "good" : "bad") + "'><b>" + e.toFixed(3).replace(".", ",") + "</b></span><br>" +
      "<code>UpSampling2D(2)</code> repite cada valor en un bloque 2×2: recupera el <em>tamaño</em>, pero no el detalle que el pooling resumió.");
  }
  update();
});
