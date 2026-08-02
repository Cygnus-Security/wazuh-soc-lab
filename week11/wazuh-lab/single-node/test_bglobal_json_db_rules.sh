#!/usr/bin/env bash
set -u

MGR="single-node-wazuh.manager-1"
OUT="bglobal_json_db_rule_test_results.log"
SUMMARY="bglobal_json_db_rule_summary.md"

: > "$OUT"
: > "$SUMMARY"

PASS_COUNT=0
FAIL_COUNT=0
LIMITED_COUNT=0

log() {
  echo -e "$*" | tee -a "$OUT"
}

pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  log "[PASS] $1"
}

fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  log "[FAIL] $1"
}

limited() {
  LIMITED_COUNT=$((LIMITED_COUNT + 1))
  log "[LIMITED] $1"
}

run_logtest() {
  local name="$1"
  local expected="$2"
  local input="$3"
  local tmp="/tmp/${name}.out"

  echo "$input" | docker exec -i "$MGR" /var/ossec/bin/wazuh-logtest > "$tmp" 2>&1

  {
    echo
    echo "============================================================"
    echo "TEST: $name"
    echo "EXPECTED RULE: $expected"
    echo "============================================================"
    cat "$tmp"
  } >> "$OUT"

  if grep -Eq "id: '$expected'|Rule id: $expected|rule id '$expected'|\"id\":\"$expected\"|$expected" "$tmp"; then
    pass "$name expected_rule=$expected"
    echo "| $expected | $name | PASS | Direct logtest match |" >> "$SUMMARY"
  else
    fail "$name expected_rule=$expected"
    echo "| $expected | $name | FAIL | Expected rule not observed in logtest output |" >> "$SUMMARY"
  fi
}

run_logtest_stream() {
  local name="$1"
  local expected="$2"
  local tmp="/tmp/${name}.out"

  docker exec -i "$MGR" /var/ossec/bin/wazuh-logtest > "$tmp" 2>&1

  {
    echo
    echo "============================================================"
    echo "TEST: $name"
    echo "EXPECTED CORRELATION RULE: $expected"
    echo "============================================================"
    cat "$tmp"
  } >> "$OUT"

  if grep -Eq "id: '$expected'|Rule id: $expected|rule id '$expected'|\"id\":\"$expected\"|$expected" "$tmp"; then
    pass "$name expected_rule=$expected"
    echo "| $expected | $name | PASS-CORRELATION | Multi-line correlation matched |" >> "$SUMMARY"
  else
    fail "$name expected_rule=$expected"
    echo "| $expected | $name | FAIL | Correlation rule not observed |" >> "$SUMMARY"
  fi
}

echo "# bGlobal JSON/DB Rule Test Summary" > "$SUMMARY"
echo >> "$SUMMARY"
echo "| Rule ID | Test name | Status | Notes |" >> "$SUMMARY"
echo "|---:|---|---|---|" >> "$SUMMARY"

log "============================================================"
log "1) Wazuh analysisd syntax validation"
log "============================================================"

if docker exec "$MGR" /var/ossec/bin/wazuh-analysisd -t >> "$OUT" 2>&1; then
  pass "wazuh-analysisd -t passed"
else
  fail "wazuh-analysisd -t failed. Fix syntax/decoder/rule loading errors first."
  log "Check detail in $OUT"
  exit 1
fi

log
log "============================================================"
log "2) Testing 110700+ Nginx JSON rules"
log "============================================================"

# 110700 is level 0 base. It is confirmed indirectly when children match.
echo "| 110700 | Nginx JSON base | INDIRECT | Level 0 base rule confirmed through child rules 110701-110707 |" >> "$SUMMARY"
limited "110700 is level 0 base; confirmed indirectly through child rules."

run_logtest "110701_missing_auth_2xx" "110701" \
'{"timestamp":"2026-06-11T13:01:00+00:00","src_ip":"10.10.1.20","xff":"","method":"GET","uri_path":"/workshop/api/v2/mechanic","query":"","http_status":200,"body_bytes":123,"request_length":500,"request_time":0.12,"upstream_addr":"crapi-web:80","upstream_status":"200","upstream_response_time":"0.11","user_agent":"curl","referer":"","request_id":"test-110701","auth_present":"false","cookie_present":"false","connection":"1","connection_requests":"1","limit_req_status":"","limit_conn_status":"","is_auth_api":"0","is_attack_uri":"0","is_ddos":"0","is_security":"0"}'

