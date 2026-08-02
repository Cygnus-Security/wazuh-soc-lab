#!/usr/bin/env bash
set -u

CONTAINER="${WAZUH_MANAGER_CONTAINER:-single-node-wazuh.manager-1}"
RULE_FILE="${RULE_FILE:-bglobal_crapi_rules.xml}"
DECODER_FILE="${DECODER_FILE:-custom_decoders/bglobal_sql_decoders.xml}"
RESULT_LOG="${RESULT_LOG:-bglobal_two_files_all_rule_test_results.log}"
COVERAGE_MD="${COVERAGE_MD:-bglobal_two_files_rule_coverage.md}"
SAMPLES_TXT="${SAMPLES_TXT:-bglobal_two_files_test_samples.txt}"

python3 - "$CONTAINER" "$RULE_FILE" "$DECODER_FILE" "$RESULT_LOG" "$COVERAGE_MD" "$SAMPLES_TXT" <<'PY'
import json
import os
import re
import subprocess
import sys
import textwrap
import time
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from pathlib import Path

container, rule_file, decoder_file, result_log, coverage_md, samples_txt = sys.argv[1:]


@dataclass
class Case:
    rule_id: str
    category: str
    sample_type: str
    lines: list[str]
    success_status: str = "PASS"
    notes: str = ""


def web(ip: str, method: str, path: str, status: int, ua: str = "curl", size: int = 123) -> str:
    return f'{ip} - - [11/Jun/2026:13:00:00 +0000] "{method} {path} HTTP/1.1" {status} {size} "-" "{ua}"'


def nginx_error(path: str) -> str:
    return (
        '2026/06/11 13:00:00 [error] 123#123: *1 open() '
        f'"/usr/share/nginx/html{path}" failed (2: No such file or directory), '
        f'client: 10.10.9.20, server: localhost, request: "GET {path} HTTP/1.1", host: "localhost"'
    )


def json_access(
    src_ip: str,
    method: str,
    uri_path: str,
    status: int,
    request_id: str,
    auth_present: str = "true",
    cookie_present: str = "false",
    user_agent: str = "curl",
) -> str:
    event = {
        "timestamp": "2026-06-11T13:00:00+00:00",
        "src_ip": src_ip,
        "xff": "",
        "method": method,
        "uri_path": uri_path,
        "query": "",
        "http_status": status,
        "body_bytes": 123,
        "request_length": 500,
        "request_time": 0.12,
        "upstream_addr": "crapi-web:80",
        "upstream_status": str(status),
        "upstream_response_time": "0.11",
        "user_agent": user_agent,
        "referer": "",
        "request_id": request_id,
        "auth_present": auth_present,
        "cookie_present": cookie_present,
        "connection": "1",
        "connection_requests": "1",
        "limit_req_status": "",
        "limit_conn_status": "",
        "is_auth_api": "0",
        "is_attack_uri": "0",
        "is_ddos": "0",
        "is_security": "0",
    }
    return json.dumps(event, separators=(",", ":"))


def postgres(line: str) -> str:
    return line


def mongo(with_operator: bool) -> str:
    if with_operator:
        event = {
            "t": {"$date": "2026-06-11T13:07:00.000+00:00"},
            "s": "I",
            "c": "COMMAND",
            "id": 51803,
            "ctx": "conn123",
            "msg": "Slow query",
            "attr": {
                "type": "command",
                "ns": "crapi.users",
                "command": {"find": "users", "filter": {"email": {"$ne": None}}},
                "durationMillis": 1,
            },
        }
    else:
        event = {
            "t": {"$date": "2026-06-11T13:07:00.000+00:00"},
            "s": "I",
            "c": "COMMAND",
            "id": 51803,
            "ctx": "conn123",
            "msg": "Slow query",
            "attr": {
                "type": "command",
                "ns": "crapi.users",
                "command": {"find": "users", "filter": {"email": "analyst@example.test"}},
                "durationMillis": 1,
            },
        }
    return json.dumps(event, separators=(",", ":"))


def repeat(n: int, fn):
    return [fn(i) for i in range(n)]


cases: list[Case] = []
add = cases.append

