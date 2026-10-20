/* Experimento: cuatro optimizadores entrenan LA MISMA red (mismos pesos iniciales, mismos datos) a la vez, paso a paso.
   Backpropagation real; pérdida BCE de todo el conjunto en cada paso (batch completo). Pérdida en escala logarítmica. */
Lab.register("curso5/c5m2-carrera-red", function (root, api) {
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

  var BASE = { sgd: 0.3, momentum: 0.03, rmsprop: 0.003, adam: 0.01 };
  var KEYS = ["sgd", "momentum", "rmsprop", "adam"];
  var NAME = { sgd: "SGD", momentum: "SGD + momentum", rmsprop: "RMSprop", adam: "Adam" };
  var S = { kind: "spiral", depth: 4, multExp: 0, show: "adam", run: false, seed: 1 };
  var DS = { moons: "Dos lunas", circles: "Círculos", spiral: "Espiral", xor: "XOR" };
  var data, nets, hist, MAXT = 1000;

  function build() {
    stop();
    data = Eng.makeData(S.kind, 100, 300, S.kind === "spiral" ? 0.1 : 0.15, 3);
    nets = {}; hist = {};
    KEYS.forEach(function (k) {
      nets[k] = new Eng.Net({ depth: S.depth, width: 12, act: "relu", init: "he", drop: 0, bn: false, opt: k, lr: BASE[k] * Math.pow(10, S.multExp), mu: 0.9, seed: S.seed });
      nets[k].data(data.tr); hist[k] = [];
    });
    update();
  }
  var row = api.el("div", { class: "lab-row" }), colA = api.el("div"), colB = api.el("div");
  row.appendChild(colA); row.appendChild(colB); root.appendChild(row);
  var vL = api.view(colA, { aspect: 1.15, minH: 230, maxH: 340, label: "Pérdida de entrenamiento de los cuatro optimizadores, en escala logarítmica" });
  var pL = api.plot(vL, { xr: [0, 300], yr: [-4, 1], xticks: 3, yticks: 5, xlabel: "pasos", pad: { l: 42, r: 8, t: 14, b: 32 }, xfmt: function (v) { return Math.round(v); }, yfmt: function (v) { return "1e" + Math.round(v); } });
  var vM = api.view(colB, { aspect: 1.15, minH: 230, maxH: 340, label: "Frontera de decisión de la red elegida y datos de entrenamiento" });
  var pM = api.plot(vM, { xr: [-2, 2], yr: [-2, 2], xticks: 4, yticks: 4, pad: { l: 30, r: 8, t: 14, b: 24 }, xfmt: function (v) { return Math.round(v); }, yfmt: function (v) { return Math.round(v); } });
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.72rem, 2.7vw, .84rem)";
  var tb = api.table(root, ["optimizador", "train", "test", "acc test"]);
  ui.select({ label: "Datos", value: S.kind, options: Object.keys(DS).map(function (k) { return [k, DS[k]]; }), onChange: function (v) { S.kind = v; build(); } });
  ui.select({ label: "Frontera de", value: S.show, options: KEYS.map(function (k) { return [k, NAME[k]]; }), onChange: function (v) { S.show = v; update(); } });
  ui.slider({ label: "Capas ocultas (de 12 neuronas, ReLU + He)", min: 2, max: 6, step: 1, value: S.depth, onInput: function (v) { S.depth = v; build(); } });
  ui.slider({ label: "Multiplicador del lr de los cuatro (escala log)", min: -1, max: 1, step: 0.1, value: S.multExp, fmt: function (v) { return "×" + Math.pow(10, v).toPrecision(2).replace(/\.0$/, ""); }, onInput: function (v) { S.multExp = v; KEYS.forEach(function (k) { nets[k].cfg.lr = BASE[k] * Math.pow(10, v); }); update(); } });
  var btn = ui.button("▶ Carrera", function () { if (S.run) { stop(); return; } if (api.reduceMotion) { for (var i = 0; i < 400; i++) one(); update(); return; } S.run = true; btn.textContent = "❚❚ Pausa"; loop.start(); }, "primary");
  ui.button("Dar 50 pasos", function () { stop(); for (var i = 0; i < 50; i++) one(); update(); });
  ui.button("Reiniciar", function () { build(); });
  api.legend(root, [[C0.muted, "SGD"], [C0.cobalto, "SGD + momentum"], [C0.terracota, "RMSprop"], [C0.oliva, "Adam"]]);
  var loop = api.loop(function () { for (var i = 0; i < 5; i++) one(); update(); if (nets.sgd.t >= MAXT) { stop(); return false; } }, { fps: 30 });
  function stop() { S.run = false; if (loop) loop.stop(); btn.textContent = "▶ Carrera"; }
  function one() { KEYS.forEach(function (k) { var n = nets[k]; if (n.broken || n.t >= MAXT) return; n.step(); hist[k].push([n.t, n.loss]); }); }
  var COL = function (C) { return { sgd: C.muted, momentum: C.cobalto, rmsprop: C.terracota, adam: C.oliva }; };

  function drawL(ctx, w, h, C) {
    var xm = Math.max(300, Math.ceil((nets.sgd.t + 1) / 100) * 100); pL.xr = [0, xm];
    pL.axes(ctx); ctx.save(); pL.clip(ctx); var col = COL(C);
    ["momentum", "sgd", "rmsprop", "adam"].forEach(function (k) {
      var pts = hist[k].filter(function (q, i) { return i % 2 === 0 || i > hist[k].length - 3; }).map(function (q) { return [pL.x(q[0]), pL.y(Math.max(-4, Math.min(1, Math.log10(Math.max(q[1], 1e-12)))))]; });
      D.path(ctx, pts, col[k], k === "adam" ? 2.8 : 2.2, k === "sgd" ? [4, 3] : null);
    });
    ctx.restore();
  }
  function drawM(ctx, w, h, C) {
    pM.axes(ctx); var net = nets[S.show], b = pM.box, G = 34, X = [], i, j;
    for (j = 0; j < G; j++) for (i = 0; i < G; i++) X.push(Float64Array.of(-2 + 4 * (i + 0.5) / G, 2 - 4 * (j + 0.5) / G));
    var o = net.broken ? null : net.predict(X);
    ctx.save(); pM.clip(ctx);
    if (o) { ctx.globalAlpha = 0.28; for (j = 0; j < G; j++) for (i = 0; i < G; i++) { ctx.fillStyle = o[j * G + i] > 0.5 ? C.terracota : C.cobalto; ctx.fillRect(b.x + i * b.w / G, b.y + j * b.h / G, b.w / G + 0.6, b.h / G + 0.6); } ctx.globalAlpha = 1; }
    data.tr.forEach(function (p) { D.circle(ctx, pM.x(p.x), pM.y(p.y), 3.4, p.l ? C.terracota : C.cobalto, C.paper, 1); });
    ctx.restore();
    D.text(ctx, NAME[S.show] + " tras " + net.t + " pasos", b.x + 2, 11, { size: 11, color: C.ink2, weight: 600 });
  }
  build();
  vL.draw(drawL); vM.draw(drawM);
  function pct(v) { return (100 * v).toFixed(0) + " %"; }
  function update() {
    var rows = [], best = null;
    KEYS.forEach(function (k) {
      var n = nets[k], ev = n.t ? n.evalSet(data.te) : null;
      rows.push(["<b>" + (k === "momentum" ? "Mom." : k === "rmsprop" ? "RMS" : NAME[k]) + "</b>", n.broken ? "NaN" : n.t ? n.loss.toExponential(1).replace("e-", "e−") : "—", ev ? ev.loss.toFixed(2) : "—", ev ? pct(ev.acc) : "—"]);
      if (n.t && !n.broken && (best === null || n.loss < nets[best].loss)) best = k;
    });
    tb.set(rows);
    var t = nets.sgd.t;
    out.set(t < 2 ? "Pulsa «Carrera»: las cuatro redes parten de los mismos pesos y ven los mismos 100 puntos. Solo cambia la regla de actualización." :
      "Paso <b>" + t + "</b> (pérdida en train y test = entropía cruzada binaria) · la pérdida de entrenamiento más baja es la de <b>" + NAME[best] + "</b> (" + nets[best].loss.toExponential(1).replace("e-", "e−") + ").<br>Fíjate en la pérdida de test: hundir la de entrenamiento no garantiza que la de test baje (con 100 puntos hay sobreajuste).");
    vL.redraw(); vM.redraw();
  }
  update();
  return { destroy: function () { stop(); } };
});
