# ──────────────────────────────────────────────
# Stage 1: Build
# ──────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Copy Maven wrapper and pom.xml first for dependency caching
COPY mvnw pom.xml ./
COPY .mvn .mvn

# Download dependencies (cached unless pom.xml changes)
RUN ./mvnw dependency:go-offline -B

# Copy source and build
COPY src ./src
RUN ./mvnw clean package -DskipTests -B

# ──────────────────────────────────────────────
# Stage 2: Runtime
# ──────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine AS runtime

# Security: run as non-root user
RUN addgroup -S kyxun && adduser -S kyxun -G kyxun

WORKDIR /app

# Create upload directory and set ownership
RUN mkdir -p /var/kyxun/uploads && chown -R kyxun:kyxun /var/kyxun

# Copy the built jar from builder stage
COPY --from=builder /app/target/kyxun-backend-*.jar app.jar

# Set ownership
RUN chown kyxun:kyxun app.jar

USER kyxun

# Expose application port
EXPOSE 8080

# JVM optimizations for containers
ENV JAVA_OPTS="-XX:+UseContainerSupport \
               -XX:MaxRAMPercentage=75.0 \
               -XX:+UseG1GC \
               -XX:+OptimizeStringConcat \
               -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
