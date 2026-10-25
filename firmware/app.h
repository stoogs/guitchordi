#ifndef GUITOMNICHORD_APP_H
#define GUITOMNICHORD_APP_H
#include <stdint.h>
#define FW_SCREEN 240
#define FW_STORE_WORDS 46
void fw_boot(void);
int fw_boot_screen(void);
void fw_keys(uint32_t mask);
void fw_button(int button, int down);
void fw_encoder(int role, int delta);
void fw_master(int value);
void fw_panic(void);
float *fw_render(int frames);
uint16_t *fw_frame(void);
uint32_t fw_lights(void);
int fw_suggestion(int slot);
int fw_suggestion_reason(int slot);
int fw_key_brightness(int key);
uint32_t fw_muted(void);
uint32_t fw_buttons(void);
uint32_t fw_now(void);
uint32_t fw_attacks(void);
uint32_t fw_store_version(void);
uint32_t *fw_store(void);
int fw_restore(void);
int fw_selected(void);
int fw_mode(void);
int fw_mode_count(void);
int fw_set_mode(int index);
const char *fw_mode_name(int index);
const char *fw_slot_name(int slot);
int fw_slot_pitch(int slot, int string_id);
int fw_custom(void);
int fw_chord(void);
int fw_voicing(void);
int fw_voicing_count(void);
int fw_slot_voicing(int slot);
int fw_slot_voicing_count(int slot);
int fw_last_key(void);
int fw_last_pitch(void);
int fw_key_pitch(int key);
int fw_editing(void);
int fw_locked(void);
int fw_tone(void);
int fw_set_tone(int value);
int fw_transpose(void);
int fw_volume(void);
int fw_velocity(void);
int fw_room(void);
int fw_page(void);
int fw_play_mode(void);
int fw_bpm(void);
int fw_gate_tails(void);
int fw_humanity(void);
int fw_rhythm_velocity(void);
int fw_factory_reset_menu(void);
int fw_tuning(void);
int fw_tuning_count(void);
const char *fw_tuning_name(int index);
const char *fw_tuning_label(void);
int fw_open_pitch(int part);
int fw_tempo_edit(void);
int fw_rhythm_param(int index);
int fw_running(void);
int fw_lock_progress(void);
int fw_control(void);
int fw_reset_menu(void);
int fw_state_bytes(void);
#endif
