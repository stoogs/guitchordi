FROM debian:bookworm-slim@sha256:7ff6ba31527b9e336162fa061746c366c4b2032f4d2cff2078bea43f78efe3f8
RUN apt-get update && apt-get install -y --no-install-recommends build-essential python3 python3-venv python3-pip pkg-config libglib2.0-dev zlib1g-dev ninja-build ca-certificates && rm -rf /var/lib/apt/lists/*
RUN python3 -m venv /opt/qemu-python && /opt/qemu-python/bin/pip install meson==1.5.0 pycotap==1.3.1