# A. BOLA / IDOR object access
add(Case("110100", "A. BOLA / IDOR object access", "web-accesslog 2xx object id", [web("10.10.1.20", "GET", "/identity/api/v2/users/12345", 200)]))
add(Case("110104", "A. BOLA / IDOR object access", "web-accesslog 4xx object id", [web("10.10.1.21", "GET", "/identity/api/v2/users/12345", 404)]))
add(Case("110105", "A. BOLA / IDOR object access", "web-accesslog 5xx object id", [web("10.10.1.22", "GET", "/identity/api/v2/users/12345", 500)]))
add(Case("110101", "A. BOLA / IDOR object access", "correlation repeated object ids", repeat(10, lambda i: web("10.10.1.23", "GET", f"/identity/api/v2/users/{1000+i}", 200)), "PASS-CORRELATION"))
add(Case("110120", "A. BOLA / IDOR object access", "web-accesslog vehicle UUID 2xx", [web("10.10.1.24", "GET", "/identity/api/v2/vehicle/550e8400-e29b-41d4-a716-446655440000/location", 200, "ffuf")]))
add(Case("110121", "A. BOLA / IDOR object access", "web-accesslog vehicle UUID 4xx", [web("10.10.1.25", "GET", "/identity/api/v2/vehicle/550e8400-e29b-41d4-a716-446655440000/location", 403)]))
add(Case("110122", "A. BOLA / IDOR object access", "correlation repeated vehicle UUID", repeat(5, lambda i: web("10.10.1.26", "GET", "/identity/api/v2/vehicle/550e8400-e29b-41d4-a716-446655440000/location", 200)), "PASS-CORRELATION"))
add(Case("110140", "A. BOLA / IDOR object access", "web-accesslog query id", [web("10.10.1.27", "GET", "/identity/api/v2/reports?report_id=12345", 200)]))
add(Case("110141", "A. BOLA / IDOR object access", "correlation repeated query ids", repeat(10, lambda i: web("10.10.1.28", "GET", f"/identity/api/v2/reports?report_id={2000+i}", 200)), "PASS-CORRELATION"))

# B. REST method abuse
add(Case("110130", "B. REST method abuse", "web-accesslog DELETE object 2xx", [web("10.10.2.10", "DELETE", "/identity/api/v2/users/12345", 200)]))
add(Case("110131", "B. REST method abuse", "web-accesslog PATCH object 4xx", [web("10.10.2.11", "PATCH", "/identity/api/v2/users/12345", 403)]))

# C. BFLA / admin/internal endpoint
add(Case("110400", "C. BFLA / admin/internal endpoint", "web-accesslog admin 2xx", [web("10.10.3.10", "GET", "/identity/api/v2/admin/panel", 200)]))
add(Case("110401", "C. BFLA / admin/internal endpoint", "web-accesslog admin 4xx", [web("10.10.3.11", "GET", "/identity/api/v2/admin/panel", 403)]))
add(Case("110402", "C. BFLA / admin/internal endpoint", "correlation repeated admin 4xx", repeat(5, lambda i: web("10.10.3.12", "GET", f"/identity/api/v2/admin/panel{i}", 403)), "PASS-CORRELATION"))

# D. Sensitive path probing
add(Case("110102", "D. Sensitive path probing", "web-accesslog sensitive path 2xx", [web("10.10.4.10", "GET", "/swagger/index.html", 200)]))
add(Case("110106", "D. Sensitive path probing", "web-accesslog sensitive path 4xx", [web("10.10.4.11", "GET", "/swagger/index.html", 404)]))
add(Case("110107", "D. Sensitive path probing", "web-accesslog sensitive path 5xx", [web("10.10.4.12", "GET", "/swagger/index.html", 500)]))
add(Case("110103", "D. Sensitive path probing", "correlation repeated sensitive path", repeat(10, lambda i: web("10.10.4.13", "GET", f"/api-docs/{i}", 404)), "PASS-CORRELATION"))

