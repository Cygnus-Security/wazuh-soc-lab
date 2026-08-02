# LAB SECURITY — Tổng hợp config & review

> File này tổng hợp toàn bộ cấu hình quan trọng trong 4 folder của đồ án crAPI + Wazuh + IRIS, làm tài liệu tham chiếu giữa các session Cowork.
> Cập nhật: review tính đến 2026-06-18.

## Phạm vi đồ án — 3 tấn công

| # | Attack | OWASP API Top 10 2023 | Trạng thái |
|---|---|---|---|
| 1 | **BOLA** (Broken Object Level Authorization) | API1:2023 | ✅ Rule xong, test xong, report `BOLA_Detection_Report.docx` xong |
| 2 | **Unauthenticated Access** | API2:2023 (broken auth) + missing auth | ✅ Rule xong, test xong, report `UNAUTH~1.docx` xong |
| 3 | **Triggering a Layer 7 DoS via Unrestricted Resource Consumption** | API4:2023 | 🟡 Rule sẵn (110700/704/705/706/707), test PASS wazuh-logtest. Còn lại: kiểm thử thực tế trên crAPI + viết report |

Tất cả rule khác trong `bglobal_crapi_rules.xml` (sensitive path, SSRF, SQLi, JWT alg none, web scanner, PHP-CGI, mass assignment, ...) là **supplementary** — đã viết, đã PASS test, không nằm trong scope báo cáo đồ án.

---

## 0. Topology tổng thể

```
[Attacker / Client]
        |
        |  HTTP :8888 (docker)  hoặc :80 (vagrant)  hoặc NodePort 30080 (k8s)
        v
+-----------------------+        log access_json.log
|  crapi-edge-proxy     |--------------------------+
|  nginx 1.27-alpine    |                          |
|  rate_limit zones     |                          v
+-----------+-----------+                  +---------------+
            |  proxy_pass                  | Wazuh Manager |
            v                              | rules 110700+ |
+-----------------------+                  +-------+-------+
| crapi-web (openresty) |                          |
+-----------+-----------+                          | <integration>
            |                                      |  custom-wazuh_iris
            +--> identity (Java/Spring)            v
            +--> community (Go)              +-----------+
            +--> workshop (Python/Django)    | IRIS DFIR |
            +--> chatbot (Python/Quart)      | dfir-iris |
            +--> mailhog                     +-----------+
            +--> postgres, mongo, chromadb
```

- **Entry duy nhất ở docker:** `10.10.1.130:8888` (crapi-edge-proxy) + `10.10.1.130:8025` (mailhog UI).
- **Networks docker:** `external_net` (chỉ edge-proxy + mailhog), `dmz_net`, `backend_net`, `database_net` (đều `internal: true`).
- **Tích hợp SOC:** mạng `soc_shared` dùng chung Wazuh ↔ IRIS (alias `dfir-iris`).

---

## 1. crAPI services (`X:\services`)

### 1.1 Stack
| Service | Ngôn ngữ / Framework | File router chính |
|---|---|---|
| `community` | Go (gorilla/mux + GORM) | `api/router/routes.go` |
| `identity` | Java 17 / Spring Boot 3 + Spring Security | `controller/*.java` |
| `workshop` | Python 3 / Django + DRF | `crapi/*/urls.py` |
| `chatbot` | Python 3 / Quart + MongoDB + ChromaDB | `src/chatbot/chat_api.py` |
| `web` | React/TypeScript (front-end) | — |

### 1.2 Rate-limit application layer — **ZERO**
- Grep toàn bộ non-vendor cho `rate_limit / throttle / RateLimit / 429 / bucket / sliding.window`: 0 hit code thật.
- `community/middlewares.go`: chỉ CORS + JWT auth.
- `identity/WebSecurityConfig.java`: chỉ `JwtAuthTokenFilter` + auth rules.
- `workshop/crapi_site/settings.py`: thiếu `DEFAULT_THROTTLE_CLASSES`, không cài `django-ratelimit`.
- `chatbot/app.py`: chỉ `quart_cors`.

**Defense duy nhất:** business counter trong `OtpServiceImpl.secureValidateOtp` cho `/v3/check-otp` — 10 lần sai → 503 `EXCEED_NUMBER_OF_ATTEMPS`. Endpoint `/v2/check-otp` cố ý để vulnerable.

### 1.3 Endpoint nhạy cảm (thiếu rate-limit)

