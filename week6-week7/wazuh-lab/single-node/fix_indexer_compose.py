from pathlib import Path

p = Path("docker-compose.yml")
s = p.read_text(encoding="utf-8", errors="ignore").replace("\r\n", "\n")

start = s.find("\n  wazuh.indexer:")
if start == -1:
    start = s.find("  wazuh.indexer:")

end = s.find("\n  wazuh.manager:", start)

if start == -1 or end == -1:
    raise SystemExit("Cannot find wazuh.indexer or wazuh.manager block")

new_block = """
  wazuh.indexer:
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

p.write_text(s[:start] + new_block + s[end:], encoding="utf-8", newline="\n")
print("Fixed wazuh.indexer block")
