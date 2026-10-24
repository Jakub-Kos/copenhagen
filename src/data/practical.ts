// Practical information page. Hand-editable; facts with a `source` were checked there on
// 2026-10-24. Keep it short: it is read on a phone, often in a hurry.

import type { Bi } from './types'

export interface Call {
  label: Bi
  /** Dialled as written (tel: link). */
  number: string
  note?: Bi
}

export interface InfoItem {
  icon: string
  title: Bi
  text: Bi
  link?: { label: Bi; url: string }
}

export interface InfoSection {
  id: string
  title: Bi
  items: InfoItem[]
  source?: string
}

export const EMERGENCY: Call[] = [
  {
    label: { cs: 'Záchranka, hasiči, policie', en: 'Ambulance, fire, police' },
    number: '112',
    note: { cs: 'Ohrožení života, vážný úraz, požár, trestný čin.', en: 'Life-threatening illness or injury, fire, crime.' },
  },
  {
    label: { cs: 'Lékařská linka 1813', en: 'Medical helpline 1813' },
    number: '+451813',
    note: {
      cs: 'Lékaři a sestry poradí, kam jít. Volejte předem, než půjdete na pohotovost. Z českého telefonu s předvolbou +45.',
      en: 'Doctors and nurses tell you where to go. Call before going to an emergency room. From a Czech phone, dial +45 first.',
    },
  },
  {
    label: { cs: 'Velvyslanectví ČR v Kodani', en: 'Czech Embassy in Copenhagen' },
    number: '+4539101800',
    note: { cs: 'Ryvangs Allé 14–16, 2100 København Ø.', en: 'Ryvangs Allé 14–16, 2100 København Ø.' },
  },
  {
    label: { cs: 'Nouzová linka MZV ČR (nonstop)', en: 'Czech Foreign Ministry emergency line (24/7)' },
    number: '+420222420222',
    note: { cs: 'Ztráta pasu, zatčení, vážná nehoda.', en: 'Lost passport, arrest, serious accident.' },
  },
]

