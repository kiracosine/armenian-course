import React, { useState, useEffect, useMemo, useCallback } from "react";

/* ------------------------------------------------------------------ */
/*  Tokens                                                             */
/* ------------------------------------------------------------------ */

const C = {
  ink: "#101A38",
  ink2: "#18234A",
  ink3: "#212E5C",
  gold: "#D8A22B",
  pom: "#C22B3E",
  apricot: "#EF9B4A",
  parch: "#EDE6D6",
  muted: "#8E9AC0",
  line: "#2A3768",
};

const ARM = "'Noto Serif Armenian','Mshtakan','Sylfaen','DejaVu Sans',serif";
const UI = "'Archivo',system-ui,-apple-system,'Segoe UI',sans-serif";
const STORE_KEY = "armenian:course:progress";
const LEGACY_KEY = "armenian:level1:progress";

/* ------------------------------------------------------------------ */
/*  Content                                                            */
/*                                                                     */
/*  Lesson 1-1 teaches a core of five vowels plus ս and ր. Every later */
/*  lesson's words are spellable from that core plus the lesson's own  */
/*  new letters — no word ever needs a letter from a different lesson. */
/* ------------------------------------------------------------------ */

const w = (hy, rom, en) => ({ hy, rom, en });
const l = (u, lo, name, rom, tip, ex) => ({ u, lo, name, rom, tip, ex });
const wide = (u, lo, name, rom, tip, ex) => ({ ...l(u, lo, name, rom, tip, ex), wide: true });
const aside = (u, lo, name, rom, tip, ex) => ({ ...l(u, lo, name, rom, tip, ex), solo: true, uncounted: true });
const glyph = (x) => (x.solo ? x.lo : x.u);
const pair = (x) => (x.solo ? x.lo : `${x.u} ${x.lo}`);

const L = (id, title, note, items) => ({ id, title, note, items });
const it = (hy, rom, en) => ({ hy, rom, en });

const LETTER_LESSONS = [
  {
    id: "1-1",
    title: "The core seven",
    note: "Five vowels and two consonants — enough to read real words straight away.",
    letters: [
      l("Ա", "ա", "այբ", "a", "Open, like the a in father. The most common sound in Armenian.", w("ասա", "asa", "say!")),
      l("Ե", "ե", "եչ", "ye/e", "Says ye at the start of a word, plain e anywhere else.", w("սեր", "ser", "love")),
      l("Ի", "ի", "ինի", "i", "Like the ee in see.", w("իր", "ir", "his, her")),
      l("Ո", "ո", "ո", "vo/o", "Says vo at the start of a word, plain o anywhere else.", w("որս", "vors", "hunt")),
      wide("ՈՒ", "ու", "ու", "u", "One letter, one sound: oo as in boot.", w("ուս", "us", "shoulder")),
      l("Ս", "ս", "սե", "s", "Like the s in sun.", w("սար", "sar", "mountain")),
      l("Ր", "ր", "րե", "r", "A single light tap of the tongue, softer than an English r.", w("սուր", "sur", "sharp")),
    ],
    words: [
      w("սար", "sar", "mountain"), w("սեր", "ser", "love"),       w("ուս", "us", "shoulder"), w("սուր", "sur", "sharp"),
      w("որս", "vors", "hunt"), w("ուր", "ur", "where"), w("ես", "yes", "I"),
      w("որ", "vor", "that, which"), w("իր", "ir", "his, her"), w("սա", "sa", "this"),
      w("իրար", "irar", "each other"),
      w("արի", "ari", "come!"), w("ասա", "asa", "say!"), w("երես", "yeres", "face"),
      w("արու", "aru", "male"), w("սուսեր", "suser", "sword"),
      w("ասես", "ases", "as if"), w("սրա", "sra", "of this one"),
      w("որի", "vori", "of which"), w("սոսի", "sosi", "plane tree")
    ],
  },
  {
    id: "1-2",
    title: "Hard consonants",
    note: "Five consonants said without any puff of air.",
    letters: [
      l("Կ", "կ", "կեն", "k", "A k with no puff of air — closer to the k in skin.", w("կրակ", "krak", "fire")),
      l("Ճ", "ճ", "ճե", "ch", "A sharp ch with no puff of air.", w("ճաշ", "chash", "meal")),
      l("Շ", "շ", "շա", "sh", "Like the sh in ship.", w("շապիկ", "shapik", "shirt")),
      l("Պ", "պ", "պե", "p", "A p with no puff of air, closer to the p in spin.", w("ապուր", "apur", "soup")),
      l("Ֆ", "ֆ", "ֆե", "f", "Like the f in fish. It turns up almost only in borrowed words such as ֆիլմ.", null),
    ],
    words: [
      w("կրակ", "krak", "fire"), w("ոսկի", "voski", "gold"), w("շապիկ", "shapik", "shirt"),
      w("կոշիկ", "koshik", "shoe"), w("ճաշ", "chash", "meal"), w("ապուր", "apur", "soup"),
      w("կես", "kes", "half"), w("երկար", "yerkar", "long"), w("երեկո", "yereko", "evening"),
      w("րոպե", "rope", "minute"), w("կարճ", "karch", "short"), w("ուշ", "ush", "late"),
      w("շիշ", "shish", "bottle"), w("կաշի", "kashi", "leather"), w("շուկա", "shuka", "market"),
      w("ապակի", "apaki", "glass"), w("ոսկոր", "voskor", "bone"), w("պապիկ", "papik", "grandpa"),
      w("սուրճ", "surch", "coffee"), w("ճարպ", "charp", "fat"), w("երկու", "yerku", "two"),
      w("ուրիշ", "urish", "other"), w("շոր", "shor", "garment"), w("կապ", "kap", "tie")
    ],
  },
  {
    id: "1-3",
    title: "Breath and throat",
    note: "Sounds made further back in the mouth.",
    letters: [
      l("Խ", "խ", "խե", "kh", "Raspy, from the back of the throat, like the ch in Bach.", w("խոտ", "khot", "grass")),
      l("Հ", "հ", "հո", "h", "Like the h in hat.", w("հաց", "hats", "bread")),
      l("Վ", "վ", "վեվ", "v", "Like the v in van.", w("հավ", "hav", "chicken")),
      l("Տ", "տ", "տյուն", "t", "A t with no puff of air, closer to the t in stop.", w("տերեվ", "terev", "leaf")),
      l("Ց", "ց", "ցո", "tsʰ", "A ts with a strong puff of air after it.", w("հաց", "hats", "bread")),
    ],
    words: [
      w("հաց", "hats", "bread"), w("հավ", "hav", "chicken"), w("սիրտ", "sirt", "heart"),
      w("տերեվ", "terev", "leaf"), w("խոտ", "khot", "grass"), w("սոխ", "sokh", "onion"),
      w("վեց", "vets", "six"), w("տարի", "tari", "year"), w("կատու", "katu", "cat"),
      w("կով", "kov", "cow"), w("պատ", "pat", "wall"), w("տեր", "ter", "owner"), w("վատ", "vat", "bad"),
      w("խոր", "khor", "deep"), w("ուրախ", "urakh", "happy"), w("երեխա", "yerekha", "child"),
      w("տատիկ", "tatik", "grandma"), w("ցուրտ", "tsurt", "cold"), w("տխուր", "tkhur", "sad"),
      w("սպիտակ", "spitak", "white"), w("հարուստ", "harust", "rich"), w("ճիշտ", "chisht", "correct"),
      w("կտուր", "ktur", "roof"), w("սխտոր", "skhtor", "garlic"), w("շատ", "shat", "many"),
      w("ով", "vov", "who")
    ],
  },
  {
    id: "1-4",
    title: "Puffed consonants",
    note: "Hold a hand to your mouth: these should push air against it.",
    letters: [
      l("Է", "է", "է", "e", "The same sound as ե, but never ye. Standing alone it means is.", w("էջ", "ej", "page")),
      l("Մ", "մ", "մեն", "m", "Like the m in moon.", w("մոմ", "mom", "candle")),
      l("Չ", "չ", "չա", "chʰ", "A ch with a puff of air, as in church.", w("չոր", "chor", "dry")),
      l("Ջ", "ջ", "ջե", "j", "Like the j in jam.", w("ջուր", "jur", "water")),
      l("Ք", "ք", "քե", "kʰ", "A k with a puff of air, as in kite.", w("քար", "kar", "stone")),
    ],
    words: [
      w("ջուր", "jur", "water"), w("քար", "kar", "stone"), w("աչք", "achk", "eye"),
      w("արջ", "arj", "bear"), w("միս", "mis", "meat"), w("մոմ", "mom", "candle"), w("չոր", "chor", "dry"),
      w("էջ", "ej", "page"), w("ոչ", "voch", "no"), w("մեջ", "mej", "in, inside"), w("ամիս", "amis", "month"),
      w("քիչ", "kich", "few"), w("տաք", "tak", "hot"), w("էշ", "esh", "donkey"), w("ոտք", "votk", "foot"),
      w("մատ", "mat", "finger"), w("ամպ", "amp", "cloud"), w("քամի", "kami", "wind"),
      w("միտք", "mitk", "thought"), w("մուկ", "muk", "mouse"), w("ատամ", "atam", "tooth"),
      w("կարմիր", "karmir", "red"), w("կամուրջ", "kamurj", "bridge"), w("ոչխար", "vochkhar", "sheep"),
      w("շաքար", "shakar", "sugar"), w("մատիտ", "matit", "pencil")
    ],
  },
  {
    id: "1-5",
    title: "Voiced and nasal",
    note: "Four voiced sounds and the neutral vowel that hides between them.",
    letters: [
      l("Գ", "գ", "գիմ", "g", "Always hard, like the g in go — never like gem.", w("երգ", "yerg", "song")),
      l("Զ", "զ", "զա", "z", "Like the z in zoo.", w("զանգ", "zang", "bell")),
      l("Ը", "ը", "ըթ", "ə", "The neutral uh. Often heard between consonants even where it is not written.", w("ինը", "inə", "nine")),
      l("Յ", "յ", "հի", "y", "Like the y in yes. At the end of a word it often goes quiet.", w("այգի", "aygi", "garden")),
      l("Ն", "ն", "նու", "n", "Like the n in nut.", w("նոր", "nor", "new")),
    ],
    words: [
      w("նոր", "nor", "new"), w("տուն", "tun", "house"), w("ինչ", "inch", "what"),
      w("գիշեր", "gisher", "night"), w("արագ", "arag", "fast"), w("հայր", "hayr", "father"),
      w("մայր", "mayr", "mother"), w("հին", "hin", "old"), w("անուն", "anun", "name"),
      w("երգ", "yerg", "song"), w("գետ", "get", "river"), w("մազ", "maz", "hair"),
      w("գին", "gin", "price"), w("ազգ", "azg", "nation"), w("կին", "kin", "woman"),
      w("նշան", "nshan", "sign"), w("շուն", "shun", "dog"), w("գորգ", "gorg", "carpet"),
      w("զանգ", "zang", "bell"), w("գիրք", "girk", "book"), w("այգի", "aygi", "garden"),
      w("գինի", "gini", "wine"), w("քույր", "kuyr", "sister"), w("կանաչ", "kanach", "green"),
      w("ընկեր", "ənker", "friend"), w("պանիր", "panir", "cheese"), w("ականջ", "akanj", "ear"),
      w("գույն", "guyn", "colour"), w("նամակ", "namak", "letter"), w("ինը", "inə", "nine")
    ],
  },
  {
    id: "1-6",
    title: "Tongue and teeth",
    note: "Including the trilled ռ, the loud cousin of ր.",
    letters: [
      l("Բ", "բ", "բեն", "b", "Like the b in bed.", w("բալ", "bal", "cherry")),
      l("Թ", "թ", "թո", "tʰ", "A t with a puff of air, like the t in top.", w("թութ", "tut", "mulberry")),
      l("Լ", "լ", "լյուն", "l", "Like the l in leaf.", w("թել", "tel", "thread")),
      l("Ծ", "ծ", "ծա", "ts", "A crisp ts with no puff of air.", w("ծառ", "tsaṙ", "tree")),
      l("Ռ", "ռ", "ռա", "ṙ", "A rolled, trilled r. Hold it longer than ր.", w("առու", "aṙu", "stream")),
    ],
    words: [
      w("լավ", "lav", "good"), w("մեծ", "mets", "big"), w("ծով", "tsov", "sea"), w("ծառ", "tsaṙ", "tree"),
      w("բալ", "bal", "cherry"), w("կաթ", "kat", "milk"), w("թեյ", "tey", "tea"),
      w("թիվ", "tiv", "number"), w("քիթ", "kit", "nose"), w("լիճ", "lich", "lake"),
      w("բառ", "baṙ", "word"), w("թել", "tel", "thread"), w("աթոռ", "atoṙ", "chair"),
      w("առու", "aṙu", "stream"), w("նուռ", "nuṙ", "pomegranate"), w("ամառ", "amaṙ", "summer"),
      w("լույս", "luys", "light"), w("գլուխ", "glukh", "head"), w("լեզու", "lezu", "tongue"),
      w("բերան", "beran", "mouth"), w("ծիրան", "tsiran", "apricot"), w("լոլիկ", "lolik", "tomato"),
      w("ֆիլմ", "film", "film"), w("շաբաթ", "shabat", "week"), w("առավոտ", "aṙavot", "morning"),
      w("խանութ", "khanut", "shop"), w("երբ", "yerb", "when"), w("գործ", "gorts", "work")
    ],
  },
  {
    id: "1-7",
    title: "The last six",
    note: "The final letters, and the second way of writing the o sound.",
    letters: [
      l("Դ", "դ", "դա", "d", "Like the d in door.", w("դեղ", "degh", "medicine")),
      l("Ժ", "ժ", "ժե", "zh", "Like the s in measure.", w("ժիր", "zhir", "lively")),
      l("Ձ", "ձ", "ձա", "dz", "A dz, like the end of kids.", w("ձի", "dzi", "horse")),
      l("Ղ", "ղ", "ղատ", "gh", "A gargled r, close to the French r.", w("աղ", "agh", "salt")),
      l("Փ", "փ", "փյուր", "pʰ", "A p with a puff of air, as in pot.", w("փող", "pogh", "money")),
      l("Օ", "օ", "օ", "o", "A plain o. Used where a word begins with the o sound.", w("օր", "or", "day")),
    ],
    words: [
      w("օր", "or", "day"), w("մարդ", "mard", "person"), w("տղա", "tgha", "boy"), w("ձի", "dzi", "horse"),
      w("ձու", "dzu", "egg"), w("ձուկ", "dzuk", "fish"), w("աղ", "agh", "salt"), w("օդ", "od", "air"),
      w("օձ", "odz", "snake"), w("դուռ", "duṙ", "door"), w("դեղ", "degh", "medicine"),
      w("փող", "pogh", "money"), w("փողոց", "poghots", "street"), w("փոքր", "pokr", "small"),
      w("ժամ", "zham", "hour"), w("ձեռք", "dzeṙk", "hand"), w("ձմեռ", "dzmeṙ", "winter"),
      w("ձյուն", "dzyun", "snow"), w("վարդ", "vard", "rose"), w("սեղան", "seghan", "table"),
      w("ծաղիկ", "tsaghik", "flower"), w("խնձոր", "khndzor", "apple"), w("քաղաք", "kaghak", "city"),
      w("գյուղ", "gyugh", "village"), w("դպրոց", "dprots", "school"), w("թուղթ", "tught", "paper"),
      w("մեղու", "meghu", "bee"), w("աստղ", "astgh", "star")
    ],
  },
  {
    id: "1-8",
    title: "The ligature և",
    note: "One character replacing the եվ you have been writing. From here on it is the normal spelling.",
    letters: [
      aside("Եվ", "և", "և", "yev", "A single character for եվ. Everything you spelled սեվ or արեվ is written սև and արև from now on.", w("սև", "sev", "black")),
    ],
    words: [
      w("և", "yev", "and"), w("սև", "sev", "black"), w("արև", "arev", "sun"), w("տերև", "terev", "leaf"),
      w("թև", "tev", "arm"), w("ևս", "yevs", "also"), w("երևի", "yerevi", "probably"),
      w("կեղև", "keghev", "bark"), w("անձրև", "andzrev", "rain"), w("հարևան", "harevan", "neighbour"),
      w("թեթև", "tetev", "light"), w("արևոտ", "arevot", "sunny")
    ],
  },
];

const LESSONS = LETTER_LESSONS;
const ALPHABET = LESSONS.flatMap((L) => L.letters.filter((x) => !x.uncounted));
// Taught, but set apart from the 38: a ligature rather than a letter of the alphabet.
const EXTRAS = LESSONS.flatMap((L) => L.letters.filter((x) => x.uncounted));

