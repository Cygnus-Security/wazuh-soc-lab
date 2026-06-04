#!/bin/sh

#
# Licensed under the Apache License, Version 2.0 (the “License”);
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#         http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an “AS IS” BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Get script directory
DIR="$( cd "$( dirname "$0" )" >/dev/null 2>&1 && pwd )"

echo "Starting Flask server"
python -m mcpserver.server &
if [ "$TLS_ENABLED" = "true" ] || [ "$TLS_ENABLED" = "1" ]; then
  echo "TLS is ENABLED"
  # if $TLS_CERTIFICATE and $TLS_KEY are not set, use the default ones
  if [ "$TLS_CERTIFICATE" = "" ]; then
    TLS_CERTIFICATE=$DIR/certs/server.crt
  fi
  if [ "$TLS_KEY" = "" ]; then
    TLS_KEY=$DIR/certs/server.key
  fi
  echo "TLS_CERTIFICATE: $TLS_CERTIFICATE"
  echo "TLS_KEY: $TLS_KEY"
  uvicorn chatbot.app:app --timeout-keep-alive 600 --host 0.0.0.0 --port ${SERVER_PORT} --ssl-certfile $TLS_CERTIFICATE --ssl-keyfile $TLS_KEY --log-level=debug
else
  uvicorn chatbot.app:app --timeout-keep-alive 600 --host 0.0.0.0 --port ${SERVER_PORT} --log-level=debug
fi
