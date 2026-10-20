/* Experimento: Reglas de asociación: soporte, confianza y lift */
Lab.register("curso1/c1m4-reglas-asociacion", function (root, api) {
//NOPRELUDE
var ITEMS = ["Tortillas", "Guacamole", "Leche", "Pan", "Cerveza"];
var BASK = [["Tortillas", "Guacamole", "Leche"], ["Tortillas", "Guacamole"], ["Tortillas", "Guacamole", "Pan", "Leche"], ["Leche", "Pan"], ["Tortillas", "Leche"],
  ["Pan", "Leche", "Cerveza"], ["Tortillas", "Guacamole", "Cerveza", "Leche"], ["Leche", "Pan"], ["Cerveza", "Pan", "Leche"], ["Guacamole", "Leche"]];
var A = "Tortillas", B = "Guacamole";
var ui = api.controls(root);
var sa = ui.select({ label: "Si el cliente compra… (A)", options: ITEMS.map(function (x) { return [x, x]; }), value: A, onChange: function (v) { A = v; update(); } });
var sb = ui.select({ label: "…¿compra también? (B)", options: ITEMS.map(function (x) { return [x, x]; }), value: B, onChange: function (v) { B = v; update(); } });
var wrap = api.el("div", { style: { overflowX: "auto" } }), tbl = api.el("table", { class: "lab-table" }), thead = api.el("thead"), tbody = api.el("tbody");
var hr = api.el("tr"); hr.appendChild(api.el("th", { text: "Compra" })); ITEMS.forEach(function (it) { var th = api.el("th", { text: it }); th.style.textAlign = "center"; hr.appendChild(th); }); thead.appendChild(hr);
tbl.appendChild(thead); tbl.appendChild(tbody); wrap.appendChild(tbl); root.appendChild(wrap);
var out = api.readout(root);
function has(b, it) { return b.indexOf(it) >= 0; }
function update() {
  var C = api.colors(), nA = 0, nB = 0, nAB = 0, N = BASK.length;
  tbody.innerHTML = "";
  BASK.forEach(function (b, i) {
    var a = has(b, A), bb = has(b, B), both = a && bb && A !== B;
    if (a) nA++; if (bb) nB++; if (both) nAB++;
    var tr = api.el("tr"); tr.style.background = both ? C.olivaWash : (a || bb) ? C.markerWash : "transparent";
    tr.appendChild(api.el("td", { text: "#" + (i + 1) }));
    ITEMS.forEach(function (it) { var td = api.el("td", { text: has(b, it) ? "●" : "·" }); td.style.textAlign = "center"; if (it === A || it === B) td.style.fontWeight = "700"; tr.appendChild(td); });
    tbody.appendChild(tr);
  });
  if (A === B) { out.set("Elige dos productos distintos: una regla relaciona A con otro producto B."); return; }
  var sA = nA / N, sB = nB / N, sAB = nAB / N, conf = nA ? nAB / nA : 0, lift = sB ? conf / sB : 0;
  var msg = lift > 1.05 ? "<span class='good'>lift &gt; 1: comprar A hace B más probable de lo normal (asociación positiva).</span>" :
    lift < 0.95 ? "<span class='bad'>lift &lt; 1: comprar A hace B menos probable de lo normal (asociación negativa).</span>" :
      "<span class='bad'>lift ≈ 1: A y B son casi independientes; la confianza alta no significa nada.</span>";
  out.set("Filas verdes: compran A y B · amarillas: solo uno de los dos · " + N + " cestas en total<br>" +
    "soporte(A) = " + nA + "/" + N + " = <b>" + sA.toFixed(2) + "</b> · soporte(B) = " + nB + "/" + N + " = <b>" + sB.toFixed(2) + "</b><br>" +
    "soporte(A y B) = " + nAB + "/" + N + " = <b>" + sAB.toFixed(2) + "</b><br>" +
    "confianza(A → B) = soporte(A y B) / soporte(A) = " + nAB + "/" + nA + " = <b>" + conf.toFixed(2) + "</b><br>" +
    "lift(A → B) = confianza / soporte(B) = " + conf.toFixed(2) + " / " + sB.toFixed(2) + " = <b>" + lift.toFixed(2) + "</b><br>" + msg);
}
update();

});
