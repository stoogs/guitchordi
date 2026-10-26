/* SPDX-License-Identifier: GPL-3.0-only */
#define FL_IN(off,n,lo,hi) ((uint32_t)(off)>=(lo) && (uint32_t)(off)<=(hi) && (uint32_t)(n)<=(hi)-(uint32_t)(off))
#define FL_FAR(fn) fn
static unsigned fail_write_at,write_attempts;
static unsigned top_locked=1;
static void fm1_guard_unlock_top(void){top_locked=0;}
static void fm1_guard_lock_top(void){top_locked=1;}
static unsigned writes,irq_off,audio_running,panic_count,detached,entered_uboot;
static void fm1_irq_off(void){irq_off=1;}
static void fm1_irq_on(void){irq_off=0;}
static int fl_erase4k(uint32_t off,uint32_t *took){
 (void)took; if(++write_attempts==fail_write_at)return -1; if(audio_running || !FL_RANGE_OK(off,4096)) {bad_erase++;return -8;}
 memset(nor+off,255,4096);writes++;return 0;
}
static int fl_write(uint32_t off,const uint8_t *p,uint32_t n){
 if(++write_attempts==fail_write_at)return -1;
 if(audio_running || !FL_RANGE_OK(off,n)){bad_erase++;return -8;}
 for(uint32_t i=0;i<n;i++)nor[off+i]&=p[i];writes++;return 0;
}
static int fl_read_ram(uint32_t off,uint8_t *p,uint32_t n){
 if(!irq_off || !FL_IN(off,n,0,0x100000))return -1;
 memcpy(p,nor+off,n);return 0;
}
#define HALF_WORDS 256u
#define FM1_IRQ_ALNK0 11u
static int32_t audio_dma[2*HALF_WORDS];
static struct {uint32_t pending,failed;} gm_bootguard;
static void isr_alnk0(void){}
static void fm1_wdt_feed(void){now_ms++;}
#define milliseconds now_ms
static void fm1_delay_ms(unsigned n){now_ms+=n;}
static void fm1_audio_stop(void){audio_running=0;}
static void fm1_irq_mask(unsigned n){(void)n;}
static void fm1_audio_init(int32_t *p,unsigned n,void (*irq)(void),unsigned prio){
 (void)p;(void)n;(void)irq;(void)prio; if(top_locked || !irq_off){fprintf(stderr,"IRQ vector guard not opened safely\n");exit(1);} audio_running=1;
}
static void fw_panic(void){panic_count++;}
static void lcd_sync(void){}
static void fm1_enter_update(const uint8_t *p){committed=1;memcpy(committed_parm,p,112);}
static void fm1_enter_uboot(void){entered_uboot++;}
