/* Experimento: atención softmax(Q K^T / raiz(d_k)) V con números editables (3 tokens, d_k = 2). Se puede escribir en las casillas o arrastrar
   las puntas de las flechas. Todo se recalcula: puntuaciones, escala, softmax y mezcla de valores. */
Lab.register("curso3/c3m3-atencion-manual", function (root, api) {
  var D = api.d, N = 3, DK = 2, TOK = ["Toy Story", "Titanic", "Shrek"];   // los 3 tokens son 3 títulos del historial (rasgos: animación, romance)
  var Q = [[1, 0], [0, 1], [1, 1]], K = [[2, 0], [0, 2], [1, 1]], V = [[1, 0], [0, 1], [1, 1]];
  var S = { q: 0, scale: true };
  var inputs = { Q: [], K: [], V: [] };
  function n(v, k) { return v.toFixed(k === undefined ? 2 : k).replace(".", ",").replace("-", "−"); }
  function sm(a) { var m = Math.max.apply(null, a), e = a.map(function (v) { return Math.exp(v - m); }), s = 0; e.forEach(function (v) { s += v; }); return e.map(function (v) { return v / s; }); }
  var R;
  function compute() {
    var sc = [], A = [], O = [], i, j, k, f = S.scale ? 1 / Math.sqrt(DK) : 1;
    for (i = 0; i < N; i++) {
      var row = []; for (j = 0; j < N; j++) { var d = 0; for (k = 0; k < DK; k++) d += Q[i][k] * K[j][k]; row.push(d); }
      sc.push(row); A.push(sm(row.map(function (v) { return v * f; })));
      var o = [0, 0]; for (j = 0; j < N; j++) for (k = 0; k < DK; k++) o[k] += A[i][j] * V[j][k]; O.push(o);
    }
    R = { sc: sc, A: A, O: O, f: f };
  }

  var view = api.view(root, { aspect: 1.9, minH: 210, maxH: 270, drag: true, label: "Plano animación (horizontal) y romance (vertical) con las etiquetas K de Toy Story, Titanic y Shrek (azul) y lo que busca el título elegido (naranja) como flechas que puedes arrastrar" });
  var plot = api.plot(view, { xr: [-3, 3], yr: [-3, 3], xticks: 6, yticks: 6, pad: { l: 26, r: 10, t: 8, b: 22 }, xfmt: function (v) { return Math.round(v); }, yfmt: function (v) { return Math.round(v); } });
  var view2 = api.view(root, { aspect: 2.7, minH: 150, maxH: 200, label: "Mapa de calor de los pesos de atención: filas = título que consulta, columnas = título consultado" });
  var grid = api.el("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, max-content)", justifyContent: "start", gap: ".4rem 1rem", margin: ".5rem 0", fontSize: ".82rem" } });
  root.appendChild(grid);
  ["Q", "K", "V"].forEach(function (nm) {
    var M = nm === "Q" ? Q : (nm === "K" ? K : V), tb = api.el("table", { style: { borderCollapse: "collapse", width: "auto", margin: "0" } }), i, j;
    tb.appendChild(api.el("caption", { text: nm + " (3 × 2)", style: { fontWeight: "600", textAlign: "left", fontSize: ".78rem" } }));
    for (i = 0; i < N; i++) {
      var tr = api.el("tr");
      for (j = 0; j < DK; j++) {
        (function (i, j) {
          var inp = api.el("input", { type: "number", step: "0.5", value: String(M[i][j]), "aria-label": nm + " fila " + (i + 1) + " columna " + (j + 1),
            style: { width: "2.8em", padding: ".15rem .2rem", fontFamily: "inherit", fontSize: ".85rem", textAlign: "right" } });
          inp.addEventListener("input", function () { var v = parseFloat(inp.value); if (isFinite(v)) { M[i][j] = v; update(true); } });
          inputs[nm][i * DK + j] = inp; tr.appendChild(api.el("td", { style: { padding: "1px" } }, inp));
        })(i, j);
      }
      tb.appendChild(tr);
    }
    grid.appendChild(tb);
  });
  var ui = api.controls(root), out = api.readout(root);
  out.el.style.fontSize = "clamp(.7rem, 2.6vw, .82rem)";
  ui.segmented({ label: "Consulta que miramos", value: 0, options: [[0, "q1"], [1, "q2"], [2, "q3"]], onChange: function (v) { S.q = v; update(true); } });
  ui.toggle({ label: "Dividir entre √d_k", value: true, onChange: function (v) { S.scale = v; update(true); } });
  ui.button("Números al azar", function () {
    var r = api.rng(Math.floor(Math.random() * 1e6));
    [Q, K, V].forEach(function (M) { M.forEach(function (row) { for (var j = 0; j < DK; j++) row[j] = Math.round(r.range(-2, 2) * 2) / 2; }); });
    update(false);
  });
  ui.button("Valores del texto", function () {
    var q0 = [[1, 0], [0, 1], [1, 1]], k0 = [[2, 0], [0, 2], [1, 1]];
    for (var i = 0; i < N; i++) for (var j = 0; j < DK; j++) { Q[i][j] = q0[i][j]; K[i][j] = k0[i][j]; V[i][j] = q0[i][j]; }
    update(false);
  });

  function tip(M, i) { return [plot.x(M[i][0]), plot.y(M[i][1])]; }
  function drawPlane(ctx, w, h, C) {
    plot.axes(ctx); var o = [plot.x(0), plot.y(0)], j; ctx.save(); plot.clip(ctx);
    for (j = 0; j < N; j++) {
      var t = tip(K, j); D.arrow(ctx, o[0], o[1], t[0], t[1], C.cobalto, 2.2); D.circle(ctx, t[0], t[1], 5, C.cobalto, C.paper, 1.5);
      var nearR = t[0] > view.w - 92;
      D.text(ctx, "k" + (j + 1) + " " + TOK[j], t[0] + (nearR ? -8 : 8), t[1] - 7, { size: 11, weight: 600, color: C.cobaltoInk, align: nearR ? "right" : "left" });
    }
    var tq = tip(Q, S.q); D.arrow(ctx, o[0], o[1], tq[0], tq[1], C.terracota, 2.6); D.circle(ctx, tq[0], tq[1], 6, C.terracota, C.paper, 1.5);
    D.text(ctx, "q" + (S.q + 1) + " " + TOK[S.q], tq[0] - 8, tq[1] + 16, { size: 11, weight: 700, color: C.terracotaInk, align: "right" });
    ctx.restore();
  }
  compute();
  view.draw(drawPlane);
  var drag = null;
  view.pointer({
    down: function (px, py) {
      var best = null, bd = 22 * 22, cand = [["Q", S.q]].concat([0, 1, 2].map(function (j) { return ["K", j]; }));
      cand.forEach(function (c) { var t = tip(c[0] === "Q" ? Q : K, c[1]), d2 = (t[0] - px) * (t[0] - px) + (t[1] - py) * (t[1] - py); if (d2 < bd) { bd = d2; best = c; } });
      drag = best;
    },
    drag: function (px, py) {
      if (!drag) return; var M = drag[0] === "Q" ? Q : K;
      M[drag[1]][0] = Math.max(-3, Math.min(3, Math.round(plot.ix(px) * 10) / 10)); M[drag[1]][1] = Math.max(-3, Math.min(3, Math.round(plot.iy(py) * 10) / 10));
      update(false);
    },
    up: function () { drag = null; }
  });
  view2.draw(function (ctx, w, h, C) {
    var L = 74, T = 22, cw = Math.min((w - L - 6) / N, 74), ch = Math.min((h - T - 4) / N, 44), i, j;
    for (j = 0; j < N; j++) D.text(ctx, TOK[j], L + cw * (j + 0.5), T - 7, { size: 10.5, align: "center", weight: 600 });
    for (i = 0; i < N; i++) {
      D.text(ctx, TOK[i], L - 8, T + ch * (i + 0.5) + 4, { size: 11, align: "right", weight: i === S.q ? 700 : 500, color: i === S.q ? C.terracotaInk : C.ink });
      for (j = 0; j < N; j++) {
        var v = R.A[i][j], x = L + cw * j, y = T + ch * i;
        D.rect(ctx, x, y, cw, ch, C.surface, C.line, 1);
        ctx.save(); ctx.globalAlpha = Math.min(1, 0.06 + v * 0.94); ctx.fillStyle = C.cobalto; ctx.fillRect(x + 1, y + 1, cw - 2, ch - 2); ctx.restore();
        D.text(ctx, n(v, 2), x + cw / 2, y + ch / 2 + 4, { size: 12, mono: true, align: "center", color: v > 0.5 ? C.paper : C.ink });
      }
    }
    D.rect(ctx, L, T + ch * S.q, cw * N, ch, null, C.terracota, 2.5);
  });
  view2.pointer({ down: function (px, py) {
    var T = 22, ch = Math.min((view2.h - T - 4) / N, 44), i = Math.floor((py - T) / ch);
    if (i >= 0 && i < N) { S.q = i; update(true); }
  } });

  function vec(v) { return "(" + v.map(function (x) { return n(x, 2); }).join("; ") + ")"; }
  function update(redrawPlane) {
    compute();
    ["Q", "K", "V"].forEach(function (nm) {
      var M = nm === "Q" ? Q : (nm === "K" ? K : V);
      for (var i = 0; i < N; i++) for (var j = 0; j < DK; j++) { var inp = inputs[nm][i * DK + j]; if (document.activeElement !== inp) inp.value = String(+M[i][j].toFixed(2)); }
    });
    view.redraw(); view2.redraw();
    var i = S.q, j, best = 0, parts = [];
    for (j = 0; j < N; j++) { if (R.A[i][j] > R.A[i][best]) best = j; parts.push(n(R.A[i][j], 2) + "·" + vec(V[j])); }
    out.set("<b>q" + (i + 1) + " (" + TOK[i] + ")</b> = " + vec(Q[i]) + "<br>" +
      "puntuaciones q·kⱼ = <b>" + R.sc[i].map(function (v) { return n(v, 2); }).join(" ; ") + "</b>" + (S.scale ? " → ÷√2 = <b>" + R.sc[i].map(function (v) { return n(v * R.f, 2); }).join(" ; ") + "</b>" : " (sin dividir)") + "<br>" +
      "pesos (softmax) = <b>" + R.A[i].map(function (v) { return n(v, 3); }).join(" ; ") + "</b> (suman " + n(R.A[i][0] + R.A[i][1] + R.A[i][2], 3) + ")<br>" +
      "salida = " + parts.join(" + ") + " = <b>" + vec(R.O[i]) + "</b><br>" +
      "Mira sobre todo a <b>k" + (best + 1) + " (" + TOK[best] + ")</b> (" + n(R.A[i][best] * 100, 1) + " %).");
  }
  update(false);
});