const LEVELS = [
  { n: 1, name: "The letters",
    blurb: "All 38 letters, grouped so that every word a lesson asks you to read is spellable from that lesson plus the core.",
    topics: ["38 letters plus և", "194 words", "Reading short words"], lessons: LETTER_LESSONS },
  { n: 2, name: "Syllables and stress", blurb: "Turning letters into sound. The rules that decide how a written word is said.",
    topics: ["Words with ու", "Words with և", "Words that begin with ը"], lessons: [
      L("2-1", "Words with ու", "ու is two letters but one sound. Read each of these aloud.", [
        it("ջուր", "jur", "water"), it("տուն", "tun", "house"), it("մուկ", "muk", "mouse"),
        it("լույս", "luys", "light"), it("քույր", "kuyr", "sister"), it("ձուկ", "dzuk", "fish"),
        it("առու", "aṙu", "stream"), it("մեղու", "meghu", "bee"), it("լեզու", "lezu", "tongue"),
        it("կատու", "katu", "cat"), it("ապուր", "apur", "soup"), it("սուրճ", "surch", "coffee"),
        it("գույն", "guyn", "colour"), it("անուն", "anun", "name"), it("գարուն", "garun", "spring")
      ]),
      L("2-2", "Words built on և", "Now that you have the ligature, here it is inside longer words.", [
        it("Երևան", "Yerevan", "Yerevan"), it("արևելք", "arevelk", "east"),
        it("արևմուտք", "arevmutk", "west"), it("արևածագ", "arevatsag", "sunrise"),
        it("անձրևոտ", "andzrevot", "rainy"), it("երևալ", "yereval", "to appear"),
        it("թևավոր", "tevavor", "winged"), it("սևանալ", "sevanal", "to turn black"),
        it("թեթևություն", "tetevutyun", "lightness"), it("արևային", "arevayin", "solar")
      ]),
      L("2-3", "Words that begin with ը", "ը is the neutral uh. At the start of a word it is always written.", [
        it("ընկեր", "ənker", "friend"), it("ընկույզ", "ənkuyz", "walnut"),
        it("ընտանիք", "əntanik", "family"), it("ընթրիք", "əntrik", "dinner"),
        it("ընդունել", "əndunel", "to accept"), it("ընկնել", "ənknel", "to fall"),
        it("ընտիր", "əntir", "choice"), it("ընդհանուր", "əndhanur", "general"),
        it("ընկերուհի", "ənkeruhi", "girlfriend"), it("ընթացք", "əntatsk", "course")
      ]),
      L("2-4", "Telling the pairs apart", "Armenian separates puffed and unpuffed consonants. Each pair below differs only in that puff.", [
        it("կաթ", "kat", "milk"), it("քաղաք", "kaghak", "city"), it("տոմս", "toms", "ticket"),
        it("թութ", "tut", "mulberry"), it("պատ", "pat", "wall"), it("փետուր", "petur", "feather"),
        it("ծաղիկ", "tsaghik", "flower"), it("ցանկ", "tsank", "list"), it("ճամփա", "champa", "road"),
        it("չամիչ", "chamich", "raisin"), it("կիթառ", "kitaṙ", "guitar"), it("քիթ", "kit", "nose")
      ]),
      L("2-5", "Longer words", "Armenian stress falls on the last syllable. Keep the weight at the end.", [
        it("ուսուցիչ", "usutsich", "teacher"), it("աշակերտ", "ashakert", "pupil"),
        it("համալսարան", "hamalsaran", "university"), it("գրադարան", "gradaran", "library"),
        it("հյուրանոց", "hyuranots", "hotel"), it("վերելակ", "verelak", "lift"),
        it("սառնարան", "saṙnaran", "fridge"), it("բանջարեղեն", "banjareghen", "vegetables"),
        it("հեռուստացույց", "heṙustatsuyts", "television"), it("օդանավակայան", "odanavakayan", "airport")
      ]),
    ] },
  { n: 3, name: "First words", blurb: "A working core of everyday vocabulary, and the first piece of grammar: making things plural.",
    topics: ["People", "The body", "Food and drink"], lessons: [
      L("3-1", "People", "The words for the people around you.", [
        it("մարդ", "mard", "person"), it("կին", "kin", "woman"), it("տղամարդ", "tghamard", "man"),
        it("աղջիկ", "aghjik", "girl"), it("տղա", "tgha", "boy"), it("երեխա", "yerekha", "child"),
        it("մայր", "mayr", "mother"), it("հայր", "hayr", "father"), it("քույր", "kuyr", "sister"),
        it("եղբայր", "yeghbayr", "brother"), it("ընկեր", "ənker", "friend"),
        it("ուսուցիչ", "usutsich", "teacher"), it("տատիկ", "tatik", "grandmother"),
        it("պապիկ", "papik", "grandfather")
      ]),
      L("3-2", "The body", "Parts of the body, most of them short words.", [
        it("գլուխ", "glukh", "head"), it("աչք", "achk", "eye"), it("ականջ", "akanj", "ear"),
        it("քիթ", "kit", "nose"), it("բերան", "beran", "mouth"), it("ատամ", "atam", "tooth"),
        it("ձեռք", "dzeṙk", "hand"), it("ոտք", "votk", "foot"), it("մազ", "maz", "hair"),
        it("սիրտ", "sirt", "heart"), it("մատ", "mat", "finger"), it("մեջք", "mejk", "back")
      ]),
      L("3-3", "Food and drink", "What is on the table.", [
        it("հաց", "hats", "bread"), it("պանիր", "panir", "cheese"), it("կարագ", "karag", "butter"),
        it("միս", "mis", "meat"), it("ձու", "dzu", "egg"), it("կաթ", "kat", "milk"), it("թեյ", "tey", "tea"),
        it("սուրճ", "surch", "coffee"), it("գինի", "gini", "wine"), it("շաքար", "shakar", "sugar"),
        it("մեղր", "meghr", "honey"), it("ապուր", "apur", "soup"), it("աղցան", "aghtsan", "salad"),
        it("պաղպաղակ", "paghpaghak", "ice cream")
      ]),
      L("3-4", "Numbers one to ten", "Counting. These come up constantly.", [
        it("մեկ", "mek", "one"), it("երկու", "yerku", "two"), it("երեք", "yerek", "three"),
        it("չորս", "chors", "four"), it("հինգ", "hing", "five"), it("վեց", "vets", "six"),
        it("յոթ", "yot", "seven"), it("ութ", "ut", "eight"), it("ինը", "inə", "nine"),
        it("տասը", "tasə", "ten")
      ]),
      L("3-5", "Making things plural", "One syllable takes -եր. Two or more syllables take -ներ.", [
        it("սարեր", "sarer", "mountains"), it("քարեր", "karer", "stones"), it("ծառեր", "tsaṙer", "trees"),
        it("օրեր", "orer", "days"), it("գետեր", "geter", "rivers"), it("կատուներ", "katuner", "cats"),
        it("երեխաներ", "yerekhaner", "children"), it("աղջիկներ", "aghjikner", "girls"),
        it("ուսուցիչներ", "usutsichner", "teachers"), it("պատուհաններ", "patuhanner", "windows"),
        it("ընկերներ", "ənkerner", "friends"), it("տղաներ", "tghaner", "boys")
      ]),
    ] },
  { n: 4, name: "Naming and pointing", blurb: "Saying which thing you mean. Armenian attaches its article to the end of the word.",
    topics: ["The attached article", "This and that", "Asking questions"], lessons: [
      L("4-1", "The attached article", "English puts the in front. Armenian adds -ը to a consonant, -ն to a vowel.", [
        it("գիրքը", "girkə", "the book"), it("տունը", "tunə", "the house"),
        it("սարը", "sarə", "the mountain"), it("դուռը", "duṙə", "the door"),
        it("ջուրը", "jurə", "the water"), it("կատուն", "katun", "the cat"),
        it("երեխան", "yerekhan", "the child"), it("ապուրը", "apurə", "the soup"),
        it("աչքը", "achkə", "the eye"), it("քաղաքը", "kaghakə", "the city"), it("ծառը", "tsaṙə", "the tree"),
        it("մարդը", "mardə", "the person")
      ]),
      L("4-2", "This and that", "այս, այդ and այն go before a noun. սա, դա and նա stand alone.", [
        it("այս", "ays", "this"), it("այդ", "ayd", "that"), it("այն", "ayn", "that over there"),
        it("սա", "sa", "this one"), it("դա", "da", "that one"), it("նա", "na", "he, she"),
        it("սրանք", "srank", "these"), it("դրանք", "drank", "those"),
        it("այս գիրքը", "ays girkə", "this book"), it("այն տունը", "ayn tunə", "that house")
      ]),
      L("4-3", "Asking questions", "The ՞ mark sits over the stressed vowel of the questioned word.", [
        it("ի՞նչ", "inch", "what"), it("ո՞վ", "vov", "who"), it("ու՞ր", "ur", "where to"),
        it("որտե՞ղ", "vortegh", "where"), it("ե՞րբ", "yerb", "when"), it("ինչու՞", "inchu", "why"),
        it("ինչպե՞ս", "inchpes", "how"), it("քանի՞", "kani", "how many"), it("ո՞ր", "vor", "which"),
        it("որքա՞ն", "vorkan", "how much")
      ]),
      L("4-4", "Whose it is", "The possessive words, used before the noun.", [
        it("իմ", "im", "my"), it("քո", "ko", "your"), it("նրա", "nra", "his, her"), it("մեր", "mer", "our"),
        it("ձեր", "dzer", "your (plural)"), it("նրանց", "nrants", "their"),
        it("իմ գիրքը", "im girkə", "my book"), it("քո տունը", "ko tunə", "your house"),
        it("մեր քաղաքը", "mer kaghakə", "our city"), it("նրա անունը", "nra anunə", "his name")
      ]),
      L("4-5", "Here and there", "Place words you will need in every conversation.", [
        it("այստեղ", "aystegh", "here"), it("այնտեղ", "ayntegh", "there"), it("ներսում", "nersum", "inside"),
        it("դրսում", "drsum", "outside"), it("վերևում", "verevum", "above"),
        it("ներքևում", "nerkevum", "below"), it("կողքին", "koghkin", "beside"),
        it("հետևում", "hetevum", "behind"), it("առջևում", "aṙjevum", "in front"),
        it("մեջտեղում", "mejteghum", "in the middle")
      ]),
    ] },
  { n: 5, name: "Saying what things are", blurb: "Your first full sentences, built on the verb to be.",
    topics: ["The verb to be", "Simple sentences", "Describing words"], lessons: [
      L("5-1", "The verb to be", "Armenian puts եմ, ես, է after the word it belongs to.", [
        it("եմ", "yem", "I am"), it("ես", "yes", "you are"), it("է", "e", "he is, she is, it is"),
        it("ենք", "yenk", "we are"), it("եք", "yek", "you are (plural)"), it("են", "yen", "they are"),
        it("ուսանող եմ", "usanogh yem", "I am a student"), it("բժիշկ է", "bzhishk e", "he is a doctor"),
        it("տանը եմ", "tanə yem", "I am at home"), it("պատրաստ ենք", "patrast yenk", "we are ready")
      ]),
      L("5-2", "Simple sentences", "Subject, then the describing word, then the verb.", [
        it("Ես ուսանող եմ", "Yes usanogh yem", "I am a student"),
        it("Նա բժիշկ է", "Na bzhishk e", "She is a doctor"),
        it("Դու ընկեր ես", "Du ənker yes", "You are a friend"),
        it("Մենք հայ ենք", "Menk hay yenk", "We are Armenian"),
        it("Նրանք տանն են", "Nrank tann yen", "They are at home"),
        it("Սա իմ գիրքն է", "Sa im girkn e", "This is my book"),
        it("Այս քաղաքը մեծ է", "Ays kaghakə mets e", "This city is big"),
        it("Ջուրը սառն է", "Jurə saṙn e", "The water is cold")
      ]),
      L("5-3", "Describing words", "Adjectives come before the noun and never change.", [
        it("մեծ", "mets", "big"), it("փոքր", "pokr", "small"), it("նոր", "nor", "new"),
        it("հին", "hin", "old"), it("լավ", "lav", "good"), it("վատ", "vat", "bad"),
        it("գեղեցիկ", "geghetsik", "beautiful"), it("երկար", "yerkar", "long"), it("կարճ", "karch", "short"),
        it("տաք", "tak", "hot"), it("սառը", "saṙə", "cold"), it("թանկ", "tank", "expensive"),
        it("էժան", "ezhan", "cheap"), it("հեշտ", "hesht", "easy"), it("դժվար", "dzhvar", "difficult")
      ]),
      L("5-4", "Saying no", "չ- attaches to the front of the verb to be.", [
        it("չեմ", "chem", "I am not"), it("չես", "ches", "you are not"), it("չէ", "che", "he is not"),
        it("չենք", "chenk", "we are not"), it("չեք", "chek", "you are not (plural)"),
        it("չեն", "chen", "they are not"), it("Ես բժիշկ չեմ", "Yes bzhishk chem", "I am not a doctor"),
        it("Նա տանը չէ", "Na tanə che", "He is not at home"),
        it("Սա թանկ չէ", "Sa tank che", "This is not expensive"),
        it("Մենք պատրաստ չենք", "Menk patrast chenk", "We are not ready")
      ]),
      L("5-5", "Yes and no questions", "Word order stays the same. Only the intonation and the ՞ change.", [
        it("այո", "ayo", "yes"), it("ոչ", "voch", "no"),
        it("Դու ուսանո՞ղ ես", "Du usanogh yes", "Are you a student?"),
        it("Սա քո գի՞րքն է", "Sa ko girkn e", "Is this your book?"),
        it("Նա տա՞նն է", "Na tann e", "Is he at home?"), it("Թա՞նկ է", "Tank e", "Is it expensive?"),
        it("Այո, ես եմ", "Ayo, yes yem", "Yes, I am"), it("Ոչ, չեմ", "Voch, chem", "No, I am not"),
        it("Ճի՞շտ է", "Chisht e", "Is it true?"), it("Իհարկե", "Iharke", "Of course")
      ]),
    ] },
  { n: 6, name: "Endings that carry meaning", blurb: "Armenian marks a noun's job with an ending rather than with word order.",
    topics: ["Of something", "Giving to someone", "Coming from"], lessons: [
      L("6-1", "Of something", "The genitive adds -ի. It marks what the thing belongs to.", [
        it("քաղաքի", "kaghaki", "of the city"), it("դպրոցի", "dprotsi", "of the school"),
        it("սարի", "sari", "of the mountain"), it("ծառի", "tsaṙi", "of the tree"),
        it("դասի", "dasi", "of the lesson"), it("ընկերոջ", "ənkeroj", "of the friend"),
        it("երեխայի", "yerekhayi", "of the child"), it("տան", "tan", "of the house"),
        it("օրվա", "orva", "of the day"), it("մարդու", "mardu", "of the person")
      ]),
      L("6-2", "Giving to someone", "The same -ի form also marks who receives something.", [
        it("ընկերոջս", "ənkerojs", "to my friend"), it("մորը", "morə", "to the mother"),
        it("հորը", "horə", "to the father"), it("երեխային", "yerekhayin", "to the child"),
        it("ուսուցչին", "usutschin", "to the teacher"), it("քրոջը", "krojə", "to the sister"),
        it("եղբորը", "yeghborə", "to the brother"), it("ինձ", "indz", "to me"), it("քեզ", "kez", "to you"),
        it("նրան", "nran", "to him, to her")
      ]),
      L("6-3", "Coming from", "The ablative adds -ից. It marks the source.", [
        it("տնից", "tnits", "from the house"), it("քաղաքից", "kaghakits", "from the city"),
        it("դպրոցից", "dprotsits", "from the school"), it("սարից", "sarits", "from the mountain"),
        it("այստեղից", "aysteghits", "from here"), it("այնտեղից", "aynteghits", "from there"),
        it("Հայաստանից", "Hayastanits", "from Armenia"), it("աշխատանքից", "ashkhatankits", "from work"),
        it("ինձնից", "indznits", "from me"), it("քեզնից", "keznits", "from you")
      ]),
      L("6-4", "By means of", "The instrumental adds -ով. It marks the tool or the way.", [
        it("գնացքով", "gnatskov", "by train"), it("մեքենայով", "mekenayov", "by car"),
        it("ոտքով", "votkov", "on foot"), it("ձեռքով", "dzeṙkov", "by hand"),
        it("ինքնաթիռով", "inknatiṙov", "by plane"), it("ավտոբուսով", "avtobusov", "by bus"),
        it("գրիչով", "grichov", "with a pen"), it("դանակով", "danakov", "with a knife"),
        it("հայերենով", "hayerenov", "in Armenian"), it("սիրով", "sirov", "with love")
      ]),
      L("6-5", "My and your on the noun", "Armenian can attach -ս for my and -դ for your.", [
        it("գիրքս", "girks", "my book"), it("գիրքդ", "girkd", "your book"), it("տունս", "tuns", "my house"),
        it("տունդ", "tund", "your house"), it("անունս", "anuns", "my name"),
        it("անունդ", "anund", "your name"), it("ձեռքս", "dzeṙks", "my hand"),
        it("մայրս", "mayrs", "my mother"), it("հայրդ", "hayrd", "your father"),
        it("ընկերս", "ənkers", "my friend")
      ]),
    ] },
  { n: 7, name: "Verbs in the present", blurb: "Describing what is happening now, and saying that it is not.",
    topics: ["Naming the action", "Happening now", "All six persons"], lessons: [
      L("7-1", "Naming the action", "Dictionary forms end in -ել or -ալ.", [
        it("գրել", "grel", "to write"), it("կարդալ", "kardal", "to read"), it("խոսել", "khosel", "to speak"),
        it("ուտել", "utel", "to eat"), it("խմել", "khmel", "to drink"), it("տեսնել", "tesnel", "to see"),
        it("գնալ", "gnal", "to go"), it("գալ", "gal", "to come"), it("անել", "anel", "to do"),
        it("աշխատել", "ashkhatel", "to work"), it("սիրել", "sirel", "to love"),
        it("ապրել", "aprel", "to live")
      ]),
      L("7-2", "Happening now", "Drop the ending, add -ում, then the verb to be.", [
        it("գրում եմ", "grum yem", "I am writing"), it("կարդում եմ", "kardum yem", "I am reading"),
        it("խոսում եմ", "khosum yem", "I am speaking"), it("ուտում եմ", "utum yem", "I am eating"),
        it("խմում եմ", "khmum yem", "I am drinking"), it("աշխատում եմ", "ashkhatum yem", "I am working"),
        it("ապրում եմ", "aprum yem", "I live"), it("սիրում եմ", "sirum yem", "I love"),
        it("տեսնում եմ", "tesnum yem", "I see"), it("անում եմ", "anum yem", "I am doing")
      ]),
      L("7-3", "All six persons", "Only the verb to be changes at the end.", [
        it("գրում ես", "grum yes", "you are writing"), it("գրում է", "grum e", "he is writing"),
        it("գրում ենք", "grum yenk", "we are writing"),
        it("գրում եք", "grum yek", "you are writing (plural)"),
        it("գրում են", "grum yen", "they are writing"), it("կարդում է", "kardum e", "she is reading"),
        it("խոսում ենք", "khosum yenk", "we are speaking"),
        it("աշխատում են", "ashkhatum yen", "they are working"), it("ապրում ես", "aprum yes", "you live"),
        it("ուտում են", "utum yen", "they are eating")
      ]),
      L("7-4", "Not happening", "չ- goes on the verb to be, which then moves in front.", [
        it("չեմ գրում", "chem grum", "I am not writing"),
        it("չես կարդում", "ches kardum", "you are not reading"),
        it("չի խոսում", "chi khosum", "he is not speaking"),
        it("չենք աշխատում", "chenk ashkhatum", "we are not working"),
        it("չեն ուտում", "chen utum", "they are not eating"),
        it("չեմ հասկանում", "chem haskanum", "I do not understand"),
        it("չգիտեմ", "chgitem", "I do not know"), it("չեմ ուզում", "chem uzum", "I do not want"),
        it("չի կարող", "chi karogh", "he cannot"), it("չեմ կարող", "chem karogh", "I cannot")
      ]),
      L("7-5", "Useful verbs", "Verbs you will reach for every day.", [
        it("հասկանալ", "haskanal", "to understand"), it("իմանալ", "imanal", "to know"),
        it("ուզել", "uzel", "to want"), it("կարողանալ", "karoghanal", "to be able"),
        it("տալ", "tal", "to give"), it("վերցնել", "vertsnel", "to take"), it("ասել", "asel", "to say"),
        it("հարցնել", "hartsnel", "to ask"), it("սպասել", "spasel", "to wait"),
        it("օգնել", "ognel", "to help"), it("գտնել", "gtnel", "to find"),
        it("կորցնել", "kortsnel", "to lose")
      ]),
    ] },
  { n: 8, name: "Past and future", blurb: "Moving off the present tense.",
    topics: ["Finished actions", "Was happening", "Will happen"], lessons: [
      L("8-1", "Finished actions", "The aorist. It says the action happened and ended.", [
        it("գրեցի", "gretsi", "I wrote"), it("կարդացի", "kardatsi", "I read"),
        it("խոսեցի", "khosetsi", "I spoke"), it("աշխատեցի", "ashkhatetsi", "I worked"),
        it("գրեց", "grets", "he wrote"), it("կարդաց", "kardats", "she read"),
        it("խոսեցինք", "khosetsink", "we spoke"), it("գրեցին", "gretsin", "they wrote"),
        it("տեսա", "tesa", "I saw"), it("ասացի", "asatsi", "I said")
      ]),
      L("8-2", "Was happening", "The imperfect. Present form, but with էի instead of եմ.", [
        it("գրում էի", "grum ei", "I was writing"), it("կարդում էի", "kardum ei", "I was reading"),
        it("խոսում էր", "khosum er", "he was speaking"),
        it("աշխատում էինք", "ashkhatum eink", "we were working"),
        it("ապրում էին", "aprum ein", "they were living"), it("ուտում էիր", "utum eir", "you were eating"),
        it("գիտեի", "gitei", "I knew"), it("ուզում էի", "uzum ei", "I wanted"),
        it("սպասում էի", "spasum ei", "I was waiting"),
        it("չէի հասկանում", "chei haskanum", "I did not understand")
      ]),
      L("8-3", "Will happen", "կ- on the front makes the future.", [
        it("կգրեմ", "kgrem", "I will write"), it("կկարդամ", "kkardam", "I will read"),
        it("կխոսեմ", "kkhosem", "I will speak"), it("կգնամ", "kgnam", "I will go"),
        it("կգամ", "kgam", "I will come"), it("կանեմ", "kanem", "I will do"),
        it("կտեսնեմ", "ktesnem", "I will see"), it("կօգնեմ", "kognem", "I will help"),
        it("կսպասեմ", "kspasem", "I will wait"), it("կզանգեմ", "kzangem", "I will call")
      ]),
      L("8-4", "Irregular pasts", "The most common verbs do not follow the pattern. Learn these as they are.", [
        it("եղավ", "yeghav", "it happened"), it("գնաց", "gnats", "he went"), it("եկավ", "yekav", "she came"),
        it("տվեց", "tvets", "he gave"), it("ասաց", "asats", "she said"), it("արեց", "arets", "he did"),
        it("տեսավ", "tesav", "she saw"), it("եղա", "yegha", "I was"), it("գնացի", "gnatsi", "I went"),
        it("եկա", "yeka", "I came")
      ]),
      L("8-5", "When it happened", "Time words that pin a sentence down.", [
        it("երեկ", "yerek", "yesterday"), it("այսօր", "aysor", "today"), it("վաղը", "vaghə", "tomorrow"),
        it("հիմա", "hima", "now"), it("հետո", "heto", "later"), it("շուտ", "shut", "early"),
        it("ուշ", "ush", "late"), it("միշտ", "misht", "always"), it("երբեք", "yerbek", "never"),
        it("երբեմն", "yerbemn", "sometimes"), it("անցյալ շաբաթ", "antsyal shabat", "last week"),
        it("մյուս շաբաթ", "myus shabat", "next week")
      ]),
    ] },
  { n: 9, name: "Holding a conversation", blurb: "The exchanges you will actually have with people.",
    topics: ["Greetings", "Please and thank you", "Introducing yourself"], lessons: [
      L("9-1", "Greetings", "What you say walking in and walking out.", [
        it("բարև", "barev", "hello"), it("բարև ձեզ", "barev dzez", "hello (polite)"),
        it("բարի լույս", "bari luys", "good morning"), it("բարի երեկո", "bari yereko", "good evening"),
        it("բարի գիշեր", "bari gisher", "good night"), it("ցտեսություն", "tstesutyun", "goodbye"),
        it("հաջողություն", "hajoghutyun", "good luck"), it("բարի գալուստ", "bari galust", "welcome"),
        it("ողջույն", "voghjuyn", "greetings"), it("առայժմ", "aṙayzhm", "see you")
      ]),
      L("9-2", "Please and thank you", "Politeness carries a long way.", [
        it("շնորհակալություն", "shnorhakalutyun", "thank you"),
        it("շնորհակալ եմ", "shnorhakal yem", "I am grateful"),
        it("խնդրեմ", "khndrem", "please, you are welcome"), it("ներողություն", "neroghutyun", "sorry"),
        it("կներեք", "knerek", "excuse me"), it("ոչինչ", "vochinch", "it is nothing"),
        it("հաճելի է", "hacheli e", "pleased to meet you"),
        it("բարի ախորժակ", "bari akhorzhak", "enjoy your meal"),
        it("խնդրում եմ", "khndrum yem", "I ask you"), it("անհոգ", "anhog", "no worries")
      ]),
      L("9-3", "Introducing yourself", "The first thirty seconds of any conversation.", [
        it("Անունս Արամ է", "Anuns Aram e", "My name is Aram"),
        it("Ի՞նչ է ձեր անունը", "Inch e dzer anunə", "What is your name?"),
        it("Ինչպե՞ս եք", "Inchpes yek", "How are you?"), it("Լավ եմ", "Lav yem", "I am well"),
        it("Վատ չեմ", "Vat chem", "Not bad"), it("Ուրախ եմ", "Urakh yem", "I am glad"),
        it("Որտեղի՞ց եք", "Vorteghits yek", "Where are you from?"),
        it("Հայաստանից եմ", "Hayastanits yem", "I am from Armenia"),
        it("Հայերեն սովորում եմ", "Hayeren sovorum yem", "I am learning Armenian"),
        it("Քիչ եմ հասկանում", "Kich yem haskanum", "I understand a little")
      ]),
      L("9-4", "Asking for things", "Shops, cafes, and anywhere you need something.", [
        it("Որքա՞ն արժե", "Vorkan arzhe", "How much does it cost?"),
        it("Շատ թանկ է", "Shat tank e", "It is very expensive"), it("Կարո՞ղ եմ", "Karogh yem", "May I?"),
        it("Ջուր, խնդրեմ", "Jur, khndrem", "Water, please"), it("Սա ի՞նչ է", "Sa inch e", "What is this?"),
        it("Ունե՞ք", "Unek", "Do you have it?"), it("Ուզում եմ սա", "Uzum yem sa", "I want this"),
        it("Հաշիվը, խնդրեմ", "Hashivə, khndrem", "The bill, please"),
        it("Բավական է", "Bavakan e", "That is enough"), it("Ուրիշ բան", "Urish ban", "Something else")
      ]),
      L("9-5", "Days and months", "Naming the day you mean.", [
        it("երկուշաբթի", "yerkushabti", "Monday"), it("երեքշաբթի", "yerekshabti", "Tuesday"),
        it("չորեքշաբթի", "chorekshabti", "Wednesday"), it("հինգշաբթի", "hingshabti", "Thursday"),
        it("ուրբաթ", "urbat", "Friday"), it("շաբաթ", "shabat", "Saturday"), it("կիրակի", "kiraki", "Sunday"),
        it("հունվար", "hunvar", "January"), it("ապրիլ", "april", "April"),
        it("սեպտեմբեր", "september", "September")
      ]),
    ] },
  { n: 10, name: "Around the house", blurb: "The words and phrases you use at home, with the people you live with.",
    topics: ["Rooms", "In the kitchen", "Around the rooms"], lessons: [
      L("10-1", "Rooms", "Naming the parts of a home.", [
        it("խոհանոց", "khohanots", "kitchen"), it("ննջասենյակ", "nnjasenyak", "bedroom"),
        it("լոգարան", "logaran", "bathroom"), it("հյուրասենյակ", "hyurasenyak", "living room"),
        it("միջանցք", "mijantsk", "hallway"), it("պատշգամբ", "patshgamb", "balcony"),
        it("նկուղ", "nkugh", "basement"), it("սենյակ", "senyak", "room"), it("բակ", "bak", "yard"),
        it("աստիճաններ", "astichanner", "stairs")
      ]),
      L("10-2", "In the kitchen", "What you cook and eat with.", [
        it("սեղան", "seghan", "table"), it("աթոռ", "atoṙ", "chair"), it("դանակ", "danak", "knife"),
        it("պատառաքաղ", "pataṙakagh", "fork"), it("գդալ", "gdal", "spoon"), it("ափսե", "apse", "plate"),
        it("բաժակ", "bazhak", "glass"), it("կաթսա", "katsa", "pot"), it("սառնարան", "saṙnaran", "fridge"),
        it("վառարան", "vaṙaran", "stove"), it("թեյնիկ", "teynik", "kettle"),
        it("լվացարան", "lvatsaran", "sink")
      ]),
      L("10-3", "Around the rooms", "The objects you reach for without thinking.", [
        it("անկողին", "ankoghin", "bed"), it("բարձ", "bardz", "pillow"), it("վերմակ", "vermak", "blanket"),
        it("սրբիչ", "srbich", "towel"), it("օճառ", "ochaṙ", "soap"), it("հայելի", "hayeli", "mirror"),
        it("լամպ", "lamp", "lamp"), it("գորգ", "gorg", "carpet"), it("վարագույր", "varaguyr", "curtain"),
        it("բանալի", "banali", "key"), it("պահարան", "paharan", "cupboard"),
        it("աղբաման", "aghbaman", "bin")
      ]),
      L("10-4", "Things said at home", "Short sentences you will hear every day.", [
        it("Դուռը փակիր", "Duṙə pakir", "Close the door"),
        it("Լույսը վառիր", "Luysə vaṙir", "Turn on the light"),
        it("Լույսը հանգցրու", "Luysə hangtsru", "Turn off the light"),
        it("Սեղանը գցիր", "Seghanə gtsir", "Set the table"),
        it("Ճաշը պատրաստ է", "Chashə patrast e", "The meal is ready"),
        it("Արի ուտենք", "Ari utenk", "Let us eat"),
        it("Ջուր կտա՞ս", "Jur ktas", "Will you pass the water?"), it("Մի րոպե", "Mi rope", "One minute"),
        it("Գալիս եմ", "Galis yem", "I am coming"),
        it("Ո՞ւր ես գնում", "Ur yes gnum", "Where are you going?")
      ]),
      L("10-5", "Keeping house", "Chores, and the verbs that go with them.", [
        it("լվանալ", "lvanal", "to wash"), it("մաքրել", "makrel", "to clean"),
        it("եփել", "yepel", "to cook"), it("ավլել", "avlel", "to sweep"),
        it("արդուկել", "ardukel", "to iron"), it("չորացնել", "choratsnel", "to dry"),
        it("դասավորել", "dasavorel", "to tidy"), it("աման լվանալ", "aman lvanal", "to wash dishes"),
        it("հագուստ լվանալ", "hagust lvanal", "to do laundry"), it("ջրել", "jrel", "to water")
      ]),
    ] },
];


