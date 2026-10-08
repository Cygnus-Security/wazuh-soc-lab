#!/usr/bin/env bash
set -euo pipefail

# Tests the nginx edge-proxy JSON access-log rules (110700-110703) via wazuh-logtest.
# Style mirrors test_bglobal_scanning_rules.sh: run_test for single events,
# run_correlation_test for stateful rules (informational, does not affect exit code).
#
# IMPORTANT: rule 110700 is level 0 (base/visibility), so it does not raise an alert,
# but it still appears as the matched rule in wazuh-logtest Phase 3.

MANAGER="${MANAGER:-single-node-wazuh.manager-1}"
RESULT_LOG="${RESULT_LOG:-bglobal_json_rule_test_results.log}"

PASS=0
FAIL=0
CORR_PASS=0
CORR_FAIL=0

: > "$RESULT_LOG"

if ! docker ps --format '{{.Names}}' | grep -qx "$MANAGER"; then
    echo "ERROR: Wazuh manager container is not running or not found: $MANAGER" >&2
    echo "Override with: MANAGER=your-manager-name ./test_bglobal_json_rules.sh" >&2
    exit 1
fi

# --- Realistic nginx edge-proxy JSON access lines -----------------------------
# Adjust the JSON keys below ONLY if your nginx log_format uses different names.
# The decode-inspection step prints exactly which keys the decoder extracted.

# Base only: auth login with token, 200 -> matches 110700 but no child rule.
BASE_ONLY='{"request_id":"req-0001","src_ip":"10.20.0.5","method":"POST","uri_path":"/identity/api/auth/login","auth_present":"true","status":"200"}'

# Missing auth on a protected object, 200 -> 110701.
MISSING_AUTH='{"request_id":"req-0002","src_ip":"10.20.0.6","method":"GET","uri_path":"/workshop/api/shop/orders/12","auth_present":"false","status":"200"}'

# Token present but rejected (401) -> 110702.
REJECTED_JWT='{"request_id":"req-0003","src_ip":"10.20.0.7","method":"GET","uri_path":"/identity/api/v2/user/dashboard","auth_present":"true","status":"401"}'

build_repeated_rejected_jwt() {
    local i
    for i in $(seq 1 8); do
        printf '{"request_id":"req-91%02d","src_ip":"10.20.0.8","method":"GET","uri_path":"/identity/api/v2/user/dashboard","auth_present":"true","status":"401"}\n' "$i"
    done
}

# --- awk extractors (same approach as the other bGlobal test scripts) ---------
extract_phase3_value() {
    local key="$1"
    awk -v key="$key" '
        /^\*\*Phase 3: Completed filtering \(rules\)\./ { in_phase3 = 1; next }
        in_phase3 && $0 ~ "^[[:space:]]*" key ": " {
            line = $0
            sub("^[[:space:]]*" key ": '\''", "", line)
            sub("'\''.*$", "", line)
            value = line
            in_phase3 = 0
        }
        END { print value }
    '
}

phase3_has_rule() {
    local expected_rule="$1"
    awk -v expected_rule="$expected_rule" '
        /^\*\*Phase 3: Completed filtering \(rules\)\./ { in_phase3 = 1; next }
        in_phase3 && $0 ~ "^[[:space:]]*id: " {
            line = $0
            sub("^[[:space:]]*id: '\''", "", line)
            sub("'\''.*$", "", line)
            if (line == expected_rule) found = 1
            in_phase3 = 0
        }
        END { exit(found ? 0 : 1) }
    '
}

# --- Decode inspection: shows which JSON keys the decoder actually produced ----
inspect_decode() {
    local name="$1" log_line="$2" output
    output=$(printf '%s\n' "$log_line" | docker exec -i "$MANAGER" /var/ossec/bin/wazuh-logtest 2>&1)
    echo
    echo "------------------------------------------------------------"
    echo "Decode inspection: $name"
    echo "Decoder fields (these key names MUST match what the rules reference):"
    printf '%s\n' "$output" | awk '
        /^\*\*Phase 2: Completed decoding\./ { p=1; next }
        /^\*\*Phase 3:/ { p=0 }
        p && /: '\''/ { print }
    ' | sed 's/^/    /'
    {
        echo
        echo "==== Decode inspection: $name ===="
        printf '%s\n' "$output"
    } >> "$RESULT_LOG"
}