# E. Authentication brute force and auth scanning
add(Case("110200", "E. Authentication brute force and auth scanning", "web-accesslog login failure", [web("10.10.5.10", "POST", "/identity/api/auth/login", 401)]))
add(Case("110206", "E. Authentication brute force and auth scanning", "web-accesslog auth endpoint failure", [web("10.10.5.11", "POST", "/identity/api/auth/check-otp", 403)]))
add(Case("110201", "E. Authentication brute force and auth scanning", "correlation repeated auth failures", repeat(5, lambda i: web("10.10.5.12", "POST", "/identity/api/auth/login", 401)), "PASS-CORRELATION"))
add(Case("110202", "E. Authentication brute force and auth scanning", "web-accesslog login success", [web("10.10.5.13", "POST", "/identity/api/auth/login", 200)]))
add(Case("110203", "E. Authentication brute force and auth scanning", "correlation repeated auth successes", repeat(20, lambda i: web("10.10.5.14", "POST", "/identity/api/auth/login", 200)), "PASS-CORRELATION"))
add(Case("110204", "E. Authentication brute force and auth scanning", "web-accesslog unknown auth 404", [web("10.10.5.15", "GET", "/identity/api/auth/not-real", 404)]))
add(Case("110205", "E. Authentication brute force and auth scanning", "correlation repeated auth scan", repeat(10, lambda i: web("10.10.5.16", "GET", f"/identity/api/auth/not-real-{i}", 404)), "PASS-CORRELATION"))

# F. SSRF
add(Case("110300", "F. SSRF", "web-accesslog SSRF 2xx", [web("10.10.6.10", "GET", "/workshop/api/merchant/contact_mechanic?url=http://169.254.169.254/latest/meta-data", 200)]))
add(Case("110301", "F. SSRF", "web-accesslog SSRF 4xx", [web("10.10.6.11", "GET", "/workshop/api/merchant/contact_mechanic?url=http://127.0.0.1/admin", 403)]))

# G. SQLi / NoSQLi in URL
add(Case("110310", "G. SQLi / NoSQLi in URL", "web-accesslog NoSQLi query 2xx", [web("10.10.7.10", "GET", "/identity/api/v2/users?filter[$ne]=null", 200)]))
add(Case("110311", "G. SQLi / NoSQLi in URL", "web-accesslog NoSQLi query 4xx", [web("10.10.7.11", "GET", "/identity/api/v2/users?filter[$ne]=null", 404)]))

# H. JWT / auth bypass heuristic
add(Case("110500", "H. JWT / auth bypass heuristic", "web-accesslog JWT alg none 2xx", [web("10.10.8.10", "GET", "/identity/api/v2/user/dashboard?token=eyJhbGciOiJub25l", 200)]))
add(Case("110501", "H. JWT / auth bypass heuristic", "web-accesslog JWT alg none 4xx", [web("10.10.8.11", "GET", "/identity/api/v2/user/dashboard?token=eyJhbGciOiJub25l", 403)]))

# I. Mass assignment / BOPLA
add(Case("110510", "I. Mass assignment / BOPLA", "web-accesslog POST mass assignment 2xx", [web("10.10.8.20", "POST", "/identity/api/v2/user/profile?role=admin", 200)]))
add(Case("110511", "I. Mass assignment / BOPLA", "web-accesslog mass assignment 4xx", [web("10.10.8.21", "GET", "/identity/api/v2/user/profile?role=admin", 403)]))

# J. Scanner user-agent
add(Case("110600", "J. Scanner user-agent", "web-accesslog scanner user-agent", [web("10.10.9.10", "GET", "/", 200, "ffuf")]))

# K. Upload/plugin probing
add(Case("110610", "K. Upload/plugin probing", "web-accesslog upload plugin 4xx", [web("10.10.10.10", "GET", "/jQuery-File-Upload/server/php/index.php", 404)]))
add(Case("110611", "K. Upload/plugin probing", "web-accesslog upload plugin 2xx", [web("10.10.10.11", "GET", "/jQuery-File-Upload/server/php/index.php", 200)]))
add(Case("110612", "K. Upload/plugin probing", "correlation repeated upload plugin", repeat(5, lambda i: web("10.10.10.12", "GET", f"/jQuery-File-Upload/server/php/index{i}.php", 404)), "PASS-CORRELATION"))

# L. PHP/CMS enumeration
add(Case("110620", "L. PHP/CMS enumeration", "web-accesslog PHP enum 404", [web("10.10.11.10", "GET", "/admin.php", 404)]))
add(Case("110621", "L. PHP/CMS enumeration", "correlation repeated PHP enum", repeat(10, lambda i: web("10.10.11.11", "GET", f"/test{i}/admin.php", 404)), "PASS-CORRELATION"))

# M. Suspicious HTTP methods
add(Case("110630", "M. Suspicious HTTP methods", "web-accesslog TRACE method", [web("10.10.12.10", "TRACE", "/health", 200)]))

