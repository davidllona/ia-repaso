#!/usr/bin/env python3
"""Reescribe enlaces  …/modulo-M.html#ancla  que apuntan a un módulo ya partido en lecciones,
para que vayan a  …/modulo-M/leccion-L.html#ancla  (la lección donde vive ese id).

Recorre todas las páginas HTML del sitio. Idempotente.
Uso:  python3 tools/fix_anchors.py [--dry]
"""
import os, re, sys, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DRY = "--dry" in sys.argv

# id -> lección, por módulo
where = {}
for f in glob.glob(os.path.join(ROOT, "curso-*", "modulo-*", "leccion-*.html")):
    mod_dir = os.path.dirname(f)
    for i in re.findall(r'\sid="([^"]+)"', open(f, encoding="utf-8").read()):
        where.setdefault((mod_dir, i), os.path.basename(f))

HREF = re.compile(r'href="([^"#]*?modulo-\d+\.html)#([^"]+)"')
changed = files = missing = 0
for page in glob.glob(os.path.join(ROOT, "**", "*.html"), recursive=True):
    if "/docs/" in page or "/tools/" in page:
        continue
    src = open(page, encoding="utf-8").read()
    base = os.path.dirname(page)

    def rep(m):
        global changed, missing
        path, anchor = m.group(1), m.group(2)
        target = os.path.normpath(os.path.join(base, path))
        mod_dir = target[:-5]  # quita .html
        if not os.path.isdir(mod_dir):
            return m.group(0)
        les = where.get((mod_dir, anchor))
        if not les:
            # el id puede seguir en el hub (p. ej. #lecciones)
            if os.path.exists(target) and re.search(r'\sid="%s"' % re.escape(anchor), open(target, encoding="utf-8").read()):
                return m.group(0)
            missing += 1
            print("  ancla no encontrada:", os.path.relpath(page, ROOT), "->", path + "#" + anchor)
            return m.group(0)
        changed += 1
        return 'href="%s/%s#%s"' % (path[:-5], les, anchor)

    new = HREF.sub(rep, src)
    if new != src:
        files += 1
        if not DRY:
            open(page, "w", encoding="utf-8").write(new)
print(f"{changed} enlaces reescritos en {files} páginas; {missing} anclas sin encontrar" + (" (dry run)" if DRY else ""))
