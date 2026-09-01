#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# test-duplicate.sh
#
# Acceptance test: submits a POST /api/applications with a fixed application
# number twice, and verifies:
#   - First POST  → HTTP 201 (success)
#   - Second POST → HTTP 409 with { duplicateApplicationNumber: true }
#
# Usage:
#   chmod +x test-duplicate.sh
#   ./test-duplicate.sh
#
# Assumes the server is already running on PORT (default 5001).
# ─────────────────────────────────────────────────────────────────────────────

PORT=${PORT:-5001}
URL="http://localhost:${PORT}/api/applications"
TEST_NUM="OE-DUPE-TEST-$$"   # unique per-run via PID, so reruns don't collide

PAYLOAD=$(cat <<JSON
{
  "applicationNumber": "${TEST_NUM}",
  "applicationDate": "2026-09-01",
  "fullName": "DUPLICATE TEST USER",
  "personalNumber": "JC-DUPE-001",
  "service": "Army",
  "urcNo": "URC-TEST",
  "urcName": "TEST URC"
}
JSON
)

echo "═══════════════════════════════════════════════════════"
echo "  DUPLICATE APPLICATION NUMBER ACCEPTANCE TEST"
echo "  Application Number: ${TEST_NUM}"
echo "═══════════════════════════════════════════════════════"

# ── First submission ─────────────────────────────────────────────────────────
echo ""
echo "  Attempt 1 (expect HTTP 201):"

HTTP1=$(curl -s -o /tmp/dup_resp1.json -w "%{http_code}" \
  -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

BODY1=$(cat /tmp/dup_resp1.json)
echo "  HTTP status : ${HTTP1}"
echo "  Response    : ${BODY1}"

if [[ "$HTTP1" != "201" ]]; then
  echo ""
  echo "  ❌  FAIL: expected HTTP 201 on first submission, got ${HTTP1}"
  exit 1
fi
echo "  ✓  First submission accepted (HTTP 201)"

# ── Second submission (same number) ──────────────────────────────────────────
echo ""
echo "  Attempt 2 (same number — expect HTTP 409):"

HTTP2=$(curl -s -o /tmp/dup_resp2.json -w "%{http_code}" \
  -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

BODY2=$(cat /tmp/dup_resp2.json)
echo "  HTTP status : ${HTTP2}"
echo "  Response    : ${BODY2}"

if [[ "$HTTP2" != "409" ]]; then
  echo ""
  echo "  ❌  FAIL: expected HTTP 409 on duplicate submission, got ${HTTP2}"
  exit 1
fi

# Check for machine-readable flag
if echo "$BODY2" | grep -q '"duplicateApplicationNumber":true'; then
  echo "  ✓  Response contains duplicateApplicationNumber: true"
else
  echo ""
  echo "  ❌  FAIL: response does not contain { duplicateApplicationNumber: true }"
  exit 1
fi

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "───────────────────────────────────────────────────────"
echo "  ✅  PASS: duplicate application number correctly rejected with HTTP 409."
echo "═══════════════════════════════════════════════════════"

rm -f /tmp/dup_resp1.json /tmp/dup_resp2.json
