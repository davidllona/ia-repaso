/* Experimento: la matriz de confusión. Tú cambias las decisiones del modelo y ves qué casilla cambia y qué TIPO de error cometes. */
Lab.register("curso1/c1m1-confusion", function (root, api) {
  var CORREOS = ["Gana un iPhone gratis", "Herencia millonaria", "Tu cuenta está bloqueada", "Pastillas milagro", "Último día: premio", "Reunión a las 10", "Factura de la luz", "Tu pedido ha salido", "Entrega de la tesis", "Acta del equipo", "Fotos de las vacaciones", "Cita del dentista", "Informe trimestral", "Cumple de Marta", "Billete de tren", "Contrato firmado"];
  var N = CORREOS.length, dominio = "spam";
  var orden = api.rng(9).shuffle(CORREOS.map(function (c, i) { return i; }));
  var real = orden.map(function (i) { return i < 5; });           /* los 5 primeros textos son spam */
  var txt = orden.map(function (i) { return CORREOS[i]; });
  var pred = [];
  var D = {
    spam: { pos: "Spam", neg: "No spam", item: function (i) { return txt[i]; }, fp: "correo bueno mandado a la carpeta de spam: lo pierdes", fn: "spam que cuela en tu bandeja: molesta, pero no es grave" },
    salud: { pos: "Enfermo", neg: "Sano", item: function (i) { return "Paciente " + (i + 1); }, fp: "sano diagnosticado como enfermo: un susto y más pruebas", fn: "enfermo dado por sano: no se trata a tiempo (el error grave)" }
  };

  function preset(kind) {
    var i, sp = 0, no = 0;
    for (i = 0; i < N; i++) {
      if (kind === "perfecto") pred[i] = real[i];
      else if (kind === "todo") pred[i] = true;
      else if (kind === "nada") pred[i] = false;
      else { /* modelo de ejemplo: acierta 3 de 5 spam y falla 1 de 11 normales */
        if (real[i]) { pred[i] = sp < 3; sp++; } else { pred[i] = no === 4; no++; }
      }
    }
  }
  preset("ejemplo");

  var ui = api.controls(root);
  ui.segmented({ label: "Dónde lo aplicamos", options: [["spam", "Filtro de spam"], ["salud", "Diagnóstico médico"]], value: dominio, onChange: function (v) { dominio = v; render(); } });
  ui.button("Modelo del ejemplo", function () { preset("ejemplo"); render(); });
  ui.button("Modelo perfecto", function () { preset("perfecto"); render(); });
  ui.button("Todo es positivo", function () { preset("todo"); render(); });
  ui.button("Nada es positivo", function () { preset("nada"); render(); });

  root.appendChild(api.el("p", { style: { margin: "0", fontSize: "0.8rem", color: "var(--ink-2)", lineHeight: "1.45" }, html: "<b>Haz clic en un caso</b> para cambiar lo que predice el modelo. Borde verde = acierto; borde rojo = error." }));
  var grid = api.el("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(8.5rem,1fr))", gap: "0.4rem" } });
  root.appendChild(grid);
  var mat = api.el("div", { style: { display: "grid", gridTemplateColumns: "minmax(4.5rem,auto) 1fr 1fr", gap: "0.3rem", alignItems: "stretch", fontSize: "0.82rem" } });
  root.appendChild(mat);
  var out = api.readout(root);

  function cell(kind, titulo, n) {
    var good = kind === "TP" || kind === "TN";
    return api.el("div", { style: { padding: "0.4rem 0.5rem", textAlign: "center", background: good ? "var(--oliva-wash)" : "var(--terracota-wash)", border: "1.5px solid " + (good ? "var(--oliva)" : "var(--terracota)") } },
      api.el("div", { text: String(n), style: { fontSize: "1.5rem", fontFamily: "var(--font-serif)", fontWeight: "600", lineHeight: "1.1" } }),
      api.el("div", { text: kind + " · " + titulo, style: { fontSize: "0.68rem", color: "var(--ink-2)" } }));
  }
  function render() {
    var d = D[dominio], tp = 0, tn = 0, fp = 0, fn = 0, i;
    grid.innerHTML = "";
    for (i = 0; i < N; i++) (function (k) {
      var r = real[k], p = pred[k], ok = r === p, code = r && p ? "TP" : !r && !p ? "TN" : !r && p ? "FP" : "FN";
      if (code === "TP") tp++; else if (code === "TN") tn++; else if (code === "FP") fp++; else fn++;
      var b = api.el("button", { type: "button", "aria-label": d.item(k) + ": real " + (r ? d.pos : d.neg) + ", el modelo dice " + (p ? d.pos : d.neg) + " (" + code + "). Clic para cambiar.",
        style: { textAlign: "left", padding: "0.35rem 0.5rem", background: ok ? "var(--surface)" : "var(--terracota-wash)", color: "var(--ink)", border: "2.5px solid " + (ok ? "var(--oliva)" : "var(--terracota)"), cursor: "pointer", font: "inherit", lineHeight: "1.3", minWidth: "0" } },
        api.el("div", { text: d.item(k), style: { fontSize: "0.78rem", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }),
        api.el("div", { html: "Real: <b>" + (r ? d.pos : d.neg) + "</b>", style: { fontSize: "0.68rem", color: "var(--ink-2)" } }),
        api.el("div", { html: "Modelo: <b>" + (p ? d.pos : d.neg) + "</b> <span style='font-family:var(--font-mono);font-size:0.62rem'>" + code + "</span>", style: { fontSize: "0.68rem", color: "var(--ink-2)" } }));
      b.addEventListener("click", function () { pred[k] = !pred[k]; render(); });
      grid.appendChild(b);
    })(i);
    mat.innerHTML = "";
    mat.appendChild(api.el("div")); mat.appendChild(api.el("div", { text: "Predice: " + d.pos, style: { textAlign: "center", fontWeight: "600", fontSize: "0.75rem" } })); mat.appendChild(api.el("div", { text: "Predice: " + d.neg, style: { textAlign: "center", fontWeight: "600", fontSize: "0.75rem" } }));
    mat.appendChild(api.el("div", { text: "Real: " + d.pos, style: { fontWeight: "600", fontSize: "0.75rem", alignSelf: "center" } })); mat.appendChild(cell("TP", "acierto", tp)); mat.appendChild(cell("FN", "se escapó", fn));
    mat.appendChild(api.el("div", { text: "Real: " + d.neg, style: { fontWeight: "600", fontSize: "0.75rem", alignSelf: "center" } })); mat.appendChild(cell("FP", "falsa alarma", fp)); mat.appendChild(cell("TN", "acierto", tn));
    var acc = (tp + tn) / N, rec = tp + fn ? tp / (tp + fn) : 0, prec = tp + fp ? tp / (tp + fp) : 0;
    out.set("Accuracy = (TP + TN) / total = (" + tp + " + " + tn + ") / " + N + " = <b>" + (acc * 100).toFixed(1) + " %</b><br>" +
      "Recall (de los " + (tp + fn) + " reales «" + d.pos + "», cuántos detecta) = " + tp + "/" + (tp + fn) + " = <b>" + (tp + fn ? (rec * 100).toFixed(0) + " %" : "—") + "</b> · " +
      "Precision (de los " + (tp + fp) + " que marca, cuántos lo eran) = " + tp + "/" + (tp + fp) + " = <b>" + (tp + fp ? (prec * 100).toFixed(0) + " %" : "—") + "</b><br>" +
      "<span class='bad'>FP (" + fp + "): " + d.fp + ".</span><br><span class='bad'>FN (" + fn + "): " + d.fn + ".</span>" +
      (tp === 0 && tn > 0 && fn > 0 ? "<br><b>Trampa:</b> un modelo que no detecta nada puede tener un accuracy alto si hay pocos positivos." : ""));
  }
  render();
});
