from pathlib import Path
import re

p = Path("docker-compose.yml")
s = p.read_text(encoding="utf-8", errors="ignore").replace("\r\n", "\n")

new_block = """  wazuh.dashboard:
    image: local/wazuh-dashboard:4.14.4
    build:
      context: .
      dockerfile: Dockerfile.wazuh-dashboard-local
    hostname: wazuh.dashboard
    restart: always
    ports:
      - "443:5601"
    environment:
      - INDEXER_USERNAME=admin
      - INDEXER_PASSWORD=SecretPassword
      - WAZUH_API_URL=https://wazuh.manager
      - DASHBOARD_USERNAME=kibanaserver
      - DASHBOARD_PASSWORD=kibanaserver
      - API_USERNAME=wazuh-wui
      - API_PASSWORD=MyS3cr37P450r.*-
    depends_on:
      - wazuh.indexer
      - wazuh.manager
    links:
      - wazuh.indexer:wazuh.indexer
      - wazuh.manager:wazuh.manager
    volumes:
      - wazuh-dashboard-custom:/usr/share/wazuh-dashboard/plugins/wazuh/public/assets/custom
"""

pattern = r"(?ms)^  wazuh\.dashboard:\n.*?(?=^  [A-Za-z0-9_.-]+:\n|^networks:\n|^volumes:\n|\Z)"

s2, n = re.subn(pattern, new_block, s, count=1)

if n != 1:
    raise SystemExit(f"Failed to replace wazuh.dashboard block. Replacements={n}")

p.write_text(s2, encoding="utf-8", newline="\n")
print("Replaced wazuh.dashboard block successfully.")
