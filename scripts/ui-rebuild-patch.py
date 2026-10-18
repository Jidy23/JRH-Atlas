from pathlib import Path

def edit(path, old, new):
    p = Path(path)
    s = p.read_text()
    if new in s:
        return
    if old not in s:
        raise RuntimeError(f'Expected source not found: {path}: {old[:70]}')
    p.write_text(s.replace(old, new, 1))

edit('app/page.tsx', 'return <main className="studio">', 'return <section className="studio" aria-label="Explorateur anatomique 3D">')
edit('app/page.tsx', 'aria-label="Explorateur anatomique 3D"', 'aria-label="Penjelajah anatomi 3D"')
edit('app/page.tsx', ' </main>;', ' </section>;')
edit('app/page.tsx', "const key=(e:KeyboardEvent)=>{if(e.key==='/'", "const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){setPanel(null);return;}if(e.key==='/'")
edit('app/page.tsx', 'Tubuh, ditelanjangi.', 'Tentang JRH Atlas')
edit('app/akademi.tsx', "import './akademi.css';", "import './akademi.css';\nimport './interaction.css';")
edit('app/akademi.tsx', 'role="radiogroup"', 'role="group"')
edit('app/akademi.tsx', 'role="radio"\n          aria-checked={v === j.id}', 'aria-pressed={v === j.id}')
edit('app/akademi.tsx', '<div className="umpan">', '<div className="umpan" role="status" aria-live="polite">')
edit('app/akademi.tsx', 'const [dihafal, setDihafal] = useState(0);', 'const [dihafal, setDihafal] = useState<Set<string>>(() => new Set());')
edit('app/akademi.tsx', 'const k = kartu[i % total];', 'const k = kartu[i % total];\n  const hafalTerlihat = kartu.filter(c => dihafal.has(`${mode}:${c.organ}`)).length;')
edit('app/akademi.tsx', 'if (hafal) setDihafal((h) => h + 1);', "setDihafal(previous => {\n      const next = new Set(previous);\n      const key = `${mode}:${k.organ}`;\n      if (hafal) next.add(key); else next.delete(key);\n      return next;\n    });")
edit('app/akademi.tsx', '  return (\n    <section className="akademi">\n      <h2>Flashcard</h2>', '  if (!k) return <section className="akademi"><h2>Flashcard</h2><p role="status">Belum ada kartu untuk filter ini.</p></section>;\n\n  return (\n    <section className="akademi">\n      <h2>Flashcard</h2>')
edit('app/akademi.tsx', '{dihafal > 0 ? `${dihafal} kartu ditandai hafal sesi ini. ` : \'\'}', '{`${hafalTerlihat} dari ${total} kartu unik ditandai hafal pada filter ini. `}')
