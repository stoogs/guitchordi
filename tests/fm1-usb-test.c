/* SPDX-License-Identifier: GPL-3.0-only */
#include <stdint.h>
#include <stdio.h>
#include <string.h>
#include <assert.h>
#include "../firmware/fm1/identity.h"
#define FELUCCA_ID GM_FIRMWARE_ID
#define FELUCCA_OTA 1
#define FELUCCA_CDC 0
#define FELUCCA_UAC 0
#define RING_PUBLISH() do {} while(0)
#include "../build/generated/gm_usb.c"
#include "../third_party/fm1-platform/firmware/src/ota.c"
static unsigned ticks,writes;
static uint32_t ota_now_ms(void){return ticks;}
static void ota_idle(void){ticks++;}
static int ota_erase(uint32_t a){(void)a;writes++;return -1;}
static int ota_prog(uint32_t a,const void *p,uint32_t n){(void)a;(void)p;(void)n;writes++;return -1;}
static int ota_fread(uint32_t a,void *p,uint32_t n){(void)a;(void)p;(void)n;return -1;}
static void ota_show(uint32_t a,int32_t c){(void)a;(void)c;}
static void ota_commit(const uint8_t *p){(void)p;assert(0);}
static void receive(const uint8_t *p,unsigned n){for(unsigned i=0;i<n;i++)sysex_byte(p[i]);}
static void descriptor(unsigned value,const char *text){
 const uint8_t *p;uint16_t n;assert(get_desc(value,&p,&n));
 assert(n==2+2*strlen(text) && p[0]==n && p[1]==3);
 for(unsigned i=0;i<strlen(text);i++)assert(p[2+i*2]==text[i] && p[3+i*2]==0);
}
int main(void){
 descriptor(0x301,"Stoogs");descriptor(0x302,"GuitChordi FM-1");
 assert(sizeof CFG_DESC==101 && CFG_DESC[4]==2);
 uint8_t msg[]={0,0x59,0x11,0,0,0,0xff},wire[32],decoded[64],reply[64];
 wire[0]=0xf0;unsigned n=ota_pack7(msg,sizeof msg,wire+1);wire[n+1]=0xf7;
 receive(wire,n+2);assert(sx_ready);ota_service();assert(!sx_ready);
 unsigned count=0;
 for(unsigned i=so_r;i<so_w;i++){
  uint32_t packet=sx_out_q[i%SXQ];unsigned cin=packet&15,k=cin==4?3:cin-4;
  assert(k>=1 && k<=3);for(unsigned j=0;j<k;j++)reply[count++]=(packet>>(8+j*8))&255;
 }
 assert(reply[0]==0xf0 && reply[count-1]==0xf7);
 unsigned d=ota_unpack7(reply+1,count-2,decoded,sizeof decoded);
 assert(d==34 && decoded[2]==0x11 && !memcmp(decoded+6,GM_FIRMWARE_ID,strlen(GM_FIRMWARE_ID)));
 unsigned sent=so_w;
 wire[2]^=1;receive(wire,n+2);ota_service();assert(so_w==sent);
 sysex_byte(0xf0);for(unsigned i=0;i<700;i++)sysex_byte(1);sysex_byte(0xf7);assert(!sx_ready);
 const uint8_t update[]={0xf0,0x22,0x24,0x35,0x7f,0xf7};receive(update,6);assert(usb.ota_req && !writes);
 const uint8_t boot[]={0xf0,0x22,0x24,0x35,0x7d,0xf7};receive(boot,6);assert(usb.uboot_req && !writes);
 puts("USB descriptors, SysEx assembly, identity reply packetization, malformed/oversize rejection and update/UBOOT requests passed; no register enumeration claimed");
}
