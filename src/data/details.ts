// "What to see" highlights per place, shown in the place detail. Hand-written, in both
// languages; keep each point short and to well-established facts (no prices or hours here).

import type { Bi } from './types'

const h = (cs: string, en: string): Bi => ({ cs, en })

export const highlights: Record<string, Bi[]> = {
  // ---------------------------------------------------------------- City centre
  nyhavn: [
    h('Barevné domy na severní (sluneční) straně, nejstarší z konce 17. století', 'The coloured houses on the sunny north side, the oldest from the late 1600s'),
    h('Historické dřevěné lodě kotvící v kanálu', 'Historic wooden ships moored along the canal'),
    h('Andersenovy domy č. 18, 20 a 67', 'Hans Christian Andersen’s homes at nos. 18, 20 and 67'),
    h('Odtud vyjíždějí okružní plavby po kanálech', 'Canal tours leave from here'),
  ],
  'latin-quarter': [
    h('Katedrála Vor Frue Kirke s Thorvaldsenovými sochami Krista a apoštolů', 'The cathedral (Vor Frue Kirke) with Thorvaldsen’s Christ and the Apostles'),
    h('Nádvoří staré univerzity a ulice Fiolstræde s antikvariáty', 'The old university courtyard and Fiolstræde with its second-hand bookshops'),
    h('Pěší zóna Strøget – jedna z nejdelších v Evropě', 'Strøget – one of Europe’s longest pedestrian streets'),
  ],
  magstraede: [
    h('Hrbolatá dlažba a domy, které přežily požáry v 18. století', 'Cobbles and houses that survived the 18th-century fires'),
    h('Pohled z Gammel Strand přes kanál na Christiansborg', 'The view from Gammel Strand across the canal to Christiansborg'),
    h('Klidné ráno, kdy jsou uličky skoro prázdné', 'Quiet mornings when the lanes are almost empty'),
  ],
  christiansborg: [
    h('Věž paláce – nejvyšší věž ve městě s výhledem zdarma', 'The palace tower – the city’s tallest, with a free view'),
    h('V jedné budově sídlí parlament, vláda i Nejvyšší soud', 'Parliament, the prime minister’s office and the Supreme Court share one building'),
    h('Královské reprezentační sály, kuchyně a stáje (placené)', 'The Royal Reception Rooms, kitchen and stables (paid)'),
    h('Ruiny starších hradů v podzemí', 'Ruins of earlier castles underground'),
  ],
  'round-tower': [
    h('Spirálová rampa bez schodů až nahoru – prý po ní vyjel na koni car Petr Veliký', 'A spiral ramp with no steps to the top – Peter the Great is said to have ridden up on horseback'),
    h('Nejstarší fungující observatoř v Evropě', 'Europe’s oldest working observatory'),
    h('Skleněná podlaha nad jádrem věže a výhled na střechy starého města', 'A glass floor over the tower’s core and views over the old town’s roofs'),
    h('Galerie v bývalé univerzitní knihovně', 'A gallery in the former university library hall'),
  ],
  rosenborg: [
    h('Korunovační klenoty a královská koruna v klenotnici ve sklepě', 'The Crown Jewels and the royal crown in the basement treasury'),
    h('Rytířský sál s korunovačními trůny a stříbrnými lvy', 'The Knights’ Hall with the coronation thrones and silver lions'),
    h('Renesanční zámek Kristiána IV. téměř beze změn', 'Christian IV’s Renaissance castle, almost unchanged'),
    h('Okolní Královská zahrada (Kongens Have)', 'The surrounding King’s Garden'),
  ],
  'botanical-garden': [
    h('Viktoriánský palmový skleník z 19. století', 'The 19th-century Victorian Palm House'),
    h('Tisíce rostlin z celého světa a jezírko', 'Thousands of plants from around the world and a pond'),
    h('Hned vedle SMK a Hirschsprungovy sbírky', 'Right next to SMK and the Hirschsprung Collection'),
  ],
  tivoli: [
    h('Jeden z nejstarších zábavních parků na světě (od roku 1843)', 'One of the world’s oldest amusement parks (since 1843)'),
    h('Na podzim halloweenská výzdoba s tisíci dýní a světel', 'In autumn, Halloween decorations with thousands of pumpkins and lights'),
    h('Historická dřevěná horská dráha a pohádkové zahrady', 'A historic wooden roller coaster and storybook gardens'),
    h('Nejhezčí je po setmění, kdy se rozsvítí', 'Best after dark, when the lights come on'),
  ],
  glyptotek: [
    h('Zimní zahrada s palmami pod skleněnou kupolí a kavárnou', 'The Winter Garden with palms under a glass dome, and a café'),
    h('Antické sochy z Egypta, Řecka a Říma', 'Ancient sculpture from Egypt, Greece and Rome'),
    h('Francouzské umění: Rodin, Degas, Monet, Gauguin', 'French art: Rodin, Degas, Monet, Gauguin'),
    h('Střešní terasa s výhledem na Tivoli', 'A roof terrace overlooking Tivoli'),
  ],
  'national-museum': [
    h('Dánské dějiny od doby kamenné po vikingy', 'Danish history from the Stone Age to the Vikings'),
    h('Sluneční vůz z Trundholmu a bronzové lury', 'The Trundholm Sun Chariot and bronze lurs'),
    h('Dětské muzeum, kde si děti mohou vše osahat', 'A children’s museum where kids can touch everything'),
  ],
  smk: [
    h('Dánský zlatý věk – krajiny a portréty 19. století', 'The Danish Golden Age – 19th-century landscapes and portraits'),
    h('Evropští mistři: Rembrandt, Rubens, Matisse', 'European masters: Rembrandt, Rubens, Matisse'),
    h('Propojení staré a moderní budovy skleněnou ulicí podél parku', 'Old and new buildings linked by a glass street along the park'),
  ],
  designmuseum: [
    h('Slavné dánské židle – celá chodba plná ikon designu', 'Famous Danish chairs – a whole corridor of design icons'),
    h('Budova bývalé rokokové nemocnice s klidnou zahradou', 'A former Rococo hospital building with a quiet garden'),
    h('Dánský nábytek, porcelán a móda', 'Danish furniture, porcelain and fashion'),
  ],
  thorvaldsens: [
    h('Celé dílo sochaře Bertela Thorvaldsena v jedné budově', 'The whole work of sculptor Bertel Thorvaldsen in one building'),
    h('Barevné stropy a podlahy – muzeum je samo uměleckým dílem', 'Coloured ceilings and floors – the museum is itself a work of art'),
    h('Thorvaldsenův hrob uprostřed nádvoří', 'Thorvaldsen’s grave in the courtyard'),
  ],
  'black-diamond': [
    h('Moderní přístavba Královské knihovny z černé žuly', 'The Royal Library’s modern extension clad in black granite'),
    h('Atrium s výhledem na přístav – vstup zdarma', 'An atrium with a harbour view – free to enter'),
    h('Starou knihovnu a zahradu spojuje most přes silnici', 'A bridge over the road links it to the old library and garden'),
  ],
  torvehallerne: [
    h('Dvě skleněné tržnice s desítkami stánků', 'Two glass market halls with dozens of stalls'),
    h('Smørrebrød, ryby, čerstvé pečivo a káva', 'Smørrebrød, fish, fresh pastries and coffee'),
    h('Dobré místo na rychlý oběd u Nørreport', 'A good place for a quick lunch by Nørreport'),
  ],
  'canal-tour': [
    h('Město z vody: Nyhavn, Christiansborg, Opera, Malá mořská víla', 'The city from the water: Nyhavn, Christiansborg, the Opera, the Little Mermaid'),
    h('Nízké mosty, pod kterými se loď sotva protáhne', 'Low bridges the boat barely squeezes under'),
    h('Kanály Christianshavnu s hausbóty', 'Christianshavn’s canals with their houseboats'),
  ],
  'city-hall': [
    h('Velký sál s červenými cihlami a galeriemi', 'The great hall with red brick and galleries'),
    h('Světové hodiny Jense Olsena – mechanické astronomické hodiny', 'Jens Olsen’s World Clock – a mechanical astronomical clock'),
    h('Socha Andersena na rohu u bulváru jeho jména', 'The Andersen statue on the corner by the boulevard named after him'),
  ],
  'holmens-church': [
    h('Barokní oltář a kazatelna z tmavého dřeva', 'A Baroque altar and dark carved pulpit'),
    h('Kaple s hroby námořních hrdinů', 'A chapel with the tombs of naval heroes'),
    h('Zde se v roce 1967 vdávala královna Margrethe II.', 'Queen Margrethe II married here in 1967'),
  ],
  'david-collection': [
    h('Islámské umění od Španělska po Indii', 'Islamic art from Spain to India'),
    h('Evropský nábytek a porcelán 18. století', '18th-century European furniture and porcelain'),
    h('Elegantní měšťanský dům a vstup zdarma', 'An elegant townhouse – and free admission'),
  ],
  hirschsprung: [
    h('Malíři dánského zlatého věku v intimních sálech', 'Danish Golden Age painters in intimate rooms'),
    h('Skagenští malíři a jejich severské světlo', 'The Skagen painters and their northern light'),
    h('Tiché interiéry Vilhelma Hammershøie', 'Vilhelm Hammershøi’s quiet interiors'),
  ],
  'kongens-have': [
    h('Lipové aleje a růžová zahrada', 'Avenues of lime trees and a rose garden'),
    h('Socha H. C. Andersena', 'A statue of Hans Christian Andersen'),
    h('Výhled na zámek Rosenborg přes zahradu', 'The view across the garden to Rosenborg Castle'),
  ],
  dac: [
    h('Výstavy o tom, jak architektura mění města', 'Exhibitions on how architecture shapes cities'),
    h('Budova BLOX nad rušnou silnicí, přímo u vody', 'The BLOX building straddling a busy road, right on the water'),
    h('Kavárna a obchod s designem', 'A café and a design shop'),
  ],
  'museum-of-copenhagen': [
    h('Archeologické nálezy z budování metra', 'Archaeological finds from building the metro'),
    h('Jak se z rybářské vesnice stalo hlavní město', 'How a fishing village became a capital'),
    h('Příběhy Kodaňanů napříč staletími', 'Stories of Copenhageners across the centuries'),
  ],
  graabroedretorv: [
    h('Barevné domy z doby po velkém požáru roku 1728', 'Coloured houses built after the great fire of 1728'),
    h('Venkovní posezení restaurací (s dekami a ohřívači)', 'Restaurant terraces (with blankets and heaters)'),
    h('Pár kroků od Strøgetu a Kulaté věže', 'A few steps from Strøget and the Round Tower'),
  ],
  charlottenborg: [
    h('Barokní palác z 17. století, sídlo Královské akademie umění', 'A 17th-century Baroque palace, home of the Royal Academy of Fine Arts'),
    h('Velké světlé sály pro současné umění', 'Large bright halls for contemporary art'),
    h('Přímo na Kongens Nytorv u vstupu do Nyhavnu', 'Right on Kongens Nytorv at the entrance to Nyhavn'),
  ],
  'war-museum': [
    h('Dělová síň – jedna z nejdelších klenutých síní v Evropě', 'The Cannon Hall – one of Europe’s longest vaulted halls'),
    h('Budova staré zbrojnice Kristiána IV.', 'Christian IV’s old arsenal building'),
    h('Dánsko ve válkách od 16. století po dnešek', 'Denmark at war from the 1500s to today'),
  ],
  bibliotekshaven: [
    h('Jezírko s fontánou a lavičkami', 'A pond with a fountain and benches'),
    h('Socha filozofa Sørena Kierkegaarda', 'A statue of the philosopher Søren Kierkegaard'),
    h('Schované mezi Christiansborgem a knihovnou – málo lidí', 'Hidden between Christiansborg and the library – few people'),
  ],
  'opera-house': [
    h('Obrovská plochá střecha přesahující nad nábřeží', 'A huge flat roof overhanging the quay'),
    h('Na ose s Amalienborgem a Mramorovým kostelem přes vodu', 'Lined up with Amalienborg and the Marble Church across the water'),
    h('Foyer s velkou dřevěnou „dýní“ sálu', 'A foyer with the auditorium’s big wooden “pumpkin”'),
  ],

  // ------------------------------------------------------ Frederiksstaden & north
  nyboder: [
    h('Řady žlutých domků pro námořníky z doby Kristiána IV.', 'Rows of yellow sailors’ houses from Christian IV’s time'),
    h('Dodnes v nich bydlí lidé spojení s námořnictvem', 'Still home to people connected to the navy'),
    h('Malé muzeum v jednom z domků (omezená otevírací doba)', 'A small museum in one of the houses (limited hours)'),
  ],
  kastellet: [
    h('Hvězdicová pevnost se zelenými valy a vodním příkopem', 'A star-shaped fortress with green ramparts and a moat'),
    h('Červené kasárny a větrný mlýn na valu', 'Red barracks and a windmill on the rampart'),
    h('Procházka po valech s výhledem na přístav', 'A walk along the ramparts with harbour views'),
  ],
  'little-mermaid': [
    h('Bronzová socha podle Andersenovy pohádky (1913)', 'The bronze statue from Andersen’s fairy tale (1913)'),
    h('Je menší, než lidé čekají – sedí na kameni u břehu', 'Smaller than people expect – sitting on a rock by the shore'),
    h('Nejméně lidí bývá brzy ráno', 'Fewest people early in the morning'),
  ],
  amalienborg: [
    h('Čtyři rokokové paláce kolem osmiúhelníkového náměstí', 'Four Rococo palaces around an octagonal square'),
    h('Výměna stráží každý den v poledne', 'Changing of the guard every day at noon'),
    h('Jezdecká socha Frederika V. uprostřed', 'The equestrian statue of Frederik V in the centre'),
    h('Muzeum v jednom z paláců (placené)', 'A museum in one of the palaces (paid)'),
  ],
  'marble-church': [
    h('Jedna z největších kopulí v Evropě', 'One of Europe’s largest domes'),
    h('Kruhový interiér pod malovanou kupolí', 'A round interior under the painted dome'),
    h('Prohlídka kopule s výhledem (placená, jen v některé časy)', 'Dome tour with a view (paid, set times only)'),
  ],

  // ---------------------------------------------------------------- Christianshavn
  'saviour-spire': [
    h('Točité schodiště vně věže až na samý vrchol', 'A spiral staircase on the outside of the spire to the very top'),
    h('Jeden z nejlepších výhledů na Kodaň', 'One of the best views of Copenhagen'),
    h('Barokní varhany se slony uvnitř kostela', 'A Baroque organ carried by elephants inside the church'),
  ],
  christianshavn: [
    h('Kanál s loďkami a hausbóty, trochu jako Amsterdam', 'A canal with boats and houseboats, a little like Amsterdam'),
    h('Kavárny a restaurace podél vody', 'Cafés and restaurants along the water'),
    h('Hned u věže Vor Frelsers a Christianie', 'Next to the Vor Frelsers spire and Christiania'),
  ],
  christiania: [
    h('Svobodné městečko založené v roce 1971 v bývalých kasárnách', 'A free town founded in 1971 in former barracks'),
    h('Svérázné ručně stavěné domy u jezera', 'Quirky hand-built houses by the lake'),
    h('Na Pusher Street nefotografujte', 'Don’t take photos on Pusher Street'),
  ],
  reffen: [
    h('Stánky s jídlem z celého světa v kontejnerech', 'Food stalls from around the world in shipping containers'),
    h('Bývalá loděnice s výhledem na vodu', 'A former shipyard with water views'),
    h('Sezónní – mimo léto kratší provoz', 'Seasonal – shorter hours outside summer'),
  ],
  copenhill: [
    h('Spalovna odpadu s umělou sjezdovkou na střeše', 'A waste-to-energy plant with an artificial ski slope on the roof'),
    h('Výstup na střechu s výhledem na Øresund a Švédsko', 'A climb to the roof with views over the Øresund to Sweden'),
    h('Navrhlo studio BIG', 'Designed by BIG'),
  ],

  // ---------------------------------------------- Nørrebro, Vesterbro, Frederiksberg
  assistens: [
    h('Hroby H. C. Andersena a Sørena Kierkegaarda', 'The graves of Hans Christian Andersen and Søren Kierkegaard'),
    h('Hřbitov slouží i jako park – lidé tu chodí na procházky', 'The cemetery doubles as a park – locals stroll here'),
    h('Na podzim zlaté aleje', 'Golden avenues in autumn'),
  ],
  jaegersborggade: [
    h('Malá ulice plná kaváren, pekáren a dílen', 'A short street full of cafés, bakeries and workshops'),
    h('Pražírna Coffee Collective', 'The Coffee Collective roastery'),
    h('Kousek od hřbitova Assistens', 'A short walk from Assistens Cemetery'),
  ],
  superkilen: [
    h('Park s předměty z mnoha zemí, odkud pocházejí místní obyvatelé', 'A park with objects from the many countries local residents come from'),
    h('Černé náměstí s bílými vlnitými čarami', 'The Black Square with its white wavy lines'),
    h('Červené náměstí pro sport a hry', 'The Red Square for sport and play'),
  ],
  kodbyen: [
    h('Bývalé jatky, dnes restaurace a bary', 'Former slaughterhouses, now restaurants and bars'),
    h('Bílá „Masná čtvrť“ s funkcionalistickými halami', 'The white Meatpacking District with its functionalist halls'),
    h('Nejživější večer', 'Liveliest in the evening'),
  ],
  'frederiksberg-gardens': [
    h('Romantická anglická zahrada s kanály a čínským pavilonem', 'A romantic English garden with canals and a Chinese pavilion'),
    h('Zámek Frederiksberg na kopci', 'Frederiksberg Palace on the hill'),
    h('Přes plot se dá zahlédnout sloní výběh zoo', 'Glimpses of the zoo’s elephants over the fence'),
  ],
  cisternerne: [
    h('Obrovská podzemní nádrž s kamennými sloupy', 'A vast underground reservoir with stone pillars'),
    h('Každý rok nová instalace přímo pro tento prostor', 'A new site-specific installation every year'),
    h('Vstup skleněnou pyramidou v parku Søndermarken', 'Entrance through a glass pyramid in Søndermarken park'),
  ],
  'grundtvig-church': [
    h('Průčelí připomíná obří varhany', 'The façade looks like a giant organ'),
    h('Celý kostel z několika milionů žlutých cihel', 'The whole church built from millions of yellow bricks'),
    h('Prostý, ohromně vysoký interiér', 'A plain, immensely tall interior'),
  ],
  'workers-museum': [
    h('Byt dělnické rodiny, jak ho opustili', 'A workers’ family flat, left as it was'),
    h('Kodaň 50. let s obchodem a kavárnou', '1950s Copenhagen with a shop and café'),
    h('Historický pivní sklep s jídlem', 'A historic beer cellar serving food'),
  ],
  planetarium: [
    h('Kopulový sál s projekcí po celé obloze', 'A dome cinema projected across the whole sky'),
    h('Výstava o vesmíru a planetách', 'An exhibition about space and the planets'),
    h('Pojmenované po astronomovi Tychonu Brahe', 'Named after the astronomer Tycho Brahe'),
  ],
  'islands-brygge': [
    h('Přístavní koupaliště s čistou mořskou vodou (v létě)', 'The harbour bath with clean sea water (in summer)'),
    h('Výhled přes vodu na centrum', 'Views across the water to the centre'),
    h('Lávky Bryggebroen a Lille Langebro pro chodce a kola', 'The Bryggebroen and Lille Langebro bridges for walkers and bikes'),
  ],
  zoo: [
    h('Sloní pavilon od Normana Fostera', 'The elephant house by Norman Foster'),
    h('Pandy velké', 'Giant pandas'),
    h('Tropický pavilon a dětská zoo', 'A tropical house and a children’s zoo'),
    h('Rozhledna z roku 1905', 'An observation tower from 1905'),
  ],

  // ---------------------------------------------------------------- Food & coffee
  'la-glace': [
    h('Sportskage – dort se šlehačkou, karamelem a makronkami', 'Sportskage – a cream, caramel and macaroon cake'),
    h('Horká čokoláda se šlehačkou', 'Hot chocolate with whipped cream'),
    h('Salonky ve stylu 19. století', '19th-century style tea rooms'),
  ],
  'sankt-peders-bageri': [
    h('Skořicoví šneci („kanelsnegle“)', 'Cinnamon swirls (“kanelsnegle”)'),
    h('Ve středu obří šnek „onsdagssnegl“', 'The giant Wednesday swirl, “onsdagssnegl”'),
    h('Nejstarší pekárna v Kodani, v Latinské čtvrti', 'Copenhagen’s oldest bakery, in the Latin Quarter'),
  ],
  'cafe-paludan': [
    h('Káva mezi regály se starými knihami', 'Coffee among shelves of old books'),
    h('Snídaně a jednoduchý oběd za rozumné ceny', 'Breakfast and simple lunches at fair prices'),
    h('Studentská atmosféra u univerzity', 'A student atmosphere by the university'),
  ],
  schonnemann: [
    h('Klasické smørrebrød – sleď, krevety, pečené maso', 'Classic smørrebrød – herring, shrimp, roast meats'),
    h('Velký výběr dánských pálenek (snaps)', 'A long list of Danish snaps'),
    h('Sklepní restaurace s dlouhou tradicí', 'A cellar restaurant with a long tradition'),
  ],
  aamanns: [
    h('Moderní smørrebrød z místních surovin', 'Modern smørrebrød from local produce'),
    h('Na místě i s sebou', 'Eat in or take away'),
    h('Hned u parku Østre Anlæg a SMK', 'Right by Østre Anlæg park and SMK'),
  ],
  'told-snaps': [
    h('Tradiční smørrebrød o ulici dál od Nyhavnu', 'Traditional smørrebrød one street back from Nyhavn'),
    h('Útulný malý sál', 'A cosy little dining room'),
    h('Vhodné na oběd mezi Nyhavnem a Amalienborgem', 'Good for lunch between Nyhavn and Amalienborg'),
  ],
  palaegade: [
    h('Elegantní smørrebrød v klasickém stylu', 'Elegant smørrebrød in the classic style'),
    h('Mezi Kongens Nytorv a Amalienborgem', 'Between Kongens Nytorv and Amalienborg'),
    h('Obědy; poslední příchod 14:45', 'Lunch; last arrival 14:45'),
  ],
  'lagkagehuset-christianshavn': [
    h('Dánské pečivo (wienerbrød) a chléb', 'Danish pastries (wienerbrød) and bread'),
    h('Původní pobočka známé dánské pekárny', 'The original branch of a well-known Danish bakery'),
    h('Na náměstí Christianshavns Torv u metra', 'On Christianshavns Torv by the metro'),
  ],

  // ------------------------------------------------------------------- Walks
  'walk-stroget-nyhavn': [
    h('Radniční náměstí → Strøget → Amagertorv → Kongens Nytorv → Nyhavn', 'City Hall Square → Strøget → Amagertorv → Kongens Nytorv → Nyhavn'),
    h('Čapí fontána na Amagertorv', 'The Stork Fountain on Amagertorv'),
    h('Obchody, kostely a náměstí po cestě', 'Shops, churches and squares along the way'),
  ],
  'walk-harbour-loop': [
    h('Lávka Inderhavnsbroen z Nyhavnu na Christianshavn', 'The Inderhavnsbroen bridge from Nyhavn to Christianshavn'),
    h('Opera a výhled zpět na Amalienborg', 'The Opera and the view back to Amalienborg'),
    h('Kanály Christianshavnu a věž Vor Frelsers', 'Christianshavn’s canals and the Vor Frelsers spire'),
  ],
  'walk-nyboder-amalienborg': [
    h('Žluté domky Nyboder', 'The yellow houses of Nyboder'),
    h('Pevnost Kastellet a Gefionina fontána', 'Kastellet fortress and the Gefion Fountain'),
    h('Amalienborg a Mramorový kostel', 'Amalienborg and the Marble Church'),
  ],
  'walk-norrebro': [
    h('Most královny Louisy nad jezery', 'Queen Louise’s Bridge over the lakes'),
    h('Hřbitov Assistens a Jægersborggade', 'Assistens Cemetery and Jægersborggade'),
    h('Park Superkilen', 'Superkilen park'),
  ],
  'walk-lakes': [
    h('Tři jezera: Sortedams, Peblinge a Skt. Jørgens Sø', 'Three lakes: Sortedams, Peblinge and Skt. Jørgens Sø'),
    h('Labutě a rovná cesta podél vody', 'Swans and a flat path by the water'),
    h('Most královny Louisy uprostřed', 'Queen Louise’s Bridge halfway'),
  ],
  'walk-old-town': [
    h('Gammeltorv s fontánou Caritas', 'Gammeltorv with the Caritas fountain'),
    h('Katedrála a náměstí Gråbrødretorv', 'The cathedral and Gråbrødretorv square'),
    h('Kulatá věž a Kultorvet', 'The Round Tower and Kultorvet'),
  ],
  'walk-slotsholmen': [
    h('Kanál Ved Stranden a pohled na Christiansborg', 'The Ved Stranden canal and the view of Christiansborg'),
    h('Thorvaldsenovo muzeum a nádvoří paláce', 'Thorvaldsens Museum and the palace courtyards'),
    h('Zahrada Královské knihovny a Černý diamant', 'The Royal Library Garden and the Black Diamond'),
  ],
  'walk-langelinie': [
    h('Amaliehaven naproti Opeře', 'Amaliehaven, facing the Opera'),
    h('Gefionina fontána a Malá mořská víla', 'The Gefion Fountain and the Little Mermaid'),
    h('Promenáda Langelinie a valy Kastellet', 'The Langelinie promenade and Kastellet’s ramparts'),
  ],
  'walk-islands-brygge': [
    h('Most Langebro a přístavní park', 'Langebro bridge and the harbour park'),
    h('Přístavní koupaliště Islands Brygge', 'The Islands Brygge harbour bath'),
    h('Lávka Bryggebroen a nábřeží Kalvebod Bølge', 'The Bryggebroen footbridge and the Kalvebod Bølge waterfront'),
  ],
  'walk-vesterbro': [
    h('Istedgade – pestrá ulice Vesterbra', 'Istedgade – Vesterbro’s colourful street'),
    h('Masná čtvrť Kødbyen', 'The Meatpacking District, Kødbyen'),
    h('Værnedamsvej s malými obchody a kavárnami', 'Værnedamsvej with small shops and cafés'),
  ],
  'walk-frederiksberg': [
    h('Zahrada Frederiksberg Have', 'Frederiksberg Gardens'),
    h('Zámek Frederiksberg na kopci', 'Frederiksberg Palace on the hill'),
    h('Park Søndermarken a Cisternerne', 'Søndermarken park and Cisternerne'),
    h('Čtvrť Carlsberg Byen se starými pivovarskými budovami', 'The Carlsberg district with its old brewery buildings'),
  ],
  'walk-helsingor': [
    h('Ulička Stengade se starými kupeckými domy', 'Stengade with its old merchants’ houses'),
    h('Katedrála sv. Olafa', 'St Olaf’s Cathedral'),
    h('Námořní muzeum a hrad Kronborg na konci', 'The Maritime Museum and Kronborg Castle at the end'),
  ],

  // --------------------------------------------------------------- Day trips
  louisiana: [
    h('Moderní umění v zahradě nad mořem s výhledem na Švédsko', 'Modern art in a garden by the sea, looking across to Sweden'),
    h('Sochy Henryho Moora a Alexandra Caldera v parku', 'Sculptures by Henry Moore and Alexander Calder in the park'),
    h('Kusamova zrcadlová místnost', 'Yayoi Kusama’s mirror room'),
    h('Kavárna s terasou u vody', 'A café with a terrace by the water'),
  ],
  kronborg: [
    h('Hamletův hrad – dějiště Shakespearovy hry (UNESCO)', 'Hamlet’s castle – the setting of Shakespeare’s play (UNESCO)'),
    h('Kasematy se spícím hrdinou Holgerem Dánem', 'The casemates with the sleeping hero Holger Danske'),
    h('Velký taneční sál a královské komnaty', 'The great ballroom and the royal chambers'),
    h('Výhled přes úžinu do Švédska', 'Views across the strait to Sweden'),
  ],
  frederiksborg: [
    h('Renesanční zámek na ostrovech v jezeře', 'A Renaissance castle on islands in a lake'),
    h('Bohatě zdobená zámecká kaple', 'A richly decorated palace chapel'),
    h('Národní historické muzeum s portréty', 'The Museum of National History with its portraits'),
    h('Barokní zahrada', 'A Baroque garden'),
  ],
  'viking-ship-museum': [
    h('Pět vikingských lodí z fjordu Roskilde', 'Five Viking ships from Roskilde Fjord'),
    h('Loděnice, kde se staví repliky', 'A boatyard where replicas are built'),
    h('Velké okno s výhledem na fjord', 'A big window onto the fjord'),
  ],
  dyrehaven: [
    h('Stáda jelenů – na podzim říje', 'Herds of deer – the rut in autumn'),
    h('Lovecký zámeček Eremitage na kopci', 'The Hermitage hunting lodge on the hill'),
    h('Staré duby a dlouhé aleje', 'Ancient oaks and long avenues'),
  ],
  'roskilde-cathedral': [
    h('Hrobky dánských králů a královen', 'The tombs of Danish kings and queens'),
    h('Cihlová gotika (UNESCO)', 'Brick Gothic (UNESCO)'),
    h('Kaple s malbami a hodiny s drakem', 'Painted chapels and a clock with a dragon'),
  ],
  dragor: [
    h('Žluté domky s doškovými střechami', 'Yellow houses with thatched roofs'),
    h('Dlážděné uličky a malý přístav', 'Cobbled lanes and a little harbour'),
    h('Rybí restaurace u vody', 'Fish restaurants by the water'),
  ],
  'blue-planet': [
    h('Oceánská nádrž se žraloky kladivouny', 'An ocean tank with hammerhead sharks'),
    h('Vydry, tropický deštný prales a korálový útes', 'Otters, a tropical rainforest and a coral reef'),
    h('Budova ve tvaru víru u moře', 'A whirlpool-shaped building by the sea'),
  ],
  'maritime-museum': [
    h('Muzeum v suchém doku pod zemí', 'A museum inside a dry dock underground'),
    h('Modely lodí, mapy a příběhy námořníků', 'Ship models, maps and sailors’ stories'),
    h('Mosty a rampy přes dok', 'Bridges and ramps across the dock'),
  ],
  arken: [
    h('Současné umění v budově jako loď na pláži', 'Contemporary art in a ship-like building on the beach'),
    h('Dlouhá galerie („Art Axis“) napříč celou budovou', 'The long gallery (the “Art Axis”) running through the building'),
    h('Procházka po pláži Ishøj kolem muzea', 'A walk on Ishøj beach around the museum'),
  ],
  ordrupgaard: [
    h('Francouzští impresionisté: Monet, Renoir, Gauguin', 'French Impressionists: Monet, Renoir, Gauguin'),
    h('Přístavba Zahy Hadid', 'The wing by Zaha Hadid'),
    h('Dům designéra Finna Juhla v parku', 'Designer Finn Juhl’s house in the park'),
  ],
}
