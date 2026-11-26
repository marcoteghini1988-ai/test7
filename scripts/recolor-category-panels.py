#!/usr/bin/env python3
"""Deriva PNG HD dai fronti ufficiali, senza cambiare arte, testo o rarita.
Il solo intervento e' sull'arancione del pannello caratteristiche (sotto
il nastro WEAPON, sopra la targhetta della rarita). Non si modifica la
cornice sorgente: si confronta ogni pixel col modello vuoto della rarita
per escludere testi, simboli e illustrazione sovrapposti.
"""
from pathlib import Path
import hashlib
import json
import re
import sys

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
REF = ROOT / "docs/riferimenti-carte/basi-rarita-ufficiali-2026-11-24"
FRONTS = ROOT / "public/assets/fleet-weapon-fronts"
OUT = ROOT / "public/assets/fleet-weapon-fronts-red"
BASE_OUT = REF / "arma-rosso"
REGISTRY = ROOT / "src/fleetNext/redWeaponFronts.json"
AUDIT = ROOT / "docs/collaudi/categorie-2026-11-26"
SIZE = (3072, 4608)
# La scritta WEAPON e' a y=2925; le caratteristiche a y=3202..3933;
# la rarita a y=4250. L'area illustrazione termina prima del nastro.
# Lasciare intatti la cornice esterna, gli alloggiamenti e la rarita.
BOX = (300, 3050, 2772, 4140)
RARITIES = {"r": "rara", "e": "epica", "l": "leggendaria"}

def read_png(path):
    with Image.open(path) as im:
        if im.format != "PNG" or im.size != SIZE:
            raise ValueError(f"Formato sorgente inatteso: {path} {im.format} {im.size}")
        return np.array(im.convert("RGBA")), im.info.get("icc_profile")

def category_patch(source, model):
    # pixel identico alla cornice vuota => sfondo originale, non lettering
    x0, y0, x1, y1 = BOX
    p = source[y0:y1, x0:x1]
    b = model[y0:y1, x0:x1]
    rgb = b[:, :, :3].astype(np.int16)
    r, g, blue = (rgb[:, :, i] for i in range(3))
    # Solo toni caldi cromatici del fondo. Non convertire bianchi,
    # grafite, argento, testi e riflessi freddi/prismatici.
    chroma = r - blue
    orange = ((r >= g) & (g > blue + 3) & (chroma >= 15)
              & (g - blue >= chroma * 0.14)
              & (g - blue <= chroma * 0.92)
              & (chroma >= r * 0.18)
              & (b[:, :, 3] >= 248))
    same = np.all(p == b, axis=2)
    mask = orange & same
    # Spostamento di tinta arancione -> rosso: luminosita del rosso,
    # blu, trasparenza e rilievi originali restano immutati.
    new_green = np.round(blue + 0.16 * (g - blue)).astype(np.uint8)
    result = source.copy()
    target = result[y0:y1, x0:x1, 1]
    target[mask] = new_green[mask]
    changed = np.any(source != result, axis=2)
    n = int(changed.sum())
    if n < 1000:
        raise ValueError(f"Pannello non riconosciuto: soli {n} pixel cambiati")
    if np.any(changed[:y0]) or np.any(changed[y1:]) or np.any(changed[:, :x0]) or np.any(changed[:, x1:]):
        raise ValueError("Pixel modificati fuori dal pannello")
    if not np.array_equal(source[:, :, 3], result[:, :, 3]):
        raise ValueError("Trasparenza modificata")
    if not np.all(~np.any(source[y0:y1, x0:x1] != result[y0:y1, x0:x1], axis=2) | same):
        raise ValueError("Testo o illustrazione modificati")
    return result, n

def save_png(array, path, icc):
    path.parent.mkdir(parents=True, exist_ok=True)
    kw = {"icc_profile": icc} if icc else {}
    Image.fromarray(array, "RGBA").save(path, format="PNG", compress_level=6, **kw)
    check, _ = read_png(path)
    if not np.array_equal(check, array):
        raise ValueError(f"Salvataggio PNG non lossless: {path}")

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def rarity(id):
    # Nei registri dei fronti, il suffisso identifica le evoluzioni,
    # ma le carte base possono nascere Rare o Epiche.
    m = re.search(r"-rarity-([rel])$", id)
    if m:
        return RARITIES[m.group(1)]
    if id.endswith(("maglio", "slitta")):
        return "comune"
    for number in (1, 2, 3):
        path = ROOT / f"docs/riferimenti-carte/metallo-lotto-{number}-2026-11-25/manifest.json"
        data = json.loads(path.read_text())
        for entry in data["cards"]:
            if entry["id"] == id:
                tier = entry.get("raritySlug") or entry.get("rarity") or entry.get("rarita")
                tier = str(tier).lower()
                translation = {"common": "comune", "rare": "rara", "epic": "epica", "legendary": "leggendaria"}
                tier = translation.get(tier, tier)
                if tier in ("comune", "rara", "epica", "leggendaria"):
                    return tier
    raise ValueError(f"Rarita sorgente non riconosciuta: {id}")

