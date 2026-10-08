#!/usr/bin/env python3
import sys
import json
import requests
import urllib3

# Tắt cảnh báo SSL vì IRIS dùng self-signed cert trong môi trường dev
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Wazuh truyền tham số theo thứ tự: script <alert_file> <api_key> <hook_url>
alert_file = sys.argv[1]
api_key = sys.argv[2]
hook_url = sys.argv[3]

with open(alert_file) as f:
    alert = json.load(f)

headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json'
}

# Map các trường của Wazuh sang DFIR-IRIS
iris_payload = {
    "alert_title": f"Wazuh: {alert.get('rule', {}).get('description', 'Unknown Alert')}",
    "alert_description": f"Rule ID: {alert.get('rule', {}).get('id')}\nLevel: {alert.get('rule', {}).get('level')}\n\nFull Log:\n{json.dumps(alert, indent=2)}",
    "alert_source": "Wazuh",
    "alert_source_ref": alert.get('id', 'unknown'),
    "alert_source_content": alert,
    "severity_id": 4 if int(alert.get('rule', {}).get('level', 1)) >= 10 else 3,
    "alert_customer_id": 1 # Bắt buộc trong IRIS multi-tenant
}

# Gửi POST request sang IRIS
try:
    response = requests.post(hook_url, headers=headers, json=iris_payload, verify=False)
    sys.exit(0)
except Exception as e:
    sys.exit(1)	