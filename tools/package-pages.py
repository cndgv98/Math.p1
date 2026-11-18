from pathlib import Path
import zipfile

root=Path(__file__).resolve().parents[1]
out=root.parent/'output'
out.mkdir(exist_ok=True)
excluded={'reference','test-deps','node_modules','.git','screenshots','test-results','__pycache__'}
ignore={'refine.py','refine2.py','refine3.py','finalize.py'}
source_zip=out/'Website_QLCL_GitHub_Pages.zip'
static_zip=out/'Website_QLCL_Pages_Tinh.zip'
# Exclusive creation: never overwrite an existing deliverable or backup.
for target in [source_zip,static_zip]:
    if target.exists():
        raise FileExistsError(f'Output already exists; choose a new filename: {target.name}')
with zipfile.ZipFile(source_zip,'x',zipfile.ZIP_DEFLATED) as z:
    for p in sorted(root.rglob('*')):
        if p.is_file() and not any(part in excluded for part in p.relative_to(root).parts) and p.name not in ignore:
            z.write(p,Path('Website_QLCL_To_Toan')/p.relative_to(root))
with zipfile.ZipFile(static_zip,'x',zipfile.ZIP_DEFLATED) as z:
    for name in ['index.html','.nojekyll']:
        z.write(root/'pages-dist'/name,name)
for target in [source_zip,static_zip]:
    with zipfile.ZipFile(target) as z:
        assert z.testzip() is None
        if target==source_zip:
            assert 'Website_QLCL_To_Toan/.github/workflows/pages.yml' in z.namelist()
        print(target.name, len(z.namelist()), 'files', target.stat().st_size, 'bytes')