| Method | Path | Service | Rủi ro DoS |
|---|---|---|---|
| POST | `/identity/api/auth/login` | identity | Credential brute-force |
| POST | `/identity/api/auth/signup` | identity | Account spam |
| POST | `/identity/api/auth/forget-password` | identity | Mail flood + account enum |
| POST | `/identity/api/auth/v2/check-otp` | identity | OTP brute (4 chữ số → 10⁴) |
| POST | `/identity/api/auth/v3/check-otp` | identity | Lockout 10 attempt nhưng không có IP throttle |
| POST | `/identity/api/auth/verify` | identity | — |
| POST | `/identity/api/auth/v4.0/user/login-with-token` | identity | — |
| POST | `/identity/api/v2/user/reset-password` | identity | — |
| POST | `/identity/api/v2/user/change-email` | identity | Mail flood |
| POST | `/identity/api/v2/user/change-phone-number` | identity | SMS flood |
| POST | `/identity/api/v2/user/verify-email-token` | identity | — |
| POST | `/identity/api/v2/user/verify-phone-otp` | identity | — |
| POST | `/identity/api/v2/vehicle/resend_email` | identity | Mail flood (không cooldown) |
| POST | `/community/api/v2/community/posts` | community | Spam posts |
| POST | `/community/api/v2/coupon/validate-coupon` | community | Coupon code brute |
| POST | `/workshop/api/merchant/contact_mechanic` | workshop | **SSRF amplifier — `number_of_repeats` cap 100** |
| POST | `/chatbot/genai/ask` | chatbot | LLM cost DoS |

### 1.4 File mốc tham chiếu
- `X:\services\community\api\router\routes.go`, `api/middlewares/middlewares.go`
- `X:\services\identity\src\main\java\com\crapi\controller\{AuthController,ChangeEmailController,ChangePhoneController,UserController,VehicleController}.java`
- `X:\services\identity\src\main\java\com\crapi\config\WebSecurityConfig.java`
- `X:\services\identity\src\main\java\com\crapi\service\Impl\OtpServiceImpl.java` (counter 10-attempt)
- `X:\services\workshop\crapi_site\settings.py`, `crapi\merchant\views.py`
- `X:\services\chatbot\src\chatbot\chat_api.py`, `app.py`

---

## 2. crAPI deploy (`X:\deploy`)

### 2.1 Cây thư mục
```
X:\deploy\
├── docker\
│   ├── docker-compose.yml          (~538 lines, edge-proxy + 7 services + 4 wazuh-agent)
│   ├── .env                        (TLS_ENABLED=true, LISTEN_IP=127.0.0.1)
│   ├── edge-proxy\nginx.conf       (rate limit + log JSON)
│   ├── keys\jwks.json
│   ├── logs\{edge-proxy,crapi-web}\
│   ├── wazuh-agent\*.conf
│   └── build-all.sh, manifest.sh, publish-all.sh
├── helm\          (values.yaml, values-tls/safe/pv.yaml, templates\)
├── k8s\base\      (full manifests + deploy.sh)
├── k8s\minikube\  (NodePort override cho web, mailhog)
└── vagrant\       (provisioner.sh, crapi.service)
```

### 2.2 Edge-proxy nginx.conf (docker)

**Rate-limit zones:**
```nginx
limit_req_zone $binary_remote_addr zone=api_per_ip:10m  rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth_per_ip:10m rate=2r/s;
limit_conn_zone $binary_remote_addr zone=conn_per_ip:10m;
limit_req_status 429;
limit_conn_status 429;
```

**Áp dụng:**
- `location ~* ^/identity/api/.*/(login|check-otp|reset|token|verify|signup)`: `limit_req zone=auth_per_ip burst=10 nodelay; limit_conn conn_per_ip 10;`
- `location /`: `limit_req zone=api_per_ip burst=30 nodelay; limit_conn conn_per_ip 20;`

**Đặc điểm:**
- Key theo `$binary_remote_addr` (IP TCP thật) — **không** tin XFF client.
- `nodelay`: burst đi qua tức thì.
- Log JSON ra `/var/log/nginx/access_json.log`: chứa `src_ip, xff, method, uri_path, http_status, limit_req_status, limit_conn_status, auth_present, is_ddos, is_auth_api, is_attack_uri, is_security`.
- `cookie_raw` cũng được log — risk lộ session.
- Chỉ listen :80 plaintext, không TLS.

**GAP regex auth (rate-limit bypass cổng hợp pháp):** regex `(login|check-otp|reset|token|verify|signup)` **không có** `forget-password`, `change-email`, `change-phone-number`, `verify-email-token`, `verify-phone-otp`, `resend_email`. Các path này rớt vào `location /` (10r/s) thay vì `auth_per_ip` (2r/s).

**Thiếu:** `client_body_timeout`, `client_header_timeout`, `keepalive_timeout`, `send_timeout`, `worker_connections` — slow-rate DoS (slowloris) không có defense.

### 2.3 docker-compose ports

