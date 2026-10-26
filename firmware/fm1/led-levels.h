/* SPDX-License-Identifier: GPL-3.0-only */
#pragma once
#include <stdint.h>

/* Binary LEDs, temporal brightness over twelve ~1.1 ms matrix frames:
 * full 100%, medium 25%, faint 8.3% (~76 Hz). The HAL's additional dim divider
 * must stay disabled, otherwise two gates can alias and hide a level. */
#define GM_LED_PHASES 12u
static uint8_t gm_led_mask(unsigned phase,uint8_t full,uint8_t medium,uint8_t faint) {
    return full | (phase%4u==0?medium:0) | (phase==0?faint:0);
}
