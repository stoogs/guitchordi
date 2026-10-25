#!/usr/bin/env python3
"""Generate a host-only power-interruption harness around the pinned loader test.
Never opens hardware. Keeps vendored upstream sources byte-identical.
"""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
s=(root/'third_party/fm1-platform/tests/ldr_test.c').read_text()
s=s[:s.index('int main(int argc, char **argv)')]
s=s.replace('#include <stdint.h>','#include <stdint.h>\n#include <setjmp.h>\nstatic jmp_buf cut;static unsigned operations,fail_after;\nstatic void powercut(void){if(++operations==fail_after)longjmp(cut,1);}')
s=s.replace('memset(nor + off, 0xFF, 0x1000);','memset(nor + off, 0xFF, 0x1000);powercut();')
s=s.replace('for (i = 0; i < n; i++) nor[off + i] &= s[i];','for (i = 0; i < n; i++) nor[off + i] &= s[i];powercut();')
s+='''
static void reset_flash(const uint8_t *old,uint32_t ofo) {
    memset(nor,0xff,sizeof nor);memcpy(nor,old+ofo,0x93000);
    uint8_t r[112]={0};r[2]=0x0D;r[3]=0x5A;r[4]=0x01;r[5]=0x5A;r[6]=0x41;r[7]=0x54;
    ota_wr16(r,ota_crc16(r+2,78,0));memcpy(nor+0xE4F00,r,sizeof r);
    requests=erases=bad_range=record_cleared=f0_asked=now_ms=rx_full=operations=0;
}
int main(int argc,char **argv) {
    if(argc!=3)return 2;
    size_t old_len;uint8_t *old=load_logical(argv[1],&old_len);
    logical=load_logical(argv[2],&logical_len);
    uint32_t ofo=flash_off(old),nfo=flash_off(logical);
    reset_flash(old,ofo);fail_after=0;if(ldr_session())return 3;unsigned total=operations;
    for(unsigned stop=1;stop<=total;stop++) {
        reset_flash(old,ofo);fail_after=stop;
        if(!setjmp(cut)){if(ldr_session())return 4;fprintf(stderr,"missing interruption %u\\n",stop);return 5;}
        if(memcmp(nor,old+ofo,0x4000)||bad_range)return 6;
        // Simulate loader re-entry while retaining flash but losing transient transport state.
        fail_after=0;rx_full=0;now_ms=0;
        if(ldr_session()||bad_range)return 7;
        if(memcmp(nor,old+ofo,0x4000))return 8;
        if(memcmp(nor+0x4000,logical+nfo+0x4000,0x93000-0x4000))return 9;
        for(unsigned i=0xfc000;i<sizeof nor;i++)if(nor[i]!=0xff)return 10;
    }
    printf("Loader re-entry after simulated power cuts: %u/%u flash operation boundaries passed; protected head and globals untouched\\n",total,total);
    return 0;
}
'''
(root/'build/fm1/loader-interruption-test.c').write_text(s)
