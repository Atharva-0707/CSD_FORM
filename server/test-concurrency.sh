#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# test-concurrency.sh
#
# Acceptance test: fires N concurrent requests to GET /next-number and
# verifies every response contains a DISTINCT, SEQUENTIAL application number
# with NO REPEATS.
#
# Usage:
#   chmod +x test-concurrency.sh
#   ./test-concurrency.sh [concurrency_count]
#
# Assumes the server is already running on PORT (default 5001).
# ─────────────────────────────────────────────────────────────────────────────

PORT=${PORT:-5001}
URL="http://localhost:${PORT}/api/applications/next-number"
CONCURRENCY=${1:-10}      # default: 10 simultaneous requests

echo "═══════════════════════════════════════════════════════"
echo "  CONCURRENCY ACCEPTANCE TEST"
echo "  Firing ${CONCURRENCY} simultaneous requests to:"
echo "  ${URL}"
echo "═══════════════════════════════════════════════════════"

TMPDIR_RUN=$(mktemp -d)

# Fire all requests simultaneously, saving each to its own file
for i in $(seq 1 "$CONCURRENCY"); do
  (
    curl -s "$URL" > "${TMPDIR_RUN}/resp_${i}.json"
  ) &
done
wait

echo ""
echo "All ${CONCURRENCY} requests completed. Responses:"
echo ""

declare -a NUMBERS
ALL_OK=true

for f in "${TMPDIR_RUN}"/resp_*.json; do
  if [[ ! -f "$f" ]]; then continue; fi
  line=$(cat "$f")

  # Extract applicationNumber and sequence from JSON
  appnum=$(echo "$line" | grep -o '"applicationNumber":"[^"]*"' | cut -d'"' -f4)
  sequence=$(echo "$line" | grep -o '"sequence":[0-9]*' | cut -d':' -f2)

  if [[ -z "$appnum" ]]; then
    echo "  ❌  Failed to parse response from $f: $line"
    ALL_OK=false
  else
    echo "  ✓  ${appnum}  (sequence=${sequence})"
    NUMBERS+=("$appnum")
  fi
done

rm -rf "$TMPDIR_RUN"

echo ""
echo "───────────────────────────────────────────────────────"

# Check for duplicates
TOTAL=${#NUMBERS[@]}
UNIQUE=$(printf '%s\n' "${NUMBERS[@]}" | sort -u | wc -l | tr -d ' ')

echo "  Total responses : ${TOTAL}"
echo "  Unique numbers  : ${UNIQUE}"
echo ""

if [[ "$TOTAL" -ne "$CONCURRENCY" ]]; then
  echo "  ❌  FAIL: expected ${CONCURRENCY} responses, got ${TOTAL}"
  exit 1
fi

if [[ "$UNIQUE" -ne "$TOTAL" ]]; then
  echo "  ❌  FAIL: DUPLICATES DETECTED! Concurrency guarantee is broken."
  exit 1
fi

if [[ "$ALL_OK" == "false" ]]; then
  echo "  ❌  FAIL: one or more requests returned an error response."
  exit 1
fi

echo "  ✅  PASS: all ${TOTAL} responses are distinct, sequential, no duplicates."
echo "═══════════════════════════════════════════════════════"
