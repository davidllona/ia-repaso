/* Experimento: transfer learning en miniatura, entrenado EN VIVO en el navegador.
   Red 2 → 12 (tanh) → 2. Tarea A: dos lunas. Tarea B: las mismas lunas GIRADAS un ángulo, con pocos puntos de entrenamiento.
   Cuatro formas de abordar B: desde cero, cuerpo aleatorio congelado, cuerpo preentrenado congelado, y ajuste fino (cuerpo preentrenado
   con learning rate bajo). Backpropagation y Adam escritos a mano. */
Lab.register("curso5/c5m4-transfer-vivo", function (root, api) {
  var D = api.d, H = 12, STEPS = 300;
  var S = { theta: 30, n: 3, ratio: 0.1, ver: "ft", seed: 11, rep: null };
  var METODOS = [["cero", "desde cero"], ["rand", "cuerpo aleatorio congelado"], ["cong", "cuerpo preentrenado congelado"], ["ft", "ajuste fino"]];

  function moons(n, sigma, r, theta) {
    var pts = [], i, c, t, x, y, th = theta * Math.PI / 180, cs = Math.cos(th), sn = Math.sin(th);
    for (c = 0; c < 2; c++) for (i = 0; i < n; i++) {
      t = r.range(0, Math.PI);
      x = c === 0 ? Math.cos(t) : 1 - Math.cos(t); y = c === 0 ? Math.sin(t) : 0.5 - Math.sin(t);
      x = (x - 0.5) * 1.5 + r.normal(0, sigma); y = (y - 0.25) * 1.5 + r.normal(0, sigma);
      pts.push({ x: x * cs - y * sn, y: x * sn + y * cs, c: c });
    }
    return pts;
  }
  /* red */
  function newNet(r) {
    var W1 = [], b1 = [], W2 = [], b2 = [0, 0], i;
    for (i = 0; i < H; i++) { W1.push([r.normal(0, 1.2), r.normal(0, 1.2)]); b1.push(r.normal(0, 0.5)); W2.push([r.normal(0, 0.5), r.normal(0, 0.5)]); }
    return { W1: W1, b1: b1, W2: W2, b2: b2 };
  }
  function copy(n) { return { W1: n.W1.map(function (a) { return a.slice(); }), b1: n.b1.slice(), W2: n.W2.map(function (a) { return a.slice(); }), b2: n.b2.slice() }; }
  function forward(n, x, y) {
    var h = new Array(H), l0 = n.b2[0], l1 = n.b2[1], i;
    for (i = 0; i < H; i++) { h[i] = Math.tanh(n.W1[i][0] * x + n.W1[i][1] * y + n.b1[i]); l0 += n.W2[i][0] * h[i]; l1 += n.W2[i][1] * h[i]; }
    return { h: h, l0: l0, l1: l1 };
  }
  function predict(n, x, y) { var f = forward(n, x, y); return f.l1 > f.l0 ? 1 : 0; }
  function acc(n, pts) { var k = 0, i; for (i = 0; i < pts.length; i++) if (predict(n, pts[i].x, pts[i].y) === pts[i].c) k++; return k / pts.length; }
  /* entrena con Adam; lrBody = 0 → cuerpo congelado */
  function train(n, pts, lrHead, lrBody) {
    var N = pts.length, m = {}, v = {}, t, i, j, k, names = ["W1", "b1", "W2", "b2"];
    var zeros = function () { return { W1: n.W1.map(function () { return [0, 0]; }), b1: n.b1.map(function () { return 0; }), W2: n.W2.map(function () { return [0, 0]; }), b2: [0, 0] }; };
    m = zeros(); v = zeros();
    for (t = 1; t <= STEPS; t++) {
      var g = zeros();
      for (k = 0; k < N; k++) {
        var p = pts[k], f = forward(n, p.x, p.y), mx = Math.max(f.l0, f.l1), e0 = Math.exp(f.l0 - mx), e1 = Math.exp(f.l1 - mx), z = e0 + e1;
        var d0 = e0 / z - (p.c === 0 ? 1 : 0), d1 = e1 / z - (p.c === 1 ? 1 : 0);
        d0 /= N; d1 /= N;
        g.b2[0] += d0; g.b2[1] += d1;
        for (i = 0; i < H; i++) {
          g.W2[i][0] += d0 * f.h[i]; g.W2[i][1] += d1 * f.h[i];
          var dz = (d0 * n.W2[i][0] + d1 * n.W2[i][1]) * (1 - f.h[i] * f.h[i]);
          g.W1[i][0] += dz * p.x; g.W1[i][1] += dz * p.y; g.b1[i] += dz;
        }
      }
      var b1c = 1 - Math.pow(0.9, t), b2c = 1 - Math.pow(0.999, t);
      var upd = function (par, gr, mm, vv, lr) {
        mm = 0.9 * mm + 0.1 * gr; vv = 0.999 * vv + 0.001 * gr * gr;
        return [par - lr * (mm / b1c) / (Math.sqrt(vv / b2c) + 1e-8), mm, vv];
      };
      var u;
      for (i = 0; i < H; i++) {
        for (j = 0; j < 2; j++) {
          u = upd(n.W2[i][j], g.W2[i][j], m.W2[i][j], v.W2[i][j], lrHead); n.W2[i][j] = u[0]; m.W2[i][j] = u[1]; v.W2[i][j] = u[2];
          if (lrBody > 0) { u = upd(n.W1[i][j], g.W1[i][j], m.W1[i][j], v.W1[i][j], lrBody); n.W1[i][j] = u[0]; m.W1[i][j] = u[1]; v.W1[i][j] = u[2]; }
        }
        if (lrBody > 0) { u = upd(n.b1[i], g.b1[i], m.b1[i], v.b1[i], lrBody); n.b1[i] = u[0]; m.b1[i] = u[1]; v.b1[i] = u[2]; }
      }
      for (j = 0; j < 2; j++) { u = upd(n.b2[j], g.b2[j], m.b2[j], v.b2[j], lrHead); n.b2[j] = u[0]; m.b2[j] = u[1]; v.b2[j] = u[2]; }
    }
    return n;
  }
  function dist(a, b) {
    var s = 0, q = 0, i, j;
    for (i = 0; i < H; i++) { for (j = 0; j < 2; j++) { s += (a.W1[i][j] - b.W1[i][j]) * (a.W1[i][j] - b.W1[i][j]); q += b.W1[i][j] * b.W1[i][j]; } s += (a.b1[i] - b.b1[i]) * (a.b1[i] - b.b1[i]); q += b.b1[i] * b.b1[i]; }
    return Math.sqrt(s / q);
  }

  /* tarea A: preentrenar una sola vez */
  var base = newNet(api.rng(5)), dataA = moons(150, 0.12, api.rng(6), 0), testA = moons(300, 0.12, api.rng(7), 0);
  train(base, dataA, 0.05, 0.05);
  var accA = acc(base, testA);
  var baseRand = newNet(api.rng(99)), testB = null, trainB = null, redes = null, accs = null;

  function entrenaTodos(pts) {
    var r = api.rng(S.seed + 1000), res = {}, w0 = copy(base);
    var cero = newNet(api.rng(S.seed + 1)); train(cero, pts, 0.05, 0.05);
    var rand = copy(baseRand); rand.W2 = newNet(api.rng(S.seed + 2)).W2; rand.b2 = [0, 0]; train(rand, pts, 0.05, 0);
    var cong = copy(base); cong.W2 = newNet(api.rng(S.seed + 3)).W2; cong.b2 = [0, 0]; train(cong, pts, 0.05, 0);
    var ft = copy(base); ft.W2 = newNet(api.rng(S.seed + 3)).W2; ft.b2 = [0, 0]; train(ft, pts, 0.05, 0.05 * S.ratio);
    return { cero: cero, rand: rand, cong: cong, ft: ft, mov: dist(ft, w0) };
  }
  function prepara() {
    testB = moons(300, 0.15, api.rng(2000 + S.theta), S.theta);
    trainB = moons(S.n, 0.15, api.rng(S.seed), S.theta);
    redes = entrenaTodos(trainB);
    accs = {}; METODOS.forEach(function (m) { accs[m[0]] = acc(redes[m[0]], testB); });
  }
  function repite() {
    var R = 15, tot = { cero: [], rand: [], cong: [], ft: [] }, i, save = S.seed;
    for (i = 0; i < R; i++) {
      S.seed = 500 + i; var pts = moons(S.n, 0.15, api.rng(S.seed), S.theta), rd = entrenaTodos(pts);
      METODOS.forEach(function (m) { tot[m[0]].push(acc(rd[m[0]], testB)); });
    }
    S.seed = save; S.rep = {};
    METODOS.forEach(function (m) { var a = tot[m[0]], mu = api.math.mean(a); S.rep[m[0]] = [mu, api.math.std(a)]; });
  }

  var row = api.el("div", { class: "lab-row" }), colA = api.el("div"), colB = api.el("div");
  row.appendChild(colA); row.appendChild(colB); root.appendChild(row);
  var v1 = api.view(colA, { aspect: 1.1, minH: 250, maxH: 340, label: "Mapa de series: frontera entre comedia y terror del método elegido, sobre la tarea B" });
  var pl = api.plot(v1, { xr: [-1.7, 1.7], yr: [-1.7, 1.7], xticks: 2, yticks: 2, pad: { l: 34, r: 14, t: 10, b: 34 }, grid: false, xlabel: "ritmo de la serie", ylabel: "oscuridad", xfmt: function (v) { return +v.toFixed(1); }, yfmt: function (v) { return +v.toFixed(1); } });
  var v2 = api.view(colB, { aspect: 1.1, minH: 250, maxH: 340, label: "Exactitud en el test de cada método" });
  api.legend(root, [[api.colors().cobalto, "comedia"], [api.colors().terracota, "terror"]]);
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "Giro del mapa de series (B) respecto al de cine (A), en grados", min: 0, max: 90, step: 5, value: S.theta, onInput: function (v) { S.theta = v; S.rep = null; prepara(); update(); } });
  ui.slider({ label: "Series de entrenamiento por género", min: 1, max: 15, step: 1, value: S.n, onInput: function (v) { S.n = v; S.rep = null; prepara(); update(); } });
  ui.slider({ label: "Ajuste fino: learning rate del cuerpo ÷ el de la cabeza", min: 0.01, max: 1, step: 0.01, value: S.ratio, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { S.ratio = v; S.rep = null; prepara(); update(); } });
  ui.segmented({ label: "Ver la frontera de", value: S.ver, options: METODOS.map(function (m) { return [m[0], m[1].replace("cuerpo preentrenado congelado", "preentrenado").replace("cuerpo aleatorio congelado", "aleatorio")]; }), onChange: function (v) { S.ver = v; update(); } });
  ui.button("Otras series de entrenamiento", function () { S.seed += 7; S.rep = null; prepara(); update(); });
  ui.button("Repetir con 15 sorteos de series", function () { repite(); update(); }, "primary");

  function draw1(ctx, w, h, C) {
    var b = pl.box, net = redes[S.ver], gx = 36, gy = 36, i, j;
    ctx.save(); pl.clip(ctx);
    for (i = 0; i < gx; i++) for (j = 0; j < gy; j++) {
      var x = pl.xr[0] + (i + 0.5) / gx * (pl.xr[1] - pl.xr[0]), y = pl.yr[0] + (j + 0.5) / gy * (pl.yr[1] - pl.yr[0]);
      D.rect(ctx, pl.x(x) - b.w / gx / 2 - 0.5, pl.y(y) - b.h / gy / 2 - 0.5, b.w / gx + 1, b.h / gy + 1, predict(net, x, y) === 0 ? C.cobaltoWash : C.terracotaWash, null);
    }
    ctx.restore();
    pl.axes(ctx);
    ctx.save(); pl.clip(ctx);
    testB.forEach(function (p, k) { if (k % 3 === 0) D.circle(ctx, pl.x(p.x), pl.y(p.y), 1.8, p.c === 0 ? C.cobalto : C.terracota, null); });
    trainB.forEach(function (p) { D.circle(ctx, pl.x(p.x), pl.y(p.y), 5.2, p.c === 0 ? C.cobalto : C.terracota, C.ink, 1.8); });
    ctx.restore();
  }
  function draw2(ctx, w, h, C) {
    var Y = function (a) { return top + (1 - a / 1.1) * (h - top - bot); }, left = 8, right = 8, top = 26, bot = 44, bw = (w - left - right) / 4, i, cols = [C.muted, C.oliva, C.cobalto, C.terracota];
    D.rect(ctx, left, top, w - left - right, h - top - bot, C.surface, C.ink, 1.2);
    [0, 0.25, 0.5, 0.75, 1].forEach(function (t) {
      var y = Y(t);
      D.line(ctx, left, y, w - right, y, t === 0.5 ? C.muted : C.line, 1, t === 0.5 ? [4, 3] : []);
      D.text(ctx, Math.round(t * 100) + "", left + 2, y - 2, { size: 9.5, mono: true, color: C.muted });
    });
    METODOS.forEach(function (m, k) {
      var a = accs[m[0]], x = left + bw * k + bw * 0.18, ww = bw * 0.64, y = Y(a);
      D.rect(ctx, x, y, ww, Y(0) - y, cols[k], null);
      D.text(ctx, Math.round(a * 100) + " %", x + ww / 2, y - 3, { size: 11, mono: true, color: C.ink, align: "center", weight: 600 });
      if (S.rep) {
        var mu = S.rep[m[0]][0], sd = S.rep[m[0]][1], ym = Y(mu), y1 = Y(Math.min(1, mu + sd)), y2 = Y(Math.max(0, mu - sd));
        D.line(ctx, x + ww / 2, y1, x + ww / 2, y2, C.ink, 2); D.line(ctx, x + 2, ym, x + ww - 2, ym, C.ink, 2.4);
      }
      var short = ["desde cero", "aleatorio", "preentr.", "ajuste fino"][k], short2 = ["", "congelado", "congelado", ""][k];
      D.text(ctx, short, x + ww / 2, h - 28, { size: w < 340 ? 9 : 10.5, color: C.ink2, align: "center" });
      D.text(ctx, short2, x + ww / 2, h - 15, { size: w < 340 ? 9 : 10.5, color: C.ink2, align: "center" });
    });
    D.text(ctx, S.rep ? "barras: este sorteo · marca negra: media ± desv. de 15 sorteos" : "exactitud en el test (300 series por género)", w / 2, 13, { size: 10, color: C.muted, align: "center" });
  }
  prepara();
  v1.draw(draw1); v2.draw(draw2);

  function update() {
    var s = "El crítico preentrenado con películas de cine (tarea A, mapa sin girar) acierta <b>" + Math.round(accA * 100) + " %</b> en su test · tarea B: series con el mapa girado <b>" + S.theta + "°</b>, <b>" + (2 * S.n) + "</b> series de entrenamiento";
    s += "<br>Este sorteo → desde cero <b>" + Math.round(accs.cero * 100) + " %</b> · aleatorio congelado <b>" + Math.round(accs.rand * 100) + " %</b> · preentrenado congelado <b>" + Math.round(accs.cong * 100) + " %</b> · ajuste fino <b>" + Math.round(accs.ft * 100) + " %</b>";
    s += "<br>El cuerpo del ajuste fino se ha movido el <b>" + (redes.mov * 100).toFixed(0) + " %</b> de su tamaño respecto al preentrenado";
    if (S.rep) s += "<br>Media de 15 sorteos → " + METODOS.map(function (m) { return m[1].replace("cuerpo ", "") + " <b>" + Math.round(S.rep[m[0]][0] * 100) + " ± " + Math.round(S.rep[m[0]][1] * 100) + "</b>"; }).join(" · ");
    else s += "<br><span class='bad'>Un solo sorteo de series es muy ruidoso: pulsa «Repetir con 15 sorteos de series» antes de sacar conclusiones.</span>";
    out.set(s); v1.redraw(); v2.redraw();
  }
  update();
});
