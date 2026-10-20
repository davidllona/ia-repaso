/* Experimento: ida y vuelta de tamaños. Conv2D reduce n a m; Conv2DTranspose con los MISMOS k y s
   no siempre devuelve n: por eso existe output_padding. Todo se calcula con las fórmulas. */
Lab.register("curso3/c3m2-tamano-transpuesta", function (root, api) {
  var st = { n: 8, k: 3, s: 2, pad: "valid", fix: false };

  var view = api.view(root, { aspect: 2.6, minH: 205, maxH: 260, label: "Tres tiras de casillas: entrada, salida de la convolución y salida de la transpuesta" });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "n = tamaño de la entrada", min: 4, max: 16, step: 1, value: st.n, onInput: function (v) { st.n = v; update(); } });
  ui.slider({ label: "k = tamaño del kernel", min: 1, max: 7, step: 1, value: st.k, onInput: function (v) { st.k = v; update(); } });
  ui.slider({ label: "s = stride", min: 1, max: 4, step: 1, value: st.s, onInput: function (v) { st.s = v; update(); } });
  ui.segmented({ label: "padding", options: [["valid", "valid"], ["same", "same"]], value: "valid", onChange: function (v) { st.pad = v; update(); } });
  ui.toggle({ label: "Añadir output_padding para recuperar n", value: false, onChange: function (v) { st.fix = v; update(); } });

  function calc() {
    var n = st.n, k = st.k, s = st.s, m, t, used, lost = 0, op = 0;
    if (st.pad === "valid") {
      if (n < k) return { ok: false };
      m = Math.floor((n - k) / s) + 1;
      used = (m - 1) * s + k; lost = n - used;
      t = (m - 1) * s + k;
      if (st.fix) { op = lost; t += op; }
    } else {
      m = Math.ceil(n / s); used = n; t = m * s;
    }
    return { ok: true, n: n, k: k, s: s, m: m, t: t, used: used, lost: lost, op: op };
  }

  view.draw(function (ctx, w, h, C) {
    var D = api.d, R = calc(), x0 = 8, rowH = (h - 16) / 3;
    if (!R.ok) { D.text(ctx, "El kernel (" + st.k + ") no cabe en la entrada (" + st.n + "): no hay salida.", w / 2, h / 2, { size: 13, weight: 600, align: "center", color: C.terracotaInk }); return; }
    var maxN = Math.max(R.n, R.t, 8), cw = Math.min(30, (w - 16) / maxN), i;
    function strip(row, count, label, fillFn, markFn) {
      var y = 6 + row * rowH + 18, ch = Math.min(cw, rowH - 26);
      D.text(ctx, label, x0, y - 6, { size: Math.min(11.5, w / 34), weight: 600, color: C.ink2 });
      for (i = 0; i < count; i++) {
        var x = x0 + i * cw;
        D.rect(ctx, x, y, cw, ch, fillFn(i), C.line, 1);
        if (cw >= 16) D.text(ctx, String(i + 1), x + cw / 2, y + ch / 2 + 4, { size: Math.min(10, cw * 0.38), align: "center", mono: true, color: C.muted });
        if (markFn) markFn(i, x, y, ch);
      }
      return { y: y, ch: ch };
    }
    /* 1) entrada */
    var s1 = strip(0, R.n, "Entrada: n = " + R.n, function () { return C.cobaltoWash; }, function (i, x, y, ch) {
      if (st.pad === "valid" && i >= R.used) {
        D.line(ctx, x + 3, y + 3, x + cw - 3, y + ch - 3, C.terracota, 2); D.line(ctx, x + cw - 3, y + 3, x + 3, y + ch - 3, C.terracota, 2);
      }
    });
    if (st.pad === "valid" && R.lost > 0) D.text(ctx, R.lost + " casilla(s) que ninguna ventana mira", x0 + R.used * cw + (R.lost * cw) / 2, s1.y + s1.ch + 12, { size: Math.min(10, w / 36), align: "center", color: C.terracotaInk });
    /* 2) tras la convolución */
    strip(1, R.m, "Tras Conv2D(k=" + R.k + ", s=" + R.s + ", " + st.pad + "): m = " + R.m, function () { return C.oliva; }, function (i, x, y, ch) {
      D.text(ctx, String(i + 1), x + cw / 2, y + ch / 2 + 4, { size: Math.min(10, cw * 0.38), align: "center", mono: true, color: C.paper });
    });
    /* 3) tras la transpuesta */
    var s3 = strip(2, R.t, "Tras Conv2DTranspose(k=" + R.k + ", s=" + R.s + ", " + st.pad + (R.op ? ", output_padding=" + R.op : "") + "): " + R.t, function (i) {
      return (i >= R.n) ? C.terracotaWash : (i >= R.t - R.op && R.op ? C.markerWash : C.terracotaWash);
    }, function (i, x, y, ch) { if (i >= R.n) D.rect(ctx, x, y, cw, ch, null, C.terracota, 2); });
    /* referencia: contorno de n */
    D.rect(ctx, x0, s3.y - 1, R.n * cw, s3.ch + 2, null, C.ink, 2);
    if (R.t < R.n) {
      for (i = R.t; i < R.n; i++) D.rect(ctx, x0 + i * cw, s3.y, cw, s3.ch, null, C.terracota, 1.5);
      D.text(ctx, "faltan " + (R.n - R.t), x0 + R.t * cw + ((R.n - R.t) * cw) / 2, s3.y + s3.ch + 12, { size: Math.min(10.5, w / 34), align: "center", color: C.terracotaInk, weight: 600 });
    }
  });

  function update() {
    var R = calc(), html;
    view.redraw();
    if (!R.ok) { out.set("<span class='bad'>n &lt; k: la convolución no cabe.</span>"); return; }
    if (st.pad === "valid") {
      html = "Conv2D: m = ⌊(n − k)/s⌋ + 1 = ⌊(" + R.n + " − " + R.k + ")/" + R.s + "⌋ + 1 = <b>" + R.m + "</b><br>" +
        "Transpuesta: (m − 1)·s + k" + (R.op ? " + output_padding" : "") + " = (" + R.m + " − 1)·" + R.s + " + " + R.k + (R.op ? " + " + R.op : "") + " = <b>" + R.t + "</b><br>";
      if (R.t === R.n) html += "<span class='good'>Recupera n = " + R.n + "</span>" + (R.op ? " gracias a output_padding = " + R.op : " (sin necesidad de output_padding: " + (R.n - R.k) + " es múltiplo de " + R.s + ")");
      else html += "<span class='bad'>No recupera n = " + R.n + ": faltan " + (R.n - R.t) + "</span>. Lo perdido es (n − k) mod s = (" + (R.n - R.k) + " mod " + R.s + ") = " + R.lost + "; activa output_padding = " + R.lost + ".";
    } else {
      html = "Conv2D same: m = ⌈n/s⌉ = ⌈" + R.n + "/" + R.s + "⌉ = <b>" + R.m + "</b><br>Transpuesta same: m·s = " + R.m + "·" + R.s + " = <b>" + R.t + "</b><br>" +
        (R.t === R.n ? "<span class='good'>Recupera n</span> (" + R.s + " divide a " + R.n + ")" : "<span class='bad'>Se pasa: " + R.t + " ≠ " + R.n + "</span> (con same la transpuesta siempre da m·s; si s no divide a n hay que recortar con Cropping2D o cuidar los tamaños).");
    }
    out.set(html);
  }
  update();
});
