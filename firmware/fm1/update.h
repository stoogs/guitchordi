/* SPDX-License-Identifier: GPL-3.0-only
 * Guitchordi integration of the retained Felucca/X0X USB and OTA components.
 * Hook sequencing adapted from X0X x0x.c/main_fm1.c at manifest revision.
 * Copyright (C) 2026 Leo Kuroshita (@kurogedelic), Hügelton Instruments
 * X0X adaptations: Charles Vestal. Guitchordi integration: Stoogs contributors.
 */
#define FELUCCA_OTA 1
#define FELUCCA_CDC 0
#define FELUCCA_UAC 0
#define FELUCCA_ID GM_FIRMWARE_ID
#define RING_PUBLISH() __asm__ volatile("" ::: "memory")
/* Runtime writes are confined to the update staging area. No project writes. */
#define FL_RANGE_OK(off,n) FL_IN(off,n,0xE0000u,0xE5000u)
#include "fm1_flash.h"
#include "gm_usb.c"
#include "../../third_party/fm1-platform/firmware/src/ota.c"
static uint8_t flash_ok;
static volatile uint8_t update_active;
volatile uint32_t gm_update_step;
volatile int32_t gm_update_code;
static uint32_t ota_now_ms(void) { return milliseconds; }
static void ota_idle(void) { fm1_wdt_feed(); }
static int ota_erase(uint32_t off) {
    uint32_t took;
    if(!flash_ok || !update_active || (off&0xfffu) || !FL_RANGE_OK(off,4096u)) return -8;
    return fl_erase4k(off,&took);
}
static int ota_prog(uint32_t off,const void *p,uint32_t n) {
    if(!flash_ok || !update_active || !FL_RANGE_OK(off,n)) return -8;
    return fl_write(off,p,n);
}
static int ota_fread(uint32_t off,void *p,uint32_t n) {
    if(!flash_ok || !FL_IN(off,n,0u,0x100000u)) return -8;
    uint8_t *d=p;
    while(n) {
        uint32_t k=n>256u?256u:n;
        fm1_irq_off(); int rc=FL_FAR(fl_read_ram)(off,d,k); fm1_irq_on();
        if(rc) return rc;
        off+=k; d+=k; n-=k;
    }
    return 0;
}
static void ota_show(uint32_t step,int32_t code) {
    gm_update_step=step; gm_update_code=code;
    /* Keep LCD transfers out of the update transaction; inspected via debugger.
     * Device UI progress remains a qualification item. */
}
static void ota_commit(const uint8_t *parm) {
    gm_bootguard.pending=gm_bootguard.failed=0;
    usb_detach(); fm1_delay_ms(30); fm1_enter_update(parm);
}
static void update_quiesce(void) {
    fm1_irq_off();
    update_active=1;
    fm1_audio_stop(); fm1_irq_mask(FM1_IRQ_ALNK0);
    for(uint32_t i=0;i<2u*HALF_WORDS;i++) audio_dma[i]=0;
    fw_panic();
    fm1_irq_on();
    lcd_sync();
}
static void update_resume(void) {
    /* Failed/aborted update: leave transport stopped and the output silent.
     * fw_panic requires contacts to be released before playback resumes. */
    fm1_irq_off();
    fw_panic();
    update_active=0;
    fm1_guard_unlock_top(); /* audio_init reattaches the IRQ vector */
    fm1_audio_init(audio_dma,HALF_WORDS,isr_alnk0,3);
    fm1_guard_lock_top();
    fm1_irq_on();
}
static void update_service(void) {
    ota_service();
    if(usb.uboot_req) {
        update_quiesce(); usb_detach(); gm_bootguard.pending=0; fm1_enter_uboot();
    }
    if(usb.ota_req) {
        usb.ota_req=0;
        if(!flash_ok) { gm_update_step=9; gm_update_code=-8; return; }
        update_quiesce();
        ota_session(); /* Successful commit resets. Return means refused/failed. */
        update_resume();
    }
}