| Service | Bind | Network |
|---|---|---|
| crapi-edge-proxy | `10.10.1.130:8888 → 80` | external_net + dmz_net |
| mailhog | `10.10.1.130:8025 → 8025` | external_net + dmz_net + database_net |
| Mọi service crapi-* khác | (none) | backend_net / database_net `internal: true` |

### 2.4 Resource limit

| Service | docker-compose | k8s base |
|---|---|---|
| crapi-web | 0.3 CPU / 128M | 500m CPU req 256m, no mem |
| crapi-identity | 0.8 CPU / 384M | 500m CPU req 256m, no mem |
| crapi-community | 0.3 CPU / 192M | 500m CPU req 256m, no mem |
| crapi-workshop | 0.3 CPU / 128M | 256m CPU, no mem |
| crapi-chatbot | (none) | 500m CPU req 256m, **no mem** |
| crapi-edge-proxy | (none) | (n/a) |
| postgresdb | 0.5 CPU / 256M | (not set) |
| mongodb | 0.3 CPU / 128M | (not set) |

**OOM risk cao:** chatbot, edge-proxy docker, mọi pod k8s không cap memory.

### 2.5 GAP đa môi trường

1. **Helm và K8s KHÔNG có edge-proxy** → rate-limit hoàn toàn vắng mặt.
2. K8s expose `crapi-web` trực tiếp NodePort 30080, chatbot 30500, mailhog 30025 → bypass edge-proxy.
3. Vagrant `provisioner.sh` dòng 43-44 đổi bind từ `10.10.1.130:8888:80` → `80:80` ALL interfaces.
4. `values.yaml` mặc định bật `enableLog4j=true`, `enableShellInjection=true`. `values-safe.yaml` mới tắt.
5. Edge-proxy nginx.conf chỉ HTTP plaintext dù `.env TLS_ENABLED=true`.
6. Chỉ 1 upstream `crapi-web:80` không có failover / max_fails — edge-proxy crash loop khi backend chưa resolve.

### 2.6 File log đã quan sát (bằng chứng test trước)
- `logs/edge-proxy/access.log`: ~94k entries, từ recon `.env`, ZAP scan.
- `logs/edge-proxy/error.log`: burst `api_per_ip excess ~30` (DoS test 16/06/2026).
- `logs/crapi-web/error.log`: ZAP markers (`zap1888342429624692424`), path traversal probes.

---

## 3. Wazuh lab (`\\wsl.localhost\ubuntu\home\tad\Lab_Security\wazuh-lab`)

### 3.1 Cây thư mục cô đọng
```
wazuh-lab/
├── single-node/
│   ├── bglobal_crapi_rules.xml                  (rule chính, ~1032 dòng, 61 rules)
│   ├── bglobal_crapi_rules.xml.bak.20260521_032955
│   ├── bglobal_crapi_rules.xml.bak.20260521_035727
│   ├── bglobal_crapi_rules.xml.bak.20260611_224657
│   ├── custom_decoders/
│   │   ├── bglobal_sql_decoders.xml             (nginx-json-access + postgresql + BOLA/UNAUTH)
│   │   └── *.bak
│   ├── local_rules.xml
│   ├── custom-wazuh_iris                        (python integration script)
│   ├── custom-wazuh_iris.bak.* (3 backup)
│   ├── persistent_iris/
│   │   ├── ossec.conf.iris                      (block <integration> sang IRIS)
│   │   └── custom-wazuh_iris
│   ├── config/wazuh_cluster/wazuh_manager.conf
│   ├── config/wazuh_dashboard/{opensearch_dashboards.yml, wazuh.yml}
│   ├── config/wazuh_indexer/{wazuh.indexer.yml, internal_users.yml}
│   ├── docker-compose.yml (+ 4 .bak)
│   ├── Dockerfile.wazuh-{manager,indexer,dashboard}-local
│   ├── test_bglobal_*.sh                        (6 test script)
│   ├── bglobal_*_rule_test_results.log
│   ├── bglobal_wazuh_rule_coverage.md
│   ├── bglobal_two_files_rule_coverage.md
│   ├── bglobal_json_db_rule_summary.md
│   ├── bglobal_wazuh_rule_tests.md
│   ├── bglobal_two_files_test_samples.txt
│   └── tools/{fix_iris_ossec.py, normalize_ossec_iris.py}
├── wazuh-agent/{docker-compose.yml, config/wazuh-agent-conf}
├── build-docker-images/  (Dockerfile manager/agent/dashboard, filebeat.yml)
├── docs/  (mdBook)
└── .github/workflows/
```

### 3.2 Rules theo 3 nhóm tấn công đồ án