# N. Generic exploit payload
add(Case("110640", "N. Generic exploit payload", "web-accesslog traversal payload", [web("10.10.13.10", "GET", "/api/v1/search?file=../../etc/passwd", 200)]))

# O. Raw Nginx warning log
add(Case("110650", "O. Raw Nginx warning log", "nginx-errorlog scanner request", [nginx_error("/jQuery-File-Upload/server/php/index.php")]))
add(Case("110651", "O. Raw Nginx warning log", "nginx-errorlog exploit payload", [nginx_error("/../../etc/passwd")]))

# P. Expanded scanner coverage
add(Case("110660", "P. Expanded scanner coverage", "web-accesslog VCS 4xx", [web("10.10.14.10", "GET", "/.svn/entries", 404)]))
add(Case("110661", "P. Expanded scanner coverage", "correlation repeated VCS", repeat(5, lambda i: web("10.10.14.11", "GET", "/.svn/entries", 404)), "PASS-CORRELATION"))
add(Case("110662", "P. Expanded scanner coverage", "web-accesslog secret file 4xx", [web("10.10.14.12", "GET", "/key.pem", 404)]))
add(Case("110663", "P. Expanded scanner coverage", "correlation repeated secret files", repeat(5, lambda i: web("10.10.14.13", "GET", f"/id_rsa?x={i}", 404)), "PASS-CORRELATION"))
add(Case("110664", "P. Expanded scanner coverage", "web-accesslog cloud metadata 4xx", [web("10.10.14.14", "GET", "/latest/meta-data/iam/security-credentials/", 404)]))
add(Case("110665", "P. Expanded scanner coverage", "correlation repeated cloud metadata", repeat(3, lambda i: web("10.10.14.15", "GET", f"/latest/meta-data/{i}", 404)), "PASS-CORRELATION"))
add(Case("110666", "P. Expanded scanner coverage", "web-accesslog framework fingerprint 4xx", [web("10.10.14.16", "GET", "/WEB-INF/web.xml", 404)]))
add(Case("110667", "P. Expanded scanner coverage", "correlation repeated framework", repeat(5, lambda i: web("10.10.14.17", "GET", "/WEB-INF/applicationContext.xml", 404)), "PASS-CORRELATION"))
add(Case("110668", "P. Expanded scanner coverage", "web-accesslog CMS config 4xx", [web("10.10.14.18", "GET", "/app/etc/local.xml", 404)]))
add(Case("110669", "P. Expanded scanner coverage", "correlation repeated CMS config", repeat(5, lambda i: web("10.10.14.19", "GET", f"/config/database.yml?x={i}", 404)), "PASS-CORRELATION"))
add(Case("110670", "P. Expanded scanner coverage", "web-accesslog PHP tooling 4xx", [web("10.10.14.20", "GET", "/phpinfo.php", 404)]))
add(Case("110671", "P. Expanded scanner coverage", "correlation repeated PHP tooling", repeat(5, lambda i: web("10.10.14.21", "GET", f"/adminer.php?x={i}", 404)), "PASS-CORRELATION"))
add(Case("110672", "P. Expanded scanner coverage", "web-accesslog PHP-CGI built-in parent", [web("10.10.14.22", "GET", "/?-s", 200)]))
add(Case("110673", "P. Expanded scanner coverage", "web-accesslog PHP-CGI fallback 4xx", [web("10.10.14.23", "GET", "/?-d+allow_url_include=1", 404)]))
add(Case("110674", "P. Expanded scanner coverage", "correlation repeated PHP-CGI", repeat(3, lambda i: web("10.10.14.24", "GET", "/?-d+allow_url_include=1", 404)), "PASS-CORRELATION"))
add(Case("110675", "P. Expanded scanner coverage", "web-accesslog high entropy 4xx", [web("10.10.14.25", "GET", "/123456789012", 404)]))
add(Case("110676", "P. Expanded scanner coverage", "correlation repeated high entropy", repeat(10, lambda i: web("10.10.14.26", "GET", f"/{123456789012+i}", 404)), "PASS-CORRELATION"))
add(Case("110677", "P. Expanded scanner coverage", "web-accesslog common discovery 4xx", [web("10.10.14.27", "GET", "/robots.txt", 404)]))
add(Case("110678", "P. Expanded scanner coverage", "correlation repeated common discovery", repeat(5, lambda i: web("10.10.14.28", "GET", f"/sitemap{i}.xml", 404)), "PASS-CORRELATION"))
add(Case("110679", "P. Expanded scanner coverage", "correlation built-in repeated 400 errors", repeat(14, lambda i: web("10.10.14.29", "GET", f"/missing-{i}", 404)), "PASS-CORRELATION"))

