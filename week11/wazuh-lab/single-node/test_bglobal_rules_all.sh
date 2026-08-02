#!/usr/bin/env bash
#
# test_all_bglobal_rules_full.sh
# ------------------------------------------------------------------
# Test EVERY rule in the bGlobal crAPI ruleset.
#
# How it works:
#   1. Reads the rules file and extracts ALL <rule id="..."> values.
#   2. For each id: if a test case exists -> feed it to wazuh-logtest
#      (in the manager container) and check the rule fires.
#   3. Rules without a case are reported as NOCASE so you can see
#      exactly what is NOT covered yet.
#
# Run on the Wazuh server host:
#     chmod +x test_all_bglobal_rules_full.sh
#     ./test_all_bglobal_rules_full.sh
#
# Optional overrides:
#     MANAGER=<container> RULES_FILE=<path> ./test_all_bglobal_rules_full.sh
#
# Reading results:
#   PASS   = rule fired on the sample line.
#   FAIL   = rule did NOT fire. Either the rule is wrong, OR (for the
#            apache/JSON cases) the SAMPLE line does not match the real
#            log format -> capture a real line and replace it.
#   NOCASE = no test line defined for this rule id yet.
#   Special note: 110672 (php-cgi via Wazuh 31110) and 110679 (multiple
#            400 via Wazuh 31151) are AGGREGATE rules hard to drive from
#            a single logtest line -> left as NOCASE on purpose.
#   If 110701/110702 FAIL -> confirms <status> must become
#            <field name="status"> in those rules.
# ------------------------------------------------------------------

set -uo pipefail

MANAGER="${MANAGER:-single-node-wazuh.manager-1}"
RULES_FILE="${RULES_FILE:-bglobal_crapi_rules.xml}"
LOGTEST="/var/ossec/bin/wazuh-logtest"

G=$'\e[32m'; R=$'\e[31m'; Y=$'\e[33m'; B=$'\e[1m'; N=$'\e[0m'
PASS=0; FAIL=0; NOCASE=0
declare -a FAIL_IDS=() NOCASE_IDS=()

# ---- helpers ----------------------------------------------------
# Build an apache combined-log line:  alog METHOD URL STATUS [UA]
alog() {
  local m="$1" u="$2" s="$3" ua="${4:-curl/8.0}"
  printf '10.10.1.50 - - [11/Jun/2026:09:00:00 +0000] "%s %s HTTP/1.1" %s 100 "-" "%s"' "$m" "$u" "$s" "$ua"
}

# CASES[id]="repeats|logline"
declare -A CASES

# ---- reused base lines ----
VEH200=$(alog GET /identity/api/v2/vehicle/123 200)
LOC=/identity/api/v2/vehicle/8f3b1c2d-1111-2222-3333-444455556666/location
ENV=/.env
ADMIN=/identity/api/admin/users

