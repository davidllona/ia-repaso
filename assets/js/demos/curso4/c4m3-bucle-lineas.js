/* Experimento: el bucle de entrenamiento ejecutado línea a línea (con y sin zero_grad). */
Lab.register("curso4/c4m3-bucle-lineas", function (root, api) {
  var X = [1, 2, 3], Y = [2, 5, 8], n = 3, lr = 0.05, noZero = false;
  var w = 0, b = 0, gw = null, gb = null, yhat = null, loss = null, pc = 0, epoch = 0, run = [], msg = "";
  var LINES = [["yhat = model(x)", "paso hacia delante (forward)"], ["loss = criterion(yhat, y)", "el coste (MSE)"], ["optimizer.zero_grad()", "vaciar los .grad"], ["loss.backward()", "calcular los gradientes y SUMARLOS a .grad"], ["optimizer.step()", "w −= lr · w.grad"]];
  var host = api.el("div", { style: { display: "flex", flexWrap: "wrap", gap: "12px" } });
  root.appendChild(host);
  var codeBox = api.el("div", { style: { flex: "1 1 330px", minWidth: 0, padding: "8px 0", border: "1px solid " + api.colors().line, background: api.colors().paper } });
  var wrapC = api.el("div", { style: { flex: "1 1 300px", minWidth: 0 } });
  host.appendChild(codeBox); host.appendChild(wrapC);
  var vC = api.view(wrapC, { aspect: 1.5, minH: 190, label: "MSE en cada época: con zero_grad y sin zero_grad" });
  api.legend(wrapC, [[api.colors().oliva, "con zero_grad (curva verde)"], [api.colors().terracota, "sin zero_grad (curva roja)"]]);
  var pC = api.plot(vC, { xr: [0, 30], yr: [0, 40], xticks: 6, yticks: 4, xlabel: "época", ylabel: "MSE", pad: { l: 40, r: 12, t: 12, b: 36 } });
  var ui = api.controls(root);
  ui.slider({ label: "learning rate", min: 0.01, max: 0.08, step: 0.01, value: lr, fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { lr = v; restart(); } });
  ui.toggle({ label: "Quitar optimizer.zero_grad()", value: false, onChange: function (on) { noZero = on; restart(); } });
  ui.button("Ejecutar la línea ▶", function () { stepLine(); }, "primary");
  ui.button("Una época entera", function () { var k = 0; do { stepLine(); k++; } while (pc !== 0 && k < 10); });
  ui.button("10 épocas", function () { for (var q = 0; q < 50; q++) stepLine(); });
  var out = api.readout(root);
  window.addEventListener("lab:theme", function () { if (host.isConnected) render(); });

  function sim(acc, N) {
    var ww = 0, bb = 0, a = 0, c = 0, o = [], k, i;
    for (k = 0; k < N; k++) {
      var m = 0, dw = 0, db = 0;
      for (i = 0; i < n; i++) { var e = ww * X[i] + bb - Y[i]; m += e * e / n; dw += 2 * e * X[i] / n; db += 2 * e / n; }
      if (!acc) { a = 0; c = 0; } a += dw; c += db; ww -= lr * a; bb -= lr * c; o.push(m);
    }
    return o;
  }
  function restart() { w = 0; b = 0; gw = null; gb = null; yhat = null; loss = null; pc = 0; epoch = 0; run = []; msg = "Pulsa «Ejecutar la línea» y mira qué cambia en cada paso."; render(); }
  function f(v, k) { return v === null ? "None" : v.toFixed(k === undefined ? 3 : k); }
  function stepLine() {
    var i, dw = 0, db = 0;
    if (pc === 0) { yhat = X.map(function (x) { return w * x + b; }); msg = "forward: predice las horas de las 3 películas, ŷ = w·x + b con w = " + f(w) + ", b = " + f(b) + "."; }
    else if (pc === 1) { loss = 0; for (i = 0; i < n; i++) loss += (yhat[i] - Y[i]) * (yhat[i] - Y[i]) / n; run.push(loss); msg = "MSE = " + f(loss, 4) + ". (Esta época se anota en la gráfica.)"; }
    else if (pc === 2) {
      if (noZero) msg = "(esta línea no está: los .grad se quedan como estaban)";
      else { gw = null; gb = null; msg = "zero_grad(): w.grad y b.grad pasan a None (en PyTorch 2.x, por defecto)."; }
    } else if (pc === 3) {
      for (i = 0; i < n; i++) { var e = yhat[i] - Y[i]; dw += 2 * e * X[i] / n; db += 2 * e / n; }
      msg = "backward(): dw = " + f(dw) + ", db = " + f(db) + (gw === null ? " (antes: None) → se guardan tal cual." : " se SUMAN a los de antes (" + f(gw) + ", " + f(gb) + ") → " + f(gw + dw) + ", " + f(gb + db) + ".");
      gw = (gw === null ? 0 : gw) + dw; gb = (gb === null ? 0 : gb) + db;
    } else {
      msg = "step(): w = " + f(w) + " − " + lr.toFixed(2) + "·(" + f(gw) + ") = " + f(w - lr * gw) + " · b = " + f(b) + " − " + lr.toFixed(2) + "·(" + f(gb) + ") = " + f(b - lr * gb);
      w -= lr * gw; b -= lr * gb; epoch++;
    }
    pc = (pc + 1) % 5; render();
  }
  function render() {
    var C = api.colors(), i, h = "";
    codeBox.innerHTML = "";
    codeBox.style.borderColor = C.line; codeBox.style.background = C.paper;
    codeBox.appendChild(api.el("div", { style: { font: "600 11px 'IBM Plex Mono',monospace", color: C.muted, padding: "0 10px 4px" }, text: "for epoch in range(...):   # una época = una vuelta" }));
    for (i = 0; i < 5; i++) {
      var off = noZero && i === 2, cur = i === pc;
      var line = api.el("div", { style: { display: "flex", gap: "8px", padding: "3px 10px", font: "13px 'IBM Plex Mono',monospace", background: cur ? C.cobaltoWash : "transparent", borderLeft: "4px solid " + (cur ? C.cobalto : "transparent"), color: off ? C.muted : C.ink, textDecoration: off ? "line-through" : "none" } });
      line.appendChild(api.el("span", { style: { color: cur ? C.cobaltoInk : C.muted, width: "14px" }, text: cur ? "▶" : "" }));
      line.appendChild(api.el("span", { style: { flex: "1", whiteSpace: "nowrap" }, text: "    " + LINES[i][0] }));
      codeBox.appendChild(line);
      codeBox.appendChild(api.el("div", { style: { font: "11px 'IBM Plex Sans',sans-serif", color: C.muted, padding: "0 10px 3px 36px" }, text: "# " + LINES[i][1] }));
    }
    vC.redraw();
    out.set("época <b>" + epoch + "</b> · w = <b>" + f(w) + "</b> · b = <b>" + f(b) + "</b> · yhat = <b>" + (yhat ? "[" + yhat.map(function (v) { return v.toFixed(2); }).join(", ") + "]" : "—") + "</b> · loss = <b>" + (loss === null ? "—" : f(loss, 4)) + "</b><br>" +
      "w.grad = <b>" + f(gw) + "</b> · b.grad = <b>" + f(gb) + "</b><br>" + msg);
  }
  function drawC(ctx, W, H, C) {
    var D = api.d, a = sim(false, 31), c = sim(true, 31), i, ymax = 40;
    pC.axes(ctx); ctx.save(); pC.clip(ctx);
    D.path(ctx, a.map(function (v, i) { return [pC.x(i), pC.y(Math.min(v, ymax))]; }), C.oliva, noZero ? 1.5 : 3, noZero ? [4, 3] : []);
    D.path(ctx, c.map(function (v, i) { return [pC.x(i), pC.y(Math.min(v, ymax))]; }), C.terracota, noZero ? 3 : 1.5, noZero ? [] : [4, 3]);
    for (i = 0; i < run.length; i++) D.circle(ctx, pC.x(i), pC.y(Math.min(run[i], ymax)), 4, C.paper, noZero ? C.terracotaInk : C.olivaInk, 2);
    ctx.restore();
  }
  vC.draw(drawC);
  restart();
});
