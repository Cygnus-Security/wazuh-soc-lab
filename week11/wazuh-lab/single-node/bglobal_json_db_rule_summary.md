# bGlobal JSON/DB Rule Test Summary

| Rule ID | Test name | Status | Notes |
|---:|---|---|---|
| 110700 | Nginx JSON base | INDIRECT | Level 0 base rule confirmed through child rules 110701-110707 |
| 110701 | 110701_missing_auth_2xx | PASS | Direct logtest match |
| 110702 | 110702_rejected_jwt_403 | PASS | Direct logtest match |
| 110703 | 110703_repeated_rejected_jwt | PASS-CORRELATION | Multi-line correlation matched |
| 110704 | 110704_l7_http_flood | PASS-CORRELATION | Multi-line correlation matched |
| 110705 | 110705_endpoint_hammering | PASS-CORRELATION | Multi-line correlation matched |
| 110706 | 110706_otp_reset_request | PASS | Direct logtest match |
| 110707 | 110707_otp_email_spam_correlation | PASS-CORRELATION | Multi-line correlation matched |
| 110800 | PostgreSQL base | INDIRECT | Level 0 base rule confirmed through child rules 110801-110803 |
| 110801 | 110801_postgresql_sqli | PASS | Direct logtest match |
| 110802 | 110802_postgresql_mass_assignment | PASS | Direct logtest match |
| 110803 | 110803_postgresql_syntax_error | PASS | Direct logtest match |
| 110830 | MongoDB JSON base | INDIRECT | Level 0 base rule confirmed through child rule 110831 |
| 110831 | 110831_mongodb_nosqli_ne | PASS | Direct logtest match |
| 110831 | 110831_mongodb_nosqli_regex | PASS | Direct logtest match |

## Final Count

- PASS_COUNT=9
- FAIL_COUNT=0
- LIMITED_OR_INDIRECT_COUNT=3
- Raw output: `bglobal_json_db_rule_test_results.log`
