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
/*  Naming: domains (A0 to C2) hold units, units hold chapters, and    */
/*  chapters hold lessons. An A0 chapter is one lesson; an A1 chapter  */
/*  is 10 lessons of 10 words.                                         */
/*                                                                     */
/*  Chapter 1-1 teaches a core of five vowels plus ս and ր. Every later*/
/*  chapter's words are spellable from that core plus its own new      */
/*  letters — no word ever needs a letter from a different chapter.    */
/* ------------------------------------------------------------------ */

const w = (hy, rom, en) => ({ hy, rom, en });
const l = (u, lo, name, rom, tip, ex) => ({ u, lo, name, rom, tip, ex });
const wide = (u, lo, name, rom, tip, ex) => ({ ...l(u, lo, name, rom, tip, ex), wide: true });
const aside = (u, lo, name, rom, tip, ex) => ({ ...l(u, lo, name, rom, tip, ex), solo: true });
const glyph = (x) => (x.solo ? x.lo : x.u);
const pair = (x) => (x.solo ? x.lo : `${x.u} ${x.lo}`);

// Domains (A0 to C2) hold units; units hold chapters; chapters hold lessons; lessons hold words.
// An A0 chapter is a single lesson made of its own words: chapter(id, title, note, words).
// From A1 on, a chapter lists its lessons: chapterOf(id, title, note, [lesson(...), ..., sentences(...), ...]).
const chapter = (id, title, note, items) => ({ id, title, note, items });
const lesson = (id, title, note, items) => ({ id, title, note, items });
const chapterOf = (id, title, note, lessons) => ({ id, title, note, lessons });
// A practice lesson: no new words, just sentences built from words already taught.
const sentences = (id, title, note, items) => ({ id, title, note, sentences: items });
const it = (hy, rom, en) => ({ hy, rom, en });

const LETTER_CHAPTERS = [
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
      w("սար", "sar", "mountain"), w("սեր", "ser", "love"), w("ես", "yes", "I"), w("սա", "sa", "this"),
      w("արի", "ari", "come!")
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
      w("ճաշ", "chash", "meal"), w("ապուր", "apur", "soup"), w("կոշիկ", "koshik", "shoe"),
      w("շուկա", "shuka", "market"), w("ոսկի", "voski", "gold")
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
      w("հաց", "hats", "bread"), w("կատու", "katu", "cat"), w("երեխա", "yerekha", "child"),
      w("ուրախ", "urakh", "happy"), w("տխուր", "tkhur", "sad")
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
      w("ջուր", "jur", "water"), w("աչք", "achk", "eye"), w("ամիս", "amis", "month"), w("մատիտ", "matit", "pencil"),
      w("տաք", "tak", "hot")
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
      w("տուն", "tun", "house"), w("հայր", "hayr", "father"), w("մայր", "mayr", "mother"),
      w("ընկեր", "ənker", "friend"), w("գիրք", "girk", "book")
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
      w("ծառ", "tsaṙ", "tree"), w("լավ", "lav", "good"), w("մեծ", "mets", "big"), w("թեյ", "tey", "tea"),
      w("ծով", "tsov", "sea")
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
      w("օր", "or", "day"), w("ձուկ", "dzuk", "fish"), w("փոքր", "pokr", "small"), w("քաղաք", "kaghak", "city"),
      w("ծաղիկ", "tsaghik", "flower")
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
      w("սև", "sev", "black"), w("և", "yev", "and"), w("արև", "arev", "sun"), w("անձրև", "andzrev", "rain"),
      w("հարևան", "harevan", "neighbour")
    ],
  },
];

const ALPHABET = LETTER_CHAPTERS.flatMap((L) => L.letters.filter((x) => !x.uncounted));
// Anything marked uncounted is taught but kept off the alphabet count. և now counts as the 39th letter.
const EXTRAS = LETTER_CHAPTERS.flatMap((L) => L.letters.filter((x) => x.uncounted));

