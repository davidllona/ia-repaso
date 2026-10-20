/* Experimento: los gradientes se ACUMULAN en .grad. Modo 1: llamar varias veces a backward() sobre y = w² (w = 2) apila
   4, 8, 12… hasta que se llama a zero_(). Modo 2: el mismo bucle de descenso para L = (w − 3)², con y sin zero_grad. */
Lab.register("curso4/c4m1-acumula", function (root, api) {
  var D = api.d, M = api.math;
  var st = { mode: "acum", n: 0, grad: 0, lr: 0.1, iters: 8, hasGrad: false };
  var view = api.view(root, { aspect: 1.9, minH: 250, maxH: 340, label: "Gradiente acumulado en .grad o trayectorias del descenso con y sin zero_grad" });
  var ui = api.controls(root), out = api.readout(root);
  ui.segmented({ label: "Qué quieres ver", value: "acum", options: [["acum", "backward() repetido"], ["bucle", "Un bucle de descenso"]], onChange: function (v) { st.mode = v; vis(); update(); } });
  var b1 = ui.button("y = w**2;  y.backward()", function () { st.n++; st.grad += 4; st.hasGrad = true; update(); }, "primary");
  var b2 = ui.button("w.grad.zero_()", function () { st.n = 0; st.grad = 0; st.hasGrad = true; update(); }, "warm");
  var slr = ui.slider({ label: "Tasa de aprendizaje lr", min: 0.05, max: 0.4, step: 0.01, value: 0.1, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { st.lr = v; update(); } });
  var sit = ui.slider({ label: "Iteraciones del bucle", min: 1, max: 10, step: 1, value: 8, onInput: function (v) { st.iters = v; update(); } });
  function hide(el, on) { var c = el.closest(".ctl"); if (c) c.style.display = on ? "none" : ""; }
  function vis() { var a = st.mode === "acum"; b1.style.display = a ? "" : "none"; b2.style.display = a ? "" : "none"; hide(slr.input, a); hide(sit.input, a); }
  function paths() {
    var ok = [0], bad = [0], gbad = [], gok = [], acc = 0, wo = 0, wb = 0, k;
    for (k = 0; k < st.iters; k++) {
      var go = 2 * (wo - 3); gok.push(go); wo -= st.lr * go; ok.push(wo);
      var gb = 2 * (wb - 3); acc += gb; gbad.push(acc); wb -= st.lr * acc; bad.push(wb);
    }
    return { ok: ok, bad: bad, gok: gok, gbad: gbad };
  }
  function drawAcum(ctx, w, h, C) {
    var bx = w * 0.3, bw = Math.min(110, w * 0.25), base = h - 44, unit = Math.min(22, (base - 30) / 9), i;
    D.text(ctx, "w = 2.0 · y = w²  →  cada backward() suma dy/dw = 2w = 4", w / 2, 18, { align: "center", size: 11.5, color: C.ink2, weight: 600 });
    D.line(ctx, bx - 12, base, bx + bw + 12, base, C.ink, 2);
    for (i = 0; i < st.n && i < 9; i++) {
      D.rect(ctx, bx, base - (i + 1) * unit, bw, unit - 2, i % 2 ? C.terracotaWash : C.cobaltoWash, C.ink, 1.2);
      D.text(ctx, "+4", bx + bw / 2, base - i * unit - unit / 2 + 2, { align: "center", size: 11, mono: true, weight: 700 });
    }
    if (st.n > 9) D.text(ctx, "…", bx + bw / 2, base - 9 * unit - 6, { align: "center", size: 14, weight: 700 });
    D.text(ctx, "w.grad = " + (st.hasGrad ? st.grad.toFixed(1) : "None"), bx + bw + 24, base - Math.min(st.n, 9) * unit / 2 - 2, { size: 14, mono: true, weight: 700, color: st.grad === 4 || !st.hasGrad ? C.olivaInk : C.terracotaInk });
    D.text(ctx, st.n <= 1 ? (st.hasGrad ? "correcto (dy/dw = 4)" : "") : (w < 460 ? "¡acumulado! (correcto: 4)" : "¡acumulado! el valor correcto seguiría siendo 4"), bx + bw + 24, base - Math.min(st.n, 9) * unit / 2 + 16, { size: 11, color: st.n > 1 ? C.terracotaInk : C.olivaInk });
    D.text(ctx, "llamadas a backward() desde el último zero_(): " + st.n, w / 2, h - 10, { align: "center", size: 11, color: C.muted });
  }
  function drawBucle(ctx, w, h, C) {
    var P = paths(), p = api.plot(view, { xr: [-1, 7], yr: [0, 18], xticks: 8, yticks: 3, pad: { l: 36, r: 10, t: 14, b: 40 }, xlabel: "w", xfmt: function (t) { return Math.round(t); } });
    p.axes(ctx); ctx.save(); p.clip(ctx);
    D.path(ctx, M.linspace(-1, 7, 120).map(function (x) { return [p.x(x), p.y((x - 3) * (x - 3))]; }), C.ink, 2);
    function trace(arr, color, off) {
      var pts = arr.map(function (v) { return [p.x(M.clamp(v, -1, 7)), p.y(Math.min(18, (v - 3) * (v - 3))) + off]; });
      D.path(ctx, pts, color, 1.6, [4, 3]);
      pts.forEach(function (q, i) { D.circle(ctx, q[0], q[1], i === 0 ? 4 : 3, color); });
    }
    trace(P.bad, C.terracota, -5); trace(P.ok, C.oliva, 5);
    ctx.restore();
    D.text(ctx, "L(w) = (w − 3)²", p.box.x + 6, p.box.y + 14, { size: 11, mono: true, weight: 700 });
    D.text(ctx, "● con zero_grad (correcto)", p.box.x + p.box.w - 6, p.box.y + 14, { size: 10.5, align: "right", color: C.olivaInk, weight: 600 });
    D.text(ctx, "● sin zero_grad (acumula)", p.box.x + p.box.w - 6, p.box.y + 28, { size: 10.5, align: "right", color: C.terracotaInk, weight: 600 });
  }
  view.draw(function (ctx, w, h, C) { if (st.mode === "acum") drawAcum(ctx, w, h, C); else drawBucle(ctx, w, h, C); });
  function update() {
    var s;
    if (st.mode === "acum") {
      s = "Llamadas seguidas a <b>backward()</b>: " + st.n + " → <b>w.grad = " + (st.hasGrad ? st.grad.toFixed(1) : "None") + "</b>" +
        "<br>Cada llamada <b>suma</b> el nuevo gradiente a lo que ya había (4 + 4 + 4…). <code>zero_()</code> lo pone a 0." +
        (st.n > 1 ? "<br><span class='bad'>Si usaras este valor para actualizar w, darías un paso " + st.n + " veces demasiado grande.</span>" : "");
    } else {
      var P = paths(), k, lines = "";
      for (k = 0; k < Math.min(st.iters, 4); k++) lines += "<br>paso " + (k + 1) + ": con zero_grad grad = " + P.gok[k].toFixed(2) + " → w = " + P.ok[k + 1].toFixed(3) + " · sin: grad = " + P.gbad[k].toFixed(2) + " → w = " + P.bad[k + 1].toFixed(3);
      s = "lr = " + st.lr.toFixed(2) + " · " + st.iters + " iteraciones · objetivo w = 3" + lines +
        "<br>Tras " + st.iters + " pasos: con zero_grad w = <b>" + P.ok[st.iters].toFixed(3) + "</b> · sin zero_grad w = <b>" + P.bad[st.iters].toFixed(3) + "</b>";
    }
    out.set(s); view.redraw();
  }
  vis(); update();
});
