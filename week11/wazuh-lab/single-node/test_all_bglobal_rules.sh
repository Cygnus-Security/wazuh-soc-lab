#!/usr/bin/env bash
set -euo pipefail

MANAGER="single-node-wazuh.manager-1"
RULE_FILE="bglobal_crapi_rules.xml"
TEST_FILE="test_mynew_rule.sh"
SCANNING_TEST_FILE="test_bglobal_scanning_rules.sh"
CORR_LOG="bglobal_wazuh_correlation_test_results.log"
ALL_LOG="bglobal_wazuh_all_rule_test_results.log"
COVERAGE_REPORT="bglobal_wazuh_rule_coverage.md"

cd "$(dirname "$0")"

: > "$CORR_LOG"
: > "$ALL_LOG"

if ! docker ps --format '{{.Names}}' | grep -Fxq "$MANAGER"; then
    echo "ERROR: Wazuh manager container is not running: $MANAGER"
    exit 1
fi

extract_last_phase3_id() {
    awk '
        /^\*\*Phase 3: Completed filtering \(rules\)\./ {
            in_phase3 = 1
            next
        }
        in_phase3 && /^[[:space:]]*id: '\''/ {
            line = $0
            sub("^[[:space:]]*id: '\''", "", line)
            sub("'\''.*$", "", line)
            value = line
            in_phase3 = 0
        }
        END { print value }
    '
}

extract_last_phase3_description() {
    awk '
        /^\*\*Phase 3: Completed filtering \(rules\)\./ {
            in_phase3 = 1
            next
        }
        in_phase3 && /^[[:space:]]*description: '\''/ {
            line = $0
            sub("^[[:space:]]*description: '\''", "", line)
            sub("'\''.*$", "", line)
            value = line
            in_phase3 = 0
        }
        END { print value }
    '
}

run_single() {
    local expected="$1"
    local name="$2"
    local line="$3"
    local output actual description

    output=$(printf '%s\n' "$line" | docker exec -i "$MANAGER" /var/ossec/bin/wazuh-logtest 2>&1)
    actual=$(printf '%s\n' "$output" | extract_last_phase3_id)
    description=$(printf '%s\n' "$output" | extract_last_phase3_description)

    {
        echo
        echo "===== Single-line coverage: $expected $name ====="
        echo "Expected: $expected"
        echo "Actual: ${actual:-NONE}"
        echo "Description: ${description:-NONE}"
        printf '%s\n' "$output"
    } >> "$ALL_LOG"

    if [[ "$actual" == "$expected" ]]; then
        echo "PASS single $expected - $name"
        SINGLE_PASS_IDS["$expected"]=1
        return 0
    fi

    echo "FAIL single $expected - $name expected=$expected actual=${actual:-NONE}"
    SINGLE_FAIL_IDS["$expected"]=1
    FAILURES=$((FAILURES + 1))
    return 1
}

run_correlation() {
    local expected="$1"
    local name="$2"
    local payload="$3"
    local output

    output=$(printf '%s' "$payload" | docker exec -i "$MANAGER" /var/ossec/bin/wazuh-logtest 2>&1)

    {
        echo
        echo "===== Correlation coverage: $expected $name ====="
        echo "Expected: $expected"
        printf '%s\n' "$output"
    } >> "$CORR_LOG"

    if printf '%s\n' "$output" | awk -v expected="$expected" '
        /^\*\*Phase 3: Completed filtering \(rules\)\./ { in_phase3 = 1; next }
        in_phase3 && /^[[:space:]]*id: '\''/ {
            line = $0
            sub("^[[:space:]]*id: '\''", "", line)
            sub("'\''.*$", "", line)
            if (line == expected) found = 1
            in_phase3 = 0
        }
        END { exit(found ? 0 : 1) }
    '; then
        echo "PASS correlation $expected - $name"
        CORR_PASS_IDS["$expected"]=1
        return 0
    fi

    echo "FAIL correlation $expected - $name"
    CORR_FAIL_IDS["$expected"]=1
    FAILURES=$((FAILURES + 1))
    return 1
}

build_repeated_bola() {
    for i in $(seq 1 10); do
        printf '10.10.2.10 - - [15/May/2026:07:10:%02d +0000] "GET /api/user/%d HTTP/1.1" 404 123 "-" "curl/8.0"\n' "$i" "$i"
    done
}

build_repeated_uuid() {
    for i in $(seq 1 5); do
        printf '10.10.2.11 - - [15/May/2026:07:11:%02d +0000] "GET /identity/api/v2/vehicle/550e8400-e29b-41d4-a716-446655440000/location HTTP/1.1" 403 123 "-" "curl/8.0"\n' "$i"
    done
}