// Units, grouped into domains (A0 to C2). Each unit holds chapters; each chapter holds words.
const UNITS = [
  { n: 1, name: "The letters",
    blurb: "All 39 letters, grouped so that every word a chapter asks you to read is spellable from that chapter plus the core.",
    topics: ["39 letters, ending with և", "40 words", "Reading short words"], chapters: LETTER_CHAPTERS },
  { n: 2, name: "Syllables and stress", blurb: "Turning letters into sound. The rules that decide how a written word is said.",
    topics: ["Words with ու", "Where the stress falls", "Armenian punctuation"], chapters: [
      chapter("2-1", "Words with ու", "ու is two letters but one sound. Read each of these aloud.", [
        it("լույս", "luys", "light"), it("քույր", "kuyr", "sister"), it("մուկ", "muk", "mouse"),
        it("գույն", "guyn", "colour"), it("անուն", "anun", "name")
      ]),
      chapter("2-2", "Words built on և", "Now that you have the ligature, here it is inside longer words.", [
        it("Երևան", "Yerevan", "Yerevan"), it("արևելք", "arevelk", "east"), it("արևմուտք", "arevmutk", "west"),
        it("անձրևոտ", "andzrevot", "rainy"), it("երևալ", "yereval", "to appear")
      ]),
      chapter("2-3", "Words that begin with ը", "ը is the neutral uh. At the start of a word it is always written.", [
        it("ընկույզ", "ənkuyz", "walnut"), it("ընտանիք", "əntanik", "family"), it("ընթրիք", "əntrik", "dinner"),
        it("ընկնել", "ənknel", "to fall"), it("ընկերուհի", "ənkeruhi", "girlfriend")
      ]),
      chapter("2-4", "Telling the pairs apart", "Armenian separates puffed and unpuffed consonants. կաթ and քիթ, պատ and փետուր differ only in that puff.", [
        it("կաթ", "kat", "milk"), it("քիթ", "kit", "nose"), it("պատ", "pat", "wall"),
        it("փետուր", "petur", "feather"), it("ճամփա", "champa", "road")
      ]),
      chapter("2-5", "Longer words", "Read these slowly, one syllable at a time.", [
        it("գրադարան", "gradaran", "library"), it("հյուրանոց", "hyuranots", "hotel"),
        it("սառնարան", "saṙnaran", "fridge"), it("հեռուստացույց", "heṙustatsuyts", "television"),
        it("օդանավակայան", "odanavakayan", "airport")
      ]),
      chapter("2-6", "Where the stress falls", "Armenian stress falls on the last syllable: u-su-TSICH, a-sha-KERT. Keep the weight at the end.", [
        it("ուսուցիչ", "usutsich", "teacher"), it("աշակերտ", "ashakert", "pupil"),
        it("համալսարան", "hamalsaran", "university"), it("վերելակ", "verelak", "lift"),
        it("բանջարեղեն", "banjareghen", "vegetables")
      ]),
      chapter("2-7", "The hidden ը sound", "Many words hide an uh that is never written. Say մնալ as mə-NAL, խնձոր as khən-DZOR.", [
        it("մնալ", "mənal", "to stay"), it("խնձոր", "khəndzor", "apple"), it("գնացք", "gənatsk", "train"),
        it("բժիշկ", "bəzhishk", "doctor"), it("տղա", "təgha", "boy")
      ]),
      chapter("2-8", "Armenian punctuation", "Armenian has its own marks. The full stop looks like a colon, and the question mark sits on top of a word.", [
        it("վերջակետ", "verjaket", "full stop ( ։ )"), it("ստորակետ", "storaket", "comma ( , )"),
        it("բութ", "but", "pause mark ( ՝ )"), it("շեշտ", "shesht", "emphasis mark ( ՛ )"),
        it("հարցական նշան", "hartsakan nshan", "question mark ( ՞ )")
      ]),
    ] },
  { n: 3, name: "First words", blurb: "A working core of everyday vocabulary, and the first piece of grammar: making things plural.",
    topics: ["People", "Numbers", "Animals"], chapters: [
      chapter("3-1", "People", "The words for the people around you.", [
        it("մարդ", "mard", "person"), it("կին", "kin", "woman"), it("տղամարդ", "tghamard", "man"),
        it("աղջիկ", "aghjik", "girl"), it("եղբայր", "yeghbayr", "brother")
      ]),
      chapter("3-2", "The body", "Parts of the body, most of them short words.", [
        it("գլուխ", "glukh", "head"), it("ականջ", "akanj", "ear"), it("բերան", "beran", "mouth"),
        it("ձեռք", "dzeṙk", "hand"), it("ոտք", "votk", "foot")
      ]),
      chapter("3-3", "Food and drink", "What is on the table.", [
        it("պանիր", "panir", "cheese"), it("միս", "mis", "meat"), it("ձու", "dzu", "egg"),
        it("սուրճ", "surch", "coffee"), it("մեղր", "meghr", "honey")
      ]),
      chapter("3-4", "Numbers one to five", "Counting. These come up constantly.", [
        it("մեկ", "mek", "one"), it("երկու", "yerku", "two"), it("երեք", "yerek", "three"),
        it("չորս", "chors", "four"), it("հինգ", "hing", "five")
      ]),
      chapter("3-5", "Making things plural", "One syllable takes -եր. Two or more syllables take -ներ.", [
        it("սարեր", "sarer", "mountains"), it("ծառեր", "tsaṙer", "trees"), it("կատուներ", "katuner", "cats"),
        it("երեխաներ", "yerekhaner", "children"), it("ընկերներ", "ənkerner", "friends")
      ]),
      chapter("3-6", "Numbers six to ten", "The rest of the first ten.", [
        it("վեց", "vets", "six"), it("յոթ", "yot", "seven"), it("ութ", "ut", "eight"), it("ինը", "inə", "nine"),
        it("տասը", "tasə", "ten")
      ]),
      chapter("3-7", "Animals", "Animals you will meet in a village or a city.", [
        it("շուն", "shun", "dog"), it("ձի", "dzi", "horse"), it("կով", "kov", "cow"),
        it("ոչխար", "vochkhar", "sheep"), it("թռչուն", "tṙchun", "bird")
      ]),
      chapter("3-8", "In nature", "Out of the city: water, sky and weather.", [
        it("գետ", "get", "river"), it("լիճ", "lich", "lake"), it("ամպ", "amp", "cloud"), it("աստղ", "astgh", "star"),
        it("քամի", "kami", "wind")
      ]),
    ] },
  { n: 4, name: "Naming and pointing", blurb: "Saying which thing you mean. Armenian attaches its article to the end of the word.",
    topics: ["The attached article", "Asking questions", "On, in and under"], chapters: [
      chapter("4-1", "The attached article", "English puts the in front. Armenian adds -ը to the end of a word that ends in a consonant.", [
        it("գիրքը", "girkə", "the book"), it("տունը", "tunə", "the house"), it("դուռը", "duṙə", "the door"),
        it("քաղաքը", "kaghakə", "the city"), it("ջուրը", "jurə", "the water")
      ]),
      chapter("4-2", "This and that", "այս, այդ and այն go before a noun. դա and նա stand alone.", [
        it("այս", "ays", "this"), it("այդ", "ayd", "that"), it("այն", "ayn", "that over there"),
        it("դա", "da", "that one"), it("նա", "na", "he, she")
      ]),
      chapter("4-3", "Asking questions", "The ՞ mark sits over the stressed vowel of the questioned word.", [
        it("ի՞նչ", "inch", "what"), it("ո՞վ", "vov", "who"), it("որտե՞ղ", "vortegh", "where"),
        it("ե՞րբ", "yerb", "when"), it("ինչու՞", "inchu", "why")
      ]),
      chapter("4-4", "Whose it is", "The possessive words, used before the noun.", [
        it("իմ", "im", "my"), it("քո", "ko", "your"), it("նրա", "nra", "his, her"), it("մեր", "mer", "our"),
        it("ձեր", "dzer", "your (plural)")
      ]),
      chapter("4-5", "Here and there", "Place words you will need in every conversation.", [
        it("այստեղ", "aystegh", "here"), it("այնտեղ", "ayntegh", "there"), it("ներսում", "nersum", "inside"),
        it("դրսում", "drsum", "outside"), it("կողքին", "koghkin", "beside")
      ]),
      chapter("4-6", "The article ն after vowels", "When a word ends in a vowel, the article is -ն instead of -ը.", [
        it("կատուն", "katun", "the cat"), it("երեխան", "yerekhan", "the child"), it("տղան", "tghan", "the boy"),
        it("այգին", "aygin", "the garden"), it("ձուն", "dzun", "the egg")
      ]),
      chapter("4-7", "A and one: մի", "մի before a noun means a or one.", [
        it("մի", "mi", "a, one"), it("մի գիրք", "mi girk", "a book"), it("մի կատու", "mi katu", "a cat"),
        it("մի քիչ", "mi kich", "a little"), it("մի բան", "mi ban", "something")
      ]),
      chapter("4-8", "On, in and under", "These come after the noun: սեղանի վրա, on the table.", [
        it("վրա", "vra", "on"), it("մեջ", "mej", "in, inside"), it("տակ", "tak", "under"),
        it("վերևում", "verevum", "above"), it("ներքևում", "nerkevum", "below")
      ]),
    ] },
  { n: 5, name: "Saying what things are", blurb: "Your first full sentences, built on the verb to be.",
    topics: ["The verb to be", "There is, there isn't", "Having things"], chapters: [
      chapter("5-1", "The verb to be", "Armenian puts եմ, ես, է after the word it belongs to.", [
        it("եմ", "yem", "I am"), it("ես", "yes", "you are"), it("է", "e", "he is, she is, it is"),
        it("ենք", "yenk", "we are"), it("են", "yen", "they are")
      ]),
      chapter("5-2", "Simple sentences", "Subject, then the describing word, then the verb.", [
        it("Նա բժիշկ է", "Na bzhishk e", "She is a doctor"), it("Դու ընկեր ես", "Du ənker yes", "You are a friend"),
        it("Մենք հայ ենք", "Menk hay yenk", "We are Armenian"),
        it("Սա իմ գիրքն է", "Sa im girkn e", "This is my book"),
        it("Այս քաղաքը մեծ է", "Ays kaghakə mets e", "This city is big")
      ]),
      chapter("5-3", "Describing words", "Adjectives come before the noun and never change.", [
        it("նոր", "nor", "new"), it("հին", "hin", "old"), it("վատ", "vat", "bad"),
        it("գեղեցիկ", "geghetsik", "beautiful"), it("երկար", "yerkar", "long")
      ]),
      chapter("5-4", "Saying no", "չ- attaches to the front of the verb to be.", [
        it("չեմ", "chem", "I am not"), it("չես", "ches", "you are not"), it("չէ", "che", "he is not"),
        it("չենք", "chenk", "we are not"), it("չեն", "chen", "they are not")
      ]),
      chapter("5-5", "Yes and no questions", "Word order stays the same. Only the intonation and the ՞ change.", [
        it("այո", "ayo", "yes"), it("ոչ", "voch", "no"),
        it("Դու ուսանո՞ղ ես", "Du usanogh yes", "Are you a student?"),
        it("Նա տա՞նն է", "Na tann e", "Is he at home?"), it("Իհարկե", "Iharke", "Of course")
      ]),
      chapter("5-6", "Opposites", "Pairs to learn together: hot and cold, easy and hard, dear and cheap.", [
        it("սառը", "saṙə", "cold"), it("հեշտ", "hesht", "easy"), it("դժվար", "dzhvar", "difficult"),
        it("թանկ", "tank", "expensive"), it("էժան", "ezhan", "cheap")
      ]),
      chapter("5-7", "There is, there isn't", "կա means there is. Put չ- in front for there isn't.", [
        it("կա", "ka", "there is"), it("չկա", "chka", "there isn't"), it("Կա՞", "Ka", "Is there?"),
        it("Ջուր կա", "Jur ka", "There is water"), it("Հաց չկա", "Hats chka", "There is no bread")
      ]),
      chapter("5-8", "Having things", "ունեմ, ունես, ունի: I have, you have, he or she has.", [
        it("ունեմ", "unem", "I have"), it("ունես", "unes", "you have"), it("ունի", "uni", "he has, she has"),
        it("չունեմ", "chunem", "I do not have"), it("Ես մի շուն ունեմ", "Yes mi shun unem", "I have a dog")
      ]),
    ] },
  { n: 6, name: "Endings that carry meaning", blurb: "Armenian marks a noun's job with an ending rather than with word order.",
    topics: ["Of something", "Coming from", "Inside something"], chapters: [
      chapter("6-1", "Of something", "The genitive adds -ի. It marks what the thing belongs to.", [
        it("քաղաքի", "kaghaki", "of the city"), it("սարի", "sari", "of the mountain"),
        it("ծառի", "tsaṙi", "of the tree"), it("տան", "tan", "of the house"), it("մարդու", "mardu", "of the person")
      ]),
      chapter("6-2", "Giving to someone", "The same -ի form also marks who receives something.", [
        it("մորը", "morə", "to the mother"), it("հորը", "horə", "to the father"),
        it("երեխային", "yerekhayin", "to the child"), it("ինձ", "indz", "to me"), it("քեզ", "kez", "to you")
      ]),
      chapter("6-3", "Coming from", "The ablative adds -ից. It marks the source.", [
        it("տնից", "tnits", "from the house"), it("քաղաքից", "kaghakits", "from the city"),
        it("այստեղից", "aysteghits", "from here"), it("այնտեղից", "aynteghits", "from there"),
        it("Հայաստանից", "Hayastanits", "from Armenia")
      ]),
      chapter("6-4", "By means of", "The instrumental adds -ով. It marks the tool or the way.", [
        it("գնացքով", "gnatskov", "by train"), it("մեքենայով", "mekenayov", "by car"),
        it("ոտքով", "votkov", "on foot"), it("ավտոբուսով", "avtobusov", "by bus"),
        it("ինքնաթիռով", "inknatiṙov", "by plane")
      ]),
      chapter("6-5", "My and your on the noun", "Armenian can attach -ս for my and -դ for your.", [
        it("գիրքս", "girks", "my book"), it("գիրքդ", "girkd", "your book"), it("տունս", "tuns", "my house"),
        it("անունս", "anuns", "my name"), it("անունդ", "anund", "your name")
      ]),
      chapter("6-6", "Inside something: -ում", "-ում on the end of a place means in or at.", [
        it("քաղաքում", "kaghakum", "in the city"), it("դպրոցում", "dprotsum", "at school"),
        it("սենյակում", "senyakum", "in the room"), it("այգում", "aygum", "in the garden"),
        it("խանութում", "khanutum", "in the shop")
      ]),
      chapter("6-7", "Endings on plurals", "The same endings go after -եր and -ներ.", [
        it("գրքերը", "grkerə", "the books"), it("տները", "tnerə", "the houses"),
        it("ընկերների", "ənkerneri", "of the friends"), it("երեխաներին", "yerekhanerin", "to the children"),
        it("քաղաքներից", "kaghaknerits", "from the cities")
      ]),
      chapter("6-8", "Endings in sentences", "Now the endings at work in whole sentences.", [
        it("Տնից եմ գալիս", "Tnits yem galis", "I am coming from home"),
        it("Գնացքով ենք գնում", "Gnatskov yenk gnum", "We are going by train"),
        it("Քաղաքում եմ", "Kaghakum yem", "I am in the city"),
        it("Ընկերոջս տուր", "Ənkerojs tur", "Give it to my friend"),
        it("Սա ընկերոջս գիրքն է", "Sa ənkerojs girkn e", "This is my friend's book")
      ]),
    ] },
  { n: 7, name: "Verbs in the present", blurb: "Describing what is happening now, and saying that it is not.",
    topics: ["Happening now", "Not happening", "Wanting and being able to"], chapters: [
      chapter("7-1", "Naming the action", "Dictionary forms end in -ել or -ալ.", [
        it("գրել", "grel", "to write"), it("կարդալ", "kardal", "to read"), it("խոսել", "khosel", "to speak"),
        it("ուտել", "utel", "to eat"), it("խմել", "khmel", "to drink")
      ]),
      chapter("7-2", "Happening now", "Drop the ending, add -ում, then the verb to be.", [
        it("գրում եմ", "grum yem", "I am writing"), it("կարդում եմ", "kardum yem", "I am reading"),
        it("խոսում եմ", "khosum yem", "I am speaking"), it("ուտում եմ", "utum yem", "I am eating"),
        it("ապրում եմ", "aprum yem", "I live")
      ]),
      chapter("7-3", "All six persons", "Only the verb to be changes at the end.", [
        it("գրում ես", "grum yes", "you are writing"), it("գրում է", "grum e", "he is writing"),
        it("գրում ենք", "grum yenk", "we are writing"), it("գրում եք", "grum yek", "you are writing (plural)"),
        it("գրում են", "grum yen", "they are writing")
      ]),
      chapter("7-4", "Not happening", "չ- goes on the verb to be, which then moves in front.", [
        it("չեմ գրում", "chem grum", "I am not writing"), it("չի խոսում", "chi khosum", "he is not speaking"),
        it("չենք աշխատում", "chenk ashkhatum", "we are not working"), it("չգիտեմ", "chgitem", "I do not know"),
        it("չեմ ուզում", "chem uzum", "I do not want")
      ]),
      chapter("7-5", "Useful verbs", "Verbs you will reach for every day.", [
        it("տալ", "tal", "to give"), it("վերցնել", "vertsnel", "to take"), it("ասել", "asel", "to say"),
        it("օգնել", "ognel", "to help"), it("սպասել", "spasel", "to wait")
      ]),
      chapter("7-6", "Verbs ending in -ալ", "-ալ verbs work the same way: կարդալ becomes կարդում.", [
        it("հասկանալ", "haskanal", "to understand"), it("իմանալ", "imanal", "to know"),
        it("խաղալ", "khaghal", "to play"), it("մոռանալ", "moṙanal", "to forget"),
        it("վախենալ", "vakhenal", "to be afraid")
      ]),
      chapter("7-7", "Asking what someone is doing", "Question word first, then the verb to be, then the action.", [
        it("Ի՞նչ ես անում", "Inch yes anum", "What are you doing?"),
        it("Ո՞ւր ես գնում", "Ur yes gnum", "Where are you going?"),
        it("Ի՞նչ ես կարդում", "Inch yes kardum", "What are you reading?"),
        it("Ո՞վ է խոսում", "Vov e khosum", "Who is speaking?"),
        it("Որտե՞ղ ես ապրում", "Vortegh yes aprum", "Where do you live?")
      ]),
      chapter("7-8", "Wanting and being able to", "ուզել and կարողանալ, and the forms you will use most.", [
        it("ուզել", "uzel", "to want"), it("կարողանալ", "karoghanal", "to be able"),
        it("ուզում եմ", "uzum yem", "I want"), it("կարող եմ", "karogh yem", "I can"),
        it("չեմ կարող", "chem karogh", "I cannot")
      ]),
    ] },
  { n: 8, name: "Past and future", blurb: "Moving off the present tense.",
    topics: ["Finished actions", "Will happen", "Commands"], chapters: [
      chapter("8-1", "Finished actions", "The aorist. It says the action happened and ended.", [
        it("գրեցի", "gretsi", "I wrote"), it("կարդացի", "kardatsi", "I read"), it("խոսեցի", "khosetsi", "I spoke"),
        it("աշխատեցի", "ashkhatetsi", "I worked"), it("ասացի", "asatsi", "I said")
      ]),
      chapter("8-2", "Was happening", "The imperfect. Present form, but with էի instead of եմ.", [
        it("գրում էի", "grum ei", "I was writing"), it("կարդում էի", "kardum ei", "I was reading"),
        it("խոսում էր", "khosum er", "he was speaking"), it("ապրում էին", "aprum ein", "they were living"),
        it("ուզում էի", "uzum ei", "I wanted")
      ]),
      chapter("8-3", "Will happen", "կ- on the front makes the future.", [
        it("կգրեմ", "kgrem", "I will write"), it("կգնամ", "kgnam", "I will go"), it("կգամ", "kgam", "I will come"),
        it("կանեմ", "kanem", "I will do"), it("կտեսնեմ", "ktesnem", "I will see")
      ]),
      chapter("8-4", "Irregular pasts", "The most common verbs do not follow the pattern. Learn these as they are.", [
        it("եղավ", "yeghav", "it happened"), it("գնաց", "gnats", "he went"), it("եկավ", "yekav", "she came"),
        it("տվեց", "tvets", "he gave"), it("տեսավ", "tesav", "she saw")
      ]),
      chapter("8-5", "When it happened", "Time words that pin a sentence down.", [
        it("երեկ", "yerek", "yesterday"), it("այսօր", "aysor", "today"), it("վաղը", "vaghə", "tomorrow"),
        it("հիմա", "hima", "now"), it("հետո", "heto", "later")
      ]),
      chapter("8-6", "Have done", "-ել plus the verb to be: it has happened and still matters.", [
        it("գրել եմ", "grel yem", "I have written"), it("կարդացել եմ", "kardatsel yem", "I have read"),
        it("եղել եմ", "yeghel yem", "I have been"), it("տեսել եմ", "tesel yem", "I have seen"),
        it("գնացել է", "gnatsel e", "he has gone")
      ]),
      chapter("8-7", "Commands", "Telling one person to do something.", [
        it("գրիր", "grir", "write!"), it("կարդա", "karda", "read!"), it("նստիր", "nstir", "sit down!"),
        it("լսիր", "lsir", "listen!"), it("նայիր", "nayir", "look!")
      ]),
      chapter("8-8", "Must and should", "պետք է and պիտի go before the verb.", [
        it("պետք է", "petk e", "must, need to"), it("պիտի", "piti", "have to"),
        it("Պետք է գնամ", "Petk e gnam", "I must go"), it("Պետք չէ", "Petk che", "It is not needed"),
        it("Պիտի աշխատեմ", "Piti ashkhatem", "I have to work")
      ]),
    ] },
  { n: 9, name: "Holding a conversation", blurb: "The exchanges you will actually have with people.",
    topics: ["Greetings", "Introducing yourself", "Feelings"], chapters: [
      chapter("9-1", "Greetings", "What you say walking in and walking out.", [
        it("բարև", "barev", "hello"), it("բարև ձեզ", "barev dzez", "hello (polite)"),
        it("բարի լույս", "bari luys", "good morning"), it("բարի գիշեր", "bari gisher", "good night"),
        it("ցտեսություն", "tstesutyun", "goodbye")
      ]),
      chapter("9-2", "Please and thank you", "Politeness carries a long way.", [
        it("շնորհակալություն", "shnorhakalutyun", "thank you"), it("խնդրեմ", "khndrem", "please, you are welcome"),
        it("ներողություն", "neroghutyun", "sorry"), it("կներեք", "knerek", "excuse me"),
        it("բարի ախորժակ", "bari akhorzhak", "enjoy your meal")
      ]),
      chapter("9-3", "Introducing yourself", "The first thirty seconds of any conversation.", [
        it("Անունս Արամ է", "Anuns Aram e", "My name is Aram"),
        it("Ի՞նչ է ձեր անունը", "Inch e dzer anunə", "What is your name?"),
        it("Ինչպե՞ս եք", "Inchpes yek", "How are you?"), it("Լավ եմ", "Lav yem", "I am well"),
        it("Հայաստանից եմ", "Hayastanits yem", "I am from Armenia")
      ]),
      chapter("9-4", "Asking for things", "Shops, cafes, and anywhere you need something.", [
        it("Որքա՞ն արժե", "Vorkan arzhe", "How much does it cost?"),
        it("Ջուր, խնդրեմ", "Jur, khndrem", "Water, please"), it("Սա ի՞նչ է", "Sa inch e", "What is this?"),
        it("Ուզում եմ սա", "Uzum yem sa", "I want this"), it("Հաշիվը, խնդրեմ", "Hashivə, khndrem", "The bill, please")
      ]),
      chapter("9-5", "Weekdays", "Monday to Friday. The names count from Sunday: երկու, երեք, չորս, հինգ.", [
        it("երկուշաբթի", "yerkushabti", "Monday"), it("երեքշաբթի", "yerekshabti", "Tuesday"),
        it("չորեքշաբթի", "chorekshabti", "Wednesday"), it("հինգշաբթի", "hingshabti", "Thursday"),
        it("ուրբաթ", "urbat", "Friday")
      ]),
      chapter("9-6", "Feelings", "Say how you are, after Լավ եմ.", [
        it("հոգնած", "hognats", "tired"), it("զայրացած", "zayratsats", "angry"),
        it("վախեցած", "vakhetsats", "scared"), it("հանգիստ", "hangist", "calm"),
        it("զարմացած", "zarmatsats", "surprised")
      ]),
      chapter("9-7", "When you don't understand", "The sentences that keep a conversation going.", [
        it("Չեմ հասկանում", "Chem haskanum", "I do not understand"),
        it("Կրկնեք, խնդրեմ", "Krknek, khndrem", "Please say it again"),
        it("Դանդաղ խոսեք", "Dandagh khosek", "Speak slowly"),
        it("Ի՞նչ է նշանակում", "Inch e nshanakum", "What does it mean?"),
        it("Ինչպե՞ս են ասում", "Inchpes yen asum", "How do you say it?")
      ]),
      chapter("9-8", "The weekend", "Saturday, Sunday, and days away from work.", [
        it("շաբաթ", "shabat", "Saturday"), it("կիրակի", "kiraki", "Sunday"),
        it("հանգստյան օր", "hangstyan or", "day off"), it("տոն", "ton", "holiday"),
        it("արձակուրդ", "ardzakurd", "vacation")
      ]),
    ] },
  { n: 10, name: "Around the house", blurb: "The words and phrases you use at home, with the people you live with.",
    topics: ["Rooms", "In the kitchen", "Cooking and cleaning together"], chapters: [
      chapter("10-1", "Rooms", "Naming the parts of a home.", [
        it("խոհանոց", "khohanots", "kitchen"), it("ննջասենյակ", "nnjasenyak", "bedroom"),
        it("լոգարան", "logaran", "bathroom"), it("հյուրասենյակ", "hyurasenyak", "living room"),
        it("սենյակ", "senyak", "room")
      ]),
      chapter("10-2", "In the kitchen", "What you cook and eat with.", [
        it("սեղան", "seghan", "table"), it("դանակ", "danak", "knife"), it("պատառաքաղ", "pataṙakagh", "fork"),
        it("գդալ", "gdal", "spoon"), it("ափսե", "apse", "plate")
      ]),
      chapter("10-3", "Around the rooms", "The objects you reach for without thinking.", [
        it("անկողին", "ankoghin", "bed"), it("բարձ", "bardz", "pillow"), it("սրբիչ", "srbich", "towel"),
        it("հայելի", "hayeli", "mirror"), it("բանալի", "banali", "key")
      ]),
      chapter("10-4", "Things said at home", "Short sentences you will hear every day.", [
        it("Դուռը փակիր", "Duṙə pakir", "Close the door"), it("Լույսը վառիր", "Luysə vaṙir", "Turn on the light"),
        it("Ճաշը պատրաստ է", "Chashə patrast e", "The meal is ready"), it("Արի ուտենք", "Ari utenk", "Let us eat"),
        it("Գալիս եմ", "Galis yem", "I am coming")
      ]),
      chapter("10-5", "Keeping house", "Chores, and the verbs that go with them.", [
        it("լվանալ", "lvanal", "to wash"), it("մաքրել", "makrel", "to clean"), it("եփել", "yepel", "to cook"),
        it("ավլել", "avlel", "to sweep"), it("աման լվանալ", "aman lvanal", "to wash dishes")
      ]),
      chapter("10-6", "Cooking together", "Making a meal side by side.", [
        it("Արի միասին ճաշ եփենք", "Ari miasin chash yepenk", "Let us cook together"),
        it("Օգնիր ինձ", "Ognir indz", "Help me"), it("Սոխը կտրատիր", "Sokhə ktratir", "Chop the onion"),
        it("Աղ ավելացրու", "Agh avelatsru", "Add salt"), it("Շատ համեղ է", "Shat hamegh e", "It is very tasty")
      ]),
      chapter("10-7", "Cleaning together", "Sharing the chores so they go faster.", [
        it("Արի միասին մաքրենք", "Ari miasin makrenk", "Let us clean together"),
        it("Դու ամանները լվա", "Du amannerə lva", "You wash the dishes"),
        it("Աղբը դուրս տար", "Aghbə durs tar", "Take out the trash"),
        it("Անկողինը հավաքիր", "Ankoghinə havakir", "Make the bed"),
        it("Պատուհանը բացիր", "Patuhanə batsir", "Open the window")
      ]),
      chapter("10-8", "In the yard", "Outside the front door.", [
        it("բակ", "bak", "yard"), it("ցանկապատ", "tsankapat", "fence"), it("խոտ", "khot", "grass"),
        it("դարպաս", "darpas", "gate"), it("նստարան", "nstaran", "bench")
      ]),
    ] },
  { n: 11, name: "Shopping, money and clothes", blurb: "Buying what you need, paying for it, and the clothes you wear.",
    topics: ["Shops", "Money and paying", "Clothes"], chapters: [
      chapter("11-1", "Shops and the market", "Where you go for bread, medicine and everything else.", [
        it("հացատուն", "hatsatun", "bakery"), it("դեղատուն", "deghatun", "pharmacy"),
        it("սուպերմարկետ", "supermarket", "supermarket"), it("վաճառող", "vachaṙogh", "seller"),
        it("գնել", "gnel", "to buy")
      ]),
      chapter("11-2", "Money and paying", "Armenia pays in dram.", [
        it("դրամ", "dram", "dram"), it("վճարել", "vcharel", "to pay"), it("կանխիկ", "kankhik", "cash"),
        it("քարտ", "kart", "card"), it("զեղչ", "zeghch", "discount")
      ]),
      chapter("11-3", "Asking in a shop", "Sentences for trying, choosing and paying.", [
        it("Կարո՞ղ եմ փորձել", "Karogh yem portsel", "Can I try it on?"),
        it("Ուրիշ գույն ունե՞ք", "Urish guyn unek", "Do you have another colour?"),
        it("Ես սա վերցնում եմ", "Yes sa vertsnum yem", "I will take this"),
        it("Պարզապես նայում եմ", "Parzapes nayum yem", "I am just looking"),
        it("Ավելի էժան ունե՞ք", "Aveli ezhan unek", "Do you have a cheaper one?")
      ]),
      chapter("11-4", "Everyday clothes", "What you put on most mornings.", [
        it("տաբատ", "tabat", "trousers"), it("շրջազգեստ", "shrjazgest", "skirt"), it("զգեստ", "zgest", "dress"),
        it("ջինս", "jins", "jeans"), it("գուլպա", "gulpa", "sock")
      ]),
      chapter("11-5", "Coats, shoes and warm things", "For rain, snow and Yerevan winters.", [
        it("վերարկու", "verarku", "coat"), it("գլխարկ", "glkhark", "hat"), it("ձեռնոց", "dzeṙnots", "glove"),
        it("շարֆ", "sharf", "scarf"), it("հովանոց", "hovanots", "umbrella")
      ]),
      chapter("11-6", "Size and fit", "Too tight, too loose, or just right.", [
        it("չափս", "chaps", "size"), it("նեղ", "negh", "tight"), it("լայն", "layn", "loose, wide"),
        it("հագնել", "hagnel", "to put on"), it("հանել", "hanel", "to take off")
      ]),
      chapter("11-7", "Materials and patterns", "What it is made of, and what is printed on it.", [
        it("բամբակ", "bambak", "cotton"), it("բուրդ", "burd", "wool"), it("մետաքս", "metaks", "silk"),
        it("գծավոր", "gtsavor", "striped"), it("միագույն", "miaguyn", "plain, one colour")
      ]),
      chapter("11-8", "Bags and accessories", "The small things you carry and wear.", [
        it("պայուսակ", "payusak", "handbag"), it("ուսապարկ", "usapark", "backpack"),
        it("ժամացույց", "zhamatsuyts", "watch"), it("ակնոց", "aknots", "glasses"), it("մատանի", "matani", "ring")
      ]),
    ] },
  { n: 12, name: "School, work and free time", blurb: "Your day from the alarm to bedtime, at school, at work and after.",
    topics: ["My day", "School", "Work and free time"], chapters: [
      chapter("12-1", "My day", "From waking up to going to sleep.", [
        it("արթնանալ", "artnanal", "to wake up"), it("հագնվել", "hagnvel", "to get dressed"),
        it("նախաճաշել", "nakhachashel", "to have breakfast"), it("ընթրել", "əntrel", "to have dinner"),
        it("քնել", "knel", "to sleep")
      ]),
      chapter("12-2", "In the classroom", "Everything on and around your desk.", [
        it("դասարան", "dasaran", "classroom"), it("գրատախտակ", "gratakhtak", "board"),
        it("տետր", "tetr", "notebook"), it("գրիչ", "grich", "pen"), it("դասագիրք", "dasagirk", "textbook")
      ]),
      chapter("12-3", "School subjects and people", "Who you meet at school, and what you study.", [
        it("ուսանող", "usanogh", "university student"), it("դասընկեր", "dasənker", "classmate"),
        it("դաս", "das", "lesson, class"), it("մաթեմատիկա", "matematika", "maths"),
        it("կենսաբանություն", "kensabanutyun", "biology")
      ]),
      chapter("12-4", "Studying and learning", "Homework, tests and how you learn.", [
        it("տնային աշխատանք", "tnayin ashkhatank", "homework"), it("քննություն", "knnutyun", "exam"),
        it("հարց", "harts", "question"), it("պատասխան", "pataskhan", "answer"), it("սխալ", "skhal", "mistake")
      ]),
      chapter("12-5", "Jobs", "What people do for a living.", [
        it("բուժքույր", "buzhkuyr", "nurse"), it("վարորդ", "varord", "driver"), it("խոհարար", "khoharar", "cook"),
        it("ոստիկան", "vostikan", "police officer"), it("ինժեներ", "inzhener", "engineer")
      ]),
      chapter("12-6", "At work", "The office and the people in it.", [
        it("գրասենյակ", "grasenyak", "office"), it("գործարան", "gortsaran", "factory"), it("պետ", "pet", "boss"),
        it("գործընկեր", "gortsnker", "colleague"), it("աշխատավարձ", "ashkhatavardz", "salary")
      ]),
      chapter("12-7", "Free time and sports", "What you do when nobody is asking you to.", [
        it("նկարել", "nkarel", "to draw, to paint"), it("պարել", "parel", "to dance"),
        it("ֆուտբոլ", "futbol", "football"), it("շախմատ", "shakhmat", "chess"), it("թանգարան", "tangaran", "museum")
      ]),
      chapter("12-8", "Making plans", "Inviting someone and settling when and where.", [
        it("Վաղը ազա՞տ ես", "Vaghə azat yes", "Are you free tomorrow?"),
        it("Զբաղված եմ", "Zbaghvats yem", "I am busy"), it("Ո՞ր ժամին", "Vor zhamin", "At what time?"),
        it("Որտե՞ղ հանդիպենք", "Vortegh handipenk", "Where shall we meet?"),
        it("Հետո կխոսենք", "Heto kkhosenk", "We will talk later")
      ]),
    ] },
  /* A1 to C2: the CEFR course. Every unit has 8 chapters. A chapter has 6 lessons: lessons 1 to 4 each
     teach 5 new words (none repeated from A0), lessons 5 and 6 practise them in sentences. */
  { n: 13, domain: "A1", short: 1, tag: "A1 · Unit 1", name: "Greetings, pronouns and glue words", blurb: "The small words that hold every sentence together: who, whose, and, but, because.",
    topics: ["Who is who", "Questions", "Joining words"], chapters: [
      chapterOf("A1.1.1", "Who is who", "The rest of the personal pronouns, the forms built from them, and whose things are whose.", [
        lesson("A1.1.1-1", "You, we and they", "The rest of the personal pronouns.", [
          it("դու", "du", "you"), it("մենք", "menk", "we"), it("դուք", "duk", "you (plural, polite)"),
          it("նրանք", "nrank", "they"), it("մեզ", "mez", "to us")
        ]),
        lesson("A1.1.1-2", "Myself and themselves", "Forms for to you, from him, and myself.", [
          it("ձեզ", "dzez", "to you (plural)"), it("ինքս", "inks", "I myself"),
          it("ինքը", "inkə", "he himself, she herself"), it("իրենք", "irenk", "they themselves"),
          it("նրանից", "nranits", "from him, from her")
        ]),
        lesson("A1.1.1-3", "Mine and yours", "Add -ը to my, your and our to say mine, yours and ours.", [
          it("իմը", "imə", "mine"), it("քոնը", "konə", "yours"), it("նրանը", "nranə", "his, hers"),
          it("մերը", "merə", "ours"), it("ձերը", "dzerə", "yours (plural)")
        ]),
        lesson("A1.1.1-4", "Theirs and with me", "The last of the owning words, and հետ for with.", [
          it("նրանցը", "nrantsə", "theirs"), it("իրենց", "irents", "their own"),
          it("ինձ հետ", "indz het", "with me"), it("քեզ հետ", "kez het", "with you"),
          it("մեզ հետ", "mez het", "with us")
        ]),
        sentences("A1.1.1-5", "Sentences: who is who", "Put the new words to work in whole sentences.", [
          it("Մենք ընկերներ ենք", "Menk ənkerner yenk", "We are friends"),
          it("Նրանք մեզ հետ են", "Nrank mez het yen", "They are with us"),
          it("Արի մեզ հետ", "Ari mez het", "Come with us"),
          it("Ես ինքս կանեմ", "Yes inks kanem", "I will do it myself"),
          it("Նա ինքը եկավ", "Na inkə yekav", "She came herself")
        ]),
        sentences("A1.1.1-6", "Sentences: whose is it", "Mine, yours, ours and theirs in whole sentences. Before է, իմը becomes իմն.", [
          it("Սա իմն է", "Sa imn e", "This is mine"),
          it("Այս գիրքը քոնն է", "Ays girkə konn e", "This book is yours"),
          it("Մերը մեծ է", "Merə mets e", "Ours is big"),
          it("Իրենց տունը նոր է", "Irents tunə nor e", "Their house is new"),
          it("Ինձ հետ արի", "Indz het ari", "Come with me")
        ]),
      ]),
    ] },
];
// Units without a domain (1 to 12) make up domain A0. Fill in the labels the unit bar shows for them.
UNITS.forEach((u) => { u.domain = u.domain || "A0"; u.short = u.short || u.n; u.tag = u.tag || `Unit ${u.n}`; });
// An A0 chapter is its own single lesson.
UNITS.forEach((u) => u.chapters.forEach((c) => { if (!c.lessons) c.lessons = [c]; }));