# ===== BOLA / IDOR object =====
CASES[110100]="1|$VEH200"
CASES[110104]="1|$(alog GET /identity/api/v2/vehicle/123 403)"
CASES[110105]="1|$(alog GET /identity/api/v2/vehicle/123 500)"
CASES[110101]="12|$VEH200"
# ===== BOLA UUID vehicle location =====
CASES[110120]="1|$(alog GET "$LOC" 200)"
CASES[110121]="1|$(alog GET "$LOC" 403)"
CASES[110122]="7|$(alog GET "$LOC" 403)"
# ===== REST method abuse =====
CASES[110130]="1|$(alog PUT /identity/api/v2/vehicle/123 200)"
CASES[110131]="1|$(alog DELETE /identity/api/v2/vehicle/123 403)"
# ===== BFLA admin =====
CASES[110400]="1|$(alog GET "$ADMIN" 200)"
CASES[110401]="1|$(alog GET "$ADMIN" 403)"
CASES[110402]="7|$(alog GET "$ADMIN" 403)"
# ===== Sensitive path probing =====
CASES[110102]="1|$(alog GET "$ENV" 200)"
CASES[110106]="1|$(alog GET "$ENV" 404)"
CASES[110107]="1|$(alog GET "$ENV" 500)"
CASES[110103]="12|$(alog GET "$ENV" 404)"
# ===== Auth brute force / scanning =====
LOGIN401=$(alog POST /identity/api/auth/login 401)
CASES[110200]="1|$LOGIN401"
CASES[110206]="1|$(alog POST /identity/api/auth/whoami 401)"
CASES[110201]="7|$LOGIN401"
CASES[110202]="1|$(alog POST /identity/api/auth/login 200)"
CASES[110203]="22|$(alog POST /identity/api/auth/login 200)"
AUTH404=$(alog GET /identity/api/auth/randompath 404)
CASES[110204]="1|$AUTH404"
CASES[110205]="12|$AUTH404"
# ===== SSRF (url-based) =====
CASES[110300]="1|$(alog GET '/workshop/api/merchant/contact_mechanic?mechanic_api=http://127.0.0.1/' 200)"
CASES[110301]="1|$(alog GET '/workshop/api/merchant/contact_mechanic?mechanic_api=http://169.254.169.254/' 400)"
# ===== SQLi/NoSQLi (url-based) =====
CASES[110310]="1|$(alog GET '/community/api/v2/coupon/x?q=union%20select%201' 200)"
CASES[110311]="1|$(alog GET '/community/api/v2/coupon/x?q=union%20select%201' 400)"
# ===== JWT alg:none (url-based) =====
CASES[110500]="1|$(alog GET '/workshop/api/x?t=eyJhbGciOiJub25l' 200)"
CASES[110501]="1|$(alog GET '/workshop/api/x?t=eyJhbGciOiJub25l' 400)"
# ===== Mass assignment (url-based) -- 110510 uses base 31530 (verify) =====
CASES[110510]="1|$(alog GET '/identity/api/v2/user/dashboard?role=admin' 200)"
CASES[110511]="1|$(alog GET '/identity/api/v2/user/dashboard?role=admin' 400)"
# ===== Scanner UA / generic web attack =====
CASES[110600]="1|$(alog GET /api/users/1 200 'sqlmap/1.7')"
CASES[110610]="1|$(alog GET /UploadHandler.php 404)"
CASES[110611]="1|$(alog GET /UploadHandler.php 200)"
CASES[110612]="7|$(alog GET /UploadHandler.php 404)"
CASES[110620]="1|$(alog GET /admin.php 404)"
CASES[110621]="12|$(alog GET /admin.php 404)"
CASES[110630]="1|$(alog TRACE / 200)"
CASES[110640]="1|$(alog GET '/x?f=../../etc/passwd' 200)"
# ===== nginx error log (base 31310) =====
NGXERR='2026/06/11 09:00:00 [error] 123#0: *1 open() failed, client: 10.10.1.50, server: crapi, request: "GET /UploadHandler.php HTTP/1.1", host: "10.10.1.130"'
NGXERR2='2026/06/11 09:00:00 [error] 123#0: *1 open() failed, client: 10.10.1.50, server: crapi, request: "GET /x/../../etc/passwd HTTP/1.1", host: "10.10.1.130"'
CASES[110650]="1|$NGXERR"
CASES[110651]="1|$NGXERR2"
# ===== Expanded recon path coverage =====
CASES[110660]="1|$(alog GET /.svn/entries 404)"
CASES[110661]="7|$(alog GET /.svn/entries 404)"
CASES[110662]="1|$(alog GET /.htaccess 404)"
CASES[110663]="7|$(alog GET /.htaccess 404)"
CASES[110664]="1|$(alog GET /latest/meta-data/ 404)"
CASES[110665]="5|$(alog GET /latest/meta-data/ 404)"
CASES[110666]="1|$(alog GET /WEB-INF/web.xml 404)"
CASES[110667]="7|$(alog GET /WEB-INF/web.xml 404)"
CASES[110668]="1|$(alog GET /CHANGELOG.txt 404)"
CASES[110669]="7|$(alog GET /CHANGELOG.txt 404)"
CASES[110670]="1|$(alog GET /phpinfo.php 404)"
CASES[110671]="7|$(alog GET /phpinfo.php 404)"
CASES[110673]="1|$(alog GET '/?-s' 404)"
CASES[110674]="5|$(alog GET '/?-s' 404)"
CASES[110675]="1|$(alog GET /static/css/abcdef1234567890.css 404)"
CASES[110676]="12|$(alog GET /static/css/abcdef1234567890.css 404)"
CASES[110677]="1|$(alog GET /robots.txt 404)"
CASES[110678]="7|$(alog GET /robots.txt 404)"
# ===== Query-param BOLA =====
QP=$(alog GET '/identity/api/v2/orders?order_id=123' 200)
CASES[110140]="1|$QP"
CASES[110141]="12|$QP"

# ===== Edge-proxy JSON access (replace with REAL access_json.log line) =====
J_NOAUTH='{"request_id":"r1","uri_path":"/workshop/api/orders/1","auth_present":"false","status":"200","src_ip":"10.10.1.50"}'
J_401='{"request_id":"r2","uri_path":"/workshop/api/orders/1","auth_present":"true","status":"401","src_ip":"10.10.1.50"}'
J_OTP='{"request_id":"r4","uri_path":"/identity/api/auth/forget-password","auth_present":"false","status":"200","src_ip":"10.10.1.50"}'
CASES[110701]="1|$J_NOAUTH"
CASES[110702]="1|$J_401"
CASES[110703]="10|$J_401"
CASES[110706]="1|$J_OTP"
CASES[110707]="8|$J_OTP"
# 110700/110704/110705 are base/flood rules:
CASES[110704]="125|$J_NOAUTH"
CASES[110705]="65|$J_NOAUTH"

