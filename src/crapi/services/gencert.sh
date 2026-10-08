mkdir -p certs
openssl req -x509 -newkey rsa:4096 -keyout certs/server.key -out certs/server.crt -sha256 -days 3650 -nodes -subj "/C=XX/ST=StateName/L=CityName/O=CompanyName/OU=CompanySectionName/CN=$1"
cp -v certs/* workshop/certs
cp -v certs/* identity/src/main/resources/certs
cp -v certs/* chatbot/certs
cp -v certs/* web/certs
cp -v certs/* community/certs
cd ./identity/src/main/resources/certs/
./keystore.sh