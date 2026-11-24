# Maglio Ferrogravitazionale — quattro fronti ufficiali integrati

**Aggiornato il 24 novembre 2026 — repository unico `marcoteghini1988-ai/test7` — quattro fronti approvati.**

La famiglia `weapon-confirmed-metallic-maglio` ora usa i fronti approvati nella
battaglia 3D, in Mano, nel Bazar/collezione, negli slot Arma e negli scarti.
Un unico collegamento `cardFacePath(id)` evita copie incoerenti tra le schermate.

| Rarità | ID catalogo | Danno nominale | Asset |
|---|---|---:|---|
| Comune | `weapon-confirmed-metallic-maglio` | 18 HP | `public/assets/fleet-weapon-fronts/weapon-confirmed-metallic-maglio.png` |
| Rara | `weapon-confirmed-metallic-maglio-rarity-r` | 46 HP | `public/assets/fleet-weapon-fronts/weapon-confirmed-metallic-maglio-rarity-r.png` |
| Epica | `weapon-confirmed-metallic-maglio-rarity-e` | 109 HP | `public/assets/fleet-weapon-fronts/weapon-confirmed-metallic-maglio-rarity-e.png` |
| Leggendaria | `weapon-confirmed-metallic-maglio-rarity-l` | 154 HP | `public/assets/fleet-weapon-fronts/weapon-confirmed-metallic-maglio-rarity-l.png` |

Le immagini derivano dalle quattro varianti finali approvate in chat. Sono
**PNG 3072×4608**, ricomposti dalle illustrazioni, dalle cornici, dagli
adesivi e dai livelli SVG del testo. I vecchi WebP 1024×1536 sono ritirati.
I livelli di testo rimangono modificabili nelle sorgenti per la localizzazione.

La categoria ARMA mantiene il simbolo ufficiale della torretta futuristica
arancione. Il METALLO mantiene il pittogramma ufficiale dei lingotti.
Base, alloggiamenti e targhette rimangono quelli approvati.

**Non sono cambiati:** danni esecutivi, rarità, costi Energia, copie possedute,
dorso delle carte, progressione, timer, IA, plancia o meccaniche del gioco.
Gli effetti ora partono dal bordo basso per A e dal bordo alto per B; la forma
del Maglio è un impulso gravitazionale con un solo impatto reale e rifiniture
progressive. Ciascuna rarità ha un timbro di lancio e impatto distinto nel
bus SFX del gioco, sincronizzato con i 470 ms fra sparo e impatto e soggetto
alla preferenza Effetti Sonori. Si veda
`docs/REGOLA_EFFETTI_VISIVI_CARTE_2026-11-24.md`.

Collegamento: `src/fleetNext/officialWeaponArt.js` →
`src/fleetNext/rules.js` → `cardFacePath` → schermate già esistenti.
Regressione: `src/fleetNextOfficialMaglioArt.test.js`.
Per altre carte, seguire `docs/PROCEDURA_OBBLIGATORIA_CREAZIONE_CARTE.md`.
