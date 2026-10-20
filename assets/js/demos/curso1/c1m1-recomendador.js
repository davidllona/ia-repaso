/* Experimento: recomendador content-based vs collaborative vs híbrido, con similitud del coseno sobre una matriz usuario x producto. */
Lab.register("curso1/c1m1-recomendador", function (root, api) {
  var PROD = ["iPhone", "Funda", "AirPods", "Cargador MagSafe", "Batería MagSafe", "Teclado"];
  var CORTO = ["iPhone", "Funda", "AirPods", "Cargador", "Batería", "Teclado"];
  var RASGOS = ["Apple", "Móvil", "Audio", "MagSafe", "Escritorio"];
  var F = [[1, 1, 0, 0, 0], [0, 1, 0, 0, 0], [1, 0, 1, 0, 0], [1, 1, 0, 1, 0], [1, 1, 0, 1, 0], [0, 0, 0, 0, 1]];
  var USERS = ["David", "B", "C", "D"];
  var M0 = [[1, 1, 1, 0, 0, 0], [1, 1, 1, 0, 1, 0], [0, 0, 0, 0, 0, 1], [1, 1, 0, 1, 0, 0]];
  var M = M0.map(function (r) { return r.slice(); }), metodo = "hibrido", alfa = 0.5;

  var ui = api.controls(root);
  ui.segmented({ label: "Método que decide", options: [["content", "Content"], ["collab", "Collab."], ["hibrido", "Híbrido"]], value: metodo,
    onChange: function (v) { metodo = v; render(); } });
  ui.slider({ label: "Híbrido: peso del content-based (el resto, collaborative)", min: 0, max: 1, step: 0.1, value: alfa,
    fmt: function (v) { return Math.round(v * 100) + " %"; }, onInput: function (v) { alfa = v; render(); } });

  var tabM = api.el("div", { style: { display: "grid", gridTemplateColumns: "3.2rem repeat(6, minmax(0, 1fr))", gap: "0.2rem", alignItems: "center" } });
  root.appendChild(tabM);
  root.appendChild(api.el("p", { style: { margin: "0", fontSize: "0.78rem", color: "var(--muted)", lineHeight: "1.45" },
    html: "Haz clic en una casilla para cambiar quién ha comprado qué (✓ = comprado). <b>Rasgos:</b> iPhone = Apple + Móvil · Funda = Móvil · AirPods = Apple + Audio · Cargador y Batería = Apple + Móvil + MagSafe · Teclado = Escritorio." }));
  var res = api.el("div", { style: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) repeat(3, 3.6rem)", gap: "0.15rem 0.5rem", alignItems: "end", fontSize: "0.82rem" } });
  root.appendChild(res);
  var out = api.readout(root);

  function cos(a, b) {
    var d = api.math.dot(a, b), na = Math.sqrt(api.math.dot(a, a)), nb = Math.sqrt(api.math.dot(b, b));
    return na && nb ? d / (na * nb) : 0;
  }
  function calc() {
    var yo = M[0], n = PROD.length, i, j, k, comp = yo.reduce(function (a, b) { return a + b; }, 0);
    var perfil = RASGOS.map(function () { return 0; });
    if (comp) for (i = 0; i < n; i++) if (yo[i]) for (k = 0; k < RASGOS.length; k++) perfil[k] += F[i][k] / comp;
    var sim = [0], content = [], collab = [], quienes = [];
    for (j = 1; j < M.length; j++) sim.push(cos(yo, M[j]));
    for (i = 0; i < n; i++) {
      content.push(comp ? cos(perfil, F[i]) : 0);
      var s = 0, q = [];
      for (j = 1; j < M.length; j++) if (M[j][i] && sim[j] > 0) { s += sim[j]; q.push(USERS[j] + " (" + sim[j].toFixed(2) + ")"); }
      collab.push(s); quienes.push(q);
    }
    var libres = []; for (i = 0; i < n; i++) if (!yo[i]) libres.push(i);
    var mx = 0; libres.forEach(function (p) { if (collab[p] > mx) mx = collab[p]; });
    var filas = libres.map(function (p) {
      var cn = mx ? collab[p] / mx : 0;
      return { p: p, c: content[p], k: collab[p], kn: cn, h: alfa * content[p] + (1 - alfa) * cn, q: quienes[p] };
    });
    return { comp: comp, sim: sim, perfil: perfil, filas: filas };
  }
  function bar(v, on) {
    var w = Math.max(0, Math.min(1, v)) * 100;
    return "<div style='font-weight:" + (on ? 600 : 400) + "'>" + v.toFixed(2) + "</div><div style='margin-left:auto;height:" + (on ? 7 : 4) + "px;width:" + w + "%;background:" + (on ? "var(--terracota)" : "var(--cobalto)") + ";opacity:" + (on ? 1 : 0.55) + "'></div>";
  }
  function render() {
    var R = calc(), i, j, key = metodo === "content" ? "c" : metodo === "collab" ? "kn" : "h";
    /* matriz */
    tabM.innerHTML = "";
    tabM.appendChild(api.el("div"));
    CORTO.forEach(function (c, i2) { tabM.appendChild(api.el("div", { text: c, title: PROD[i2], style: { fontSize: "0.62rem", textAlign: "center", color: "var(--ink-2)", fontWeight: "500" } })); });
    USERS.forEach(function (u, r) {
      tabM.appendChild(api.el("div", { text: u, style: { fontWeight: r === 0 ? "700" : "400", fontSize: "0.85rem" } }));
      for (j = 0; j < PROD.length; j++) (function (r2, j2) {
        var on = M[r2][j2] === 1;
        var b = api.el("button", { type: "button", "aria-pressed": String(on), "aria-label": USERS[r2] + " ha comprado " + PROD[j2] + ": " + (on ? "sí" : "no"), text: on ? "✓" : "·",
          style: { width: "100%", minHeight: "1.9rem", padding: "0", border: "1px solid var(--line)", background: on ? (r2 === 0 ? "var(--marker-wash)" : "var(--cobalto-wash)") : "transparent", color: "var(--ink)", cursor: "pointer", font: "inherit", fontWeight: "600" } });
        b.addEventListener("click", function () { M[r2][j2] = M[r2][j2] ? 0 : 1; render(); });
        tabM.appendChild(b);
      })(r, j);
    });
    /* resultados */
    var filas = R.filas.slice().sort(function (a, b) { return b[key] - a[key]; });
    res.innerHTML = "";
    ["Aún no tiene…", "Content", "Collab.", "Híbrido"].forEach(function (h, k) {
      res.appendChild(api.el("div", { text: h, style: { fontSize: "0.7rem", fontWeight: "600", color: "var(--ink-2)", textAlign: k ? "right" : "left", borderBottom: "1px solid var(--line)", paddingBottom: "0.2rem" } }));
    });
    filas.forEach(function (f) {
      res.appendChild(api.el("div", { text: PROD[f.p], style: { fontFamily: "var(--font-mono)", paddingTop: "0.35rem" } }));
      [[f.c, "content"], [f.kn, "collab"], [f.h, "hibrido"]].forEach(function (c) {
        res.appendChild(api.el("div", { html: bar(c[0], metodo === c[1]), style: { textAlign: "right", fontFamily: "var(--font-mono)", paddingTop: "0.35rem" } }));
      });
    });
    /* explicación */
    var sims = USERS.slice(1).map(function (u, k) { return u + " " + R.sim[k + 1].toFixed(2); }).join(" · ");
    if (!R.comp) {
      out.set("<span class='bad'>David no ha comprado nada: no hay historial</span> y ninguno de los métodos sabe qué le gusta (el llamado <b>cold start</b>). Un sistema real recomendaría lo más popular: <b>" + popular() + "</b>.");
      return;
    }
    if (!filas.length) { out.set("David ya tiene todos los productos: no queda nada que recomendar."); return; }
    var top = filas[0], why;
    if (!(top[key] > 0)) { out.set("Parecido de David con los demás: <b>" + sims + "</b><br><span class='bad'>Ningún producto puntúa: con este método no hay nada que recomendar.</span>"); return; }
    var comp2 = RASGOS.filter(function (r, k) { return R.perfil[k] > 0 && F[top.p][k]; }).join(", ");
    if (metodo === "content") why = "porque comparte <b>" + (comp2 || "—") + "</b> con lo que ya compraste";
    else if (metodo === "collab") why = top.q.length ? "porque lo compraron personas parecidas a ti: <b>" + top.q.join(", ") + "</b>" : "—";
    else why = "mezcla " + Math.round(alfa * 100) + " % de parecido de producto (" + (comp2 || "—") + ") y " + Math.round((1 - alfa) * 100) + " % de gente parecida (" + (top.q.join(", ") || "nadie") + ")";
    out.set("Parecido (coseno) de David con los demás: <b>" + sims + "</b><br>Recomendación: <b>" + PROD[top.p] + "</b> (" + top[key].toFixed(2) + ") — " + why +
      (filas.length > 1 && Math.abs(filas[1][key] - top[key]) < 1e-9 ? "<br><span class='bad'>Empate con «" + PROD[filas[1].p] + "»: con este método no puede decidir.</span>" : ""));
  }
  function popular() {
    var cnt = PROD.map(function (p, i) { return [p, M.reduce(function (a, r) { return a + r[i]; }, 0)]; }).sort(function (a, b) { return b[1] - a[1]; });
    return cnt[0][0] + " (" + cnt[0][1] + " compras)";
  }
  render();
});
