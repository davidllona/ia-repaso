#!/usr/bin/env python3
"""Cuenta las palabras VISIBLES de cada lección (sin «Profundizar», código, quiz ni scripts)
y avisa si pasan del límite (objetivo 700, máximo 900 ≈ 4–5 minutos de lectura).

Uso:  python3 tools/palabras.py curso-1/modulo-1/            # carpeta
      python3 tools/palabras.py curso-1/modulo-1/leccion-2.html
"""
import re, sys, os, glob

LIMITE, OBJETIVO = 900, 700

def visibles(html):
    s = re.sub(r"<script.*?</script>|<style.*?</style>", "", html, flags=re.S)
    # quitar bloques plegados y código
    # todo lo que hay desde «Profundizar» hasta el final no cuenta (Profundizar + Código)
    s = re.sub(r'<details class="profundizar".*', "", s, flags=re.S)
    s = re.sub(r"<article class=\"snippet\".*?</article>", "", s, flags=re.S)
    s = re.sub(r"<section class=\"quiz[^\"]*\">.*?</section>", "", s, flags=re.S)
    s = re.sub(r"<pre.*?</pre>", "", s, flags=re.S)
    s = re.sub(r"<[^>]+>", " ", s)
    return len(s.split())

paths = []
for a in sys.argv[1:] or ["."]:
    if os.path.isdir(a): paths += sorted(glob.glob(os.path.join(a, "leccion-*.html")))
    else: paths.append(a)
mal = 0
for p in paths:
    n = visibles(open(p, encoding="utf-8").read())
    mins = max(1, round(n / 200))
    flag = "  ← PASA DEL LÍMITE" if n > LIMITE else ("  (largo)" if n > OBJETIVO else "")
    if n > LIMITE: mal += 1
    print(f"{p}: {n} palabras visibles ≈ {mins} min{flag}")
print(f"{len(paths)} lecciones, {mal} por encima de {LIMITE}")
sys.exit(1 if mal else 0)