run_test() {
    local expected_rule="$1" name="$2" log_line="$3"
    local output actual_rule actual_description
    output=$(printf '%s\n' "$log_line" | docker exec -i "$MANAGER" /var/ossec/bin/wazuh-logtest 2>&1)
    actual_rule=$(printf '%s\n' "$output" | extract_phase3_value "id")
    actual_description=$(printf '%s\n' "$output" | extract_phase3_value "description")

    {
        echo
        echo "============================================================"
        echo "Testing Rule $expected_rule: $name"
        echo "Expected rule ID: $expected_rule"
        echo "Actual rule ID: ${actual_rule:-NONE}"
        echo "Actual description: ${actual_description:-NONE}"
        echo "Raw log: $log_line"
        echo "---- Raw wazuh-logtest output ----"
        printf '%s\n' "$output"
    } >> "$RESULT_LOG"

    echo
    echo "============================================================"
    echo "Test name: $name"
    echo "Expected rule ID: $expected_rule"
    echo "Actual final rule ID: ${actual_rule:-NONE}"
    echo "Actual description: ${actual_description:-NONE}"

    if [[ "$actual_rule" == "$expected_rule" ]]; then
        echo -e "\033[32mPASS\033[0m"
        PASS=$((PASS + 1))
    else
        echo -e "\033[31mFAIL\033[0m"
        echo "Troubleshooting summary:"
        printf '%s\n' "$output" | grep -E "Phase 2|Phase 3|name: '|id: '|status: '|auth_present: '|uri_path: '|description:|Alert to be generated" || true
        FAIL=$((FAIL + 1))
    fi
}

run_correlation_test() {
    local expected_rule="$1" name="$2" payload="$3" output
    output=$(printf '%s\n' "$payload" | docker exec -i "$MANAGER" /var/ossec/bin/wazuh-logtest 2>&1)
    {
        echo
        echo "============================================================"
        echo "Correlation test $expected_rule: $name"
        echo "---- Payload ----"
        printf '%s\n' "$payload"
        echo "---- Raw wazuh-logtest output ----"
        printf '%s\n' "$output"
    } >> "$RESULT_LOG"

    echo
    echo "============================================================"
    echo "Correlation test: $name"
    echo "Expected final rule ID: $expected_rule"
    if printf '%s\n' "$output" | phase3_has_rule "$expected_rule"; then
        echo -e "\033[32mCORRELATION PASS\033[0m"
        CORR_PASS=$((CORR_PASS + 1))
    else
        echo -e "\033[33mCORRELATION NOT MATCHED\033[0m"
        echo "Correlation depends on Wazuh state and frequency/timeframe; this does not fail the run."
        CORR_FAIL=$((CORR_FAIL + 1))
    fi
}

echo "Writing full wazuh-logtest output to: $RESULT_LOG"

echo
echo ">>> STEP 1: confirm the JSON decoder emits the keys the rules expect."
inspect_decode "Sample nginx edge-proxy JSON access line" "$REJECTED_JWT"

echo
echo ">>> STEP 2: single-event JSON rule tests."
run_test "110700" "Base JSON access log rule (benign auth login, no child match)" "$BASE_ONLY"
run_test "110701" "Missing-auth access to protected API object (2xx)" "$MISSING_AUTH"
run_test "110702" "Authenticated request rejected 401 (possible JWT tampering)" "$REJECTED_JWT"

echo
echo ">>> STEP 3: correlation test (informational)."
run_correlation_test "110703" "Repeated rejected JWT from same source IP" "$(build_repeated_rejected_jwt)"

echo
echo "==================== SUMMARY ===================="
echo "Single-event PASS: $PASS"
echo "Single-event FAIL: $FAIL"
echo "Correlation PASS: $CORR_PASS"
echo "Correlation not matched: $CORR_FAIL"
echo "Full raw output saved to: $RESULT_LOG"

if [[ "$FAIL" -eq 0 ]]; then
    echo -e "\033[32mAll single-event JSON tests passed.\033[0m"
    exit 0
else
    echo -e "\033[31mSome single-event tests failed. Check $RESULT_LOG.\033[0m"
    exit 1
fi