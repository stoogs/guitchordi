#include <assert.h>
#include <math.h>
#include <stdio.h>
#include "../firmware/app.h"
#include "../dsp/engine.h"
static void button(int n){fw_button(n,1);fw_button(n,0);}
int main(int argc,char **argv){
 assert(argc==2);FILE *f=fopen(argv[1],"wb");assert(f);
 const int blacks[]={1,3,5,8,10,13,15,17,20,22,25};
 for(int mode=1;mode<=2;mode++){
  fw_boot();fw_set_mode(0);fw_set_tone(0);fw_keys(1u<<3);fw_keys(0);for(int i=0;i<mode;i++)button(8);fw_encoder(0,70);button(1);uint32_t mask=0;
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
