@echo off
set JAVA_HOME=%LOCALAPPDATA%\Android\Sdk\jdk\jdk-17.0.9
"%JAVA_HOME%\bin\keytool" -genkey -v -keystore productif-keystore.jks -alias productif -keyalg RSA -keysize 2048 -validity 10000 