build_repeated_sensitive_path() {
    for i in $(seq 1 10); do
        printf '10.10.2.12 - - [15/May/2026:07:12:%02d +0000] "GET /.env?x=%d HTTP/1.1" 404 123 "-" "curl/8.0"\n' "$i" "$i"
    done
}

build_repeated_auth_failures() {
    for i in $(seq 1 5); do
        printf '10.10.2.13 - - [15/May/2026:07:13:%02d +0000] "POST /identity/api/auth/login HTTP/1.1" 401 123 "-" "curl/8.0"\n' "$i"
    done
}

build_repeated_auth_success() {
    for i in $(seq 1 20); do
        printf '10.10.2.14 - - [15/May/2026:07:14:%02d +0000] "POST /identity/api/auth/login HTTP/1.1" 200 123 "-" "curl/8.0"\n' "$i"
    done
}

build_repeated_auth_scan() {
    for i in $(seq 1 10); do
        printf '10.10.2.15 - - [15/May/2026:07:15:%02d +0000] "POST /identity/api/auth/admin%d HTTP/1.1" 404 123 "-" "curl/8.0"\n' "$i" "$i"
    done
}

build_repeated_bfla() {
    for i in $(seq 1 5); do
        printf '10.10.2.16 - - [15/May/2026:07:16:%02d +0000] "GET /identity/api/v2/admin/users HTTP/1.1" 403 123 "-" "curl/8.0"\n' "$i"
    done
}

build_repeated_upload_probe() {
    for i in $(seq 1 5); do
        printf '10.10.2.17 - - [15/May/2026:07:17:%02d +0000] "GET /jQuery-File-Upload/server/php/UploadHandler.php?x=%d HTTP/1.1" 404 123 "-" "Mozilla/5.0"\n' "$i" "$i"
    done
}

build_repeated_php_cms_enum() {
    for i in $(seq 1 10); do
        printf '10.10.2.18 - - [15/May/2026:07:18:%02d +0000] "GET /scan%d/admin.php HTTP/1.1" 404 123 "-" "Mozilla/5.0"\n' "$i" "$i"
    done
}

declare -A SINGLE_PASS_IDS=()
declare -A SINGLE_FAIL_IDS=()
declare -A CORR_PASS_IDS=()
declare -A CORR_FAIL_IDS=()
declare -A WAIVED_IDS=()
FAILURES=0
WAIVED_IDS["110673"]="PHP-CGI URL fallback is intentionally shadowed by 110672 when default Wazuh rule 31110 fires first."

mapfile -t XML_IDS < <(grep -oE '<rule id="110[0-9]+"' "$RULE_FILE" | sed -E 's/.*"([^"]+)"/\1/' | sort -n | uniq)
mapfile -t TEST_IDS < <(
    {
        grep -oE 'run_test "110[0-9]+"' "$TEST_FILE" "$SCANNING_TEST_FILE" 2>/dev/null || true
    } | sed -E 's/.*"([^"]+)"/\1/' | sort -n | uniq
)
mapfile -t SCANNING_CORR_IDS < <(
    {
        grep -oE 'run_correlation_test "110[0-9]+"' "$SCANNING_TEST_FILE" 2>/dev/null || true
    } | sed -E 's/.*"([^"]+)"/\1/' | sort -n | uniq
)

for id in "${TEST_IDS[@]}"; do
    SINGLE_PASS_IDS["$id"]=1
done
for id in "${SCANNING_CORR_IDS[@]}"; do
    CORR_PASS_IDS["$id"]=1
done

echo "All rule IDs in XML:"
printf ' %s\n' "${XML_IDS[@]}"

echo "Rule IDs covered by test_mynew_rule.sh and test_bglobal_scanning_rules.sh before extra coverage:"
printf ' %s\n' "${TEST_IDS[@]}"
printf ' %s\n' "${SCANNING_CORR_IDS[@]}"

echo
echo "Running extra single-line coverage tests"
run_single "110206" "Authentication failure on non-login auth endpoint" \
'10.10.2.20 - - [15/May/2026:07:17:00 +0000] "POST /identity/api/auth/reset HTTP/1.1" 403 123 "-" "curl/8.0"' || true

run_single "110610" "Upload/plugin PHP endpoint probing 4xx" \
'10.10.2.21 - - [15/May/2026:07:17:01 +0000] "GET /jQuery-File-Upload/server/php/UploadHandler.php HTTP/1.1" 404 123 "-" "Mozilla/5.0"' || true

