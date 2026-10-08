$Manager = "single-node-wazuh.manager-1"

$Tests = @(
    @{
        Rule = "110100"
        Name = "BOLA numeric object access 2xx"
        Log  = '10.10.1.10 - - [15/May/2026:07:00:00 +0000] "GET /api/user/123 HTTP/1.1" 200 123 "-" "curl/8.0"'
    },
    @{
        Rule = "110104"
        Name = "BOLA numeric object access 4xx"
        Log  = '10.10.1.11 - - [15/May/2026:07:00:01 +0000] "GET /api/user/123 HTTP/1.1" 404 123 "-" "curl/8.0"'
    },
    @{
        Rule = "110105"
        Name = "BOLA numeric object access 5xx"
        Log  = '10.10.1.12 - - [15/May/2026:07:00:02 +0000] "GET /api/user/123 HTTP/1.1" 500 123 "-" "curl/8.0"'
    },
    @{
        Rule = "110120"
        Name = "UUID vehicle location access 2xx"
        Log  = '10.10.1.20 - - [15/May/2026:07:01:00 +0000] "GET /identity/api/v2/vehicle/550e8400-e29b-41d4-a716-446655440000/location HTTP/1.1" 200 123 "-" "curl/8.0"'
    },
    @{
        Rule = "110121"
        Name = "Failed UUID vehicle location access"
        Log  = '10.10.1.21 - - [15/May/2026:07:01:01 +0000] "GET /identity/api/v2/vehicle/550e8400-e29b-41d4-a716-446655440000/location HTTP/1.1" 403 123 "-" "curl/8.0"'
    },
    @{
        Rule = "110102"
        Name = "Sensitive path probing 2xx"
        Log  = '10.10.1.30 - - [15/May/2026:07:02:00 +0000] "GET /.env HTTP/1.1" 200 123 "-" "curl/8.0"'
    },
    @{
        Rule = "110106"
        Name = "Sensitive path probing 4xx"
        Log  = '10.10.1.31 - - [15/May/2026:07:02:01 +0000] "GET /.git/config HTTP/1.1" 404 123 "-" "curl/8.0"'
    },
    @{
        Rule = "110107"
        Name = "Sensitive path probing 5xx"
        Log  = '10.10.1.32 - - [15/May/2026:07:02:02 +0000] "GET /swagger HTTP/1.1" 500 123 "-" "curl/8.0"'
    },
    @{
        Rule = "110200"
        Name = "Authentication failure"
        Log  = '10.10.1.40 - - [15/May/2026:07:03:00 +0000] "POST /identity/api/auth/login HTTP/1.1" 401 123 "-" "PostmanRuntime/7.39.0"'
    },
    @{
        Rule = "110202"
        Name = "Authentication attempt 2xx"
        Log  = '10.10.1.41 - - [15/May/2026:07:03:01 +0000] "POST /identity/api/auth/login HTTP/1.1" 200 123 "-" "PostmanRuntime/7.39.0"'
    },
    @{
        Rule = "110204"
        Name = "Authentication endpoint scanning"
        Log  = '10.10.1.42 - - [15/May/2026:07:03:02 +0000] "POST /identity/api/auth/admin HTTP/1.1" 404 123 "-" "PostmanRuntime/7.39.0"'
    },
    @{
        Rule = "110300"
        Name = "SSRF 2xx"
        Log  = '10.10.1.50 - - [15/May/2026:07:04:00 +0000] "GET /workshop/api/merchant/contact_mechanic?url=http://169.254.169.254/latest/meta-data HTTP/1.1" 200 123 "-" "curl/8.0"'
    },
    @{
        Rule = "110301"
        Name = "SSRF 4xx"
        Log  = '10.10.1.51 - - [15/May/2026:07:04:01 +0000] "GET /workshop/api/merchant/contact_mechanic?url=http://127.0.0.1:8080/admin HTTP/1.1" 403 123 "-" "curl/8.0"'
    },
    @{
        Rule = "110310"
        Name = "SQLi or NoSQLi 2xx"
        Log  = '10.10.1.60 - - [15/May/2026:07:05:00 +0000] "GET /identity/api/v2/user/profile?id=1%27%20or%201=1-- HTTP/1.1" 200 123 "-" "sqlmap/1.8"'
    },
    @{
        Rule = "110311"
        Name = "SQLi or NoSQLi 4xx"
        Log  = '10.10.1.61 - - [15/May/2026:07:05:01 +0000] "GET /identity/api/v2/user/profile?id=1%27%20or%201=1-- HTTP/1.1" 404 123 "-" "sqlmap/1.8"'
    },
    @{
        Rule = "110400"
        Name = "BFLA admin access 2xx"
        Log  = '10.10.1.70 - - [15/May/2026:07:06:00 +0000] "GET /identity/api/v2/admin/users HTTP/1.1" 200 123 "-" "curl/8.0"'
    },
    @{
        Rule = "110401"
        Name = "BFLA admin probing 4xx"
        Log  = '10.10.1.71 - - [15/May/2026:07:06:01 +0000] "GET /identity/api/v2/admin/users HTTP/1.1" 403 123 "-" "curl/8.0"'
    },
    @{
        Rule = "110500"
        Name = "JWT alg none 2xx"
        Log  = '10.10.1.80 - - [15/May/2026:07:07:00 +0000] "GET /identity/api/v2/user/dashboard?token=eyJhbGciOiJub25l HTTP/1.1" 200 123 "-" "curl/8.0"'
    },
    @{
        Rule = "110501"
        Name = "JWT alg none 4xx"
        Log  = '10.10.1.81 - - [15/May/2026:07:07:01 +0000] "GET /identity/api/v2/user/dashboard?token=eyJhbGciOiJub25l HTTP/1.1" 403 123 "-" "curl/8.0"'
    },
    @{
        Rule = "110510"
        Name = "Mass assignment 2xx"
        Log  = '10.10.1.90 - - [15/May/2026:07:08:00 +0000] "POST /identity/api/v2/user/profile?role=admin&isAdmin=true HTTP/1.1" 200 123 "-" "PostmanRuntime/7.39.0"'
    },
    @{
        Rule = "110511"
        Name = "Mass assignment 4xx"
        Log  = '10.10.1.91 - - [15/May/2026:07:08:01 +0000] "POST /identity/api/v2/user/profile?role=admin&isAdmin=true HTTP/1.1" 403 123 "-" "PostmanRuntime/7.39.0"'
    }
)

foreach ($Test in $Tests) {
    Write-Host ""
    Write-Host "============================================================"
    Write-Host "Testing Rule $($Test.Rule): $($Test.Name)"
    Write-Host "============================================================"

    $Output = $Test.Log | docker exec -i $Manager /var/ossec/bin/wazuh-logtest

    if ($Output -match "id: '$($Test.Rule)'") {
        Write-Host "[PASS] Rule $($Test.Rule) returned correctly" -ForegroundColor Green
    }
    else {
        Write-Host "[FAIL] Rule $($Test.Rule) did not return" -ForegroundColor Red
        Write-Host "---- Raw output ----"
        $Output
    }

    $Output | Select-String "Phase 2|Phase 3|id: '|description:|Alert to be generated"
}