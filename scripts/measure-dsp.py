"""Summarize actual native renderer outputs; no third-party Python dependencies."""
import array, json, math, platform, wave
from pathlib import Path
runs = [json.loads(line) for line in Path('build/native-benchmarks.jsonl').read_text().splitlines()]
for run in runs:
    name = f"bench-{run['voices']}-{run['tone']}.wav" if run['mode'] else f"phys-strum-{run['tone']}.wav"
    with wave.open(str(Path('build/audio') / name), 'rb') as source:
        samples = array.array('h', source.readframes(source.getnframes()))
    run['pcm_peak'] = max(abs(x) for x in samples) / 32768
    run['pcm_rms'] = math.sqrt(sum(x*x for x in samples) / len(samples)) / 32768
    run['nonzero_samples'] = sum(x != 0 for x in samples)
    assert run['pcm_rms'] > 0.0001 and run['pcm_peak'] < 0.979
    assert run['clips'] == 0
result = {'host': platform.platform(), 'container_target': 'Linux aarch64, Docker Desktop on Apple Silicon',
          'compiler': 'cc -O2 -fwrapv -fno-strict-aliasing (Emscripten SDK 4.0.17 image)',
          'limits': 'Native render CPU only; excludes input, output device, worklet/OS scheduling and real FM-1 CPU. Worst block includes host scheduling noise.',
          'runs': runs, 'wasm': json.loads(Path('build/dsp-parity.json').read_text())}
Path('build/dsp-measurements.json').write_text(json.dumps(result, indent=2)+'\n')
print('Measured native WAVs and parity: build/dsp-measurements.json')
