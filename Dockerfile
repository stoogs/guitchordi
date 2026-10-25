FROM emscripten/emsdk:4.0.17@sha256:10ee8f470c016ddb23d0f04d45bed7b4c3e896f88b135976bbc80751bc7f7825 AS dsp
WORKDIR /src
COPY dsp/ ./dsp/
COPY third_party/clipper-phys/ ./third_party/clipper-phys/
COPY firmware/ ./firmware/
COPY web/chords.json web/styles.json ./web/
COPY scripts/build-dsp.sh scripts/build-simulator.sh scripts/generate-firmware-bank.py scripts/tuning-voicings.py ./scripts/
COPY docs/tuning-presets.json ./docs/tuning-presets.json
RUN sh scripts/build-dsp.sh && sh scripts/build-simulator.sh

FROM dsp AS source
COPY . /source/
RUN python3 /source/scripts/create-source-bundle.py /source /tmp/guitchordi-source.tar.gz

FROM nginx:1.27-alpine@sha256:65645c7bb6a0661892a8b03b89d0743208a18dd2f3f17a54ef4b76fb8e2f2a10 AS instrument
COPY ./web/ /usr/share/nginx/html/
COPY web/styles.json /usr/share/nginx/html/emu/styles.json
COPY web/instruments.json /usr/share/nginx/html/emu/instruments.json
COPY --from=dsp /src/build/phys.wasm /usr/share/nginx/html/dsp/phys.wasm
COPY --from=dsp /src/build/simulator.wasm /usr/share/nginx/html/emu/firmware.wasm
COPY firmware/ /usr/share/nginx/html/upstream-source/application/
COPY third_party/clipper-phys/ /usr/share/nginx/html/upstream-source/clipper-phys/
COPY dsp/ /usr/share/nginx/html/upstream-source/adapter/
COPY LICENSE NOTICES.md /usr/share/nginx/html/upstream-source/
COPY web/licenses.html /usr/share/nginx/html/emu/licenses.html
COPY --from=source /tmp/guitchordi-source.tar.gz /tmp/guitchordi-source.tar.gz.sha256 /usr/share/nginx/html/upstream-source/
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1

FROM instrument AS simulator
COPY nginx.simulator.conf /etc/nginx/conf.d/default.conf