/* ------------------------------------------------------------------ */
/*  Stories                                                            */
/*                                                                     */
/*  A story is a list of lines, learned one at a time. Each line has:  */
/*    hy     the Armenian sentence                                     */
/*    tr     its transliteration                                       */
/*    en     its English translation                                   */
/*    words  each word as ["Armenian", "transliteration", "English"]   */
/*                                                                     */
/*  For each line the learner reads the card, then matches:            */
/*    1. transliteration to meaning                                    */
/*    2. Armenian to transliteration                                   */
/*    3. Armenian to meaning                                           */
/*  and moves on to the next line. Lines with many words are matched   */
/*  in rounds of six. Words repeated in a line are only matched once.  */
/*                                                                     */
/*  Watch for quote marks inside a line: use “ ” or « » instead of ".  */
/* ------------------------------------------------------------------ */

const STORIES = [
  {
    id: "sutasane",
    title: "Սուտասանը",
    titleTr: "Sutasanə",
    titleEn: "The Liar",
    author: "Հովհաննես Թումանյան",
    year: 1907,
    lines: [
      // Hovhannes Tumanyan, 1907. Public domain.
      {
        hy: "Լինում է, չի լինում՝ մի թագավոր։",
        tr: "Linum e, chi linum, mi tagavor.",
        en: "Once there was, and once there wasn’t, a king.",
        words: [
          ["լինում է", "linum e", "there is"],
          ["չի լինում", "chi linum", "there isn’t"],
          ["մի", "mi", "a, one"],
          ["թագավոր", "tagavor", "king"],
        ],
      },
      {
        hy: "Էս թագավորը իր երկրումը հայտնում է.",
        tr: "Es tagavorə ir yerkrumə haytnum e:",
        en: "This king announces in his land:",
        words: [
          ["էս", "es", "this"],
          ["թագավորը", "tagavorə", "the king"],
          ["իր", "ir", "his"],
          ["երկրումը", "yerkrumə", "in the land"],
          ["հայտնում է", "haytnum e", "announces"],
        ],
      },
      {
        hy: "— Ով էնպես սուտ ասի, որ ես ասեմ՝ սուտ է, իմ թագավորության կեսը կտամ նրան։",
        tr: "— Vov enpes sut asi, vor yes asem, sut e, im tagavorutyan kesə ktam nran.",
        en: "— Whoever tells such a lie that I say, that is a lie, I will give him half my kingdom.",
        words: [
          ["ով", "vov", "whoever"],
          ["էնպես", "enpes", "such, so"],
          ["սուտ", "sut", "lie"],
          ["ասի", "asi", "tells"],
          ["որ", "vor", "that"],
          ["ես", "yes", "I"],
          ["ասեմ", "asem", "I say"],
          ["է", "e", "is"],
          ["իմ", "im", "my"],
          ["թագավորության", "tagavorutyan", "of the kingdom"],
          ["կեսը", "kesə", "the half"],
          ["կտամ", "ktam", "I will give"],
          ["նրան", "nran", "to him"],
        ],
      },
      {
        hy: "Գալիս է մի հովիվ։ Ասում է.",
        tr: "Galis e mi hoviv. Asum e:",
        en: "A shepherd comes. He says:",
        words: [
          ["գալիս է", "galis e", "comes"],
          ["մի", "mi", "a"],
          ["հովիվ", "hoviv", "shepherd"],
          ["ասում է", "asum e", "says"],
        ],
      },
      {
        hy: "— Թագավորն ապրած կենա, իմ հերը մի դագանակ ուներ, որ էստեղից մեկնում էր, երկնքում աստղերը խառնում։",
        tr: "— Tagavorn aprats kena, im herə mi daganak uner, vor esteghits meknum er, yerknkum astgherə khaṙnum.",
        en: "— Long live the king! My father had a staff that he would stretch out from here and stir the stars in the sky.",
        words: [
          ["թագավորն", "tagavorn", "the king"],
          ["ապրած կենա", "aprats kena", "long live"],
          ["իմ", "im", "my"],
          ["հերը", "herə", "the father"],
          ["մի", "mi", "a"],
          ["դագանակ", "daganak", "staff"],
          ["ուներ", "uner", "had"],
          ["որ", "vor", "that"],
          ["էստեղից", "esteghits", "from here"],
          ["մեկնում էր", "meknum er", "would stretch out"],
          ["երկնքում", "yerknkum", "in the sky"],
          ["աստղերը", "astgherə", "the stars"],
          ["խառնում", "khaṙnum", "stirs"],
        ],
      },
      {
        hy: "— Կպատահի՛,— պատասխանում է թագավորը։",
        tr: "— Kpatahi, — pataskhanum e tagavorə.",
        en: "— That could happen, — the king answers.",
        words: [
          ["կպատահի", "kpatahi", "it could happen"],
          ["պատասխանում է", "pataskhanum e", "answers"],
          ["թագավորը", "tagavorə", "the king"],
        ],
      },
      {
        hy: "— Իմ պապն էլ մի չիբուխ ուներ, մի ծերը բերանին էր դնում, մյուս ծերը մեկնում, արեգակիցը վառում։",
        tr: "— Im papn el mi chibukh uner, mi tserə beranin er dnum, myus tserə meknum, aregakitsə vaṙum.",
        en: "— My grandfather also had a pipe. He would put one end in his mouth, stretch out the other end, and light it from the sun.",
        words: [
          ["իմ", "im", "my"],
          ["պապն", "papn", "the grandfather"],
          ["էլ", "el", "also"],
          ["մի", "mi", "a, one"],
          ["չիբուխ", "chibukh", "pipe"],
          ["ուներ", "uner", "had"],
          ["ծերը", "tserə", "the end"],
          ["բերանին", "beranin", "to his mouth"],
          ["էր դնում", "er dnum", "would put"],
          ["մյուս", "myus", "the other"],
          ["մեկնում", "meknum", "stretches out"],
          ["արեգակիցը", "aregakitsə", "from the sun"],
          ["վառում", "vaṙum", "lights"],
        ],
      },
      {
        hy: "Ստախոսը գլուխը քորելով՝ դուրս է գնում։",
        tr: "Stakhosə glukhə korelov durs e gnum.",
        en: "The liar goes out, scratching his head.",
        words: [
          ["ստախոսը", "stakhosə", "the liar"],
          ["գլուխը", "glukhə", "the head"],
          ["քորելով", "korelov", "scratching"],
          ["դուրս է գնում", "durs e gnum", "goes out"],
        ],
      },
      {
        hy: "Գալիս է մի դերձակ։ Ասում է.",
        tr: "Galis e mi derdzak. Asum e:",
        en: "A tailor comes. He says:",
        words: [
          ["գալիս է", "galis e", "comes"],
          ["մի", "mi", "a"],
          ["դերձակ", "derdzak", "tailor"],
          ["ասում է", "asum e", "says"],
        ],
      },
      {
        hy: "— Ներողությո՛ւն, թագավո՛ր, ես վաղ պիտի գայի, ուշացա։",
        tr: "— Neroghutyun, tagavor, yes vagh piti gayi, ushatsa.",
        en: "— Sorry, king, I should have come early, but I was late.",
        words: [
          ["ներողություն", "neroghutyun", "sorry"],
          ["թագավոր", "tagavor", "king"],
          ["ես", "yes", "I"],
          ["վաղ", "vagh", "early"],
          ["պիտի գայի", "piti gayi", "should have come"],
          ["ուշացա", "ushatsa", "I was late"],
        ],
      },
      {
        hy: "Երեկ շատ անձրև եկավ, կայծակները տրաքեցին, երկինքը պատռվեց, գնացել էի կարկատելու։",
        tr: "Yerek shat andzrev yekav, kaytsaknerə traketsin, yerkinkə patṙvets, gnatsel ei karkatelu.",
        en: "Yesterday a lot of rain fell, the lightning cracked, the sky tore open, and I had gone to patch it.",
        words: [
          ["երեկ", "yerek", "yesterday"],
          ["շատ", "shat", "a lot"],
          ["անձրև", "andzrev", "rain"],
          ["եկավ", "yekav", "came, fell"],
          ["կայծակները", "kaytsaknerə", "the lightning bolts"],
          ["տրաքեցին", "traketsin", "cracked"],
          ["երկինքը", "yerkinkə", "the sky"],
          ["պատռվեց", "patṙvets", "tore"],
          ["գնացել էի", "gnatsel ei", "I had gone"],
          ["կարկատելու", "karkatelu", "to patch"],
        ],
      },
      {
        hy: "— Հա՛, լավ ես արել,— ասում է թագավորը,— բայց լավ չէիր կարկատել. էս առավոտ մի քիչ անձրև թափվեց։",
        tr: "— Ha, lav yes arel, — asum e tagavorə, — bayts lav cheir karkatel: es aṙavot mi kich andzrev tapvets.",
        en: "— Yes, you did well, — says the king, — but you did not patch it well: this morning a little rain fell.",
        words: [
          ["հա", "ha", "yes"],
          ["լավ", "lav", "well"],
          ["ես արել", "yes arel", "you did"],
          ["ասում է", "asum e", "says"],
          ["թագավորը", "tagavorə", "the king"],
          ["բայց", "bayts", "but"],
          ["չէիր կարկատել", "cheir karkatel", "you did not patch"],
          ["էս", "es", "this"],
          ["առավոտ", "aṙavot", "morning"],
          ["մի քիչ", "mi kich", "a little"],
          ["անձրև", "andzrev", "rain"],
          ["թափվեց", "tapvets", "poured down"],
        ],
      },
      {
        hy: "Սա էլ է դուրս գնում։",
        tr: "Sa el e durs gnum.",
        en: "He goes out too.",
        words: [
          ["սա", "sa", "this one"],
          ["էլ", "el", "too"],
          ["է", "e", "is"],
          ["դուրս", "durs", "out"],
          ["գնում", "gnum", "going"],
        ],
      },
      {
        hy: "Ներս է մտնում մի աղքատ գյուղացի, կոտը կռնատակին։",
        tr: "Ners e mtnum mi aghkat gyughatsi, kotə kṙnatakin.",
        en: "A poor villager comes in, a grain measure under his arm.",
        words: [
          ["ներս է մտնում", "ners e mtnum", "comes in"],
          ["մի", "mi", "a"],
          ["աղքատ", "aghkat", "poor"],
          ["գյուղացի", "gyughatsi", "villager"],
          ["կոտը", "kotə", "the grain measure"],
          ["կռնատակին", "kṙnatakin", "under his arm"],
        ],
      },
      {
        hy: "— Դո՞ւ ինչ ես ուզում, ա՛յ մարդ,— հարցնում է թագավորը։",
        tr: "— Du inch yes uzum, ay mard, — hartsnum e tagavorə.",
        en: "— And what do you want, my man? — asks the king.",
        words: [
          ["դու", "du", "you"],
          ["ինչ", "inch", "what"],
          ["ես ուզում", "yes uzum", "you want"],
          ["այ մարդ", "ay mard", "my man"],
          ["հարցնում է", "hartsnum e", "asks"],
          ["թագավորը", "tagavorə", "the king"],
        ],
      },
      {
        hy: "— Ինձ մի կոտ ոսկի ես պարտ, եկել եմ տանեմ։",
        tr: "— Indz mi kot voski yes part, yekel yem tanem.",
        en: "— You owe me a measure of gold. I have come to take it.",
        words: [
          ["ինձ", "indz", "to me"],
          ["մի", "mi", "a, one"],
          ["կոտ", "kot", "grain measure"],
          ["ոսկի", "voski", "gold"],
          ["ես պարտ", "yes part", "you owe"],
          ["եկել եմ", "yekel yem", "I have come"],
          ["տանեմ", "tanem", "to take away"],
        ],
      },
      {
        hy: "— Մի կոտ ոսկի՞,— զարմանում է թագավորը։— Սո՛ւտ ես ասում, ես քեզ ոսկի չեմ պարտ։",
        tr: "— Mi kot voski? — zarmanum e tagavorə. — Sut yes asum, yes kez voski chem part.",
        en: "— A measure of gold? — the king is surprised. — You are lying, I do not owe you gold.",
        words: [
          ["մի", "mi", "a, one"],
          ["կոտ", "kot", "grain measure"],
          ["ոսկի", "voski", "gold"],
          ["զարմանում է", "zarmanum e", "is surprised"],
          ["թագավորը", "tagavorə", "the king"],
          ["սուտ ես ասում", "sut yes asum", "you are lying"],
          ["ես", "yes", "I"],
          ["քեզ", "kez", "to you"],
          ["չեմ պարտ", "chem part", "I do not owe"],
        ],
      },
      {
        hy: "— Թե որ սուտ եմ ասում, թագավորությանդ կեսը տուր։",
        tr: "— Te vor sut yem asum, tagavorutyand kesə tur.",
        en: "— If I am lying, give me half your kingdom.",
        words: [
          ["թե որ", "te vor", "if"],
          ["սուտ եմ ասում", "sut yem asum", "I am lying"],
          ["թագավորությանդ", "tagavorutyand", "of your kingdom"],
          ["կեսը", "kesə", "the half"],
          ["տուր", "tur", "give!"],
        ],
      },
      {
        hy: "— Չէ՛, չէ՛, ճշմարիտ ես ասում,— խոսքը փոխում է թագավորը։",
        tr: "— Che, che, chshmarit yes asum, — khoskə pokhum e tagavorə.",
        en: "— No, no, you are telling the truth, — the king takes back his words.",
        words: [
          ["չէ", "che", "no"],
          ["ճշմարիտ", "chshmarit", "truth"],
          ["ես ասում", "yes asum", "you are saying"],
          ["խոսքը", "khoskə", "the word"],
          ["փոխում է", "pokhum e", "changes"],
          ["թագավորը", "tagavorə", "the king"],
        ],
      },
      {
        hy: "— Ճշմարիտ եմ ասում՝ մի կոտ ոսկին տուր։",
        tr: "— Chshmarit yem asum, mi kot voskin tur.",
        en: "— I am telling the truth? Then give me the measure of gold.",
        words: [
          ["ճշմարիտ", "chshmarit", "truth"],
          ["եմ ասում", "yem asum", "I am saying"],
          ["մի", "mi", "a, one"],
          ["կոտ", "kot", "grain measure"],
          ["ոսկին", "voskin", "the gold"],
          ["տուր", "tur", "give!"],
        ],
      },
    ],
  },
];