def main():
    # Il registro originale, non la directory, decide quali carte sono attive.
    module = (ROOT / "src/fleetNext/officialWeaponArt.js").read_text()
    ids = list(dict.fromkeys(re.findall(r"[\"'](weapon-[a-z0-9-]+)[\"']", module)))
    if len(ids) != 40:
        raise ValueError(f"Attesi 40 fronti approvati, trovati {len(ids)}")
    OUT.mkdir(parents=True, exist_ok=True)
    AUDIT.mkdir(parents=True, exist_ok=True)
    models = {}
    for tier in ("comune", "rara", "epica", "leggendaria"):
        original = REF / f"{tier}.png"
        model, icc = read_png(original)
        models[tier] = model
        tinted, n = category_patch(model, model)
        save_png(tinted, BASE_OUT / f"{tier}.png", icc)
    # Contact sheet compatta per verifica visiva, non asset di gioco.
    sheet = Image.new("RGB", (1120, 4 * 302), "#111820")
    draw = ImageDraw.Draw(sheet)
    sheet_updated = False
    report = []
    revisions=json.loads((ROOT/'src/fleetNext/approvedWeaponIntegration.json').read_text())
    integrated={c['id']:c for c in revisions['cards']}
    for id in ids:
        if id in integrated:
            item=integrated[id];destination=ROOT/item['path'];current,_=read_png(destination)
            if item.get('sha256') and sha(destination)!=item['sha256']:raise ValueError('Revisione approvata diversa: '+id)
            report.append({'id':id,'dimensions':list(SIZE),'redSha256':sha(destination),'preservedApprovedRevision':True})
            continue
        tier = rarity(id)
        original = FRONTS / f"{id}.png"
        before, icc = read_png(original)
        after, n = category_patch(before, models[tier])
        destination = OUT / original.name
        save_png(after, destination, icc)
        report.append({"id": id, "rarity": tier, "dimensions": list(SIZE),
                       "changedPixels": n, "sourceSha256": sha(original),
                       "redSha256": sha(destination)})
        if "maglio" in id:
            sheet_updated = True
            row = ("comune", "rara", "epica", "leggendaria").index(tier)
            # Mostra intera carta e dettaglio pannello prima/dopo per ogni rarita.
            for index, a in enumerate((before, after)):
                im = Image.fromarray(a, "RGBA")
                thumb = im.resize((184, 276), Image.Resampling.LANCZOS)
                detail = im.crop(BOX).resize((348, 153), Image.Resampling.LANCZOS)
                x = 8 + index * 560
                y = row * 302 + 18
                sheet.paste(thumb, (x, y), thumb)
                sheet.paste(detail, (x + 194, y + 45), detail)
                draw.text((x + 198, y + 14), tier.upper() + (" / PRIMA" if index == 0 else " / DOPO"), fill="white")
    if sheet_updated:
        sheet.save(AUDIT / "maglio-prima-dopo.jpg", quality=90)
    (AUDIT / "verifica.json").write_text(json.dumps({"scope": "pannello caratteristiche",
        "box": list(BOX), "sourcesUnchanged": True, "cards": report}, indent=2) + "\n")
    # Si pubblica il registro solo dopo aver prodotto e verificato tutti i PNG.
    REGISTRY.write_text(json.dumps([id for id in ids if id not in integrated or '/fleet-weapon-fronts-red/' in integrated[id]['path']], indent=2) + "\n")
    print(f"Verificati {len(report)} fronti 3072x4608; modifiche soltanto al fondo del pannello.")

if __name__ == "__main__":
    if "--self-test" in sys.argv:
        # Esercizio sintetico: lo sfondo arancione viene modificato, non
        # il lettering, non una zona arancione dell'illustrazione.
        base = np.zeros((SIZE[1], SIZE[0], 4), dtype=np.uint8)
        base[:, :, :] = (196, 95, 25, 255)
        sample = base.copy()
        sample[3200:3250, 900:1200] = (255, 220, 175, 255)
        changed, n = category_patch(sample, base)
        assert n > 1000 and np.array_equal(sample[:3050], changed[:3050])
        assert np.array_equal(sample[3200:3250, 900:1200], changed[3200:3250, 900:1200])
        assert changed[3500, 1500, 1] < sample[3500, 1500, 1]
        print("Test maschera OK")
    else:
        main()
