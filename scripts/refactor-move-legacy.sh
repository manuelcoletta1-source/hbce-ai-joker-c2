#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(pwd)"

ARCHIVE_DIR="${ROOT_DIR}/archive"
LEGACY_DIR="${ARCHIVE_DIR}/legacy"
EXPERIMENTAL_DIR="${ARCHIVE_DIR}/experimental"

mkdir -p "${LEGACY_DIR}"
mkdir -p "${EXPERIMENTAL_DIR}"

move_if_exists() {
  local source_path="$1"
  local target_dir="$2"

  if [ -e "${source_path}" ]; then
    echo "Sposto: ${source_path} -> ${target_dir}/"
    mv "${source_path}" "${target_dir}/"
  else
    echo "Assente, salto: ${source_path}"
  fi
}

echo "==> Avvio pulizia strutturale del repository"
echo "Root: ${ROOT_DIR}"

echo "==> Creo cartelle archive/"
mkdir -p "${LEGACY_DIR}"
mkdir -p "${EXPERIMENTAL_DIR}"

echo "==> Sposto superfici legacy HTML"
move_if_exists "${ROOT_DIR}/index.html" "${LEGACY_DIR}"
move_if_exists "${ROOT_DIR}/interface.html" "${LEGACY_DIR}"
move_if_exists "${ROOT_DIR}/ipr.html" "${LEGACY_DIR}"
move_if_exists "${ROOT_DIR}/registry.html" "${LEGACY_DIR}"
move_if_exists "${ROOT_DIR}/evidence.html" "${LEGACY_DIR}"

echo "==> Sposto API legacy"
move_if_exists "${ROOT_DIR}/legacy-api" "${LEGACY_DIR}"
move_if_exists "${ROOT_DIR}/hbce-ai-joker-c2" "${LEGACY_DIR}"

echo "==> Sposto file sperimentali root"
move_if_exists "${ROOT_DIR}/corpus-core.js" "${EXPERIMENTAL_DIR}"
move_if_exists "${ROOT_DIR}/corpus-alien-code.js" "${EXPERIMENTAL_DIR}"
move_if_exists "${ROOT_DIR}/search-spec.js" "${EXPERIMENTAL_DIR}"
move_if_exists "${ROOT_DIR}/web-search.js" "${EXPERIMENTAL_DIR}"

echo "==> Pulizia completata"
echo
echo "Struttura finale prevista:"
echo "  archive/legacy/"
echo "  archive/experimental/"
echo
echo "Verifica consigliata:"
echo "  git status"
echo "  npm run build"
