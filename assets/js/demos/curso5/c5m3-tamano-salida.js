/* Experimento: tamaño de la salida de nn.Conv2d con TODOS sus argumentos (kernel_size, stride, padding, dilation y padding='same').
   Se dibuja la imagen con su marco de padding y las posiciones reales de las ventanas (con huecos si hay dilatación). */
(function () {
  /* tamaño de salida en una dimensión; padTot = relleno total (izquierda + derecha) */
  function outSize(n, k, s, padTot, d) {
    var ext = d * (k - 1) + 1, tot = n + padTot;
    if (tot < ext) return 0;
    return Math.floor((tot - ext) / s) + 1;
  }
  /* índices (en coordenadas con marco) de las casillas que toca la ventana número a */
  function samples(a, k, s, d) {
    var r = [], t;
    for (t = 0; t < k; t++) r.push(a * s + d * t);
    return r;
  }
  /* qué casillas reales (0..n-1) miran alguna ventana */
  function covered(n, k, s, padL, padR, d) {
    var m = outSize(n, k, s, padL + padR, d), cov = [], a, i, t;
    for (i = 0; i < n; i++) cov.push(false);
    for (a = 0; a < m; a++) for (t = 0; t < k; t++) {
      i = a * s + d * t - padL;
      if (i >= 0 && i < n) cov[i] = true;
    }
    return cov;
  }
  /* relleno que usa padding='same' (stride 1): el sobrante va a la derecha */
  function samePad(k, d) { var tot = d * (k - 1), l = Math.floor(tot / 2); return { l: l, r: tot - l, tot: tot }; }
  var core = { outSize: outSize, samples: samples, covered: covered, samePad: samePad };
  if (typeof module !== "undefined" && module.exports) module.exports = core;
  if (typeof Lab === "undefined") return;

  Lab.register("curso5/c5m3-tamano-salida", function (root, api) {
    var D = api.d;
    var S = { n: 10, k: 3, s: 1, p: 0, d: 1, same: false, win: 0 };
    var view = api.view(root, { aspect: 1.7, minH: 250, maxH: 340, label: "Fotograma con sus bandas negras de padding y las casillas que mira una ventana del filtro" });
    var ui = api.controls(root), out = api.readout(root);
    var slN = ui.slider({ label: "Lado del fotograma n", min: 4, max: 14, step: 1, value: S.n, onInput: function (v) { S.n = v; update(); } });
    var slK = ui.slider({ label: "kernel_size k", min: 1, max: 7, step: 1, value: S.k, onInput: function (v) { S.k = v; update(); } });
    var slS = ui.slider({ label: "stride s", min: 1, max: 4, step: 1, value: S.s, onInput: function (v) { S.s = v; update(); } });
    var slP = ui.slider({ label: "padding p (por cada lado)", min: 0, max: 4, step: 1, value: S.p, onInput: function (v) { S.p = v; update(); } });
    var slD = ui.slider({ label: "dilation d", min: 1, max: 3, step: 1, value: S.d, onInput: function (v) { S.d = v; update(); } });
    var slW = ui.slider({ label: "Ventana a resaltar", min: 0, max: 0, step: 1, value: 0, fmt: function (v) { return "nº " + (v + 1); }, onInput: function (v) { S.win = v; update(); } });
    var tgSame = ui.toggle({ label: "padding='same'", value: false, onChange: function (v) { S.same = v; update(); } });
    ui.button("Caso n=14, k=5, sin relleno", function () { setAll(14, 5, 1, 0, 1, false); });
    ui.button("Caso n=8, k=3, stride 2", function () { setAll(8, 3, 2, 0, 1, false); }, "primary");

    function setAll(n, k, s, p, d, same) {
      S.n = n; S.k = k; S.s = s; S.p = p; S.d = d; S.same = same; S.win = 0; tgSame.set(same);
      slN.set(n, true); slK.set(k, true); slS.set(s, true); slP.set(p, true); slD.set(d, true); update();
    }
    function cfg() {
      var s = S.same ? 1 : S.s, pl, pr;
      if (S.same) { var sp = samePad(S.k, S.d); pl = sp.l; pr = sp.r; } else { pl = S.p; pr = S.p; }
      return { n: S.n, k: S.k, s: s, pl: pl, pr: pr, d: S.d, m: outSize(S.n, S.k, s, pl + pr, S.d) };
    }

    function draw(ctx, w, h, C) {
      var c = cfg(), M = c.n + c.pl + c.pr, cell = Math.max(10, Math.min(30, (w - 24) / M, (h - 44) / M)), x0 = (w - cell * M) / 2, y0 = 14, i, j;
      var cov = covered(c.n, c.k, c.s, c.pl, c.pr, c.d), ext = c.d * (c.k - 1) + 1;
      var win = c.m > 0 ? { a: Math.floor(S.win / c.m), b: S.win % c.m } : null;
      var smp = win ? { r: samples(win.a, c.k, c.s, c.d), c: samples(win.b, c.k, c.s, c.d) } : null;
      for (i = 0; i < M; i++) for (j = 0; j < M; j++) {
        var real = i >= c.pl && i < c.pl + c.n && j >= c.pl && j < c.pl + c.n, x = x0 + j * cell, y = y0 + i * cell;
        var fill = real ? C.surface : C.markerWash;
        D.rect(ctx, x, y, cell, cell, fill, C.line, 1);
        if (real && !(cov[i - c.pl] && cov[j - c.pl])) {
          D.line(ctx, x + 3, y + 3, x + cell - 3, y + cell - 3, C.terracota, 1.5);
          D.line(ctx, x + cell - 3, y + 3, x + 3, y + cell - 3, C.terracota, 1.5);
        }
      }
      D.rect(ctx, x0 + c.pl * cell, y0 + c.pl * cell, c.n * cell, c.n * cell, null, C.ink, 2);
      if (smp) {
        smp.r.forEach(function (rr) { smp.c.forEach(function (cc) { D.rect(ctx, x0 + cc * cell, y0 + rr * cell, cell, cell, C.terracotaWash, C.terracota, 2); }); });
        D.rect(ctx, x0 + win.b * c.s * cell, y0 + win.a * c.s * cell, ext * cell, ext * cell, null, C.cobalto, 2);
      }
      D.text(ctx, "amarillo = padding · negro = fotograma · × = sin mirar", w / 2, y0 + M * cell + 17, { size: 10.5, align: "center", color: C.muted });
    }
    view.draw(draw);

    function update() {
      var c = cfg(), ext = c.d * (c.k - 1) + 1, tot = c.n + c.pl + c.pr;
      if (S.same) slP.set(Math.floor(samePad(S.k, S.d).tot / 2), true);
      var m = Math.max(1, c.m * c.m);
      slW.input.max = m - 1; if (S.win > m - 1) S.win = m - 1; slW.set(S.win, true);
      var cov = covered(c.n, c.k, c.s, c.pl, c.pr, c.d), lost = cov.filter(function (v) { return !v; }).length;
      var code = "nn.Conv2d(1, 1, kernel_size=" + c.k + (S.same ? ", padding='same'" : (c.s !== 1 ? ", stride=" + c.s : "") + (S.p ? ", padding=" + S.p : "")) + (c.d !== 1 ? ", dilation=" + c.d : "") + ")";
      var padTxt = S.same ? (c.pl === c.pr ? "2·" + c.pl : c.pl + " + " + c.pr) : "2·" + c.pl;
      var t = "<code>" + code + "</code> sobre un fotograma de " + c.n + "×" + c.n + "<br>" +
        "ventana efectiva: d·(k−1)+1 = " + c.d + "·" + (c.k - 1) + "+1 = <b>" + ext + "</b> &nbsp;·&nbsp; fotograma con marco: " + c.n + " + " + padTxt + " = <b>" + tot + "</b><br>" +
        "salida = ⌊(" + tot + " − " + ext + ") / " + c.s + "⌋ + 1 = ";
      if (c.m <= 0) t += "<span class='bad'><b>imposible</b>: la ventana (" + ext + ") es mayor que el fotograma con marco (" + tot + "). PyTorch lanza un RuntimeError.</span>";
      else {
        t += "<b>" + c.m + "</b> → mapa de <b>" + c.m + "×" + c.m + " = " + (c.m * c.m) + "</b> valores por canal. Parámetros del filtro: " + (c.k * c.k) + " pesos + 1 sesgo (no dependen de n).";
        if (lost) t += "<br><span class='bad'>" + lost + " fila(s) y columna(s) del fotograma no las mira ninguna ventana (marcadas con ×).</span>";
        else t += "<br><span class='good'>Todas las casillas del fotograma las mira alguna ventana.</span>";
        if (S.same && S.s !== 1) t += "<br>PyTorch no admite padding='same' con stride &gt; 1 (lanza ValueError); aquí se usa stride 1.";
        if (S.same && c.s === 1) t += "<br>Con padding='same' y stride 1 la salida mide lo mismo que la entrada (" + c.n + ").";
      }
      out.set(t); view.redraw();
    }
    update();
  });
})();