export const SECTIONS: InfoSection[] = [
  {
    id: 'health',
    title: { cs: 'Zdraví', en: 'Health' },
    source: 'https://international.kk.dk/live/healthcare/medical-emergencies/emergency-numbers',
    items: [
      {
        icon: '💊',
        title: { cs: 'Lékárna nonstop', en: '24-hour pharmacy' },
        text: {
          cs: 'Steno Apotek u hlavního nádraží, Vesterbrogade 6C – jediná dánská lékárna otevřená 24 hodin denně. Lékárna se dánsky řekne „apotek“.',
          en: 'Steno Apotek by Central Station, Vesterbrogade 6C – the only pharmacy in Denmark open 24 hours a day. A pharmacy is an “apotek”.',
        },
        link: { label: { cs: 'Navigovat', en: 'Navigate' }, url: 'https://www.google.com/maps/dir/?api=1&destination=Steno+Apotek,+Vesterbrogade+6C,+1620+K%C3%B8benhavn&travelmode=walking' },
      },
      {
        icon: '💳',
        title: { cs: 'Evropský průkaz pojištěnce', en: 'European Health Insurance Card' },
        text: {
          cs: 'Modrou kartičku (zadní strana karty pojišťovny) mějte u sebe. Doporučujeme i cestovní pojištění.',
          en: 'Carry the blue EHIC (the back of your Czech insurance card). Travel insurance is still recommended.',
        },
      },
    ],
  },
  {
    id: 'money',
    title: { cs: 'Peníze', en: 'Money' },
    items: [
      {
        icon: '💳',
        title: { cs: 'Platí se kartou', en: 'Pay by card' },
        text: {
          cs: 'Měna je dánská koruna (DKK). Kartou (i bezkontaktně, mobilem) se platí téměř všude, i za malé částky; některá místa hotovost vůbec neberou.',
          en: 'The currency is the Danish krone (DKK). Cards (contactless, phone) work almost everywhere, even for small amounts; some places take no cash at all.',
        },
      },
      {
        icon: '🙂',
        title: { cs: 'Spropitné', en: 'Tipping' },
        text: {
          cs: 'Obsluha je v ceně a spropitné se nečeká. Za dobrou obsluhu je zaokrouhlení milé, ale ne nutné.',
          en: 'Service is included and tips are not expected. Rounding up for good service is kind but optional.',
        },
      },
      {
        icon: '♻️',
        title: { cs: 'Záloha na lahve (pant)', en: 'Bottle deposit (pant)' },
        text: {
          cs: 'Na plechovkách a plastových lahvích je záloha („pant“). Vrátíte je do automatu v supermarketu.',
          en: 'Cans and plastic bottles carry a deposit (“pant”). Return them to the machine in a supermarket.',
        },
      },
    ],
  },
  {
    id: 'transport',
    title: { cs: 'Doprava', en: 'Getting around' },
    source: 'https://international.kk.dk/live/transport-and-parking/public-transport/ticket-and-prices-of-public-transportation',
    items: [
      {
        icon: '🎫',
        title: { cs: 'Jízdenku kupte před nástupem', en: 'Buy the ticket before boarding' },
        text: {
          cs: 'Metro, vlaky i autobusy používají stejné jízdenky: aplikace „DOT Billetter“, automat na stanici nebo Copenhagen Card. Revizoři jsou častí, pokuta je 750 DKK. Elektronickou jízdenku musíte umět ukázat – hlídejte baterii telefonu.',
          en: 'Metro, trains and buses share tickets: the “DOT Billetter” app, a station machine, or the Copenhagen Card. Inspections are frequent and the fine is DKK 750. You must be able to show an e-ticket, so keep your phone charged.',
        },
      },
      {
        icon: '🚇',
        title: { cs: 'Metro jezdí nonstop', en: 'The metro runs 24/7' },
        text: {
          cs: 'Bez řidiče, často (v noci řidčeji). Ve voze lze sedět vepředu s výhledem do tunelu.',
          en: 'Driverless and frequent (less often at night). Sit at the very front for a view down the tunnel.',
        },
      },
      {
        icon: '🚲',
        title: { cs: 'Pozor na cyklisty!', en: 'Watch out for cyclists!' },
        text: {
          cs: 'Cyklostezky jsou mezi chodníkem a silnicí a cyklisté jezdí rychle. Nestůjte na nich a před přechodem se rozhlédněte i na cyklostezku. Při vystupování z autobusu se často vystupuje přímo na ni.',
          en: 'Bike lanes run between the pavement and the road, and cyclists are fast. Don’t stand in them, and check the bike lane before crossing. Bus stops often open straight onto one.',
        },
      },
    ],
  },
  {
    id: 'everyday',
    title: { cs: 'Běžné věci', en: 'Everyday' },
    items: [
      {
        icon: '🚰',
        title: { cs: 'Voda z kohoutku je pitná', en: 'Tap water is drinkable' },
        text: { cs: 'A velmi dobrá. Stačí si vzít lahev a doplňovat.', en: 'And very good. Bring a bottle and refill it.' },
      },
      {
        icon: '🚻',
        title: { cs: 'Veřejné záchody', en: 'Public toilets' },
        text: {
          cs: 'Většina je zdarma. Na mapě je zapněte tlačítkem 🚻; na stránce Dnes vidíte nejbližší WC u další zastávky.',
          en: 'Most are free. Turn them on with the 🚻 map button; the Today page shows the nearest one to your next stop.',
        },
      },
      {
        icon: '📱',
        title: { cs: 'Telefon a data', en: 'Phone and data' },
        text: {
          cs: 'Dánsko je v EU, volání a data fungují jako doma (roaming bez příplatku). Wi-Fi bývá v kavárnách.',
          en: 'Denmark is in the EU: calls and data cost the same as at home (no roaming charges). Most cafés have Wi-Fi.',
        },
      },
      {
        icon: '🔌',
        title: { cs: 'Zásuvky', en: 'Sockets' },
        text: {
          cs: 'Ploché zástrčky (nabíječky telefonů) pasují. Kulaté zástrčky s otvorem pro kolík do starších dánských zásuvek nemusí – vezměte si pro jistotu cestovní adaptér.',
          en: 'Flat two-pin plugs (phone chargers) fit. Round Czech plugs may not fit older Danish sockets – bring a travel adapter just in case.',
        },
      },
      {
        icon: '🕒',
        title: { cs: 'Změna času v neděli 25. 10.', en: 'Clocks change on Sunday 25 Oct' },
        text: {
          cs: 'Ve 3:00 se posouvá na 2:00 (zimní čas, stejně jako v Česku). Od té doby se stmívá už kolem 16:45 – venkovní místa plánujte dopoledne. Aplikace s tím počítá.',
          en: 'At 3:00 clocks go back to 2:00 (winter time, as in Czechia). After that it gets dark around 16:45 – plan outdoor places for the morning. The app accounts for it.',
        },
      },
      {
        icon: '🧥',
        title: { cs: 'Počasí v říjnu', en: 'October weather' },
        text: {
          cs: 'Kolem 10 °C, často vítr a přeháňky. Nepromokavá bunda, vrstvy a pohodlné boty místo deštníku (vítr ho zlomí).',
          en: 'About 10 °C, often windy with showers. A waterproof jacket, layers and comfortable shoes beat an umbrella (the wind breaks it).',
        },
      },
      {
        icon: '👜',
        title: { cs: 'Kapsáři', en: 'Pickpockets' },
        text: {
          cs: 'Kodaň je bezpečná, ale v davu na Strøgetu, v Nyhavnu a na hlavním nádraží si hlídejte tašky a telefony.',
          en: 'Copenhagen is safe, but mind bags and phones in the crowds on Strøget, in Nyhavn and at Central Station.',
        },
      },
    ],
  },
]

/** A few Danish words; `say` is a rough pronunciation for Czech speakers. */
export const PHRASES: { da: string; say: string; mean: Bi }[] = [
  { da: 'Hej', say: 'haj', mean: { cs: 'Ahoj / dobrý den', en: 'Hi / hello' } },
  { da: 'Tak / Mange tak', say: 'tak / mange tak', mean: { cs: 'Děkuji / Mockrát děkuji', en: 'Thanks / Many thanks' } },
  { da: 'Undskyld', say: 'onskyl', mean: { cs: 'Promiňte', en: 'Excuse me / sorry' } },
  { da: 'Ja / Nej', say: 'ja / naj', mean: { cs: 'Ano / Ne', en: 'Yes / No' } },
  { da: 'Taler du engelsk?', say: 'téler du engelsk', mean: { cs: 'Mluvíte anglicky?', en: 'Do you speak English?' } },
  { da: 'Hvor er toilettet?', say: 'vór ér tojletet', mean: { cs: 'Kde je záchod?', en: 'Where is the toilet?' } },
  { da: 'En kaffe, tak', say: 'én kafe, tak', mean: { cs: 'Jednu kávu, prosím', en: 'A coffee, please' } },
  { da: 'Regningen, tak', say: 'rajningen, tak', mean: { cs: 'Účet, prosím', en: 'The bill, please' } },
  { da: 'Skål!', say: 'skól', mean: { cs: 'Na zdraví!', en: 'Cheers!' } },
  { da: 'Farvel', say: 'farvel', mean: { cs: 'Na shledanou', en: 'Goodbye' } },
]

export const EMBASSY_SOURCE = 'https://mzv.gov.cz/copenhagen/cz/kontakty.html'
