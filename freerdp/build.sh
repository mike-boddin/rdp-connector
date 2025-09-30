#!/bin/bash
set -euo pipefail

SCRIPT_DIR=$(dirname "$0")

# Create output directory on host
mkdir -p "$SCRIPT_DIR/bin"
mkdir -p "$SCRIPT_DIR/lib"

cd "$SCRIPT_DIR"
# Build with volume mount
docker build -t freerdp-build .

# Run container with bind mount to copy files
docker run --rm -v "./bin:/output-bin" -v "./lib:/output-lib" freerdp-build \
    bash -c "cp -r /opt/bin/* /output-bin/ ; cp -r /opt/lib/* /output-lib/"