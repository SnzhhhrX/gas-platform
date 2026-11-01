"""Автоперевод всего русского контента (уроки, курсы, Pro, факты) офлайн-моделью NLLB-200.
Запуск (один раз, ~20-40 мин на CPU):
  pip install transformers sentencepiece torch
  python scripts/auto-translate.py        # оба языка
  python scripts/auto-translate.py en     # только English
Результат: src/lib/auto/en.json и kk.json — i18n.js подгружает их сам, код менять не нужно.
Уже переведённые вручную строки (dict.js, dict-en.js) не трогаются. Результат лучше просмотреть глазами."""
import glob, json, os, re, sys
from transformers import pipeline

LANGS = {'en': 'eng_Latn', 'kk': 'kaz_Cyrl'}
want = sys.argv[1:] or list(LANGS)
cyr = re.compile(r'[А-Яа-яЁё]')
src = glob.glob('src/data/*.js') + glob.glob('src/components/*.jsx') + glob.glob('src/lib/*.js')
known = set()
for f in ('src/lib/dict.js', 'src/lib/dict-en.js'):
    known |= {m.strip() for m in re.findall(r"\[\s*['\"]((?:[^'\"\\]|\\.)*)['\"]\s*,", open(f).read())}
keys = set()
for f in src:
    if f.endswith(('dict.js', 'dict-en.js')): continue
    s = open(f, encoding='utf8').read()
    for m in re.finditer(r"'((?:[^'\\\n]|\\.)*)'|\"((?:[^\"\\\n]|\\.)*)\"|`((?:[^`$\\]|\\.)*)`", s):
        t = next(g for g in m.groups() if g is not None)
        t = t.replace("\\'", "'").replace('\\"', '"').strip()
        if cyr.search(t) and t not in known and len(t) > 1: keys.add(t)
keys = sorted(keys, key=len)
print(len(keys), 'строк')
os.makedirs('src/lib/auto', exist_ok=True)
for lg in want:
    out_f = f'src/lib/auto/{lg}.json'
    out = json.load(open(out_f)) if os.path.exists(out_f) else {}
    todo = [k for k in keys if k not in out]
    tr = pipeline('translation', model='facebook/nllb-200-distilled-600M', src_lang='rus_Cyrl', tgt_lang=LANGS[lg], max_length=400)
    for i in range(0, len(todo), 16):
        batch = todo[i:i + 16]
        for k, r in zip(batch, tr(batch)): out[k] = r['translation_text']
        if i % 160 == 0:
            json.dump(out, open(out_f, 'w', encoding='utf8'), ensure_ascii=False); print(lg, i, '/', len(todo))
    json.dump(out, open(out_f, 'w', encoding='utf8'), ensure_ascii=False)
