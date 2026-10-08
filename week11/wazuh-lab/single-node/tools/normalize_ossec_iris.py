#!/usr/bin/env python3

import re
import sys
import shutil
import getpass
import xml.etree.ElementTree as ET
from pathlib import Path
from datetime import datetime


CONF_PATH = Path("./persistent_iris/ossec.conf.iris")

INTEGRATION_NAME = "custom-wazuh_iris"
HOOK_URL = "https://dfir-iris:8443/alerts/add?cid=1"


def mask_key(key: str) -> str:
    key = key.strip()
    if len(key) <= 12:
        return "***MASKED***"
    return key[:4] + "***MASKED***" + key[-4:]


def main() -> int:
    if not CONF_PATH.exists():
        print(f"ERROR: file not found: {CONF_PATH}")
        return 1

    text = CONF_PATH.read_text(encoding="utf-8")

    # Lấy API key cũ nếu đã có trong file.
    key_match = re.search(
        r"<integration>\s*<name>\s*custom-wazuh_iris\s*</name>.*?<api_key>(.*?)</api_key>.*?</integration>",
        text,
        flags=re.S,
    )

    api_key = ""
    if key_match:
        api_key = key_match.group(1).strip()

    if not api_key or api_key == "{new_key}" or api_key == "***MASKED***":
        api_key = getpass.getpass("Paste IRIS API key: ").strip()

    if not api_key:
        print("ERROR: API key is empty")
        return 1

    # Lấy toàn bộ nội dung bên trong mọi block <ossec_config>.
    blocks = re.findall(r"<ossec_config>(.*?)</ossec_config>", text, flags=re.S)

    if not blocks:
        print("ERROR: no <ossec_config> blocks found")
        return 1

    merged_inner = "\n\n".join(blocks)

    # Xóa mọi block integration custom-wazuh_iris cũ.
    integration_pattern = (
        r"\s*<integration>\s*"
        r"<name>\s*custom-wazuh_iris\s*</name>"
        r".*?</integration>"
    )
    merged_inner = re.sub(integration_pattern, "", merged_inner, flags=re.S)

    clean_block = f"""
  <integration>
    <name>{INTEGRATION_NAME}</name>
    <hook_url>{HOOK_URL}</hook_url>
    <level>10</level>
    <group>bglobal,crapi</group>
    <api_key>{api_key}</api_key>
    <alert_format>json</alert_format>
  </integration>
"""

    new_text = "<ossec_config>\n" + merged_inner.strip() + "\n" + clean_block + "\n</ossec_config>\n"

    # Validate XML thật: chỉ còn 1 root <ossec_config>.
    try:
        ET.fromstring(new_text)
    except Exception as e:
        print(f"ERROR: XML validation failed: {e}")
        return 1

    backup_path = CONF_PATH.with_suffix(
        CONF_PATH.suffix + ".bak.normalized." + datetime.now().strftime("%Y%m%d_%H%M%S")
    )
    shutil.copy2(CONF_PATH, backup_path)

    CONF_PATH.write_text(new_text, encoding="utf-8")

    print("OK: normalized", CONF_PATH)
    print("Backup:", backup_path)
    print("API key:", mask_key(api_key))
    print()
    print("Now this file has only ONE <ossec_config> root.")
    print()
    print("Integration block:")
    print(clean_block.replace(api_key, "***MASKED***"))

    return 0


if __name__ == "__main__":
    sys.exit(main())