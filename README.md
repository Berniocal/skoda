# Atlas škodovek — kompletní katalog

Obnovený původní vzhled a ovládání Atlasu podle uložené stránky s kompletními daty od autora.

**Obsah:** 40 modelových řad, 78 vzhledových verzí a 95 položek včetně karoserií.

Zachován výběr generací, faceliftů a karoserií, vlastní srovnání, mřížka a řádkové rozložení, zvětšování fotografií a sdílení výběru pomocí URL.

Fotografie Octavie I po faceliftu (Liftback): **zepředu Car and Driving**, **zezadu Auto ESA**. Jde o externí fotografie s právy jejich držitelů, nikoliv o snímky Wikimedia Commons.

## Administrace

Na `admin.html` lze přidávat, upravovat a mazat modely, roky, popisky, URL fotografií i metadata.

Admin ukládá změny **lokálně v prohlížeči**. Pro veřejné zveřejnění změn je nutné použít tlačítko **Stáhnout data.json** a v repozitáři nahradit soubor `data.json`. Tato veřejná statická stránka neukládá žádná hesla ani tokeny GitHub.

## Spuštění

Web je v `index.html`, admin v `admin.html`, údaje v `data.json`. Umístěte soubory do kořene GitHub Pages a používejte HTTP(S), protože web načítá JSON přes `fetch`.

Původně zveřejněný web: https://skoda-atlas-bernard.cozyfig132.chatgpt.site/

Rekonstrukce zachovává vzhled a interakce podle uložené kopie, ale nezaručuje bitově stejný build. Externí zdroje fotografií mohou odmítnout jejich načtení.
