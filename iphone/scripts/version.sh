#!/usr/bin/env bash
# Numéro de version du code embarqué dans l'app iPhone (celui qu'elle affiche, et le début du numéro de build).
#   - upstream.json « commit » = "HEAD" : le nombre de commits de HEAD, soit le versionCode qu'Android donne au même
#     commit de main ;
#   - un SHA : le versionCode noté dans upstream.json (ancien montage, vérifié par scripts/upstream.sh).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [ "$(node -p "require('$ROOT/upstream.json').commit")" = "HEAD" ]; then
  git -C "$ROOT" rev-list --count HEAD
else
  node -p "require('$ROOT/upstream.json').versionCode"
fi
