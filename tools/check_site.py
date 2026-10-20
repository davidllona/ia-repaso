#!/usr/bin/env python3
"""
Comprobador automático de la web (Playwright).

Uso:
    python3 tools/check_site.py                  # revisa todas las páginas
    python3 tools/check_site.py curso-1/modulo-1.html   # solo algunas
    python3 tools/check_site.py --shots /ruta/capturas curso-1/modulo-1.html

Qué comprueba en cada página:
  * Errores de consola, excepciones y recursos que no cargan.
  * Que todas las demos (figure.demo) se montan sin error.
  * Que los enlaces internos apuntan a archivos que existen.
  * Que cada bloque de código tiene explicada TODA línea no vacía
    (filas <tr data-lines="..."> de la tabla «línea por línea»).
  * Que los cuestionarios se generan.
  * Que no hay scroll horizontal en móvil (375 px).
"""
import argparse, http.server, socketserver, threading, sys, re, os, json
from pathlib import Path
from urllib.parse import urlparse, urljoin
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent


def serve():
    handler = lambda *a, **k: http.server.SimpleHTTPRequestHandler(*a, directory=str(ROOT), **k)
    handler.log_message = lambda *a, **k: None
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a, **k):
            pass
    def make(*a, **k):
        return Quiet(*a, directory=str(ROOT), **k)
    srv = socketserver.TCPServer(("127.0.0.1", 0), make)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, srv.server_address[1]


def parse_lines(spec):
    out = []
    for part in (spec or "").split(","):
        m = re.match(r"^\s*(\d+)(?:\s*-\s*(\d+))?\s*$", part)
        if m:
            a = int(m.group(1)); b = int(m.group(2) or a)
            out.extend(range(a, b + 1))
    return out


