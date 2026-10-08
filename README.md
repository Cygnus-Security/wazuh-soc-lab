# Wazuh SOC Lab

This SOC lab repository integrates Wazuh, crAPI, and DFIR-IRIS. It has been
streamlined to retain only the current source code, completed reports, and
deployment documentation.

## Repository Structure

```text
.
├── src/
│   ├── crapi/       # Target application and log collection configuration
│   ├── iris-web/    # DFIR-IRIS incident management platform
│   └── wazuh-lab/   # Wazuh manager, indexer, dashboard, and custom rules
├── reports/         # Completed PDF reports
├── SETUP.md         # Lab setup guide
└── LICENSE
```

## Quick Start

Read [SETUP.md](SETUP.md) to prepare the host, start each component, and verify
the services. Run this lab only in an isolated learning environment because
crAPI is intentionally vulnerable.

## Reports

The completed reports for each project stage are stored in `reports/`. Raw
references, build caches, backup files, and duplicate source trees have been
removed from the working tree. They remain recoverable from Git history if
needed.
