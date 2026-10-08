#!/bin/sh
set -e

if [ -f /app/keys/jwks.json ]; then
  echo "Loading JWKS key file /app/keys/jwks.json"
  JWKS=$(openssl base64 -in /app/keys/jwks.json -A)
else
  echo "Loading default JWKS file."
  JWKS=$(openssl base64 -in /app/default_jwks.json -A)
fi
java -jar /app/identity-service-1.0-SNAPSHOT.jar --app.jwksJson=$JWKS

exec "$@"