const MATCH_ROUND = 6;      // most word pairs shown at once
const LINE_XP = 2;          // experience for each new line finished

/* ------------------------------------------------------------------ */
/*  Parts of speech                                                    */
/*                                                                     */
/*  Every word in the course, filed under one of the eight parts of    */
/*  speech. Each entry is "Armenian|English", written exactly as it is */
/*  in the lessons. Full sentences are left out on purpose: a sentence */
/*  is not one part of speech. To add a new word, add its entry here.  */
/* ------------------------------------------------------------------ */

const PARTS = [
  { id: "noun", name: "Nouns", note: "People, places, things and ideas.", words: [
    "սար|mountain", "սեր|love", "ուս|shoulder", "որս|hunt", "երես|face", "սուսեր|sword", "սոսի|plane tree",
    "կրակ|fire", "ոսկի|gold", "շապիկ|shirt", "կոշիկ|shoe", "ճաշ|meal", "ապուր|soup", "կես|half",
    "երեկո|evening", "րոպե|minute", "շիշ|bottle", "կաշի|leather", "շուկա|market", "ապակի|glass", "ոսկոր|bone",
    "պապիկ|grandpa", "սուրճ|coffee", "ճարպ|fat", "շոր|garment", "կապ|tie", "հաց|bread", "հավ|chicken",
    "սիրտ|heart", "տերեվ|leaf", "խոտ|grass", "սոխ|onion", "տարի|year", "կատու|cat", "կով|cow", "պատ|wall",
    "տեր|owner", "երեխա|child", "տատիկ|grandma", "կտուր|roof", "սխտոր|garlic", "ջուր|water", "քար|stone",
    "աչք|eye", "արջ|bear", "միս|meat", "մոմ|candle", "էջ|page", "ամիս|month", "էշ|donkey", "ոտք|foot",
    "մատ|finger", "ամպ|cloud", "քամի|wind", "միտք|thought", "մուկ|mouse", "ատամ|tooth", "կամուրջ|bridge",
    "ոչխար|sheep", "շաքար|sugar", "մատիտ|pencil", "տուն|house", "գիշեր|night", "հայր|father", "մայր|mother",
    "անուն|name", "երգ|song", "գետ|river", "մազ|hair", "գին|price", "ազգ|nation", "կին|woman", "նշան|sign",
    "շուն|dog", "գորգ|carpet", "զանգ|bell", "գիրք|book", "այգի|garden", "գինի|wine", "քույր|sister",
    "ընկեր|friend", "պանիր|cheese", "ականջ|ear", "գույն|colour", "նամակ|letter", "ծով|sea", "ծառ|tree",
    "բալ|cherry", "կաթ|milk", "թեյ|tea", "թիվ|number", "քիթ|nose", "լիճ|lake", "բառ|word", "թել|thread",
    "աթոռ|chair", "առու|stream", "նուռ|pomegranate", "ամառ|summer", "լույս|light", "գլուխ|head",
    "լեզու|tongue", "բերան|mouth", "ծիրան|apricot", "լոլիկ|tomato", "ֆիլմ|film", "շաբաթ|week",
    "առավոտ|morning", "խանութ|shop", "գործ|work", "օր|day", "մարդ|person", "տղա|boy", "ձի|horse", "ձու|egg",
    "ձուկ|fish", "աղ|salt", "օդ|air", "օձ|snake", "դուռ|door", "դեղ|medicine", "փող|money", "փողոց|street",
    "ժամ|hour", "ձեռք|hand", "ձմեռ|winter", "ձյուն|snow", "վարդ|rose", "սեղան|table", "ծաղիկ|flower",
    "խնձոր|apple", "քաղաք|city", "գյուղ|village", "դպրոց|school", "թուղթ|paper", "մեղու|bee", "աստղ|star",
    "արև|sun", "տերև|leaf", "թև|arm", "կեղև|bark", "անձրև|rain", "հարևան|neighbour", "գարուն|spring",
    "Երևան|Yerevan", "արևելք|east", "արևմուտք|west", "արևածագ|sunrise", "թեթևություն|lightness",
    "ընկույզ|walnut", "ընտանիք|family", "ընթրիք|dinner", "ընկերուհի|girlfriend", "ընթացք|course",
    "տոմս|ticket", "թութ|mulberry", "փետուր|feather", "ցանկ|list", "ճամփա|road", "չամիչ|raisin",
    "կիթառ|guitar", "ուսուցիչ|teacher", "աշակերտ|pupil", "համալսարան|university", "գրադարան|library",
    "հյուրանոց|hotel", "վերելակ|lift", "սառնարան|fridge", "բանջարեղեն|vegetables", "հեռուստացույց|television",
    "օդանավակայան|airport", "տղամարդ|man", "աղջիկ|girl", "եղբայր|brother", "տատիկ|grandmother",
    "պապիկ|grandfather", "մեջք|back", "կարագ|butter", "մեղր|honey", "աղցան|salad", "պաղպաղակ|ice cream",
    "սարեր|mountains", "քարեր|stones", "ծառեր|trees", "օրեր|days", "գետեր|rivers", "կատուներ|cats",
    "երեխաներ|children", "աղջիկներ|girls", "ուսուցիչներ|teachers", "պատուհաններ|windows", "ընկերներ|friends",
    "տղաներ|boys", "գիրքը|the book", "տունը|the house", "սարը|the mountain", "դուռը|the door",
    "ջուրը|the water", "կատուն|the cat", "երեխան|the child", "ապուրը|the soup", "աչքը|the eye",
    "քաղաքը|the city", "ծառը|the tree", "մարդը|the person", "քաղաքի|of the city", "դպրոցի|of the school",
    "սարի|of the mountain", "ծառի|of the tree", "դասի|of the lesson", "ընկերոջ|of the friend",
    "երեխայի|of the child", "տան|of the house", "օրվա|of the day", "մարդու|of the person",
    "ընկերոջս|to my friend", "մորը|to the mother", "հորը|to the father", "երեխային|to the child",
    "ուսուցչին|to the teacher", "քրոջը|to the sister", "եղբորը|to the brother", "տնից|from the house",
    "քաղաքից|from the city", "դպրոցից|from the school", "սարից|from the mountain", "Հայաստանից|from Armenia",
    "աշխատանքից|from work", "գնացքով|by train", "մեքենայով|by car", "ոտքով|on foot", "ձեռքով|by hand",
    "ինքնաթիռով|by plane", "ավտոբուսով|by bus", "գրիչով|with a pen", "դանակով|with a knife",
    "հայերենով|in Armenian", "սիրով|with love", "գիրքս|my book", "գիրքդ|your book", "տունս|my house",
    "տունդ|your house", "անունս|my name", "անունդ|your name", "ձեռքս|my hand", "մայրս|my mother",
    "հայրդ|your father", "ընկերս|my friend", "երկուշաբթի|Monday", "երեքշաբթի|Tuesday", "չորեքշաբթի|Wednesday",
    "հինգշաբթի|Thursday", "ուրբաթ|Friday", "շաբաթ|Saturday", "կիրակի|Sunday", "հունվար|January", "ապրիլ|April",
    "սեպտեմբեր|September", "խոհանոց|kitchen", "ննջասենյակ|bedroom", "լոգարան|bathroom",
    "հյուրասենյակ|living room", "միջանցք|hallway", "պատշգամբ|balcony", "նկուղ|basement", "սենյակ|room",
    "բակ|yard", "աստիճաններ|stairs", "դանակ|knife", "պատառաքաղ|fork", "գդալ|spoon", "ափսե|plate",
    "բաժակ|glass", "կաթսա|pot", "վառարան|stove", "թեյնիկ|kettle", "լվացարան|sink", "անկողին|bed",
    "բարձ|pillow", "վերմակ|blanket", "սրբիչ|towel", "օճառ|soap", "հայելի|mirror", "լամպ|lamp",
    "վարագույր|curtain", "բանալի|key", "պահարան|cupboard", "աղբաման|bin"
  ] },
  { id: "pronoun", name: "Pronouns", note: "Words that stand in for a noun: I, this, who, my.", words: [
    "ես|I", "որ|that, which", "իր|his, her", "սա|this", "իրար|each other", "սրա|of this one", "որի|of which",
    "ով|who", "ինչ|what", "այս|this", "այդ|that", "այն|that over there", "սա|this one", "դա|that one",
    "նա|he, she", "սրանք|these", "դրանք|those", "ի՞նչ|what", "ո՞վ|who", "քանի՞|how many", "ո՞ր|which",
    "որքա՞ն|how much", "իմ|my", "քո|your", "նրա|his, her", "մեր|our", "ձեր|your (plural)", "նրանց|their",
    "ինձ|to me", "քեզ|to you", "նրան|to him, to her", "ինձնից|from me", "քեզնից|from you"
  ] },
  { id: "verb", name: "Verbs", note: "Actions and states, including every form you have learned.", words: [
    "արի|come!", "ասա|say!", "երևալ|to appear", "սևանալ|to turn black", "ընդունել|to accept", "ընկնել|to fall",
    "եմ|I am", "ես|you are", "է|he is, she is, it is", "ենք|we are", "եք|you are (plural)", "են|they are",
    "չեմ|I am not", "չես|you are not", "չէ|he is not", "չենք|we are not", "չեք|you are not (plural)",
    "չեն|they are not", "գրել|to write", "կարդալ|to read", "խոսել|to speak", "ուտել|to eat", "խմել|to drink",
    "տեսնել|to see", "գնալ|to go", "գալ|to come", "անել|to do", "աշխատել|to work", "սիրել|to love",
    "ապրել|to live", "գրում եմ|I am writing", "կարդում եմ|I am reading", "խոսում եմ|I am speaking",
    "ուտում եմ|I am eating", "խմում եմ|I am drinking", "աշխատում եմ|I am working", "ապրում եմ|I live",
    "սիրում եմ|I love", "տեսնում եմ|I see", "անում եմ|I am doing", "գրում ես|you are writing",
    "գրում է|he is writing", "գրում ենք|we are writing", "գրում եք|you are writing (plural)",
    "գրում են|they are writing", "կարդում է|she is reading", "խոսում ենք|we are speaking",
    "աշխատում են|they are working", "ապրում ես|you live", "ուտում են|they are eating",
    "չեմ գրում|I am not writing", "չես կարդում|you are not reading", "չի խոսում|he is not speaking",
    "չենք աշխատում|we are not working", "չեն ուտում|they are not eating", "չեմ հասկանում|I do not understand",
    "չգիտեմ|I do not know", "չեմ ուզում|I do not want", "չի կարող|he cannot", "չեմ կարող|I cannot",
    "հասկանալ|to understand", "իմանալ|to know", "ուզել|to want", "կարողանալ|to be able", "տալ|to give",
    "վերցնել|to take", "ասել|to say", "հարցնել|to ask", "սպասել|to wait", "օգնել|to help", "գտնել|to find",
    "կորցնել|to lose", "գրեցի|I wrote", "կարդացի|I read", "խոսեցի|I spoke", "աշխատեցի|I worked",
    "գրեց|he wrote", "կարդաց|she read", "խոսեցինք|we spoke", "գրեցին|they wrote", "տեսա|I saw", "ասացի|I said",
    "գրում էի|I was writing", "կարդում էի|I was reading", "խոսում էր|he was speaking",
    "աշխատում էինք|we were working", "ապրում էին|they were living", "ուտում էիր|you were eating",
    "գիտեի|I knew", "ուզում էի|I wanted", "սպասում էի|I was waiting", "չէի հասկանում|I did not understand",
    "կգրեմ|I will write", "կկարդամ|I will read", "կխոսեմ|I will speak", "կգնամ|I will go", "կգամ|I will come",
    "կանեմ|I will do", "կտեսնեմ|I will see", "կօգնեմ|I will help", "կսպասեմ|I will wait",
    "կզանգեմ|I will call", "եղավ|it happened", "գնաց|he went", "եկավ|she came", "տվեց|he gave",
    "ասաց|she said", "արեց|he did", "տեսավ|she saw", "եղա|I was", "գնացի|I went", "եկա|I came",
    "խնդրում եմ|I ask you", "Ունե՞ք|Do you have it?", "Կարո՞ղ եմ|May I?", "Գալիս եմ|I am coming",
    "լվանալ|to wash", "մաքրել|to clean", "եփել|to cook", "ավլել|to sweep", "արդուկել|to iron",
    "չորացնել|to dry", "դասավորել|to tidy", "աման լվանալ|to wash dishes", "հագուստ լվանալ|to do laundry",
    "ջրել|to water"
  ] },
  { id: "adjective", name: "Adjectives", note: "Words that describe a noun. Numbers are here too.", words: [
    "սուր|sharp", "արու|male", "երկար|long", "կարճ|short", "երկու|two", "ուրիշ|other", "վեց|six", "վատ|bad",
    "խոր|deep", "ուրախ|happy", "ցուրտ|cold", "տխուր|sad", "սպիտակ|white", "հարուստ|rich", "ճիշտ|correct",
    "շատ|many", "չոր|dry", "քիչ|few", "տաք|hot", "կարմիր|red", "նոր|new", "արագ|fast", "հին|old",
    "կանաչ|green", "ինը|nine", "լավ|good", "մեծ|big", "փոքր|small", "սև|black", "թեթև|light", "արևոտ|sunny",
    "անձրևոտ|rainy", "թևավոր|winged", "արևային|solar", "ընտիր|choice", "ընդհանուր|general", "մեկ|one",
    "երեք|three", "չորս|four", "հինգ|five", "յոթ|seven", "ութ|eight", "տասը|ten", "գեղեցիկ|beautiful",
    "սառը|cold", "թանկ|expensive", "էժան|cheap", "հեշտ|easy", "դժվար|difficult"
  ] },
  { id: "adverb", name: "Adverbs", note: "When, where, how and how often.", words: [
    "ուր|where", "ուշ|late", "երբ|when", "ևս|also", "երևի|probably", "ու՞ր|where to", "որտե՞ղ|where",
    "ե՞րբ|when", "ինչու՞|why", "ինչպե՞ս|how", "այստեղ|here", "այնտեղ|there", "Իհարկե|Of course",
    "այստեղից|from here", "այնտեղից|from there", "երեկ|yesterday", "այսօր|today", "վաղը|tomorrow", "հիմա|now",
    "հետո|later", "շուտ|early", "միշտ|always", "երբեք|never", "երբեմն|sometimes", "անցյալ շաբաթ|last week",
    "մյուս շաբաթ|next week"
  ] },
  { id: "preposition", name: "Prepositions", note: "Where things are. Armenian puts most of these after the noun.", words: [
    "մեջ|in, inside", "ներսում|inside", "դրսում|outside", "վերևում|above", "ներքևում|below", "կողքին|beside",
    "հետևում|behind", "առջևում|in front", "մեջտեղում|in the middle"
  ] },
  { id: "conjunction", name: "Conjunctions", note: "Words that join other words and sentences.", words: [
    "և|and", "ասես|as if"
  ] },
  { id: "interjection", name: "Interjections", note: "Greetings, thanks and other words said on their own.", words: [
    "ոչ|no", "այո|yes", "բարև|hello", "բարև ձեզ|hello (polite)", "բարի լույս|good morning",
    "բարի երեկո|good evening", "բարի գիշեր|good night", "ցտեսություն|goodbye", "հաջողություն|good luck",
    "բարի գալուստ|welcome", "ողջույն|greetings", "առայժմ|see you", "շնորհակալություն|thank you",
    "շնորհակալ եմ|I am grateful", "խնդրեմ|please, you are welcome", "ներողություն|sorry", "կներեք|excuse me",
    "ոչինչ|it is nothing", "հաճելի է|pleased to meet you", "բարի ախորժակ|enjoy your meal", "անհոգ|no worries"
  ] },
];


