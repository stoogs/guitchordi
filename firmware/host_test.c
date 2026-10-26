#include <assert.h>
#include <math.h>
#include <stdio.h>
#include <string.h>
#include "app.h"
#include "../dsp/engine.h"
static void advance(int ms) {
    int n = (int)((int64_t)ms * GM_RATE / 1000);
    while (n > 0) { int count = n > 128 ? 128 : n; fw_render(count); n -= count; }
}
static void fixture_boot(void) { fw_boot();fw_button(8,1);fw_button(8,0);fw_button(8,1);fw_button(8,0);fw_set_mode(0);fw_encoder(3,-10);fw_set_tone(0);fw_keys(1u<<3);fw_keys(0);advance(3001); }
int main(int argc, char **argv) {
    fw_boot();assert(fw_boot_screen());fw_frame();advance(100);fw_frame();
    assert(fw_attacks()==0);advance(2101);assert(!fw_boot_screen());
    fw_boot();fw_keys(1);assert(!fw_boot_screen() && fw_attacks()==1);
    fixture_boot();
    assert(fw_selected() == 1 && fw_volume() == 60 && fw_locked() == 0);
    assert(fw_control() == -1);
    for(int role=0;role<8;role++) {
        fw_encoder(role,1); assert(fw_control() == role);
        advance(2999); assert(fw_control() == role);
        advance(2); assert(fw_control() == -1);
    }
    assert(fw_attacks() == 0);
    fw_encoder(7,-100); assert(fw_volume() == 0 && fw_control() == 7);
    advance(3001); fw_encoder(7,-1); assert(fw_control() == 7 && fw_volume() == 0);
    fw_master(42); assert(fw_control() == 7 && fw_volume() == 42);
    advance(3001); fw_master(42); assert(fw_control() == -1);
    fw_encoder(-1,1); fw_encoder(8,1); fw_encoder(0,0); assert(fw_control() == -1);
    fixture_boot();
    fw_button(1,1);advance(5100);fw_button(1,0);assert(!fw_locked());
    assert(fw_voicing()==0 && fw_voicing_count()==6);
    int factory_pitch=fw_slot_pitch(1,0);
    fw_encoder(6,1);assert(fw_voicing()==1 && fw_volume()==60 && fw_attacks()==0);
    int different=0;for(int part=0;part<6;part++) if(fw_slot_pitch(1,part)!= (int[]){43,47,50,55,59,67}[part]) different=1;
    assert(different && factory_pitch==43);
    fw_keys(1u<<1);fw_keys(0);fw_encoder(6,2);assert(fw_voicing()==2);
    fw_keys(1u<<3);fw_keys(0);assert(fw_voicing()==1);
    fw_set_tone(12);assert(fw_voicing()==1);
    fw_button(7,1);fw_button(7,0);uint32_t shape_save[FW_STORE_WORDS];memcpy(shape_save,fw_store(),sizeof shape_save);
    fixture_boot();memcpy(fw_store(),shape_save,sizeof shape_save);assert(fw_restore() && fw_slot_voicing(0)==2 && fw_slot_voicing(1)==1);
    fw_store()[21]=6;assert(!fw_restore() && fw_slot_voicing(0)==2);
    fw_store()[0]=0x474d0004u;assert(fw_restore() && fw_voicing()==0);
    fw_button(2,1);advance(3001);fw_button(2,0);fw_encoder(6,2);assert(fw_voicing()==0);
    fixture_boot();
    assert(fw_velocity()==50);
    fw_encoder(4,7); fw_encoder(5,12); fw_set_tone(4);
    assert(fw_set_mode(39) && fw_tone()==4 && fw_transpose()==7 && fw_room()==24);
    fw_set_tone(3); assert(fw_mode()==39 && fw_transpose()==7);
    fw_encoder(3,-100); assert(fw_velocity()==0);
    fw_button(7,1);fw_button(7,0);uint32_t neutral_save[FW_STORE_WORDS];memcpy(neutral_save,fw_store(),sizeof neutral_save);
    fixture_boot();memcpy(fw_store(),neutral_save,sizeof neutral_save);assert(fw_restore() && fw_velocity()==0);
    fw_store()[0]=0x474d0003u;fw_store()[4]=100;assert(fw_restore() && fw_velocity()==50);
    fixture_boot();
    // Short EDIT assigns; holding opens a non-destructive menu, release never confirms.
    fw_button(4,1);fw_button(4,0);assert(fw_editing());
    int original=fw_chord();fw_encoder(2,1);assert(fw_chord()!=original);
    fw_button(4,1);advance(1199);assert(!fw_reset_menu());advance(2);assert(fw_reset_menu()==1);
    fw_button(4,0);assert(fw_reset_menu()==1 && fw_custom());
    fw_encoder(2,1);assert(fw_reset_menu()==2);fw_button(4,1);fw_button(4,0);assert(fw_reset_menu()==2 && fw_custom());fw_button(1,1);fw_button(1,0);
    assert(!fw_reset_menu() && fw_chord()==original && !fw_custom());
    fw_button(4,1);fw_button(4,0);fw_encoder(2,1);fw_keys(1u<<5);fw_keys(0);fw_encoder(2,1);
    fw_button(4,1);advance(1201);fw_button(4,0);fw_encoder(2,2);assert(fw_reset_menu()==3);
    fw_button(6,1);fw_button(6,0);assert(!fw_reset_menu() && fw_custom());
    fw_button(4,1);advance(1201);fw_button(4,0);fw_encoder(2,2);fw_button(1,1);fw_button(1,0);assert(!fw_custom());
    fw_button(2,1);advance(3001);fw_button(2,0);fw_button(4,1);advance(1201);fw_button(4,0);assert(!fw_reset_menu());
    assert(fw_attacks()==0);
    fixture_boot();
    fw_keys(1u << 1); fw_keys(0); // C
    fw_keys(1u); assert(fw_attacks() == 0); fw_keys(0); // muted low E
    fw_keys(1u << 3); fw_keys(0); // G
    fw_keys(1u); fw_keys(1u); assert(fw_attacks() == 1); // no duplicate
    fw_keys(0); fw_keys(1u); assert(fw_attacks() == 2); fw_keys(0);
    fw_button(2,1); advance(2999); assert(!fw_locked()); advance(2); assert(fw_locked());
    advance(3001); assert(fw_locked()); fw_button(2,0);
    fw_keys(1u << 1); fw_keys(0); assert(fw_selected() == 1);
    fw_button(2,1); advance(3001); assert(!fw_locked()); fw_button(2,0);
    fw_encoder(1,2); fw_encoder(7,15); fw_button(7,1); fw_button(7,0);
    uint32_t saved[FW_STORE_WORDS]; memcpy(saved,fw_store(),sizeof saved);
    fixture_boot(); memcpy(fw_store(),saved,sizeof saved); assert(fw_restore());
    assert(fw_tone() == 2 && fw_volume() == 75);
    fw_store()[1] = 999; assert(!fw_restore());
    fixture_boot();
    const int white[] = {0,2,4,6,7,9,11,12,14,16,18,19,21,23,24,26};
    const int expected[] = {43,47,50,55,59,67,43,47,50,55,59,67,50,55,59,67};
    for (int key=0; key<16; key++) {
        fw_keys(1u << white[key]); assert(fw_last_key() == key && fw_last_pitch() == expected[key]);
        assert(fw_attacks() == (uint32_t)key+1); fw_keys(0);
    }
    fixture_boot();
    assert(fw_mode_count() == 50 && fw_set_mode(49));
    assert(fw_mode() == 49 && !fw_set_mode(50));
    assert(strlen(fw_mode_name(49)) && strlen(fw_slot_name(10)));
    assert(fw_attacks() == 0);
    fw_button(7,1); fw_button(7,0); memcpy(saved,fw_store(),sizeof saved);
    fixture_boot(); memcpy(fw_store(),saved,sizeof saved); assert(fw_restore() && fw_mode() == 49);
    fw_button(2,1); advance(3001); fw_button(2,0); assert(!fw_set_mode(1) && fw_mode() == 49);
    fixture_boot();
    // Harmonic guide remains bounded and silent for every style and slot.
    const int black_keys[]={1,3,5,8,10,13,15,17,20,22,25};
    for(int bank=0;bank<50;bank++) {
        assert(fw_set_mode(bank));
        for(int from=0;from<11;from++) {
            fw_keys(1u<<black_keys[from]);fw_keys(0);
            for(int to=0;to<11;to++) {
                int hint=fw_suggestion(to);assert(hint>=0 && hint<=3);
                assert((hint==0)==(to==from));
                assert(fw_key_brightness(black_keys[to])>0);
                assert(fw_suggestion_reason(to)>=0 && fw_suggestion_reason(to)<=5);
            }
        }
    }
    assert(fw_attacks()==0);fixture_boot();
    // Exercise all tuning table dimensions under UBSan without producing audio.
    for(int t=0;t<fw_tuning_count();t++) {
        fw_button(5,1);fw_button(5,0);fw_encoder(5,1);fw_button(1,1);fw_button(1,0);
        for(int slot=0;slot<11;slot++)for(int part=0;part<6;part++){int p=fw_slot_pitch(slot,part);assert(p==-1 || (p>=24 && p<=96));}
    }
    fixture_boot();
    if (argc != 2) return 2;
    FILE *f = fopen(argv[1], "wb"); assert(f);
    for (int b = 0; b < 1200; b++) {
        if (b == 20) fw_keys(1u); if (b == 30) fw_keys(1u << 4); if (b == 40) fw_keys(0);
        if (b == 50) fw_encoder(1,1);
        if (b == 60) fw_keys(1u << 26); if (b == 70) fw_keys(0);
        if (b == 80) fw_button(0,1); if (b == 81) fw_button(0,0);
        if (b == 90) fw_encoder(5,25);
        if (b == 100) fw_keys(1u << 11); if (b == 110) fw_keys(0);
        float *samples = fw_render(128);
        for (int i = 0; i < 128; i++) assert(isfinite(samples[i]));
        assert(fwrite(samples,sizeof(float),128,f) == 128);
    }
    fclose(f);
    int drawn = 0; uint16_t *frame = fw_frame(); for (int i=0;i<240*240;i++) if (frame[i]) drawn++;
    assert(drawn > 1000 && fw_attacks() == 4 && fw_lights() != 0);
    printf("firmware host: input/mutes/retriggers/lock/storage/audio/display pass; state %d bytes\n",fw_state_bytes());
    return 0;
}