#### 🎯 ATTACK 1 — BOLA (✅ Done)
| ID | Level | Mô tả |
|---|---|---|
| 110100 | 8 | BOLA 2xx/3xx object ID access |
| 110104 | 8 | BOLA 4xx |
| 110105 | 9 | BOLA 5xx |
| 110101 | 13 | Correlation: 10 req/300s same src_ip |
| 110120 | 8 | Vehicle UUID location 2xx |
| 110121 | 10 | Vehicle UUID location 4xx |
| 110122 | 13 | Correlation UUID: 5/120s |
| 110140 | 8 | BOLA query-param ID (`report_id, order_id, ...`) |
| 110141 | 13 | Correlation query-param: 10/60s |
| 110126 | 12 | BOLA_ATTEMPT confirmed (decoded log marker) |
| 110130 | 10 | REST method abuse (PUT/PATCH/DELETE object) 2xx/3xx |
| 110131 | 10 | REST method abuse 4xx |
| 110400 | 10 | BFLA Admin endpoint 2xx/3xx |
| 110401 | 8 | BFLA Admin endpoint 4xx |
| 110402 | 12 | Correlation admin probe: 5/120s |

#### 🎯 ATTACK 2 — Unauthenticated Access (✅ Done)
| ID | Level | Mô tả |
|---|---|---|
| 110701 | 10 | **Unauthenticated API Access** (`auth_present=false`) — rule chính |
| 110150 | 10 | UNAUTH_ACCESS marker |
| 110151 | 14 | Correlation API enumeration: 10/60s |
| 110200 | 6 | Login/verify failure (auth fail) |
| 110206 | 6 | Auth endpoint failure non-404 |
| 110201 | 12 | Correlation auth fail: 5/120s |
| 110202 | 3 | Login attempt 2xx |
| 110203 | 10 | Correlation high-rate login: 20/300s |
| 110204 | 9 | Unknown auth path 404 |
| 110205 | 11 | Correlation auth scan: 10/300s |
| 110702 | 6 | Auth=true rejected 401/403 (JWT tampering) |
| 110703 | 12 | Correlation rejected JWT: 8/120s |

#### 🎯 ATTACK 3 — Triggering a Layer 7 DoS via Unrestricted Resource Consumption (🟡 In progress)
| ID | Level | Mô tả | Threshold |
|---|---|---|---|
| 110700 | 3 | Base nginx JSON access log | `decoded_as=json AND match request_id` |
| 110704 | 10 | **L7 HTTP Flood** | freq=120, timeframe=10s, ignore=60, same `src_ip` |
| 110705 | 10 | **L7 Endpoint Hammering** | freq=60, timeframe=10s, same `src_ip + uri_path` |
| 110706 | 3 | Base OTP/reset endpoint detect | path `/identity/api/auth/(forget-password|v\d+/(check-otp|reset-password))` |
| 110707 | 12 | **OTP/Email Spam (Missing Rate Limit)** | freq=6, timeframe=60s, same `src_ip` |

---

### 3.2.X Supplementary rules (out of scope đồ án — đã viết, đã PASS)

#### Sensitive path probing
| 110102 | 8 | `/.env /.git /swagger ...` 2xx/3xx |
| 110106 | 8 | sensitive 4xx |
| 110107 | 9 | sensitive 5xx |
| 110103 | 12 | Correlation: 10/300s |

#### SSRF
| 110300 | 10 | contact_mechanic SSRF 2xx/3xx |
| 110301 | 10 | contact_mechanic SSRF 4xx |

#### SQLi / NoSQLi
| 110310 | 10 | URL injection pattern 2xx/3xx |
| 110311 | 10 | URL injection pattern 4xx |

#### JWT alg:none
| 110500 | 12 | alg none indicator 2xx/3xx |
| 110501 | 12 | alg none indicator 4xx |

#### Mass Assignment / BOPLA
| 110510 | 10 | over-posting field 2xx/3xx |
| 110511 | 10 | over-posting field 4xx |

