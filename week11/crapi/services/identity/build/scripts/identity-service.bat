@rem
@rem Copyright 2015 the original author or authors.
@rem
@rem Licensed under the Apache License, Version 2.0 (the "License");
@rem you may not use this file except in compliance with the License.
@rem You may obtain a copy of the License at
@rem
@rem      https://www.apache.org/licenses/LICENSE-2.0
@rem
@rem Unless required by applicable law or agreed to in writing, software
@rem distributed under the License is distributed on an "AS IS" BASIS,
@rem WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
@rem See the License for the specific language governing permissions and
@rem limitations under the License.
@rem

@if "%DEBUG%"=="" @echo off
@rem ##########################################################################
@rem
@rem  identity-service startup script for Windows
@rem
@rem ##########################################################################

@rem Set local scope for the variables with windows NT shell
if "%OS%"=="Windows_NT" setlocal

set DIRNAME=%~dp0
if "%DIRNAME%"=="" set DIRNAME=.
@rem This is normally unused
set APP_BASE_NAME=%~n0
set APP_HOME=%DIRNAME%..

@rem Resolve any "." and ".." in APP_HOME to make it shorter.
for %%i in ("%APP_HOME%") do set APP_HOME=%%~fi

@rem Add default JVM options here. You can also use JAVA_OPTS and IDENTITY_SERVICE_OPTS to pass JVM options to this script.
set DEFAULT_JVM_OPTS=

@rem Find java.exe
if defined JAVA_HOME goto findJavaFromJavaHome

set JAVA_EXE=java.exe
%JAVA_EXE% -version >NUL 2>&1
if %ERRORLEVEL% equ 0 goto execute

echo.
echo ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.
echo.
echo Please set the JAVA_HOME variable in your environment to match the
echo location of your Java installation.

goto fail

:findJavaFromJavaHome
set JAVA_HOME=%JAVA_HOME:"=%
set JAVA_EXE=%JAVA_HOME%/bin/java.exe

if exist "%JAVA_EXE%" goto execute

echo.
echo ERROR: JAVA_HOME is set to an invalid directory: %JAVA_HOME%
echo.
echo Please set the JAVA_HOME variable in your environment to match the
echo location of your Java installation.

goto fail

:execute
@rem Setup the command line

