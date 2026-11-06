#!/usr/bin/env python3
"""Vuelca las lecciones de cada módulo en assets/js/curriculum.js.

Lee todos los ficheros  <dir>/cNmM.json  (por defecto docs/lecciones/) con la forma
  [{"n":1,"slug":"leccion-1","title":"…","blurb":"…","min":4}, …]
y escribe/actualiza la propiedad  lessons: [...]  del módulo M del curso N.
Es idempotente: se puede ejecutar tantas veces como se quiera.

Uso:  python3 tools/merge_lessons.py [carpeta_json]
"""
import json, re, sys, glob, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CUR = os.path.join(ROOT, "assets", "js", "curriculum.js")
DIR = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "docs", "lecciones")

src = open(CUR, encoding="utf-8").read()
changed = 0
for f in sorted(glob.glob(os.path.join(DIR, "c*m*.json"))):
    m = re.match(r"c(\d+)m(\d+)\.json$", os.path.basename(f))
    if not m:
        continue
    c, mod = int(m.group(1)), int(m.group(2))
    lessons = json.load(open(f, encoding="utf-8"))
    for i, l in enumerate(lessons, 1):
        l.setdefault("n", i); l.setdefault("slug", "leccion-%d" % l["n"])
    # localizar el curso
    cm = re.search(r"\{\s*id:\s*%d\s*,.*?modules:\s*\[" % c, src, re.S)
    if not cm:
        print("curso %d no encontrado" % c); continue
    start = cm.end()
    # localizar el módulo dentro del curso
    mm = re.compile(r"(\{\s*n:\s*%d\s*,\s*slug:\s*\"modulo-%d\".*?tags:\s*\[[^\]]*\])(\s*,\s*lessons:\s*\[.*?\n\s*\])?(\s*\})" % (mod, mod), re.S)
    found = mm.search(src, start)
    if not found:
        print("módulo c%dm%d no encontrado" % (c, mod)); continue
    body = ",\n          lessons: [\n" + ",\n".join(
        "            " + json.dumps(l, ensure_ascii=False) for l in lessons) + "\n          ]"
    new = found.group(1) + body + found.group(3)
    if src[found.start():found.end()] != new:
        src = src[:found.start()] + new + src[found.end():]
        changed += 1
        print("c%dm%d: %d lecciones" % (c, mod, len(lessons)))
open(CUR, "w", encoding="utf-8").write(src)
print("curriculum.js actualizado (%d módulos cambiados)" % changed)
