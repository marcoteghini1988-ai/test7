#!/usr/bin/env bash
set -euo pipefail
# Esporta gli SVG delle carte ufficiali e conserva i fronti illustrati in PNG.
# Requisito: rsvg-convert (librsvg2-bin). Risoluzione 512x768.
cd "$(dirname "$0")/.."
command -v rsvg-convert >/dev/null 2>&1 || {
  echo "Manca rsvg-convert: installare librsvg2-bin" >&2
  exit 1
}
count=0
for folder in special-cards boss-characters terrain-pvp; do
  test -d "public/assets/$folder"
  while IFS= read -r -d '' source; do
    target="${source%.svg}.png"
    case "$target" in
      public/assets/boss-characters/boss-character-1.png|\
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
test "$count" -eq 82 || {
 echo "Attesi esattamente 82 disegni gia' presenti (66 speciali, 12 boss, 4 terreni), trovati $count" >&2
 exit 1
}
echo "OK: $count PNG ufficiali 512x768 px."

# Ricompone i quattro PNG HD confermati nel commit di trasporto.
if test -f scripts/maglio-transfer/manifest.json; then
  python3 - <<'RESTORE_MAGLIO'
from pathlib import Path
import hashlib, json
parts=Path('scripts/maglio-transfer')
targets=Path('public/assets/fleet-weapon-fronts')
for entry in json.loads((parts/'manifest.json').read_text()):
    target=targets/entry['name']
    checksum=hashlib.sha256()
    with target.open('wb') as out:
        for i in range(entry['parts']):
            with (parts/f"{entry['rarity']}.{i:02d}.part").open('rb') as source:
                while block:=source.read(1_048_576):
                    out.write(block)
                    checksum.update(block)
    assert checksum.hexdigest()==entry['sha256'], target
    print(f"PNG HD identico all'originale: {target}")
RESTORE_MAGLIO
  git add public/assets/fleet-weapon-fronts/weapon-confirmed-metallic-maglio*.png
  cp scripts/maglio-transfer/original-export.sh scripts/export-official-special-pngs.sh
  git add scripts/export-official-special-pngs.sh
  git rm -qr -- scripts/maglio-transfer
fi
