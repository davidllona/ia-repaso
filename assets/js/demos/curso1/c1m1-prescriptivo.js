/* Experimento: descriptivo -> predictivo -> prescriptivo. Con la probabilidad de cancelar de cada cliente se elige la acción de mayor valor esperado. */
Lab.register("curso1/c1m1-prescriptivo", function (root, api) {
  var CLI = [["Ana", 3], ["Bruno", 12], ["Carla", 22], ["Diego", 29], ["Elena", 35], ["Fran", 45]];
  var V = 240, E = 0.4, sel = 4;
  var ACC = ["Nada", "Descuento 20 %", "Mes gratis", "Plan más barato"], CORTO = ["Nada", "Desc. 20 %", "Mes gratis", "Plan barato"];

  var ui = api.controls(root);
  ui.slider({ label: "Valor anual de un cliente", min: 60, max: 600, step: 20, value: V, fmt: function (v) { return v + " €"; }, onInput: function (v) { V = v; render(); } });
  ui.slider({ label: "Eficacia de las ofertas (baja la prob. de cancelar)", min: 0, max: 0.8, step: 0.05, value: E, fmt: function (v) { return Math.round(v * 100) + " %"; }, onInput: function (v) { E = v; render(); } });
  ui.select({ label: "Ver las cuentas de…", options: CLI.map(function (c, i) { return [i, c[0]]; }), value: sel, onChange: function (v) { sel = +v; render(); } });

  var capas = api.el("div", { style: { display: "grid", gap: "0.5rem", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" } });
  root.appendChild(capas);
  var tabla = api.table(root, ["Cliente", "Días", "P(canc.)", "Acción", "Gana €"]);
  (function () { var st = document.createElement("style"); st.textContent = ".lab-table.c1m1-tb td,.lab-table.c1m1-tb th{padding:.3rem .28rem!important}@media (max-width:560px){.lab-table.c1m1-tb{font-size:.7rem!important}.lab-table.c1m1-tb th{font-size:.6rem!important}}"; root.appendChild(st); tabla.el.firstChild.classList.add("c1m1-tb"); })();
  var out = api.readout(root);

  function prob(d) { return 1 / (1 + Math.exp(-(d - 25) / 6)); }
  /* Valor esperado de cada acción: (1 − probabilidad que queda) × lo que paga − coste fijo. */
  function ev(p) {
    return [
      { q: p, precio: V, coste: 0 },
      { q: p * (1 - E), precio: 0.8 * V, coste: 0 },
      { q: p * (1 - 0.75 * E), precio: V, coste: V / 12 },
      { q: p * (1 - 0.5 * E), precio: 0.7 * V, coste: 0 }
    ].map(function (a) { a.v = (1 - a.q) * a.precio - a.coste; return a; });
  }
  function eur(x) { return Math.round(x).toLocaleString("es-ES") + " €"; }
  function render() {
    var filas = [], totalGana = 0, esperadas = 0, riesgo = 0, sumD = 0, i;
    CLI.forEach(function (c) {
      var p = prob(c[1]), e = ev(p), b = 0, k;
      for (k = 1; k < 4; k++) if (e[k].v > e[b].v) b = k;
      filas.push({ n: c[0], d: c[1], p: p, e: e, b: b, gana: e[b].v - e[0].v });
      totalGana += e[b].v - e[0].v; esperadas += p; sumD += c[1]; if (c[1] > 30) riesgo++;
    });
    capas.innerHTML = "";
    [["1 · Descriptivo", "¿Qué ocurre?", "Los " + CLI.length + " clientes llevan de media <b>" + (sumD / CLI.length).toFixed(1) + " días</b> sin entrar; <b>" + riesgo + "</b> pasan de 30.", "var(--cobalto-wash)", "var(--cobalto)"],
     ["2 · Predictivo", "¿Qué va a pasar?", "El modelo calcula una probabilidad por cliente: se esperan <b>" + esperadas.toFixed(1) + "</b> cancelaciones de " + CLI.length + ".", "var(--marker-wash)", "var(--marker)"],
     ["3 · Prescriptivo", "¿Qué hacemos?", "Con la mejor acción para cada uno se ganan <b>" + eur(totalGana) + "</b> esperados más que sin hacer nada.", "var(--oliva-wash)", "var(--oliva)"]].forEach(function (c) {
      capas.appendChild(api.el("div", { style: { background: c[3], borderLeft: "4px solid " + c[4], padding: "0.5rem 0.7rem", fontSize: "0.85rem", lineHeight: "1.45" } },
        api.el("div", { style: { fontFamily: "var(--font-mono)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-2)" }, text: c[0] + " — " + c[1] }),
        api.el("div", { html: c[2] })));
    });
    tabla.set(filas.map(function (f, k) {
      return [(k === sel ? "<b>" + f.n + "</b>" : f.n), f.d, (f.p * 100).toFixed(0) + " %", f.b === 0 ? "Nada" : "<b>" + CORTO[f.b] + "</b>", f.gana > 0.5 ? "+" + Math.round(f.gana) : "—"];
    }));
    var f = filas[sel];
    out.set("<b>" + f.n + "</b>: " + f.d + " días sin entrar → P(cancelar) = <b>" + (f.p * 100).toFixed(0) + " %</b>. Valor esperado de cada acción = (1 − P que queda) × precio − coste:<br>" +
      f.e.map(function (a, k) {
        return (k === f.b ? "<b>→ " : "&nbsp;&nbsp;") + ACC[k] + ": (1 − " + a.q.toFixed(2) + ") × " + eur(a.precio) + (a.coste ? " − " + eur(a.coste) : "") + " = " + eur(a.v) + (k === f.b ? "</b>" : "");
      }).join("<br>"));
  }
  render();
});
