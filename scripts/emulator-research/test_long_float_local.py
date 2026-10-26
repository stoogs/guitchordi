# SPDX-License-Identifier: GPL-2.0-or-later
"""Local compiler-derived long-IFF tests; no claim of hardware measurements."""
import struct,tempfile,unittest
from pathlib import Path
from support import ROOT,Guest,guest_state
class LongFloatTests(unittest.TestCase):
 def test_finite_relations_and_signed_zero(self):
  relations={0:lambda a,b:a==b,1:lambda a,b:a!=b,2:lambda a,b:a>=b,3:lambda a,b:a<b,8:lambda a,b:a>b,9:lambda a,b:a<=b,10:lambda a,b:a>=b,11:lambda a,b:a<b,12:lambda a,b:a>b,13:lambda a,b:a<=b}
  values=[(-2.,-1.),(-1.,-2.),(0.,-0.),(-0.,0.),(.5,1.),(1.,.5),(1.,1.)]
  directory=ROOT/'.cache/tests';directory.mkdir(parents=True,exist_ok=True)
  with tempfile.TemporaryDirectory(dir=directory) as tmp:
   for kind,relation in relations.items():
    for a,b in values:
     with self.subTest(kind=kind,a=a,b=b):
      g=Guest();g.literal(1,struct.unpack('<I',struct.pack('<f',a))[0]);g.literal(2,struct.unpack('<I',struct.pack('<f',b))[0]);g.literal(3,0)
      g.emit(0xff40|kind,0x1280,1);g.add(3,1)
      state=guest_state(Path(tmp),g)
      self.assertEqual(state['registers'][3],0 if relation(a,b) else 1)
