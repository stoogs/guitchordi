#!/bin/sh
set -eu
python3 scripts/generate-firmware-bank.py
emcc -O3 -ffp-contract=off -fwrapv -fno-strict-aliasing -Ibuild/generated firmware/app.c dsp/engine.c -lm --no-entry \
  -sSTANDALONE_WASM=1 -sINITIAL_MEMORY=1048576 -sSTACK_SIZE=65536 \
  -sALLOW_MEMORY_GROWTH=0 -sFILESYSTEM=0 -sMALLOC=none \
  -sEXPORTED_FUNCTIONS='["_fw_boot","_fw_keys","_fw_button","_fw_encoder","_fw_master","_fw_panic","_fw_render","_fw_frame","_fw_lights","_fw_suggestion","_fw_suggestion_reason","_fw_key_brightness","_fw_muted","_fw_buttons","_fw_now","_fw_attacks","_fw_store_version","_fw_store","_fw_restore","_fw_selected","_fw_mode","_fw_mode_count","_fw_set_mode","_fw_mode_name","_fw_slot_name","_fw_slot_pitch","_fw_custom","_fw_chord","_fw_voicing","_fw_voicing_count","_fw_slot_voicing","_fw_slot_voicing_count","_fw_last_key","_fw_last_pitch","_fw_key_pitch","_fw_editing","_fw_locked","_fw_tone","_fw_set_tone","_gm_tone_count","_gm_tone_name","_fw_transpose","_fw_volume","_fw_velocity","_fw_room","_fw_page","_fw_play_mode","_fw_bpm","_fw_gate_tails","_fw_humanity","_fw_tuning","_fw_tuning_count","_fw_tuning_name","_fw_tuning_label","_fw_open_pitch","_fw_tempo_edit","_fw_rhythm_param","_fw_running","_fw_lock_progress","_fw_control","_fw_reset_menu","_fw_state_bytes","_gm_active","_gm_steals","_gm_clips"]' \
  -o build/simulator.wasm