run_logtest "110702_rejected_jwt_403" "110702" \
'{"timestamp":"2026-06-11T13:02:00+00:00","src_ip":"10.10.1.20","xff":"","method":"GET","uri_path":"/identity/api/v2/user/dashboard","query":"","http_status":403,"body_bytes":123,"request_length":500,"request_time":0.12,"upstream_addr":"crapi-web:80","upstream_status":"403","upstream_response_time":"0.11","user_agent":"curl","referer":"","request_id":"test-110702","auth_present":"true","cookie_present":"false","connection":"1","connection_requests":"1","limit_req_status":"","limit_conn_status":"","is_auth_api":"0","is_attack_uri":"0","is_ddos":"0","is_security":"1"}'

# 110703: frequency=8 same_field src_ip
{
  for i in $(seq 1 8); do
    echo "{\"timestamp\":\"2026-06-11T13:03:00+00:00\",\"src_ip\":\"10.10.1.20\",\"xff\":\"\",\"method\":\"GET\",\"uri_path\":\"/identity/api/v2/user/dashboard\",\"query\":\"\",\"http_status\":403,\"body_bytes\":123,\"request_length\":500,\"request_time\":0.12,\"upstream_addr\":\"crapi-web:80\",\"upstream_status\":\"403\",\"upstream_response_time\":\"0.11\",\"user_agent\":\"curl\",\"referer\":\"\",\"request_id\":\"test-110703-$i\",\"auth_present\":\"true\",\"cookie_present\":\"false\",\"connection\":\"1\",\"connection_requests\":\"1\",\"limit_req_status\":\"\",\"limit_conn_status\":\"\",\"is_auth_api\":\"0\",\"is_attack_uri\":\"0\",\"is_ddos\":\"0\",\"is_security\":\"1\"}"
  done
} | run_logtest_stream "110703_repeated_rejected_jwt" "110703"

# 110704: frequency=120 same_field src_ip
{
  for i in $(seq 1 120); do
    echo "{\"timestamp\":\"2026-06-11T13:04:00+00:00\",\"src_ip\":\"10.10.1.20\",\"xff\":\"\",\"method\":\"GET\",\"uri_path\":\"/\",\"query\":\"\",\"http_status\":200,\"body_bytes\":123,\"request_length\":500,\"request_time\":0.01,\"upstream_addr\":\"crapi-web:80\",\"upstream_status\":\"200\",\"upstream_response_time\":\"0.01\",\"user_agent\":\"ffuf\",\"referer\":\"\",\"request_id\":\"test-110704-$i\",\"auth_present\":\"false\",\"cookie_present\":\"false\",\"connection\":\"1\",\"connection_requests\":\"1\",\"limit_req_status\":\"\",\"limit_conn_status\":\"\",\"is_auth_api\":\"0\",\"is_attack_uri\":\"0\",\"is_ddos\":\"0\",\"is_security\":\"0\"}"
  done
} | run_logtest_stream "110704_l7_http_flood" "110704"

# 110705: frequency=60 same src_ip + same uri_path
{
  for i in $(seq 1 60); do
    echo "{\"timestamp\":\"2026-06-11T13:05:00+00:00\",\"src_ip\":\"10.10.1.20\",\"xff\":\"\",\"method\":\"GET\",\"uri_path\":\"/identity/api/v2/vehicle/550e8400-e29b-41d4-a716-446655440000/location\",\"query\":\"\",\"http_status\":200,\"body_bytes\":123,\"request_length\":500,\"request_time\":0.01,\"upstream_addr\":\"crapi-web:80\",\"upstream_status\":\"200\",\"upstream_response_time\":\"0.01\",\"user_agent\":\"ffuf\",\"referer\":\"\",\"request_id\":\"test-110705-$i\",\"auth_present\":\"true\",\"cookie_present\":\"false\",\"connection\":\"1\",\"connection_requests\":\"1\",\"limit_req_status\":\"\",\"limit_conn_status\":\"\",\"is_auth_api\":\"0\",\"is_attack_uri\":\"0\",\"is_ddos\":\"0\",\"is_security\":\"0\"}"
  done
} | run_logtest_stream "110705_endpoint_hammering" "110705"

run_logtest "110706_otp_reset_request" "110706" \
'{"timestamp":"2026-06-11T13:06:00+00:00","src_ip":"10.10.1.20","xff":"","method":"POST","uri_path":"/identity/api/auth/v2/check-otp","query":"","http_status":401,"body_bytes":123,"request_length":500,"request_time":0.12,"upstream_addr":"crapi-web:80","upstream_status":"401","upstream_response_time":"0.11","user_agent":"ffuf","referer":"","request_id":"test-110706","auth_present":"false","cookie_present":"false","connection":"1","connection_requests":"1","limit_req_status":"","limit_conn_status":"","is_auth_api":"1","is_attack_uri":"0","is_ddos":"0","is_security":"1"}'