# Q. Nginx JSON access log
add(Case("110700", "Q. Nginx JSON access log", "nginx JSON base", [json_access("10.10.15.10", "GET", "/public/ping", 200, "json-base-001")]))
add(Case("110701", "Q. Nginx JSON access log", "nginx JSON missing auth", [json_access("10.10.15.11", "GET", "/workshop/api/v2/mechanic", 200, "json-missing-auth-001", "false")]))
add(Case("110702", "Q. Nginx JSON access log", "nginx JSON rejected JWT", [json_access("10.10.15.12", "GET", "/identity/api/v2/user/dashboard", 403, "json-jwt-reject-001", "true")]))
add(Case("110703", "Q. Nginx JSON access log", "correlation repeated rejected JWT", repeat(8, lambda i: json_access("10.10.15.13", "GET", "/identity/api/v2/user/dashboard", 403, f"json-jwt-reject-{i}", "true")), "PASS-CORRELATION"))
add(Case("110704", "Q. Nginx JSON access log", "correlation JSON high request rate", repeat(120, lambda i: json_access("10.10.15.14", "GET", f"/public/ping/{i}", 200, f"json-flood-{i}", "true")), "PASS-CORRELATION"))
add(Case("110705", "Q. Nginx JSON access log", "correlation JSON endpoint hammering", repeat(60, lambda i: json_access("10.10.15.15", "GET", "/public/ping", 200, f"json-hammer-{i}", "true")), "PASS-CORRELATION"))
add(Case("110706", "Q. Nginx JSON access log", "nginx JSON OTP endpoint", [json_access("10.10.15.16", "POST", "/identity/api/auth/v2/check-otp", 429, "json-otp-001", "false", user_agent="ffuf")]))
add(Case("110707", "Q. Nginx JSON access log", "correlation repeated OTP endpoint", repeat(6, lambda i: json_access("10.10.15.17", "POST", "/identity/api/auth/v2/check-otp", 429, f"json-otp-{i}", "false", user_agent="ffuf")), "PASS-CORRELATION"))

# R. PostgreSQL
add(Case("110800", "R. PostgreSQL", "PostgreSQL base decoder", [postgres("2026-06-11 13:04:00.000 UTC [1230] user=admin db=crapi app=psql client=172.18.0.10 LOG:  connection authorized")]))
add(Case("110801", "R. PostgreSQL", "PostgreSQL SQLi statement", [postgres("2026-06-11 13:04:00.000 UTC [1234] user=admin db=crapi app=psql client=172.18.0.10 LOG:  statement: SELECT * FROM users WHERE email='' OR 1=1 --';")]))
add(Case("110802", "R. PostgreSQL", "PostgreSQL mass assignment", [postgres("2026-06-11 13:05:00.000 UTC [1235] user=admin db=crapi app=psql client=172.18.0.10 LOG:  statement: UPDATE users SET role='admin', is_admin=true WHERE id=2;")]))
add(Case("110803", "R. PostgreSQL", "PostgreSQL SQL error", [postgres('2026-06-11 13:06:00.000 UTC [1236] user=admin db=crapi app=psql client=172.18.0.10 ERROR:  syntax error at or near "union"')]))

# S. MongoDB JSON
add(Case("110830", "S. MongoDB JSON", "MongoDB JSON base", [mongo(False)]))
add(Case("110831", "S. MongoDB JSON", "MongoDB JSON NoSQLi operator", [mongo(True)]))


