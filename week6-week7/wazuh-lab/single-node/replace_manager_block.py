from pathlib import Path
import re

p = Path("docker-compose.yml")
s = p.read_text(encoding="utf-8", errors="ignore").replace("\r\n", "\n")

new_block = """  wazuh.manager:
    image: local/wazuh-manager:4.14.4
    build:
      context: .
      dockerfile: Dockerfile.wazuh-manager-local
    hostname: wazuh.manager
    restart: always
    ports:
      - "1514:1514"
      - "1515:1515"
      - "514:514/udp"
      - "55000:55000"
    environment:
      - INDEXER_URL=https://wazuh.indexer:9200
      - INDEXER_USERNAME=admin
      - INDEXER_PASSWORD=SecretPassword
      - FILEBEAT_SSL_VERIFICATION_MODE=full
      - SSL_CERTIFICATE_AUTHORITIES=/etc/ssl/root-ca.pem
      - SSL_CERTIFICATE=/etc/ssl/filebeat.pem
      - SSL_KEY=/etc/ssl/filebeat.key
      - API_USERNAME=wazuh-wui
      - API_PASSWORD=MyS3cr37P450r.*-
    ulimits:
      memlock:
        soft: -1
        hard: -1
      nofile:
        soft: 655360
        hard: 655360
    volumes:
      - wazuh_api_configuration:/var/ossec/api/configuration
      - wazuh_etc:/var/ossec/etc
      - wazuh_logs:/var/ossec/logs
      - wazuh_queue:/var/ossec/queue
      - wazuh_var_multigroups:/var/ossec/var/multigroups
      - wazuh_integrations:/var/ossec/integrations
      - wazuh_active_response:/var/ossec/active-response/bin
      - wazuh_agentless:/var/ossec/agentless
      - wazuh_wodles:/var/ossec/wodles
      - filebeat_etc:/etc/filebeat
      - filebeat_var:/var/lib/filebeat
"""

pattern = r"(?ms)^  wazuh\.manager:\n.*?(?=^  [A-Za-z0-9_.-]+:\n|^networks:\n|^volumes:\n|\Z)"

s2, n = re.subn(pattern, new_block, s, count=1)

if n != 1:
    raise SystemExit(f"Failed to replace wazuh.manager block. Replacements={n}")

p.write_text(s2, encoding="utf-8", newline="\n")
print("Replaced wazuh.manager block successfully.")