// The domains (CEFR levels) in the unit bar's dropdown. A domain with no units yet shows as coming soon.
const DOMAINS = [
  { id: "A0", name: "Foundations" }, { id: "A1", name: "Beginner" }, { id: "A2", name: "Elementary" },
  { id: "B1", name: "Intermediate" }, { id: "B2", name: "Upper intermediate" }, { id: "C1", name: "Advanced" },
  { id: "C2", name: "Mastery" },
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
    "սար|mountain", "սեր|love", "ոսկի|gold", "կոշիկ|shoe", "ճաշ|meal", "ապուր|soup", "շուկա|market",
    "սուրճ|coffee", "հաց|bread", "խոտ|grass", "կատու|cat", "կով|cow", "պատ|wall", "երեխա|child", "ջուր|water",
    "աչք|eye", "միս|meat", "ամիս|month", "ոտք|foot", "ամպ|cloud", "քամի|wind", "մուկ|mouse", "ոչխար|sheep",
    "մատիտ|pencil", "տուն|house", "հայր|father", "մայր|mother", "անուն|name", "գետ|river", "կին|woman",
    "շուն|dog", "գիրք|book", "քույր|sister", "ընկեր|friend", "պանիր|cheese", "ականջ|ear", "գույն|colour",
    "ծով|sea", "ծառ|tree", "կաթ|milk", "թեյ|tea", "քիթ|nose", "լիճ|lake", "լույս|light", "գլուխ|head",
    "բերան|mouth", "օր|day", "մարդ|person", "տղա|boy", "ձի|horse", "ձու|egg", "ձուկ|fish", "ձեռք|hand",
    "սեղան|table", "ծաղիկ|flower", "խնձոր|apple", "քաղաք|city", "աստղ|star", "արև|sun", "անձրև|rain",
    "հարևան|neighbour", "Երևան|Yerevan", "արևելք|east", "արևմուտք|west", "ընկույզ|walnut", "ընտանիք|family",
    "ընթրիք|dinner", "ընկերուհի|girlfriend", "փետուր|feather", "ճամփա|road", "ուսուցիչ|teacher",
    "աշակերտ|pupil", "համալսարան|university", "գրադարան|library", "հյուրանոց|hotel", "վերելակ|lift",
    "սառնարան|fridge", "բանջարեղեն|vegetables", "հեռուստացույց|television", "օդանավակայան|airport",
    "տղամարդ|man", "աղջիկ|girl", "եղբայր|brother", "մեղր|honey", "սարեր|mountains", "ծառեր|trees",
    "կատուներ|cats", "երեխաներ|children", "ընկերներ|friends", "գիրքը|the book", "տունը|the house",
    "դուռը|the door", "ջուրը|the water", "կատուն|the cat", "երեխան|the child", "քաղաքը|the city",
    "քաղաքի|of the city", "սարի|of the mountain", "ծառի|of the tree", "տան|of the house",
    "մարդու|of the person", "մորը|to the mother", "հորը|to the father", "երեխային|to the child",
    "տնից|from the house", "քաղաքից|from the city", "Հայաստանից|from Armenia", "գնացքով|by train",
    "մեքենայով|by car", "ոտքով|on foot", "ինքնաթիռով|by plane", "ավտոբուսով|by bus", "գիրքս|my book",
    "գիրքդ|your book", "տունս|my house", "անունս|my name", "անունդ|your name", "երկուշաբթի|Monday",
    "երեքշաբթի|Tuesday", "չորեքշաբթի|Wednesday", "հինգշաբթի|Thursday", "ուրբաթ|Friday", "շաբաթ|Saturday",
    "կիրակի|Sunday", "խոհանոց|kitchen", "ննջասենյակ|bedroom", "լոգարան|bathroom", "հյուրասենյակ|living room",
    "սենյակ|room", "բակ|yard", "դանակ|knife", "պատառաքաղ|fork", "գդալ|spoon", "ափսե|plate", "անկողին|bed",
    "բարձ|pillow", "սրբիչ|towel", "հայելի|mirror", "բանալի|key", "հացատուն|bakery", "դեղատուն|pharmacy",
    "սուպերմարկետ|supermarket", "վաճառող|seller", "դրամ|dram", "զեղչ|discount", "կանխիկ|cash", "քարտ|card",
    "տաբատ|trousers", "շրջազգեստ|skirt", "զգեստ|dress", "ջինս|jeans", "գուլպա|sock", "վերարկու|coat",
    "գլխարկ|hat", "ձեռնոց|glove", "շարֆ|scarf", "հովանոց|umbrella", "չափս|size", "բամբակ|cotton", "բուրդ|wool",
    "մետաքս|silk", "պայուսակ|handbag", "ուսապարկ|backpack", "ժամացույց|watch", "ակնոց|glasses", "մատանի|ring",
    "դասարան|classroom", "գրատախտակ|board", "տետր|notebook", "գրիչ|pen", "դասագիրք|textbook",
    "ուսանող|university student", "դասընկեր|classmate", "դաս|lesson, class", "մաթեմատիկա|maths",
    "կենսաբանություն|biology", "տնային աշխատանք|homework", "քննություն|exam", "հարց|question",
    "պատասխան|answer", "սխալ|mistake", "բուժքույր|nurse", "վարորդ|driver", "խոհարար|cook",
    "ոստիկան|police officer", "ինժեներ|engineer", "գրասենյակ|office", "գործարան|factory", "պետ|boss",
    "գործընկեր|colleague", "աշխատավարձ|salary", "արձակուրդ|vacation", "հանգստյան օր|day off",
    "թանգարան|museum", "ֆուտբոլ|football", "շախմատ|chess", "գնացք|train", "բժիշկ|doctor",
    "վերջակետ|full stop ( ։ )", "ստորակետ|comma ( , )", "բութ|pause mark ( ՝ )", "շեշտ|emphasis mark ( ՛ )",
    "հարցական նշան|question mark ( ՞ )", "թռչուն|bird", "տղան|the boy", "այգին|the garden", "ձուն|the egg",
    "մի գիրք|a book", "մի կատու|a cat", "մի բան|something", "քաղաքում|in the city", "դպրոցում|at school",
    "սենյակում|in the room", "այգում|in the garden", "խանութում|in the shop", "գրքերը|the books",
    "տները|the houses", "ընկերների|of the friends", "երեխաներին|to the children", "քաղաքներից|from the cities",
    "տոն|holiday", "ցանկապատ|fence", "դարպաս|gate", "նստարան|bench"
  ] },
  { id: "pronoun", name: "Pronouns", note: "Words that stand in for a noun: I, this, who, my.", words: [
    "ես|I", "սա|this", "այս|this", "այդ|that", "այն|that over there", "դա|that one", "նա|he, she", "ի՞նչ|what",
    "ո՞վ|who", "իմ|my", "քո|your", "նրա|his, her", "մեր|our", "ձեր|your (plural)", "ինձ|to me", "քեզ|to you",
    "դու|you", "մենք|we", "դուք|you (plural, polite)", "նրանք|they", "մեզ|to us", "ձեզ|to you (plural)",
    "ինքը|he himself, she herself", "ինքս|I myself", "իրենք|they themselves", "նրանից|from him, from her",
    "իմը|mine", "քոնը|yours", "նրանը|his, hers", "մերը|ours", "ձերը|yours (plural)", "նրանցը|theirs",
    "իրենց|their own"
  ] },
  { id: "verb", name: "Verbs", note: "Actions and states, including every form you have learned.", words: [
    "արի|come!", "երևալ|to appear", "ընկնել|to fall", "եմ|I am", "ես|you are", "է|he is, she is, it is",
    "ենք|we are", "են|they are", "չեմ|I am not", "չես|you are not", "չէ|he is not", "չենք|we are not",
    "չեն|they are not", "գրել|to write", "կարդալ|to read", "խոսել|to speak", "ուտել|to eat", "խմել|to drink",
    "գրում եմ|I am writing", "կարդում եմ|I am reading", "խոսում եմ|I am speaking", "ուտում եմ|I am eating",
    "ապրում եմ|I live", "գրում ես|you are writing", "գրում է|he is writing", "գրում ենք|we are writing",
    "գրում եք|you are writing (plural)", "գրում են|they are writing", "չեմ գրում|I am not writing",
    "չի խոսում|he is not speaking", "չենք աշխատում|we are not working", "չգիտեմ|I do not know",
    "չեմ ուզում|I do not want", "չեմ կարող|I cannot", "հասկանալ|to understand", "իմանալ|to know",
    "ուզել|to want", "կարողանալ|to be able", "տալ|to give", "վերցնել|to take", "ասել|to say", "սպասել|to wait",
    "օգնել|to help", "գրեցի|I wrote", "կարդացի|I read", "խոսեցի|I spoke", "աշխատեցի|I worked", "ասացի|I said",
    "գրում էի|I was writing", "կարդում էի|I was reading", "խոսում էր|he was speaking",
    "ապրում էին|they were living", "ուզում էի|I wanted", "կգրեմ|I will write", "կգնամ|I will go",
    "կգամ|I will come", "կանեմ|I will do", "կտեսնեմ|I will see", "եղավ|it happened", "գնաց|he went",
    "եկավ|she came", "տվեց|he gave", "տեսավ|she saw", "Գալիս եմ|I am coming", "լվանալ|to wash",
    "մաքրել|to clean", "եփել|to cook", "ավլել|to sweep", "աման լվանալ|to wash dishes", "գնել|to buy",
    "վճարել|to pay", "հագնել|to put on", "հանել|to take off", "արթնանալ|to wake up", "հագնվել|to get dressed",
    "նախաճաշել|to have breakfast", "ընթրել|to have dinner", "քնել|to sleep", "նկարել|to draw, to paint",
    "պարել|to dance", "մնալ|to stay", "կա|there is", "չկա|there isn't", "ունեմ|I have", "ունես|you have",
    "ունի|he has, she has", "չունեմ|I do not have", "խաղալ|to play", "մոռանալ|to forget",
    "վախենալ|to be afraid", "ուզում եմ|I want", "կարող եմ|I can", "գրել եմ|I have written",
    "կարդացել եմ|I have read", "եղել եմ|I have been", "տեսել եմ|I have seen", "գնացել է|he has gone",
    "գրիր|write!", "կարդա|read!", "նստիր|sit down!", "լսիր|listen!", "նայիր|look!", "պետք է|must, need to",
    "պիտի|have to"
  ] },
  { id: "adjective", name: "Adjectives", note: "Words that describe a noun. Numbers are here too.", words: [
    "երկար|long", "երկու|two", "վեց|six", "վատ|bad", "ուրախ|happy", "տխուր|sad", "տաք|hot", "նոր|new",
    "հին|old", "ինը|nine", "լավ|good", "մեծ|big", "փոքր|small", "սև|black", "անձրևոտ|rainy", "մեկ|one",
    "երեք|three", "չորս|four", "հինգ|five", "յոթ|seven", "ութ|eight", "տասը|ten", "գեղեցիկ|beautiful",
    "սառը|cold", "թանկ|expensive", "էժան|cheap", "հեշտ|easy", "դժվար|difficult", "նեղ|tight",
    "լայն|loose, wide", "գծավոր|striped", "միագույն|plain, one colour", "հոգնած|tired", "մի|a, one",
    "զայրացած|angry", "վախեցած|scared", "հանգիստ|calm", "զարմացած|surprised"
  ] },
  { id: "adverb", name: "Adverbs", note: "When, where, how and how often.", words: [
    "որտե՞ղ|where", "ե՞րբ|when", "ինչու՞|why", "այստեղ|here", "այնտեղ|there", "Իհարկե|Of course",
    "այստեղից|from here", "այնտեղից|from there", "երեկ|yesterday", "այսօր|today", "վաղը|tomorrow", "հիմա|now",
    "հետո|later", "մի քիչ|a little"
  ] },
  { id: "preposition", name: "Prepositions", note: "Where things are. Armenian puts most of these after the noun.", words: [
    "մեջ|in, inside", "ներսում|inside", "դրսում|outside", "վերևում|above", "ներքևում|below", "կողքին|beside",
    "վրա|on", "տակ|under", "ինձ հետ|with me", "քեզ հետ|with you", "մեզ հետ|with us"
  ] },
  { id: "conjunction", name: "Conjunctions", note: "Words that join other words and sentences.", words: [
    "և|and"
  ] },
  { id: "interjection", name: "Interjections", note: "Greetings, thanks and other words said on their own.", words: [
    "ոչ|no", "այո|yes", "բարև|hello", "բարև ձեզ|hello (polite)", "բարի լույս|good morning",
    "բարի գիշեր|good night", "ցտեսություն|goodbye", "շնորհակալություն|thank you",
    "խնդրեմ|please, you are welcome", "ներողություն|sorry", "կներեք|excuse me", "բարի ախորժակ|enjoy your meal"
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
/*  Lessons                                                            */
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

const NEW_PER_LESSON = 5;
const PRACTICE_PER_LESSON = 4;
const REVIEW_PER_LESSON = 3;
const MASTERED = 3;

const wordKey = (x) => `${x.hy}|${x.en}`;
// The words of a lesson, or of a whole chapter (all its lessons).
const wordsOf = (x) => x.words || x.items || (x.lessons ? x.lessons.flatMap(wordsOf) : []);
const chapterDone = (progress, c) => c.lessons.every((l) => progress.lessons[l.id]?.done);
const stageOf = (words, x) => (words && words[wordKey(x)]) || 0;
const isSpellable = (x) => /^[ա-և]+$/.test(x.hy) && splitWord(x.hy).length <= 7;
const fullNote = (x) => `${x.hy} · ${x.rom} · ${x.en}`;

function nextStage(stage, rung, ok) {
  if (!ok) return Math.max(0, stage - 1);
  return rung === stage ? Math.min(MASTERED, stage + 1) : stage;
}

// The plan for one sitting of a lesson: its word cards, then questions (new words, practice, review).
// idx is the chapter's place in the unit; li is the lesson's place in the chapter.
function buildLesson(unitIdx, idx, li, words = {}, doneLessons = {}) {
  const unit = UNITS[unitIdx];
  const chapter = unit.chapters[idx];
  const lesson = chapter.lessons[li];
  const own = wordsOf(lesson);
  const before = [...unit.chapters.slice(0, idx).flatMap(wordsOf), ...chapter.lessons.slice(0, li).flatMap(wordsOf)];

  // Which words this lesson teaches, practises and reviews.
  const fresh = shuffle(own.filter((x) => stageOf(words, x) === 0)).slice(0, NEW_PER_LESSON);
  const practice = shuffle(own.filter((x) => stageOf(words, x) > 0))
    .sort((a, b) => stageOf(words, a) - stageOf(words, b))
    .slice(0, PRACTICE_PER_LESSON + NEW_PER_LESSON - fresh.length);
  const taken = new Set([...fresh, ...practice].map(wordKey));
  const review = pickN(
    before.filter((x) => stageOf(words, x) > 0 && !taken.has(wordKey(x))),
    REVIEW_PER_LESSON,
  );

  // Wrong options come from words the learner has already seen, when there are enough.
  const freshKeys = new Set(fresh.map(wordKey));
  const pool = [...before, ...own];
  const seen = pool.filter((x) => stageOf(words, x) > 0 || freshKeys.has(wordKey(x)));
  const wrongOptions = (x, keyFn) => {
    const clash = (o) => o.en === x.en || o.hy === x.hy;
    const d = distractors(seen.filter((o) => !clash(o)), x, 3, keyFn);
    return d.length === 3 ? d : distractors(pool.filter((o) => !clash(o)), x, 3, keyFn);
  };

  const tiles = [...new Set(
    lesson.letters
      ? LETTER_CHAPTERS.slice(0, idx + 1).flatMap((l) => l.letters).map((x) => x.lo)
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

  // A sentence lesson: each sentence is shown, then asked three ways (meaning, pick the
  // Armenian, build it from word tiles). Wrong options come from the chapter's other sentences.
  if (lesson.sentences) {
    const sents = lesson.sentences;
    const all = chapter.lessons.flatMap((l) => l.sentences || []);
    const others = (s, f) => shuffle(all.filter((o) => f(o) !== f(s))).slice(0, 3);
    const tilesOf = (s) => s.hy.split(" ");
    const meaningQ = (s) => ({
      type: "choice", prompt: "What does this sentence mean?", big: s.hy, sub: s.rom,
      options: shuffle([s, ...others(s, (o) => o.en)]).map((o) => ({ label: o.en, correct: o.en === s.en })),
    });
    const pickQ = (s) => ({
      type: "choice", prompt: `Which sentence means “${s.en}”?`,
      options: shuffle([s, ...others(s, (o) => o.hy)]).map((o) => ({ label: o.hy, armenian: true, correct: o.hy === s.hy })),
      note: s.rom,
    });
    const buildQ = (s) => {
      const target = tilesOf(s);
      const extra = shuffle([...new Set(all.flatMap(tilesOf))].filter((t) => !target.includes(t))).slice(0, 2);
      return { type: "spell", words: true, prompt: `Build the sentence for “${s.en}”`, target, bank: shuffle([...target, ...extra]), note: s.rom };
    };
    return {
      cards: sents.map((s) => ({ kind: "word", sentence: true, ...s })),
      questions: [
        ...shuffle(sents.map(meaningQ)),
        ...shuffle([...sents.map(pickQ), ...sents.map(buildQ), ...review.map((x) => askAt(x, stageOf(words, x)))]),
      ],
      fresh: [], practice: [],
    };
  }

  // Letter questions, for unit 1 (the letters) only.
  let letterQs = [];
  let letterReview = [];
  if (lesson.letters) {
    const bank = LETTER_CHAPTERS.slice(0, idx + 1).flatMap((l) => l.letters);
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
      // Only review letters from chapters the learner has finished; any chapter can be opened first.
      letterReview = pickN(LETTER_CHAPTERS.slice(0, idx).filter((l) => doneLessons[l.id]?.done).flatMap((l) => l.letters), 2)
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
   եվ before chapter 1-8 teaches և; those are the same words, so they share a
   row and count as known if either spelling has been learned. */
const KNOWN = 2;   // answered from the Armenian alone, without the transliteration

const BANK = (() => {
  const first = new Map();
  UNITS.forEach((u) => u.chapters.forEach((c) => c.lessons.forEach((l) => wordsOf(l).forEach((x) => {
    if (!first.has(wordKey(x))) first.set(wordKey(x), { ...x, chapter: l.id });
  }))));
  return PARTS.map((part) => {
    const rows = new Map();
    for (const k of part.words) {
      const x = first.get(k);
      if (!x) continue;
      const hy = x.hy.replace(/եվ/g, "և");
      const id = `${hy}|${x.en}`;
      if (rows.has(id)) rows.get(id).keys.push(k);
      else rows.set(id, { hy, rom: x.rom, en: x.en, chapter: x.chapter, keys: [k] });
    }
    return { ...part, rows: [...rows.values()] };
  });
})();

const rowStage = (words, row) => Math.max(...row.keys.map((k) => (words && words[k]) || 0));
const knownCount = (words) => BANK.reduce((n, p) => n + p.rows.filter((r) => rowStage(words, r) >= KNOWN).length, 0);

/* ------------------------------------------------------------------ */
/*  Progress                                                           */
/* ------------------------------------------------------------------ */

const emptyProgress = () => ({ v: 4, xp: 0, lessons: {}, words: {}, streak: 0, lastDay: null });

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
    // Finished lessons are saved under "lessons", by lesson id. For a short while they were saved
    // under "chapters"; an A0 chapter's single lesson shares its id, so those carry straight over.
    if (stored && stored.chapters && !stored.lessons) { stored.lessons = stored.chapters; delete stored.chapters; }
    if (stored) stored.v = 4;
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
.hy-railnum,.hy-railpre,.hy-short,.hy-railcurrent{display:none}
.hy-domainsep{height:1px;background:${C.line};margin:6px 4px}
.hy-domainbtn{display:flex;align-items:center;gap:8px;flex:0 0 auto;background:transparent;border:1px solid ${C.line};
  border-radius:8px;padding:8px 12px;color:${C.parch};font-family:${UI};cursor:pointer;text-align:left}
.hy-domainbtn:hover,.hy-domainbtn[aria-expanded="true"]{border-color:${C.gold}}
.hy-domainid{font-family:${UI};font-weight:700;font-size:14px;letter-spacing:.04em;color:${C.gold}}
.hy-domainname{font-size:13px;color:${C.muted}}
.hy-domainmenu{position:fixed;z-index:50;width:270px;background:${C.ink2};border:1px solid ${C.line};border-radius:10px;
  padding:6px;box-shadow:0 12px 32px rgba(0,0,0,.45)}
.hy-domainopt{display:flex;justify-content:space-between;align-items:center;gap:12px;width:100%;text-align:left;background:transparent;
  border:none;border-radius:6px;padding:9px 10px;color:${C.parch};font-family:${UI};font-size:14px;cursor:pointer}
.hy-domainopt:hover:not(:disabled),.hy-domainopt[aria-current="true"]{background:${C.ink3}}
.hy-domainopt:disabled{opacity:.45;cursor:default}
.hy-domainbtn:focus-visible,.hy-domainopt:focus-visible{outline:2px solid ${C.apricot};outline-offset:2px}
@media (max-width:879px){
  .hy-root{padding:calc(env(safe-area-inset-top, 0px) + 16px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px);box-sizing:border-box}
  .hy-rail{gap:8px;padding:10px 12px;align-items:center;scrollbar-width:thin;scrollbar-color:${C.line} transparent}
  .hy-rail::-webkit-scrollbar{height:4px}
  .hy-rail::-webkit-scrollbar-track{background:transparent}
  .hy-rail::-webkit-scrollbar-thumb{background:${C.line};border-radius:2px}
  .hy-railcurrent{display:block;flex:0 1 150px;min-width:0;padding:6px 10px;border-radius:8px;background:${C.ink3};border:1px solid ${C.gold}}
  .hy-railgrid{display:grid;grid-template-rows:repeat(3,30px);grid-auto-flow:column;grid-auto-columns:30px;gap:5px;flex:0 0 auto}
  .hy-railgrid .hy-railunit{width:30px;height:30px;min-width:0;padding:0;border-radius:50%;border-color:${C.line};background:transparent;
    display:flex;align-items:center;justify-content:center}
  .hy-railgrid .hy-railunit:hover,.hy-railgrid .hy-railunit[data-on="true"]{border-color:${C.gold}}
  .hy-railgrid .hy-railunit[data-done="true"]{background:${C.gold};border-color:${C.gold}}
  .hy-railgrid .hy-railfull{display:none}
  .hy-railgrid .hy-railnum{display:inline;font-family:${UI};font-size:12px;font-weight:600;color:${C.parch}}
  .hy-railgrid .hy-railunit[data-on="true"] .hy-railnum{color:${C.gold}}
  .hy-railgrid .hy-railunit[data-done="true"] .hy-railnum{color:${C.ink}}
  .hy-railpre{display:inline;color:${C.gold}}
  .hy-railsub{display:none}
  .hy-railcurrent .hy-railsub{display:block}
  .hy-domainbtn{align-self:center;padding:7px 9px}
  .hy-domainname{display:none}
}

@media (min-width:880px){
  .hy-shell{flex-direction:row}
  .hy-rail{flex-direction:column;width:232px;flex:0 0 232px;height:100vh;position:sticky;top:0;
    overflow-y:auto;overflow-x:hidden;border-bottom:none;border-right:1px solid ${C.line};padding:26px 14px}
  .hy-railitem{min-width:0;width:100%}
  .hy-raildiv{height:1px;margin:10px 4px}
  .hy-domainbtn{width:100%;margin-bottom:8px}
  .hy-railgrid{display:flex;flex-direction:column;gap:8px}
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

/* Spoken audio. Clips are made ahead of time by scripts/make-audio.mjs and
   listed in audio/manifest.json; a phrase with no clip simply has no button.
   Nothing plays on its own: audio plays only when a speaker button is tapped. */
let AUDIO = null;
const audioReady = fetch("./audio/manifest.json")
  .then((r) => (r.ok ? r.json() : {}))
  .catch(() => ({}))
  .then((m) => { AUDIO = m || {}; });
let playing = null;

function playHy(hy) {
  const f = AUDIO && AUDIO[hy];
  if (!f) return;
  try {
    if (playing) playing.pause();
    playing = new Audio(`./audio/${f}`);
    playing.play().catch(() => {});
  } catch (e) { /* audio not available in this browser */ }
}

function useHasAudio(hy) {
  const [ready, setReady] = useState(AUDIO !== null);
  useEffect(() => { if (!ready) audioReady.then(() => setReady(true)); }, [ready]);
  return ready && !!AUDIO[hy];
}

function SpeakButton({ hy, size = 44 }) {
  if (!useHasAudio(hy)) return null;
  return (
    <button className="hy-btn" onClick={() => playHy(hy)} aria-label="Hear it spoken" title="Hear it spoken"
      style={{
        width: size, height: size, borderRadius: "50%", display: "inline-flex", alignItems: "center",
        justifyContent: "center", background: C.ink2, border: `1px solid ${C.line}`, cursor: "pointer", padding: 0,
      }}>
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill={C.gold} />
        <path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke={C.gold} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
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
        {EXTRAS.length > 0 && <span aria-hidden="true" style={{ width: 1, height: 26, background: C.line, margin: "0 6px" }} />}
        {EXTRAS.map((L) => tile(L))}
      </div>
      <div style={{ marginTop: 12, fontSize: 14, color: sel ? C.parch : C.muted, fontFamily: UI, minHeight: 22 }}>
        {sel ? (
          <span>
            <span style={{ fontFamily: ARM, color: C.gold }}>{pair(sel)}</span>{"  "}
            <span style={{ fontFamily: ARM }}>{sel.name}</span> · {sel.rom} — {sel.tip}
          </span>
        ) : (
          `${learnedCount} of ${ALPHABET.length} letters lit. Tap a gold one for a reminder.`
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Home                                                               */
/* ------------------------------------------------------------------ */

function ChapterList({ unit, progress, onStart }) {
  const chapters = unit.chapters;
  const firstOpen = chapters.findIndex((c) => !chapterDone(progress, c));
  const [open, setOpen] = useState(firstOpen < 0 ? 0 : firstOpen);   // the chapter showing its lessons
  useEffect(() => { setOpen(firstOpen < 0 ? 0 : firstOpen); }, [unit.n]);

  const preview = (x, done) => (
    <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8, fontFamily: ARM, fontSize: x.letters ? 24 : 19, lineHeight: 1.35, color: done ? C.gold : C.parch }}>
      {x.letters
        ? x.letters.map((y) => <span key={y.u}>{glyph(y)}</span>)
        : x.sentences ? x.sentences.slice(0, 1).map((y) => <span key={y.hy}>{y.hy}</span>)
        : wordsOf(x).slice(0, 5).map((y) => <span key={y.hy}>{y.hy}</span>)}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {chapters.map((ch, i) => {
        const done = chapterDone(progress, ch);
        const lessonsDone = ch.lessons.filter((l) => progress.lessons[l.id]?.done).length;
        const isOpen = open === i;
        const words = wordsOf(ch);
        const letters = ch.letters;
        return (
          <div key={ch.id} style={{
            borderRadius: 12, background: C.ink2,
            border: `1px solid ${isOpen ? C.apricot : done ? "rgba(216,162,43,0.35)" : C.line}`,
          }}>
            <button className="hy-btn" onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen}
              style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", padding: "16px", cursor: "pointer", color: C.parch }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                <span style={{ fontFamily: UI, fontSize: 14, color: C.parch, fontWeight: 600 }}>
                  Chapter {i + 1} · {ch.title}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: UI, fontSize: 12, color: done ? C.gold : C.muted, flex: "0 0 auto" }}>
                  {done ? "Complete" : `${lessonsDone} of ${ch.lessons.length} lesson${ch.lessons.length === 1 ? "" : "s"}`}
                  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" style={{ transform: isOpen ? "rotate(180deg)" : "none" }}>
                    <path d="M2.5 4.5l3.5 3.5 3.5-3.5" fill="none" stroke={C.gold} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
              {!isOpen && preview(ch, done)}
              <div style={{ marginTop: 8, fontFamily: UI, fontSize: 12, color: C.muted }}>
                {(letters ? `${letters.filter((x) => !x.uncounted).length} letter${letters.filter((x) => !x.uncounted).length === 1 ? "" : "s"} · ` : "") +
                  `${words.filter((x) => stageOf(progress.words, x) > 0).length} of ${words.length} words introduced`}
              </div>
            </button>
            {isOpen && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 12px 12px" }}>
                {ch.lessons.map((ls, k) => {
                  const rec = progress.lessons[ls.id];
                  return (
                    <button key={ls.id} className="hy-btn" onClick={() => onStart(i, k)}
                      style={{
                        textAlign: "left", borderRadius: 10, padding: "12px 14px", background: C.ink3, cursor: "pointer", color: C.parch,
                        border: `1px solid ${rec?.done ? "rgba(216,162,43,0.35)" : C.line}`,
                      }}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                        <span style={{ fontFamily: UI, fontSize: 14, fontWeight: 600 }}>Lesson {k + 1} · {ls.title}</span>
                        {rec?.done ? <Stars n={rec.stars} /> : <span style={{ fontFamily: UI, fontSize: 12, color: C.apricot }}>start</span>}
                      </div>
                      {preview(ls, rec?.done)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Home({ progress, onStart, storageWarning, unitN }) {
  const learnedIds = useMemo(() => {
    const s = new Set();
    LETTER_CHAPTERS.forEach((L) => {
      if (progress.lessons[L.id]?.done) L.letters.forEach((x) => s.add(x.u));
    });
    return s;
  }, [progress]);

  const learnedCount = ALPHABET.filter((x) => learnedIds.has(x.u)).length;
  const current = UNITS.find((u) => u.n === unitN);

  return (
    <div className="hy-wrap">
      <header style={{ marginBottom: 30 }}>
        <h1 style={{ fontFamily: ARM, fontSize: 46, color: C.gold, lineHeight: 1.05, margin: 0, fontWeight: 700 }}>
          Հայերեն
        </h1>
        <p style={{ marginTop: 8, fontFamily: UI, color: C.muted, fontSize: 15 }}>Eastern Armenian</p>
      </header>

      {unitN === 1 && (
        <section style={{ marginBottom: 28 }}>
          <AlphabetBoard learnedIds={learnedIds} learnedCount={learnedCount} />
        </section>
      )}

      {unitN === 1 && (
      <section style={{
        marginBottom: 30, display: "flex", gap: 26, borderRadius: 12,
        padding: "12px 16px", background: C.ink2, border: `1px solid ${C.line}`,
      }}>
        {[
          [progress.xp, "experience", C.apricot],
          [progress.streak, "day streak", C.apricot],
          [`${learnedCount}/${ALPHABET.length}`, "letters", C.gold],
        ].map(([v, label, col]) => (
          <div key={label}>
            <div style={{ fontFamily: UI, fontSize: 22, color: col, fontWeight: 700 }}>{v}</div>
            <div style={{ fontFamily: UI, fontSize: 12, color: C.muted }}>{label}</div>
          </div>
        ))}
      </section>
      )}

      <ChapterList unit={current} progress={progress} onStart={onStart} />

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
          {known.length} known · {learning.length} still learning · {unmet} to meet in later units
        </p>

        {known.length + learning.length === 0 ? (
          <p style={{ marginTop: 26, fontFamily: UI, fontSize: 15, color: C.muted, lineHeight: 1.6 }}>
            No {part.name.toLowerCase()} yet. The first ones come in chapter {part.rows[0].chapter}.
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
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1, fontFamily: ARM, fontSize: 26, lineHeight: 1.5, color: C.parch }}>{L.hy}</div>
            <div style={{ flex: "0 0 auto", marginTop: 2 }}><SpeakButton hy={L.hy} size={40} /></div>
          </div>
          <div style={{ marginTop: 8, fontFamily: UI, fontSize: 17, lineHeight: 1.5, color: C.apricot, fontStyle: "italic" }}>{L.tr}</div>
          <div style={{ marginTop: 8, fontFamily: UI, fontSize: 17, lineHeight: 1.5, color: C.parch }}>{L.en}</div>

          {rounds.length > 0 && (
            <div style={{ marginTop: 22, borderTop: `1px solid ${C.line}` }}>
              {rounds.flat().map((x) => (
                <div key={x.id} style={{ display: "flex", alignItems: "baseline", gap: 14, padding: "10px 0", borderBottom: `1px solid ${C.line}` }}>
                  <span style={{ flex: "0 0 38%", minWidth: 0, overflowWrap: "anywhere", fontFamily: ARM, fontSize: 20, color: C.gold }}>{x.hy}</span>
                  <span style={{ flex: "0 0 auto", alignSelf: "center" }}><SpeakButton hy={x.hy} size={30} /></span>
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
    : c.kind === "letter" ? "Next letter" : c.sentence ? "Next sentence" : "Next word";

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
            <div style={{ marginTop: 12 }}><SpeakButton hy={c.name} /></div>
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
                <div style={{ marginTop: 10 }}><SpeakButton hy={c.ex.hy} size={34} /></div>
              </div>
            ) : (
              <p style={{ marginTop: 22, fontFamily: UI, fontSize: 14, color: C.muted, maxWidth: 380, lineHeight: 1.6 }}>
                No example word in this chapter — ֆ is rare enough that none of its words fits here yet.
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
            <div style={{ marginTop: 18 }}><SpeakButton hy={c.hy} /></div>
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

  const answer = q.type === "spell" ? q.target.join(q.words ? " " : "") : q.options.find((o) => o.correct)?.label;

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
            <div style={{ marginTop: 12 }}><SpeakButton hy={q.big} size={38} /></div>
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
              {built.length === 0 && <span style={{ fontFamily: UI, fontSize: 14, color: C.muted }}>{q.words ? "Tap the words below in order" : "Tap letters below in order"}</span>}
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

function Result({ lesson, plan, result, stars, xpGain, onRetry, onHome }) {
  const wrap = { maxWidth: 460, margin: "0 auto", padding: "64px 20px", textAlign: "center", width: "100%", boxSizing: "border-box" };

  if (result.failed) {
    return (
      <div style={wrap}>
        <div style={{ display: "flex", justifyContent: "center" }}><Hearts n={0} /></div>
        <h2 style={{ marginTop: 18, fontFamily: UI, fontSize: 22, color: C.parch, fontWeight: 700 }}>Out of hearts</h2>
        <p style={{ marginTop: 8, fontFamily: UI, fontSize: 15, color: C.muted, lineHeight: 1.6 }}>
          The lesson “{lesson.title}” stays where it is. Try again: the cards come first, then the questions.
        </p>
        <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12 }}>
          <Button full onClick={onRetry}>Try this lesson again</Button>
          <Button full tone="quiet" onClick={onHome}>Back to the unit</Button>
        </div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "center" }}><Stars n={stars} size={38} /></div>
      <h2 style={{ marginTop: 24, fontFamily: UI, fontSize: 22, color: C.parch, fontWeight: 700 }}>
        “{lesson.title}” complete
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
      {plan.fresh.length > 0 && (
        <>
          <div style={{ marginTop: 28, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 14px", fontFamily: ARM, fontSize: 22, color: C.parch }}>
            {plan.fresh.map((x) => <span key={x.hy}>{x.hy}</span>)}
          </div>
          <p style={{ marginTop: 10, fontFamily: UI, fontSize: 13, color: C.muted }}>
            {plan.fresh.length} new {plan.fresh.length === 1 ? "word" : "words"} this time
          </p>
        </>
      )}
      <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 12 }}>
        <Button full onClick={onHome}>Back to the unit</Button>
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
  const [page, setPage] = useState(1);                 // the open unit's number, or "pos" (Grammar) or "stories"
  const [domain, setDomain] = useState("A0");
  const [domainMenu, setDomainMenu] = useState(null);   // where the open dropdown sits, or null when closed
  const domainBtn = React.useRef(null);

  // Keep the dropdown on the domain of whatever unit is open.
  useEffect(() => {
    const u = UNITS.find((x) => x.n === page);
    if (u) setDomain(u.domain);
  }, [page]);

  // Close the dropdown on a click elsewhere or on Escape.
  useEffect(() => {
    if (!domainMenu) return;
    const close = (e) => {
      if (e.type === "keydown" ? e.key === "Escape" : !e.target.closest(".hy-domainmenu, .hy-domainbtn")) setDomainMenu(null);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [domainMenu]);

  const toggleDomainMenu = () => {
    if (domainMenu) return setDomainMenu(null);
    const r = domainBtn.current.getBoundingClientRect();
    setDomainMenu({ top: r.bottom + 6, left: Math.max(8, Math.min(r.left, window.innerWidth - 278)) });
  };

  const chooseDomain = (d) => {
    setDomainMenu(null);
    setDomain(d);
    const first = UNITS.find((u) => u.domain === d);
    if (first) setPage(first.n);
  };

  useEffect(() => {
    const id = "hy-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Noto+Serif+Armenian:wght@400;600;700&family=Archivo:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);

  // unitN: the unit's number. idx: which chapter in it. li: which lesson in that chapter.
  const startLesson = (unitN, idx, li) => {
    const plan = buildLesson(unitN - 1, idx, li, progress.words, progress.lessons);
    setView({ name: plan.cards.length ? "study" : "quiz", unitN, idx, li, plan });
  };

  const finish = async (unitN, idx, li, result) => {
    const lesson = UNITS[unitN - 1].chapters[idx].lessons[li];
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
    setView({ name: "result", unitN, idx, li, plan: view.plan, result, stars, xpGain });
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
    body = <Study lesson={UNITS[view.unitN - 1].chapters[view.idx].lessons[view.li]} cards={view.plan.cards} onQuit={() => setView({ name: "home" })} onDone={() => setView({ ...view, name: "quiz" })} />;
  } else if (view.name === "quiz") {
    body = <Quiz questions={view.plan.questions} onQuit={() => setView({ name: "home" })} onFinish={(r) => finish(view.unitN, view.idx, view.li, r)} />;
  } else if (view.name === "result") {
    body = <Result lesson={UNITS[view.unitN - 1].chapters[view.idx].lessons[view.li]} plan={view.plan} result={view.result} stars={view.stars} xpGain={view.xpGain}
      onRetry={() => startLesson(view.unitN, view.idx, view.li)} onHome={() => setView({ name: "home" })} />;
  } else {
    body = page === "stories" ? <StoryReader progress={progress} save={save} /> : page === "pos" ? <WordBank words={progress.words} /> : <Home progress={progress} onStart={(idx, li) => startLesson(page, idx, li)} storageWarning={status === "memory"} unitN={page} />;
  }

  return (
    <div className="hy-root">
      <style>{CSS}</style>
      <div className="hy-shell">
        {!inLesson && (
          <nav className="hy-rail" aria-label="Units">
            <button ref={domainBtn} className="hy-domainbtn" onClick={toggleDomainMenu}
              aria-haspopup="menu" aria-expanded={!!domainMenu} aria-label={`Domain ${domain}, choose another`}>
              <span className="hy-domainid">{page === "pos" ? "Grammar" : page === "stories" ? "Stories" : domain}</span>
              {typeof page === "number" && <span className="hy-domainname">{DOMAINS.find((d) => d.id === domain).name}</span>}
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" style={{ marginLeft: "auto", transform: domainMenu ? "rotate(180deg)" : "none" }}>
                <path d="M2.5 4.5l3.5 3.5 3.5-3.5" fill="none" stroke={C.gold} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {(() => {
              // On phones: a card for the open unit, beside the numbered circles.
              const cur = UNITS.find((u) => u.n === page && u.domain === domain);
              if (!cur) return null;
              const done = cur.chapters.filter((c) => chapterDone(progress, c)).length;
              return (
                <div className="hy-railcurrent" aria-hidden="true">
                  <div style={{ fontFamily: UI, fontSize: 14, fontWeight: 500, lineHeight: 1.3, color: C.parch }}>
                    <span className="hy-railpre">{cur.short} · </span>{cur.name}
                  </div>
                  <div className="hy-railsub" style={{ fontFamily: UI, fontSize: 11, color: C.muted, marginTop: 2 }}>
                    {done} of {cur.chapters.length} done
                  </div>
                </div>
              );
            })()}
            <div className="hy-railgrid">
            {UNITS.filter((U) => U.domain === domain).map((U) => {
              const doneCount = U.chapters.filter((c) => chapterDone(progress, c)).length;
              const complete = U.chapters.length > 0 && doneCount === U.chapters.length;
              return (
                <React.Fragment key={U.n}>
                <button className="hy-railitem hy-railunit" data-on={page === U.n} data-done={complete} onClick={() => setPage(U.n)}
                  aria-label={`${U.tag}, ${U.name}${complete ? ", complete" : ""}`}>
                  <span className="hy-railnum" aria-hidden="true">{U.short}</span>
                  <div className="hy-railfull">
                  <div className="hy-railtop" style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: UI, fontSize: 11, fontWeight: 600, color: page === U.n || complete ? C.gold : C.muted }}>
                    {U.tag}
                    {complete && (
                      <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
                        <circle cx="8" cy="8" r="8" fill={C.gold} />
                        <path d="M4.5 8.3l2.3 2.3 4.7-4.9" fill="none" stroke={C.ink} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div style={{ fontFamily: UI, fontSize: 14, fontWeight: 500, lineHeight: 1.3, color: C.parch }}>
                    <span className="hy-railpre">{U.short} · </span>{U.name}
                  </div>
                  <div className="hy-railsub" style={{ fontFamily: UI, fontSize: 11, color: complete ? C.gold : C.muted, marginTop: 2 }}>
                    {complete ? "Complete" : `${doneCount} of ${U.chapters.length} done`}
                  </div>
                  </div>
                </button>
                </React.Fragment>
              );
            })}
            </div>
          </nav>
        )}
        {domainMenu && !inLesson && (
          <div className="hy-domainmenu" role="menu" aria-label="Domains" style={{ top: domainMenu.top, left: domainMenu.left }}>
            {DOMAINS.map((d) => {
              const units = UNITS.filter((u) => u.domain === d.id).length;
              return (
                <button key={d.id} role="menuitem" className="hy-domainopt" disabled={!units}
                  aria-current={d.id === domain} onClick={() => chooseDomain(d.id)}>
                  <span><span className="hy-domainid">{d.id}</span> <span style={{ marginLeft: 6 }}>{d.name}</span></span>
                  <span style={{ fontSize: 12, color: C.muted }}>
                    {!units ? "coming soon" : `${units} unit${units === 1 ? "" : "s"}`}
                  </span>
                </button>
              );
            })}
            <div className="hy-domainsep" aria-hidden="true" />
            <button role="menuitem" className="hy-domainopt" aria-current={page === "pos"}
              onClick={() => { setDomainMenu(null); setPage("pos"); }}>
              <span>Grammar</span>
              <span style={{ fontSize: 12, color: C.muted }}>{knownCount(progress.words)} words known</span>
            </button>
            <button role="menuitem" className="hy-domainopt" aria-current={page === "stories"}
              onClick={() => { setDomainMenu(null); setPage("stories"); }}>
              <span>Stories</span>
              <span style={{ fontSize: 12, color: C.muted }}>{storiesRead(progress)} of {STORIES.length} read</span>
            </button>
          </div>
        )}
        <main className="hy-main">{body}</main>
      </div>
    </div>
  );
}
