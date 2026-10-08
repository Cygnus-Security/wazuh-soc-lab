#!/usr/bin/env bash
set -euo pipefail

WAZUH_CONTAINER="single-node-wazuh.manager-1"
RULE_FILE="/var/ossec/etc/rules/bglobal_crapi_rules.xml"
SCANNER_UPLOAD_LOG='10.10.1.20 - - [31/May/2026:18:08:07 +0000] "GET /jQuery-File-Upload/server/php/UploadHandler.php HTTP/1.1" 404 159 "-" "Mozilla/5.0 [en] (X11, U; OpenVAS-VT 23.19.0)"'
ROUTER_MAIL_LOG='2026-06-01T16:50:32+0000 prefix=CRAPI_MAIL_IN SRC=10.10.1.20 DST=172.18.0.2 PROTO=TCP SPT=48108 DPT=8025 IN=eth0'
AUTH_FAILURE_LOG='10.10.1.60 - - [01/Jun/2026:16:51:00 +0000] "POST /identity/api/auth/login HTTP/1.1" 401 123 "-" "PostmanRuntime/7.39.0"'

make_repeated_auth_payload() {
  local payload=""
  local i
  for i in $(seq 1 5); do
    payload+="10.10.1.61 - - [01/Jun/2026:16:52:$(printf '%02d' "$i") +0000] \"POST /identity/api/auth/login HTTP/1.1\" 401 123 \"-\" \"PostmanRuntime/7.39.0\""$'\n'
  done
  printf '%s' "$payload"
}

if ! docker ps --format '{{.Names}}' | grep -Fxq "$WAZUH_CONTAINER"; then
  echo "ERROR: Wazuh container is not running: $WAZUH_CONTAINER" >&2
  exit 1
fi

echo "[1/10] Verifying custom rule file exists in the Wazuh manager container"
docker exec "$WAZUH_CONTAINER" test -f "$RULE_FILE"

echo "[2/10] Verifying scanner/upload rule 110610 exists"
docker exec "$WAZUH_CONTAINER" grep -n 'rule id="110610"' "$RULE_FILE"

echo "[3/10] Verifying generic router visibility rules 111000 and 111001 still exist"
docker exec "$WAZUH_CONTAINER" grep -n 'rule id="111000"' "$RULE_FILE"
docker exec "$WAZUH_CONTAINER" grep -n 'rule id="111001"' "$RULE_FILE"

echo "[4/10] Verifying hardcoded Kali attacker rule 111010 was removed"
if docker exec "$WAZUH_CONTAINER" grep -Rni '<rule id="111010"' "$RULE_FILE"; then
  echo "FAIL: removed hardcoded Kali attacker rule 111010 still exists" >&2
  exit 1
else
  echo "PASS: hardcoded Kali attacker rule 111010 was removed"
fi

echo "[5/10] Restarting Wazuh manager"
docker exec "$WAZUH_CONTAINER" /var/ossec/bin/wazuh-control restart

echo "[6/10] Running wazuh-logtest with upload/plugin scanner log"
scanner_output="$(printf '%s\n' "$SCANNER_UPLOAD_LOG" | docker exec -i "$WAZUH_CONTAINER" /var/ossec/bin/wazuh-logtest 2>&1)"
printf '%s\n' "$scanner_output"

echo "[7/10] Checking for custom scanner/upload rule match"
if grep -Eq "id: '(110600|110610)'" <<< "$scanner_output"; then
  echo "PASS: wazuh-logtest matched custom rule 110600 or 110610"
else
  echo "ERROR: expected custom rule 110600 or 110610, but neither matched" >&2
  exit 1
fi

echo "[8/10] Running wazuh-logtest with authentication failure log"
auth_output="$(printf '%s\n' "$AUTH_FAILURE_LOG" | docker exec -i "$WAZUH_CONTAINER" /var/ossec/bin/wazuh-logtest 2>&1)"
printf '%s\n' "$auth_output"

if grep -q "id: '110200'" <<< "$auth_output"; then
  echo "PASS: authentication failure matched rule 110200"
else
  echo "ERROR: expected authentication failure rule 110200" >&2
  exit 1
fi

echo "[9/10] Running wazuh-logtest with repeated authentication failures"
bruteforce_output="$(make_repeated_auth_payload | docker exec -i "$WAZUH_CONTAINER" /var/ossec/bin/wazuh-logtest 2>&1)"
printf '%s\n' "$bruteforce_output"

if grep -q "id: '110201'" <<< "$bruteforce_output"; then
  echo "PASS: repeated authentication failures matched brute-force correlation rule 110201"
else
  echo "ERROR: expected brute-force correlation rule 110201" >&2
  exit 1
fi

echo "[10/10] Running wazuh-logtest with router before-NAT log and checking 111010 does not fire"
router_output="$(printf '%s\n' "$ROUTER_MAIL_LOG" | docker exec -i "$WAZUH_CONTAINER" /var/ossec/bin/wazuh-logtest 2>&1)"
printf '%s\n' "$router_output"

if grep -q "id: '111010'" <<< "$router_output"; then
  echo "ERROR: removed rule 111010 still fired for router log" >&2
  exit 1
fi

if grep -q "crAPI lab attacker Kali host observed at router before NAT" <<< "$router_output"; then
  echo "ERROR: removed Kali attacker attribution description still appeared" >&2
  exit 1
fi

if grep -q "id: '111001'" <<< "$router_output"; then
  echo "PASS: router log matched generic CRAPI_MAIL_IN visibility rule 111001"
else
  echo "WARN: router log did not match 111001; confirmed 111010 did not fire"
fi
