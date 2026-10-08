"""Sync manually checked LaTeX Markdown without changing samples or self-tests."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
path = ROOT / 'src/data/icpc-online-2026-1.json'
data = json.loads(path.read_text(encoding='utf-8'))
for p in data:
    draft = ROOT / f'statements/icpc-online-2026-1/{p["id"]}.md'
    text = draft.read_text(encoding='utf-8').split('\n\n', 1)[1].strip()
    assert '## Input' in text and '## Output' in text
    p['markdown'] = text
    p['statementFormat'] = 'markdown'
path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('14 statements synced; original samples, checkers and 15 self-tests preserved.')
