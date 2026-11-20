FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder

WORKDIR /build

RUN mkdir -p /root/.m2 && printf '%s\n' \
    '<settings>' \
    '  <mirrors>' \
    '    <mirror>' \
    '      <id>central-mirror</id>' \
    '      <mirrorOf>*</mirrorOf>' \
    '      <name>Maven Central</name>' \
    '      <url>https://repo.maven.apache.org/maven2</url>' \
    '    </mirror>' \
    '  </mirrors>' \
    '</settings>' > /root/.m2/settings.xml

COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests -B -Dmaven.artifact.threads=16 \
    && JAR_FILE=$(find target -maxdepth 1 -name '*.jar' ! -name '*-plain.jar' | head -n 1) \
    && cp "$JAR_FILE" /build/app.jar

FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY --from=builder /build/app.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
