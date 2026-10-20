/* Experimento: espacio latente de 2 dimensiones de un autoencoder normal y de un VAE, entrenados con los dígitos 8×8 de scikit-learn.
   Se decodifica de verdad (2 → 32 ReLU → 64 sigmoide) con los pesos reales de datos/c3m4-datos.js. */
Lab.register("curso3/c3m4-espacio-latente", function (root, api) {
  var D = api.d, M = api.math;
  function needData(cb) {
    if (window.C3M4) return cb();
    var s = document.createElement("script");
    s.src = (document.body.getAttribute("data-root") || "./") + "assets/js/demos/curso3/c3m4-datos.js";
    s.onload = cb; s.onerror = function () { root.innerHTML = '<p class="demo-error">No se pudieron cargar los datos del experimento.</p>'; };
    document.head.appendChild(s);
  }
  var inst = {};
  needData(function () { init(); });

  function init() {
    var DATA = window.C3M4;
    var S = { model: "vae", z: [0, 0], seed: 21, samples: [], hole: null, nearest: null };
    function decode(z, m) {
      var L = DATA[m].dec, h = [], i, j, o = [];
      for (j = 0; j < L[0].m; j++) { var s = L[0].b[j]; for (i = 0; i < L[0].n; i++) s += z[i] * L[0].W[i * L[0].m + j]; h.push(Math.max(0, s)); }
      for (j = 0; j < L[1].m; j++) { var t = L[1].b[j]; for (i = 0; i < L[1].n; i++) t += h[i] * L[1].W[i * L[1].m + j]; o.push(1 / (1 + Math.exp(-t))); }
      return o;
    }
    function bbox(m) {
      var P = DATA[m].pts, x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      P.forEach(function (p) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
      var px = (x1 - x0) * 0.08, py = (y1 - y0) * 0.08;
      return { xr: [x0 - px, x1 + px], yr: [y0 - py, y1 + py] };
    }
    function spread(m) { var P = DATA[m].pts, xs = P.map(function (p) { return p[0]; }), ys = P.map(function (p) { return p[1]; }); return (M.std(xs) + M.std(ys)) / 2; }
    function nearest(z, m) {
      var P = DATA[m].pts, best = 1e9, k = 0;
      for (var i = 0; i < P.length; i++) { var d = Math.hypot(P[i][0] - z[0], P[i][1] - z[1]); if (d < best) { best = d; k = i; } }
      return { d: best, label: P[k][2] };
    }
    var BB = { vae: bbox("vae"), ae: bbox("ae") }, SP = { vae: spread("vae"), ae: spread("ae") };
    var HOLE = 0.3; // en desviaciones típicas de los códigos

    var wrap = api.el("div", { style: { display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "flex-start" } });
    var left = api.el("div", { style: { flex: "1 1 300px", minWidth: "0" } }), right = api.el("div", { style: { flex: "0 1 170px", minWidth: "140px" } });
    wrap.appendChild(left); wrap.appendChild(right); root.appendChild(wrap);
    var view = api.view(left, { aspect: 1.15, minH: 270, maxH: 420, drag: true, label: "Espacio latente de 2 dimensiones con los dígitos codificados y el punto elegido" });
    var viewImg = api.view(right, { aspect: 1, minH: 140, maxH: 170, label: "Dígito decodificado en el punto elegido" });
    var strip = api.view(root, { aspect: 7, minH: 60, maxH: 90, label: "Diez dígitos generados con puntos al azar" });
    var ui = api.controls(root), out = api.readout(root);
    ui.segmented({ label: "Modelo", value: "vae", options: [["ae", "Autoencoder normal"], ["vae", "VAE"]], onChange: function (v) { S.model = v; S.z = v === "vae" ? [0, 0] : centerOf(v); sample(); update(); } });
    ui.button("Diez puntos al azar", function () { sample(); update(); }, "primary");
    function centerOf(m) { var b = BB[m]; return [(b.xr[0] + b.xr[1]) / 2, (b.yr[0] + b.yr[1]) / 2]; }
    S.z = [0, 0];
    function sample() {
      var r = api.rng(S.seed++), b = BB[S.model], i; S.samples = [];
      for (i = 0; i < 10; i++) {
        S.samples.push(S.model === "vae" ? [r.normal(0, 1), r.normal(0, 1)] : [r.range(b.xr[0], b.xr[1]), r.range(b.yr[0], b.yr[1])]);
      }
    }
    sample();
    var pl = api.plot(view, { xr: [-3, 3], yr: [-3, 3], pad: { l: 34, r: 8, t: 8, b: 26 }, xticks: 4, yticks: 4, grid: false, xlabel: "z₁", ylabel: "z₂",
      xfmt: function (t) { return Math.round(t * 10) / 10; }, yfmt: function (t) { return Math.round(t * 10) / 10; } });
    function hexToRgb(h) { h = String(h).trim(); if (h.charAt(0) === "#") { if (h.length === 4) h = "#" + h[1] + h[1] + h[2] + h[2] + h[3] + h[3]; return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; } var m = h.match(/\d+(\.\d+)?/g); return m ? [+m[0], +m[1], +m[2]] : [128, 128, 128]; }
    function mix(a, b, t) { var x = hexToRgb(a), y = hexToRgb(b); return "rgb(" + Math.round(x[0] + (y[0] - x[0]) * t) + "," + Math.round(x[1] + (y[1] - x[1]) * t) + "," + Math.round(x[2] + (y[2] - x[2]) * t) + ")"; }
    function pal(C) { return [C.cobalto, C.terracota, C.oliva, C.cobaltoInk, mix(C.cobalto, C.terracota, 0.5), mix(C.oliva, C.ink, 0.35), mix(C.terracota, C.marker, 0.5), mix(C.cobalto, C.oliva, 0.5), mix(C.terracota, C.ink, 0.5), mix(C.oliva, C.cobalto, 0.8)]; }
    function drawImg(ctx, img, x, y, size, C) {
      var c = size / 8, i;
      D.rect(ctx, x, y, size, size, C.surface, C.ink, 1.5);
      for (i = 0; i < 64; i++) { ctx.save(); ctx.globalAlpha = img[i]; ctx.fillStyle = C.ink; ctx.fillRect(x + (i % 8) * c, y + Math.floor(i / 8) * c, c + 0.4, c + 0.4); ctx.restore(); }
    }
    function draw(ctx, w, h, C) {
      var b = BB[S.model]; pl.xr = b.xr; pl.yr = b.yr;
      pl.axes(ctx);
      var bx = pl.box, P = DATA[S.model].pts, i, j, NG = 34, P10 = pal(C), sp = SP[S.model];
      // huecos: celdas lejos de cualquier código
      ctx.save(); pl.clip(ctx);
      var cw = bx.w / NG, ch = bx.h / NG;
      for (i = 0; i < NG; i++) for (j = 0; j < NG; j++) {
        var zx = pl.ix(bx.x + (i + 0.5) * cw), zy = pl.iy(bx.y + (j + 0.5) * ch), n = nearest([zx, zy], S.model);
        if (n.d > HOLE * sp) { ctx.globalAlpha = 0.16; ctx.fillStyle = C.terracota; ctx.fillRect(bx.x + i * cw, bx.y + j * ch, cw + 0.5, ch + 0.5); }
      }
      ctx.restore();
      ctx.save(); pl.clip(ctx);
      for (i = 0; i < P.length; i++) {
        ctx.globalAlpha = 0.85;
        D.text(ctx, String(P[i][2]), pl.x(P[i][0]), pl.y(P[i][1]) + 4, { size: 11, weight: 700, mono: true, align: "center", color: P10[P[i][2]] });
      }
      ctx.globalAlpha = 1;
      S.samples.forEach(function (s, k) { D.circle(ctx, pl.x(s[0]), pl.y(s[1]), 3.6, null, C.ink, 1.4); });
      ctx.restore();
      var px = pl.x(S.z[0]), py = pl.y(S.z[1]);
      D.circle(ctx, px, py, 8, null, C.paper, 4.5); D.circle(ctx, px, py, 8, null, C.ink, 2.2); D.circle(ctx, px, py, 2.2, C.ink);
      D.text(ctx, "cada cifra = un dígito codificado · zona rosada = hueco", bx.x + 4, bx.y + bx.h - 6, { size: 10, color: C.muted });
    }
    function drawImgView(ctx, w, h, C) { drawImg(ctx, decode(S.z, S.model), 4, 4, Math.min(w, h) - 8, C); }
    function drawStrip(ctx, w, h, C) {
      var n = S.samples.length, g = 6, size = Math.min(h - 6, (w - g * (n + 1)) / n), x0 = (w - (size * n + g * (n - 1))) / 2;
      S.samples.forEach(function (s, k) { drawImg(ctx, decode(s, S.model), x0 + k * (size + g), (h - size) / 2, size, C); });
    }
    function setZ(px, py) {
      var b = pl.box; if (px < b.x - 6 || px > b.x + b.w + 6 || py < b.y - 6 || py > b.y + b.h + 6) return;
      S.z = [M.clamp(pl.ix(px), pl.xr[0], pl.xr[1]), M.clamp(pl.iy(py), pl.yr[0], pl.yr[1])]; update();
    }
    view.pointer({ down: setZ, drag: setZ });
    function f(v) { return v.toFixed(2).replace("-", "−"); }
    function update() {
      var n = nearest(S.z, S.model), rel = n.d / SP[S.model];
      var hole = rel > HOLE;
      var ns = S.samples.map(function (s) { return nearest(s, S.model).d / SP[S.model]; });
      var nh = ns.filter(function (v) { return v > HOLE; }).length;
      out.set("<b>z = (" + f(S.z[0]) + ", " + f(S.z[1]) + ")</b> · dígito codificado más cercano: un <b>" + n.label + "</b> a " + rel.toFixed(2) + " desviaciones " +
        (hole ? "<span class='bad'>(estás en un hueco: el decodificador nunca vio nada parecido)</span>" : "<span class='good'>(zona poblada)</span>") + "<br>" +
        "<b>Los 10 puntos al azar</b> (círculos): " + (S.model === "vae" ? "sacados de N(0, I), la distribución que el VAE aprendió a respetar" : "sacados uniformes en la caja del gráfico, porque el autoencoder no dice dónde cae su código") +
        " → <b>" + nh + " de 10</b> caen en un hueco.<br>Rango de z₁: " + f(DATA[S.model].pts.reduce(function (a, p) { return Math.min(a, p[0]); }, 1e9)) + " a " + f(DATA[S.model].pts.reduce(function (a, p) { return Math.max(a, p[0]); }, -1e9)) + ".");
      view.redraw(); viewImg.redraw(); strip.redraw();
    }
    view.draw(draw); viewImg.draw(drawImgView); strip.draw(drawStrip); update();
  }
  return inst;
});
