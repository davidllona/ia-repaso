/* Experimento: medir el tamaño del gradiente de cada capa MIENTRAS se entrena una red profunda (SGD real, backpropagation real).
   Barras = norma del gradiente de los pesos de cada capa (escala logarítmica); círculos huecos = el valor que tenía en el primer paso. */
Lab.register("curso5/c5m2-grad-capas", function (root, api) {
  var D = api.d, C0 = api.colors();
    /* ===== Motor de red profunda (clasificación binaria 2D): forward, backpropagation, dropout, BatchNorm y optimizadores reales ===== */
  var Eng = (function () {
    var ACT = {
      sigmoid: { name: "Sigmoide", f: function (z) { return 1 / (1 + Math.exp(-z)); }, d: function (z, a) { return a * (1 - a); } },
      tanh: { name: "tanh", f: Math.tanh, d: function (z, a) { return 1 - a * a; } },
      relu: { name: "ReLU", f: function (z) { return z > 0 ? z : 0; }, d: function (z) { return z > 0 ? 1 : 0; } }
    };
    function genPoints(kind, n, noise, r) {
      var pts = [], i, t, rad, a, lab, x, y;
      for (i = 0; i < n; i++) {
        lab = i % 2;
        if (kind === "circles") { a = r.range(0, 6.2832); rad = lab ? 0.55 : 1.1; x = rad * Math.cos(a) + r.normal(0, noise); y = rad * Math.sin(a) + r.normal(0, noise); }
        else if (kind === "spiral") { t = r.range(0.2, 1) * 3.2 * Math.PI; rad = t / (3.2 * Math.PI) * 1.5; var sg = lab ? 1 : -1; x = sg * rad * Math.cos(t) + r.normal(0, noise); y = sg * rad * Math.sin(t) + r.normal(0, noise); }
        else if (kind === "xor") { var sx = r.next() < 0.5 ? -1 : 1; x = sx * 0.7 + r.normal(0, noise + 0.12); y = (lab ? -1 : 1) * sx * 0.7 + r.normal(0, noise + 0.12); }
        else { t = r.range(0, Math.PI); if (lab) { x = 1 - Math.cos(t) - 0.5; y = 0.5 - Math.sin(t) - 0.25; } else { x = Math.cos(t) - 0.5; y = Math.sin(t) - 0.25; } x = 1.2 * x + r.normal(0, noise); y = 1.4 * y + r.normal(0, noise); }
        pts.push({ x: x, y: y, l: lab });
      }
      return pts;
    }
    function makeData(kind, nTr, nTe, noise, seed) {
      return { tr: genPoints(kind, nTr, noise, api.rng(seed * 53 + 1)), te: genPoints(kind, nTe, noise, api.rng(seed * 53 + 2)) };
    }
    function toX(set) { return set.map(function (p) { return Float64Array.of(p.x, p.y); }); }

    /* cfg: {depth, width, act, init, drop, bn, opt, lr, mu, seed} */
    function Net(cfg) {
      var self = this, i, j, l;
      this.cfg = cfg; this.t = 0; this.broken = false; this.gn = []; this.loss = 0;
      var rng = api.rng(cfg.seed * 977 + 13), drng = api.rng(cfg.seed * 31 + 5);
      var sizes = [2]; for (i = 0; i < cfg.depth; i++) sizes.push(cfg.width); sizes.push(1);
      var L = sizes.length - 1, lay = [], tot = 0, ACTV = ACT[cfg.act];
      for (l = 0; l < L; l++) {
        var o = { nin: sizes[l], nout: sizes[l + 1], hid: l < L - 1 };
        o.bn = o.hid && !!cfg.bn; o.w = tot; tot += o.nin * o.nout; o.b = tot; tot += o.nout;
        if (o.bn) { o.g = tot; tot += o.nout; o.be = tot; tot += o.nout; o.rm = new Float64Array(o.nout); o.rv = new Float64Array(o.nout).fill(1); }
        lay.push(o);
      }
      var P = new Float64Array(tot), G = new Float64Array(tot), S1 = new Float64Array(tot), S2 = new Float64Array(tot);
      for (l = 0; l < L; l++) {
        var q = lay[l], v, aa;
        for (j = 0; j < q.nin * q.nout; j++) {
          if (cfg.init === "small") v = rng.normal(0, 0.05);
          else if (cfg.init === "xavier") { aa = Math.sqrt(6 / (q.nin + q.nout)); v = rng.range(-aa, aa); }
          else if (cfg.init === "he") v = rng.normal(0, Math.sqrt(2 / q.nin));
          else if (cfg.init === "big") v = rng.normal(0, 1);
          else { aa = 1 / Math.sqrt(q.nin); v = rng.range(-aa, aa); }
          P[q.w + j] = v;
        }
        if (q.bn) for (j = 0; j < q.nout; j++) P[q.g + j] = 1;
      }
      this.nParams = tot; this.layers = lay; this.sizes = sizes; this.L = L;
      var EPS = 1e-5;

      function forward(X, train, keep) {
        var n = X.length, a = new Float64Array(n * 2), c = { a: [], zp: [], h: [], mask: [], zh: [], inv: [], out: null }, s, k;
        for (s = 0; s < n; s++) { a[2 * s] = X[s][0]; a[2 * s + 1] = X[s][1]; }
        for (l = 0; l < L; l++) {
          var q = lay[l], nin = q.nin, nout = q.nout, z = new Float64Array(n * nout);
          if (keep) c.a.push(a);
          for (s = 0; s < n; s++) for (j = 0; j < nout; j++) {
            var sum = q.bn ? 0 : P[q.b + j], base = q.w + j * nin;
            for (i = 0; i < nin; i++) sum += P[base + i] * a[s * nin + i];
            z[s * nout + j] = sum;
          }
          if (!q.hid) { var o2 = new Float64Array(n); for (s = 0; s < n; s++) o2[s] = 1 / (1 + Math.exp(-z[s])); c.out = o2; break; }
          var zp = z, zh = null, inv = null;
          if (q.bn) {
            zh = new Float64Array(n * nout); inv = new Float64Array(nout); zp = new Float64Array(n * nout);
            for (j = 0; j < nout; j++) {
              var mu, va;
              if (train) {
                mu = 0; for (s = 0; s < n; s++) mu += z[s * nout + j]; mu /= n;
                va = 0; for (s = 0; s < n; s++) va += (z[s * nout + j] - mu) * (z[s * nout + j] - mu); va /= n;
                q.rm[j] = 0.9 * q.rm[j] + 0.1 * mu; q.rv[j] = 0.9 * q.rv[j] + 0.1 * va * n / Math.max(1, n - 1);
              } else { mu = q.rm[j]; va = q.rv[j]; }
              inv[j] = 1 / Math.sqrt(va + EPS);
              for (s = 0; s < n; s++) { var zz = (z[s * nout + j] - mu) * inv[j]; zh[s * nout + j] = zz; zp[s * nout + j] = P[q.g + j] * zz + P[q.be + j]; }
            }
          }
          var h = new Float64Array(n * nout), ho = null, mask = null;
          for (k = 0; k < n * nout; k++) h[k] = ACTV.f(zp[k]);
          if (keep) ho = h.slice();
          if (train && cfg.drop > 0) {
            mask = new Float64Array(n * nout); var sc = 1 / (1 - cfg.drop);
            for (k = 0; k < n * nout; k++) { mask[k] = drng.next() < cfg.drop ? 0 : sc; h[k] *= mask[k]; }
          }
          if (keep) { c.zp.push(zp); c.h.push(ho); c.mask.push(mask); c.zh.push(zh); c.inv.push(inv); }
          a = h;
        }
        return c;
      }
      this.dbg = { P: P, G: G, forward: forward };
      this.predict = function (X) { return forward(X, false, false).out; };
      this.evalSet = function (set) {
        var o = this.predict(toX(set)), ls = 0, ok = 0, k;
        for (k = 0; k < set.length; k++) {
          var p = Math.min(1 - 1e-12, Math.max(1e-12, o[k]));
          ls -= set[k].l ? Math.log(p) : Math.log(1 - p);
          if ((o[k] > 0.5) === (set[k].l === 1)) ok++;
        }
        return { loss: ls / set.length, acc: ok / set.length };
      };
      this.data = function (tr) { this.Xtr = toX(tr); this.ytr = tr.map(function (p) { return p.l; }); };

      this.step = function () {
        var X = this.Xtr, y = this.ytr, n = X.length, s, k, c = forward(X, true, true), gnorm = [];
        G.fill(0);
        var delta = new Float64Array(n), ls = 0;
        for (s = 0; s < n; s++) { delta[s] = (c.out[s] - y[s]) / n; var p = Math.min(1 - 1e-12, Math.max(1e-12, c.out[s])); ls -= y[s] ? Math.log(p) : Math.log(1 - p); }
        this.loss = ls / n;
        for (l = L - 1; l >= 0; l--) {
          var q = lay[l], nin = q.nin, nout = q.nout, ain = c.a[l], wn = 0;
          for (s = 0; s < n; s++) for (j = 0; j < nout; j++) {
            var d = delta[s * nout + j]; if (!q.bn) G[q.b + j] += d;
            var base = q.w + j * nin;
            for (i = 0; i < nin; i++) G[base + i] += d * ain[s * nin + i];
          }
          for (k = 0; k < nin * nout; k++) wn += G[q.w + k] * G[q.w + k];
          gnorm[l] = Math.sqrt(wn);
          if (l > 0) {
            var da = new Float64Array(n * nin);
            for (s = 0; s < n; s++) for (j = 0; j < nout; j++) { var dd = delta[s * nout + j], bs = q.w + j * nin; for (i = 0; i < nin; i++) da[s * nin + i] += P[bs + i] * dd; }
            var pq = lay[l - 1], mask = c.mask[l - 1], zp = c.zp[l - 1], ho = c.h[l - 1];
            for (k = 0; k < n * nin; k++) { if (mask) da[k] *= mask[k]; da[k] *= ACTV.d(zp[k], ho[k]); }
            if (pq.bn) {
              var zh = c.zh[l - 1], inv = c.inv[l - 1], nd = new Float64Array(n * nin);
              for (j = 0; j < nin; j++) {
                var sg = 0, sb = 0, m1 = 0, m2 = 0, gam = P[pq.g + j];
                for (s = 0; s < n; s++) { var dy = da[s * nin + j]; sg += dy * zh[s * nin + j]; sb += dy; m1 += dy * gam; m2 += dy * gam * zh[s * nin + j]; }
                G[pq.g + j] += sg; G[pq.be + j] += sb; m1 /= n; m2 /= n;
                for (s = 0; s < n; s++) nd[s * nin + j] = inv[j] * (da[s * nin + j] * gam - m1 - zh[s * nin + j] * m2);
              }
              delta = nd;
            } else delta = da;
          }
        }
        this.gn = gnorm;
        var lr = cfg.lr, op = cfg.opt, mu = cfg.mu === undefined ? 0.9 : cfg.mu;
        this.t++;
        if (op === "sgd") { for (k = 0; k < tot; k++) P[k] -= lr * G[k]; }
        else if (op === "momentum") { for (k = 0; k < tot; k++) { S1[k] = mu * S1[k] + G[k]; P[k] -= lr * S1[k]; } }
        else if (op === "nesterov") { for (k = 0; k < tot; k++) { S1[k] = mu * S1[k] + G[k]; P[k] -= lr * (G[k] + mu * S1[k]); } }
        else if (op === "rmsprop") { for (k = 0; k < tot; k++) { S2[k] = 0.99 * S2[k] + 0.01 * G[k] * G[k]; P[k] -= lr * G[k] / (Math.sqrt(S2[k]) + 1e-8); } }
        else {
          var c1 = 1 - Math.pow(0.9, this.t), c2 = 1 - Math.pow(0.999, this.t);
          for (k = 0; k < tot; k++) { S1[k] = 0.9 * S1[k] + 0.1 * G[k]; S2[k] = 0.999 * S2[k] + 0.001 * G[k] * G[k]; P[k] -= lr * (S1[k] / c1) / (Math.sqrt(S2[k] / c2) + 1e-8); }
        }
        if (!isFinite(this.loss) || !isFinite(P[0]) || !isFinite(P[tot - 1])) this.broken = true;
      };
    }
    return { ACT: ACT, makeData: makeData, toX: toX, Net: Net };
  })();
  /* ===== fin del motor ===== */

  var S = { depth: 8, act: "sigmoid", init: "default", lrExp: -0.3, seed: 1, run: false };
  var data = Eng.makeData("moons", 100, 300, 0.15, 3), net, hist, first;
  var INIT = { small: "Pequeños N(0; 0,05)", default: "Por defecto de nn.Linear", xavier: "Xavier (uniforme)", he: "He (normal)", big: "Grandes N(0; 1)" };

  function mk() { return new Eng.Net({ depth: S.depth, width: 10, act: S.act, init: S.init, drop: 0, bn: false, opt: "sgd", lr: Math.pow(10, S.lrExp), seed: S.seed }); }
  function build() {
    stop();
    var probe = mk(); probe.data(data.tr); probe.step(); first = probe.gn.slice();   /* un paso de prueba solo para leer los gradientes iniciales */
    net = mk(); net.data(data.tr); net.gn = first.slice(); hist = [];
    update();
  }

  var vB = api.view(root, { aspect: 2.0, minH: 230, maxH: 330, label: "Norma del gradiente de cada capa, en escala logarítmica" });
  var po = { xr: [0.5, 9.5], yr: [-9, 1], xticks: 1, yticks: 5, xlabel: "capa (1 = junto a la entrada · la última = salida)", pad: { l: 50, r: 10, t: 12, b: 38 }, xfmt: function () { return ""; }, yfmt: function (v) { return "1e" + Math.round(v); } };
  var pB = api.plot(vB, po);
  var vL = api.view(root, { aspect: 3.4, minH: 120, maxH: 170, label: "Pérdida de entrenamiento" });
  var pL = api.plot(vL, { xr: [0, 600], yr: [0, 0.8], xticks: 4, yticks: 2, xlabel: "pasos", pad: { l: 50, r: 10, t: 10, b: 32 }, xfmt: function (v) { return Math.round(v); }, yfmt: function (v) { return v.toFixed(1); } });
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.72rem, 2.7vw, .84rem)";
  ui.select({ label: "Activación de las capas ocultas", value: S.act, options: [["sigmoid", "Sigmoide"], ["tanh", "tanh"], ["relu", "ReLU"]], onChange: function (v) { S.act = v; build(); } });
  ui.select({ label: "Inicialización de los pesos", value: S.init, options: Object.keys(INIT).map(function (k) { return [k, INIT[k]]; }), onChange: function (v) { S.init = v; build(); } });
  ui.slider({ label: "Capas ocultas", min: 2, max: 8, step: 1, value: S.depth, onInput: function (v) { S.depth = v; build(); } });
  ui.slider({ label: "Learning rate (SGD, escala log)", min: -2, max: 0, step: 0.05, value: S.lrExp, fmt: function (v) { return Math.pow(10, v).toFixed(2); }, onInput: function (v) { S.lrExp = v; net.cfg.lr = Math.pow(10, v); update(); } });
  var btn = ui.button("▶ Entrenar", function () { if (S.run) { stop(); return; } if (api.reduceMotion) { for (var i = 0; i < 600; i++) one(); update(); return; } S.run = true; btn.textContent = "❚❚ Pausa"; loop.start(); }, "primary");
  ui.button("Dar 100 pasos", function () { stop(); for (var i = 0; i < 100; i++) one(); update(); });
  ui.button("Reiniciar (otros pesos)", function () { S.seed++; build(); });
  api.legend(root, [[C0.cobalto, "tamaño razonable"], [C0.terracota, "menos del 1 % del de la última capa"], [C0.marker, "explota (> 100)"]]);
  var loop = api.loop(function () { for (var i = 0; i < 6; i++) one(); update(); if (net.t >= 6000) { stop(); return false; } }, { fps: 30 });
  function stop() { S.run = false; if (loop) loop.stop(); btn.textContent = "▶ Entrenar"; }
  function one() { if (net.broken) return; net.step(); if (net.t % 4 === 1 || net.t < 30) hist.push([net.t, net.loss]); }

  function drawB(ctx, w, h, C) {
    var g = net.gn, n = g.length; pB.xr = [0.5, n + 0.5];
    pB.axes(ctx); ctx.save(); pB.clip(ctx);
    var last = g[n - 1], bw = Math.max(5, Math.min(30, pB.box.w / n * 0.6)), y0 = pB.y(-9), i;
    for (i = 0; i < n; i++) {
      var lv = Math.log10(Math.max(g[i], 1e-30)), col = g[i] < last * 0.01 ? C.terracota : (g[i] > 100 ? C.marker : C.cobalto);
      var y1 = pB.y(Math.max(-9, Math.min(1, lv)));
      D.rect(ctx, pB.x(i + 1) - bw / 2, y1, bw, y0 - y1, col, C.ink, 1);
      if (first && net.t > 1) { var lf = Math.log10(Math.max(first[i], 1e-30)); D.circle(ctx, pB.x(i + 1), pB.y(Math.max(-9, Math.min(1, lf))), 4, null, C.ink, 1.6); }
    }
    ctx.restore();
    for (i = 1; i <= n; i++) D.text(ctx, String(i), pB.x(i), pB.box.y + pB.box.h + 14, { size: 11, mono: true, align: "center", color: C.muted });
    D.text(ctx, "círculo hueco = paso 1", pB.box.x + pB.box.w - 4, pB.box.y + 12, { size: 10.5, align: "right", color: C.muted });
  }
  build();
  vB.draw(drawB);
  function drawL(ctx, w, h, C) {
    var xm = Math.max(600, Math.ceil((net.t + 1) / 200) * 200); pL.xr = [0, xm];
    pL.axes(ctx); ctx.save(); pL.clip(ctx);
    D.line(ctx, pL.x(0), pL.y(Math.LN2), pL.x(xm), pL.y(Math.LN2), C.muted, 1, [4, 4]);
    D.path(ctx, hist.map(function (q) { return [pL.x(q[0]), pL.y(Math.min(q[1], 0.8))]; }), C.cobalto, 2.4);
    ctx.restore();
    D.text(ctx, "0,693 = lanzar una moneda", pL.box.x + pL.box.w - 4, pL.y(Math.LN2) - 4, { size: 10.5, align: "right", color: C.muted });
  }
  vL.draw(drawL);

  function sci(v) { if (!isFinite(v)) return "—"; var e = v.toExponential(1).split("e"); return e[0] + "·10<sup>" + String(parseInt(e[1], 10)).replace("-", "−") + "</sup>"; }
  function update() {
    var g = net.gn, n = g.length, ratio = g[0] / g[n - 1], loss = hist.length ? hist[hist.length - 1][1] : NaN, v;
    if (net.broken) v = "<span class='bad'>Los pesos se han vuelto infinitos (NaN): el gradiente explotó. Baja el learning rate o usa otra inicialización.</span>";
    else if (net.t < 2) v = "Pulsa «Entrenar». Los círculos huecos y las barras coinciden porque todavía no se ha entrenado.";
    else if (loss > 0.69 && net.t > 300) v = "<span class='bad'>La pérdida sigue en 0,693: la red no aprende nada (gradientes casi nulos en las primeras capas).</span>";
    else if (loss < 0.3) v = "<span class='good'>La red está aprendiendo: pérdida " + loss.toFixed(3) + ".</span>";
    else v = "Entrenando…";
    out.set("Paso <b>" + net.t + "</b> · pérdida = <b>" + (isFinite(loss) ? loss.toFixed(3) : "—") + "</b><br>Gradiente de la capa 1: <b>" + sci(g[0]) + "</b> · de la última: <b>" + sci(g[n - 1]) + "</b> · cociente capa 1 / última = <b>" + sci(ratio) + "</b><br>En el paso 1 (círculos huecos) el cociente era <b>" + sci(first[0] / first[n - 1]) + "</b><br>" + v);
    vB.redraw(); vL.redraw();
  }
  update();
  return { destroy: function () { stop(); } };
});