#### Web scanner / recon
| 110600 | 7 | Scanner User-Agent |
| 110610 | 9 | Upload plugin probe 4xx |
| 110611 | 12 | Upload plugin 2xx |
| 110612 | 12 | Correlation upload probe: 5/120s |
| 110620 | 8 | PHP/CMS path enum 404 |
| 110621 | 11 | Correlation PHP enum: 10/120s |
| 110630 | 7 | Suspicious HTTP method (TRACE/DEBUG/...) |
| 110640 | 10 | Generic exploit indicator in URL |
| 110650 | 8 | Scanner in raw nginx warning log |
| 110651 | 10 | Exploit payload in raw nginx warning |
| 110660 | 8 | VCS path probing |
| 110661 | 12 | Correlation VCS: 5/120s |
| 110662 | 9 | Secret key/config probing |
| 110663 | 12 | Correlation secret probe: 5/120s |
| 110664 | 10 | Cloud metadata probing |
| 110665 | 13 | Correlation cloud meta: 3/120s |
| 110666 | 8 | Framework fingerprinting |
| 110667 | 11 | Correlation framework fingerprint: 5/120s |
| 110668 | 8 | CMS config probing |
| 110669 | 11 | Correlation CMS probe: 5/120s |
| 110670 | 9 | PHP tooling probe |
| 110671 | 12 | Correlation PHP tooling: 5/120s |
| 110672 | 10 | PHP-CGI option injection |
| 110673 | 10 | PHP-CGI option injection URL |
| 110674 | 13 | Correlation PHP-CGI inject: 3/120s |
| 110675 | 7 | High-entropy path fuzzing |
| 110676 | 10 | Correlation high-entropy: 10/120s |
| 110677 | 7 | Common discovery file probe |
| 110678 | 8 | Correlation discovery probe: 5/120s |
| 110679 | 8 | Multiple HTTP 400 burst |

#### PostgreSQL / MongoDB
| 110800 | 0 | PostgreSQL base |
| 110801 | 12 | SQLi pattern in SQL text |
| 110802 | 12 | Mass assignment write privileged col |
| 110803 | 10 | PostgreSQL syntax error (SQLi probing) |
| 110830 | 0 | MongoDB JSON base |
| 110831 | 12 | NoSQLi `$where/$ne/$gt/...` in MongoDB cmd |

> ↑ Tất cả rule trên là **supplementary** — vẫn hữu ích để defense-in-depth nhưng không nằm trong scope báo cáo đồ án.

### 3.3 Decoder
**File:** `single-node/custom_decoders/bglobal_sql_decoders.xml`
- `nginx-json-access`: parse `src_ip, method, uri_path, http_status, auth_present` từ JSON edge-proxy. **Không tách XFF.**
- `postgresql`: parse PostgreSQL statement.
- `BOLA_ATTEMPT / UNAUTH_ACCESS`: parse log do app emit có marker.

### 3.4 Wazuh manager config (`single-node/config/wazuh_cluster/wazuh_manager.conf`)
- `<remote>`: TCP :1514
- `<auth>`: :1515 (no password)
- `<cluster>`: name=`wazuh`, disabled=`yes`
- `<vulnerability-detection>`: enabled
- `<rootcheck>, <syscheck>, <syscollector>, <sca>`: enabled
- `<ruleset>`: thêm `etc/decoders`, `etc/rules` (user-defined)
- `<active-response>` block: **commented-out** — command `firewall-drop, host-deny, route-null, disable-account, restart-wazuh, netsh, win_route-null` đã define nhưng KHÔNG hook tới rule nào.
- `<rule_test>`: enabled (port 1517 mặc định)
- **Thiếu:** `<localfile>` đọc `access_json.log` của crAPI edge-proxy.

### 3.5 Wazuh agent config (`wazuh-agent/config/wazuh-agent-conf`)
- `<client><server>` placeholder `CHANGE_MANAGER_IP / PORT`.
- `<enrollment>` placeholder `CHANGE_*`.
- `<localfile>` chỉ có `df -P`, `netstat`, `last -n 20`, và `active-responses.log`.
- **Thiếu:** `<localfile>` đọc `/var/log/nginx/access_json.log` (log edge-proxy crAPI).
- `<active-response disabled=no>` nhưng không command nào hook tới DoS rule.

### 3.6 Tích hợp Wazuh → IRIS
**File:** `single-node/persistent_iris/ossec.conf.iris` — block `<integration>`:
```xml
<integration>
  <name>custom-wazuh_iris</name>
  <hook_url>https://dfir-iris:8443/alerts/add?cid=1</hook_url>
  <level>10</level>
  <group>bglobal,crapi</group>
  <alert_format>json</alert_format>
</integration>
```
- Script `custom-wazuh_iris` (python) ở cùng folder + 3 backup.
- **Chưa hoàn chỉnh:** `IRIS_ADM_API_KEY` chưa được set/commit vào script.

### 3.7 Test coverage (tóm tắt từ `bglobal_*_rule_coverage.md`)
- Rule 110700–110707 đều **PASS** trong wazuh-logtest.
- Tổng số rule đã test: 61/61 (xem `bglobal_json_db_rule_summary.md`).

