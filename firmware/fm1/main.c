/* SPDX-License-Identifier: GPL-3.0-only
 * Experimental Guitchordi board adapter. Startup sequence follows Felucca/X0X;
 * see third_party/fm1-platform/README.md. Not hardware-qualified. */
#include <stdint.h>
#include "fm1_cc.h"
#include "fm1_time.h"
#include "fm1_sys.h"
#include "fm1_irq.h"
#include "fm1_guard.h"
#include "fm1_input.h"
#include "fm1_timer.h"
#include "fm1_audio.h"
#include "fm1_adc.h"
#include "fm1_lcd_hw.h"
#include "../app.h"
#include "../../dsp/engine.h"
#include "../../third_party/fm1-platform/firmware/src/libc.c"
#include "../../third_party/fm1-platform/firmware/src/lcd.c"

unsigned strlen(const char *s) { unsigned n=0; while(s[n]) n++; return n; }

#define HALF_FRAMES 128u
#define HALF_WORDS (2u * HALF_FRAMES)
static int32_t audio_dma[2u * HALF_WORDS] __attribute__((aligned(4)));
static uint16_t lcd_strip[240u * 8u];
static volatile uint32_t milliseconds, master_value = 60;
// Monochrome suggestion LEDs: high continuous, medium 1/2, low 1/6 scan frames.
static uint8_t hint_medium[FM1_NCOL],hint_low[FM1_NCOL];
/* Default Felucca physical panel mapping; requires device verification/calibration. */
static const uint8_t button_map[14] = {2,3,4,5,6,7,8,9,10,11,12,13,0,1};
static const uint8_t encoder_map[7] = {0,1,6,2,3,4,5};
struct { uint32_t magic, pending, failed; } gm_bootguard __attribute__((section(".noinit")));
/* Observable in a debugger/link map; no USB debug commands in this first slice. */
volatile struct { uint32_t halves, max_render_us, late_halves, frames; } gm_device;
extern void isr_timer5(void), isr_alnk0(void);
extern uint32_t _data_start[], _data_end[], _data_load[], _bss_start[], _bss_end[];
extern uint32_t _pool_start[], _pool_end[], _rt_start[], _rt_end[], _rt_load[];

