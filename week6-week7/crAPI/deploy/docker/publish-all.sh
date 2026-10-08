#!/bin/bash

VERSION=${VERSION:-latest}
PUSH=${PUSH:-false}

ALL_IMAGES=(
  "crapi/crapi-identity"
  "crapi/crapi-workshop"
  "crapi/crapi-chatbot"
  "crapi/crapi-community"
  "crapi/crapi-web"
  "crapi/gateway-service"
  "crapi/mailhog"
)

for image in "${ALL_IMAGES[@]}"; do
  docker push $image:$VERSION
done

