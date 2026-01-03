# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_submodules

hiddenimports = ["mido.backends.rtmidi","rtmidi",]
hiddenimports += collect_submodules('app')


a = Analysis(
    ['dashboard\\main.py'],
    pathex=['dashboard'],
    binaries=[],
    datas=[('dashboard/settings.json', '.'), ('dashboard/settings_dscr.json', '.'), ('dashboard/templates', 'templates'), ('dashboard/static', 'static')],
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='main',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