void fm1_timer5_irq(void) {
    static uint32_t last, remainder;
    static uint8_t seeded;
    fm1_timer5_ack(); fm1_input_tick();
    static uint32_t led_frame;
    if(led_frame!=fm1_in.frames) {
        led_frame=fm1_in.frames;
        for(uint32_t col=0;col<FM1_NCOL;col++)
            fm1_led_dim[col]=hint_medium[col] | (led_frame%3u==0?hint_low[col]:0);
    }
    uint32_t now = fm1_ticks();
    if(!seeded) { last=now; seeded=1; }
    remainder += now-last; last=now;
    milliseconds += remainder / (1000u * FM1_TICKS_PER_US);
    remainder %= 1000u * FM1_TICKS_PER_US;
}
void fm1_alnk0_irq(void) {
    uint8_t pending=fm1_audio_pending(); fm1_audio_ack_aux(pending);
    if (!(pending & FM1_AUDIO_HALF)) return;
    uint32_t half=fm1_audio_free_half(), start=fm1_ticks();
    /* Application and DSP state have one owner: the audio interrupt. Timer5 only scans inputs. */
    fw_keys(fm1_in.notes);
    for (uint32_t i=0;i<14;i++) fw_button(i,(fm1_in.buttons >> button_map[i]) & 1u);
    for (uint32_t i=0;i<7;i++) {
        /* Already in an ISR: do not use fm1_enc_take (unconditionally enables interrupts). */
        fm1_irq_off(); int steps=fm1_in.enc_steps[encoder_map[i]];
        fm1_in.enc_steps[encoder_map[i]]=0; fm1_irq_on();
        if (steps) fw_encoder(i,steps);
    }
    static uint32_t applied_master=0xffffffffu;
    if(applied_master!=master_value) { applied_master=master_value; fw_master((int)applied_master); }
    float *samples=fw_render(HALF_FRAMES);
    int32_t *out=audio_dma+half*HALF_WORDS;
    for (uint32_t i=0;i<HALF_FRAMES;i++) {
        /* 24-bit signed samples, left-justified in each I2S word. */
        int32_t sample=(int32_t)(samples[i] * 8388607.0f);
        out[i*2]=out[i*2+1]=(int32_t)((uint32_t)sample << 8);
    }
    uint32_t us=(fm1_ticks()-start)/FM1_TICKS_PER_US;
    if(us>gm_device.max_render_us) gm_device.max_render_us=us;
    gm_device.halves++; fm1_audio_ack_half();
    if(fm1_audio_free_half()!=half) gm_device.late_halves++;
}
static void fm1_fault(const fm1_crash_t *crash) {
    (void)crash; fm1_audio_stop(); fm1_enter_uboot();
}
static void screen_flush(void) {
    uint16_t *pixels=fw_frame();
    for(uint32_t y=0;y<240;y+=8) {
        lcd_sync();
        for(uint32_t i=0;i<240u*8u;i++) {
            uint16_t p=pixels[y*240+i]; lcd_strip[i]=(uint16_t)((p>>8)|(p<<8));
        }
        lcd_blit(0,y,240,8,lcd_strip);
        fm1_wdt_feed();
    }
    lcd_sync(); gm_device.frames++;
}
void fm1_cstart(void) {
    /* Hold the second core across resets; this first target uses core zero only. */
    *(volatile uint32_t *)0x1EEE004u |= 2u;
    *(volatile uint32_t *)0x1EEE004u &= ~8u;
    fm1_time_init(); fm1_wdt_arm(0x0D);
    if(gm_bootguard.magic!=0x474d4247u) {
        gm_bootguard.magic=0x474d4247u; gm_bootguard.pending=gm_bootguard.failed=0;
    }
    if(gm_bootguard.pending) gm_bootguard.failed++;
    gm_bootguard.pending=1;
    if(gm_bootguard.failed>=2) { gm_bootguard.pending=0; gm_bootguard.failed=0; fm1_enter_uboot(); }
    fm1_irq_init();
    for(uint32_t *d=_bss_start;d<_bss_end;d++) *d=0;
    for(uint32_t *d=_pool_start;d<_pool_end;d++) *d=0;
    for(uint32_t *s=_data_load,*d=_data_start;d<_data_end;s++,d++) *d=*s;
    for(uint32_t *s=_rt_load,*d=_rt_start;d<_rt_end;s++,d++) *d=*s;
    fm1_mailbox_clear();
    fm1_guard_enable(FM1_GUARD_STACK|FM1_GUARD_WRITE|FM1_GUARD_BUS|FM1_GUARD_PC);
    fm1_vdc14_raise(7); fm1_sysvdd_raise(15);
    lcd_init(); fw_boot(); screen_flush();
    fm1_input_init(); fm1_adc_init();
    fm1_timer5_start(isr_timer5,4);
    fm1_audio_init(audio_dma,HALF_WORDS,isr_alnk0,3);
    fm1_guard_lock_top(); fm1_irq_enable_all();
    uint32_t frame_time=0,octave_time=0;
    int32_t master_smooth=60*1023/100;
    for(;;) {
        fm1_wdt_feed();
        if(milliseconds>30000u) gm_bootguard.pending=gm_bootguard.failed=0;
        /* Recovery entry remains independent of application chord/lock state. */
        if((fm1_in.buttons&3u)!=3u) octave_time=milliseconds;
        else if(milliseconds-octave_time>=5000u) { fm1_audio_stop(); gm_bootguard.pending=0; fm1_enter_uboot(); }
        if(milliseconds-frame_time>=50u) {
            frame_time=milliseconds;
            int32_t value=fm1_adc_read(FM1_ADC_MASTER);
            if(value>=0) { master_smooth+=(value-master_smooth)/4; master_value=(uint32_t)master_smooth*100u/1023u; }
            uint8_t high[FM1_NCOL]={0},medium[FM1_NCOL]={0},low[FM1_NCOL]={0};
            for(uint32_t col=0;col<FM1_NCOL;col++)for(uint32_t row=1;row<5;row++) {
                int id=FM1_KEYMAP[row][col];
                if(id<14)continue;
                int brightness=fw_key_brightness(id-14);uint8_t bit=(uint8_t)(1u<<row);
                if(brightness>=192)high[col]|=bit;
                else if(brightness>=80)medium[col]|=bit;
                else if(brightness)low[col]|=bit;
            }
            fm1_irq_off();
            for(uint32_t col=0;col<FM1_NCOL;col++) {
                // Preserve button LEDs; only replace physical note-key row bits.
                uint8_t note_bits=0;
                for(uint32_t row=1;row<5;row++)if(FM1_KEYMAP[row][col]>=14)note_bits|=(uint8_t)(1u<<row);
                fm1_led[col]=(fm1_led[col]&~note_bits)|high[col];hint_medium[col]=medium[col];hint_low[col]=low[col];
            }
            fm1_led_dim_div=2;fm1_irq_on();
            screen_flush();
        }
    }
}