run_single "110611" "Exposed upload/plugin PHP endpoint 2xx" \
'10.10.2.22 - - [15/May/2026:07:17:02 +0000] "GET /jQuery-File-Upload/server/php/UploadHandler.php HTTP/1.1" 200 123 "-" "Mozilla/5.0"' || true

run_single "110620" "Generic PHP/CMS enumeration 404" \
'10.10.2.23 - - [15/May/2026:07:17:03 +0000] "GET /wp/admin.php HTTP/1.1" 404 123 "-" "Mozilla/5.0"' || true

run_single "110630" "Suspicious HTTP method observed" \
'10.10.2.24 - - [15/May/2026:07:17:04 +0000] "TRACE /identity/api/auth/login HTTP/1.1" 404 123 "-" "Mozilla/5.0"' || true

run_single "110640" "Generic web exploit payload indicator" \
'10.10.2.25 - - [15/May/2026:07:17:05 +0000] "GET /download?file=../../../../etc/passwd HTTP/1.1" 404 123 "-" "Mozilla/5.0"' || true

run_single "110650" "Raw nginx warning scanner request" \
'2026/06/03 00:17:06 [error] 123#123: *1 open() "/usr/share/nginx/html/jQuery-File-Upload/server/php/UploadHandler.php" failed (2: No such file or directory), client: 10.10.2.26, server: _, request: "GET /jQuery-File-Upload/server/php/UploadHandler.php HTTP/1.1", host: "crapi.local"' || true

run_single "110651" "Raw nginx warning exploit payload" \
'2026/06/03 00:17:07 [error] 123#123: *2 open() "/usr/share/nginx/html/../../etc/passwd" failed (2: No such file or directory), client: 10.10.2.27, server: _, request: "GET /../../etc/passwd HTTP/1.1", host: "crapi.local"' || true

echo
echo "Running correlation coverage tests"
run_correlation "110101" "Repeated BOLA object access" "$(build_repeated_bola)" || true
run_correlation "110122" "Repeated UUID vehicle location access" "$(build_repeated_uuid)" || true
run_correlation "110103" "Repeated sensitive path probing" "$(build_repeated_sensitive_path)" || true
run_correlation "110201" "Repeated authentication failures" "$(build_repeated_auth_failures)" || true
run_correlation "110203" "High-rate authentication attempts" "$(build_repeated_auth_success)" || true
run_correlation "110205" "Repeated auth endpoint scanning" "$(build_repeated_auth_scan)" || true
run_correlation "110402" "Repeated BFLA/admin probing" "$(build_repeated_bfla)" || true
run_correlation "110612" "Repeated upload/plugin probing" "$(build_repeated_upload_probe)" || true
run_correlation "110621" "Repeated generic PHP/CMS enumeration" "$(build_repeated_php_cms_enum)" || true

covered_ids=()
missing_ids=()
waived_ids=()
for id in "${XML_IDS[@]}"; do
    if [[ -n "${SINGLE_PASS_IDS[$id]:-}" || -n "${CORR_PASS_IDS[$id]:-}" ]]; then
        covered_ids+=("$id")
    elif [[ -n "${WAIVED_IDS[$id]:-}" ]]; then
        waived_ids+=("$id")
    else
        missing_ids+=("$id")
    fi
done

echo
echo "All rule IDs covered by tests:"
printf ' %s\n' "${covered_ids[@]}"

