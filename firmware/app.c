// Portable firmware application: physical input, clock, UI, storage snapshot and audio.
// Host/WASM and the experimental FM-1 target call this same code.
#include <stdint.h>
#include <string.h>
#include "app.h"
#include "../dsp/engine.h"
#include "fw_bank.h"
#include "font.h"
#include "display-font.h"

// Logical note indices in the upstream FM-1 host model, not validated raw scan codes.
static const uint8_t white[16] = {0,2,4,6,7,9,11,12,14,16,18,19,21,23,24,26};
static const uint8_t black[11] = {1,3,5,8,10,13,15,17,20,22,25};
#ifdef GM_FM1
#define FW_LARGE __attribute__((section(".pool")))
#else
#define FW_LARGE
#endif
static uint16_t framebuffer[FW_SCREEN * FW_SCREEN] FW_LARGE;
static uint32_t keys, buttons, attacks, store_version, settings[FW_STORE_WORDS], clock_ms, hold_started;
static uint32_t clock_remainder;
static int slot_shapes[11];
static int slots[11], selected, locked, lock_fired, tone, page, editing, mode;
static int volume, velocity, room, transpose, last_key, last_pitch;
static float room_line[2048];
static uint32_t room_cursor, control_at;
static int last_control, reset_choice = -1, edit_fired;
static uint32_t edit_started;
static int play_mode,bpm=90,tempo_edit, rhythm[2][4]={{0,9,4,10},{0,9,4,0}};
static int gate_tails,humanity=2;
static uint32_t sample_clock,next_tick,step_fraction,rhythm_step,rhythm_rng=0x8769u;
static int auto_running,queued;
static uint32_t auto_blocked;
typedef struct { uint32_t due; int part,pitch,tone,character,gate; float strength; } auto_note;
static auto_note auto_notes[6];
static float auto_output[GM_BLOCK];
static const char *const play_names[]={"Freeplay","Strum","Arp"};
static const char *const division_names[]={"1/1","1/1D","1/1T","1/2","1/2D","1/2T","1/4","1/4D","1/4T","1/8","1/8D","1/8T","1/16","1/16D","1/16T","1/32","1/32D","1/32T"};
static const char *const strum_names[]={"DOWN","UP","ALTERNATE","BLOCK","BASS+CHORD","SHUFFLE"};
static const char *const arp_names[]={"UP","DOWN","UP-DOWN","DOWN-UP","OUTSIDE-IN","RANDOM"};
static void rhythm_cancel(void) { auto_running=queued=0; gm_auto_stop(); }
int fw_play_mode(void) { return play_mode; }
int fw_bpm(void) { return bpm; }
int fw_gate_tails(void) { return gate_tails; }
int fw_humanity(void) { return humanity*10; }
int fw_tempo_edit(void) { return tempo_edit; }
int fw_rhythm_param(int i) { return i>=0 && i<4 ? rhythm[play_mode==2][i] : -1; }
int fw_running(void) { return auto_running || queued; }
int fw_lock_progress(void) { return (buttons&(1u<<2)) ? (clock_ms-hold_started>=3000?1000:(int)((clock_ms-hold_started)/3)) : (locked?1000:0); }
static uint32_t rhythm_random(void) { rhythm_rng^=rhythm_rng<<13; rhythm_rng^=rhythm_rng>>17; rhythm_rng^=rhythm_rng<<5; return rhythm_rng; }
static void rhythm_fire(auto_note *n) {
    gm_set_character(n->character);last_key=6+n->part;last_pitch=n->pitch;
    if(gm_note_on_gated(n->part,n->pitch,n->strength,n->tone,n->gate,gate_tails)) attacks++;
}
static void rhythm_tick(void) {
    int *p=rhythm[play_mode==2], parts[6],count=0;
    for(int i=0;i<6;i++) if(fw_slot_pitch(selected,i)>=0) parts[count++]=i;
    // Quotient/remainder multiplication avoids 64-bit division and intermediate overflow.
    uint32_t base=1u<<(p[1]/3),variant=p[1]%3;
    uint32_t numerator=variant==1?6u:variant==2?8u:4u;
    uint32_t denominator=(uint32_t)bpm*base*(variant==2?3u:1u);
    uint32_t clock=GM_RATE*60u*256u;
    uint32_t interval=(clock/denominator)*numerator+(clock%denominator)*numerator/denominator;
    if(play_mode==2) { uint32_t factor=(uint32_t)(100+((rhythm_step&1)?-p[3]*5:p[3]*5)); interval=(interval/100u)*factor+(interval%100u)*factor/100u; }
    step_fraction+=interval&255u;
    uint32_t frames=(interval>>8)+(step_fraction>>8); step_fraction&=255u;
    next_tick=sample_clock+frames;
    uint32_t gate=p[2]==4?0:frames*(p[2]+1)/4;
    if(!count) { rhythm_step++; return; }
    if(play_mode==2) {
        int index=0,cycle=count>1?2*count-2:1;
        switch(p[0]) {
        case 0:index=rhythm_step%count;break;
        case 1:index=count-1-rhythm_step%count;break;
        case 2:index=rhythm_step%cycle;if(index>=count)index=cycle-index;break;
        case 3:index=rhythm_step%cycle;if(index>=count)index=cycle-index;index=count-1-index;break;
        case 4:index=rhythm_step%count;index=index&1?count-1-index/2:index/2;break;
        case 5:index=rhythm_random()%count;break;
        }
        int part=parts[index];
        auto_note note={sample_clock,part,gm_pitch(tone,fw_slot_pitch(selected,part)+transpose),tone,velocity,(int)gate,.72f};
        rhythm_fire(&note);
    } else {
        if(p[0]==1 || (p[0]==2 && (rhythm_step&1))) for(int i=0;i<count/2;i++){int tmp=parts[i];parts[i]=parts[count-1-i];parts[count-1-i]=tmp;}
        if(p[0]==5)for(int i=count-1;i>0;i--){int j=rhythm_random()%(i+1),tmp=parts[i];parts[i]=parts[j];parts[j]=tmp;}
        // K4 requests a whole six-string stroke in 0–250 ms, independent of gate/BPM.
        // At extreme repeat rates, fit the stroke before the next tick (fixed six-note queue).
        uint32_t span=(uint32_t)p[3]*GM_RATE/200u;if(span>=frames)span=frames-1;
        uint32_t spacing=count>1?span/(uint32_t)(count-1):0;
        queued=count;
        uint32_t previous=0;
        for(int i=0;i<count;i++) {
            uint32_t delay=p[0]==3?0:p[0]==4?(i?spacing*3:0):i*spacing;
            if(i && humanity) {
                int jitter=(int)(rhythm_random()%177u)-88;
                int shifted=(int)delay+jitter*humanity/10;
                delay=shifted<0?0:(uint32_t)shifted;
                if(delay<previous)delay=previous;
                if(delay>=frames)delay=frames-1;
            }
            previous=delay;
            int part=parts[i];float strength=.72f;
            if(humanity) strength+=((int)(rhythm_random()%201u)-100)*(.0001f*humanity);
            auto_notes[i]=(auto_note){sample_clock+delay,part,gm_pitch(tone,fw_slot_pitch(selected,part)+transpose),tone,velocity,(int)gate,strength};
        }
        while(queued && auto_notes[0].due==sample_clock) { rhythm_fire(&auto_notes[0]);for(int i=1;i<queued;i++)auto_notes[i-1]=auto_notes[i];queued--; }
    }
    rhythm_step++;
}
static void rhythm_start(void) { rhythm_cancel();auto_running=1;rhythm_step=step_fraction=0;rhythm_tick(); }
static float *rhythm_render(int frames) {
    int done=0;
    while(done<frames) {
        if(auto_running && (int32_t)(sample_clock-next_tick)>=0) rhythm_tick();
        while(queued && (int32_t)(sample_clock-auto_notes[0].due)>=0) { rhythm_fire(&auto_notes[0]);for(int i=1;i<queued;i++)auto_notes[i-1]=auto_notes[i];queued--; }
        int count=frames-done;
        if(auto_running && (uint32_t)(next_tick-sample_clock)<(uint32_t)count)count=(int)(next_tick-sample_clock);
        if(queued && (uint32_t)(auto_notes[0].due-sample_clock)<(uint32_t)count)count=(int)(auto_notes[0].due-sample_clock);
        if(count<1)continue;
        float *samples=gm_render(count);memcpy(auto_output+done,samples,(unsigned)count*sizeof(float));
        done+=count;sample_clock+=(uint32_t)count;
    }
    return auto_output;
}
int fw_reset_menu(void) { return reset_choice + 1; }
static const char *const reset_names[]={"CANCEL","THIS SLOT","ALL SLOTS"};
static void control_touch(int role) { last_control=role; control_at=clock_ms; }
int fw_control(void) { return last_control>=0 && clock_ms-control_at<3000u ? last_control : -1; }
int fw_set_tone(int value) { if(reset_choice>=0 || value<0 || value>=gm_tone_count()) return 0; tone=value; control_touch(1); return 1; }
int fw_selected(void) { return selected; }
int fw_mode(void) { return mode; }
int fw_mode_count(void) { return FW_MODES; }
const char *fw_mode_name(int index) { return index >= 0 && index < FW_MODES ? mode_names[index] : ""; }
const char *fw_slot_name(int slot) { return slot >= 0 && slot < 11 ? chord_names[slots[slot]] : ""; }
int fw_slot_pitch(int slot,int part) { return slot>=0 && slot<11 && part>=0 && part<6 ? chord_shapes[slots[slot]][slot_shapes[slot]][part] : -1; }
// Explainable next-chord guide, evaluated only for UI/LED polling, never per sample.
// Levels: 0 current, 1 adventurous, 2 colour, 3 smooth/strong. No chord is blocked.
static int hint_slots[11],hint_from=-1,hint_mode=-1;
static uint8_t hint_levels[11],hint_reasons[11];
static int pitch_count(uint32_t bits) { int n=0;while(bits){n+=bits&1u;bits>>=1;}return n; }
static void update_hints(void) {
    int changed=hint_from!=selected || hint_mode!=mode;
    for(int i=0;i<11;i++)if(hint_slots[i]!=slots[i])changed=1;
    if(!changed)return;
    hint_from=selected;hint_mode=mode;memcpy(hint_slots,slots,sizeof slots);
    int from=slots[selected],root=chord_roots[from];uint32_t source=chord_pcs[from];
    int dominant=(source&(1u<<((root+4)%12))) && (source&(1u<<((root+10)%12)));
    int diminished=(source&(1u<<((root+3)%12))) && (source&(1u<<((root+6)%12))) && !(source&(1u<<((root+7)%12)));
    for(int i=0;i<11;i++) {
        if(i==selected){hint_levels[i]=hint_reasons[i]=0;continue;}
        int to=slots[i],next=chord_roots[to],motion=(next-root+12)%12;
        uint32_t target=chord_pcs[to];int common=pitch_count(source&target),outside=pitch_count(target&~mode_scales[mode]);
        int cost=0,count=pitch_count(target);
        for(int a=0;a<12;a++)if(target&(1u<<a)) {
            int nearest=6;
            for(int b=0;b<12;b++)if(source&(1u<<b)){int d=a>b?a-b:b-a;if(d>6)d=12-d;if(d<nearest)nearest=d;}
            cost+=nearest;
        }
        int score=20+common*5+(18-cost*4/(count?count:1))+(outside?4-outside*7:12);
        int reason=common>=2?2:3;
        if(motion==5){score+=20;reason=4;}
        else if(motion==7)score+=8;
        else if(motion==3 || motion==4 || motion==8 || motion==9)score+=6;
        else if(motion==2 || motion==10)score+=4;
        else if(!motion)score+=8;
        if(root==mode_tonics[mode] && (motion==2 || motion==5))score+=10;
        if(next==mode_tonics[mode])score+=5;
        if((dominant && motion==5) || (diminished && motion==1)){score+=22;reason=1;}
        else if(dominant && motion==11){score+=16;reason=1;} // tritone-substitute resolution
        hint_levels[i]=score>=65?3:score>=42?2:1;
        hint_reasons[i]=hint_levels[i]==1?5:reason;
    }
}
int fw_suggestion(int slot) { if(slot<0 || slot>=11)return -1;update_hints();return hint_levels[slot]; }
int fw_suggestion_reason(int slot) { if(slot<0 || slot>=11)return -1;update_hints();return hint_reasons[slot]; }
int fw_key_brightness(int key) {
    if(key<0 || key>=27)return 0;
    if((keys&(1u<<key)))return 255;
    for(int i=0;i<11;i++)if(black[i]==key){if(i==selected)return 255;int level=fw_suggestion(i);return level==3?192:level==2?80:20;}
    return 0;
}
int fw_voicing(void) { return slot_shapes[selected]; }
int fw_voicing_count(void) { return shape_counts[slots[selected]]; }
int fw_slot_voicing(int slot) { return slot>=0 && slot<11 ? slot_shapes[slot] : -1; }
int fw_slot_voicing_count(int slot) { return slot>=0 && slot<11 ? shape_counts[slots[slot]] : 0; }
int fw_custom(void) { for(int i=0;i<11;i++) if(slots[i]!=mode_slots[mode][i] || slot_shapes[i]) return 1; return 0; }
int fw_set_mode(int index) {
    if (reset_choice>=0 || locked || index < 0 || index >= FW_MODES) return 0;
    rhythm_cancel(); mode = index; memcpy(slots, mode_slots[mode], sizeof slots); memset(slot_shapes,0,sizeof slot_shapes);
    editing = 0; reset_choice = -1; control_touch(2);
    return 1;
}
int fw_chord(void) { return slots[selected]; }
int fw_last_key(void) { return last_key; }
int fw_last_pitch(void) { return last_pitch; }
int fw_editing(void) { return editing; }
int fw_locked(void) { return locked; }
int fw_tone(void) { return tone; }
int fw_transpose(void) { return transpose; }
int fw_volume(void) { return volume; }
int fw_velocity(void) { return velocity; }
int fw_room(void) { return room; }
int fw_page(void) { return page; }
uint32_t fw_now(void) { return clock_ms; }
uint32_t fw_attacks(void) { return attacks; }
uint32_t fw_store_version(void) { return store_version; }
uint32_t *fw_store(void) { return settings; }
int fw_state_bytes(void) { return gm_state_bytes() + sizeof framebuffer + sizeof room_line + sizeof slots + sizeof slot_shapes + sizeof settings + sizeof auto_notes + sizeof auto_output + sizeof rhythm + sizeof hint_slots + sizeof hint_levels + sizeof hint_reasons + sizeof hint_from + sizeof hint_mode + sizeof gate_tails + sizeof humanity; }
static int bound(int x, int lo, int hi) { return x < lo ? lo : x > hi ? hi : x; }
static int string_of(int key) { return gm_part(tone,key < 12 ? key % 6 : key - 10); }
int fw_key_pitch(int key) {
    if(key<0 || key>=16) return -1;
    int pitch=fw_slot_pitch(selected,string_of(key));
    return pitch<0 ? -1 : gm_pitch(tone,pitch+transpose);
}
void fw_panic(void) { auto_blocked=0;for(int i=0;i<11;i++)auto_blocked|=keys&(1u<<black[i]);auto_running=queued=0; gm_reset(); memset(room_line, 0, sizeof room_line); room_cursor = 0; keys = buttons = 0; lock_fired = edit_fired = 0; reset_choice = -1; }
void fw_boot(void) {
    fw_panic(); memcpy(slots, mode_slots[16], sizeof slots); memset(slot_shapes,0,sizeof slot_shapes);
    selected = 0; locked = page = editing = transpose = 0;tone=4;mode=16;
    auto_blocked=0;play_mode=tempo_edit=gate_tails=0;humanity=2;bpm=90;sample_clock=next_tick=step_fraction=rhythm_step=0;rhythm_rng=0x8769u;
    int defaults[2][4]={{0,9,4,10},{0,9,4,0}};memcpy(rhythm,defaults,sizeof rhythm);
    volume = 60; velocity = 50; room = 12; last_key = last_pitch = -1;
    attacks = store_version = clock_ms = hold_started = 0; clock_remainder = 0; last_control = -1; control_at = 0;
    memset(settings, 0, sizeof settings);
}
void fw_keys(uint32_t mask) {
    mask &= 0x7ffffffu;
    auto_blocked&=mask;
    uint32_t rising = mask & ~keys;
    // Resolve a simultaneously pressed chord before the real white-key attack.
    if (!locked && reset_choice<0) for (int slot = 0; slot < 11; slot++) if (rising & (1u << black[slot])) selected = slot;
    for (int key = 0; key < 16; key++) if (rising & (1u << white[key])) {
        int pitch = fw_slot_pitch(selected,string_of(key));
        last_key = key; last_pitch = pitch < 0 ? -1 : gm_pitch(tone,pitch + transpose);
        if (pitch < 0) continue;
        gm_set_character(velocity);
        float intensity = key < 6 ? 0.36f : key < 12 ? 0.72f : 1.0f;
        if (gm_note_on(string_of(key), last_pitch, intensity, tone)) attacks++;
    }
    if(play_mode && !editing && reset_choice<0) {
        uint32_t chord_mask=0;for(int i=0;i<11;i++)chord_mask|=1u<<black[i];
        if(rising&chord_mask&~auto_blocked) rhythm_start();
        if(!(mask&chord_mask)) auto_running=0; // Complete an already-started strum, never repeat after release.
    }
    keys = mask;
}
static void save(void) {
    settings[0] = 0x474d0009u; settings[1] = (uint32_t)selected; settings[2] = (uint32_t)tone;
    settings[3] = (uint32_t)volume; settings[4] = (uint32_t)velocity; settings[5] = (uint32_t)room;
    settings[6] = (uint32_t)(transpose + 12); settings[7] = (uint32_t)locked;
    for (int i = 0; i < 11; i++) settings[8 + i] = (uint32_t)slots[i];
    for(int i=0;i<11;i++) settings[21+i]=(uint32_t)slot_shapes[i];
    settings[32]=(uint32_t)play_mode;settings[33]=(uint32_t)bpm;
    for(int i=0;i<8;i++)settings[34+i]=(uint32_t)rhythm[i/4][i%4];
    settings[42]=(uint32_t)gate_tails;settings[43]=(uint32_t)humanity;
    settings[19] = (uint32_t)mode; settings[20] = 1; store_version++;
}
int fw_restore(void) {
    if ((settings[0] != 0x474d0001u && settings[0] != 0x474d0002u && settings[0] != 0x474d0003u && settings[0] != 0x474d0004u && settings[0] != 0x474d0005u && settings[0] != 0x474d0006u && settings[0] != 0x474d0007u && settings[0] != 0x474d0008u && settings[0] != 0x474d0009u) || settings[1] >= 11 || settings[2] >= (settings[0] >= 0x474d0003u ? (uint32_t)gm_tone_count() : 3u) ||
        settings[3] > 100 || (settings[0] < 0x474d0004u && settings[4] < 10) || settings[4] > 100 || settings[5] > 100 || settings[6] > 24 || settings[7] > 1) return 0;
    if (settings[0] != 0x474d0001u && (settings[19] >= FW_MODES || settings[20] != 1)) return 0;
    for (int i = 0; i < 11; i++) if (settings[8 + i] >= FW_CHORDS) return 0;
    if(settings[0]>=0x474d0005u) for(int i=0;i<11;i++) if(settings[21+i]>=shape_counts[settings[8+i]]) return 0;
    if(settings[0]>=0x474d0006u) {
        if(settings[32]>2 || settings[33]<40 || settings[33]>240) return 0;
        for(int i=0;i<8;i++) if(settings[34+i]>(uint32_t)(i%4==0?5:i%4==1?(settings[0]==0x474d0006u?5:17):i%4==2?(settings[0]==0x474d0006u?3:4):i<4?(settings[0]>=0x474d0009u?50:10):12))return 0;
    }
    if(settings[0]>=0x474d0008u && (settings[42]>1 || settings[43]>10))return 0;
    rhythm_cancel();tempo_edit=0;
    play_mode=settings[0]>=0x474d0006u?(int)settings[32]:0;bpm=settings[0]>=0x474d0006u?(int)settings[33]:90;
    int defaults[2][4]={{0,9,4,10},{0,9,4,0}};memcpy(rhythm,defaults,sizeof rhythm);
    if(settings[0]>=0x474d0006u)for(int i=0;i<8;i++)rhythm[i/4][i%4]=(int)settings[34+i];
    if(settings[0]==0x474d0006u) { const int legacy_divisions[]={3,6,9,11,12,14};for(int i=0;i<2;i++)rhythm[i][1]=legacy_divisions[rhythm[i][1]]; }
    gate_tails=settings[0]>=0x474d0008u?(int)settings[42]:0;
    humanity=settings[0]>=0x474d0008u?(int)settings[43]:settings[0]>=0x474d0006u?rhythm[0][3]:2;
    if(settings[0]==0x474d0008u)rhythm[0][3]*=5;
    if(settings[0]<0x474d0008u)rhythm[0][3]=10; // Old K4 was humanity; migrate it to globals.
    mode = settings[0] == 0x474d0001u ? 0 : (int)settings[19];
    selected = (int)settings[1]; tone = (int)settings[2]; volume = (int)settings[3];
    velocity = settings[0] >= 0x474d0004u ? (int)settings[4] : (int)(settings[4]+1)/2; room = (int)settings[5]; transpose = (int)settings[6] - 12; locked = (int)settings[7];
    for (int i = 0; i < 11; i++) { slots[i] = (int)settings[8 + i]; slot_shapes[i]=settings[0]>=0x474d0005u?(int)settings[21+i]:0; }
    return 1;
}
void fw_button(int button, int down) {
    if (button < 0 || button >= 14) return;
    uint32_t bit = 1u << button;
    int rising = down && !(buttons & bit);
    int falling = !down && (buttons & bit);
    if (down) buttons |= bit; else buttons &= ~bit;
    if (button == 2) {
        if (rising) { hold_started = clock_ms; lock_fired = 0; }
        if (!down) lock_fired = 0;
    }
    if (button == 4) {
        if(rising) { edit_started=clock_ms; edit_fired=0; }
        if(falling && !edit_fired && reset_choice<0) { rhythm_cancel(); page=1; editing=!editing; }
    }
    if (!rising) return;
    switch (button) {
    case 0: page=page==2?0:2;editing=tempo_edit=0;reset_choice=-1;break;                       // FX: effect/level page
    case 1:                                      // SEL: contextual OK / finish editing
        if(reset_choice>=0) {
            if(!locked && reset_choice==1) { slots[selected]=mode_slots[mode][selected]; slot_shapes[selected]=0; }
            if(!locked && reset_choice==2) { memcpy(slots,mode_slots[mode],sizeof slots); memset(slot_shapes,0,sizeof slot_shapes); }
            reset_choice=-1; editing=0;
        } else if(tempo_edit) tempo_edit=0; else if(editing) editing=0;else if(page==3)page=0;
        break;
    case 3: break; // LFO reserved; SELECT directly controls BPM.
    case 8: editing=tempo_edit=0;rhythm_cancel();play_mode=(play_mode+1)%3;page=0;break;
    case 4: break;   // EDIT: assign a chord to the selected slot
    case 5: page=page==3?0:3;editing=tempo_edit=0;reset_choice=-1;break;                       // GLO: global performance settings
    case 6: tempo_edit=0;page = 0; editing = 0; reset_choice=-1; break;
    case 7: save(); break;
    case 10: fw_panic(); break;                    // PLAY/STOP repurposed as damp, no transport
    case 12: transpose = bound(transpose - 12, -12, 12); break;
    case 13: transpose = bound(transpose + 12, -12, 12); break;
    default: break;                               // reserved controls cannot invent notes
    }
}
void fw_encoder(int role, int delta) {
    delta = bound(delta, -100, 100);
    if(role<0 || role>7 || !delta) return;
    control_touch(role);
    if(reset_choice>=0) { if(role==2) reset_choice=bound(reset_choice+delta,0,2); return; }
    if(role==0) { bpm=bound(bpm+delta,40,240);return; }
    if(page==3 && role>=3 && role<=6) { if(role==3)gate_tails=bound(gate_tails+delta,0,1);else if(role==4)humanity=bound(humanity+delta,0,10);return; }
    if(play_mode && page==0 && role>=3 && role<=6) {
        int i=role-3,*params=rhythm[play_mode==2];params[i]=bound(params[i]+delta,0,i==0?5:i==1?17:i==2?4:play_mode==1?50:12);return;
    }
    switch (role) {
    case 0: break; // BPM handled above.
    case 1: tone = bound(tone + delta, 0, gm_tone_count()-1); break;
    case 2:
        if (!locked) {
            if (editing) { slots[selected] = bound(slots[selected] + delta, 0, FW_CHORDS - 1); slot_shapes[selected]=0; }
            else fw_set_mode(bound(mode + delta, 0, FW_MODES - 1));
        }
        break;
    case 3: velocity = bound(velocity + delta, 0, 100); break;
    case 4: transpose = bound(transpose + delta, -12, 12); break;
    case 5: room = bound(room + delta, 0, 100); break;
    case 6: if(!locked) slot_shapes[selected]=bound(slot_shapes[selected]+delta,0,fw_voicing_count()-1); break;
    case 7: volume = bound(volume + delta, 0, 100); break;
    }
}
void fw_master(int value) { int next=bound(value,0,100); if(next!=volume) control_touch(7); volume=next; }
float *fw_render(int frames) {
    if(frames<1 || frames>GM_BLOCK)return 0;
    float *samples;
    if(play_mode || queued || auto_running) samples=rhythm_render(frames);else { samples=gm_render(frames);sample_clock+=(uint32_t)frames; }
    if (!samples) return 0;
    clock_remainder += (uint32_t)frames * 1000u;
    clock_ms += clock_remainder / GM_RATE;
    clock_remainder %= GM_RATE;
    if ((buttons & (1u << 2)) && !lock_fired && clock_ms - hold_started >= 3000) {
        locked = !locked; lock_fired = 1; reset_choice=-1;
    }
    if((buttons & (1u<<4)) && !edit_fired && clock_ms-edit_started>=1200u) {
        edit_fired=1;
        if(!locked) { rhythm_cancel();reset_choice=0; page=1; }
    }
    for (int i = 0; i < frames; i++) {
        float delayed = room_line[room_cursor];
        room_line[room_cursor] = samples[i] + delayed * 0.32f;
        room_cursor = (room_cursor + 1) & 2047u;
        samples[i] = (samples[i] + delayed * (room / 300.0f)) * (volume / 100.0f) * 0.8f;
        if (samples[i] > 0.98f) samples[i] = 0.98f;
        if (samples[i] < -0.98f) samples[i] = -0.98f;
    }
    if(samples!=auto_output)memcpy(auto_output,samples,(unsigned)frames*sizeof(float));
    return auto_output;
}
uint32_t fw_lights(void) { return keys | (1u << black[selected]); }
uint32_t fw_muted(void) {
    uint32_t mask = 0;
    for (int i = 0; i < 16; i++) if (fw_slot_pitch(selected,string_of(i)) < 0) mask |= 1u << white[i];
    return mask;
}
uint32_t fw_buttons(void) { return buttons | (locked ? 1u << 2 : 0) | (tempo_edit?1u<<3:0) | (play_mode?1u<<8:0) | (page==2?1u:0) | (page==3?1u<<5:0); }
static void rect(int x, int y, int w, int h, uint16_t color) {
    for (int row = y; row < y + h && row < 240; row++) for (int col = x; col < x + w && col < 240; col++)
        if (row >= 0 && col >= 0) framebuffer[row * 240 + col] = color;
}
static void draw_text(int x, int y, const char *s, int scale, uint16_t color, int preserve_case) {
    for (; *s; s++, x += 6 * scale) {
        char c = !preserve_case && *s >= 'a' && *s <= 'z' ? *s - 32 : *s;
        for (unsigned int g = 0; g < sizeof glyphs / sizeof glyphs[0]; g++) if (glyphs[g].c == c)
            for (int row = 0; row < 7; row++) for (int col = 0; col < 5; col++)
                if (glyphs[g].rows[row] & (1u << (4 - col))) rect(x + col * scale, y + row * scale, scale, scale, color);
    }
}
static void text(int x, int y, const char *s, int scale, uint16_t color) { draw_text(x,y,s,scale,color,0); }
static void chord_text(int x, int y, const char *s, int scale, uint16_t color) { draw_text(x,y,s,scale,color,1); }
// Readable antialiased glyphs, blended into the existing RGB565 framebuffer.
static int display_index(char c) {
    for(int i=0;display_chars[i];i++) if(display_chars[i]==c) return i;
    return -1;
}
static int display_width(const char *s,const display_glyph *font) {
    int width=0;
    for(;*s;s++) { int i=display_index(*s); if(i>=0) width+=font[i].advance; }
    return width;
}
static void display_text(int cx,int baseline,const char *s,int size,uint16_t ink) {
    const display_glyph *font=size==36?display_glyphs_36:size==26?display_glyphs_26:size==18?display_glyphs_18:size==14?display_glyphs_14:display_glyphs_12;
    const uint8_t *pixels=size==36?display_pixels_36:size==26?display_pixels_26:size==18?display_pixels_18:size==14?display_pixels_14:display_pixels_12;
    int x=cx-display_width(s,font)/2;
    for(;*s;s++) {
        int i=display_index(*s); if(i<0) continue;
        const display_glyph *g=&font[i];
        for(int row=0;row<g->h;row++) for(int col=0;col<g->w;col++) {
            int n=row*g->w+col, alpha=(pixels[g->offset+n/2]>>(n%2?0:4))&15;
            int px=x+g->x+col,py=baseline+g->y+row;
            if(!alpha || px<0 || px>=240 || py<0 || py>=240) continue;
            uint16_t bg=framebuffer[py*240+px];
            int r=(((ink>>11)*alpha+(bg>>11)*(15-alpha)+7)/15);
            int green=((((ink>>5)&63)*alpha+((bg>>5)&63)*(15-alpha)+7)/15);
            int blue=(((ink&31)*alpha+(bg&31)*(15-alpha)+7)/15);
            framebuffer[py*240+px]=(uint16_t)((r<<11)|(green<<5)|blue);
        }
        x+=g->advance;
    }
}
static void note_text(int x,int y,int pitch,uint16_t color) {
    static const char *const names[]={"C","C#","D","D#","E","F","F#","G","G#","A","A#","B"};
    if(pitch<0) { display_text(x,y+15,"X",18,color); return; }
    const char *name=names[pitch%12]; char label[5]; int i=0;
    while(*name) label[i++]=*name++;
    label[i++]=(char)('0'+pitch/12-1); label[i]=0;
    display_text(x,y+15,label,18,color);
}
static void number(int x, int y, int n, int scale, uint16_t color) {
    char s[12], rev[12]; int length = 0, i = 0;
    if (n < 0) { s[i++] = '-'; n = -n; }
    do { rev[length++] = (char)('0' + n % 10); n /= 10; } while (n && length < 10);
    while (length) s[i++] = rev[--length]; s[i] = 0; text(x,y,s,scale,color);
}
static void column_value(int x,int y,const char *s,uint16_t ink) {
    for(int line=0;line<2 && *s;line++) {
        char part[13]; int n=0,space=0;
        while(n<12 && s[n]) { if(s[n]==' ') space=n; n++; }
        if(n==12 && s[n] && space) n=space;
        memcpy(part,s,(unsigned)n); part[n]=0; text(x+(80-n*6)/2,y+line*10,part,1,ink);
        s+=n; while(*s==' ') s++;
    }
}
static void knob_value(int cx,int value,int percent,int sign,uint16_t ink) {
    char label[12],rev[10]; int n=0,k=0;
    if(value<0) { label[n++]='-'; value=-value; }
    else if(sign) label[n++]='+';
    do { rev[k++]=(char)('0'+value%10); value/=10; } while(value && k<10);
    while(k) label[n++]=rev[--k];
    if(percent) label[n++]='%'; label[n]=0;
    display_text(cx,30,label,18,ink);
}
uint16_t *fw_frame(void) {
    const uint16_t mint = 0xa7d9, white_ink = 0xef7d, dim = 0x6bce, orange = 0xfcc9;
    rect(0,0,240,240,0x0842); rect(0,0,240,36,0x2166);
    int rhythm_controls=play_mode && page==0;
    if(rhythm_controls) {
        int *p=rhythm[play_mode==2];
        text(8,4,"1 PAT",1,mint);text(58,4,"2 DIV",1,mint);text(104,4,"3 GATE",1,mint);text(154,4,play_mode==1?"4 STRM":"4 SWNG",1,mint);
        char pattern[4]={(char)('1'+p[0]),'/', '6',0};display_text(25,30,pattern,18,white_ink);
        display_text(75,30,division_names[p[1]],14,white_ink);if(p[2]==4)display_text(125,30,"FREE",14,white_ink);else knob_value(125,(p[2]+1)*25,1,0,white_ink);if(play_mode==1 && !p[3])display_text(175,30,"INST",14,white_ink);else knob_value(175,p[3]*5,play_mode==2,0,white_ink);
    } else if(page==3) {
        text(8,4,"1 TAIL",1,mint);text(72,4,"2 HUMAN",1,mint);
        display_text(30,30,gate_tails?"ON":"OFF",18,white_ink);knob_value(100,humanity*10,1,0,white_ink);
    } else {
        text(8,4,"1 INT",1,mint); text(58,4,"2 TRN",1,mint);
        text(104,4,"3 ROOM",1,mint); text(154,4,"4 VOIC",1,mint);
        knob_value(25,velocity,1,0,white_ink); knob_value(75,transpose,0,1,white_ink);
        knob_value(125,room,1,0,white_ink);
        char shape_label[4]={(char)('1'+fw_voicing()),'/',(char)('0'+fw_voicing_count()),0};display_text(175,30,shape_label,18,white_ink);
    }
    // Lock lives in the title bar; ENV is the physical hold gesture.
    uint16_t lock_ink=locked?0xf986:mint;
    if(buttons&(1u<<2)) { int heat=fw_lock_progress();lock_ink=(uint16_t)((31<<11)|((48-42*heat/1000)<<5)|5); }
    rect(214,11,17,12,lock_ink); rect(221,15,3,5,0x2166);
    rect(217,4,3,8,lock_ink); rect(219,2,8,3,lock_ink);
    rect(226,4,3,locked?8:3,lock_ink); text(214,26,"ENV",1,mint);
    text(22,40,"PRESET",1,dim); text(93,40,"ALGORITHM",1,dim); text(182,40,"TEMPO",1,dim);
    rect(79,39,1,33,0x2166); rect(159,39,1,33,0x2166);
    column_value(0,52,reset_choice>=0?reset_names[reset_choice]:editing?chord_names[slots[selected]]:mode_names[mode],mint);
    column_value(80,52,gm_tone_name(tone),orange);
    column_value(160,52,play_names[play_mode],mint);
    text(175,64,"BPM",1,dim);number(200,64,bpm,1,orange);
    const char *chord = chord_names[slots[selected]];
    int chord_width=rhythm_controls?112:148, chord_center=rhythm_controls?60:80;
    int title_size=!rhythm_controls && display_width(chord,display_glyphs_36)<=chord_width?36:display_width(chord,display_glyphs_26)<=chord_width?26:18;
    display_text(chord_center,108,chord,title_size,white_ink);
    rect(rhythm_controls?120:160,77,1,41,0x2166);
    if(rhythm_controls) {
        int *p=rhythm[play_mode==2];
        text(125,79,"PAT:",1,dim);text(152,79,(play_mode==1?strum_names:arp_names)[p[0]],1,white_ink);
        text(125,89,"DIV:",1,dim);text(158,89,division_names[p[1]],1,white_ink);
        text(125,99,"GATE:",1,dim);if(p[2]==4)text(164,99,"FREE",1,white_ink);else {number(164,99,(p[2]+1)*25,1,white_ink);text(183,99,"%",1,dim);if(gate_tails)text(198,99,"RING",1,mint);}
        text(125,109,play_mode==1?"STRM:":"SWNG:",1,dim);if(play_mode==1 && !p[3])text(164,109,"INSTANT",1,white_ink);else {number(164,109,p[3]*5,1,white_ink);text(187,109,play_mode==1?"MS":"%",1,dim);}
    } else {
        text(174,80,"SLOT",1,dim); number(207,80,selected+1,1,white_ink);
        text(174,94,"OCT",1,mint); if(transpose>=0) text(198,94,"+",1,mint);
        number(transpose>=0?204:198,94,transpose/12,1,mint);
        if(transpose%12) { text(174,108,"SHIFT",1,dim); number(210,108,transpose%12,1,mint); }
        else { text(174,108,"V",1,dim); number(186,108,gm_active(),1,white_ink); text(204,108,"/14",1,dim); }
    }
    if (page == 0) {
        const char *labels[] = {"E","A","D","G","B","E"};
        int count=gm_parts(tone), step=count==4?48:38;
        int start=(240-(count-1)*step-24)/2;
        for (int i=0; i<count; i++) {
            if(tone>=11) { char part[2]={(char)('1'+i),0}; display_text(start+12+i*step,130,part,14,dim); }
            else display_text(start+12+i*step,130,labels[i],14,dim);
            int pitch = fw_slot_pitch(selected,gm_part(tone,i));
            uint16_t ink=white_ink;
            if(last_key>=0 && string_of(last_key)==gm_part(tone,i))
                ink=last_key<6?0x97f4:last_key<12?0xedd0:0xfbae;
            note_text(start+12+i*step,136,pitch<0?-1:gm_pitch(tone,pitch+transpose),ink);
        }
        text(10,157,"SOFT 6",1,0x97f4); text(82,157,"NORMAL 6",1,0xedd0); text(166,157,"ACCENT 4",1,0xfbae);


    } else if (page == 1) {
        text(10,123,editing ? "EDIT SLOT ASSIGNMENT" : "CHORD SLOTS",1,mint);
        text(10,136,editing ? "PRESETS: CHANGE VOICING" : "PRESETS: CHANGE STYLE",1,white_ink);
        text(10,149,editing?"SEL: FINISH EDITING":"HOLD EDIT: RESET SLOTS",1,dim);
#ifdef GM_FM1
        text(10,158,"SAVE: RAM ONLY FOR NOW",1,dim);
#else
        text(10,158,"SAVE: STORE IN BROWSER",1,dim);
#endif
    } else if (page == 2) {
        text(10,123,"INTENSITY",1,dim); number(140,123,velocity,1,white_ink);
        text(10,134,"TRANSPOSE",1,dim); number(140,134,transpose,1,white_ink);
        text(10,145,"SHARED ROOM",1,dim); number(140,145,room,1,white_ink);
        text(10,156,"MASTER",1,dim); number(140,156,volume,1,white_ink);

    } else {
        text(10,123,"GLOBAL SETTINGS",1,mint);
        text(10,135,"K1 GATE TAILS:",1,dim);text(110,135,gate_tails?"ON":"OFF",1,white_ink);
        text(10,147,"K2 HUMANITY:",1,dim);number(110,147,humanity*10,1,white_ink);text(132,147,"%",1,dim);
        text(10,158,"SEL / GLO: HOME",1,mint);
    }
    if(reset_choice>=0) {
        rect(5,120,230,46,0x0842);
        text(10,122,"RESET / HOME: CANCEL",1,orange);
        for(int i=0;i<3;i++) {
            if(i==reset_choice) rect(5+i*77,134,76,15,0x2166);
            text(9+i*77,138,reset_names[i],1,i==reset_choice?orange:dim);
        }
        text(10,154,"PRESETS: CHOOSE  SEL: OK",1,mint);
    }
    // Larger three-column voicing map, visible on every page.
    rect(5,165,230,1,0x2166);
    for (int slot=0;slot<11;slot++) {
        int x=(slot%3)*80, y=168+(slot/3)*17;
        if(slot==selected) rect(x+1,y-1,78,17,0x2166);
        number(x+4,y+4,slot+1,1,dim);
        const char *name=chord_names[slots[slot]];
        int size=display_width(name,display_glyphs_14)<=56?14:12;
        int suggestion=fw_suggestion(slot);
        uint16_t hint_ink=suggestion==3?0x9f16:suggestion==2?0xfda9:0xeaaa;
        display_text(x+48,y+12,name,size,slot==selected?orange:hint_ink);
    }
    text(164,224,"NEXT",1,dim);rect(195,225,5,5,0x9f16);rect(206,225,5,5,0xfda9);rect(217,225,5,5,0xeaaa);
    return framebuffer;
}
