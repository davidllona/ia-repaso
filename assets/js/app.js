/* =====================================================================
   APP — estructura común de todas las páginas.
   Construye cabecera, barra lateral, pie, azulejos, progreso,
   bloques de código (resaltado + «línea por línea»), cuestionarios,
   fórmulas (KaTeX bajo demanda) y monta las demos del laboratorio.

   Las páginas solo necesitan:
     <body data-root="../" data-course="1" data-module="3">
       <main id="contenido"><div class="page"> ... </div></main>
   ===================================================================== */
(function () {
  "use strict";

  var CUR = window.CURRICULUM;
  var body = document.body;
  var ROOT = body.getAttribute("data-root") || "./";
  var curCourse = parseInt(body.getAttribute("data-course") || "0", 10);
  var curModule = parseInt(body.getAttribute("data-module") || "0", 10);

  /* ---------- utilidades ---------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function el(tag, props) {
    var n = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      var v = props[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else if (k === "html") n.innerHTML = v;
      else n.setAttribute(k, v === true ? "" : v);
    });
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i]; if (c == null || c === false) continue;
      n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return n;
  }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function slugify(s) {
    return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  }
  function courseById(id) { return CUR.courses.filter(function (c) { return c.id === id; })[0]; }
  function href(course, mod) {
    return ROOT + course.slug + "/" + (mod ? mod.slug + ".html" : "");
  }
  var allModules = [];
  CUR.courses.forEach(function (c) { c.modules.forEach(function (m) { allModules.push({ c: c, m: m }); }); });

  /* ---------- almacenamiento seguro ---------- */
  var mem = {};
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return mem[k] || null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { mem[k] = v; } }
  };
  var DONE_KEY = "cuaderno-ia:hecho:v1";
  function doneMap() { try { return JSON.parse(store.get(DONE_KEY) || "{}") || {}; } catch (e) { return {}; } }
  function isDone(c, m) { return !!doneMap()[c + "." + m]; }
  function setDone(c, m, v) { var d = doneMap(); if (v) d[c + "." + m] = 1; else delete d[c + "." + m]; store.set(DONE_KEY, JSON.stringify(d)); }
  function courseProgress(c) {
    var done = c.modules.filter(function (m) { return isDone(c.id, m.n); }).length;
    return { done: done, total: c.modules.length };
  }

  /* ---------- tema claro / oscuro ---------- */
  function effectiveTheme() {
    var t = document.documentElement.getAttribute("data-theme");
    if (t) return t;
    return window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function setTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    store.set("cuaderno-ia:tema", t);
    window.dispatchEvent(new Event("lab:theme"));
  }
  if (window.matchMedia) {
    var mq = matchMedia("(prefers-color-scheme: dark)");
    var onChange = function () { window.dispatchEvent(new Event("lab:theme")); };
    if (mq.addEventListener) mq.addEventListener("change", onChange);
  }

  /* ---------- azulejos (generados con semilla) ---------- */
  function hashStr(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function prng(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  /* Un cuarto de azulejo 5x5 que se refleja en los otros tres cuadrantes. */
  function tileSVG(seed, done) {
    var rnd = prng(hashStr(seed)), S = 8, N = 5, off = 10, shapes = "";
    var motifs = ["", "", "sq", "sq", "ci", "ci", "di", "ri", "qu"];
    var colors = ["t-a", "t-a", "t-a", "t-b", "t-b", "t-c", "t-d"];
    for (var i = 0; i < N; i++) {
      for (var j = 0; j < N; j++) {
        var m = motifs[Math.floor(rnd() * motifs.length)], cl = colors[Math.floor(rnd() * colors.length)];
        var cx = off + i * S + S / 2, cy = off + j * S + S / 2;
        if (!m) continue;
        if (m === "sq") shapes += '<rect class="' + cl + '" x="' + (cx - 2.8) + '" y="' + (cy - 2.8) + '" width="5.6" height="5.6"/>';
        else if (m === "ci") shapes += '<circle class="' + cl + '" cx="' + cx + '" cy="' + cy + '" r="3.2"/>';
        else if (m === "di") shapes += '<polygon class="' + cl + '" points="' + cx + "," + (cy - 3.8) + " " + (cx + 3.8) + "," + cy + " " + cx + "," + (cy + 3.8) + " " + (cx - 3.8) + "," + cy + '"/>';
        else if (m === "ri") shapes += '<circle class="' + cl + '" cx="' + cx + '" cy="' + cy + '" r="3.4"/><circle class="t-bg" cx="' + cx + '" cy="' + cy + '" r="1.5"/>';
        else shapes += '<path class="' + cl + '" d="M' + (cx - 3.6) + "," + (cy + 3.6) + " L" + (cx - 3.6) + "," + (cy - 3.6) + " A7.2,7.2 0 0 1 " + (cx + 3.6) + "," + (cy + 3.6) + ' Z"/>';
      }
    }
    var q = "<g>" + shapes + "</g>";
    var mirror = q +
      '<g transform="translate(100,0) scale(-1,1)">' + shapes + "</g>" +
      '<g transform="translate(0,100) scale(1,-1)">' + shapes + "</g>" +
      '<g transform="translate(100,100) scale(-1,-1)">' + shapes + "</g>";
    var rosette = '<circle class="t-b" cx="50" cy="50" r="6.5"/><circle class="t-bg" cx="50" cy="50" r="3.6"/><circle class="t-a" cx="50" cy="50" r="1.8"/>';
    return '<svg class="tile ' + (done ? "is-done" : "is-todo") + '" viewBox="0 0 100 100" role="img" aria-label="Azulejo del módulo" xmlns="http://www.w3.org/2000/svg">' +
      '<rect class="t-bg" x="0" y="0" width="100" height="100"/>' + mirror + rosette +
      '<rect class="t-frame" x="3" y="3" width="94" height="94"/></svg>';
  }
  function brandMark() {
    return '<svg viewBox="0 0 28 28" aria-hidden="true"><rect x="1" y="1" width="26" height="26" fill="var(--surface)" stroke="var(--ink)" stroke-width="2"/>' +
      '<path d="M14 3 L25 14 L14 25 L3 14 Z" fill="var(--cobalto)"/><circle cx="14" cy="14" r="5" fill="var(--terracota)"/><circle cx="14" cy="14" r="2" fill="var(--surface)"/></svg>';
  }

  /* ---------- estructura de página ---------- */
  function buildChrome() {
    var main = $("main");
    if (!main) return;
    main.id = main.id || "contenido";
    var skip = el("a", { class: "skip", href: "#" + main.id, text: "Saltar al contenido" });

    var nav = el("nav", { "aria-label": "Cursos" });
    CUR.courses.forEach(function (c) {
      var a = el("a", { href: href(c), text: "Curso " + c.id, title: "Curso " + c.id + ": " + c.title, "aria-label": "Curso " + c.id + ": " + c.title });
      if (c.id === curCourse) a.setAttribute("aria-current", "true");
      nav.appendChild(a);
    });
    var menuBtn = el("button", { class: "icon-btn menu-btn", type: "button", "aria-expanded": "false", "aria-controls": "sidebar",
      html: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" stroke-width="1.6" fill="none"/></svg> Índice' });
    var themeBtn = el("button", { class: "icon-btn theme-btn", type: "button", "aria-label": "Cambiar entre tema claro y oscuro",
      html: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 2.5a5.5 5.5 0 0 0 0 11z" fill="currentColor"/></svg><span>Tema</span>' });
    var brand = el("a", { class: "brand", href: ROOT + "index.html", html: brandMark() + "<span>" + esc(CUR.site.name) + "</span><small>IBM AI Engineering</small>" });
    var topbar = el("header", { class: "topbar" }, menuBtn, brand, nav, el("span", { class: "spacer" }), themeBtn);

    var side = buildSidebar();
    var shell = el("div", { class: "shell" });
    main.parentNode.insertBefore(shell, main);
    shell.appendChild(side);
    shell.appendChild(main);

    body.insertBefore(topbar, body.firstChild);
    body.insertBefore(skip, body.firstChild);

    var foot = el("footer", { class: "footer" },
      el("p", { html: "<strong>" + esc(CUR.site.name) + "</strong> · apuntes de estudio del certificado IBM AI Engineering (Coursera)" }),
      el("p", { text: "Proyecto personal de aprendizaje, no afiliado a IBM ni a Coursera. Los ejemplos de código son orientativos: pruébalos y modifícalos." }));
    body.appendChild(foot);

    function closeMenu() { body.classList.remove("menu-open"); menuBtn.setAttribute("aria-expanded", "false"); }
    menuBtn.addEventListener("click", function () {
      var open = body.classList.toggle("menu-open"); menuBtn.setAttribute("aria-expanded", String(open));
    });
    side.addEventListener("click", function (e) { if (e.target.closest("a")) closeMenu(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });
    window.addEventListener("resize", function () { if (window.innerWidth >= 1100) closeMenu(); });
    body.addEventListener("click", function (e) { if (body.classList.contains("menu-open") && !e.target.closest(".sidebar,.menu-btn")) closeMenu(); });
    themeBtn.addEventListener("click", function () { setTheme(effectiveTheme() === "dark" ? "light" : "dark"); });
  }

  function buildSidebar() {
    var side = el("aside", { class: "sidebar", id: "sidebar", "aria-label": "Índice del temario" });
    side.appendChild(el("div", { class: "side-title", text: "Temario" }));
    CUR.courses.forEach(function (c) {
      var det = el("details", { class: "side-course" });
      if (c.id === curCourse) det.open = true;
      det.appendChild(el("summary", {}, el("span", { class: "cn", text: "C" + c.id }), c.title));
      var ul = el("ul", { class: "side-mods" });
      c.modules.forEach(function (m) {
        var a = el("a", { href: href(c, m) }, el("span", { class: "mn", text: String(m.n) }), el("span", { text: m.title }));
        if (isDone(c.id, m.n)) a.appendChild(el("span", { class: "done-dot", title: "Módulo estudiado" }));
        var li = el("li", {}, a);
        if (c.id === curCourse && m.n === curModule) { a.setAttribute("aria-current", "page"); li.appendChild(el("ul", { class: "side-toc", id: "side-toc" })); }
        ul.appendChild(li);
      });
      det.appendChild(ul); side.appendChild(det);
    });
    if (CUR.upcoming) side.appendChild(el("p", { class: "side-soon", text: "Cursos " + CUR.upcoming.from + "–" + CUR.upcoming.to + ": " + CUR.upcoming.note }));
    return side;
  }

  /* ---------- numeración + índice de la página ---------- */
  function buildToc() {
    var page = $(".page"); if (!page) return;
    var k = 0, items = [];
    $$("h2", page).forEach(function (h) {
      if (h.closest(".resumen,.quiz,.demo,.callout")) return;
      if (!h.id) h.id = slugify(h.textContent) || "sec-" + (items.length + 1);
      if (!h.classList.contains("sin-num") && curModule) {
        k++; h.insertBefore(el("span", { class: "num", text: curModule + "." + k }), h.firstChild);
      }
      if (!h.classList.contains("sin-toc")) items.push(h);
    });
    var toc = $("#side-toc");
    if (!toc) return;
    items.forEach(function (h) {
      var label = h.cloneNode(true); var n = label.querySelector(".num"); if (n) n.remove();
      toc.appendChild(el("li", {}, el("a", { href: "#" + h.id, text: label.textContent.trim() })));
    });
    if ("IntersectionObserver" in window) {
      var links = $$("a", toc);
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          links.forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id); });
        });
      }, { rootMargin: "-70px 0px -72% 0px" });
      items.forEach(function (h) { io.observe(h); });
    }
  }

  /* ---------- cabecera de módulo (azulejo) ---------- */
  function buildHero() {
    $$("[data-tile-seed]").forEach(function (b) {
      b.innerHTML = tileSVG(b.getAttribute("data-tile-seed"), b.getAttribute("data-tile-done") === "1");
    });
    if (curCourse && curModule) {
      var box = $(".hero .hero-tile");
      if (box) box.innerHTML = tileSVG("c" + curCourse + "m" + curModule, isDone(curCourse, curModule));
    }
  }

  /* ---------- final de módulo: marcar + navegación ---------- */
  function buildModuleFooter() {
    var page = $(".page"); if (!page || !curModule) return;
    var idx = -1;
    allModules.forEach(function (x, i) { if (x.c.id === curCourse && x.m.n === curModule) idx = i; });
    var btn = el("button", { class: "btn primary", type: "button" });
    function paint() { btn.textContent = isDone(curCourse, curModule) ? "Desmarcar módulo" : "Marcar como estudiado"; }
    paint();
    btn.addEventListener("click", function () {
      setDone(curCourse, curModule, !isDone(curCourse, curModule)); paint();
      var box = $(".hero-tile"); if (box) box.innerHTML = tileSVG("c" + curCourse + "m" + curModule, isDone(curCourse, curModule));
      var dot = $('.sidebar a[aria-current="page"] .done-dot'), a = $('.sidebar a[aria-current="page"]');
      if (isDone(curCourse, curModule) && !dot && a) a.appendChild(el("span", { class: "done-dot", title: "Módulo estudiado" }));
      if (!isDone(curCourse, curModule) && dot) dot.remove();
    });
    page.appendChild(el("div", { class: "done-bar" },
      el("p", { text: "¿Has entendido este módulo? Márcalo y su azulejo se coloreará en tu portada." }), btn));
    var nav = el("nav", { class: "modnav", "aria-label": "Módulo anterior y siguiente" });
    var prev = allModules[idx - 1], next = allModules[idx + 1];
    nav.appendChild(prev ? el("a", { class: "prev", href: href(prev.c, prev.m) }, el("small", { text: "← Anterior · Curso " + prev.c.id }), el("span", { text: prev.m.title })) : el("span"));
    nav.appendChild(next ? el("a", { class: "next", href: href(next.c, next.m) }, el("small", { text: "Siguiente · Curso " + next.c.id + " →" }), el("span", { text: next.m.title }))
      : el("a", { class: "next", href: ROOT + "index.html" }, el("small", { text: "Fin del recorrido actual →" }), el("span", { text: "Volver a la portada" })));
    page.appendChild(nav);
  }

  /* ---------- portada e índices de curso ---------- */
  function renderLists() {
    $$('[data-render="course-cards"]').forEach(function (box) {
      var grid = el("div", { class: "course-grid" });
      CUR.courses.forEach(function (c) {
        var p = courseProgress(c);
        var card = el("a", { class: "course-card", href: href(c) },
          el("div", { class: "cc-top", html: tileSVG("curso" + c.id, p.done === p.total) },
            el("div", {}, el("div", { class: "cc-n", text: "Curso " + c.id + " · " + c.modules.length + " módulos" }), el("h3", { text: c.title }))),
          el("div", { class: "cc-body" }, el("p", { text: c.blurb }),
            el("div", { class: "progress", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(p.total), "aria-valuenow": String(p.done), "aria-label": "Progreso del curso " + c.id }, el("i", { style: "width:" + (100 * p.done / p.total) + "%" })),
            el("div", { class: "progress-label", text: p.done + " de " + p.total + " módulos estudiados" })));
        // el azulejo va dentro de .cc-top antes del texto
        var top = card.querySelector(".cc-top"); var svg = top.querySelector("svg"); if (svg) top.insertBefore(svg, top.firstChild);
        grid.appendChild(card);
      });
      box.appendChild(grid);
    });
    $$('[data-render="module-list"]').forEach(function (box) {
      var c = courseById(parseInt(box.getAttribute("data-course"), 10) || curCourse); if (!c) return;
      var ul = el("ul", { class: "module-list" });
      c.modules.forEach(function (m) {
        var tags = el("div", { class: "tags" }); m.tags.forEach(function (t) { tags.appendChild(el("span", { text: t })); });
        var a = el("a", { href: href(c, m), html: tileSVG("c" + c.id + "m" + m.n, isDone(c.id, m.n)) },
          el("div", {}, el("div", { class: "ml-n", text: "Módulo " + m.n + (isDone(c.id, m.n) ? " · estudiado ✓" : "") }),
            el("h3", { text: m.title }), el("p", { text: m.summary }), tags));
        var svg = a.querySelector("svg"); a.insertBefore(svg, a.firstChild);
        ul.appendChild(el("li", {}, a));
      });
      box.appendChild(ul);
    });
    $$('[data-render="wall"]').forEach(function (box) {
      var wall = el("div", { class: "wall", role: "list" });
      allModules.forEach(function (x) {
        var a = el("a", { href: href(x.c, x.m), role: "listitem", title: "Curso " + x.c.id + " · Módulo " + x.m.n + ": " + x.m.title,
          "aria-label": "Curso " + x.c.id + ", módulo " + x.m.n + ": " + x.m.title, html: tileSVG("c" + x.c.id + "m" + x.m.n, isDone(x.c.id, x.m.n)) });
        wall.appendChild(a);
      });
      box.appendChild(wall);
    });
    $$('[data-render="progress-text"]').forEach(function (box) {
      var done = allModules.filter(function (x) { return isDone(x.c.id, x.m.n); }).length;
      box.textContent = done + " de " + allModules.length + " módulos estudiados";
    });
    $$('[data-render="soon"]').forEach(function (box) {
      box.textContent = CUR.upcoming ? "Cursos " + CUR.upcoming.from + " a " + CUR.upcoming.to + ". " + CUR.upcoming.note : "";
    });
  }

  /* ---------- resaltado de código ---------- */
  var PY_KW = "False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield".split(" ");
  var PY_BI = "print len range int float str list dict set tuple enumerate zip map filter sum min max abs round sorted reversed isinstance super open type any all next iter input bool object self cls".split(" ");
  function highlight(code, lang) {
    if (lang === "text" || lang === "salida") return code.split("\n").map(function (l) { return esc(l); });
    var re = /(#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?''')|((?:[rRfFbB]{1,2})?(?:"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'))|(\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|(@[A-Za-z_][\w.]*)|(\b[A-Za-z_]\w*\b)|([\s\S])/g;
    var toks = [], m, prev = "", kw = {}, bi = {};
    PY_KW.forEach(function (k) { kw[k] = 1; }); PY_BI.forEach(function (k) { bi[k] = 1; });
    var bash = lang === "bash" || lang === "shell";
    while ((m = re.exec(code))) {
      if (m[1]) toks.push(["c", m[1]]);
      else if (m[2]) toks.push(["s", m[2]]);
      else if (m[3]) toks.push(["s", m[3]]);
      else if (m[4]) toks.push(["n", m[4]]);
      else if (m[5]) toks.push(["d", m[5]]);
      else if (m[6]) {
        var w = m[6], next = code.charAt(re.lastIndex), t = "";
        if (!bash && kw[w]) t = "k";
        else if (prev === "def" || prev === "class") t = "f";
        else if (!bash && bi[w]) t = "b";
        else if (next === "(") t = "f";
        toks.push([t, w]); prev = w; continue;
      } else toks.push([/[=+\-*\/<>!%&|^~]/.test(m[7]) ? "o" : "", m[7]]);
      if (m[1] || m[2] || m[3] || m[4] || m[5]) prev = "";
    }
    var lines = [""], i, j, parts, cls;
    toks.forEach(function (tk) {
      parts = tk[1].split("\n");
      for (j = 0; j < parts.length; j++) {
        if (j > 0) lines.push("");
        if (parts[j] === "") continue;
        cls = tk[0];
        lines[lines.length - 1] += cls ? '<span class="tk-' + cls + '">' + esc(parts[j]) + "</span>" : esc(parts[j]);
      }
    });
    return lines;
  }
  function parseLines(spec) {
    var out = [];
    String(spec || "").split(",").forEach(function (part) {
      var m = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/); if (!m) return;
      var a = parseInt(m[1], 10), b = m[2] ? parseInt(m[2], 10) : a;
      for (var i = a; i <= b; i++) out.push(i);
    });
    return out;
  }
  function buildCode() {
    $$("pre.code").forEach(function (pre) {
      var codeEl = pre.querySelector("code") || pre;
      var raw = codeEl.textContent.replace(/^\n+/, "").replace(/\s+$/, "");
      var snippet = pre.closest(".snippet");
      var lang = pre.getAttribute("data-lang") || (snippet && snippet.getAttribute("data-lang")) || "python";
      var lines = highlight(raw, lang);
      var c = el("code");
      lines.forEach(function (h, i) {
        c.appendChild(el("span", { class: "ln", "data-n": String(i + 1), html: h === "" ? "&#8203;" : h }));
      });
      pre.innerHTML = ""; pre.appendChild(c);
      pre.setAttribute("tabindex", "0"); pre.setAttribute("data-lines-count", String(lines.length));
      var wrap = el("div", { class: "codewrap" });
      pre.parentNode.insertBefore(wrap, pre); wrap.appendChild(pre);
      var btn = el("button", { class: "copy-btn", type: "button", text: "Copiar", "aria-label": "Copiar el código" });
      btn.addEventListener("click", function () {
        function ok() { btn.textContent = "¡Copiado!"; setTimeout(function () { btn.textContent = "Copiar"; }, 1500); }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(raw).then(ok, function () {});
        else { var ta = el("textarea"); ta.value = raw; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); ok(); } catch (e) {} ta.remove(); }
      });
      wrap.appendChild(btn);

      if (!snippet) return;
      var lnEls = $$(".ln", pre);
      var rows = $$("table.lineas tr[data-lines]", snippet);
      function clear() { lnEls.forEach(function (l) { l.classList.remove("hl"); }); rows.forEach(function (r) { r.classList.remove("on"); }); }
      function show(row) {
        clear(); row.classList.add("on");
        parseLines(row.getAttribute("data-lines")).forEach(function (n) { if (lnEls[n - 1]) lnEls[n - 1].classList.add("hl"); });
      }
      rows.forEach(function (row) {
        var ls = parseLines(row.getAttribute("data-lines"));
        if (ls.length) {
          var first = row.cells[0];
          first.insertBefore(el("span", { class: "rng", text: ls.length > 1 ? "líneas " + ls[0] + "–" + ls[ls.length - 1] : "línea " + ls[0] }), first.firstChild);
        }
        row.setAttribute("tabindex", "0");
        row.addEventListener("mouseenter", function () { show(row); });
        row.addEventListener("focus", function () { show(row); });
        row.addEventListener("click", function () { show(row); });
        row.addEventListener("mouseleave", clear);
        row.addEventListener("blur", clear);
      });
      lnEls.forEach(function (l, i) {
        l.addEventListener("mouseenter", function () {
          clear(); l.classList.add("hl");
          rows.forEach(function (r) { if (parseLines(r.getAttribute("data-lines")).indexOf(i + 1) !== -1) r.classList.add("on"); });
        });
        l.addEventListener("mouseleave", clear);
      });
    });
  }

  /* ---------- cuestionarios ---------- */
  function buildQuizzes() {
    $$(".quiz").forEach(function (q) {
      var s = $("script.quiz-data", q); if (!s) return;
      var data; try { data = JSON.parse(s.textContent); } catch (e) { console.error("Quiz JSON inválido", e); return; }
      var qs = Array.isArray(data) ? data : data.preguntas, title = (data.titulo) || "Comprueba lo que has entendido";
      s.remove();
      var score = el("span", { class: "quiz-score", text: "0 / " + qs.length });
      q.appendChild(el("header", {}, el("h3", { text: title }), score));
      var correct = 0, answered = 0;
      qs.forEach(function (item, qi) {
        var box = el("div", { class: "q" });
        box.appendChild(el("p", { class: "q-text", html: (qi + 1) + ". " + item.q }));
        var ul = el("ul", { class: "q-opts" }), btns = [];
        item.opciones.forEach(function (o, oi) {
          var b = el("button", { type: "button", html: '<span class="k">' + String.fromCharCode(65 + oi) + "</span><span>" + o + "</span>" });
          b.addEventListener("click", function () {
            btns.forEach(function (x) { x.disabled = true; });
            answered++;
            if (oi === item.correcta) { b.classList.add("ok"); correct++; } else { b.classList.add("ko"); btns[item.correcta].classList.add("ok"); }
            score.textContent = correct + " / " + qs.length + (answered === qs.length ? " · ¡hecho!" : "");
            box.appendChild(el("p", { class: "q-why", html: "<strong>" + (oi === item.correcta ? "Correcto. " : "No exactamente. ") + "</strong>" + item.porque }));
          });
          btns.push(b); ul.appendChild(el("li", {}, b));
        });
        box.appendChild(ul); q.appendChild(box);
      });
    });
  }

  /* ---------- fórmulas (KaTeX bajo demanda) ---------- */
  function loadScript(src) {
    return new Promise(function (res, rej) { var s = el("script", { src: src }); s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  }
  function buildMath() {
    var page = $(".page"); if (!page) return;
    var txt = page.textContent;
    if (txt.indexOf("\\(") === -1 && txt.indexOf("\\[") === -1 && txt.indexOf("$$") === -1) return;
    var base = ROOT + "assets/vendor/katex/";
    document.head.appendChild(el("link", { rel: "stylesheet", href: base + "katex.min.css" }));
    loadScript(base + "katex.min.js").then(function () { return loadScript(base + "auto-render.min.js"); }).then(function () {
      window.renderMathInElement(page, {
        delimiters: [{ left: "$$", right: "$$", display: true }, { left: "\\[", right: "\\]", display: true }, { left: "\\(", right: "\\)", display: false }],
        throwOnError: false
      });
    }).catch(function (e) { console.error("KaTeX no cargó", e); });
  }

  /* ---------- arranque ---------- */
  function init() {
    buildChrome();
    buildToc();
    buildHero();
    buildModuleFooter();
    renderLists();
    buildCode();
    buildQuizzes();
    $$("abbr.t").forEach(function (a) { a.setAttribute("tabindex", "0"); });
    buildMath();
    if (window.Lab && Lab.init) Lab.init(document);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