def parse_rule_metadata(path: str):
    tree = ET.parse(path)
    root = tree.getroot()
    metadata = {}
    group_names = set()
    for rule in root.findall(".//rule"):
        rid = rule.attrib["id"]
        desc = " ".join((el.text or "").strip() for el in rule.findall("description")).strip()
        attrs = []
        for key in ("frequency", "timeframe", "ignore"):
            if key in rule.attrib:
                attrs.append(f"{key}={rule.attrib[key]}")
        for tag in ("if_sid", "if_matched_sid", "if_matched_group", "decoded_as"):
            for el in rule.findall(tag):
                attrs.append(f"{tag}={((el.text or '').strip())}")
        for el in rule.findall("group"):
            groups = (el.text or "").strip()
            if groups:
                attrs.append(f"group={groups}")
                for group in groups.split(","):
                    group = group.strip()
                    if group:
                        group_names.add(group)
        if rule.find("same_srcip") is not None:
            attrs.append("same_srcip")
        for el in rule.findall("same_field"):
            attrs.append(f"same_field={((el.text or '').strip())}")
        metadata[rid] = {
            "description": desc,
            "parent": "; ".join(attrs) if attrs else "",
        }
    return metadata, group_names


def parse_decoder_metadata(path: str):
    root = ET.parse(path).getroot()
    decoders = [root] if root.tag == "decoder" else root.findall(".//decoder")
    rows = []
    for decoder in decoders:
        rows.append(
            {
                "name": decoder.attrib.get("name", ""),
                "prematch": [((el.text or "").strip()) for el in decoder.findall("prematch")],
                "regex": [((el.text or "").strip()) for el in decoder.findall("regex")],
                "order": [((el.text or "").strip()) for el in decoder.findall("order")],
            }
        )
    return rows


def phase3_rule_ids(output: str):
    ids = []
    in_phase3 = False
    for line in output.splitlines():
        if line.startswith("**Phase 3:"):
            in_phase3 = True
            continue
        if in_phase3:
            m = re.match(r"\s*id: '(\d+)'", line)
            if m:
                ids.append(m.group(1))
                in_phase3 = False
                continue
            if line.startswith("**Phase "):
                in_phase3 = False
    return ids


def run_cmd(cmd, input_text=None, timeout=180):
    return subprocess.run(
        cmd,
        input=input_text,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        timeout=timeout,
    )


def run_logtest(lines):
    text = "\n".join(lines) + "\n"
    return run_cmd(["docker", "exec", "-i", container, "/var/ossec/bin/wazuh-logtest"], text, 240)


started = time.strftime("%Y-%m-%d %H:%M:%S %z")
rule_meta, produced_groups = parse_rule_metadata(rule_file)
decoder_meta = parse_decoder_metadata(decoder_file)
case_by_id = {case.rule_id: case for case in cases}
all_rule_ids = sorted(rule_meta, key=int)
missing_cases = [rid for rid in all_rule_ids if rid not in case_by_id]
extra_cases = [rid for rid in case_by_id if rid not in rule_meta]

with open(samples_txt, "w", encoding="utf-8") as sample_out:
    for case in cases:
        sample_out.write(f"### {case.rule_id} {case.sample_type}\n")
        for line in case.lines:
            sample_out.write(line + "\n")
        sample_out.write("\n")

results = []
log_parts = []
log_parts.append(f"bGlobal two-file Wazuh rule test run\nStarted: {started}\nContainer: {container}\nRule file: {rule_file}\nDecoder file: {decoder_file}\n")

log_parts.append("Decoder parse listing:\n")
for decoder in decoder_meta:
    log_parts.append(f"- decoder name={decoder['name']}\n")
    for prematch in decoder["prematch"]:
        log_parts.append(f"  prematch={prematch}\n")
    for regex in decoder["regex"]:
        log_parts.append(f"  regex={regex}\n")
    for order in decoder["order"]:
        log_parts.append(f"  order={order}\n")

log_parts.append("\nRule parse listing:\n")
for rid in all_rule_ids:
    meta = rule_meta[rid]
    log_parts.append(f"- {rid}: {meta['description']} | {meta['parent']}\n")

if missing_cases:
    log_parts.append("\nMissing test case definitions: " + ", ".join(missing_cases) + "\n")
if extra_cases:
    log_parts.append("\nCase IDs not present in rule file: " + ", ".join(extra_cases) + "\n")

validation = run_cmd(["docker", "exec", container, "/var/ossec/bin/wazuh-analysisd", "-t"], timeout=120)
log_parts.append("\nWazuh validation command: docker exec " + container + " /var/ossec/bin/wazuh-analysisd -t\n")
log_parts.append(f"Validation exit code: {validation.returncode}\n")
if validation.stdout:
    log_parts.append(validation.stdout + "\n")

