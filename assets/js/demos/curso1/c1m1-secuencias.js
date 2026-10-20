/* Experimento: minería de secuencias. Simula sesiones de una tienda online y cuenta qué paso sigue a cuál. */
Lab.register("curso1/c1m1-secuencias", function (root, api) {
  var N = 300, seed = 11, pEnvio = 0.7, sesiones = [];
  var ui = api.controls(root), out = api.readout(root);
  var ej = api.el("div", { style: { fontFamily: "'IBM Plex Mono',monospace", fontSize: "0.78rem", lineHeight: "1.5", display: "grid", gap: "0.25rem" } });
  root.appendChild(ej);
  var tabla = api.table(root, ["Transición (A → B)", "Veces", ""]);

  ui.slider({ label: "Prob. de abandonar al ver los gastos de envío", min: 0.05, max: 0.95, step: 0.05, value: pEnvio,
    fmt: function (v) { return Math.round(v * 100) + " %"; }, onInput: function (v) { pEnvio = v; simular(); } });
  ui.button("Simular otras 300 sesiones", function () { seed += 7; simular(); }, "primary");

  function grafo() {
    return {
      "Inicio": [["Producto", 1]],
      "Producto": [["Opiniones", 0.40], ["Gastos de envío", 0.30], ["Carrito", 0.30]],
      "Opiniones": [["Carrito", 0.60], ["Gastos de envío", 0.25], ["Abandona", 0.15]],
      "Gastos de envío": [["Abandona", pEnvio], ["Carrito", 1 - pEnvio]],
      "Carrito": [["Checkout", 0.85], ["Abandona", 0.15]],
      "Checkout": [["Compra", 0.90], ["Abandona", 0.10]]
    };
  }
  function simular() {
    var r = api.rng(seed), G = grafo(), i;
    sesiones = [];
    for (i = 0; i < N; i++) {
      var s = ["Inicio"], cur = "Inicio";
      while (cur !== "Compra" && cur !== "Abandona") {
        var opts = G[cur], u = r.next(), acc = 0, nxt = opts[opts.length - 1][0], j;
        for (j = 0; j < opts.length; j++) { acc += opts[j][1]; if (u < acc) { nxt = opts[j][0]; break; } }
        s.push(nxt); cur = nxt;
      }
      sesiones.push(s);
    }
    mostrar();
  }
  function mostrar() {
    var trans = {}, visitas = {}, compras = 0, e;
    sesiones.forEach(function (s) {
      var i;
      for (i = 0; i < s.length; i++) visitas[s[i]] = (visitas[s[i]] || 0) + 1;
      for (i = 0; i < s.length - 1; i++) { var key = s[i] + " → " + s[i + 1]; trans[key] = (trans[key] || 0) + 1; }
      if (s[s.length - 1] === "Compra") compras++;
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
    out.set("Sesiones: <b>" + N + "</b> · compras: <b>" + compras + "</b> (" + (100 * compras / N).toFixed(1) + " %) · abandonos: <b>" + (N - compras) + "</b><br>" +
      "Mayor fuga: <span class='bad'>" + peor.origen + " → Abandona</span> en <b>" + peor.n + " de " + peor.v + "</b> visitas (<b>" + (100 * peor.frac).toFixed(0) + " %</b>)");
    ej.innerHTML = "";
    sesiones.slice(0, 4).forEach(function (s, i) {
      var buena = s[s.length - 1] === "Compra";
      ej.appendChild(api.el("div", { style: { color: buena ? "var(--oliva-ink)" : "var(--terracota-ink)" } }, "Sesión " + (i + 1) + ": " + s.join(" → ")));
    });
  }
  simular();
});
