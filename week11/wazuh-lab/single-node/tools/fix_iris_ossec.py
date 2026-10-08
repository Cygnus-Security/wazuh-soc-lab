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


def validate_xml_like_wazuh(text: str) -> None:
    """
    ossec.conf có thể có nhiều block <ossec_config>.
    Python XML parser cần root giả để validate well-formed XML.
    """
    wrapped = "<root>\n" + text + "\n</root>"
    ET.fromstring(wrapped)


def main() -> int:
    if not CONF_PATH.exists():
        print(f"ERROR: file not found: {CONF_PATH}")
        return 1

    text = CONF_PATH.read_text(encoding="utf-8")

    pattern = (
        r"\s*<integration>\s*"
        r"<name>\s*custom-wazuh_iris\s*</name>"
        r".*?</integration>"
    )

    old = re.search(pattern, text, flags=re.S)

    api_key = "UjX6Anhv0F08EAIo4jhf5n_Kf7j202SS0dZVW7Bg547sxC1Mk3uSilPLYT2xFbt7NvJplIp5SMZiYn_BnjW7vg"

    if not api_key or api_key == "{new_key}":
        api_key = getpass.getpass("Paste IRIS API key: ").strip()

    if not api_key:
        print("ERROR: API key is empty")
        return 1

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

    # Xóa mọi block custom-wazuh_iris cũ nếu có.
    text = re.sub(pattern, "", text, flags=re.S)

    if "</ossec_config>" not in text:
        print("ERROR: </ossec_config> not found")
        return 1

    # Chèn block integration trước </ossec_config> đầu tiên.
    text = text.replace("</ossec_config>", clean_block + "\n</ossec_config>", 1)

    # Validate XML well-formed trước khi ghi.
    try:
        validate_xml_like_wazuh(text)
    except Exception as e:
        print(f"ERROR: XML validation failed: {e}")
        return 1

    backup_path = CONF_PATH.with_suffix(
        CONF_PATH.suffix + ".bak." + datetime.now().strftime("%Y%m%d_%H%M%S")
    )
    shutil.copy2(CONF_PATH, backup_path)

    CONF_PATH.write_text(text, encoding="utf-8")

    print("OK: fixed", CONF_PATH)
    print("Backup:", backup_path)
    print("API key:", mask_key(api_key))
    print()
    print("Integration block:")
    print(clean_block.replace(api_key, "***MASKED***"))

    return 0


if __name__ == "__main__":
    sys.exit(main())