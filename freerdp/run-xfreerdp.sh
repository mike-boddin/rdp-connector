#!/bin/bash
SCRIPT_DIR=$(dirname "$0")
LD_LIBRARY_PATH="$SCRIPT_DIR/lib:$LD_LIBRARY_PATH"
export LD_LIBRARY_PATH
exec "$SCRIPT_DIR/bin/xfreerdp" "$@"