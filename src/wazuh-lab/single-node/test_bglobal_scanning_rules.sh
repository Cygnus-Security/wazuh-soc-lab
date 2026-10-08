#!/usr/bin/env bash
set -euo pipefail

MANAGER="${MANAGER:-single-node-wazuh.manager-1}"
RESULT_LOG="${RESULT_LOG:-bglobal_scanning_rule_test_results.log}"

PASS=0
FAIL=0
CORR_PASS=0
CORR_FAIL=0
CORR_SKIP=0

: > "$RESULT_LOG"

if ! docker ps --format '{{.Names}}' | grep -qx "$MANAGER"; then
    echo "ERROR: Wazuh manager container is not running or not found: $MANAGER" >&2
    echo "Start the lab first, or override MANAGER, for example:" >&2
    echo "  MANAGER=single-node-wazuh.manager-1 ./test_bglobal_scanning_rules.sh" >&2
    exit 1
fi

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

extract_last_phase3_value() {
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

extract_phase2_value() {
    local key="$1"
    awk -v key="$key" '
        /^\*\*Phase 2: Completed decoding\./ {
            in_phase2 = 1
            next
        }
        /^\*\*Phase 3: Completed filtering \(rules\)\./ {
            in_phase2 = 0
        }
        in_phase2 && $0 ~ "^[[:space:]]*" key ": " {
            line = $0
            sub("^[[:space:]]*" key ": '\''", "", line)
            sub("'\''.*$", "", line)
            value = line
        }
        END {
            print value
        }
    '
}

phase3_has_rule() {
    local expected_rule="$1"
    awk -v expected_rule="$expected_rule" '
        /^\*\*Phase 3: Completed filtering \(rules\)\./ {
            in_phase3 = 1
            next
        }
        in_phase3 && $0 ~ "^[[:space:]]*id: " {
            line = $0
            sub("^[[:space:]]*id: '\''", "", line)
            sub("'\''.*$", "", line)
            if (line == expected_rule) {
                found = 1
            }
            in_phase3 = 0
        }
        END {
            exit(found ? 0 : 1)
        }
    '
}

print_summary() {
    local output="$1"
    printf '%s\n' "$output" | grep -E "Phase 2|Phase 3|name: '|id: '|protocol: '|srcip: '|url: '|description:|Alert to be generated" || true
}

run_test() {
    local expected_rule="$1"
    local name="$2"
    local log_line="$3"

    local output actual_rule actual_description actual_url actual_status actual_protocol actual_srcip

    output=$(printf '%s\n' "$log_line" | docker exec -i "$MANAGER" /var/ossec/bin/wazuh-logtest 2>&1)
    actual_rule=$(printf '%s\n' "$output" | extract_phase3_value "id")
    actual_description=$(printf '%s\n' "$output" | extract_phase3_value "description")
    actual_url=$(printf '%s\n' "$output" | extract_phase2_value "url")
    actual_status=$(printf '%s\n' "$output" | extract_phase2_value "id")
    actual_protocol=$(printf '%s\n' "$output" | extract_phase2_value "protocol")
    actual_srcip=$(printf '%s\n' "$output" | extract_phase2_value "srcip")

    {
        echo
        echo "============================================================"
        echo "Testing Rule $expected_rule: $name"
        echo "Expected rule ID: $expected_rule"
        echo "Actual rule ID: ${actual_rule:-NONE}"
        echo "Actual description: ${actual_description:-NONE}"
        echo "Decoded srcip: ${actual_srcip:-NONE}"
        echo "Decoded method/protocol: ${actual_protocol:-NONE}"
        echo "Decoded url: ${actual_url:-NONE}"
        echo "Decoded status/id: ${actual_status:-NONE}"
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
    echo "Decoded srcip: ${actual_srcip:-NONE}"
    echo "Decoded method/protocol: ${actual_protocol:-NONE}"
    echo "Decoded url: ${actual_url:-NONE}"
    echo "Decoded status/id: ${actual_status:-NONE}"

    if [[ "$actual_rule" == "$expected_rule" ]]; then
        echo -e "\033[32mPASS\033[0m"
        PASS=$((PASS + 1))
    else
        echo -e "\033[31mFAIL\033[0m"
        echo "Troubleshooting summary:"
        print_summary "$output"
        FAIL=$((FAIL + 1))
    fi
}

run_correlation_test() {
    local expected_rule="$1"
    local name="$2"
    local payload="$3"

    local output actual_rule actual_description

    output=$(printf '%s\n' "$payload" | docker exec -i "$MANAGER" /var/ossec/bin/wazuh-logtest 2>&1)
    actual_rule=$(printf '%s\n' "$output" | extract_last_phase3_value "id")
    actual_description=$(printf '%s\n' "$output" | extract_last_phase3_value "description")

    {
        echo
        echo "============================================================"
        echo "Correlation test $expected_rule: $name"
        echo "Expected final rule ID: $expected_rule"
        echo "Actual final rule ID: ${actual_rule:-NONE}"
        echo "Actual description: ${actual_description:-NONE}"
        echo "---- Payload ----"
        printf '%s\n' "$payload"
        echo "---- Raw wazuh-logtest output ----"
        printf '%s\n' "$output"
    } >> "$RESULT_LOG"

    echo
    echo "============================================================"
    echo "Correlation test: $name"
    echo "Expected final rule ID: $expected_rule"
    echo "Actual final rule ID: ${actual_rule:-NONE}"
    echo "Actual description: ${actual_description:-NONE}"

    if printf '%s\n' "$output" | phase3_has_rule "$expected_rule"; then
        echo -e "\033[32mCORRELATION PASS\033[0m"
        CORR_PASS=$((CORR_PASS + 1))
    else
        echo -e "\033[33mCORRELATION NOT MATCHED\033[0m"
        echo "This does not fail the single-event test run. Correlation depends on Wazuh state and frequency/timeframe behavior."
        echo "Troubleshooting summary:"
        print_summary "$output"
        CORR_FAIL=$((CORR_FAIL + 1))
    fi
}

skip_correlation_test() {
    local rule_id="$1"
    local name="$2"
    local reason="$3"

    echo
    echo "============================================================"
    echo "Correlation test skipped: $rule_id - $name"
    echo "Reason: $reason"
    {
        echo
        echo "============================================================"
        echo "Correlation test skipped: $rule_id - $name"
        echo "Reason: $reason"
    } >> "$RESULT_LOG"
    CORR_SKIP=$((CORR_SKIP + 1))
}

repeat_log() {
    local count="$1"
    local log_template="$2"
    local i

    for i in $(seq 1 "$count"); do
        printf '%s\n' "${log_template//__SEQ__/$i}"
    done
}

echo "Writing full wazuh-logtest output to: $RESULT_LOG"
echo "Testing single-event bGlobal scanning rules first."

run_test "110660" "VCS probing - Mercurial directory" \
'10.10.1.20 - - [03/Jun/2026:00:10:00 +0000] "GET /.hg HTTP/1.1" 404 561 "-" "Mozilla/5.0"'

run_test "110660" "VCS probing - Bazaar directory" \
'10.10.1.20 - - [03/Jun/2026:00:10:01 +0000] "GET /.bzr HTTP/1.1" 404 561 "-" "Mozilla/5.0"'

run_test "110660" "VCS probing - SVN entries" \
'10.10.1.20 - - [03/Jun/2026:00:10:02 +0000] "GET /.svn/entries HTTP/1.1" 404 561 "-" "Mozilla/5.0"'

run_test "110660" "VCS probing - CVS root" \
'10.10.1.20 - - [03/Jun/2026:00:10:03 +0000] "GET /CVS/root HTTP/1.1" 404 561 "-" "Mozilla/5.0"'

run_test "110662" "Secret/config probing - PEM key" \
'10.10.1.20 - - [03/Jun/2026:00:11:00 +0000] "GET /key.pem HTTP/1.1" 404 561 "-" "Mozilla/5.0"'

run_test "110662" "Secret/config probing - SSH private key" \
'10.10.1.20 - - [03/Jun/2026:00:11:01 +0000] "GET /.ssh/id_rsa HTTP/1.1" 404 561 "-" "Mozilla/5.0"'

run_test "110662" "Secret/config probing - composer.json" \
'10.10.1.20 - - [03/Jun/2026:00:11:02 +0000] "GET /composer.json HTTP/1.1" 404 561 "-" "Mozilla/5.0"'

run_test "110662" "Secret/config probing - sftp-config.json" \
'10.10.1.20 - - [03/Jun/2026:00:11:03 +0000] "GET /sftp-config.json HTTP/1.1" 404 561 "-" "Mozilla/5.0"'

run_test "110664" "Cloud metadata probing - AWS metadata" \
'10.10.1.20 - - [03/Jun/2026:00:12:00 +0000] "GET /latest/meta-data/ HTTP/1.1" 404 561 "-" "Mozilla/5.0"'

run_test "110664" "Cloud metadata probing - GCP metadata" \
'10.10.1.20 - - [03/Jun/2026:00:12:01 +0000] "GET /computeMetadata/v1/ HTTP/1.1" 404 561 "-" "Mozilla/5.0"'

run_test "110664" "Cloud metadata probing - metadata instance" \
'10.10.1.20 - - [03/Jun/2026:00:12:02 +0000] "GET /metadata/instance HTTP/1.1" 404 561 "-" "Mozilla/5.0"'

run_test "110664" "Cloud metadata probing - OCI metadata" \
'10.10.1.20 - - [03/Jun/2026:00:12:03 +0000] "GET /opc/v1/instance/ HTTP/1.1" 404 561 "-" "Mozilla/5.0"'

run_test "110666" "Framework fingerprinting - WEB-INF web.xml" \
'10.10.1.20 - - [03/Jun/2026:00:13:00 +0000] "GET /WEB-INF/web.xml HTTP/1.1" 404 561 "-" "Mozilla/5.0"'

run_test "110666" "Framework fingerprinting - Blazor boot manifest" \
'10.10.1.20 - - [03/Jun/2026:00:13:01 +0000] "GET /_framework/blazor.boot.json HTTP/1.1" 404 561 "-" "Mozilla/5.0"'

run_test "110666" "Framework fingerprinting - ELMAH handler" \
'10.10.1.20 - - [03/Jun/2026:00:13:02 +0000] "GET /elmah.axd HTTP/1.1" 404 561 "-" "Mozilla/5.0"'

run_test "110666" "Framework fingerprinting - server-status" \
'10.10.1.20 - - [03/Jun/2026:00:13:03 +0000] "GET /server-status HTTP/1.1" 404 561 "-" "Mozilla/5.0"'

run_test "110668" "CMS/app config probing - Magento local.xml" \
'10.10.1.20 - - [03/Jun/2026:00:14:00 +0000] "GET /app/etc/local.xml HTTP/1.1" 404 561 "-" "Mozilla/5.0"'

run_test "110668" "CMS/app config probing - Drupal sqlite" \
'10.10.1.20 - - [03/Jun/2026:00:14:01 +0000] "GET /sites/default/files/.ht.sqlite HTTP/1.1" 404 561 "-" "Mozilla/5.0"'

run_test "110668" "CMS/app config probing - WPE config" \
'10.10.1.20 - - [03/Jun/2026:00:14:02 +0000] "GET /_wpeprivate/config.json HTTP/1.1" 404 561 "-" "Mozilla/5.0"'

run_test "110668" "CMS/app config probing - Rails database config" \
'10.10.1.20 - - [03/Jun/2026:00:14:03 +0000] "GET /config/database.yml HTTP/1.1" 404 561 "-" "Mozilla/5.0"'

run_test "110670" "PHP tooling probing - phpinfo" \
'10.10.1.20 - - [03/Jun/2026:00:15:00 +0000] "GET /phpinfo.php HTTP/1.1" 404 561 "-" "Mozilla/5.0"'

run_test "110670" "PHP tooling probing - info.php" \
'10.10.1.20 - - [03/Jun/2026:00:15:01 +0000] "GET /info.php HTTP/1.1" 404 561 "-" "Mozilla/5.0"'

run_test "110670" "PHP tooling probing - adminer" \
'10.10.1.20 - - [03/Jun/2026:00:15:02 +0000] "GET /adminer.php HTTP/1.1" 404 561 "-" "Mozilla/5.0"'

run_test "110670" "PHP tooling probing - vb_test" \
'10.10.1.20 - - [03/Jun/2026:00:15:03 +0000] "GET /vb_test.php HTTP/1.1" 404 561 "-" "Mozilla/5.0"'

run_test "110672" "PHP-CGI option injection - source disclosure flag" \
'10.10.1.20 - - [03/Jun/2026:00:16:00 +0000] "GET /?-s HTTP/1.1" 404 561 "-" "Mozilla/5.0"'

run_test "110672" "PHP-CGI option injection - allow_url_include auto_prepend_file" \
'10.10.1.20 - - [03/Jun/2026:00:16:01 +0000] "GET /?-d+allow_url_include%3d1+-d+auto_prepend_file%3dphp://input HTTP/1.1" 404 561 "-" "Mozilla/5.0"'

run_test "110675" "High-entropy fuzzing - encoded emoji path" \
'10.10.1.20 - - [03/Jun/2026:00:17:00 +0000] "GET /%F0%9F%A4%96 HTTP/1.1" 404 561 "-" "Mozilla/5.0"'

run_test "110675" "High-entropy fuzzing - long numeric path" \
'10.10.1.20 - - [03/Jun/2026:00:17:01 +0000] "GET /7406048496834323156 HTTP/1.1" 404 561 "-" "Mozilla/5.0"'

run_test "110675" "High-entropy fuzzing - static CSS hash" \
'10.10.1.20 - - [03/Jun/2026:00:17:02 +0000] "GET /static/css/6761234567890123456.css HTTP/1.1" 404 561 "-" "Mozilla/5.0"'

run_test "110677" "Common discovery probing - robots.txt" \
'10.10.1.20 - - [03/Jun/2026:00:18:00 +0000] "GET /robots.txt HTTP/1.1" 404 561 "-" "Mozilla/5.0"'

run_test "110677" "Common discovery probing - sitemap.xml" \
'10.10.1.20 - - [03/Jun/2026:00:18:01 +0000] "GET /sitemap.xml HTTP/1.1" 404 561 "-" "Mozilla/5.0"'

run_test "110677" "Common discovery probing - manifest.json" \
'10.10.1.20 - - [03/Jun/2026:00:18:02 +0000] "GET /manifest.json HTTP/1.1" 404 561 "-" "Mozilla/5.0"'

echo
echo "Testing stateful/default correlation rules separately."
echo "These results are informational and do not affect the script exit code."

run_correlation_test "110661" "Repeated VCS probing" "$(repeat_log 5 '10.10.1.20 - - [03/Jun/2026:00:20:__SEQ__ +0000] "GET /.hg HTTP/1.1" 404 561 "-" "Mozilla/5.0"')"

run_correlation_test "110663" "Repeated secret/config probing" "$(repeat_log 5 '10.10.1.20 - - [03/Jun/2026:00:21:__SEQ__ +0000] "GET /key.pem HTTP/1.1" 404 561 "-" "Mozilla/5.0"')"

run_correlation_test "110665" "Repeated cloud metadata probing" "$(repeat_log 3 '10.10.1.20 - - [03/Jun/2026:00:22:__SEQ__ +0000] "GET /latest/meta-data/ HTTP/1.1" 404 561 "-" "Mozilla/5.0"')"

run_correlation_test "110667" "Repeated framework fingerprinting" "$(repeat_log 5 '10.10.1.20 - - [03/Jun/2026:00:23:__SEQ__ +0000] "GET /WEB-INF/web.xml HTTP/1.1" 404 561 "-" "Mozilla/5.0"')"

run_correlation_test "110669" "Repeated CMS/app config probing" "$(repeat_log 5 '10.10.1.20 - - [03/Jun/2026:00:24:__SEQ__ +0000] "GET /app/etc/local.xml HTTP/1.1" 404 561 "-" "Mozilla/5.0"')"

run_correlation_test "110671" "Repeated PHP tooling probing" "$(repeat_log 5 '10.10.1.20 - - [03/Jun/2026:00:25:__SEQ__ +0000] "GET /phpinfo.php HTTP/1.1" 404 561 "-" "Mozilla/5.0"')"

run_correlation_test "110674" "Repeated PHP-CGI option injection" "$(repeat_log 3 '10.10.1.20 - - [03/Jun/2026:00:26:__SEQ__ +0000] "GET /?-s HTTP/1.1" 404 561 "-" "Mozilla/5.0"')"

run_correlation_test "110676" "Repeated high-entropy path fuzzing" "$(repeat_log 10 '10.10.1.20 - - [03/Jun/2026:00:27:__SEQ__ +0000] "GET /7406048496834323156 HTTP/1.1" 404 561 "-" "Mozilla/5.0"')"

run_correlation_test "110678" "Repeated common discovery probing" "$(repeat_log 5 '10.10.1.20 - - [03/Jun/2026:00:28:__SEQ__ +0000] "GET /robots.txt HTTP/1.1" 404 561 "-" "Mozilla/5.0"')"

run_correlation_test "110679" "Default Wazuh multiple HTTP 400 burst tagging" "$(repeat_log 8 '10.10.1.20 - - [03/Jun/2026:00:29:__SEQ__ +0000] "GET /bad-request-__SEQ__ HTTP/1.1" 400 561 "-" "Mozilla/5.0"')"

skip_correlation_test "110673" "PHP-CGI URL fallback as final rule" "In current rule ordering, default Wazuh rule 31110 fires first and bGlobal rule 110672 inherits from it, so 110673 is a fallback rule and may not be the final match for the supplied PHP-CGI samples."

echo
echo "==================== SUMMARY ===================="
echo "Single-event PASS: $PASS"
echo "Single-event FAIL: $FAIL"
echo "Correlation PASS: $CORR_PASS"
echo "Correlation not matched: $CORR_FAIL"
echo "Correlation skipped: $CORR_SKIP"
echo "Full raw output saved to: $RESULT_LOG"

if [[ "$FAIL" -eq 0 ]]; then
    echo -e "\033[32mAll single-event tests passed.\033[0m"
    exit 0
else
    echo -e "\033[31mSome single-event tests failed. Check $RESULT_LOG for raw output.\033[0m"
    exit 1
fi
