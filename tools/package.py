from pathlib import Path
import zipfile, shutil
root=Path(__file__).resolve().parents[1]
out=root.parent/'output';out.mkdir(exist_ok=True)
excluded={'reference','test-deps','node_modules','.git','screenshots','test-results','__pycache__'}
ignore_files={'refine.py','refine2.py','refine3.py','finalize.py'}
target=out/'Website_QLCL_To_Toan.zip'
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as z:
    for p in sorted(root.rglob('*')):
        if p.is_file() and not any(part in excluded for part in p.relative_to(root).parts) and p.name not in ignore_files:
            z.write(p,Path('Website_QLCL_To_Toan')/p.relative_to(root))
shutil.copy2(root/'dist'/'index.html',out/'index.html')
with zipfile.ZipFile(target) as z:
    assert z.testzip() is None
    assert 'Website_QLCL_To_Toan/backend/schema.sql' in z.namelist()
    assert 'Website_QLCL_To_Toan/dist/index.html' in z.namelist()
    assert not any('reference/' in n or 'test-deps/' in n for n in z.namelist())
    print('Packaged',len(z.namelist()),'files;',target.stat().st_size,'bytes')
