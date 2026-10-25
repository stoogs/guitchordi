#define _POSIX_C_SOURCE 200809L
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include "engine.h"
static void u16(FILE *f, uint32_t x) { fputc(x & 255, f); fputc((x >> 8) & 255, f); }
static void u32(FILE *f, uint32_t x) { u16(f, x); u16(f, x >> 16); }
static double seconds(void) { struct timespec t; clock_gettime(CLOCK_MONOTONIC, &t); return t.tv_sec + t.tv_nsec * 1e-9; }
int main(int argc, char **argv) {
    if (argc != 5) { fprintf(stderr, "usage: render OUTPUT.wav VOICES(1..14) TONE(0..15) MODE(0=strum,1=benchmark)\n"); return 2; }
    int nvoice = atoi(argv[2]), tone = atoi(argv[3]), bench = atoi(argv[4]);
    if (nvoice < 1 || nvoice > GM_VOICES || tone < 0 || tone >= gm_tone_count()) return 2;
    FILE *f = fopen(argv[1], "wb"); if (!f) return 2;
    const int frames = GM_RATE * 6;
    fwrite("RIFF", 1, 4, f); u32(f, 36 + frames * 2); fwrite("WAVEfmt ", 1, 8, f);
    u32(f, 16); u16(f, 1); u16(f, 1); u32(f, GM_RATE); u32(f, GM_RATE * 2); u16(f, 2); u16(f, 16);
    fwrite("data", 1, 4, f); u32(f, frames * 2);
    int pitches[] = {43,47,50,55,59,67};
    int next = 0; double elapsed = 0, worst = 0; int blocks = 0, total_clips = 0;
    gm_reset();
    for (int pos = 0; pos < frames;) {
        if (bench && pos % (GM_RATE / 2) == 0) {
            total_clips += gm_clips(); gm_reset(); for (int v = 0; v < nvoice; v++) gm_note_on(v % 6, pitches[v % 6], 0.72f, tone);
        } else if (!bench) {
            while (next < nvoice && pos >= next * (GM_RATE * 45 / 1000)) {
                gm_note_on(next % 6, pitches[next % 6], 0.72f, tone); next++;
            }
        }
        int count = bench ? 126 : 128; // 126 divides 22050: steady workload restarts every 0.5s.
        if (count > frames - pos) count = frames - pos;
        double start = seconds(); float *out = gm_render(count); double cost = seconds() - start;
        elapsed += cost; if (cost > worst) worst = cost; blocks++;
        for (int i = 0; i < count; i++) { int16_t value = (int16_t)(out[i] * 32767); u16(f, (uint16_t)value); }
        pos += count;
    }
    fclose(f);
    printf("{\"voices\":%d,\"tone\":%d,\"mode\":%d,\"rate\":%d,\"seconds\":6,\"render_seconds\":%.6f,\"mean_budget_percent\":%.3f,\"worst_block_ms\":%.4f,\"blocks\":%d,\"state_bytes\":%d,\"clips\":%d}\n", nvoice,tone,bench,GM_RATE,elapsed,elapsed / 6 * 100,worst*1000,blocks,gm_state_bytes(),total_clips + gm_clips());
    return 0;
}
