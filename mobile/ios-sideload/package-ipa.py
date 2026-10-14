#!/usr/bin/env python3
"""Package a compiled ARM64 iPhone app for local signing by Sideloadly/AltStore."""
import argparse
import os
import plistlib
import stat
import struct
import zipfile
from pathlib import Path

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('app',type=Path)
    parser.add_argument('output',type=Path)
    args=parser.parse_args()
    with (args.app/'Info.plist').open('rb') as file:
        info=plistlib.load(file)
    if info.get('DTPlatformName')!='iphoneos' or 'iPhoneOS' not in info.get('CFBundleSupportedPlatforms',[]):
        parser.error('Expected an iPhone device build, not a simulator app.')
    executable=args.app/info['CFBundleExecutable']
    with executable.open('rb') as file:
        header=file.read(12)
    if len(header)!=12 or struct.unpack('<II',header[:8])!=(0xfeedfacf,0x0100000c):
        parser.error('Expected a compiled ARM64 Mach-O executable.')
    if not executable.stat().st_mode&stat.S_IXUSR:
        parser.error('App executable is missing its executable permission.')
    args.output.parent.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(args.output,'w',compression=zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(args.app.rglob('*')):
            relative=Path('Payload')/args.app.name/path.relative_to(args.app)
            if path.is_symlink():
                entry=zipfile.ZipInfo(relative.as_posix())
                entry.create_system=3
                entry.external_attr=(stat.S_IFLNK|0o777)<<16
                archive.writestr(entry,os.readlink(path))
            elif path.is_file():
                archive.write(path,relative.as_posix())
    print(args.output)

if __name__=='__main__':
    main()