/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const pickN = (arr, n) => shuffle(arr).slice(0, n);

function splitWord(word) {
  const out = [];
  let i = 0;
  while (i < word.length) {
    if (word.slice(i, i + 2) === "ու") {
      out.push("ու");
      i += 2;
    } else {
      out.push(word[i]);
      i += 1;
    }
  }
  return out;
}

function distractors(pool, correct, n, keyFn) {
  const seen = new Set([keyFn(correct)]);
  const out = [];
  for (const o of shuffle(pool)) {
    const k = keyFn(o);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(o);
    if (out.length === n) break;
  }
  return out;
}

const todayKey = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const dayGap = (a, b) => (a ? Math.round((new Date(b) - new Date(a)) / 86400000) : Infinity);

/* ------------------------------------------------------------------ */
/*  Sessions                                                           */
/*                                                                     */
/*  Nothing is ever asked before it has been shown. Each word climbs   */
/*  four stages, saved per learner:                                    */
/*                                                                     */
/*    0  new       a card shows Armenian, transliteration and English, */
/*                 and the first question still shows the              */
/*                 transliteration                                     */
/*    1  met       Armenian only. The transliteration is behind a tap, */
/*                 and using the tap keeps the word at this stage      */
/*    2  known     the translation is tested the other way round:     */
/*                 pick or build the Armenian for an English word      */
/*    3  mastered  mixed review                                        */
/*                                                                     */
/*  A right answer at a word's own stage moves it up one. A wrong      */
/*  answer moves it down one, and a word back at 0 gets its card       */
/*  again next time.                                                   */
/* ------------------------------------------------------------------ */

const NEW_PER_SESSION = 5;
const PRACTICE_PER_SESSION = 4;
const REVIEW_PER_SESSION = 3;
const MASTERED = 3;

const wordKey = (x) => `${x.hy}|${x.en}`;
const wordsOf = (lesson) => lesson.words || lesson.items;
const stageOf = (words, x) => (words && words[wordKey(x)]) || 0;
const isSpellable = (x) => /^[ա-և]+$/.test(x.hy) && splitWord(x.hy).length <= 7;
const fullNote = (x) => `${x.hy} · ${x.rom} · ${x.en}`;

function nextStage(stage, rung, ok) {
  if (!ok) return Math.max(0, stage - 1);
  return rung === stage ? Math.min(MASTERED, stage + 1) : stage;
}

function buildSession(levelIdx, idx, words = {}) {
  const level = LEVELS[levelIdx];
  const lesson = level.lessons[idx];
  const own = wordsOf(lesson);

  // Which words this session teaches, practises and reviews.
  const fresh = shuffle(own.filter((x) => stageOf(words, x) === 0)).slice(0, NEW_PER_SESSION);
  const practice = shuffle(own.filter((x) => stageOf(words, x) > 0))
    .sort((a, b) => stageOf(words, a) - stageOf(words, b))
    .slice(0, PRACTICE_PER_SESSION + NEW_PER_SESSION - fresh.length);
  const taken = new Set([...fresh, ...practice].map(wordKey));
  const review = pickN(
    level.lessons.slice(0, idx).flatMap(wordsOf)
      .filter((x) => stageOf(words, x) > 0 && !taken.has(wordKey(x))),
    REVIEW_PER_SESSION,
  );

  // Wrong options come from words the learner has already seen, when there are enough.
  const freshKeys = new Set(fresh.map(wordKey));
  const pool = level.lessons.slice(0, idx + 1).flatMap(wordsOf);
  const seen = pool.filter((x) => stageOf(words, x) > 0 || freshKeys.has(wordKey(x)));
  const wrongOptions = (x, keyFn) => {
    const clash = (o) => o.en === x.en || o.hy === x.hy;
    const d = distractors(seen.filter((o) => !clash(o)), x, 3, keyFn);
    return d.length === 3 ? d : distractors(pool.filter((o) => !clash(o)), x, 3, keyFn);
  };

  const tiles = [...new Set(
    lesson.letters
      ? LESSONS.slice(0, idx + 1).flatMap((l) => l.letters).map((x) => x.lo)
      : [...ALPHABET, ...EXTRAS].map((x) => x.lo),
  )];

  const meaning = (x, rung) => ({
    key: wordKey(x), rung, type: "choice",
    prompt: "What does this mean?", big: x.hy,
    sub: rung === 0 ? x.rom : null,
    peek: rung === 1 ? x.rom : null,
    options: shuffle([x, ...wrongOptions(x, (o) => o.en)])
      .map((o) => ({ label: o.en, correct: o.en === x.en })),
    note: fullNote(x),
  });
  const pickArmenian = (x) => ({
    key: wordKey(x), rung: 2, type: "choice",
    prompt: `Which one means “${x.en}”?`,
    options: shuffle([x, ...wrongOptions(x, (o) => o.hy)])
      .map((o) => ({ label: o.hy, armenian: true, correct: o.hy === x.hy })),
    note: fullNote(x),
  });
  const build = (x) => {
    const target = splitWord(x.hy);
    const extra = shuffle(tiles.filter((c) => !target.includes(c))).slice(0, 4);
    return {
      key: wordKey(x), rung: 2, type: "spell",
      prompt: `Build the word for “${x.en}”`,
      target, bank: shuffle([...target, ...extra]),
      note: fullNote(x),
    };
  };
  const produce = (x) => (isSpellable(x) && Math.random() < 0.5 ? build(x) : pickArmenian(x));
  const askAt = (x, stage) =>
    stage === 1 ? meaning(x, 1)
    : stage === 2 ? produce(x)
    : Math.random() < 0.5 ? meaning(x, 1) : produce(x);

  // Letter questions, for level 1 only.
  let letterQs = [];
  let letterReview = [];
  if (lesson.letters) {
    const bank = LESSONS.slice(0, idx + 1).flatMap((l) => l.letters);
    const letterQ = (L, kind) => {
      if (kind === "sound2glyph") {
        const d = distractors(bank, L, 3, (x) => x.rom);
        return {
          type: "choice", prompt: `Which letter says “${L.rom}”?`,
          options: shuffle([L, ...d]).map((x) => ({ label: pair(x), armenian: true, correct: x.rom === L.rom })),
          note: L.tip,
        };
      }
      if (kind === "case") {
        const d = distractors(bank, L, 3, (x) => x.lo);
        return {
          type: "choice", prompt: "Pick the small form of this letter", big: L.u,
          options: shuffle([L, ...d]).map((x) => ({ label: x.lo, armenian: true, correct: x.lo === L.lo })),
          note: `${L.u} ${L.lo} · ${L.name}`,
        };
      }
      const d = distractors(bank, L, 3, (x) => x.rom);
      return {
        type: "choice", prompt: "Which sound does this letter make?", big: pair(L),
        options: shuffle([L, ...d]).map((x) => ({ label: x.rom, correct: x.rom === L.rom })),
        note: L.tip,
      };
    };
    const kinds = ["glyph2sound", "sound2glyph", "case"];
    letterQs = lesson.letters.map((L, i) => letterQ(L, L.solo ? "glyph2sound" : kinds[i % 3]));
    if (idx > 0) {
      letterReview = pickN(LESSONS.slice(0, idx).flatMap((l) => l.letters), 2)
        .map((L) => letterQ(L, Math.random() < 0.5 ? "glyph2sound" : "sound2glyph"));
    }
  }

  const cards = [
    ...(lesson.letters || []).map((x) => ({ kind: "letter", ...x })),
    ...fresh.map((x, k) => ({ kind: "word", ...x, firstWord: k === 0 })),
  ];

  // Letters first, then every new word once with its transliteration,
  // then everything else. A new word's second ask always follows its first.
  const questions = [
    ...shuffle(letterQs),
    ...shuffle(fresh.map((x) => meaning(x, 0))),
    ...shuffle([
      ...fresh.map((x) => meaning(x, 1)),
      ...practice.map((x) => askAt(x, stageOf(words, x))),
      ...review.map((x) => askAt(x, stageOf(words, x))),
      ...letterReview,
    ]),
  ];

  return { cards, questions, fresh, practice };
}