# ===== PostgreSQL (real format) =====
PG='2026-06-11 09:56:49.052 UTC [70] user=admin db=crapi app=[unknown] client=172.21.0.10'
CASES[110801]="1|$PG LOG:  statement: SELECT * FROM users WHERE id=1 UNION SELECT 1,2,3"
CASES[110802]="1|$PG LOG:  statement: UPDATE users SET role='admin' WHERE id=5"
CASES[110803]="1|$PG ERROR:  syntax error at or near \"UNION\""
# ===== MongoDB (real format) =====
CASES[110831]='1|{"t":{"$date":"2026-06-11T09:57:00.033+00:00"},"s":"I","c":"COMMAND","id":51803,"ctx":"conn8","msg":"Slow query","attr":{"type":"command","ns":"crapi.coupons","command":{"find":"coupons","filter":{"code":{"$ne":null}}}}}'

# Base / level-0 rules: not expected to alert on their own. Skip as "base".
declare -A BASE_RULES=( [110700]=1 [110800]=1 [110830]=1 [110706]=1 )

# ---- preflight --------------------------------------------------
echo "${B}=== Preflight ===${N}"
[ -f "$RULES_FILE" ] || { echo "${R}Rules file not found: $RULES_FILE${N} (set RULES_FILE=...)"; exit 1; }
docker exec "$MANAGER" test -x "$LOGTEST" 2>/dev/null || {
  echo "${R}Cannot reach $LOGTEST in '$MANAGER'.${N}  (docker ps | grep manager)"; exit 1; }
mapfile -t ALL_IDS < <(grep -oP '<rule id="\K[0-9]+' "$RULES_FILE" | sort -un)
echo "OK -> manager=$MANAGER, rules=$RULES_FILE, total rule ids=${#ALL_IDS[@]}"
echo

# ---- run --------------------------------------------------------
run_one() {
  local id="$1" repeats="$2" line="$3" input="" i out
  for ((i=0; i<repeats; i++)); do input+="${line}"$'\n'; done
  out=$(printf '%s' "$input" | docker exec -i "$MANAGER" "$LOGTEST" 2>/dev/null)
  grep -qE "'${id}'" <<<"$out"
}

echo "${B}=== Testing ${#ALL_IDS[@]} rules ===${N}"
for id in "${ALL_IDS[@]}"; do
  if [[ -n "${BASE_RULES[$id]:-}" && -z "${CASES[$id]:-}" ]]; then
    printf '  %sBASE%s [%s] level-0 base rule (no standalone alert)\n' "$Y" "$N" "$id"
    continue
  fi
  if [[ -z "${CASES[$id]:-}" ]]; then
    printf '  %sNOCASE%s [%s]\n' "$Y" "$N" "$id"
    NOCASE=$((NOCASE+1)); NOCASE_IDS+=("$id"); continue
  fi
  repeats="${CASES[$id]%%|*}"
  line="${CASES[$id]#*|}"
  if run_one "$id" "$repeats" "$line"; then
    printf '  %sPASS%s   [%s]\n' "$G" "$N" "$id"
    PASS=$((PASS+1))
  else
    printf '  %sFAIL%s   [%s]\n' "$R" "$N" "$id"
    FAIL=$((FAIL+1)); FAIL_IDS+=("$id")
  fi
done

# ---- summary ----------------------------------------------------
echo
echo "${B}================ SUMMARY ================${N}"
printf '  %sPASS: %d%s   %sFAIL: %d%s   %sNOCASE: %d%s   (total %d)\n' \
  "$G" "$PASS" "$N" "$R" "$FAIL" "$N" "$Y" "$NOCASE" "$N" "${#ALL_IDS[@]}"
[ "${#FAIL_IDS[@]}"   -gt 0 ] && echo "  FAIL ids:   ${FAIL_IDS[*]}"
[ "${#NOCASE_IDS[@]}" -gt 0 ] && echo "  NOCASE ids: ${NOCASE_IDS[*]}"
echo
echo "Hints:"
echo "  - FAIL on apache/JSON cases: replace sample with a REAL captured log line."
echo "  - 110701/110702 FAIL => change <status> to <field name=\"status\">."
echo "  - 110672 / 110679 are Wazuh aggregate rules (php-cgi / multi-400) -> hard to"
echo "    drive from one logtest line; verify with a real attack instead."
echo "  - Correlation rules need enough repeats in one session; if piped logtest does"
echo "    not accumulate, re-test interactively (paste the line N times)."

[ "$FAIL" -eq 0 ] && exit 0 || exit 1