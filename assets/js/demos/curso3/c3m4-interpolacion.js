/* Experimento: interpolar entre dos dígitos en el espacio latente (se decodifica cada punto del camino) frente a mezclar píxeles (cross-fade).
   Pesos reales de un VAE y de un autoencoder de 2 dimensiones latentes (datos/c3m4-datos.js). */
Lab.register("curso3/c3m4-interpolacion", function (root, api) {
  var D = api.d, M = api.math;
  function needData(cb) {
    if (window.C3M4) return cb();
    var s = document.createElement("script");
    s.src = (document.body.getAttribute("data-root") || "./") + "assets/js/demos/curso3/c3m4-datos.js";
    s.onload = cb; s.onerror = function () { root.innerHTML = '<p class="demo-error">No se pudieron cargar los datos del experimento.</p>'; };
    document.head.appendChild(s);
  }
  needData(init);
  function init() {
    var DATA = window.C3M4, S = { model: "vae", a: 1, b: 3, k: 4 }, NS = 9;
    function decode(z, m) {
      var L = DATA[m].dec, h = [], i, j, o = [];
      for (j = 0; j < L[0].m; j++) { var s = L[0].b[j]; for (i = 0; i < L[0].n; i++) s += z[i] * L[0].W[i * L[0].m + j]; h.push(Math.max(0, s)); }
      for (j = 0; j < L[1].m; j++) { var t = L[1].b[j]; for (i = 0; i < L[1].n; i++) t += h[i] * L[1].W[i * L[1].m + j]; o.push(1 / (1 + Math.exp(-t))); }
      return o;
    }
    var viewMap = api.view(root, { aspect: 1.9, minH: 190, maxH: 300, label: "Camino recto entre los códigos de dos dígitos en el espacio latente" });
    var viewStrip = api.view(root, { aspect: 2.1, minH: 200, maxH: 330, label: "Fila superior: interpolación latente. Fila inferior: mezcla de píxeles." });
    var ui = api.controls(root), out = api.readout(root);
    var opts = []; for (var c = 0; c < 10; c++) opts.push([c, "un " + c]);
    ui.select({ label: "Dígito A", options: opts, value: S.a, onChange: function (v) { S.a = +v; update(); } });
    ui.select({ label: "Dígito B", options: opts, value: S.b, onChange: function (v) { S.b = +v; update(); } });
    ui.segmented({ label: "Modelo", value: "vae", options: [["vae", "VAE"], ["ae", "Autoencoder normal"]], onChange: function (v) { S.model = v; update(); } });
    var sk = ui.slider({ label: "Posición en el camino (0 = A, 8 = B)", min: 0, max: NS - 1, step: 1, value: S.k, fmt: function (v) { return v + " / " + (NS - 1); }, onInput: function (v) { S.k = v; update(); } });
    function code(d) { return DATA.ex[d][S.model === "vae" ? "zv" : "za"]; }
    function zAt(k) { var A = code(S.a), B = code(S.b), t = k / (NS - 1); return [(1 - t) * A[0] + t * B[0], (1 - t) * A[1] + t * B[1]]; }
    function drawImg(ctx, img, x, y, size, C, hot) {
      var c = size / 8, i;
      D.rect(ctx, x, y, size, size, C.surface, hot ? C.terracota : C.ink, hot ? 3 : 1.2);
      for (i = 0; i < 64; i++) { ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, img[i])); ctx.fillStyle = C.ink; ctx.fillRect(x + (i % 8) * c, y + Math.floor(i / 8) * c, c + 0.4, c + 0.4); ctx.restore(); }
    }
    function drawMap(ctx, w, h, C) {
      var P = DATA[S.model].pts, x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      P.forEach(function (p) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
      var A = code(S.a), B = code(S.b); x0 = Math.min(x0, A[0], B[0]); x1 = Math.max(x1, A[0], B[0]); y0 = Math.min(y0, A[1], B[1]); y1 = Math.max(y1, A[1], B[1]);
      var pad = { l: 12, r: 12, t: 10, b: 10 }, pw = w - pad.l - pad.r, ph = h - pad.t - pad.b;
      function X(v) { return pad.l + (v - x0) / (x1 - x0) * pw; } function Y(v) { return pad.t + ph - (v - y0) / (y1 - y0) * ph; }
      D.rect(ctx, pad.l, pad.t, pw, ph, C.surface, C.ink, 1.5);
      P.forEach(function (p) { ctx.save(); ctx.globalAlpha = 0.35; D.circle(ctx, X(p[0]), Y(p[1]), 2.2, C.muted); ctx.restore(); });
      D.line(ctx, X(A[0]), Y(A[1]), X(B[0]), Y(B[1]), C.terracota, 2, [6, 4]);
      for (var k = 0; k < NS; k++) { var z = zAt(k); D.circle(ctx, X(z[0]), Y(z[1]), k === S.k ? 6.5 : 3.6, k === S.k ? C.terracota : C.paper, C.terracotaInk, k === S.k ? 2.5 : 1.5); }
      D.circle(ctx, X(A[0]), Y(A[1]), 7, C.cobalto, C.paper, 2); D.circle(ctx, X(B[0]), Y(B[1]), 7, C.oliva, C.paper, 2);
      D.text(ctx, "A = " + S.a, X(A[0]) + (X(A[0]) > w * 0.5 ? -12 : 12), Y(A[1]) + (Y(A[1]) > h * 0.5 ? -10 : 18), { size: 12, weight: 700, color: C.cobaltoInk, align: X(A[0]) > w * 0.5 ? "right" : "left" });
      D.text(ctx, "B = " + S.b, X(B[0]) + (X(B[0]) > w * 0.5 ? -12 : 12), Y(B[1]) + (Y(B[1]) > h * 0.5 ? -10 : 18), { size: 12, weight: 700, color: C.olivaInk, align: X(B[0]) > w * 0.5 ? "right" : "left" });
      D.text(ctx, "puntos grises = 300 dígitos codificados", pad.l + 6, pad.t + 14, { size: 10, color: C.muted });
    }
    function drawStrip(ctx, w, h, C) {
      var g = 4, lab = 14, rowH = (h - 2 * lab - 12) / 2, size = Math.min(rowH, (w - g * (NS + 1)) / NS), x0 = (w - (size * NS + g * (NS - 1))) / 2, k;
      var zA = code(S.a), imgA = DATA.ex[S.a].img, imgB = DATA.ex[S.b].img;
      D.text(ctx, "Camino en el espacio latente → se decodifica cada punto", x0, lab - 3, { size: 11, weight: 600, color: C.terracotaInk });
      D.text(ctx, "Mezcla de píxeles: (1 − t)·A + t·B", x0, lab + size + 24, { size: 11, weight: 600, color: C.cobaltoInk });
      for (k = 0; k < NS; k++) {
        var t = k / (NS - 1), xx = x0 + k * (size + g);
        drawImg(ctx, decode(zAt(k), S.model), xx, lab + 2, size, C, k === S.k);
        var mix = imgA.map(function (v, i) { return ((1 - t) * v + t * imgB[i]) / 16; });
        drawImg(ctx, mix, xx, lab + size + 32, size, C, k === S.k);
      }
    }
    function f(v) { return v.toFixed(2).replace("-", "−"); }
    function update() {
      var A = code(S.a), B = code(S.b), z = zAt(S.k), t = S.k / (NS - 1);
      out.set("<b>t = " + t.toFixed(2) + "</b> · z(t) = (1 − t)·z<sub>A</sub> + t·z<sub>B</sub> = (1 − " + t.toFixed(2) + ")·(" + f(A[0]) + ", " + f(A[1]) + ") + " + t.toFixed(2) + "·(" + f(B[0]) + ", " + f(B[1]) + ") = <b>(" + f(z[0]) + ", " + f(z[1]) + ")</b><br>" +
        "Distancia latente entre A y B: " + Math.hypot(A[0] - B[0], A[1] - B[1]).toFixed(2) + ". " +
        (S.model === "vae" ? "En el VAE los códigos viven en una zona compacta: todo el camino pasa por sitios que el decodificador conoce." :
          "En el autoencoder normal los códigos están muy dispersos: el camino puede cruzar huecos donde el decodificador improvisa."));
      viewMap.redraw(); viewStrip.redraw();
    }
    viewMap.draw(drawMap); viewStrip.draw(drawStrip); update();
  }
});
