# Maglio Ferrogravitazionale — quattro fronti ufficiali integrati

**22 novembre 2026 — repository unico `marcoteghini1988-ai/test7` — approvazione utente ricevuta.**

La famiglia `weapon-confirmed-metallic-maglio` ora usa i fronti approvati nella
battaglia 3D, in Mano, nel Bazar/collezione, negli slot Arma e negli scarti.
Un unico collegamento `cardFacePath(id)` evita copie incoerenti tra le schermate.

| Rarità | ID catalogo | Danno nominale | Asset |
|---|---|---:|---|
| Comune | `weapon-confirmed-metallic-maglio` | 18 HP | `public/assets/fleet-weapon-fronts/weapon-confirmed-metallic-maglio.webp` |
| Rara | `weapon-confirmed-metallic-maglio-rarity-r` | 46 HP | `public/assets/fleet-weapon-fronts/weapon-confirmed-metallic-maglio-rarity-r.webp` |
| Epica | `weapon-confirmed-metallic-maglio-rarity-e` | 109 HP | `public/assets/fleet-weapon-fronts/weapon-confirmed-metallic-maglio-rarity-e.webp` |
| Leggendaria | `weapon-confirmed-metallic-maglio-rarity-l` | 154 HP | `public/assets/fleet-weapon-fronts/weapon-confirmed-metallic-maglio-rarity-l.webp` |

Le immagini derivano dalle quattro varianti finali approvate in chat. Sono
ottimizzate per web in **WebP 1024×1536 qualità 90**, preservando il rapporto
verticale 2:3 e le differenze dei moduli 3D tra evoluzioni.

La categoria ARMA mantiene il simbolo ufficiale della torretta futuristica
arancione. Il METALLO mantiene il pittogramma ufficiale dei lingotti.
Base, alloggiamenti e targhette rimangono quelli approvati.

**Non sono cambiati:** danni esecutivi, rarità, costi Energia, copie possedute,
dorso delle carte, progressione, timer, IA, plancia o meccaniche del gioco.

Collegamento: `src/fleetNext/officialWeaponArt.js` →
`src/fleetNext/rules.js` → `cardFacePath` → schermate già esistenti.
Regressione: `src/fleetNextOfficialMaglioArt.test.js`.
Per altre carte, seguire `docs/PROCEDURA_OBBLIGATORIA_CREAZIONE_CARTE.md`.
