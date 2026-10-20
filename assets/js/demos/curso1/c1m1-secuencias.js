/* Experimento: minería de secuencias. Simula sesiones de una plataforma de streaming y cuenta qué pantalla sigue a cuál. */
Lab.register("curso1/c1m1-secuencias", function (root, api) {
  var N = 300, seed = 11, pPago = 0.7, sesiones = [];
  var ui = api.controls(root), out = api.readout(root);
  var ej = api.el("div", { style: { fontFamily: "'IBM Plex Mono',monospace", fontSize: "0.78rem", lineHeight: "1.5", display: "grid", gap: "0.25rem" } });
  root.appendChild(ej);
  var tabla = api.table(root, ["Transición (A → B)", "Veces", ""]);
  (function () { var st = document.createElement("style"); st.textContent = ".lab-table.c1m1-tb td,.lab-table.c1m1-tb th{padding:.3rem .28rem!important}@media (max-width:560px){.lab-table.c1m1-tb{font-size:.72rem!important}.lab-table.c1m1-tb th{font-size:.6rem!important}}"; root.appendChild(st); tabla.el.firstChild.classList.add("c1m1-tb"); })();

  ui.slider({ label: "Prob. de abandonar al ver el pago extra", min: 0.05, max: 0.95, step: 0.05, value: pPago,
    fmt: function (v) { return Math.round(v * 100) + " %"; }, onInput: function (v) { pPago = v; simular(); } });
  ui.button("Simular otras 300 sesiones", function () { seed += 7; simular(); }, "primary");

  function grafo() {
    return {
      "Inicio": [["Serie", 1]],
      "Serie": [["Tráiler", 0.40], ["Pago extra", 0.30], ["Episodio 1", 0.30]],
      "Tráiler": [["Episodio 1", 0.60], ["Pago extra", 0.25], ["Abandona", 0.15]],
      "Pago extra": [["Abandona", pPago], ["Episodio 1", 1 - pPago]],
      "Episodio 1": [["Episodio 2", 0.85], ["Abandona", 0.15]],
      "Episodio 2": [["Final", 0.90], ["Abandona", 0.10]]
    };
  }
  function simular() {
    var r = api.rng(seed), G = grafo(), i;
    sesiones = [];
    for (i = 0; i < N; i++) {
      var s = ["Inicio"], cur = "Inicio";
      while (cur !== "Final" && cur !== "Abandona") {
        var opts = G[cur], u = r.next(), acc = 0, nxt = opts[opts.length - 1][0], j;
        for (j = 0; j < opts.length; j++) { acc += opts[j][1]; if (u < acc) { nxt = opts[j][0]; break; } }
        s.push(nxt); cur = nxt;
      }
      sesiones.push(s);
    }
    mostrar();
  }
  function mostrar() {
    var trans = {}, visitas = {}, finales = 0, e;
    sesiones.forEach(function (s) {
      var i;
      for (i = 0; i < s.length; i++) visitas[s[i]] = (visitas[s[i]] || 0) + 1;
      for (i = 0; i < s.length - 1; i++) { var key = s[i] + " → " + s[i + 1]; trans[key] = (trans[key] || 0) + 1; }
      if (s[s.length - 1] === "Final") finales++;
    });
    var lista = Object.keys(trans).map(function (k) { return [k, trans[k]]; }).sort(function (a, b) { return b[1] - a[1]; });
    var max = lista[0][1];
    tabla.set(lista.slice(0, 9).map(function (t) {
      var fuga = /→ Abandona$/.test(t[0]), ancho = Math.max(3, Math.round(100 * t[1] / max));
      return [fuga ? "<b style='color:var(--terracota-ink)'>" + t[0] + "</b>" : t[0], t[1],
        "<div style='display:inline-block;vertical-align:middle;height:9px;min-width:30px;width:" + ancho + "%;background:" + (fuga ? "var(--terracota)" : "var(--cobalto)") + "'></div>"];
    }));
    /* El paso con mayor fuga: de cada página, qué fracción de las visitas acaba en «Abandona». */
    var peor = null;
    Object.keys(trans).forEach(function (k) {
      if (!/→ Abandona$/.test(k)) return;
      var origen = k.split(" → ")[0], frac = trans[k] / visitas[origen];
      if (!peor || frac > peor.frac) peor = { origen: origen, n: trans[k], v: visitas[origen], frac: frac };
    });
    out.set("Sesiones: <b>" + N + "</b> · llegan al final de la temporada: <b>" + finales + "</b> (" + (100 * finales / N).toFixed(1) + " %) · abandonos: <b>" + (N - finales) + "</b><br>" +
      "Mayor fuga: <span class='bad'>" + peor.origen + " → Abandona</span> en <b>" + peor.n + " de " + peor.v + "</b> visitas (<b>" + (100 * peor.frac).toFixed(0) + " %</b>)");
    ej.innerHTML = "";
    sesiones.slice(0, 4).forEach(function (s, i) {
      var buena = s[s.length - 1] === "Final";
      ej.appendChild(api.el("div", { style: { color: buena ? "var(--oliva-ink)" : "var(--terracota-ink)" } }, "Sesión " + (i + 1) + ": " + s.join(" → ")));
    });
  }
  simular();
});
