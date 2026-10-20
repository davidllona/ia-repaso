/* Experimento: RAG. Primero BUSCAR el documento más parecido (TF-IDF + coseno) y luego pegarlo en el prompt. El modelo no se reentrena. */
Lab.register("curso1/c1m1-rag", function (root, api) {
  var dias = 23, usarRag = true, pregunta = "¿Cuántos días de vacaciones tengo?";
  function docs() {
    return [
      { t: "Vacaciones", x: "Vacaciones: cada empleado tiene " + dias + " días laborables de vacaciones al año. Se solicitan con 15 días de antelación.", r: "tienes " + dias + " días laborables de vacaciones al año (se piden con 15 días de antelación)." },
      { t: "Teletrabajo", x: "Teletrabajo: se puede trabajar desde casa dos días a la semana, previa aprobación del responsable.", r: "puedes trabajar desde casa dos días a la semana, con la aprobación de tu responsable." },
      { t: "Gastos de viaje", x: "Gastos de viaje: los billetes de tren se reembolsan completos; los hoteles hasta 90 euros por noche.", r: "el tren se reembolsa completo y el hotel hasta 90 € por noche." },
      { t: "Baja médica", x: "Baja médica: hay que avisar a recursos humanos el mismo día y entregar el parte en 72 horas.", r: "avisa a recursos humanos el mismo día y entrega el parte en 72 horas." },
      { t: "Formación", x: "Formación: cada persona dispone de 40 horas de formación pagada al año.", r: "dispones de 40 horas de formación pagada al año." }
    ];
  }
  var EJ = ["¿Cuántos días de vacaciones tengo?", "¿Puedo trabajar desde casa?", "¿Cuánto me reembolsan por los hoteles?", "¿Quién ganó el Mundial de 2010?"];

  var ui = api.controls(root);
  var seg = ui.segmented({ label: "Cómo responde el modelo", options: [[false, "Solo el LLM"], [true, "LLM + RAG"]], value: usarRag, onChange: function (v) { usarRag = v; render(); } });
  var sel = ui.select({ label: "Pregunta de ejemplo", options: EJ.map(function (q, i) { return [i, q]; }), value: 0, onChange: function (v) { pregunta = EJ[+v]; inp.value = pregunta; render(); } });
  var inp = api.el("input", { type: "text", value: pregunta, "aria-label": "Escribe tu pregunta", style: { padding: "0.45rem 0.55rem", border: "1px solid var(--ink)", background: "var(--paper)", color: "var(--ink)", font: "inherit", fontSize: "0.9rem", borderRadius: "2px", width: "100%", boxSizing: "border-box" } });
  inp.addEventListener("input", function () { pregunta = inp.value; render(); });
  root.appendChild(api.el("div", { class: "ctl", style: { display: "flex", flexDirection: "column", gap: "0.2rem" } }, api.el("label", { text: "…o escribe la tuya", style: { fontSize: "0.82rem", fontWeight: "500", color: "var(--ink-2)" } }), inp));
  ui.button("Actualizar el documento «Vacaciones» (23 → 25 días)", function (b) { dias = dias === 23 ? 25 : 23; b.textContent = dias === 23 ? "Actualizar el documento «Vacaciones» (23 → 25 días)" : "Deshacer la actualización (25 → 23 días)"; render(); });

  var lista = api.el("div", { style: { display: "grid", gap: "0.35rem" } });
  var prompt = api.el("pre", { style: { margin: "0", whiteSpace: "pre-wrap", fontFamily: "var(--font-mono)", fontSize: "0.78rem", lineHeight: "1.5", background: "var(--paper)", border: "1px solid var(--line)", borderLeft: "4px solid var(--cobalto)", padding: "0.55rem 0.7rem", color: "var(--ink)" } });
  var resp = api.el("div", { style: { fontSize: "0.9rem", lineHeight: "1.5", background: "var(--oliva-wash)", borderLeft: "4px solid var(--oliva)", padding: "0.55rem 0.7rem" } });
  root.appendChild(lista);
  root.appendChild(api.el("div", { style: { fontFamily: "var(--font-mono)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-2)" }, text: "Prompt que recibe el LLM" }));
  root.appendChild(prompt);
  root.appendChild(api.el("div", { style: { fontFamily: "var(--font-mono)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-2)" }, text: "Respuesta (texto escrito de antemano para ilustrar)" }));
  root.appendChild(resp);
  var out = api.readout(root);

  /* TF-IDF como el de scikit-learn: tf = recuento, idf = ln((1+n)/(1+df)) + 1, vectores normalizados (L2). */
  function toks(s) { return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().match(/[a-z0-9]{2,}/g) || []; }
  function sims(D, q) {
    var n = D.length, tk = D.map(function (d) { return toks(d.x); }), df = {}, vocab = {};
    tk.forEach(function (t) { var seen = {}; t.forEach(function (w) { vocab[w] = 1; if (!seen[w]) { seen[w] = 1; df[w] = (df[w] || 0) + 1; } }); });
    function vec(t) {
      var v = {}, nrm = 0, w;
      t.forEach(function (x) { if (vocab[x]) v[x] = (v[x] || 0) + 1; });
      for (w in v) { v[w] *= Math.log((1 + n) / (1 + df[w])) + 1; nrm += v[w] * v[w]; }
      nrm = Math.sqrt(nrm);
      for (w in v) v[w] = nrm ? v[w] / nrm : 0;
      return v;
    }
    var vq = vec(toks(q));
    return tk.map(function (t) {
      var vd = vec(t), s = 0, w;
      for (w in vq) if (vd[w]) s += vq[w] * vd[w];
      return s;
    });
  }
  function render() {
    var D = docs(), S = sims(D, pregunta), best = 0, i, UMBRAL = 0.15;
    for (i = 1; i < D.length; i++) if (S[i] > S[best]) best = i;
    var hay = usarRag && S[best] >= UMBRAL;
    lista.innerHTML = "";
    D.forEach(function (d, k) {
      var on = usarRag && k === best && hay;
      lista.appendChild(api.el("div", { style: { display: "grid", gridTemplateColumns: "8.2rem 1fr 3rem", gap: "0.5rem", alignItems: "center", fontSize: "0.82rem", opacity: usarRag ? 1 : 0.4 } },
        api.el("span", { text: d.t, style: { fontWeight: on ? "700" : "400" } }),
        api.el("div", { style: { background: "var(--line)", height: "10px" } }, api.el("div", { style: { height: "10px", width: Math.round(S[k] * 100) + "%", background: on ? "var(--terracota)" : "var(--cobalto)", opacity: on ? 1 : 0.6 } })),
        api.el("span", { text: S[k].toFixed(3), style: { fontFamily: "var(--font-mono)", textAlign: "right" } })));
    });
    if (!usarRag) {
      prompt.textContent = "Pregunta: " + pregunta;
      resp.innerHTML = "<b>Sin RAG:</b> «No tengo acceso a los documentos de tu empresa, así que no puedo saber eso. Como referencia general, en España lo habitual son unos 22 días laborables de vacaciones, pero consulta tu contrato.»";
    } else if (hay) {
      prompt.textContent = "Responde SOLO con la información del contexto.\nContexto: " + D[best].x + "\nPregunta: " + pregunta;
      resp.innerHTML = "<b>Con RAG:</b> «Según el documento «" + D[best].t + "»: " + D[best].r + "»";
    } else {
      prompt.textContent = "Responde SOLO con la información del contexto.\nContexto: (ningún documento supera la similitud mínima de " + UMBRAL + ")\nPregunta: " + pregunta;
      resp.innerHTML = "<b>Con RAG:</b> «No encuentro información sobre eso en los documentos de la empresa.»";
    }
    out.set("Similitud máxima: <b>" + S[best].toFixed(3) + "</b> (" + D[best].t + ")" + (usarRag ? " · mínima exigida: <b>" + UMBRAL + "</b>" : "") + "<br>Parámetros del LLM modificados: <b>0</b> · documento «Vacaciones» = <b>" + dias + " días</b>");
  }
  render();
});