### 3.8 GAP Wazuh
1. **Không thấy `<localfile>` cho `access_json.log`** — log có thực sự đến manager không? Cần verify dashboard.
2. **Decoder không extract XFF** — nếu có LB phía trước, `src_ip` collapse → false negative DoS.
3. **Rule 110701 thiếu `<if_sid>110700</if_sid>`** — có thể match nhầm log khác có chuỗi `auth_present:false`.
4. **Rule 110700 dùng `<match>request_id</match>`** — nếu app khác cũng có field `request_id` sẽ trigger base nhầm.
5. **Active-response chưa hook** — phát hiện không tự chặn.
6. **Threshold 110704 = 120 req/10s** quá cao cho distributed attack (5 req × 30 IP → bypass).
7. **Không có rule** cho slow-rate DoS, XFF rotation, burst 429.
8. **Nhiều file `.bak`** còn sót (3× rule XML, 4× docker-compose, 3× custom-wazuh_iris).

---

## 4. IRIS DFIR (`\\wsl.localhost\ubuntu\home\tad\Lab_Security\iris-web`)

### 4.1 Overview
- **DFIR-IRIS v2.4.20** — Flask + PostgreSQL + RabbitMQ/Celery + NGINX.
- 5 services Docker: `app` (web/API :8000), `db`, `rabbitmq`, `worker`, `nginx` (HTTPS :8443).
- Alias network: `dfir-iris` trên `soc_shared` (external network dùng chung với Wazuh).

### 4.2 Cây cô đọng
```
iris-web/
├── docker-compose.yml          (production, image ghcr.io)
├── docker-compose.base.yml
├── docker-compose.dev.yml      (build local)
├── .env / .env.model           (NGINX/DB/IRIS/LDAP/OIDC)
├── CONFIGURATION.md
├── certificates/, deploy/
└── source/
    ├── requirements.txt        (bao gồm iris_webhooks_module-1.0.8)
    ├── app/
    │   ├── alembic/versions/   (~40 migrations)
    │   ├── blueprints/
    │   │   ├── alerts/alerts_routes.py   (POST /alerts/add, escalate, merge)
    │   │   ├── case/, api/, manage/, graphql/, dashboard/, search/, datastore/
    │   ├── datamgmt/alerts/
    │   ├── iris_engine/
    │   │   ├── module_handler/   (call_modules_hook on_postload_alert_*)
    │   │   ├── tasker/celery.py
    │   │   └── access_control/oidc_handler.py
    │   ├── models/alerts.py, cases.py, authorization.py
    │   ├── schema/marshables.py  (AlertSchema, CaseSchema)
    │   └── dependencies/*.whl   (vt, misp, webhooks, evtx, intelowl)
    └── tests/
```

### 4.3 Alert schema (`source/app/models/alerts.py`)
- `Alert`: `alert_title, alert_description, alert_source` (vd "Wazuh"), `alert_source_ref` (rule_id), `alert_source_link`, `alert_source_content` (JSON event đầy đủ), `alert_severity_id`, `alert_status_id`, `alert_context` (JSON — `srcip, dstport, request_count, ...`), `alert_tags`, `alert_customer_id`, `alert_classification_id`, `alert_resolution_status_id`.
- Có `SimilarAlertsCache + AlertSimilarity` — IRIS dedupe alerts cùng IOC/asset.
- Pipeline hooks: `call_modules_hook('on_postload_alert_create' / _update / _escalate / _merge / _delete / _commented)`.

### 4.4 API ingest
- `POST /alerts/add` (decorator `@ac_api_requires(Permissions.alerts_write)`) — cần API key.
- Endpoint escalate alert → case: `/alerts/escalate/<id>`.
- Merge vào case sẵn có: `/alerts/merge/<id>`.

### 4.5 GAP IRIS
1. **Grep `wazuh|crapi` toàn repo = 0 hit** — IRIS chưa có config native Wazuh.
2. **`IRIS_ADM_API_KEY` trong `.env` đang comment** → script Wazuh forward sẽ 401.
3. Wazuh manager cần join network `soc_shared` để gọi hostname `dfir-iris`.
4. Chưa có mapping Wazuh rule_id → IRIS classification/severity.
5. **IRIS không có rate-limit Flask** — chính IRIS có thể bị DoS.
6. `iris_webhooks_module-1.0.8` đã cài nhưng chưa cấu hình endpoint.

---

## 5. Tổng hợp findings — L7 DoS (API4:2023 Unrestricted Resource Consumption)

> **Phạm vi kiểm thử:** chỉ Layer 7 — Application Layer DoS. Không bao gồm Layer 4 / Layer 3 / connection-layer (slowloris, SYN flood, UDP amp, v.v.).
> **Tham chiếu OWASP API Security Top 10 2023:** API4 — Unrestricted Resource Consumption.

### 5.1 Theo 4 tầng phòng thủ

