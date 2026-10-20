/* Experimento: artefactos de tablero de ajedrez. Cuenta cuántos "sellos" suman en cada casilla
   de una Conv2DTranspose (k, stride) y lo compara con UpSampling2D + Conv2D. */
Lab.register("curso3/c3m2-tablero-ajedrez", function (root, api) {
  var st = { n: 4, k: 3, s: 2 };

  function countsT(n, k, s) {          /* sellos por posición en 1-D, Conv2DTranspose valid */
    var F = (n - 1) * s + k, c = new Array(F).fill(0), i, a;
    for (i = 0; i < n; i++) for (a = 0; a < k; a++) c[i * s + a]++;
    return c;
  }
  function countsR(n, k, s) {          /* términos por posición en 1-D, UpSampling(s) + Conv(k, same) con entrada de unos */
    var N = n * s, c = new Array(N).fill(0), lo = Math.floor((k - 1) / 2), hi = k - 1 - lo, x, d;
    for (x = 0; x < N; x++) for (d = -lo; d <= hi; d++) if (x + d >= 0 && x + d < N) c[x]++;
    return c;
  }
  function interior(c, a, b) { return c.slice(a, b + 1); }
  function distinct(arr) { var m = {}, out = []; arr.forEach(function (v) { if (!m[v]) { m[v] = 1; out.push(v); } }); return out.sort(function (x, y) { return x - y; }); }

  var grid = api.el("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))", gap: "10px" } });
  root.appendChild(grid);
  function cellDiv() { var c = api.el("div", { style: { minWidth: "0" } }); grid.appendChild(c); return c; }
  var vA = api.view(cellDiv(), { aspect: 1, minH: 230, maxH: 400, label: "Mapa de sellos superpuestos de una Conv2DTranspose" });
  var vB = api.view(cellDiv(), { aspect: 1, minH: 230, maxH: 400, label: "Mapa de términos de UpSampling2D más Conv2D" });
  var ui = api.controls(root), out = api.readout(root);
  ui.slider({ label: "n = lado de la entrada", min: 3, max: 6, step: 1, value: st.n, onInput: function (v) { st.n = v; update(); } });
  ui.slider({ label: "k = lado del kernel", min: 1, max: 6, step: 1, value: st.k, onInput: function (v) { st.k = v; update(); } });
  ui.slider({ label: "s = stride (factor de ampliación)", min: 1, max: 4, step: 1, value: st.s, onInput: function (v) { st.s = v; update(); } });
  ui.button("k = 3, s = 2 (el clásico, con tablero)", function () { setAll(4, 3, 2); });
  ui.button("k = 4, s = 2 (k múltiplo de s)", function () { setAll(4, 4, 2); });
  ui.button("k = 2, s = 2 (sin solape)", function () { setAll(4, 2, 2); });
  var sliders = root.querySelectorAll("input[type=range]");
  function setAll(n, k, s) {
    st.n = n; st.k = k; st.s = s;
    [n, k, s].forEach(function (v, i) { sliders[i].value = v; sliders[i].dispatchEvent(new Event("input")); });
  }

  function heat(view, c1, title, sub) {
    view.draw(function (ctx, w, h, C) {
      var D = api.d, N = c1.length, sz = Math.max(6, Math.min((w - 12) / N, (h - 50) / N)), x0 = (w - sz * N) / 2, y0 = 34, i, j, mx = 1;
      c1.forEach(function (v) { if (v > mx) mx = v; });
      mx = mx * mx;
      D.text(ctx, title, w / 2, 14, { size: Math.min(12, w / 26), weight: 600, align: "center", color: C.ink2 });
      D.text(ctx, sub, w / 2, 28, { size: Math.min(10.5, w / 30), align: "center", color: C.muted });
      for (i = 0; i < N; i++) for (j = 0; j < N; j++) {
        var v = c1[i] * c1[j], x = x0 + j * sz, y = y0 + i * sz;
        D.rect(ctx, x, y, sz, sz, C.surface);
        if (v > 0) { ctx.save(); ctx.globalAlpha = 0.12 + 0.88 * v / mx; D.rect(ctx, x, y, sz, sz, C.cobalto); ctx.restore(); }
        D.rect(ctx, x, y, sz, sz, null, C.line, 0.5);
        if (sz >= 17) D.text(ctx, String(v), x + sz / 2, y + sz / 2 + 4, { size: Math.min(12, sz * 0.42), align: "center", mono: true, weight: 600, color: (v / mx > 0.5) ? C.paper : C.ink });
      }
      D.rect(ctx, x0, y0, sz * N, sz * N, null, C.ink, 1.5);
    });
  }

  function update() {
    var n = st.n, k = st.k, s = st.s, cT = countsT(n, k, s), cR = countsR(n, k, s);
    heat(vA, cT, "Conv2DTranspose(k=" + k + ", s=" + s + ")", "casilla = nº de sellos que se suman · " + cT.length + "×" + cT.length);
    heat(vB, cR, "UpSampling2D(" + s + ") + Conv2D(" + k + ", same)", "casilla = nº de términos · " + cR.length + "×" + cR.length);
    var a = k - 1, b = (n - 1) * s, html;
    var dT = (a <= b) ? distinct(interior(cT, a, b)) : null;
    var rowT = cT.join(" ");
    html = "Una fila de la salida (sellos por posición, 1-D): <b>" + rowT + "</b>";
    if (dT) {
      html += "<br>Zona central (posiciones " + a + " a " + b + "): valores distintos = <b>" + dT.join(", ") + "</b> → " +
        (dT.length === 1 ? "<span class='good'>reparto uniforme: sin tablero</span>" : "<span class='bad'>reparto irregular: aparece el tablero (en 2-D el patrón se multiplica)</span>");
    } else html += "<br>La entrada es demasiado pequeña para que exista una zona central estable: sube n.";
    html += "<br>Regla: es uniforme cuando <b>k es múltiplo de s</b> (" + k + " mod " + s + " = " + (k % s) + ").";
    var dR = distinct(interior(cR, Math.ceil(k / 2), cR.length - 1 - Math.ceil(k / 2)));
    html += "<br>UpSampling + Conv: zona central = " + (dR.length ? dR.join(", ") : "—") + " términos por casilla en 1-D (" + (dR.length === 1 ? "<span class='good'>uniforme siempre</span>" : "casi uniforme") + "; solo cambian los bordes).";
    out.set(html);
  }
  update();
});