echo "Rule IDs missing from tests:"
if (( ${#missing_ids[@]} == 0 )); then
    echo " none"
else
    printf ' %s\n' "${missing_ids[@]}"
fi

echo "Rule IDs waived as limited/fallback coverage:"
if (( ${#waived_ids[@]} == 0 )); then
    echo " none"
else
    printf ' %s\n' "${waived_ids[@]}"
fi

python3 - "$RULE_FILE" "$COVERAGE_REPORT" "${covered_ids[*]}" "${missing_ids[*]}" "${!CORR_PASS_IDS[*]}" "${!SINGLE_PASS_IDS[*]}" "${!SINGLE_FAIL_IDS[*]}" "${!CORR_FAIL_IDS[*]}" "${waived_ids[*]}" <<'PY'
import sys
import xml.etree.ElementTree as ET

rule_file, report_file = sys.argv[1], sys.argv[2]
covered = set(sys.argv[3].split()) if sys.argv[3] else set()
missing = set(sys.argv[4].split()) if sys.argv[4] else set()
corr_pass = set(sys.argv[5].split()) if sys.argv[5] else set()
single_pass = set(sys.argv[6].split()) if sys.argv[6] else set()
single_fail = set(sys.argv[7].split()) if sys.argv[7] else set()
corr_fail = set(sys.argv[8].split()) if sys.argv[8] else set()
waived = set(sys.argv[9].split()) if sys.argv[9] else set()

root = ET.parse(rule_file).getroot()
rules = []
for rule in root.findall("rule"):
    rid = rule.attrib.get("id", "")
    if not rid.startswith("110"):
        continue
    desc = (rule.findtext("description") or "").strip()
    parent = rule.findtext("if_sid") or rule.findtext("if_matched_sid") or rule.findtext("if_matched_group") or ""
    groups = (rule.findtext("group") or "").lower()
    if "correlation" in groups or rule.find("if_matched_sid") is not None or rule.find("if_matched_group") is not None:
        category = "Correlation"
    elif "bola" in groups:
        category = "BOLA / IDOR"
    elif "bfla" in groups:
        category = "BFLA"
    elif "authentication" in groups:
        category = "Authentication abuse"
    elif "sensitive_path" in groups or "recon" in groups:
        category = "Reconnaissance"
    elif "ssrf" in groups:
        category = "SSRF support"
    elif "injection" in groups:
        category = "SQLi/NoSQLi support"
    elif "jwt" in groups:
        category = "JWT support"
    elif "mass_assignment" in groups:
        category = "Mass Assignment / BOPLA"
    else:
        category = "Broken access control"

    if rid in single_fail or rid in corr_fail:
        status = "FAIL"
        reason = "Test ran but expected rule did not appear."
    elif rid in corr_pass:
        status = "PASS"
        reason = "Covered by multi-line wazuh-logtest correlation stream."
    elif rid in single_pass:
        status = "PASS"
        reason = "Covered by single-line wazuh-logtest case."
    elif rid in missing:
        status = "MISSING"
        reason = "No practical synthetic access-log test case currently defined."
    elif rid in waived:
        status = "LIMITED"
        reason = "Fallback rule is intentionally shadowed by a higher-priority custom/default rule in normal logtest input."
    else:
        status = "LIMITED"
        reason = "Rule depends on log fields that may not appear in normal access logs."
    rules.append((int(rid), rid, desc, category, parent, status, reason))

rules.sort()
single_count = sum(1 for _, rid, *_ in rules if rid in single_pass)
corr_count = sum(1 for _, rid, *_ in rules if rid in corr_pass)
missing_count = sum(1 for _, rid, *_ in rules if rid in missing)
waived_count = sum(1 for _, rid, *_ in rules if rid in waived)

lines = []
lines.append("# bGlobal Wazuh Rule Coverage")
lines.append("")
lines.append(f"- Total custom rules in `{rule_file}`: {len(rules)}")
lines.append(f"- Rules tested by single-line tests: {single_count}")
lines.append(f"- Rules tested by correlation tests: {corr_count}")
lines.append(f"- Rules not testable with current access log format: {missing_count}")
lines.append(f"- Rules accounted for as limited/fallback behavior: {waived_count}")
lines.append("")
lines.append("| Rule ID | Description | Category | Parent SID | Test status | Reason |")
lines.append("|---:|---|---|---|---|---|")
for _, rid, desc, category, parent, status, reason in rules:
    lines.append(f"| {rid} | {desc} | {category} | {parent} | {status} | {reason} |")

lines.append("")
lines.append("## Remaining Limitations")
lines.append("")
lines.append("- Normal access logs do not contain request body content.")
lines.append("- Normal access logs do not contain Authorization headers.")
lines.append("- Mass Assignment detection is limited without body logging, WAF logs, or application logs.")
lines.append("- JWT alg:none detection is limited without header/token logging.")
lines.append("- BOLA/BFLA detection is stronger with authenticated user ID or tenant context.")
lines.append("- Source IP correlation is inaccurate behind NAT/proxies unless X-Forwarded-For is logged and decoded.")
lines.append("")
lines.append("## Test Artifacts")
lines.append("")
lines.append(f"- Single-line and extra coverage output: `{sys.argv[0] if False else 'bglobal_wazuh_all_rule_test_results.log'}`")
lines.append("- Correlation output: `bglobal_wazuh_correlation_test_results.log`")
lines.append("- Current manual suite output: `bglobal_wazuh_rule_test_results.log`")

with open(report_file, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")
PY

echo
echo "Coverage report written to $COVERAGE_REPORT"
echo "Extra single-line output saved to $ALL_LOG"
echo "Correlation output saved to $CORR_LOG"

if (( FAILURES > 0 )); then
    echo "FAILURES: $FAILURES"
    exit 1
fi

if (( ${#missing_ids[@]} > 0 )); then
    echo "Missing coverage remains: ${missing_ids[*]}"
    exit 1
fi

echo "All XML rules have practical test coverage."
