# ---------- Build Stage ----------
FROM maven:3.9.9-eclipse-temurin-21 AS builder

WORKDIR /app

COPY pom.xml .

RUN mvn dependency:go-offline

COPY src ./src

RUN mvn clean package -DskipTests

# ---------- Runtime Stage ----------
FROM eclipse-temurin:21-jre-alpine

RUN addgroup -S kyxun && adduser -S kyxun -G kyxun

WORKDIR /app

COPY --from=builder /app/target/*.jar app.jar

RUN mkdir -p /var/kyxun/uploads && \
    chown -R kyxun:kyxun /var/kyxun && \
    chown kyxun:kyxun app.jar

USER kyxun

ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dserver.port=${PORT:-8080} -jar app.jar"]