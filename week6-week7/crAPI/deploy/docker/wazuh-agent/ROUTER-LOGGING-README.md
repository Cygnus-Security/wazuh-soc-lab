# Router NAT Logging Verification

The `network-router` container keeps DNAT and MASQUERADE enabled for the lab, but writes pre-NAT inbound packet metadata to `/var/log/router/router.log`. The `wazuh-agent-router` service reads that shared volume and enrolls as `crapi-network-router`.

Install `wazuh-agent/bglobal_router_rules.xml` on the Wazuh manager under `/var/ossec/etc/rules/` and restart the manager to activate the custom rules.

```sh
docker compose config
docker compose up -d
docker inspect crapi-web --format '{{range $name,$net := .NetworkSettings.Networks}}{{$name}}={{$net.IPAddress}} {{end}}'
docker exec -it network-router sh -lc 'getent hosts crapi-web; ip route; iptables -t nat -L -n -v --line-numbers; iptables -t mangle -L -n -v --line-numbers'
curl -v http://10.10.1.1:8888/change-email
docker exec -it network-router sh -lc 'tail -n 50 /var/log/router/router.log'
docker exec -it wazuh-agent-router sh -lc 'tail -n 50 /var/ossec/logs/ossec.log'
docker exec -it single-node-wazuh.manager-1 /var/ossec/bin/agent_control -l
docker exec -it single-node-wazuh.manager-1 sh -lc "grep -i 'CRAPI_WEB_IN' /var/ossec/logs/archives/archives.log | tail -n 10"
```
