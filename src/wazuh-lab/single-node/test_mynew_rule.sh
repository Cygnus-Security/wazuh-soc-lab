#!/usr/bin/env bash
set -euo pipefail

MANAGER="single-node-wazuh.manager-1"
RESULT_LOG="bglobal_wazuh_rule_test_results.log"

PASS=0
FAIL=0

: > "$RESULT_LOG"

extract_phase3_value() {
    local key="$1"
    awk -v key="$key" '
        /^\*\*Phase 3: Completed filtering \(rules\)\./ {
            in_phase3 = 1
            next
        }
        in_phase3 && $0 ~ "^[[:space:]]*" key ": " {
            line = $0
            sub("^[[:space:]]*" key ": '\''", "", line)
            sub("'\''.*$", "", line)
            value = line
            in_phase3 = 0
        }
        END {
            print value
        }
    '
}

run_test() {
    local expected_rule="$1"
    local name="$2"
    local log_line="$3"

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
        echo "Phase 2/3 summary:"
        printf '%s\n' "$output" | grep -E "Phase 2|Phase 3|name: '|id: '|protocol: '|srcip: '|url: '|description:|Alert to be generated" || true
        FAIL=$((FAIL + 1))
    fi
}

run_test "110100" "BOLA numeric object access 2xx" \
'10.10.1.10 - - [15/May/2026:07:00:00 +0000] "GET /api/user/123 HTTP/1.1" 200 123 "-" "curl/8.0"'

run_test "110104" "BOLA numeric object access 4xx" \
'10.10.1.11 - - [15/May/2026:07:00:01 +0000] "GET /api/user/123 HTTP/1.1" 404 123 "-" "curl/8.0"'

run_test "110105" "BOLA numeric object access 5xx" \
'10.10.1.12 - - [15/May/2026:07:00:02 +0000] "GET /api/user/123 HTTP/1.1" 500 123 "-" "curl/8.0"'

run_test "110120" "UUID vehicle location access 2xx" \
'10.10.1.20 - - [15/May/2026:07:01:00 +0000] "GET /identity/api/v2/vehicle/550e8400-e29b-41d4-a716-446655440000/location HTTP/1.1" 200 123 "-" "curl/8.0"'

run_test "110121" "Failed UUID vehicle location access" \
'10.10.1.21 - - [15/May/2026:07:01:01 +0000] "GET /identity/api/v2/vehicle/550e8400-e29b-41d4-a716-446655440000/location HTTP/1.1" 403 123 "-" "curl/8.0"'

run_test "110102" "Sensitive path probing 2xx" \
'10.10.1.30 - - [15/May/2026:07:02:00 +0000] "GET /.env HTTP/1.1" 200 123 "-" "curl/8.0"'

run_test "110106" "Sensitive path probing 4xx" \
'10.10.1.31 - - [15/May/2026:07:02:01 +0000] "GET /.git/config HTTP/1.1" 404 123 "-" "curl/8.0"'

run_test "110107" "Sensitive path probing 5xx" \
'10.10.1.32 - - [15/May/2026:07:02:02 +0000] "GET /swagger HTTP/1.1" 500 123 "-" "curl/8.0"'

run_test "110200" "Authentication failure" \
'10.10.1.40 - - [15/May/2026:07:03:00 +0000] "POST /identity/api/auth/login HTTP/1.1" 401 123 "-" "PostmanRuntime/7.39.0"'

run_test "110202" "Authentication attempt 2xx" \
'10.10.1.41 - - [15/May/2026:07:03:01 +0000] "POST /identity/api/auth/login HTTP/1.1" 200 123 "-" "PostmanRuntime/7.39.0"'

run_test "110204" "Authentication endpoint scanning" \
'10.10.1.42 - - [15/May/2026:07:03:02 +0000] "POST /identity/api/auth/admin HTTP/1.1" 404 123 "-" "PostmanRuntime/7.39.0"'

