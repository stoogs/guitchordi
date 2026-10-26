# SPDX-License-Identifier: GPL-2.0-or-later
"""Compiler-derived E1D8 kind 3; large counts deliberately remain unsupported."""
import tempfile,unittest
from pathlib import Path
from support import ROOT,Guest,guest_state,run_guest
class SignedPairTests(unittest.TestCase):
 def test_signed_shift_values_and_flags(self):
  directory=ROOT/'.cache/tests';directory.mkdir(parents=True,exist_ok=True)
  with tempfile.TemporaryDirectory(dir=directory) as tmp:
   for high in (0x81234567,0x12345678):
    for shift in (0,1,13,31,32,63):
     g=Guest();g.literal(7,0x89abcde5);g.emit(0xe064,0x7580);g.literal(4,0x89abcdef);g.literal(5,high);g.literal(1,shift);g.emit(0xe1d8,0x4103)
     state=guest_state(Path(tmp),g);v=(high<<32)|0x89abcdef
     if high&0x80000000:v-=1<<64
     expected=(v>>shift)&((1<<64)-1)
     self.assertEqual(state['registers'][4:6],[expected&0xffffffff,expected>>32])
     self.assertEqual(state['specials'][5],0x89abcde5)
   g=Guest();g.literal(4,0);g.literal(5,0);g.literal(1,64);g.emit(0xe1d8,0x4103)
   self.assertNotEqual(run_guest(Path(tmp),g).returncode,0)