/* The rows behind the Parts of speech page. Level 1 writes some words with
   եվ before lesson 1-8 teaches և; those are the same words, so they share a
   row and count as known if either spelling has been learned. */
const KNOWN = 2;   // answered from the Armenian alone, without the transliteration

const BANK = (() => {
  const first = new Map();
  LEVELS.forEach((lv) => lv.lessons.forEach((l) => wordsOf(l).forEach((x) => {
    if (!first.has(wordKey(x))) first.set(wordKey(x), { ...x, lesson: l.id });
  })));
  return PARTS.map((part) => {
    const rows = new Map();
    for (const k of part.words) {
      const x = first.get(k);
      if (!x) continue;
      const hy = x.hy.replace(/եվ/g, "և");
      const id = `${hy}|${x.en}`;
      if (rows.has(id)) rows.get(id).keys.push(k);
      else rows.set(id, { hy, rom: x.rom, en: x.en, lesson: x.lesson, keys: [k] });
    }
    return { ...part, rows: [...rows.values()] };
  });
})();

const rowStage = (words, row) => Math.max(...row.keys.map((k) => (words && words[k]) || 0));
const knownCount = (words) => BANK.reduce((n, p) => n + p.rows.filter((r) => rowStage(words, r) >= KNOWN).length, 0);

/* ------------------------------------------------------------------ */
/*  Progress                                                           */
/* ------------------------------------------------------------------ */

const emptyProgress = () => ({ v: 2, xp: 0, lessons: {}, words: {}, streak: 0, lastDay: null });

function readStored() {
  try {
    const raw = localStorage.getItem(STORE_KEY) || localStorage.getItem(LEGACY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;   // private mode, disabled storage, or corrupted JSON
  }
}

function useProgress() {
  const [progress, setProgress] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const stored = readStored();
    setProgress({ ...emptyProgress(), ...(stored || {}) });
    let usable = false;
    try {
      localStorage.setItem("armenian:probe", "1");
      localStorage.removeItem("armenian:probe");
      usable = true;
    } catch {
      usable = false;
    }
    setStatus(usable ? "ready" : "memory");
  }, []);

  const save = useCallback((next) => {
    setProgress(next);
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch {
      setStatus("memory");
    }
  }, []);

  return { progress, status, save };
}

/* ------------------------------------------------------------------ */
/*  Layout stylesheet                                                  */
/* ------------------------------------------------------------------ */

const CSS = `
.hy-root{background:${C.ink};color:${C.parch};min-height:100vh;display:flex;flex-direction:column}
.hy-shell{display:flex;flex-direction:column;flex:1 1 auto;min-height:0}
.hy-rail{display:flex;flex-direction:row;gap:8px;overflow-x:auto;overflow-y:hidden;
  padding:12px 16px;border-bottom:1px solid ${C.line};flex:0 0 auto;-webkit-overflow-scrolling:touch}
.hy-main{flex:1 1 auto;min-width:0;width:100%}
.hy-wrap{max-width:680px;margin:0 auto;padding:28px 20px 56px;width:100%;box-sizing:border-box}
.hy-lesson{max-width:640px;margin:0 auto;padding:20px;width:100%;box-sizing:border-box;
  flex:1 1 auto;display:flex;flex-direction:column;min-height:0}
.hy-railitem{text-align:left;border-radius:8px;padding:8px 12px;cursor:pointer;
  background:transparent;border:1px solid transparent;flex:0 0 auto;min-width:150px}
.hy-railitem[data-on="true"]{background:${C.ink3};border-color:${C.gold}}
.hy-opts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.hy-tabs{display:flex;flex-wrap:wrap;gap:8px}
.hy-tab{border-radius:999px;padding:8px 14px;background:transparent;border:1px solid ${C.line};color:${C.parch};font-family:${UI};font-size:14px;cursor:pointer}
.hy-tab[aria-selected="true"]{background:${C.ink3};border-color:${C.gold}}
.hy-raildiv{flex:0 0 1px;align-self:stretch;background:${C.line};margin:0 4px}
.hy-btn:focus-visible,.hy-tab:focus-visible,.hy-railitem:focus-visible{outline:2px solid ${C.apricot};outline-offset:2px}
@media (min-width:880px){
  .hy-shell{flex-direction:row}
  .hy-rail{flex-direction:column;width:232px;flex:0 0 232px;height:100vh;position:sticky;top:0;
    overflow-y:auto;overflow-x:hidden;border-bottom:none;border-right:1px solid ${C.line};padding:26px 14px}
  .hy-railitem{min-width:0;width:100%}
  .hy-raildiv{height:1px;margin:10px 4px}
}
@media (max-width:520px){ .hy-opts{grid-template-columns:1fr} }
@media (prefers-reduced-motion:reduce){ *{transition:none!important;animation:none!important} }
`;

/* ------------------------------------------------------------------ */
/*  Small pieces                                                       */
/* ------------------------------------------------------------------ */

function Hearts({ n }) {
  return (
    <div style={{ display: "flex", gap: 4 }} aria-label={`${n} hearts left`}>
      {[0, 1, 2].map((i) => (
        <svg key={i} width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 21s-8-4.9-8-10.4A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8 3.6C20 16.1 12 21 12 21z"
            fill={i < n ? C.pom : "transparent"} stroke={i < n ? C.pom : C.line} strokeWidth="1.8" />
        </svg>
      ))}
    </div>
  );
}

function Stars({ n, size = 16 }) {
  return (
    <div style={{ display: "flex", gap: 2 }} aria-label={`${n} of 3 stars`}>
      {[1, 2, 3].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6.1L12 16.8 6.7 19.7l1.1-6.1L3.4 9.4l6-.8L12 3z"
            fill={i <= n ? C.gold : "transparent"} stroke={i <= n ? C.gold : C.line} strokeWidth="1.5" />
        </svg>
      ))}
    </div>
  );
}

function Bar({ value, total }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ height: 8, width: "100%", borderRadius: 99, background: C.ink3, overflow: "hidden" }}
      role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div style={{ height: "100%", width: `${pct}%`, background: C.apricot, borderRadius: 99, transition: "width .25s ease" }} />
    </div>
  );
}

