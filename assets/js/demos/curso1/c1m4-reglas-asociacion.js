/* Experimento: Reglas de asociación: soporte, confianza y lift (10 usuarios y 5 títulos de una plataforma de streaming; datos inventados) */
Lab.register("curso1/c1m4-reglas-asociacion", function (root, api) {
//NOPRELUDE
var ITEMS = ["Toy Story", "Shrek", "Stranger Things", "Breaking Bad", "El juego del calamar"];
var BASK = [["Toy Story", "Shrek", "Stranger Things"], ["Toy Story", "Shrek"], ["Toy Story", "Shrek", "Breaking Bad", "Stranger Things"], ["Stranger Things", "Breaking Bad"], ["Toy Story", "Stranger Things"],
  ["Breaking Bad", "Stranger Things", "El juego del calamar"], ["Toy Story", "Shrek", "El juego del calamar", "Stranger Things"], ["Stranger Things", "Breaking Bad"], ["El juego del calamar", "Breaking Bad", "Stranger Things"], ["Shrek", "Stranger Things"]];
var A = "Toy Story", B = "Shrek";
var ui = api.controls(root);
var sa = ui.select({ label: "Si el usuario ve… (A)", options: ITEMS.map(function (x) { return [x, x]; }), value: A, onChange: function (v) { A = v; update(); } });
var sb = ui.select({ label: "…¿ve también? (B)", options: ITEMS.map(function (x) { return [x, x]; }), value: B, onChange: function (v) { B = v; update(); } });
var wrap = api.el("div", { style: { overflowX: "auto" } }), tbl = api.el("table", { class: "lab-table" }), thead = api.el("thead"), tbody = api.el("tbody");
var hr = api.el("tr"); hr.appendChild(api.el("th", { text: "Nº" })); ITEMS.forEach(function (it) { var th = api.el("th", { text: it }); th.style.textAlign = "center"; th.style.whiteSpace = "normal"; th.style.fontSize = "0.62rem"; th.style.padding = "0.3rem 0.2rem"; hr.appendChild(th); }); thead.appendChild(hr);
tbl.style.width = "100%"; tbl.appendChild(thead); tbl.appendChild(tbody); wrap.appendChild(tbl); root.appendChild(wrap);
var out = api.readout(root);
function has(b, it) { return b.indexOf(it) >= 0; }
function update() {
  var C = api.colors(), nA = 0, nB = 0, nAB = 0, N = BASK.length;
  tbody.innerHTML = "";
  BASK.forEach(function (b, i) {
    var a = has(b, A), bb = has(b, B), both = a && bb && A !== B;
    if (a) nA++; if (bb) nB++; if (both) nAB++;
    var tr = api.el("tr"); tr.style.background = both ? C.olivaWash : (a || bb) ? C.markerWash : "transparent";
    var tn = api.el("td", { text: "#" + (i + 1) }); tn.style.padding = "0.35rem 0.3rem"; tr.appendChild(tn);
    ITEMS.forEach(function (it) { var td = api.el("td", { text: has(b, it) ? "●" : "·" }); td.style.textAlign = "center"; td.style.padding = "0.35rem 0.2rem"; if (it === A || it === B) td.style.fontWeight = "700"; tr.appendChild(td); });
    tbody.appendChild(tr);
  });
  if (A === B) { out.set("Elige dos títulos distintos: una regla relaciona A con otro título B."); return; }
  var sA = nA / N, sB = nB / N, sAB = nAB / N, conf = nA ? nAB / nA : 0, lift = sB ? conf / sB : 0;
  var msg = lift > 1.05 ? "<span class='good'>lift &gt; 1: ver A hace B más probable de lo normal (asociación positiva).</span>" :
    lift < 0.95 ? "<span class='bad'>lift &lt; 1: ver A hace B menos probable de lo normal (asociación negativa).</span>" :
      "<span class='bad'>lift ≈ 1: A y B son casi independientes; la confianza alta no significa nada.</span>";
  out.set("Filas verdes: han visto A y B · amarillas: solo uno de los dos · " + N + " usuarios en total<br>" +
    "soporte(A) = " + nA + "/" + N + " = <b>" + sA.toFixed(2) + "</b> · soporte(B) = " + nB + "/" + N + " = <b>" + sB.toFixed(2) + "</b><br>" +
    "soporte(A y B) = " + nAB + "/" + N + " = <b>" + sAB.toFixed(2) + "</b><br>" +
    "confianza(A → B) = soporte(A y B) / soporte(A) = " + nAB + "/" + nA + " = <b>" + conf.toFixed(2) + "</b><br>" +
    "lift(A → B) = confianza / soporte(B) = " + conf.toFixed(2) + " / " + sB.toFixed(2) + " = <b>" + lift.toFixed(2) + "</b><br>" + msg);
}
update();

});
