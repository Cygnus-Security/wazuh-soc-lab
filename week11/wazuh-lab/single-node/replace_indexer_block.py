from pathlib import Path
import re

p = Path("docker-compose.yml")
s = p.read_text(encoding="utf-8", errors="ignore").replace("\r\n", "\n")

new_block = """  wazuh.indexer:
    image: local/wazuh-indexer:4.14.4
    build:
      context: .
      dockerfile: Dockerfile.wazuh-indexer-local
    hostname: wazuh.indexer
    restart: always
    ports:
      - "9200:9200"
    environment:
      - OPENSEARCH_JAVA_OPTS=-Xms1g -Xmx1g
    ulimits:
      memlock:
        soft: -1
        hard: -1
      nofile:
        soft: 65536
        hard: 65536
    volumes:
      - wazuh-indexer-data:/var/lib/wazuh-indexer
"""

pattern = r"(?ms)^  wazuh\.indexer:\n.*?(?=^  [A-Za-z0-9_.-]+:\n|^networks:\n|^volumes:\n|\Z)"

s2, n = re.subn(pattern, new_block, s, count=1)

if n != 1:
    raise SystemExit(f"Failed to replace wazuh.indexer block. Replacements={n}")

p.write_text(s2, encoding="utf-8", newline="\n")
print("Replaced wazuh.indexer block successfully.")
