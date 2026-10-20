/* Experimento: tokenizar un texto y puntuar su sentimiento con un diccionario (y ver sus límites: la negación). */
Lab.register("curso1/c1m1-tokens-sentimiento", function (root, api) {
  var POS = ["increíble", "espectacular", "genial", "bueno", "rápido"], NEG = ["horrible", "lento", "malo", "decepcionante", "aburrido"];
  var NEGADORES = ["no", "nunca", "tampoco", "ni"], ENT = { "Netflix": "ORGANIZACIÓN", "Corea": "LUGAR", "Madrid": "LUGAR" };
  var EJ = ["La película ha sido increíble", "Este final es espectacular", "El guion es lento y el final es horrible", "No es nada bueno", "Netflix grabó una serie nueva en Corea", "Me encanta Toy Story"];
  var texto = EJ[0], modo = "palabras", negar = false;

  var ui = api.controls(root);
  ui.select({ label: "Frase de ejemplo", options: EJ.map(function (e, i) { return [i, e]; }), value: 0, onChange: function (v) { texto = EJ[+v]; inp.value = texto; render(); } });
  ui.segmented({ label: "Cómo troceamos", options: [["palabras", "Palabras"], ["trozos", "Trozos de 3"], ["letras", "Letras"]], value: modo, onChange: function (v) { modo = v; render(); } });
  var inp = api.el("input", { type: "text", value: texto, "aria-label": "Escribe una frase", style: { padding: "0.45rem 0.55rem", border: "1px solid var(--ink)", background: "var(--paper)", color: "var(--ink)", font: "inherit", fontSize: "0.9rem", borderRadius: "2px", width: "100%", boxSizing: "border-box" } });
  inp.addEventListener("input", function () { texto = inp.value; render(); });
  root.appendChild(api.el("div", { style: { display: "flex", flexDirection: "column", gap: "0.2rem" } }, api.el("label", { text: "…o escribe tu frase", style: { fontSize: "0.82rem", fontWeight: "500", color: "var(--ink-2)" } }), inp));
  ui.toggle({ label: "Tener en cuenta las negaciones («no es bueno»)", value: negar, onChange: function (v) { negar = v; render(); } });

  var chips = api.el("div", { style: { display: "flex", flexWrap: "wrap", gap: "0.4rem", minHeight: "3.2rem", alignItems: "flex-start" } });
  root.appendChild(chips);
  root.appendChild(api.el("p", { style: { margin: "0", fontSize: "0.78rem", color: "var(--muted)", lineHeight: "1.45" },
    html: "<b>Diccionario positivo:</b> " + POS.join(", ") + " · <b>negativo:</b> " + NEG.join(", ") + " · <b>entidades:</b> Netflix (organización), Corea y Madrid (lugares)." }));
  var out = api.readout(root);

  function palabras(t) { return t.match(/[\p{L}\p{N}_]+/gu) || []; }
  function trozos(ws) { var r = []; ws.forEach(function (w) { for (var i = 0; i < w.length; i += 3) r.push(w.slice(i, i + 3)); }); return r; }
  function letras(ws) { var r = []; ws.forEach(function (w) { w.split("").forEach(function (c) { r.push(c); }); }); return r; }
  function chip(txt, kind, sub) {
    var col = { pos: ["var(--oliva-wash)", "var(--oliva)"], neg: ["var(--terracota-wash)", "var(--terracota)"], ent: ["var(--cobalto-wash)", "var(--cobalto)"], neu: ["var(--paper)", "var(--line)"] }[kind];
    return api.el("div", { style: { display: "inline-flex", flexDirection: "column", alignItems: "center" } },
      api.el("span", { text: txt, style: { padding: "0.2rem 0.5rem", background: col[0], border: "1.5px solid " + col[1], fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--ink)" } }),
      api.el("span", { text: sub || "", style: { fontSize: "0.62rem", color: "var(--ink-2)", fontFamily: "var(--font-mono)", minHeight: "0.9rem" } }));
  }
  function render() {
    var ws = palabras(texto), tl = trozos(ws), ll = letras(ws), i, score = 0, hallazgos = [], nPos = 0, nNeg = 0;
    var info = ws.map(function (w, k) {
      var lw = w.toLowerCase(), kind = "neu", sub = "", s = 0;
      if (POS.indexOf(lw) >= 0) s = 1; else if (NEG.indexOf(lw) >= 0) s = -1;
      if (s && negar) for (i = Math.max(0, k - 3); i < k; i++) if (NEGADORES.indexOf(ws[i].toLowerCase()) >= 0) { s = -s; sub = "negado"; }
      if (s > 0) { kind = "pos"; nPos++; sub = (sub ? sub + " " : "") + "+1"; } else if (s < 0) { kind = "neg"; nNeg++; sub = (sub ? sub + " " : "") + "−1"; }
      if (ENT[w]) { kind = "ent"; sub = ENT[w]; hallazgos.push(w + " → " + ENT[w]); }
      score += s;
      return { w: w, kind: kind, sub: sub };
    });
    chips.innerHTML = "";
    if (modo === "palabras") info.forEach(function (c) { chips.appendChild(chip(c.w, c.kind, c.sub)); });
    else (modo === "trozos" ? tl : ll).forEach(function (t) { chips.appendChild(chip(t, "neu", "")); });
    if (!ws.length) chips.appendChild(api.el("span", { text: "Escribe algo…", style: { color: "var(--muted)", fontSize: "0.85rem" } }));
    var verdict = score > 0 ? "POSITIVO" : score < 0 ? "NEGATIVO" : "NEUTRO";
    var trampa = !negar && ws.some(function (w) { return NEGADORES.indexOf(w.toLowerCase()) >= 0; }) && nPos + nNeg > 0;
    out.set("Tokens: <b>" + ws.length + "</b> palabras · <b>" + tl.length + "</b> trozos de 3 letras · <b>" + ll.length + "</b> letras<br>" +
      "Palabras positivas: <b>" + nPos + "</b> · negativas: <b>" + nNeg + "</b> → puntuación <b>" + (score > 0 ? "+" : "") + score + "</b> → <b>" + verdict + "</b>" +
      (hallazgos.length ? "<br>Entidades (NER): <b>" + hallazgos.join(" · ") + "</b>" : "") +
      (trampa ? "<br><span class='bad'>Ojo: la frase lleva un «no» y el diccionario no lo entiende. Activa las negaciones.</span>" : ""));
  }
  render();
});
