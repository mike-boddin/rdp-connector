#!/bin/bash
set -euo pipefail

FREERDP_BIN="/opt/bin/xfreerdp"
LIB_DIR="/opt/lib"
EXCLUDE_LIBS="libc.so libm.so libpthread.so libdl.so librt.so libgcc_s.so ld-linux libanl.so libnss libutil.so"

declare -A VISITED

copy_deps() {
  local file="$1"

  ldd "$file" | awk '/=>/ {print $3}' | while read -r dep; do
    [[ -z "$dep" || ! -f "$dep" ]] && continue

    for ex in $EXCLUDE_LIBS; do
      if [[ "$dep" == *"$ex"* ]]; then
        continue 2
      fi
    done

    if [[ -n "${VISITED[$dep]:-}" ]]; then
      continue
    fi
    VISITED[$dep]=1

    echo "[*] Copying: $dep"
    cp -u "$dep" "$LIB_DIR/"

    copy_deps "$dep"
  done
}

copy_deps "$FREERDP_BIN"
