#!/usr/bin/env bash
set -euo pipefail
# Esporta soltanto gli SVG con illustrazioni approvate e conserva i relativi PNG.
# Requisito: rsvg-convert (librsvg2-bin). Risoluzione 512x768.
cd "$(dirname "$0")/.."
command -v rsvg-convert >/dev/null 2>&1 || {
  echo "Manca rsvg-convert: installare librsvg2-bin" >&2
  exit 1
}
count=0
for folder in special-cards terrain-pvp; do
  test -d "public/assets/$folder"
  while IFS= read -r -d '' source; do
    target="${source%.svg}.png"
    case "$target" in
      public/assets/special-cards/tactic-kinetic.png|\
      public/assets/special-cards/tactic-reactive.png|\
      public/assets/terrain-pvp/terrain-debris.png)
        if ! test -s "$target"; then
          echo "Illustrazione ufficiale mancante: $target" >&2
          exit 1
        fi
        ;;
      *) rsvg-convert --width 512 --height 768 --output "$target" "$source" ;;
    esac
    count=$((count+1))
  done < <(find "public/assets/$folder" -maxdepth 1 -type f -name '*.svg' -print0 | sort -z)
done
test "$count" -eq 70 || {
 echo "Attesi esattamente 70 disegni presenti (66 speciali, 4 terreni), trovati $count" >&2
 exit 1
}
echo "OK: $count PNG 512x768 px; i 12 Personaggi Boss sono ancora da illustrare."
