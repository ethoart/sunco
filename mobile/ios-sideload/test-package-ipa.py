"""Packaging checks use temporary fixtures; they do not compile an iOS app."""
import plistlib
import struct
import subprocess
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

class PackagingTests(unittest.TestCase):
    def test_device_payload_preserves_executable_permission(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);app=root/'App.app';app.mkdir()
            with (app/'Info.plist').open('wb') as file:
                plistlib.dump({'DTPlatformName':'iphoneos','CFBundleSupportedPlatforms':['iPhoneOS'],'CFBundleExecutable':'App'},file)
            # Header fixture for the packager, not a runnable binary.
            (app/'App').write_bytes(struct.pack('<III',0xfeedfacf,0x0100000c,0))
            (app/'App').chmod(0o755)
            result=subprocess.run([sys.executable,'package-ipa.py',str(app),str(root/'test.ipa')],capture_output=True)
            self.assertEqual(result.returncode,0,result.stderr)
            with zipfile.ZipFile(root/'test.ipa') as archive:
                self.assertIn('Payload/App.app/Info.plist',archive.namelist())
                self.assertTrue((archive.getinfo('Payload/App.app/App').external_attr>>16)&0o100)

    def test_simulator_app_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);app=root/'App.app';app.mkdir()
            with (app/'Info.plist').open('wb') as file:
                plistlib.dump({'DTPlatformName':'iphonesimulator','CFBundleSupportedPlatforms':['iPhoneSimulator']},file)
            result=subprocess.run([sys.executable,'package-ipa.py',str(app),str(root/'test.ipa')],capture_output=True)
            self.assertNotEqual(result.returncode,0)
            self.assertIn(b'not a simulator',result.stderr)
            self.assertFalse((root/'test.ipa').exists())

if __name__=='__main__':
    unittest.main()
