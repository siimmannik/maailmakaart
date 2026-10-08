# Maailmakaart: mandrid, ookeanid ja maailmajaod

Interaktiivne harjutusatlas geograafia õpiku teema „Mandrid, ookeanid ja maailmajaod“ (lk 11) selgeks saamiseks.

**Ava leht:** https://siimmannik.github.io/maailmakaart/

## Mida sellega teha saab

- **Avasta.** Kolm kaardikihti: mandrid, maailmajaod ja ookeanid. Igaühe kohta on faktid, pindalad ja seosed (millised ookeanid mandrit uhuvad, millega ookean kokku puutub). Mandrite kihil on saared hallid: saar ei ole mandri osa, aga kuulub maailmajakku.
- **Harjuta.** Seitse mängu: Leia kaardilt, Mis see on?, Kirjuta nimi, Kontuurkaart, Suuruse järjekord, Kes keda uhub? ning Manner või maailmajagu? Valesti vastatud küsimused tulevad hiljem uuesti.
- **Õpiku küsimused.** Õpiku viis küsimust, millele vastatakse kaardil.
- **Kontrolltöö.** 15 küsimust kõigist teemadest. Vastuste õigsust näeb alles lõpus, siis tuleb ka hinne (90 % → 5, 75 % → 4, 50 % → 3, 20 % → 2).
- **Minu edu.** Iga manner, maailmajagu ja ookean annab kuni 3 tähte, kokku 51. Edenemine salvestub selle seadme brauserisse.

Leht töötab arvutis, tahvlis ja telefonis, heledas ja tumedas režiimis. Claude'is avatuna on lisaks „Küsi Claude'ilt“ ja vabavastuse hindamine. Mujal on need peidus ja kõik muu töötab tavapäraselt.

## Kaart ja kokkulepped

Kaart on tehtud Natural Earth'i andmetest mõõtkavas 1 : 50 000 000 ja kuvatakse Natural Earth projektsioonis, keskmeridiaaniga 11° idapikkust. Maailmajagude maismaa ja ookeanide pindalad on õpikust.

Osa piire on kokkuleppelised. Siin on kasutatud järgmisi:

- **Euroopa ja Aasia:** Uurali mäestik, Uurali jõgi, Kaspia meri, Kuma-Manõtši nõgu, Kertši väin, Bosporus ja Dardanellid. Küpros on Aasias.
- **Aafrika ja Aasia:** Suessi kanal, Siinai poolsaar on Aasias.
- **Põhja- ja Lõuna-Ameerika:** Panama ja Colombia piir.
- **Lõuna-Jäämeri:** 60. lõunalaiuskraadist lõuna pool.
- **Põhja-Jäämeri:** põhjapolaarjoonest põhja pool. Sinna kuuluvad ka Hudsoni laht, Valge meri ja Obi laht.
- **India ja Vaikne ookean:** piir kulgeb Malaka väinast mööda Jaava ja Väikeste Sunda saarte lõunarannikut Timorini, sealt Austraalia põhjarannikule ning Tasmaaniast lõunasse mööda 146°55′ idapikkust.
- **Kaspia meri** on järv ega kuulu ühegi ookeani juurde.

## Arendus

`index.html` on valmis leht ega vaja midagi muud. Lähtekood:

| Fail või kaust | Sisu |
| --- | --- |
| `src/01-style.html` | pealkiri, fondid ja CSS |
| `src/02-body.html` | lehe HTML |
| `src/10-data.js` | nimed, pindalad, faktid, nipid ja õpiku küsimused |
| `src/20-core.js` | kaart, suurendamine, salvestamine ja heli |
| `src/30-explore.js` | Avasta-vaade ja Claude'i abi |
| `src/40-quiz.js` | küsimuste tüübid ja mängud |
| `src/50-modes.js` | kontuurkaart, õpiku küsimused, kontrolltöö ja edenemine |
| `map-data.js` | kaardi kujundid (genereeritud) |
| `build/` | kaardi ehitamine Natural Earth'i andmetest |
| `tools/assemble.js` | paneb kokku `index.html` |

```bash
npm install     # vajalik ainult kaardi uuesti ehitamiseks
npm run map     # build/ → map-data.js
npm run build   # src/ + map-data.js → index.html
```

## Allikad

- Kaardiandmed: [Natural Earth](https://www.naturalearthdata.com/) (avalik omand), paketi [world-atlas](https://github.com/topojson/world-atlas) kaudu.
- Riikide jaotus maailmajagudesse kaardi ehitamisel: [world-countries](https://github.com/mledoze/countries) (ODbL).
- Tööriistad: [d3-geo](https://github.com/d3/d3-geo), [d3-contour](https://github.com/d3/d3-contour), [topojson-client](https://github.com/topojson/topojson-client), [polygon-clipping](https://github.com/mfogel/polygon-clipping).
- Sisu: geograafia õpik, lk 11.