function Button({ children, onClick, tone = "gold", disabled, full, small }) {
  const bg = disabled ? C.ink3 : tone === "gold" ? C.gold : tone === "quiet" ? "transparent" : C.pom;
  const fg = disabled ? C.muted : tone === "gold" ? C.ink : C.parch;
  return (
    <button className="hy-btn" onClick={onClick} disabled={disabled}
      style={{
        width: full ? "100%" : undefined, borderRadius: 12, fontWeight: 600, fontFamily: UI,
        padding: small ? "8px 16px" : "13px 20px", fontSize: small ? 14 : 16,
        background: bg, color: fg, border: tone === "quiet" ? `1px solid ${C.line}` : "none",
        cursor: disabled ? "not-allowed" : "pointer",
      }}>
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Alphabet board                                                     */
/* ------------------------------------------------------------------ */

function AlphabetBoard({ learnedIds, learnedCount }) {
  const [sel, setSel] = useState(null);

  const tile = (L) => {
    const on = learnedIds.has(L.u);
    const active = sel && sel.u === L.u;
    return (
      <button key={L.u} onClick={() => setSel(on ? L : null)} disabled={!on}
        title={on ? `${L.name} · ${L.rom}` : "Not learned yet"}
        style={{
          width: L.wide ? 48 : 34, height: 40, borderRadius: 6, display: "flex", alignItems: "center",
          justifyContent: "center", fontFamily: ARM, fontSize: 21, lineHeight: 1,
          color: on ? C.gold : C.line,
          background: active ? C.ink3 : on ? "rgba(216,162,43,0.07)" : "transparent",
          border: `1px solid ${active ? C.gold : on ? "rgba(216,162,43,0.28)" : C.line}`,
          cursor: on ? "pointer" : "default",
        }}>
        {glyph(L)}
      </button>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
        {ALPHABET.map((L) => tile(L))}
        <span aria-hidden="true" style={{ width: 1, height: 26, background: C.line, margin: "0 6px" }} />
        {EXTRAS.map((L) => tile(L))}
      </div>
      <div style={{ marginTop: 12, fontSize: 14, color: sel ? C.parch : C.muted, fontFamily: UI, minHeight: 22 }}>
        {sel ? (
          <span>
            <span style={{ fontFamily: ARM, color: C.gold }}>{pair(sel)}</span>{"  "}
            <span style={{ fontFamily: ARM }}>{sel.name}</span> · {sel.rom} — {sel.tip}
          </span>
        ) : (
          `${learnedCount} of 38 letters lit, plus և after the divider. Tap a gold one for a reminder.`
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Home                                                               */
/* ------------------------------------------------------------------ */

function LessonList({ level, progress, onStart }) {
  const lessons = level.lessons;
  const firstOpen = lessons.findIndex((L) => !progress.lessons[L.id]?.done);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {lessons.map((L, i) => {
        const rec = progress.lessons[L.id];
        const done = !!rec?.done;
        const locked = i > 0 && !progress.lessons[lessons[i - 1].id]?.done;
        const next = i === firstOpen;
        const letters = L.letters;
        return (
          <button key={L.id} className="hy-btn" onClick={() => !locked && onStart(i)} disabled={locked}
            style={{
              textAlign: "left", borderRadius: 12, padding: "16px", background: C.ink2,
              border: `1px solid ${next ? C.apricot : done ? "rgba(216,162,43,0.35)" : C.line}`,
              opacity: locked ? 0.45 : 1, cursor: locked ? "not-allowed" : "pointer",
            }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
              <span style={{ fontFamily: UI, fontSize: 14, color: C.parch, fontWeight: 600 }}>
                {L.id} · {L.title}
              </span>
              {done ? <Stars n={rec.stars} />
                : locked ? <span style={{ fontFamily: UI, fontSize: 12, color: C.muted }}>locked</span>
                : <span style={{ fontFamily: UI, fontSize: 12, color: C.apricot }}>start</span>}
            </div>
            <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8, fontFamily: ARM, fontSize: letters ? 24 : 19, lineHeight: 1.35, color: done ? C.gold : locked ? C.line : C.parch }}>
              {letters
                ? letters.map((x) => <span key={x.u}>{glyph(x)}</span>)
                : L.items.slice(0, 5).map((x) => <span key={x.hy}>{x.hy}</span>)}
            </div>
            <div style={{ marginTop: 8, fontFamily: UI, fontSize: 12, color: C.muted }}>
              {(letters ? `${letters.filter((x) => !x.uncounted).length} letters · ` : "") +
                `${wordsOf(L).filter((x) => stageOf(progress.words, x) > 0).length} of ${wordsOf(L).length} words introduced`}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function Home({ progress, onStart, storageWarning, level, setLevel }) {
  const learnedIds = useMemo(() => {
    const s = new Set();
    LESSONS.forEach((L) => {
      if (progress.lessons[L.id]?.done) L.letters.forEach((x) => s.add(x.u));
    });
    return s;
  }, [progress]);

  const learnedCount = ALPHABET.filter((x) => learnedIds.has(x.u)).length;
  const current = LEVELS.find((L) => L.n === level);

  return (
    <div className="hy-wrap">
      <header style={{ marginBottom: 30 }}>
        <h1 style={{ fontFamily: ARM, fontSize: 46, color: C.gold, lineHeight: 1.05, margin: 0, fontWeight: 700 }}>
          Հայերեն
        </h1>
        <p style={{ marginTop: 8, fontFamily: UI, color: C.muted, fontSize: 15 }}>Eastern Armenian</p>
      </header>

      <section style={{ marginBottom: 28 }}>
        <AlphabetBoard learnedIds={learnedIds} learnedCount={learnedCount} />
      </section>

      <section style={{
        marginBottom: 30, display: "flex", gap: 26, borderRadius: 12,
        padding: "12px 16px", background: C.ink2, border: `1px solid ${C.line}`,
      }}>
        {[
          [progress.xp, "experience", C.apricot],
          [progress.streak, "day streak", C.apricot],
          [`${learnedCount}/38`, "letters", C.gold],
        ].map(([v, label, col]) => (
          <div key={label}>
            <div style={{ fontFamily: UI, fontSize: 22, color: col, fontWeight: 700 }}>{v}</div>
            <div style={{ fontFamily: UI, fontSize: 12, color: C.muted }}>{label}</div>
          </div>
        ))}
      </section>

      <LessonList level={current} progress={progress} onStart={onStart} />

      {storageWarning && (
        <p style={{ marginTop: 24, fontFamily: UI, fontSize: 12, color: C.muted }}>
          Progress can't be saved in this browser — check if storage is blocked.
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Parts of speech page                                               */
/* ------------------------------------------------------------------ */

function WordBank({ words }) {
  const [tab, setTab] = useState(PARTS[0].id);
  const part = BANK.find((p) => p.id === tab);
  const known = part.rows.filter((r) => rowStage(words, r) >= KNOWN);
  const learning = part.rows.filter((r) => { const st = rowStage(words, r); return st > 0 && st < KNOWN; });
  const unmet = part.rows.length - known.length - learning.length;

  const row = (r, isKnown) => (
    <div key={r.hy + r.en} style={{ display: "flex", alignItems: "baseline", gap: 16, padding: "12px 0", borderBottom: `1px solid ${C.line}` }}>
      <span style={{ flex: "0 0 44%", minWidth: 0, overflowWrap: "anywhere", fontFamily: ARM, fontSize: 22, lineHeight: 1.3, color: isKnown ? C.gold : C.parch }}>
        {r.hy}
      </span>
      <span style={{ flex: "1 1 auto", minWidth: 0 }}>
        <span style={{ display: "block", fontFamily: UI, fontSize: 15, color: C.parch }}>{r.en}</span>
        <span style={{ display: "block", marginTop: 2, fontFamily: UI, fontSize: 13, color: C.apricot }}>{r.rom}</span>
      </span>
    </div>
  );
  const heading = (text) => (
    <h2 style={{ margin: "26px 0 4px", fontFamily: UI, fontSize: 14, fontWeight: 600, color: C.muted }}>{text}</h2>
  );

  return (
    <div className="hy-wrap">
      <header style={{ marginBottom: 26 }}>
        <h1 style={{ fontFamily: ARM, fontSize: 40, color: C.gold, lineHeight: 1.1, margin: 0, fontWeight: 700 }}>Խոսքի մասեր</h1>
        <p style={{ marginTop: 10, fontFamily: UI, color: C.muted, fontSize: 15, lineHeight: 1.6, maxWidth: 520 }}>
          Parts of speech. Every word you have met, sorted by the job it does. A word turns gold
          once you can answer it from the Armenian alone.
        </p>
      </header>

      <div className="hy-tabs" role="tablist" aria-label="Parts of speech">
        {BANK.map((p) => {
          const n = p.rows.filter((r) => rowStage(words, r) >= KNOWN).length;
          return (
            <button key={p.id} className="hy-tab" role="tab" aria-selected={p.id === tab} onClick={() => setTab(p.id)}>
              {p.name} <span style={{ marginLeft: 4, color: n ? C.gold : C.muted }}>{n}</span>
            </button>
          );
        })}
      </div>

      <div role="tabpanel" aria-label={part.name} style={{ marginTop: 22 }}>
        <p style={{ margin: 0, fontFamily: UI, fontSize: 15, color: C.parch }}>{part.note}</p>
        <p style={{ margin: "6px 0 0", fontFamily: UI, fontSize: 13, color: C.muted }}>
          {known.length} known · {learning.length} still learning · {unmet} to meet in later lessons
        </p>

        {known.length + learning.length === 0 ? (
          <p style={{ marginTop: 26, fontFamily: UI, fontSize: 15, color: C.muted, lineHeight: 1.6 }}>
            No {part.name.toLowerCase()} yet. The first ones come in lesson {part.rows[0].lesson}.
          </p>
        ) : (
          <>
            {known.length > 0 && <section>{heading("You know these")}{known.map((r) => row(r, true))}</section>}
            {learning.length > 0 && <section>{heading("Still learning")}{learning.map((r) => row(r, false))}</section>}
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stories page                                                       */
/* ------------------------------------------------------------------ */

const STORY_STAGES = [
  { label: "Read" },
  { label: "Sound to meaning", a: "tr", b: "en", prompt: "Match each word's sound with its meaning" },
  { label: "Letters to sound", a: "hy", b: "tr", prompt: "Match each Armenian word with how it sounds" },
  { label: "Letters to meaning", a: "hy", b: "en", prompt: "Match each Armenian word with its meaning" },
];

const FIELD_STYLE = {
  hy: { fontFamily: ARM, fontSize: 22 },
  tr: { fontFamily: UI, fontSize: 16, fontStyle: "italic", color: C.apricot },
  en: { fontFamily: UI, fontSize: 16 },
};

function lineWords(line) {
  const seen = new Set();
  const out = [];
  for (const [hy, tr, en] of line.words || []) {
    const id = `${hy}|${en}`;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ id, hy, tr, en });
  }
  return out;
}

function inRounds(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  // Never leave a lonely single pair at the end: fold it into the round before.
  if (out.length > 1 && out[out.length - 1].length === 1) out[out.length - 2].push(...out.pop());
  return out;
}

function MatchRound({ items, a, b, prompt, roundLabel, onDone }) {
  const [left] = useState(() => shuffle(items));
  const [right] = useState(() => shuffle(items));
  const [pick, setPick] = useState(null);
  const [doneL, setDoneL] = useState(() => new Set());
  const [doneR, setDoneR] = useState(() => new Set());
  const [miss, setMiss] = useState(null);

  const allDone = doneL.size === items.length;

  const tapLeft = (i) => {
    if (doneL.has(i)) return;
    setMiss(null);
    setPick(i === pick ? null : i);
  };

  const tapRight = (j) => {
    if (pick === null || doneR.has(j)) return;
    // Compare by what is shown, so two words with the same meaning both count.
    if (right[j][b] === left[pick][b]) {
      setDoneL(new Set(doneL).add(pick));
      setDoneR(new Set(doneR).add(j));
      setPick(null);
    } else {
      setMiss({ l: pick, r: j });
      setPick(null);
      setTimeout(() => setMiss(null), 650);
    }
  };

  const tile = (item, field, state, onClick, key) => {
    const border = state === "done" ? "rgba(216,162,43,0.35)" : state === "pick" ? C.apricot : state === "miss" ? C.pom : C.line;
    const bg = state === "done" ? "rgba(216,162,43,0.08)" : state === "pick" ? C.ink3 : state === "miss" ? "rgba(194,43,62,0.16)" : C.ink2;
    return (
      <button key={key} className="hy-btn" onClick={onClick} disabled={state === "done"}
        style={{
          ...FIELD_STYLE[field], width: "100%", minHeight: 54, borderRadius: 12, padding: "10px 12px",
          background: bg, border: `1px solid ${border}`, lineHeight: 1.3, overflowWrap: "anywhere",
          color: state === "done" ? C.gold : FIELD_STYLE[field].color || C.parch,
          opacity: state === "done" ? 0.7 : 1, cursor: state === "done" ? "default" : "pointer",
        }}>
        {item[field]}
      </button>
    );
  };

  return (
    <div>
      <h2 style={{ fontFamily: UI, fontSize: 18, color: C.parch, fontWeight: 600, lineHeight: 1.4, margin: 0 }}>{prompt}</h2>
      <p style={{ margin: "6px 0 0", fontFamily: UI, fontSize: 13, color: C.muted }}>
        Tap a word on the left, then its partner on the right.{roundLabel ? ` ${roundLabel}` : ""}
      </p>
      <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 10 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {left.map((x, i) => tile(x, a,
            doneL.has(i) ? "done" : pick === i ? "pick" : miss && miss.l === i ? "miss" : "idle",
            () => tapLeft(i), `l${i}`))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {right.map((x, j) => tile(x, b,
            doneR.has(j) ? "done" : miss && miss.r === j ? "miss" : "idle",
            () => tapRight(j), `r${j}`))}
        </div>
      </div>
      <div style={{ marginTop: 24 }}>
        <Button full disabled={!allDone} onClick={onDone}>{allDone ? "Continue" : `${doneL.size} of ${items.length} matched`}</Button>
      </div>
    </div>
  );
}

function StoryPlayer({ story, progress, save, onBack }) {
  const total = story.lines.length;
  const saved = (progress.stories && progress.stories[story.id]) || 0;
  const [line, setLine] = useState(saved >= total ? total : saved);
  const [stage, setStage] = useState(0);
  const [round, setRound] = useState(0);

  if (line >= total) {
    return (
      <section style={{ borderRadius: 12, padding: "36px 20px", background: C.ink2, border: `1px solid ${C.line}`, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center" }}><Stars n={3} size={34} /></div>
        <h2 style={{ marginTop: 18, fontFamily: ARM, fontSize: 28, color: C.gold }}>{story.title}</h2>
        <p style={{ marginTop: 6, fontFamily: UI, fontSize: 15, color: C.muted }}>
          Story complete. All {total} lines read and matched.
        </p>
        <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 10 }}>
          <Button full onClick={onBack}>Back to all stories</Button>
          <Button full tone="quiet" onClick={() => { setLine(0); setStage(0); setRound(0); }}>Read it again</Button>
        </div>
      </section>
    );
  }

  const L = story.lines[line];
  const rounds = inRounds(lineWords(L), MATCH_ROUND);
  const st = STORY_STAGES[stage];

  const finishLine = () => {
    if (line + 1 > saved) {
      save({
        ...progress,
        xp: progress.xp + LINE_XP,
        stories: { ...(progress.stories || {}), [story.id]: line + 1 },
      });
    }
    setLine(line + 1); setStage(0); setRound(0);
  };

  const nextStep = () => {
    if (stage > 0 && round + 1 < rounds.length) return setRound(round + 1);
    if (stage + 1 < STORY_STAGES.length && rounds.length > 0) { setStage(stage + 1); setRound(0); return; }
    finishLine();
  };

  return (
    <section style={{ borderRadius: 12, padding: "22px 20px", background: C.ink2, border: `1px solid ${C.line}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Bar value={line} total={total} />
        <span style={{ flex: "0 0 auto", fontFamily: UI, fontSize: 12, color: C.muted }}>Line {line + 1} of {total}</span>
      </div>

      <ol aria-label="Steps for this line" style={{ listStyle: "none", padding: 0, margin: "16px 0 24px", display: "flex", flexWrap: "wrap", gap: 6 }}>
        {STORY_STAGES.map((s, k) => (
          <li key={s.label} aria-current={k === stage ? "step" : undefined}
            style={{
              fontFamily: UI, fontSize: 12, padding: "4px 10px", borderRadius: 999,
              border: `1px solid ${k === stage ? C.gold : C.line}`,
              color: k < stage ? C.gold : k === stage ? C.parch : C.muted,
              background: k === stage ? C.ink3 : "transparent",
            }}>
            {k + 1}. {s.label}
          </li>
        ))}
      </ol>

      {stage === 0 ? (
        <div>
          <div style={{ fontFamily: ARM, fontSize: 26, lineHeight: 1.5, color: C.parch }}>{L.hy}</div>
          <div style={{ marginTop: 8, fontFamily: UI, fontSize: 17, lineHeight: 1.5, color: C.apricot, fontStyle: "italic" }}>{L.tr}</div>
          <div style={{ marginTop: 8, fontFamily: UI, fontSize: 17, lineHeight: 1.5, color: C.parch }}>{L.en}</div>

          {rounds.length > 0 && (
            <div style={{ marginTop: 22, borderTop: `1px solid ${C.line}` }}>
              {rounds.flat().map((x) => (
                <div key={x.id} style={{ display: "flex", alignItems: "baseline", gap: 14, padding: "10px 0", borderBottom: `1px solid ${C.line}` }}>
                  <span style={{ flex: "0 0 38%", minWidth: 0, overflowWrap: "anywhere", fontFamily: ARM, fontSize: 20, color: C.gold }}>{x.hy}</span>
                  <span style={{ flex: "1 1 auto", minWidth: 0 }}>
                    <span style={{ display: "block", fontFamily: UI, fontSize: 14, color: C.apricot, fontStyle: "italic" }}>{x.tr}</span>
                    <span style={{ display: "block", fontFamily: UI, fontSize: 14, color: C.parch }}>{x.en}</span>
                  </span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            {line > 0 && <Button tone="quiet" onClick={() => { setLine(line - 1); setStage(0); setRound(0); }}>Previous line</Button>}
            <div style={{ flex: 1 }}>
              <Button full onClick={nextStep}>{rounds.length ? "Start matching" : "Next line"}</Button>
            </div>
          </div>
        </div>
      ) : (
        <MatchRound key={`${line}-${stage}-${round}`} items={rounds[round]} a={st.a} b={st.b} prompt={st.prompt}
          roundLabel={rounds.length > 1 ? `Round ${round + 1} of ${rounds.length}.` : ""}
          onDone={nextStep} />
      )}
    </section>
  );
}

const linesDone = (progress, s) => (progress.stories && progress.stories[s.id]) || 0;
const storyRead = (progress, s) => linesDone(progress, s) >= s.lines.length;
const storiesRead = (progress) => STORIES.filter((s) => storyRead(progress, s)).length;

function StoryCard({ story, progress, onOpen }) {
  const done = linesDone(progress, story);
  const total = story.lines.length;
  const read = done >= total;
  const started = done > 0 && !read;
  return (
    <button className="hy-btn" onClick={onOpen}
      style={{
        textAlign: "left", width: "100%", borderRadius: 12, padding: "18px 16px", background: C.ink2, cursor: "pointer",
        border: `1px solid ${started ? C.apricot : read ? "rgba(216,162,43,0.35)" : C.line}`,
      }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <span style={{ fontFamily: ARM, fontSize: 26, lineHeight: 1.2, color: read ? C.gold : C.parch }}>{story.title}</span>
        <span style={{ flex: "0 0 auto", fontFamily: UI, fontSize: 12, fontWeight: 600, color: read ? C.gold : started ? C.apricot : C.muted }}>
          {read ? "Read" : started ? "Continue" : "Start"}
        </span>
      </div>
      <div style={{ marginTop: 4, fontFamily: UI, fontSize: 14, color: C.muted }}>
        <span style={{ color: C.apricot, fontStyle: "italic" }}>{story.titleTr}</span> · {story.titleEn}
      </div>
      {story.author && (
        <div style={{ marginTop: 2, fontFamily: UI, fontSize: 13, color: C.muted }}>
          <span style={{ fontFamily: ARM }}>{story.author}</span>{story.year ? ` · ${story.year}` : ""}
        </div>
      )}
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12 }}>
        <Bar value={done} total={total} />
        <span style={{ flex: "0 0 auto", fontFamily: UI, fontSize: 12, color: C.muted }}>
          {read ? `${total} lines` : `${done} of ${total} lines`}
        </span>
      </div>
    </button>
  );
}

function StoryReader({ progress, save }) {
  const [openId, setOpenId] = useState(null);
  const story = STORIES.find((s) => s.id === openId);

  if (story) {
    return (
      <div className="hy-wrap">
        <button className="hy-btn" onClick={() => setOpenId(null)}
          style={{ background: "none", border: "none", padding: 0, marginBottom: 18, color: C.muted, fontFamily: UI, fontSize: 14, cursor: "pointer" }}>
          ← All stories
        </button>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: ARM, fontSize: 30, color: C.gold, lineHeight: 1.2 }}>{story.title}</div>
          <div style={{ marginTop: 4, fontFamily: UI, fontSize: 15, color: C.muted }}>
            <span style={{ color: C.apricot, fontStyle: "italic" }}>{story.titleTr}</span> · {story.titleEn}
            {story.author && <> · <span style={{ fontFamily: ARM }}>{story.author}</span></>}
            {story.year && <> · {story.year}</>}
          </div>
        </div>
        <StoryPlayer key={story.id} story={story} progress={progress} save={save} onBack={() => setOpenId(null)} />
      </div>
    );
  }

  const read = storiesRead(progress);
  return (
    <div className="hy-wrap">
      <header style={{ marginBottom: 26 }}>
        <h1 style={{ fontFamily: ARM, fontSize: 40, color: C.gold, lineHeight: 1.1, margin: 0, fontWeight: 700 }}>Պատմություններ</h1>
        <p style={{ marginTop: 10, fontFamily: UI, color: C.muted, fontSize: 15, lineHeight: 1.6, maxWidth: 520 }}>
          Stories, one line at a time. Read each line, then match its words three ways before moving on.
        </p>
        <p style={{ margin: "6px 0 0", fontFamily: UI, fontSize: 13, color: read ? C.gold : C.muted }}>
          {read} of {STORIES.length} {STORIES.length === 1 ? "story" : "stories"} read
        </p>
      </header>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {STORIES.map((s) => (
          <StoryCard key={s.id} story={s} progress={progress} onOpen={() => setOpenId(s.id)} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Study                                                              */
/* ------------------------------------------------------------------ */

function Study({ lesson, cards, onDone, onQuit }) {
  const [i, setI] = useState(0);
  const c = cards[i];
  const last = i === cards.length - 1;
  const next = cards[i + 1];
  const newLetters = new Set((lesson.letters || []).map((x) => x.lo));
  const label = last ? "Start practice"
    : c.kind === "letter" && next.kind === "word" ? "On to the words"
    : c.kind === "letter" ? "Next letter" : "Next word";

  return (
    <div className="hy-lesson">
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
        <button className="hy-btn" onClick={onQuit} aria-label="Leave lesson"
          style={{ color: C.muted, background: "none", border: "none", cursor: "pointer", fontSize: 20 }}>✕</button>
        <Bar value={i + 1} total={cards.length} />
      </div>

      <div style={{ flex: "1 1 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", paddingBottom: 16 }}>
        {c.kind === "letter" ? (
          <>
            <div style={{ fontFamily: ARM, fontSize: c.wide ? 68 : 92, color: C.gold, lineHeight: 1.1 }}>{pair(c)}</div>
            <div style={{ marginTop: 14, fontFamily: ARM, fontSize: 20, color: C.parch }}>{c.name}</div>
            <div style={{ marginTop: 2, fontFamily: UI, fontSize: 28, color: C.apricot, fontWeight: 600 }}>{c.rom}</div>
            <p style={{ marginTop: 18, fontFamily: UI, fontSize: 15, color: C.muted, maxWidth: 380, lineHeight: 1.6 }}>{c.tip}</p>
            {c.ex ? (
              <div style={{ marginTop: 22, borderRadius: 12, padding: "16px 24px", background: C.ink2, border: `1px solid ${C.line}` }}>
                <div style={{ fontFamily: ARM, fontSize: 32, lineHeight: 1.25, color: C.parch }}>
                  {splitWord(c.ex.hy).map((ch, k) => (
                    <span key={k} style={{ color: ch === c.lo ? C.gold : C.parch }}>{ch}</span>
                  ))}
                </div>
                <div style={{ marginTop: 4, fontFamily: UI, fontSize: 15, color: C.apricot }}>{c.ex.rom}</div>
                <div style={{ fontFamily: UI, fontSize: 15, color: C.muted }}>{c.ex.en}</div>
              </div>
            ) : (
              <p style={{ marginTop: 22, fontFamily: UI, fontSize: 14, color: C.muted, maxWidth: 380, lineHeight: 1.6 }}>
                No example word in this lesson — ֆ is rare enough that none of its words fits here yet.
              </p>
            )}
          </>
        ) : (
          <>
            {c.firstWord && lesson.letters && (
              <p style={{ margin: "0 0 26px", fontFamily: UI, fontSize: 14, color: C.muted, maxWidth: 380, lineHeight: 1.6 }}>
                Words you can read with these letters. The new letters are in gold.
              </p>
            )}
            <div style={{ fontFamily: ARM, fontSize: c.hy.length > 12 ? 34 : 50, lineHeight: 1.25, maxWidth: 480 }}>
              {lesson.letters
                ? splitWord(c.hy).map((ch, k) => (
                    <span key={k} style={{ color: newLetters.has(ch) ? C.gold : C.parch }}>{ch}</span>
                  ))
                : <span style={{ color: C.gold }}>{c.hy}</span>}
            </div>
            <div style={{ marginTop: 12, fontFamily: UI, fontSize: 20, color: C.apricot }}>{c.rom}</div>
            <div style={{ marginTop: 4, fontFamily: UI, fontSize: 18, color: C.parch }}>{c.en}</div>
            {i === 0 && lesson.note && (
              <p style={{ marginTop: 26, fontFamily: UI, fontSize: 14, color: C.muted, maxWidth: 400, lineHeight: 1.6 }}>
                {lesson.note}
              </p>
            )}
          </>
        )}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        {i > 0 && <Button tone="quiet" onClick={() => setI(i - 1)}>Back</Button>}
        <div style={{ flex: 1 }}>
          <Button full onClick={() => (last ? onDone() : setI(i + 1))}>{label}</Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Quiz                                                               */
/* ------------------------------------------------------------------ */

function Quiz({ questions, onFinish, onQuit }) {
  const [i, setI] = useState(0);
  const [sel, setSel] = useState(null);
  const [built, setBuilt] = useState([]);
  const [state, setState] = useState("answering");
  const [hearts, setHearts] = useState(3);
  const [mistakes, setMistakes] = useState(0);
  const [results, setResults] = useState([]);
  const [peeked, setPeeked] = useState(false);

  const q = questions[i];


  const ready = q.type === "spell" ? built.length === q.target.length : sel !== null;

  const check = () => {
    const ok = q.type === "spell" ? built.join("") === q.target.join("") : q.options[sel].correct;
    // Peeking at the transliteration counts the answer at the easier stage.
    if (q.key) setResults((r) => [...r, { key: q.key, rung: peeked ? 0 : q.rung, ok }]);
    if (ok) setState("right");
    else { setState("wrong"); setMistakes((m) => m + 1); setHearts((h) => h - 1); }
  };

  const advance = () => {
    if (state === "wrong" && hearts <= 0) return onFinish({ failed: true, mistakes, results });
    if (i + 1 >= questions.length) return onFinish({ failed: false, mistakes, results });
    // Reset in the same update as the move, so the next question never
    // appears for a frame with the previous answer's state.
    setSel(null); setBuilt([]); setState("answering"); setPeeked(false);
    setI(i + 1);
  };

  const answer = q.type === "spell" ? q.target.join("") : q.options.find((o) => o.correct)?.label;

  return (
    <div className="hy-lesson">
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
        <button className="hy-btn" onClick={onQuit} aria-label="Leave lesson"
          style={{ color: C.muted, background: "none", border: "none", cursor: "pointer", fontSize: 20 }}>✕</button>
        <Bar value={i} total={questions.length} />
        <Hearts n={Math.max(hearts, 0)} />
      </div>

      <div style={{ flex: "1 1 auto" }}>
        <h2 style={{ fontFamily: UI, fontSize: 19, color: C.parch, fontWeight: 600, lineHeight: 1.4, margin: 0 }}>{q.prompt}</h2>

        {q.big && (
          <div style={{ margin: "32px 0", textAlign: "center" }}>
            <div style={{ fontFamily: ARM, fontSize: q.big.length > 16 ? 34 : q.big.length > 8 ? 48 : 72, color: C.gold, lineHeight: 1.15 }}>
              {q.big}
            </div>
            {(q.sub || (q.peek && peeked)) && (
              <div style={{ marginTop: 10, fontFamily: UI, fontSize: 20, color: C.apricot }}>{q.sub || q.peek}</div>
            )}
            {q.peek && !peeked && state === "answering" && (
              <button className="hy-btn" onClick={() => setPeeked(true)}
                style={{ marginTop: 10, background: "none", border: "none", color: C.muted, fontFamily: UI, fontSize: 14, textDecoration: "underline", cursor: "pointer" }}>
                Show how it sounds
              </button>
            )}
          </div>
        )}

        {q.type === "choice" && (
          <div className="hy-opts" style={{ marginTop: 24 }}>
            {q.options.map((o, k) => {
              const chosen = sel === k;
              const reveal = state !== "answering";
              const good = reveal && o.correct;
              const bad = reveal && chosen && !o.correct;
              return (
                <button key={k} className="hy-btn" onClick={() => state === "answering" && setSel(k)}
                  style={{
                    borderRadius: 12, padding: "16px", minHeight: 62, color: C.parch,
                    background: good ? "rgba(216,162,43,0.16)" : bad ? "rgba(194,43,62,0.16)" : chosen ? C.ink3 : C.ink2,
                    border: `1px solid ${good ? C.gold : bad ? C.pom : chosen ? C.apricot : C.line}`,
                    fontFamily: o.armenian ? ARM : UI, fontSize: o.armenian ? 26 : 16,
                    cursor: state === "answering" ? "pointer" : "default",
                  }}>
                  {o.label}
                </button>
              );
            })}
          </div>
        )}

        {q.type === "spell" && (
          <div style={{ marginTop: 30 }}>
            {q.hint && <div style={{ fontFamily: UI, fontSize: 13, color: C.muted, marginBottom: 10 }}>sounds like “{q.hint}”</div>}
            <div style={{
              display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, minHeight: 64,
              borderRadius: 12, padding: "16px 12px", background: C.ink2, border: `1px dashed ${C.line}`,
            }}>
              {built.length === 0 && <span style={{ fontFamily: UI, fontSize: 14, color: C.muted }}>Tap letters below in order</span>}
              {built.map((ch, k) => (
                <button key={k} className="hy-btn" onClick={() => state === "answering" && setBuilt(built.filter((_, x) => x !== k))}
                  style={{ borderRadius: 8, padding: "6px 12px", background: C.ink3, border: `1px solid ${C.apricot}`, color: C.parch, fontFamily: ARM, fontSize: 26, cursor: "pointer" }}>
                  {ch}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap", gap: 8 }}>
              {q.bank.map((ch, k) => {
                const spent = built.filter((b) => b === ch).length >= q.bank.filter((b) => b === ch).length;
                return (
                  <button key={k} className="hy-btn" disabled={spent}
                    onClick={() => state === "answering" && !spent && setBuilt([...built, ch])}
                    style={{
                      borderRadius: 8, padding: "8px 16px", fontFamily: ARM, fontSize: 26,
                      background: spent ? "transparent" : C.ink2,
                      border: `1px solid ${spent ? C.line : "rgba(216,162,43,0.35)"}`,
                      color: spent ? C.line : C.parch, cursor: spent ? "default" : "pointer",
                    }}>
                    {ch}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 28 }}>
        {state === "answering" ? (
          <Button full disabled={!ready} onClick={check}>Check</Button>
        ) : (
          <div style={{
            borderRadius: 12, padding: "16px",
            background: state === "right" ? "rgba(216,162,43,0.12)" : "rgba(194,43,62,0.12)",
            border: `1px solid ${state === "right" ? C.gold : C.pom}`,
          }}>
            <div style={{ fontFamily: UI, fontWeight: 700, fontSize: 15, color: state === "right" ? C.gold : C.pom }}>
              {state === "right" ? "Correct" : `Answer: ${answer}`}
            </div>
            {q.note && <div style={{ marginTop: 4, fontFamily: UI, fontSize: 13, color: C.muted, lineHeight: 1.5 }}>{q.note}</div>}
            <div style={{ marginTop: 14 }}>
              <Button full tone={state === "right" ? "gold" : "pom"} onClick={advance}>
                {state === "wrong" && hearts <= 0 ? "See results" : "Continue"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Result                                                             */
/* ------------------------------------------------------------------ */

function Result({ lesson, session, result, stars, xpGain, onRetry, onHome }) {
  const wrap = { maxWidth: 460, margin: "0 auto", padding: "64px 20px", textAlign: "center", width: "100%", boxSizing: "border-box" };

  if (result.failed) {
    return (
      <div style={wrap}>
        <div style={{ display: "flex", justifyContent: "center" }}><Hearts n={0} /></div>
        <h2 style={{ marginTop: 18, fontFamily: UI, fontSize: 22, color: C.parch, fontWeight: 700 }}>Out of hearts</h2>
        <p style={{ marginTop: 8, fontFamily: UI, fontSize: 15, color: C.muted, lineHeight: 1.6 }}>
          Lesson {lesson.id} stays where it is. Try again: the cards come first, then the questions.
        </p>
        <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12 }}>
          <Button full onClick={onRetry}>Try lesson {lesson.id} again</Button>
          <Button full tone="quiet" onClick={onHome}>Back to the alphabet</Button>
        </div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "center" }}><Stars n={stars} size={38} /></div>
      <h2 style={{ marginTop: 24, fontFamily: UI, fontSize: 22, color: C.parch, fontWeight: 700 }}>
        Lesson {lesson.id} complete
      </h2>
      <p style={{ marginTop: 8, fontFamily: UI, fontSize: 15, color: C.muted }}>
        {result.mistakes === 0 ? "No mistakes." : `${result.mistakes} mistake${result.mistakes > 1 ? "s" : ""}.`} +{xpGain} experience.
      </p>
      {lesson.letters && (
        <>
          <div style={{ marginTop: 32, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, fontFamily: ARM, fontSize: 34, color: C.gold }}>
            {lesson.letters.map((x) => <span key={x.u}>{glyph(x)}</span>)}
          </div>
          <p style={{ marginTop: 12, fontFamily: UI, fontSize: 13, color: C.muted }}>now lit on your board</p>
        </>
      )}
      {session.fresh.length > 0 && (
        <>
          <div style={{ marginTop: 28, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 14px", fontFamily: ARM, fontSize: 22, color: C.parch }}>
            {session.fresh.map((x) => <span key={x.hy}>{x.hy}</span>)}
          </div>
          <p style={{ marginTop: 10, fontFamily: UI, fontSize: 13, color: C.muted }}>
            {session.fresh.length} new {session.fresh.length === 1 ? "word" : "words"} this time
          </p>
        </>
      )}
      <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 12 }}>
        <Button full onClick={onHome}>Back to the alphabet</Button>
        <Button full tone="quiet" onClick={onRetry}>Practise again</Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  App                                                                */
/* ------------------------------------------------------------------ */

export default function ArmenianCourse() {
  const { progress, status, save } = useProgress();
  const [view, setView] = useState({ name: "home" });
  const [level, setLevel] = useState(1);

  useEffect(() => {
    const id = "hy-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Noto+Serif+Armenian:wght@400;600;700&family=Archivo:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);

  const startLesson = (lvl, idx) => {
    const session = buildSession(lvl - 1, idx, progress.words);
    setView({ name: session.cards.length ? "study" : "quiz", lvl, idx, session });
  };

  const finish = async (lvl, idx, result) => {
    const lesson = LEVELS[lvl - 1].lessons[idx];
    let stars = 0, xpGain = 0;
    if (!result.failed) {
      stars = result.mistakes === 0 ? 3 : result.mistakes <= 2 ? 2 : 1;
      xpGain = 10 + (result.mistakes === 0 ? 5 : 0);
      const prev = progress.lessons[lesson.id];
      const today = todayKey();
      const gap = dayGap(progress.lastDay, today);
      const streak = gap === 0 ? progress.streak || 1 : gap === 1 ? (progress.streak || 0) + 1 : 1;
      const words = { ...(progress.words || {}) };
      for (const r of result.results) words[r.key] = nextStage(words[r.key] || 0, r.rung, r.ok);
      save({
        ...progress,
        words,
        xp: progress.xp + xpGain,
        streak, lastDay: today,
        lessons: { ...progress.lessons, [lesson.id]: { done: true, stars: Math.max(stars, prev?.stars || 0), mistakes: result.mistakes } },
      });
    }
    setView({ name: "result", lvl, idx, session: view.session, result, stars, xpGain });
  };

  if (!progress) {
    return (
      <div style={{ background: C.ink, minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <style>{CSS}</style>
        <span style={{ fontFamily: ARM, fontSize: 40, color: C.line }}>Ա</span>
      </div>
    );
  }

  const inLesson = view.name === "study" || view.name === "quiz" || view.name === "result";

  let body;
  if (view.name === "study") {
    body = <Study lesson={LEVELS[view.lvl - 1].lessons[view.idx]} cards={view.session.cards} onQuit={() => setView({ name: "home" })} onDone={() => setView({ ...view, name: "quiz" })} />;
  } else if (view.name === "quiz") {
    body = <Quiz questions={view.session.questions} onQuit={() => setView({ name: "home" })} onFinish={(r) => finish(view.lvl, view.idx, r)} />;
  } else if (view.name === "result") {
    body = <Result lesson={LEVELS[view.lvl - 1].lessons[view.idx]} session={view.session} result={view.result} stars={view.stars} xpGain={view.xpGain}
      onRetry={() => startLesson(view.lvl, view.idx)} onHome={() => setView({ name: "home" })} />;
  } else {
    body = level === "stories" ? <StoryReader progress={progress} save={save} /> : level === "pos" ? <WordBank words={progress.words} /> : <Home progress={progress} onStart={(idx) => startLesson(level, idx)} storageWarning={status === "memory"} level={level} setLevel={setLevel} />;
  }

  return (
    <div className="hy-root">
      <style>{CSS}</style>
      <div className="hy-shell">
        {!inLesson && (
          <nav className="hy-rail" aria-label="Levels">
            {LEVELS.map((L) => {
              const doneCount = L.lessons.filter((x) => progress.lessons[x.id]?.done).length;
              const complete = doneCount === L.lessons.length;
              return (
                <button key={L.n} className="hy-railitem" data-on={level === L.n} onClick={() => setLevel(L.n)}
                  aria-label={`Level ${L.n}, ${L.name}${complete ? ", complete" : ""}`}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: UI, fontSize: 11, fontWeight: 600, color: level === L.n || complete ? C.gold : C.muted }}>
                    Level {L.n}
                    {complete && (
                      <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
                        <circle cx="8" cy="8" r="8" fill={C.gold} />
                        <path d="M4.5 8.3l2.3 2.3 4.7-4.9" fill="none" stroke={C.ink} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div style={{ fontFamily: UI, fontSize: 14, fontWeight: 500, lineHeight: 1.3, color: C.parch }}>
                    {L.name}
                  </div>
                  <div style={{ fontFamily: UI, fontSize: 11, color: complete ? C.gold : C.muted, marginTop: 2 }}>
                    {complete ? "Complete" : `${doneCount} of ${L.lessons.length} done`}
                  </div>
                </button>
              );
            })}
            <div className="hy-raildiv" aria-hidden="true" />
            <button className="hy-railitem" data-on={level === "pos"} onClick={() => setLevel("pos")}
              aria-label={`Parts of speech, ${knownCount(progress.words)} words known`}>
              <div style={{ fontFamily: UI, fontSize: 14, fontWeight: 500, lineHeight: 1.3, color: C.parch }}>
                Parts of speech
              </div>
              <div style={{ fontFamily: UI, fontSize: 11, color: knownCount(progress.words) ? C.gold : C.muted, marginTop: 2 }}>
                {knownCount(progress.words)} words known
              </div>
            </button>
            <button className="hy-railitem" data-on={level === "stories"} onClick={() => setLevel("stories")}
              aria-label={`Stories, ${storiesRead(progress)} of ${STORIES.length} read`}>
              <div style={{ fontFamily: UI, fontSize: 14, fontWeight: 500, lineHeight: 1.3, color: C.parch }}>
                Stories
              </div>
              <div style={{ fontFamily: UI, fontSize: 11, color: storiesRead(progress) ? C.gold : C.muted, marginTop: 2 }}>
                {storiesRead(progress)} of {STORIES.length} {STORIES.length === 1 ? "story" : "stories"} read
              </div>
            </button>
          </nav>
        )}
        <main className="hy-main">{body}</main>
      </div>
    </div>
  );
}
