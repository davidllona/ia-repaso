/* Experimento: SVM. Margen, vectores de soporte, parámetro C, kernel lineal y RBF.
   El solucionador es un SMO simplificado (el algoritmo de la guía CS229): suficiente para ver el
   comportamiento, pero no tan preciso ni tan rápido como el de scikit-learn (libsvm). */
Lab.register("curso1/c1m3-svm", function (root, api) {
  var D = api.d, M = api.math;
  var data = "sep", kernel = "lin", logC = 0, logG = -0.3, outlier = false, pts = [], model = null, XR = [0, 10], YR = [0, 10];

  function blobs(sd, gap, seedv) {
    var r = api.rng(seedv), out = [], c, p, tries;
    for (c = -1; c <= 1; c += 2) {
      var n = 0;
      while (n < 16) {
        var x = M.clamp(r.normal(c < 0 ? 3.2 : 6.8, sd), 0.3, 9.7), y = M.clamp(r.normal(c < 0 ? 3.4 : 6.6, sd), 0.3, 9.7);
        if (gap && Math.abs((x + y - 10) / Math.SQRT2) < gap) continue;
        out.push([x, y, c]); n++;
      }
    }
    return out;
  }
  function moons(seedv) {
    var r = api.rng(seedv), out = [], i, t;
    for (i = 0; i < 36; i++) {
      var c = i % 2 ? 1 : -1; t = r.range(0, Math.PI);
      var x = c < 0 ? Math.cos(t) : 1 - Math.cos(t), y = c < 0 ? Math.sin(t) : 0.5 - Math.sin(t);
      x += r.normal(0, 0.1); y += r.normal(0, 0.1);
      out.push([M.clamp(0.9 + (x + 1.1) * 2.6, 0.3, 9.7), M.clamp(1.6 + (y + 0.6) * 4.2, 0.3, 9.7), c]);
    }
    return out;
  }
  function circles(seedv) {
    var r = api.rng(seedv), out = [], i;
    for (i = 0; i < 36; i++) {
      var c = i % 2 ? 1 : -1, t = r.range(0, 2 * Math.PI), rad = (c > 0 ? 1.3 : 3.5) + r.normal(0, 0.3);
      out.push([M.clamp(5 + rad * Math.cos(t), 0.3, 9.7), M.clamp(5 + rad * Math.sin(t), 0.3, 9.7), c]);
    }
    return out;
  }
  function makeData() {
    var base = data === "sep" ? blobs(0.9, 0.9, 4) : data === "over" ? blobs(1.7, 0, 6) : data === "moons" ? moons(12) : circles(5);
    if (outlier) base = base.concat([[3.4, 3.9, 1]]);
    pts = base;
  }
  function kfun(a, b) {
    if (kernel === "lin") return a[0] * b[0] + a[1] * b[1];
    var dx = a[0] - b[0], dy = a[1] - b[1];
    return Math.exp(-Math.pow(10, logG) * (dx * dx + dy * dy));
  }
  /* SMO simplificado: recorre los puntos que violan las condiciones KKT y optimiza parejas (i, j) */
  function train() {
    var n = pts.length, C = Math.pow(10, logC), K = [], i, j;
    for (i = 0; i < n; i++) { K.push([]); for (j = 0; j < n; j++) K[i].push(kfun(pts[i], pts[j])); }
    var al = new Array(n).fill(0), b = 0, tol = 1e-3, loops = 0;
    function f(k) { var s = b; for (var m = 0; m < n; m++) if (al[m] > 0) s += al[m] * pts[m][2] * K[m][k]; return s; }
    function step(i, j) {
      var yi = pts[i][2], yj = pts[j][2], Ei = f(i) - yi, Ej = f(j) - yj, ai = al[i], aj = al[j], L, H;
      if (yi !== yj) { L = Math.max(0, aj - ai); H = Math.min(C, C + aj - ai); } else { L = Math.max(0, ai + aj - C); H = Math.min(C, ai + aj); }
      if (L >= H) return false;
      var eta = 2 * K[i][j] - K[i][i] - K[j][j]; if (eta >= -1e-12) return false;
      var ajn = M.clamp(aj - yj * (Ei - Ej) / eta, L, H);
      if (Math.abs(ajn - aj) < 1e-7) return false;
      var ain = ai + yi * yj * (aj - ajn);
      var b1 = b - Ei - yi * (ain - ai) * K[i][i] - yj * (ajn - aj) * K[i][j];
      var b2 = b - Ej - yi * (ain - ai) * K[i][j] - yj * (ajn - aj) * K[j][j];
      b = (ain > 1e-9 && ain < C - 1e-9) ? b1 : ((ajn > 1e-9 && ajn < C - 1e-9) ? b2 : (b1 + b2) / 2);
      al[i] = ain; al[j] = ajn; return true;
    }
    var moved = true;
    while (moved && loops < 400) {
      moved = false; loops++;
      for (i = 0; i < n; i++) {
        var yi = pts[i][2], Ei = f(i) - yi;
        if ((yi * Ei < -tol && al[i] < C) || (yi * Ei > tol && al[i] > 0)) {
          var cand = [];
          for (j = 0; j < n; j++) if (j !== i) cand.push([Math.abs(Ei - (f(j) - pts[j][2])), j]);
          cand.sort(function (u, v) { return v[0] - u[0]; });
          for (var c = 0; c < cand.length; c++) if (step(i, cand[c][1])) { moved = true; break; }
        }
      }
    }
    var sv = [], viol = 0, ok = 0, w = [0, 0];
    for (i = 0; i < n; i++) {
      if (al[i] > 1e-4) { sv.push(i); w[0] += al[i] * pts[i][2] * pts[i][0]; w[1] += al[i] * pts[i][2] * pts[i][1]; }
      var fv = f(i); if (pts[i][2] * fv < 1 - 1e-2) viol++; if (pts[i][2] * fv > 0) ok++;
    }
    model = { al: al, b: b, sv: sv, w: w, viol: viol, acc: ok / n, C: C, fn: function (x, y) { var s = b, p = [x, y]; for (var m = 0; m < sv.length; m++) s += al[sv[m]] * pts[sv[m]][2] * kfun(pts[sv[m]], p); return s; } };
  }

  var view = api.view(root, { aspect: 1.35, minH: 290, label: "Películas infantiles y thrillers según su nivel de violencia y de suspense, la frontera de una SVM, su margen y los vectores de soporte con un aro" });
  var plot = api.plot(view, { xr: XR, yr: YR, xticks: 5, yticks: 5, grid: false, xlabel: "nivel de violencia →", ylabel: "nivel de suspense →", pad: { l: 26, r: 10, t: 10, b: 36 }, xfmt: function () { return ""; }, yfmt: function () { return ""; } });
  var ui = api.controls(root), out = api.readout(root), sG;
  ui.select({ label: "Datos", options: [["sep", "Separables"], ["over", "Solapados"], ["moons", "Lunas"], ["circ", "Círculos"]], value: data, onChange: function (v) { data = v; update(true); } });
  ui.segmented({ label: "Kernel", options: [["lin", "Lineal"], ["rbf", "RBF (gaussiano)"]], value: kernel, onChange: function (v) { kernel = v; update(); } });
  ui.slider({ label: "C (penalización por violar el margen)", min: -2, max: 2, step: 0.25, value: logC, fmt: function (v) { return String(+Math.pow(10, v).toPrecision(2)); }, onInput: function (v) { logC = v; update(); } });
  sG = ui.slider({ label: "γ (alcance del kernel RBF)", min: -1.5, max: 0.8, step: 0.1, value: logG, fmt: function (v) { return String(+Math.pow(10, v).toPrecision(2)); }, onInput: function (v) { logG = v; update(); } });
  ui.toggle({ label: "Añadir un thriller atípico (naranja) dentro de la zona de infantiles", value: outlier, onChange: function (v) { outlier = v; update(true); } });
  api.legend(root, [[api.colors().cobalto, "infantiles (−1)"], [api.colors().terracota, "thrillers (+1)"], [api.colors().ink, "aro = vector de soporte"]]);

  function draw(ctx, w, h, C) {
    plot.axes(ctx);
    var b = plot.box, nx = Math.max(30, Math.round(b.w / 6)), ny = Math.max(24, Math.round(b.h / 6)), i, j, F = [];
    for (i = 0; i <= nx; i++) { F.push([]); for (j = 0; j <= ny; j++) F[i].push(model.fn(plot.ix(b.x + b.w * i / nx), plot.iy(b.y + b.h * j / ny))); }
    var cw = b.w / nx, ch = b.h / ny;
    ctx.save(); plot.clip(ctx);
    for (i = 0; i < nx; i++) for (j = 0; j < ny; j++) {
      var v = (F[i][j] + F[i + 1][j] + F[i][j + 1] + F[i + 1][j + 1]) / 4;
      ctx.fillStyle = v > 0 ? C.terracotaWash : C.cobaltoWash; ctx.fillRect(b.x + i * cw, b.y + j * ch, cw + 0.6, ch + 0.6);
    }
    function contour(level, color, width, dash) {
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash || []); ctx.beginPath();
      for (var a = 0; a < nx; a++) for (var c = 0; c < ny; c++) {
        var x0 = b.x + a * cw, y0 = b.y + c * ch, v00 = F[a][c] - level, v10 = F[a + 1][c] - level, v01 = F[a][c + 1] - level, v11 = F[a + 1][c + 1] - level, pp = [];
        if ((v00 > 0) !== (v10 > 0)) pp.push([x0 + cw * v00 / (v00 - v10), y0]);
        if ((v10 > 0) !== (v11 > 0)) pp.push([x0 + cw, y0 + ch * v10 / (v10 - v11)]);
        if ((v01 > 0) !== (v11 > 0)) pp.push([x0 + cw * v01 / (v01 - v11), y0 + ch]);
        if ((v00 > 0) !== (v01 > 0)) pp.push([x0, y0 + ch * v00 / (v00 - v01)]);
        for (var q = 0; q + 1 < pp.length; q += 2) { ctx.moveTo(pp[q][0], pp[q][1]); ctx.lineTo(pp[q + 1][0], pp[q + 1][1]); }
      }
      ctx.stroke(); ctx.restore();
    }
    contour(1, C.ink, 1.3, [5, 4]); contour(-1, C.ink, 1.3, [5, 4]); contour(0, C.ink, 2.8);
    var isSv = {}; model.sv.forEach(function (k) { isSv[k] = 1; });
    pts.forEach(function (p, k) {
      if (isSv[k]) D.circle(ctx, plot.x(p[0]), plot.y(p[1]), 10, null, C.ink, 2.2);
      D.circle(ctx, plot.x(p[0]), plot.y(p[1]), 5.2, p[2] > 0 ? C.terracota : C.cobalto, C.paper, 1.4);
    });
    ctx.restore();
    D.rect(ctx, b.x, b.y, b.w, b.h, null, C.ink, 1.5);
  }
  function update(rebuild) {
    if (rebuild) makeData();
    sG.input.disabled = kernel !== "rbf";
    train(); view.redraw();
    var m = model, txt = "Kernel <b>" + (kernel === "lin" ? "lineal" : "RBF, γ = " + String(+Math.pow(10, logG).toPrecision(2))) + "</b> · C = <b>" + String(+m.C.toPrecision(2)) + "</b> · <b>" + m.sv.length + "</b> vectores de soporte de " + pts.length + " películas<br>";
    if (kernel === "lin") {
      var nw = Math.hypot(m.w[0], m.w[1]);
      txt += "w = (" + m.w[0].toFixed(2) + ", " + m.w[1].toFixed(2) + ") · b = " + m.b.toFixed(2) + " · ancho del margen = 2/‖w‖ = <b>" + (nw > 1e-9 ? (2 / nw).toFixed(2) : "∞") + "</b><br>";
    }
    txt += "Películas dentro del margen o mal clasificadas: <b>" + m.viol + "</b> · acierto en train: <b>" + (m.acc * 100).toFixed(1) + " %</b><br><span style='opacity:.75'>Solucionador SMO simplificado: los números pueden diferir un poco de los de scikit-learn.</span>";
    out.set(txt);
  }
  makeData(); train(); view.draw(draw); update(false);
});