set CLASSPATH=%APP_HOME%\lib\identity-service-1.0-SNAPSHOT-plain.jar;%APP_HOME%\lib\spring-boot-starter-data-jpa-3.2.2.jar;%APP_HOME%\lib\hibernate-core-6.4.1.Final.jar;%APP_HOME%\lib\jaxb-runtime-4.0.4.jar;%APP_HOME%\lib\jaxb-core-4.0.4.jar;%APP_HOME%\lib\jakarta.xml.bind-api-4.0.1.jar;%APP_HOME%\lib\spring-boot-starter-web-3.2.2.jar;%APP_HOME%\lib\spring-boot-starter-security-3.2.2.jar;%APP_HOME%\lib\spring-boot-starter-mail-3.2.2.jar;%APP_HOME%\lib\spring-boot-starter-validation-3.2.2.jar;%APP_HOME%\lib\spring-boot-starter-json-3.2.2.jar;%APP_HOME%\lib\spring-boot-starter-aop-3.2.2.jar;%APP_HOME%\lib\spring-boot-starter-jdbc-3.2.2.jar;%APP_HOME%\lib\spring-boot-starter-3.2.2.jar;%APP_HOME%\lib\spring-security-config-6.0.3.jar;%APP_HOME%\lib\jjwt-0.12.5.jar;%APP_HOME%\lib\nimbus-jose-jwt-9.37.3.jar;%APP_HOME%\lib\hibernate-validator-8.0.1.Final.jar;%APP_HOME%\lib\jakarta.validation-api-3.0.2.jar;%APP_HOME%\lib\postgresql-42.4.0.jar;%APP_HOME%\lib\google-cloud-storage-2.10.0.jar;%APP_HOME%\lib\log4j-web-2.14.0.jar;%APP_HOME%\lib\log4j-core-2.14.0.jar;%APP_HOME%\lib\spring-boot-starter-logging-3.2.2.jar;%APP_HOME%\lib\log4j-to-slf4j-2.21.1.jar;%APP_HOME%\lib\log4j-api-2.14.0.jar;%APP_HOME%\lib\httpclient-4.5.13.jar;%APP_HOME%\lib\httpclient5-5.3.jar;%APP_HOME%\lib\jakarta.mail-2.0.2.jar;%APP_HOME%\lib\angus-activation-2.0.1.jar;%APP_HOME%\lib\jakarta.activation-api-2.1.2.jar;%APP_HOME%\lib\spring-boot-autoconfigure-3.2.2.jar;%APP_HOME%\lib\spring-boot-3.2.2.jar;%APP_HOME%\lib\spring-boot-starter-tomcat-3.2.2.jar;%APP_HOME%\lib\spring-data-jpa-3.2.2.jar;%APP_HOME%\lib\jakarta.annotation-api-2.1.1.jar;%APP_HOME%\lib\spring-webmvc-6.1.3.jar;%APP_HOME%\lib\spring-security-web-6.2.1.jar;%APP_HOME%\lib\spring-web-6.1.3.jar;%APP_HOME%\lib\spring-security-core-6.2.1.jar;%APP_HOME%\lib\spring-context-support-6.1.3.jar;%APP_HOME%\lib\spring-context-6.1.3.jar;%APP_HOME%\lib\spring-aop-6.1.3.jar;%APP_HOME%\lib\spring-orm-6.1.3.jar;%APP_HOME%\lib\spring-jdbc-6.1.3.jar;%APP_HOME%\lib\spring-data-commons-3.2.2.jar;%APP_HOME%\lib\spring-tx-6.1.3.jar;%APP_HOME%\lib\spring-beans-6.1.3.jar;%APP_HOME%\lib\spring-expression-6.1.3.jar;%APP_HOME%\lib\spring-core-6.1.3.jar;%APP_HOME%\lib\snakeyaml-2.2.jar;%APP_HOME%\lib\spring-aspects-6.1.3.jar;%APP_HOME%\lib\tomcat-embed-el-10.1.18.jar;%APP_HOME%\lib\jjwt-impl-0.12.5.jar;%APP_HOME%\lib\jjwt-jackson-0.12.5.jar;%APP_HOME%\lib\jjwt-api-0.12.5.jar;%APP_HOME%\lib\jcip-annotations-1.0-1.jar;%APP_HOME%\lib\checker-qual-3.22.2.jar;%APP_HOME%\lib\guava-31.1-jre.jar;%APP_HOME%\lib\failureaccess-1.0.1.jar;%APP_HOME%\lib\listenablefuture-9999.0-empty-to-avoid-conflict-with-guava.jar;%APP_HOME%\lib\j2objc-annotations-1.3.jar;%APP_HOME%\lib\google-http-client-1.42.0.jar;%APP_HOME%\lib\opencensus-contrib-http-util-0.31.1.jar;%APP_HOME%\lib\google-http-client-jackson2-1.42.0.jar;%APP_HOME%\lib\google-api-client-1.35.1.jar;%APP_HOME%\lib\google-oauth-client-1.34.1.jar;%APP_HOME%\lib\google-http-client-gson-1.42.0.jar;%APP_HOME%\lib\google-http-client-apache-v2-1.42.0.jar;%APP_HOME%\lib\google-api-services-storage-v1-rev20220705-1.32.1.jar;%APP_HOME%\lib\gson-2.10.1.jar;%APP_HOME%\lib\google-cloud-core-2.8.0.jar;%APP_HOME%\lib\auto-value-annotations-1.9.jar;%APP_HOME%\lib\proto-google-common-protos-2.9.0.jar;%APP_HOME%\lib\google-cloud-core-http-2.8.0.jar;%APP_HOME%\lib\google-http-client-appengine-1.42.0.jar;%APP_HOME%\lib\gax-httpjson-0.103.2.jar;%APP_HOME%\lib\gax-2.18.2.jar;%APP_HOME%\lib\google-auth-library-credentials-1.7.0.jar;%APP_HOME%\lib\google-auth-library-oauth2-http-1.7.0.jar;%APP_HOME%\lib\api-common-2.2.1.jar;%APP_HOME%\lib\javax.annotation-api-1.3.2.jar;%APP_HOME%\lib\opencensus-api-0.31.1.jar;%APP_HOME%\lib\grpc-context-1.47.0.jar;%APP_HOME%\lib\proto-google-iam-v1-1.4.1.jar;%APP_HOME%\lib\protobuf-java-3.21.1.jar;%APP_HOME%\lib\protobuf-java-util-3.21.1.jar;%APP_HOME%\lib\threetenbp-1.6.0.jar;%APP_HOME%\lib\jackson-datatype-jsr310-2.15.3.jar;%APP_HOME%\lib\jackson-module-parameter-names-2.15.3.jar;%APP_HOME%\lib\jackson-annotations-2.15.3.jar;%APP_HOME%\lib\jackson-datatype-jdk8-2.15.3.jar;%APP_HOME%\lib\jackson-databind-2.15.3.jar;%APP_HOME%\lib\jackson-core-2.15.3.jar;%APP_HOME%\lib\jsr305-3.0.2.jar;%APP_HOME%\lib\httpcore-4.4.16.jar;%APP_HOME%\lib\commons-logging-1.2.jar;%APP_HOME%\lib\commons-codec-1.16.0.jar;%APP_HOME%\lib\httpcore5-h2-5.2.4.jar;%APP_HOME%\lib\httpcore5-5.2.4.jar;%APP_HOME%\lib\logback-classic-1.4.14.jar;%APP_HOME%\lib\jul-to-slf4j-2.0.11.jar;%APP_HOME%\lib\HikariCP-5.0.1.jar;%APP_HOME%\lib\slf4j-api-2.0.11.jar;%APP_HOME%\lib\spring-jcl-6.1.3.jar;%APP_HOME%\lib\tomcat-embed-websocket-10.1.18.jar;%APP_HOME%\lib\tomcat-embed-core-10.1.18.jar;%APP_HOME%\lib\micrometer-observation-1.12.2.jar;%APP_HOME%\lib\aspectjweaver-1.9.21.jar;%APP_HOME%\lib\jakarta.persistence-api-3.1.0.jar;%APP_HOME%\lib\jakarta.transaction-api-2.0.1.jar;%APP_HOME%\lib\jboss-logging-3.5.3.Final.jar;%APP_HOME%\lib\hibernate-commons-annotations-6.0.6.Final.jar;%APP_HOME%\lib\jandex-3.1.2.jar;%APP_HOME%\lib\classmate-1.6.0.jar;%APP_HOME%\lib\byte-buddy-1.14.11.jar;%APP_HOME%\lib\jakarta.inject-api-2.0.1.jar;%APP_HOME%\lib\antlr4-runtime-4.13.0.jar;%APP_HOME%\lib\spring-security-crypto-6.2.1.jar;%APP_HOME%\lib\logback-core-1.4.14.jar;%APP_HOME%\lib\micrometer-commons-1.12.2.jar;%APP_HOME%\lib\txw2-4.0.4.jar;%APP_HOME%\lib\istack-commons-runtime-4.1.2.jar


@rem Execute identity-service
"%JAVA_EXE%" %DEFAULT_JVM_OPTS% %JAVA_OPTS% %IDENTITY_SERVICE_OPTS%  -classpath "%CLASSPATH%" com.crapi.CRAPIBootApplication %*

:end
@rem End local scope for the variables with windows NT shell
if %ERRORLEVEL% equ 0 goto mainEnd

:fail
rem Set variable IDENTITY_SERVICE_EXIT_CONSOLE if you need the _script_ return code instead of
rem the _cmd.exe /c_ return code!
set EXIT_CODE=%ERRORLEVEL%
if %EXIT_CODE% equ 0 set EXIT_CODE=1
if not ""=="%IDENTITY_SERVICE_EXIT_CONSOLE%" exit %EXIT_CODE%
exit /b %EXIT_CODE%

:mainEnd
if "%OS%"=="Windows_NT" endlocal

:omega