| Tầng | Hiện trạng | Gap chính |
|---|---|---|
| **L1 App** | 0 rate-limit ở Java/Go/Python/chatbot | Chỉ counter 10-attempt `/v3/check-otp` |
| **L2 Edge** | nginx docker OK (10r/s api, 2r/s auth) | Regex auth thiếu `forget-password, change-email, change-phone, resend_email`. Helm/K8s KHÔNG có edge-proxy |
| **L3 Wazuh** | 4 rule DoS PASS test (110704/705/706/707) | Log ingest `access_json.log` chưa verify. Decoder không tách XFF. Active-response chưa hook. Threshold cao |
| **L4 IRIS** | Script integration có sẵn | `IRIS_ADM_API_KEY` chưa set → alert không sang IRIS |

### 5.2 Kịch bản L7 DoS — Unrestricted Resource Consumption (API4:2023)

**Phạm vi:** chỉ tấn công tầng ứng dụng — 1 request HTTP hợp lệ kích hoạt backend cost cao (mail, SMS, LLM, fan-out request, DB query). Không có connection-layer / network-layer DoS.

| KB | Tên kịch bản | Endpoint | Cơ chế resource consumption | Rule kỳ vọng |
|---|---|---|---|---|
| **A** | OTP/Reset spam | `POST /identity/api/auth/forget-password` | Mỗi req → `SMTPMailServer.sendMail` (tốn SMTP + DB write OTP). Không cooldown | 110706 base → 110707 correlation (6/60s) |
| **B** | Mail/SMS flood ngoài OTP regex | `POST /identity/api/v2/user/change-email`, `/change-phone-number`, `/vehicle/resend_email` | Cùng cơ chế send mail nhưng nginx không xếp vào auth zone (10r/s thay vì 2r/s) | Chỉ 110704/110705 nếu đạt ngưỡng. **Không** 110707 → gap rule mở rộng |
| **C** | SSRF amplifier DoS | `POST /workshop/api/merchant/contact_mechanic` với `repeat_request_if_failed=true & number_of_repeats=100` | 1 req → 100 outbound HTTP đi nội bộ. Vừa DoS chính crAPI vừa flood target ngoài | **Không rule nào bắt** — gap nghiêm trọng |
| **D** | LLM cost DoS | `POST /chatbot/genai/ask` với prompt dài/lặp | Mỗi req gọi LLM upstream (OpenAI/Anthropic) → tốn token thật + chiếm chatbot worker | **Không rule nào bắt** — gap |
| **E** | HTTP flood baseline 1 IP | Bất kỳ endpoint `/community/api/v2/community/posts/recent` | 100+ req/10s từ 1 IP | 110704 (120/10s) + 110705 (60/10s same uri) |
| **F** | Distributed flood multi-IP | Cùng endpoint KB-E nhưng từ ≥10 IP, mỗi IP 5 req/s | Tổng tải vẫn cao nhưng mỗi `src_ip` dưới ngưỡng | nginx + Wazuh **đều mù** → gap correlation cần `same_field=uri_path` only |

**Ưu tiên demo:** KB-A (chứng minh rule có hoạt động) → KB-B (chứng minh gap regex auth) → KB-C (chứng minh gap rule SSRF amplifier) → KB-D (chứng minh gap LLM cost) → KB-E (baseline) → KB-F (distributed bypass).

---

## 6. Checklist 8 bước trước khi kiểm thử thực tế

1. **Verify ingest log**: dashboard Wazuh query `rule.id:110700` — nếu 0 hit, thêm `<localfile>` đọc `/var/log/nginx/access_json.log` trong agent chạy cùng edge-proxy.
2. **Fix rule 110701**: thêm `<if_sid>110700</if_sid>`.
3. **Set IRIS_ADM_API_KEY**: generate trong IRIS UI → paste vào `persistent_iris/ossec.conf.iris`. Đảm bảo Wazuh manager join `soc_shared`.
4. **Test forward Wazuh → IRIS**: trigger 110707, verify alert xuất hiện trong IRIS UI (client_id=1).
5. **Dọn `.bak` files** sau khi rule mới ổn (3× rule XML, 4× compose, 3× iris script).
6. **(Optional) Active-response**: hook `firewall-drop timeout=600` cho 110704/110707 nếu yêu cầu đồ án có phần Response.
7. **Bổ sung test sample mới** trong `bglobal_two_files_test_samples.txt` cho 6 KB L7 DoS (A-F). Mỗi KB cần 1 sample fire base rule và 1 sample multi-event để kích hoạt correlation.
8. **Báo cáo gap rule** trong report — đề xuất rule L7 DoS chưa viết:
   - **Mail-flood mở rộng** (110708 đề xuất): cover `change-email, change-phone-number, verify-email-token, verify-phone-otp, resend_email` — frequency thấp (~6/60s).
   - **SSRF amplifier abuse** (110709 đề xuất): detect `contact_mechanic` POST có `number_of_repeats > 10` trong body. Cần decoder body hoặc app log của workshop service.
   - **LLM cost DoS** (110710 đề xuất): detect spam `/chatbot/genai/ask` từ same `src_ip` ≥ 10 req/60s, hoặc request_length lớn bất thường.
   - **Distributed flood** (110711 đề xuất): correlation theo `same_field=uri_path` (KHÔNG same_field=src_ip) — detect tổng traffic cao tới 1 endpoint từ nhiều IP.
   - **Burst-429 detector** (110712 đề xuất): correlate ≥ 20 event với `limit_req_status=429` trong 30s → bằng chứng attacker đang test bypass.

