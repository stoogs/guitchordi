#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-only
"""Generate a host harness using the actual board OTA hooks plus upstream fake host.
USB registers and flash silicon are mocked; no physical-device operations exist.
"""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
s=(root/'third_party/fm1-platform/tests/ota_test.c').read_text()
s=s.replace('#define FELUCCA_ID "FM-1_900"','#include "../../firmware/fm1/identity.h"')
a=s.index('static uint32_t ota_now_ms(void)');b=s.index('static uint32_t ota_body_off(void)')
s=s[:a]+'#include "../../firmware/fm1/update.h"\n\n'+s[b:]
s=s.replace('mute_after = 0xFFFFFFFFu; corrupt_at = NULL; bad_erase = 0;', 'mute_after = 0xFFFFFFFFu; corrupt_at = NULL; bad_erase = 0; flash_ok=1; update_active=1; audio_running=0; writes=0; fail_write_at=write_attempts=0;')
s=s.replace('requests >= 10 && requests <= 30','requests >= 10 && requests <= 100')
s=s.replace('headers + loader + confirm, no head reads','headers + loader + confirm (stock includes head checks)')
s=s.replace('printf("%s\\n", bad ?', '''
    reset_dev();ota_session();unsigned total_writes=write_attempts;
    for(unsigned fail=1;fail<=total_writes;fail++) {
        reset_dev();fail_write_at=fail;int fault_rc=ota_session();
        if(fault_rc>=0 || committed || bad_erase || !area_erased()) {
            fprintf(stderr,"write failure not recovered at %u\\n",fail);bad++;
        }
    }
    printf("Injected failures at all %u staging write boundaries checked\\n",total_writes);
    if(ota_rd16(logical+ota_body_off()-32)==OTA_LDR_HCRC) {
        reset_dev();nor[0]^=1;int head_rc=ota_session();
        bad+=check("stock loader refuses mismatched protected head",head_rc==-5 && !committed && !bad_erase);
    }
    reset_dev();update_active=0;
    bad+=check("writes refused outside an active update",ota_erase(0xE0000)<0 && ota_prog(0xE0000,rx,1)<0 && writes==0);
    update_active=1;flash_ok=0;
    bad+=check("unknown flash ID refuses all writes",ota_erase(0xE0000)<0 && ota_prog(0xE0000,rx,1)<0 && writes==0);
    flash_ok=1;
    bad+=check("protected head/store/globals and overflow refused",
      ota_erase(0)<0 && ota_erase(0x97000)<0 && ota_erase(0xFC000)<0 &&
      ota_erase(0xE0001)<0 && ota_prog(0xE4FFF,rx,2)<0 &&
      ota_prog(0xFFFFFFF0,rx,64)<0 && ota_fread(0xFFFFFFF0,rx,64)<0 && writes==0);
    reset_dev();audio_running=1;update_active=0;usb.ota_req=1;
    for(unsigned i=0;i<2*HALF_WORDS;i++)audio_dma[i]=123;
    update_service();
    bad+=check("real entry quiesces audio before staging and commits",committed && !bad_erase && detached && panic_count);
    for(unsigned i=0;i<2*HALF_WORDS;i++)bad+=audio_dma[i]!=0;
    reset_dev();audio_running=1;update_active=0;usb.ota_req=1;mute_after=0;
    update_service();
    bad+=check("timeout resumes audio with no commit",!committed && audio_running && !update_active && area_erased());
    reset_dev();flash_ok=0;audio_running=1;update_active=0;usb.ota_req=1;
    update_service();
    bad+=check("unknown chip leaves instrument running without writes",!committed && !writes && audio_running && gm_update_code==-8);
    printf("%s\\n", bad ?''')
(root/'build/fm1/update-integration-test.c').write_text(s)
