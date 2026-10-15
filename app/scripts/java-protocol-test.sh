#!/usr/bin/env bash
# Tests JVM du client Java « synchro seule » de la montre (paquet com.healthtrack.app.huawei, sans
# dépendance Android), sans SDK Android ni Gradle : javac + JUnit 4. Usage : npm run test:java
# JUNIT_JAR / HAMCREST_JAR : chemins des jars ; sinon cache de Gradle, sinon téléchargés depuis Maven Central.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/android/app/src/main/java/com/healthtrack/app/huawei"
TEST="$ROOT/android/app/src/test/java/com/healthtrack/app/huawei"
RES="$ROOT/android/app/src/test/resources"
OUT="$ROOT/.java-test"
LIB="$OUT/lib"
mkdir -p "$LIB" "$OUT/classes"

fetch() { # nom, chemin maven, variable
  local name="$1" path="$2" var="$3" found
  if [ -n "${!var:-}" ]; then echo "${!var}"; return; fi
  found="$(ls /opt/gradle*/lib/"$name" 2>/dev/null | head -1 || true)"
  if [ -n "$found" ]; then echo "$found"; return; fi
  [ -f "$LIB/$name" ] || curl -sSfL "https://repo1.maven.org/maven2/$path/$name" -o "$LIB/$name"
  echo "$LIB/$name"
}
JUNIT="$(fetch junit-4.13.2.jar junit/junit/4.13.2 JUNIT_JAR)"
HAMCREST="$(fetch hamcrest-core-1.3.jar org/hamcrest/hamcrest-core/1.3 HAMCREST_JAR)"

if grep -l "^import android\." "$SRC"/*.java; then
  echo "Le paquet huawei doit rester sans dépendance Android (testable sur la JVM)." >&2
  exit 1
fi
rm -rf "$OUT/classes" && mkdir -p "$OUT/classes"
javac -encoding UTF-8 -Xlint:unchecked -d "$OUT/classes" -cp "$JUNIT" "$SRC"/*.java "$TEST"/*.java
TESTS="$(cd "$TEST" && ls *Test.java | sed 's/\.java$//; s/^/com.healthtrack.app.huawei./' | tr '\n' ' ')"
# shellcheck disable=SC2086
java -cp "$OUT/classes:$RES:$JUNIT:$HAMCREST" org.junit.runner.JUnitCore $TESTS
