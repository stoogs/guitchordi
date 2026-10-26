#include <assert.h>
#include <math.h>
#include <stdio.h>
#include "../firmware/app.h"
#include "../dsp/engine.h"
static void button(int n){fw_button(n,1);fw_button(n,0);}
static void advance(int blocks){for(int i=0;i<blocks;i++)assert(fw_render(128));}
static void check_reset(void){
 fw_boot();assert(fw_rhythm_velocity()==80);button(5);fw_encoder(6,20);assert(fw_rhythm_velocity()==100);button(1);
 fw_set_tone(13);fw_set_mode(26);fw_button(5,1);advance(1033);assert(!fw_factory_reset_menu());advance(2);assert(fw_factory_reset_menu());
 fw_encoder(1,1);assert(fw_tone()==13);button(6);assert(!fw_factory_reset_menu());assert(fw_tone()==13);fw_button(5,0);
 fw_button(5,1);advance(1035);assert(fw_factory_reset_menu());button(1);assert(!fw_factory_reset_menu());assert(fw_tone()==3);assert(fw_play_mode()==1);assert(fw_mode()==16);assert(fw_rhythm_velocity()==80);assert(fw_store()[0]==0x474d000du);advance(1035);assert(!fw_factory_reset_menu());fw_button(5,0);
}
static void check_groups(void){
 for(int mode=1;mode<=2;mode++)for(int pattern=6;pattern<=8;pattern++){
  fw_boot();if(mode==2)button(8);assert(fw_play_mode()==mode);fw_encoder(3,pattern);fw_encoder(5,-4);
  fw_keys(1u<<1);fw_keys(0);int expected=pattern==6?3:pattern==7?4:6;
  advance(20);assert((int)fw_attacks()==expected);advance(70);assert(gm_active()==0);
  button(7);uint32_t saved[FW_STORE_WORDS];for(int i=0;i<FW_STORE_WORDS;i++)saved[i]=fw_store()[i];
  fw_boot();for(int i=0;i<FW_STORE_WORDS;i++)fw_store()[i]=saved[i];assert(fw_restore() && fw_rhythm_param(0)==pattern && !fw_running());
 }
}
static void check_flourish(void){
 fw_boot();fw_encoder(3,9);fw_keys(1u<<1);fw_keys(0);advance(20);assert(fw_attacks()==18 && !fw_running() && gm_active()<=14);
 for(int fast=0;fast<2;fast++)for(int gate=0;gate<5;gate++){
  fw_boot();fw_encoder(3,9);if(fast){fw_encoder(0,100);fw_encoder(0,100);fw_encoder(4,8);}else fw_encoder(0,-50);
  fw_encoder(5,gate-4);fw_keys(1u<<1);
  for(int b=0;b<300;b++){float *s=fw_render(128);assert(gm_active()<=14);for(int i=0;i<128;i++)assert(isfinite(s[i]) && fabsf(s[i])<=.98f);}
  button(10);assert(!gm_active());
 }
}
int main(int argc,char **argv){
 check_flourish();
 check_groups();
 check_reset();
 assert(argc==2);FILE *f=fopen(argv[1],"wb");assert(f);
 const int blacks[]={1,3,5,8,10,13,15,17,20,22,25};
 for(int mode=1;mode<=2;mode++){
  fw_boot();button(8);button(8);fw_set_mode(0);fw_set_tone(0);fw_keys(1u<<3);fw_keys(0);for(int i=0;i<mode;i++)button(8);fw_encoder(0,70);button(1);uint32_t mask=0;
  for(int block=0;block<1600;block++){
   if(block%120==0)mask=1u<<blacks[(block/120)%11];if(block%120==90)mask=0;
   fw_keys(mask);
   if(block && block%200==0){fw_encoder(3,1);fw_encoder(4,1);fw_encoder(5,-1);fw_encoder(6,1);}
   if(block==700){button(0);fw_encoder(6,1);button(6);}
   if(block==900)button(10);
   float *a=fw_render(128);assert(gm_active()<=14);
   for(int i=0;i<128;i++)assert(isfinite(a[i])&&fabsf(a[i])<=.98f);
   assert(fwrite(a,sizeof(float),128,f)==128);
  }
 }
 fclose(f);puts("Strum/Arp native render and gate/stop stress passed");return 0;
}
