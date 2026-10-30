# Atlas škodovek — online správa přes GitHub token

Původní srovnávač se zachovaným vzhledem a daty všech modelů.

## Online administrace

Otevři `/skoda/admin.html`, vlož **Fine-grained Personal Access Token**, který má přístup jen k repozitáři `Berniocal/skoda` s oprávněním **Contents → Read and write**. Token se neposílá do ChatGPT, do GitHub souborů ani do URL. Je-li zapnuta volba **Zapamatovat GitHub token v tomto prohlížeči** (výchozí), po úspěšném připojení se ukládá do `localStorage` a při dalším otevření se automaticky ověřuje. Volbu lze kdykoli vypnout a tlačítkem **Odpojit a zapomenout token** uložený token odstranit.

1. Klikni **Připojit GitHub**.
2. Klikni **Načíst z GitHubu**. Načte aktuální veřejný `data.json` a bezpečně si zapamatuje SHA verze.
3. Uprav libovolný model, generaci, facelift, karoserii, popis, odkazy na obrázky, autory či licence. Přidávej, mazej, přeuspořádávej položky.
4. Klikni **Zveřejnit katalog na GitHubu**. Přímý zápis vytvoří commit do `main` a GitHub Pages nasadí nová data.
5. V sekci **Pokročilé: upravit soubory celého webu** můžeš otevírat a měnit `index.html`, `style.css`, `app.js`, `admin.html`, `admin.js`, `photo.html`, `data.json` a `README.md`. Také se zapisují na GitHub jako commity.

Pro zálohu zůstává možnost lokálního uložení, exportu a importu `data.json`.

**Bezpečnost:** Používej krátkodobý token s oprávněními výhradně pro `skoda`. Token je heslo, nezadávej ho na nedůvěryhodných stránkách a nesdílej ho v chatu. Při zapamatování je token v `localStorage` **nešifrovaný a čitelný pro skripty na stejné doméně**; na sdíleném nebo nedůvěryhodném zařízení zapamatování vypni. Administrace je veřejně dostupná, ale bez platného tokenu nemůže zapisovat do repozitáře. Pro trvalé zabezpečení s přihlášením lze později přejít na GitHub OAuth/Backend.

**Ochrana před souběžnými úpravami:** GitHub API vyžaduje blob SHA při uložení. Pokud soubor mezitím změnil jiný uživatel, ukládání selže místo tichého přepsání.

Repozitář: https://github.com/Berniocal/skoda

Zdrojová původní aplikace: https://skoda-atlas-bernard.cozyfig132.chatgpt.site/

Fotografie jsou externí odkazy. Počet katalogových položek určuje obsah `data.json`.