def check_page(browser, base, rel, shots):
    problems = []
    url = f"{base}/{rel}"
    ctx = browser.new_context(viewport={"width": 1280, "height": 900}, reduced_motion="reduce")
    page = ctx.new_page()
    logs = []
    page.on("console", lambda m: logs.append(f"console.{m.type}: {m.text}") if m.type in ("error", "warning") else None)
    page.on("pageerror", lambda e: logs.append(f"pageerror: {e}"))
    page.on("requestfailed", lambda r: logs.append(f"requestfailed: {r.url}"))
    page.on("response", lambda r: logs.append(f"HTTP {r.status}: {r.url}") if r.status >= 400 else None)
    page.goto(url, wait_until="networkidle")
    page.wait_for_timeout(300)

    # Recorrer la página para disparar la carga perezosa de las demos
    height = page.evaluate("document.documentElement.scrollHeight")
    y = 0
    while y < height:
        page.evaluate(f"window.scrollTo(0,{y})")
        page.wait_for_timeout(120)
        y += 500
        height = page.evaluate("document.documentElement.scrollHeight")
    page.wait_for_timeout(1500)

    for l in logs:
        problems.append(l)

    n_demos = page.evaluate("document.querySelectorAll('figure.demo[data-demo]').length")
    if n_demos:
        bad = page.evaluate("""() => Array.from(document.querySelectorAll('figure.demo')).filter(f =>
            f.querySelector('.demo-error') || f.querySelector('.demo-loading')).map(f => f.getAttribute('data-demo') + ' :: ' + ((f.querySelector('.demo-error')||{}).textContent || 'sin montar'))""")
        for b in bad:
            problems.append(f"DEMO no montada: {b}")
        empty = page.evaluate("""() => Array.from(document.querySelectorAll('figure.demo')).filter(f => {
            const b = f.querySelector('.demo-body'); return b && !b.querySelector('canvas,svg,.lab-controls,.lab-readout,table'); }).map(f => f.getAttribute('data-demo'))""")
        for b in empty:
            problems.append(f"DEMO vacía (sin canvas/controles): {b}")

    # Código: cobertura línea por línea
    snippets = page.evaluate("""() => Array.from(document.querySelectorAll('.snippet')).map(s => {
        const lines = Array.from(s.querySelectorAll('pre.code .ln')).map(l => l.textContent.replace(/\\u200b/g,''));
        const rows = Array.from(s.querySelectorAll('table.lineas tr[data-lines]')).map(r => r.getAttribute('data-lines'));
        const title = (s.querySelector('h3')||{}).textContent || '';
        const hasOut = !!s.querySelector('.salida'); const hasWhy = !!s.querySelector('.para-que');
        return {title, lines, rows, hasOut, hasWhy};
    })""")
    for sn in snippets:
        covered = set()
        for spec in sn["rows"]:
            for n in parse_lines(spec):
                if n < 1 or n > len(sn["lines"]):
                    problems.append(f"CÓDIGO «{sn['title'][:40]}»: data-lines='{spec}' fuera de rango (1-{len(sn['lines'])})")
                covered.add(n)
        for i, text in enumerate(sn["lines"], start=1):
            if text.strip() and i not in covered:
                problems.append(f"CÓDIGO «{sn['title'][:40]}»: línea {i} sin explicar → {text.strip()[:50]}")
        if not sn["hasWhy"]:
            problems.append(f"CÓDIGO «{sn['title'][:40]}»: falta «Para qué sirve»")
        if not sn["hasOut"]:
            problems.append(f"CÓDIGO «{sn['title'][:40]}»: falta «Salida esperada»")

    # Quiz
    quizzes = page.evaluate("Array.from(document.querySelectorAll('.quiz')).map(q => q.querySelectorAll('.q').length)")
    for i, n in enumerate(quizzes):
        if n == 0:
            problems.append(f"QUIZ {i+1}: sin preguntas (¿JSON inválido?)")

    # Enlaces internos
    hrefs = page.evaluate("Array.from(document.querySelectorAll('a[href]')).map(a => a.getAttribute('href'))")
    for h in set(hrefs):
        if h.startswith(("http://", "https://", "mailto:", "#", "javascript:", "data:")):
            continue
        target = urlparse(urljoin(url, h)).path
        fp = ROOT / target.lstrip("/")
        if fp.is_dir():
            fp = fp / "index.html"
        if not fp.exists():
            problems.append(f"ENLACE roto: {h}")
    # anclas internas
    anchors = page.evaluate("Array.from(document.querySelectorAll('a[href^=\"#\"]')).map(a => a.getAttribute('href').slice(1)).filter(x => x && !document.getElementById(x))")
    for a in anchors:
        problems.append(f"ANCLA sin destino: #{a}")

    # Capturas de demos
    if shots:
        os.makedirs(shots, exist_ok=True)
        stem = rel.replace("/", "_").replace(".html", "")
        figs = page.query_selector_all("figure.demo")
        for i, f in enumerate(figs, start=1):
            f.scroll_into_view_if_needed()
            page.wait_for_timeout(200)
            f.screenshot(path=f"{shots}/{stem}_demo{i}.png")
        snips = page.query_selector_all(".snippet")
        for i, f in enumerate(snips[:2], start=1):
            f.scroll_into_view_if_needed()
            f.screenshot(path=f"{shots}/{stem}_code{i}.png")
        page.evaluate("window.scrollTo(0,0)")
        page.wait_for_timeout(200)
        page.screenshot(path=f"{shots}/{stem}_top.png")
    ctx.close()

    # Móvil: sin scroll horizontal
    mctx = browser.new_context(viewport={"width": 375, "height": 800}, reduced_motion="reduce")
    mp = mctx.new_page()
    mp.goto(url, wait_until="networkidle")
    mp.wait_for_timeout(300)
    h = mp.evaluate("document.documentElement.scrollHeight")
    y = 0
    while y < h:
        mp.evaluate(f"window.scrollTo(0,{y})"); mp.wait_for_timeout(80); y += 600
        h = mp.evaluate("document.documentElement.scrollHeight")
    mp.wait_for_timeout(800)
    over = mp.evaluate("""() => { const w = document.documentElement.clientWidth; const bad = [];
        document.querySelectorAll('main *').forEach(e => { const r = e.getBoundingClientRect();
          if (r.right > w + 2 && r.width > 0 && !e.closest('pre,table,.codewrap,.lab-table,[style*=overflow],.katex-display,.formula')) bad.push(e.tagName + '.' + (e.className||'').toString().slice(0,30)); });
        return {sw: document.documentElement.scrollWidth, w, bad: bad.slice(0,5)}; }""")
    if over["sw"] > over["w"] + 1:
        problems.append(f"MÓVIL: scroll horizontal (ancho {over['sw']} > {over['w']}) por {over['bad']}")
    if shots:
        mp.evaluate("window.scrollTo(0,0)")
        mp.screenshot(path=f"{shots}/{rel.replace('/', '_').replace('.html', '')}_mobile.png")
    mctx.close()
    return problems


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("pages", nargs="*")
    ap.add_argument("--shots", default=None)
    args = ap.parse_args()
    pages = args.pages or sorted(str(p.relative_to(ROOT)) for p in ROOT.rglob("*.html")
                                 if not any(part in ("node_modules", "docs", "tools") for part in p.parts))
    srv, port = serve()
    base = f"http://127.0.0.1:{port}"
    total = 0
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for rel in pages:
            probs = check_page(browser, base, rel, args.shots)
            total += len(probs)
            status = "OK " if not probs else "FALLO"
            print(f"[{status}] {rel}")
            for pr in probs:
                print("     -", pr)
        browser.close()
    srv.shutdown()
    print(f"\n{len(pages)} páginas revisadas, {total} problemas.")
    sys.exit(1 if total else 0)


if __name__ == "__main__":
    main()
