# Škoda – katalog a administrace

Tento repozitář obsahuje statický web pro srovnávání modelů Škoda a místní editor dat `admin.html`.

**Důležité:** Nejde o úplný zdrojový kód původního „Atlasu škodovek“ (40 modelových řad). Původní stránka zůstává na https://skoda-atlas-bernard.cozyfig132.chatgpt.site/. Nový editovatelný katalog obsahuje ve výchozích datech zatím 8 verzí Octavie I–IV.

## Opravené obrázky Octavie I facelift
- Zepředu: https://cdn.caranddriving.com/f2/images/used/large/Skoda/skodaoct.jpg
- Zezadu: https://www.autoesa.cz/zajimavosti/wp-content/uploads/2023/09/525287448-5-1024x768.jpg

## Administrace

Otevři `admin.html`: lze přidávat, mazat, přesouvat a upravovat vozy, popisky, roky, varianty i URL fotek a jejich zdrojů. Tlačítko **Uložit změny** ukládá jen do localStorage daného prohlížeče. Žádné heslo ani serverové přihlášení stránka nemá.

Pro trvalou změnu pro všechny návštěvníky použij **Stáhnout data.js pro GitHub** a nahraď staženým souborem `data.js` v repozitáři (commit do větve main). Admin nevykonává zápis na GitHub automaticky.

## Soubory
- `index.html` – katalog, porovnání, výběr a fotky
- `admin.html` – lokální správa dat
- `data.js` – výchozí společná data
- `app.js` – logika katalogu a editoru
- `styles.css` – responzivní vzhled

Fotografie se načítají z cizích serverů a některé odkazy mohou časem přestat fungovat. Uveď zdroj a licenci pro každý snímek.