run_test "110300" "SSRF 2xx" \
'10.10.1.50 - - [15/May/2026:07:04:00 +0000] "GET /workshop/api/merchant/contact_mechanic?url=http://169.254.169.254/latest/meta-data HTTP/1.1" 200 123 "-" "curl/8.0"'

run_test "110301" "SSRF 4xx" \
'10.10.1.51 - - [15/May/2026:07:04:01 +0000] "GET /workshop/api/merchant/contact_mechanic?url=http://127.0.0.1:8080/admin HTTP/1.1" 403 123 "-" "curl/8.0"'

run_test "110310" "SQLi or NoSQLi 2xx" \
'10.10.1.60 - - [15/May/2026:07:05:00 +0000] "GET /identity/api/v2/user/profile?id=1%27%20or%201=1-- HTTP/1.1" 200 123 "-" "sqlmap/1.8"'

run_test "110311" "SQLi or NoSQLi 4xx" \
'10.10.1.61 - - [15/May/2026:07:05:01 +0000] "GET /identity/api/v2/user/profile?id=1%27%20or%201=1-- HTTP/1.1" 404 123 "-" "curl/8.0"'

run_test "110600" "Scanner User-Agent observed" \
'10.10.1.62 - - [15/May/2026:07:05:02 +0000] "GET /identity/api/v2/user/profile HTTP/1.1" 404 123 "-" "sqlmap/1.8"'

run_test "110400" "BFLA admin access 2xx" \
'10.10.1.70 - - [15/May/2026:07:06:00 +0000] "GET /identity/api/v2/admin/users HTTP/1.1" 200 123 "-" "curl/8.0"'

run_test "110401" "BFLA admin probing 4xx" \
'10.10.1.71 - - [15/May/2026:07:06:01 +0000] "GET /identity/api/v2/admin/users HTTP/1.1" 403 123 "-" "curl/8.0"'

run_test "110500" "JWT alg none 2xx" \
'10.10.1.80 - - [15/May/2026:07:07:00 +0000] "GET /identity/api/v2/user/dashboard?token=eyJhbGciOiJub25l HTTP/1.1" 200 123 "-" "curl/8.0"'

run_test "110501" "JWT alg none 4xx" \
'10.10.1.81 - - [15/May/2026:07:07:01 +0000] "GET /identity/api/v2/user/dashboard?token=eyJhbGciOiJub25l HTTP/1.1" 403 123 "-" "curl/8.0"'

run_test "110510" "Mass assignment 2xx" \
'10.10.1.90 - - [15/May/2026:07:08:00 +0000] "POST /identity/api/v2/user/profile?role=admin&isAdmin=true HTTP/1.1" 200 123 "-" "PostmanRuntime/7.39.0"'

run_test "110511" "Mass assignment 4xx" \
'10.10.1.91 - - [15/May/2026:07:08:01 +0000] "POST /identity/api/v2/user/profile?role=admin&isAdmin=true HTTP/1.1" 403 123 "-" "PostmanRuntime/7.39.0"'

run_test "110130" "REST method abuse DELETE 2xx" \
'10.10.1.92 - - [15/May/2026:07:09:00 +0000] "DELETE /identity/api/v2/user/123 HTTP/1.1" 200 123 "-" "curl/8.0"'

run_test "110131" "REST method abuse DELETE 4xx" \
'10.10.1.93 - - [15/May/2026:07:09:01 +0000] "DELETE /identity/api/v2/user/123 HTTP/1.1" 403 123 "-" "curl/8.0"'

echo
echo "==================== SUMMARY ===================="
echo "PASS: $PASS"
echo "FAIL: $FAIL"
echo "Full raw output saved to $RESULT_LOG"

if [[ "$FAIL" -eq 0 ]]; then
    echo -e "\033[32mAll tests passed.\033[0m"
    exit 0
else
    echo -e "\033[31mSome tests failed. Check $RESULT_LOG for raw output.\033[0m"
    exit 1
fi
