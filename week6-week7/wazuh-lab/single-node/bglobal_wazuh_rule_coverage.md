# bGlobal Wazuh Rule Coverage

- Total custom rules in `bglobal_crapi_rules.xml`: 61
- Rules tested by single-line tests: 41
- Rules tested by correlation tests: 19
- Rules not testable with current access log format: 0
- Rules accounted for as limited/fallback behavior: 1

| Rule ID | Description | Category | Parent SID | Test status | Reason |
|---:|---|---|---|---|---|
| 110100 | bGlobal: BOLA/IDOR API Object ID Access Pattern Detected - 2xx/3xx | BOLA / IDOR | 31108 | PASS | Covered by single-line wazuh-logtest case. |
| 110101 | bGlobal: Possible BOLA/IDOR - Repeated API Object Access From Same Source IP | Correlation | bola_object_access | PASS | Covered by multi-line wazuh-logtest correlation stream. |
| 110102 | bGlobal: T1595 - Suspicious API/Web Sensitive Path Probing - 2xx/3xx | Reconnaissance | 31108 | PASS | Covered by single-line wazuh-logtest case. |
| 110103 | bGlobal: T1595 - Repeated API/Web Sensitive Path Probing From Same Source IP | Correlation | sensitive_path_probe | PASS | Covered by multi-line wazuh-logtest correlation stream. |
| 110104 | bGlobal: BOLA/IDOR API Object ID Access Pattern Detected - 4xx | BOLA / IDOR | 31101 | PASS | Covered by single-line wazuh-logtest case. |
| 110105 | bGlobal: BOLA/IDOR API Object ID Access Pattern Detected - 5xx | BOLA / IDOR | 31122 | PASS | Covered by single-line wazuh-logtest case. |
| 110106 | bGlobal: T1595 - Suspicious API/Web Sensitive Path Probing - 4xx | Reconnaissance | 31101 | PASS | Covered by single-line wazuh-logtest case. |
| 110107 | bGlobal: T1595 - Suspicious API/Web Sensitive Path Probing - 5xx | Reconnaissance | 31122 | PASS | Covered by single-line wazuh-logtest case. |
| 110120 | bGlobal: Possible BOLA/IDOR - Vehicle Location Object Access - 2xx/3xx | BOLA / IDOR | 31108 | PASS | Covered by single-line wazuh-logtest case. |
| 110121 | bGlobal: Possible BOLA/IDOR - Failed Vehicle Location Object Access | BOLA / IDOR | 31101 | PASS | Covered by single-line wazuh-logtest case. |
| 110122 | bGlobal: Possible BOLA/IDOR Enumeration - Repeated Vehicle Location Object Access | Correlation | bola_uuid_access | PASS | Covered by multi-line wazuh-logtest correlation stream. |
| 110130 | bGlobal: Possible Broken Access Control - Sensitive REST Method Against API Object - 2xx/3xx | Broken access control | 31108 | PASS | Covered by single-line wazuh-logtest case. |
| 110131 | bGlobal: Possible Broken Access Control - Sensitive REST Method Against API Object - 4xx | Broken access control | 31101 | PASS | Covered by single-line wazuh-logtest case. |
| 110200 | bGlobal: crAPI Web Authentication Failure Detected | Authentication abuse | 31101 | PASS | Covered by single-line wazuh-logtest case. |
| 110201 | bGlobal: Possible Web Brute Force - Repeated Authentication Failures From Same Source IP | Correlation | authentication_failed | PASS | Covered by multi-line wazuh-logtest correlation stream. |
| 110202 | bGlobal: crAPI Authentication Attempt Observed - 2xx/3xx | Authentication abuse | 31108 | PASS | Covered by single-line wazuh-logtest case. |
| 110203 | bGlobal: Possible Web Brute Force - High Rate Authentication Attempts With 2xx/3xx Responses | Correlation | 110202 | PASS | Covered by multi-line wazuh-logtest correlation stream. |
| 110204 | bGlobal: Possible Authentication Endpoint Scanning Against crAPI Identity API | Authentication abuse | 31101 | PASS | Covered by single-line wazuh-logtest case. |
| 110205 | bGlobal: T1595 - Repeated Authentication Endpoint Scanning From Same Source IP | Correlation | 110204 | PASS | Covered by multi-line wazuh-logtest correlation stream. |
| 110206 | bGlobal: crAPI Authentication Failure on Auth Endpoint | Authentication abuse | 31101 | PASS | Covered by single-line wazuh-logtest case. |
| 110300 | bGlobal: Possible SSRF Attempt Against crAPI Contact Mechanic Endpoint - 2xx/3xx | SSRF support | 31100 | PASS | Covered by single-line wazuh-logtest case. |
| 110301 | bGlobal: Possible SSRF Attempt Against crAPI Contact Mechanic Endpoint - 4xx | SSRF support | 31101 | PASS | Covered by single-line wazuh-logtest case. |
| 110310 | bGlobal: Possible SQLi/NoSQLi Pattern Detected in API Request URL - 2xx/3xx | SQLi/NoSQLi support | 31100,31164 | PASS | Covered by single-line wazuh-logtest case. |
| 110311 | bGlobal: Possible SQLi/NoSQLi Pattern Detected in API Request URL - 4xx | SQLi/NoSQLi support | 31101,31164 | PASS | Covered by single-line wazuh-logtest case. |
| 110400 | bGlobal: Possible BFLA - Access to Admin/Internal/Management Endpoint | BFLA | 31108 | PASS | Covered by single-line wazuh-logtest case. |
| 110401 | bGlobal: Possible BFLA/Admin Endpoint Probing | BFLA | 31101 | PASS | Covered by single-line wazuh-logtest case. |
| 110402 | bGlobal: Repeated BFLA/Admin Endpoint Probing From Same Source IP | Correlation | 110401 | PASS | Covered by multi-line wazuh-logtest correlation stream. |
| 110500 | bGlobal: Possible JWT Authentication Bypass Attempt - alg none | Authentication abuse | 31100 | PASS | Covered by single-line wazuh-logtest case. |
| 110501 | bGlobal: Possible JWT Authentication Bypass Attempt - alg none - 4xx | Authentication abuse | 31101 | PASS | Covered by single-line wazuh-logtest case. |
| 110510 | bGlobal: Possible Mass Assignment/BOPLA Attempt Against User or Account Endpoint - 2xx/3xx | Mass Assignment / BOPLA | 31530 | PASS | Covered by single-line wazuh-logtest case. |
| 110511 | bGlobal: Possible Mass Assignment/BOPLA Attempt Against User or Account Endpoint - 4xx | Mass Assignment / BOPLA | 31101 | PASS | Covered by single-line wazuh-logtest case. |
| 110600 | bGlobal: Web Vulnerability Scanner User-Agent Observed | Reconnaissance | 31100,31101,31108,31122 | PASS | Covered by single-line wazuh-logtest case. |
| 110610 | bGlobal: Web Scanner Probing Upload/Plugin PHP Endpoint - 4xx | Reconnaissance | 31101 | PASS | Covered by single-line wazuh-logtest case. |
| 110611 | bGlobal: Possible Exposed Upload/Plugin PHP Endpoint Accessed - 2xx/3xx | Broken access control | 31108 | PASS | Covered by single-line wazuh-logtest case. |
| 110612 | bGlobal: Repeated Upload/Plugin Endpoint Probing From Same Source IP | Correlation | upload_plugin_probe | PASS | Covered by multi-line wazuh-logtest correlation stream. |
| 110620 | bGlobal: Generic PHP/CMS Path Enumeration - 404 | Reconnaissance | 31101 | PASS | Covered by single-line wazuh-logtest case. |
| 110621 | bGlobal: Repeated Generic PHP/CMS Enumeration From Same Source IP | Correlation | php_cms_enum | PASS | Covered by multi-line wazuh-logtest correlation stream. |
| 110630 | bGlobal: Suspicious HTTP Method Observed During Web Scanning | Reconnaissance | 31100,31101,31108,31122 | PASS | Covered by single-line wazuh-logtest case. |
| 110640 | bGlobal: Generic Web Exploit Payload Indicator in URL | SQLi/NoSQLi support | 31100,31101,31108,31122 | PASS | Covered by single-line wazuh-logtest case. |
| 110650 | bGlobal: Suspicious Web Scanner Request Observed in Raw Nginx Warning Log | Reconnaissance | 31310 | PASS | Covered by single-line wazuh-logtest case. |
| 110651 | bGlobal: Generic Web Exploit Payload Indicator in Raw Nginx Warning Log | SQLi/NoSQLi support | 31310 | PASS | Covered by single-line wazuh-logtest case. |
| 110660 | bGlobal: VCS or Source Control Repository Path Probing | Reconnaissance | 31101,31516 | PASS | Covered by single-line wazuh-logtest case. |
| 110661 | bGlobal: Repeated VCS or Source Control Repository Probing From Same Source IP | Correlation | vcs_probe | PASS | Covered by multi-line wazuh-logtest correlation stream. |
| 110662 | bGlobal: Secret Key or Configuration File Probing | Reconnaissance | 31101,31516 | PASS | Covered by single-line wazuh-logtest case. |
| 110663 | bGlobal: Repeated Secret Key or Configuration File Probing From Same Source IP | Correlation | secret_config_probe | PASS | Covered by multi-line wazuh-logtest correlation stream. |
| 110664 | bGlobal: Cloud Metadata Endpoint Probing or SSRF Reconnaissance | Reconnaissance | 31101,31516 | PASS | Covered by single-line wazuh-logtest case. |
| 110665 | bGlobal: Repeated Cloud Metadata Endpoint Probing From Same Source IP | Correlation | cloud_metadata_probe | PASS | Covered by multi-line wazuh-logtest correlation stream. |
| 110666 | bGlobal: Framework or Technology Fingerprinting Path Probing | Reconnaissance | 31101,31516 | PASS | Covered by single-line wazuh-logtest case. |
| 110667 | bGlobal: Repeated Framework or Technology Fingerprinting From Same Source IP | Correlation | framework_fingerprint | PASS | Covered by multi-line wazuh-logtest correlation stream. |
| 110668 | bGlobal: CMS or Application Configuration Path Probing | Reconnaissance | 31101,31516 | PASS | Covered by single-line wazuh-logtest case. |
| 110669 | bGlobal: Repeated CMS or Application Configuration Probing From Same Source IP | Correlation | cms_app_config_probe | PASS | Covered by multi-line wazuh-logtest correlation stream. |
| 110670 | bGlobal: PHP Tooling Debug or Admin Endpoint Probing | Reconnaissance | 31101,31516 | PASS | Covered by single-line wazuh-logtest case. |
| 110671 | bGlobal: Repeated PHP Tooling Debug or Admin Endpoint Probing From Same Source IP | Correlation | php_tooling_probe | PASS | Covered by multi-line wazuh-logtest correlation stream. |
| 110672 | bGlobal: PHP-CGI Option Injection Attempt Observed | Reconnaissance | 31110 | PASS | Covered by single-line wazuh-logtest case. |
| 110673 | bGlobal: PHP-CGI Option Injection Pattern in URL | Reconnaissance | 31101,31516 | LIMITED | Fallback rule is intentionally shadowed by a higher-priority custom/default rule in normal logtest input. |
| 110674 | bGlobal: Repeated PHP-CGI Option Injection Attempts From Same Source IP | Correlation | php_cgi_option_injection | PASS | Covered by multi-line wazuh-logtest correlation stream. |
| 110675 | bGlobal: Random Encoded or High Entropy Path Fuzzing | Reconnaissance | 31101,31102,31516 | PASS | Covered by single-line wazuh-logtest case. |
| 110676 | bGlobal: Repeated Random Encoded or High Entropy Path Fuzzing From Same Source IP | Correlation | high_entropy_path_fuzzing | PASS | Covered by multi-line wazuh-logtest correlation stream. |
| 110677 | bGlobal: Common Discovery File Probing With Error Response | Reconnaissance | 31101,31102 | PASS | Covered by single-line wazuh-logtest case. |
| 110678 | bGlobal: Repeated Common Discovery File Probing From Same Source IP | Correlation | common_discovery_probe | PASS | Covered by multi-line wazuh-logtest correlation stream. |
| 110679 | bGlobal: Multiple HTTP 400 Errors From Same Source IP During Web Scanning | Correlation | 31151 | PASS | Covered by multi-line wazuh-logtest correlation stream. |

## Remaining Limitations

- Normal access logs do not contain request body content.
- Normal access logs do not contain Authorization headers.
- Mass Assignment detection is limited without body logging, WAF logs, or application logs.
- JWT alg:none detection is limited without header/token logging.
- BOLA/BFLA detection is stronger with authenticated user ID or tenant context.
- Source IP correlation is inaccurate behind NAT/proxies unless X-Forwarded-For is logged and decoded.

## Test Artifacts

- Single-line and extra coverage output: `bglobal_wazuh_all_rule_test_results.log`
- Correlation output: `bglobal_wazuh_correlation_test_results.log`
- Current manual suite output: `bglobal_wazuh_rule_test_results.log`
