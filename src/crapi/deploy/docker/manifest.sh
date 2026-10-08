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
  docker manifest create \
    $image:$VERSION \
    --amend $image:$VERSION-amd64 \
    --amend $image:$VERSION-arm64
done

if [ "$PUSH" = true ]; then
  for image in "${ALL_IMAGES[@]}"; do
    docker manifest push $image:$VERSION
  done
fi