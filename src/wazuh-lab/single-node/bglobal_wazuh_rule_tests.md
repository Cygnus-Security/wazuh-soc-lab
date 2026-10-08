# bGlobal crAPI Wazuh Rule Test Matrix

Decoded field baseline from `wazuh-logtest` for Apache/Nginx-style access logs:

- Parent decoder: `web-accesslog`
- HTTP status code field: `id`
- HTTP method field: `protocol`
- URL field: `url`
- Source IP field: `srcip`

| Test # | Test name | Raw access log line | Expected rule ID | Expected description | Rule category | IoC/IoA/TTP type |
|---:|---|---|---:|---|---|---|
| 1 | BOLA numeric object access 2xx | `10.10.1.1 - - [21/May/2026:10:00:00 +0000] "GET /api/users/123 HTTP/1.1" 200 123 "-" "PostmanRuntime/7.39.0"` | 110100 | bGlobal: BOLA/IDOR API Object ID Access Pattern Detected - 2xx/3xx | BOLA / IDOR | IoA |
| 2 | BOLA numeric object access 4xx | `10.10.1.1 - - [21/May/2026:10:00:01 +0000] "GET /api/users/999 HTTP/1.1" 403 123 "-" "PostmanRuntime/7.39.0"` | 110104 | bGlobal: BOLA/IDOR API Object ID Access Pattern Detected - 4xx | BOLA / IDOR | IoA |
| 3 | BOLA with crAPI identity prefix | `10.10.1.1 - - [21/May/2026:10:00:02 +0000] "GET /identity/api/v2/user/123 HTTP/1.1" 403 123 "-" "PostmanRuntime/7.39.0"` | 110104 | bGlobal: BOLA/IDOR API Object ID Access Pattern Detected - 4xx | BOLA / IDOR | IoA |
| 4 | UUID vehicle location 2xx | `10.10.1.1 - - [21/May/2026:10:00:03 +0000] "GET /identity/api/v2/vehicle/550e8400-e29b-41d4-a716-446655440000/location HTTP/1.1" 200 123 "-" "PostmanRuntime/7.39.0"` | 110120 | bGlobal: Possible BOLA/IDOR - Vehicle Location Object Access - 2xx/3xx | BOLA / IDOR | IoA |
| 5 | UUID vehicle location 403 | `10.10.1.1 - - [21/May/2026:10:00:04 +0000] "GET /identity/api/v2/vehicle/550e8400-e29b-41d4-a716-446655440000/location HTTP/1.1" 403 123 "-" "PostmanRuntime/7.39.0"` | 110121 | bGlobal: Possible BOLA/IDOR - Failed Vehicle Location Object Access | BOLA / IDOR | IoA |
| 6 | Sensitive path probing .env | `10.10.1.1 - - [21/May/2026:10:00:05 +0000] "GET /.env HTTP/1.1" 404 123 "-" "Mozilla/5.0"` | 110106 | bGlobal: T1595 - Suspicious API/Web Sensitive Path Probing - 4xx | API reconnaissance | IoC |
| 7 | Swagger/API docs probing | `10.10.1.1 - - [21/May/2026:10:00:06 +0000] "GET /api-docs HTTP/1.1" 404 123 "-" "Mozilla/5.0"` | 110106 | bGlobal: T1595 - Suspicious API/Web Sensitive Path Probing - 4xx | API reconnaissance | IoC |
| 8 | Auth failure | `10.10.1.1 - - [21/May/2026:10:00:07 +0000] "POST /identity/api/auth/login HTTP/1.1" 401 123 "-" "PostmanRuntime/7.39.0"` | 110200 | bGlobal: crAPI Web Authentication Failure Detected | Authentication abuse | IoA |
| 9 | Auth endpoint scanning | `10.10.1.1 - - [21/May/2026:10:00:08 +0000] "POST /identity/api/auth/admin HTTP/1.1" 404 123 "-" "PostmanRuntime/7.39.0"` | 110204 | bGlobal: Possible Authentication Endpoint Scanning Against crAPI Identity API | Authentication reconnaissance | IoA |
| 10 | BFLA admin successful access | `10.10.1.1 - - [21/May/2026:10:00:09 +0000] "GET /identity/api/v2/admin/users HTTP/1.1" 200 123 "-" "PostmanRuntime/7.39.0"` | 110400 | bGlobal: Possible BFLA - Access to Admin/Internal/Management Endpoint | BFLA | IoA |
| 11 | BFLA admin probing | `10.10.1.1 - - [21/May/2026:10:00:10 +0000] "GET /identity/api/v2/admin/users HTTP/1.1" 403 123 "-" "PostmanRuntime/7.39.0"` | 110401 | bGlobal: Possible BFLA/Admin Endpoint Probing | BFLA | IoA |
| 12 | REST method abuse DELETE | `10.10.1.1 - - [21/May/2026:10:00:11 +0000] "DELETE /identity/api/v2/user/123 HTTP/1.1" 403 123 "-" "PostmanRuntime/7.39.0"` | 110131 | bGlobal: Possible Broken Access Control - Sensitive REST Method Against API Object - 4xx | Broken access control | IoA |
| 13 | REST method abuse PATCH | `10.10.1.1 - - [21/May/2026:10:00:12 +0000] "PATCH /identity/api/v2/user/123 HTTP/1.1" 200 123 "-" "PostmanRuntime/7.39.0"` | 110130 | bGlobal: Possible Broken Access Control - Sensitive REST Method Against API Object - 2xx/3xx | Broken access control | IoA |
| 14 | Mass Assignment query indicator | `10.10.1.1 - - [21/May/2026:10:00:13 +0000] "PATCH /identity/api/v2/user/profile?isAdmin=true HTTP/1.1" 403 123 "-" "PostmanRuntime/7.39.0"` | 110511 | bGlobal: Possible Mass Assignment/BOPLA Attempt Against User or Account Endpoint - 4xx | Mass Assignment / BOPLA | IoA |
| 15 | JWT alg none URL/query indicator | `10.10.1.1 - - [21/May/2026:10:00:14 +0000] "GET /identity/api/v2/user/profile?token=eyJhbGciOiJub25l HTTP/1.1" 403 123 "-" "PostmanRuntime/7.39.0"` | 110501 | bGlobal: Possible JWT Authentication Bypass Attempt - alg none - 4xx | Token abuse support | IoC |
| 16 | SQLi support rule | `10.10.1.1 - - [21/May/2026:10:00:15 +0000] "GET /identity/api/v2/user/search?q=%27%20or%201=1 HTTP/1.1" 403 123 "-" "PostmanRuntime/7.39.0"` | 110311 | bGlobal: Possible SQLi/NoSQLi Pattern Detected in API Request URL - 4xx | Supporting API attack visibility | IoC |
| 17 | SSRF support rule | `10.10.1.1 - - [21/May/2026:10:00:16 +0000] "GET /workshop/api/merchant/contact_mechanic?url=http://127.0.0.1:8080 HTTP/1.1" 403 123 "-" "PostmanRuntime/7.39.0"` | 110301 | bGlobal: Possible SSRF Attempt Against crAPI Contact Mechanic Endpoint - 4xx | Supporting API attack visibility | IoC |
| 18 | Repeated BOLA object access correlation | `10 repeated GET /api/users/<id> 403 requests from 10.10.1.50 in one wazuh-logtest stream` | 110101 | bGlobal: Possible BOLA/IDOR - Repeated API Object Access From Same Source IP | BOLA / IDOR correlation | TTP / correlation |
| 19 | Repeated UUID vehicle location correlation | `5 repeated GET /identity/api/v2/vehicle/<uuid>/location 403 requests from 10.10.1.51 in one wazuh-logtest stream` | 110122 | bGlobal: Possible BOLA/IDOR Enumeration - Repeated Vehicle Location Object Access | BOLA / IDOR correlation | TTP / correlation |
| 20 | Repeated auth failures correlation | `5 repeated POST /identity/api/auth/login 401 requests from 10.10.1.52 in one wazuh-logtest stream` | 110201 | bGlobal: Possible Web Brute Force - Repeated Authentication Failures From Same Source IP | Authentication abuse correlation | TTP / correlation |
| 21 | Repeated BFLA/admin probing correlation | `5 repeated GET /identity/api/v2/admin/users 403 requests from 10.10.1.53 in one wazuh-logtest stream` | 110402 | bGlobal: Repeated BFLA/Admin Endpoint Probing From Same Source IP | BFLA correlation | TTP / correlation |

## Logging Limitations

- Normal web access logs usually do not contain request body content.
- Normal web access logs usually do not contain the `Authorization` header.
- Mass Assignment / BOPLA detection is limited unless request body logging, WAF logs, or application logs are available.
- JWT `alg:none` detection is limited unless token data is present in URL/query logs, header logs, WAF logs, or application logs.
- BOLA and BFLA detection is stronger when logs include authenticated user ID or tenant context, not only source IP.
- Source IP correlation can be inaccurate behind NAT or proxies unless `X-Forwarded-For` is logged and decoded.