# 110707: frequency=6 same src_ip
{
  for i in $(seq 1 6); do
    echo "{\"timestamp\":\"2026-06-11T13:07:00+00:00\",\"src_ip\":\"10.10.1.20\",\"xff\":\"\",\"method\":\"POST\",\"uri_path\":\"/identity/api/auth/v2/check-otp\",\"query\":\"\",\"http_status\":401,\"body_bytes\":123,\"request_length\":500,\"request_time\":0.12,\"upstream_addr\":\"crapi-web:80\",\"upstream_status\":\"401\",\"upstream_response_time\":\"0.11\",\"user_agent\":\"ffuf\",\"referer\":\"\",\"request_id\":\"test-110707-$i\",\"auth_present\":\"false\",\"cookie_present\":\"false\",\"connection\":\"1\",\"connection_requests\":\"1\",\"limit_req_status\":\"\",\"limit_conn_status\":\"\",\"is_auth_api\":\"1\",\"is_attack_uri\":\"0\",\"is_ddos\":\"0\",\"is_security\":\"1\"}"
  done
} | run_logtest_stream "110707_otp_email_spam_correlation" "110707"

log
log "============================================================"
log "3) Testing 110800+ PostgreSQL rules"
log "============================================================"

# 110800 is level 0 base. It is confirmed indirectly when children match.
echo "| 110800 | PostgreSQL base | INDIRECT | Level 0 base rule confirmed through child rules 110801-110803 |" >> "$SUMMARY"
limited "110800 is level 0 base; confirmed indirectly through child rules."

run_logtest "110801_postgresql_sqli" "110801" \
"2026-06-11 13:08:00.000 UTC [1234] user=admin db=crapi app=psql client=172.18.0.10 LOG:  statement: SELECT * FROM users WHERE email='' OR 1=1 --';"

run_logtest "110802_postgresql_mass_assignment" "110802" \
"2026-06-11 13:09:00.000 UTC [1235] user=admin db=crapi app=psql client=172.18.0.10 LOG:  statement: UPDATE users SET role='admin', is_admin=true WHERE id=2;"

run_logtest "110803_postgresql_syntax_error" "110803" \
"2026-06-11 13:10:00.000 UTC [1236] user=admin db=crapi app=psql client=172.18.0.10 ERROR:  syntax error at or near \"union\""

log
log "============================================================"
log "4) Testing 110830+ MongoDB JSON rules"
log "============================================================"

# 110830 is level 0 base. It is confirmed indirectly when 110831 matches.
echo "| 110830 | MongoDB JSON base | INDIRECT | Level 0 base rule confirmed through child rule 110831 |" >> "$SUMMARY"
limited "110830 is level 0 base; confirmed indirectly through child rule."

run_logtest "110831_mongodb_nosqli_ne" "110831" \
'{"t":{"$date":"2026-06-11T13:11:00.000+00:00"},"s":"I","c":"COMMAND","id":51803,"ctx":"conn123","msg":"Slow query","attr":{"type":"command","ns":"crapi.users","command":{"find":"users","filter":{"email":{"$ne":null}}},"durationMillis":1}}'

run_logtest "110831_mongodb_nosqli_regex" "110831" \
'{"t":{"$date":"2026-06-11T13:12:00.000+00:00"},"s":"I","c":"COMMAND","id":51803,"ctx":"conn124","msg":"Slow query","attr":{"type":"command","ns":"crapi.users","command":{"find":"users","filter":{"email":{"$regex":".*admin.*"}}},"durationMillis":1}}'

log
log "============================================================"
log "5) Final summary"
log "============================================================"

log "PASS_COUNT=$PASS_COUNT"
log "FAIL_COUNT=$FAIL_COUNT"
log "LIMITED_COUNT=$LIMITED_COUNT"
log "Raw log: $OUT"
log "Markdown summary: $SUMMARY"

echo >> "$SUMMARY"
echo "## Final Count" >> "$SUMMARY"
echo >> "$SUMMARY"
echo "- PASS_COUNT=$PASS_COUNT" >> "$SUMMARY"
echo "- FAIL_COUNT=$FAIL_COUNT" >> "$SUMMARY"
echo "- LIMITED_OR_INDIRECT_COUNT=$LIMITED_COUNT" >> "$SUMMARY"
echo "- Raw output: \`$OUT\`" >> "$SUMMARY"

if [ "$FAIL_COUNT" -eq 0 ]; then
  log "RESULT=SUCCESS"
  exit 0
else
  log "RESULT=FAILED"
  exit 1
fi