---

## 7. File quan trọng cần biết (đường dẫn tuyệt đối)

### crAPI services
- `X:\services\identity\src\main\java\com\crapi\config\WebSecurityConfig.java`
- `X:\services\identity\src\main\java\com\crapi\service\Impl\OtpServiceImpl.java`
- `X:\services\workshop\crapi\merchant\views.py`
- `X:\services\community\api\router\routes.go`
- `X:\services\chatbot\src\chatbot\chat_api.py`

### crAPI deploy
- `X:\deploy\docker\docker-compose.yml`
- `X:\deploy\docker\edge-proxy\nginx.conf`
- `X:\deploy\docker\.env`
- `X:\deploy\docker\logs\edge-proxy\access_json.log`
- `X:\deploy\docker\logs\edge-proxy\error.log`
- `X:\deploy\helm\values.yaml`, `values-safe.yaml`
- `X:\deploy\k8s\base\deploy.sh`
- `X:\deploy\vagrant\provisioner.sh`

### Wazuh lab
- `\\wsl.localhost\ubuntu\home\tad\Lab_Security\wazuh-lab\single-node\bglobal_crapi_rules.xml` (rule chính, DoS rules dòng 887–937)
- `\\wsl.localhost\ubuntu\home\tad\Lab_Security\wazuh-lab\single-node\custom_decoders\bglobal_sql_decoders.xml`
- `\\wsl.localhost\ubuntu\home\tad\Lab_Security\wazuh-lab\single-node\config\wazuh_cluster\wazuh_manager.conf`
- `\\wsl.localhost\ubuntu\home\tad\Lab_Security\wazuh-lab\wazuh-agent\config\wazuh-agent-conf`
- `\\wsl.localhost\ubuntu\home\tad\Lab_Security\wazuh-lab\single-node\persistent_iris\ossec.conf.iris`
- `\\wsl.localhost\ubuntu\home\tad\Lab_Security\wazuh-lab\single-node\custom-wazuh_iris`
- `\\wsl.localhost\ubuntu\home\tad\Lab_Security\wazuh-lab\single-node\bglobal_two_files_test_samples.txt`
- `\\wsl.localhost\ubuntu\home\tad\Lab_Security\wazuh-lab\single-node\bglobal_json_db_rule_summary.md`
- `\\wsl.localhost\ubuntu\home\tad\Lab_Security\wazuh-lab\single-node\test_bglobal_json_db_rules.sh`

### IRIS DFIR
- `\\wsl.localhost\ubuntu\home\tad\Lab_Security\iris-web\.env`
- `\\wsl.localhost\ubuntu\home\tad\Lab_Security\iris-web\docker-compose.yml`
- `\\wsl.localhost\ubuntu\home\tad\Lab_Security\iris-web\source\app\blueprints\alerts\alerts_routes.py`
- `\\wsl.localhost\ubuntu\home\tad\Lab_Security\iris-web\source\app\models\alerts.py`
- `\\wsl.localhost\ubuntu\home\tad\Lab_Security\iris-web\CONFIGURATION.md`

---

## 8. Lưu ý cho session sau

- Khi mở Cowork session mới, **attach folder chứa file này** (vd attach `wazuh-lab` hoặc copy file ra ổ local).
- Gửi câu mở đầu: *"Đọc `LAB_CONFIG_REVIEW.md`, mình tiếp tục từ checklist 8 bước. Bước [X] đã xong, [Y] đang làm."*
- Mount folder `wazuh-lab` qua **drive letter map** (vd `W:\`) thay vì `\\wsl.localhost\...` để bash sandbox không hỏng (xem issue UNC path đã gặp).
- 2 file `.docx` báo cáo (BOLA, UNAUTH) chưa đọc được trong session này do bash hỏng — nếu cần học theo template, save sang `.txt` hoặc paste nội dung vào chat.