for idx, case in enumerate(cases, start=1):
    log_parts.append("\n" + "=" * 88 + "\n")
    log_parts.append(f"CASE {idx}/{len(cases)} rule {case.rule_id}: {case.sample_type}\n")
    log_parts.append("Input lines:\n")
    for line in case.lines:
        log_parts.append(line + "\n")
    try:
        proc = run_logtest(case.lines)
        output = proc.stdout
        actual_ids = phase3_rule_ids(output)
        actual = ",".join(actual_ids) if actual_ids else "(none)"
        if case.rule_id in actual_ids:
            status = case.success_status
            notes = case.notes or "Expected rule appeared in wazuh-logtest Phase 3 output."
        else:
            status = "FAIL"
            notes = case.notes or "Expected rule did not appear in wazuh-logtest Phase 3 output."
        if proc.returncode != 0:
            status = "FAIL"
            notes = f"wazuh-logtest exited {proc.returncode}. {notes}"
        log_parts.append("wazuh-logtest output:\n")
        log_parts.append(output + "\n")
    except subprocess.TimeoutExpired as exc:
        actual = "(timeout)"
        status = "FAIL"
        notes = f"wazuh-logtest timed out after {exc.timeout}s."
        log_parts.append(notes + "\n")
    results.append(
        {
            "rule_id": case.rule_id,
            "description": rule_meta.get(case.rule_id, {}).get("description", ""),
            "category": case.category,
            "parent": rule_meta.get(case.rule_id, {}).get("parent", ""),
            "sample_type": case.sample_type,
            "expected": f"Phase 3 rule id {case.rule_id}",
            "actual": actual,
            "status": status,
            "notes": notes,
        }
    )

for rid in missing_cases:
    results.append(
        {
            "rule_id": rid,
            "description": rule_meta[rid]["description"],
            "category": "(unmapped)",
            "parent": rule_meta[rid]["parent"],
            "sample_type": "(none)",
            "expected": f"Phase 3 rule id {rid}",
            "actual": "(not run)",
            "status": "FAIL",
            "notes": "Rule exists in XML but has no test case definition.",
        }
    )

Path(result_log).write_text("".join(log_parts), encoding="utf-8")

counts = {}
for row in results:
    counts[row["status"]] = counts.get(row["status"], 0) + 1

def esc(value):
    return str(value).replace("|", "\\|").replace("\n", " ")

md = []
md.append("# bGlobal Two-File Rule Coverage\n\n")
md.append(f"Generated: {time.strftime('%Y-%m-%d %H:%M:%S %z')}\n\n")
md.append(f"- Rule file: `{rule_file}`\n")
md.append(f"- Decoder file: `{decoder_file}`\n")
md.append(f"- Wazuh validation exit code: `{validation.returncode}`\n")
md.append(f"- Total rules found: `{len(all_rule_ids)}`\n")
for key in ("PASS", "PASS-CORRELATION", "INDIRECT", "PARTIAL", "NOT-TESTABLE-OFFLINE", "FAIL"):
    md.append(f"- {key}: `{counts.get(key, 0)}`\n")
md.append("\n")
md.append("| Rule ID | Description | Category | Parent SID/group/decoder | Sample type | Expected result | Actual result | Status | Notes/fix needed |\n")
md.append("|---|---|---|---|---|---|---|---|---|\n")
for row in sorted(results, key=lambda r: int(r["rule_id"])):
    md.append(
        "| "
        + " | ".join(
            esc(row[key])
            for key in (
                "rule_id",
                "description",
                "category",
                "parent",
                "sample_type",
                "expected",
                "actual",
                "status",
                "notes",
            )
        )
        + " |\n"
    )
Path(coverage_md).write_text("".join(md), encoding="utf-8")

print(f"Wrote {result_log}")
print(f"Wrote {coverage_md}")
print(f"Wrote {samples_txt}")
print(f"Rules found: {len(all_rule_ids)}")
print("Status counts: " + ", ".join(f"{k}={counts.get(k, 0)}" for k in ("PASS", "PASS-CORRELATION", "INDIRECT", "PARTIAL", "NOT-TESTABLE-OFFLINE", "FAIL")))
if validation.returncode != 0 or counts.get("FAIL", 0):
    sys.exit(1)
PY
