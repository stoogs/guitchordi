# SPDX-License-Identifier: GPL-2.0-or-later
"""Local BAUD 0 extension: same pixels, divisor-based timing, invalid baud rejected."""
from test_lcd import LCDDMATests,LCDGuest,SPI,SRAM_END,PIXELS
class LCDZeroBaudTests(LCDDMATests):
 def test_baud_zero_pixels_and_timing(self):
  times={}
  for baud in (0,4):
   g=LCDGuest();g.write(SPI+4,baud)
   source=SRAM_END-len(PIXELS)
   for offset in range(0,len(PIXELS),4):g.write(source+offset,int.from_bytes(PIXELS[offset:offset+4],'little'))
   g.dma(source,len(PIXELS))
   result,state,pending=self.run_lcd(g)
   self.assertEqual(result.returncode,0,result.stderr)
   self.assertEqual(state['lcd']['pixels_written'],4)
   self.assertEqual(pending,(0,0x8000,0))
   times[baud]=state['virtual_ns']
  self.assertLess(times[0],times[4])
