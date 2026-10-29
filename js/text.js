'use strict';
/*
 * Усі тексти гри трьома мовами: uk, en, ru.
 * Форма звертання {чоловіча|жіноча|небінарна} підставляється за вибором гравця на початку
 * (небінарна — через множину: «ти прийшли», «ты пришли»). Англійською форми не потрібні.
 * Рядок-рядок — це оповідь («* ...»), {w, t} — репліка персонажа.
 * w: 'psyche' — Психе́я, 'author' — автор, 'memory' — спогад.
 */
(function (Y) {
  const P = t => ({ w: 'psyche', t });
  const A = t => ({ w: 'author', t });
  const M = t => ({ w: 'memory', t });
  const FORMS = { m: 0, f: 1, n: 2 };

  // the poem is shown in the original in every language
  const POEM = [
    ['Гетьте, думи, ви хмари осінні!', 'Тож тепера весна золота!', 'Чи то так у жалю, в голосінні', 'Проминуть молодії літа?'],
    ['Я на вбогім сумнім перелозі', 'Буду сіять барвисті квітки,', 'Буду сіять квітки на морозі,', 'Буду лить на них сльози гіркі.'],
    ['В довгу, темную нічку невидну', 'Не стулю ні на хвильку очей,', 'Все шукатиму зірку провідну,', 'Ясну владарку темних ночей.'],
    ['Так! я буду крізь сльози сміятись,', 'Серед лиха співати пісні,', 'Без надії таки сподіватись,', 'Буду жити! Геть, думи сумні!']
  ];
  const MUSIC = [
    'AJ DiSpirito — «Eternal Dream» (feat. Elsie Lovelock)',
    'AJ DiSpirito — «The Magic School Bus» (Murder Drones OST)',
    'AJ DiSpirito — «The HuMaN Gala» (Murder Drones OST)'
  ];
  const DOOR_IDS = ['party', 'travel', 'career', 'victory', 'concert', 'sea', 'wedding', 'city', 'peak', 'photo', 'start'];
  const doors = list => list.map(([title, prop], i) => ({ id: DOOR_IDS[i], title, prop }));
  const ICONS = ['cup', 'talk', 'clock', 'mail', 'mark'];
  const memories = list => list.map(([item, lines], i) => ({ icon: ICONS[i], item, lines }));

  const TEXTS = {};

  /* ===================================================================== */
  /*                               УКРАЇНСЬКА                              */
  /* ===================================================================== */
  TEXTS.uk = {
    names: { psyche: 'Психе́я', author: 'автор', memory: 'спогад' },
    titles: {
      hall: ['', 'Зоряна зала'], corridor: ['I', 'Коридор думок'], room: ['II', 'Тиха кімната'],
      garden: ['III', 'Сад дрібниць'], bridge: ['IV', 'Міст у тумані'], valley: ['V', 'Долина пісочного годинника'],
      workshop: ['VI', 'Майстерня луни'], gallery: ['VII', 'Галерея чужих масок'], station: ['VIII', 'Вокзал тисячі дверей'],
      forest: null, stars: ['IX', 'Найближчі зорі'], hall2: ['', 'Зоряна зала']
    },

    hallMeet: [
      '* Посеред зали хтось стоїть. Від неї йде тихе світло — як від свічки, яку хтось лишив на підвіконні.',
      P('О. Ти тут.'),
      P('Не бійся. Я не чужа. Я — та частина тебе, яку ти давно не {чув|чула|чули}.'),
      P('Та, що досі вірить у добро. Навіть тоді, коли ти вже {втомився|втомилася|втомилися} вірити.'),
      P('Мене називали по-різному. Душею. Совістю. Тихим голосом усередині.\nМоє ім\'я — Психе́я.'),
      P('Тут темно, правда? Подивись угору.'),
      P('Зорі світять не тому, що навколо світло.\nВони світять, бо навколо ніч.'),
      P('Я знаю, що ти {приніс|принесла|принесли} із собою. Думки, що приходять одна за одною, наче хвилі, — і не дають вдихнути між ними.'),
      P('Те, що ти {втратив|втратила|втратили}. Те, що не {встиг|встигла|встигли} сказати. Те, що болить, коли ніхто не бачить.'),
      P('Ти несеш це так довго, що вже {забув|забула|забули}, як це — іти легко.'),
      P('Я не скажу тобі, що все гаразд. Ти б мені не {повірив|повірила|повірили}.'),
      P('І не даватиму порад. Їх тобі й так давали забагато.'),
      P('Я просто покажу тобі кілька кімнат. У кожній живе щось знайоме.'),
      P('Там не треба перемагати. Не треба бути {сильним|сильною|сильними}.\nТреба лише трохи уважніше прислухатися до себе.'),
      P('Колись давно написали, що Той, хто лічить зорі й кожну кличе на ім\'я, — лікує розбитих серцем.'),
      P('Тебе теж кличуть на ім\'я. Навіть тут. Навіть зараз.'),
      P('Тобі не треба бачити весь шлях. Іди туди, де світло.'),
      P('Я буду поруч. Навіть коли ти мене не бачитимеш.'),
      '* У кінці зали тихо відчиняється арка.'
    ],

    thoughts: [
      'А що як…', 'Ти {забув|забула|забули}…', 'Треба було інакше…', 'А якщо вони праві?',
      'Ти знову все зіпсуєш', 'Чому ти тоді {промовчав|промовчала|промовчали}?', 'Запізно', 'Подумай ще раз',
      'Вони все помітили', 'А раптом не вийде?', 'Ти {мав|мала|мали} б уже…', 'Це через тебе',
      'Згадай, як тоді…', 'Що вони подумають?', 'Ти не встигнеш', 'А як же завтра?',
      'Знову те саме', 'Не той вибір', 'Ти {міг|могла|могли} б краще', 'Перевір ще раз',
      'Нічого не зміниться', 'А що, як ніколи?', 'Ти не {такий|така|такі}, як треба', 'А якщо це назавжди?',
      'Ти ж {обіцяв|обіцяла|обіцяли}…', 'Усі вже давно…', 'Треба було сказати', 'Ти {сам винен|сама винна|самі винні}'
    ],
    corridor: {
      hint: 'утримуй E — ігнорувати', hintTouch: 'утримуй кнопку — ігнорувати', ignore: 'ігнорувати',
      closed: 'двері відчиняться, коли розвієш усі думки · утримуй E',
      closedTouch: 'двері відчиняться, коли розвієш усі думки · утримуй кнопку',
      left: 'думок залишилось: ', free: 'думки розвіялися'
    },

    room: {
      cup: ['* На холодній порцеляні проступають теплі відбитки долонь. Чужих. Багатьох.', '* Хтось грів тут руки. Так само, як ти зараз.'],
      book: ['* Сторінки списані різними почерками.', '* На полях — тихі позначки: «я теж», «і мені так було», «дякую, що тут можна мовчати».'],
      glass: ['* На склі проступають сліди долонь. Десятки.', '* Хтось стояв тут і дивився на той самий дощ.'],
      rest: ['* Мені варто відпочити.'],
      reflection: ['* У темному склі — ти. Тепле, спокійне відображення дивиться у відповідь.'],
      chair: 'сісти', stand: 'встати', touch: 'торкнутися'
    },

    memories: memories([
      ['уламок чашки', [
        M('Ранок. Чашка вислизає з рук.'),
        M('Дзвін — і уламки по всій підлозі. Здається, розбилося щось набагато більше. День. Тиждень. Ти.'),
        M('…Ти збираєш уламки. Ставиш чайник. Береш іншу чашку.'),
        M('Чай такий самий теплий.'),
        '* Моноліт осідає. У долоні — маленький уламок чашки.']],
      ['зім\'ятий папірець', [
        M('Розмова. Ти кажеш щось невлад — і одразу хочеш забрати слова назад.'),
        M('Уночі ти прокручуєш цю фразу знову і знову. Сотню разів. Тисячу.'),
        M('А людина навпроти навіть не запам\'ятала. Усміхнулася, кивнула — і пішла собі далі.'),
        '* Моноліт осідає. У долоні — зім\'ятий папірець. Просто кілька слів.']],
      ['скріпка', [
        M('Ти забігаєш {задиханий|задихана|задихані}. Усі обертаються.'),
        M('Так здавалося. Насправді обернулися двоє — і за мить забули.'),
        M('П\'ять хвилин. Це менше, ніж ти потім картаєш себе за них.'),
        '* Моноліт осідає. У долоні — звичайна скріпка.']],
      ['конверт', [
        M('Повідомлення висить уже третій день. Чим довше чекаєш — тим страшніше відкрити.'),
        M('У голові — сотні варіантів. Образа. Претензія. Кінець.'),
        M('Ти відкриваєш.\n«Привіт! Як ти? Нічого термінового, просто згадалося про тебе :)»'),
        '* Моноліт осідає. У долоні — легенький паперовий конверт.']],
      ['камінчик', [
        M('Помилка в листі. Одна літера не та.'),
        M('Здається, її бачать усі. Що тепер усі знають: помилка — це ти.'),
        M('Її помітили лише за тиждень. Виправили за хвилину. Ніхто й не згадав.'),
        '* Моноліт осідає. У долоні — гладенький камінчик.']]
    ]),
    gardenSky: ['* Над головою розходиться темрява. Там — чисте зоряне небо.'],
    listen: 'вислухати',

    bridge: {
      down: 'E — опустити ліхтар', up: 'E — підняти ліхтар', downTouch: 'опустити ліхтар', upTouch: 'підняти ліхтар',
      edge: ['* Попереду — лише туман. Світло б\'ється об нього й повертається в очі.']
    },

    valley: {
      give: 'віддати світло', clutchHint: 'утримуй E — затулити тріщини', clutchTouch: 'утримуй кнопку — затулити тріщини',
      empty: ['* Світло згасло. Долина мовчить.', '* …Але десь високо зривається одна крапля — і падає тобі в долоні.'],
      last: ['* Остання крапля стікає на землю.'],
      travelers: ['* Позаду, садом, якого ще недавно не було, ідуть інші подорожні. Їм світло.']
    },

    workshop: {
      panel: 'покласти долоню', hint: 'рухайся — світло піде за тобою · E — нота', hintTouch: 'джойстик — вести світло · дія — нота',
      done: ['* Машини грають далі. Твою мелодію.']
    },

    masks: [
      { label: 'Як усі', whisper: 'Без мене ти залишишся {сам|сама|самі}.' },
      { label: '{Бездоганний|Бездоганна|Бездоганні}', whisper: 'Без мене всі побачать твої помилки.' },
      { label: '{Успішний|Успішна|Успішні}', whisper: 'Без мене ти — ніхто.' },
      { label: '{Зручний|Зручна|Зручні}', whisper: 'Без мене тебе не любитимуть.' }
    ],
    gallery: {
      remove: 'зняти маску', hint: 'E — зняти маску', hintTouch: 'кнопка — зняти маску',
      narrow: ['* Прохід надто вузький. Обладунки не пролазять.'],
      reveal: ['* У воді — не порожнеча. Там світло. Воно змінюється, коли рухаєшся ти.']
    },

    doors: doors([
      ['вечірка', '* Біля вогнища — кілька людей. Хтось сміється, хтось мовчки дивиться на іскри. Для тебе теж є місце.'],
      ['подорож', '* На пеньку — розгорнута мапа. На ній позначено лише одну стежку. Цю.'],
      ['вершина кар\'єри', '* Під сосною — верстак і недороблена дерев\'яна пташка. Хтось різьбив її повільно, з любов\'ю.'],
      ['чужа перемога', '* На траві — маленька саморобна медаль. На ній видряпано: «за те, що не {здався|здалася|здалися}».'],
      ['концерт', '* Між деревами хтось грає на гітарі. Нескладно, трохи фальшиво. Дуже щиро.'],
      ['море', '* За соснами — озеро. Хвилі ледь чутно торкаються берега.'],
      ['весілля друзів', '* На гілках — гірлянда з паперових ліхтариків. Тут когось чекають.'],
      ['нове місто', '* Звідси, з пагорба, видно далекі вогні. Теплі. Не поспішають.'],
      ['гори', '* Невеличкий пагорб. Не найвища вершина. Але звідси видно все, що треба.'],
      ['ідеальне фото', '* На колоді — старий фотоапарат без плівки. Можна просто дивитися.'],
      ['великий успіх', '* Біля стежки — грядка з першими паростками. Вони ростуть зі своєю швидкістю.']
    ]),
    enter: 'увійти',
    forestIn: ['* Пахне сосновою смолою. Теплий вітер торкається обличчя.'],
    look: 'роздивитися',

    little: [
      'ранкова кава', 'чийсь сміх за стіною', 'тепла ковдра', 'лист, написаний від руки',
      'кіт на підвіконні', 'перший сніг', 'запах дощу', 'пісня, яку знаєш напам\'ять',
      'сонце на підлозі', 'рідний голос', 'обійми на вокзалі', 'свіжий хліб',
      '«напиши, як доїдеш»', 'тиша після грози', 'малюнок на холодильнику', 'розмова на кухні',
      'улюблена чашка', 'квиток у кишені старої куртки', 'бабусині руки', 'вечірнє світло'
    ],
    telescopeLabel: 'подивитися',
    telescope: [
      '* Ти дивишся в телескоп. Зорі там — далекі, холодні, недосяжні.',
      '* Ти відводиш погляд. А вони — тут. Поруч. На відстані простягнутої руки.'
    ],
    starsPsyche: [
      P('Ти {дійшов|дійшла|дійшли}.'),
      P('Я бачила кожен твій крок. І ті, що далися найважче.'),
      P('Пам\'ятаєш, якими далекими здавалися зорі в тій темній залі?'),
      P('А вони весь цей час були тут. На відстані простягнутої руки.'),
      P('Ранкова кава. Чийсь сміх за стіною. Тепла долоня. Пісня, яку знаєш напам\'ять.'),
      P('Дрібниці. Так їх називають ті, хто поспішає.'),
      P('Я не знаю, яка з тих кімнат була твоєю.'),
      P('Може, коридор, де думки не замовкали. Може, кімната з дощем за вікном. А може, міст, якого не видно.'),
      P('Але щось ти там {залишив|залишила|залишили}. Щось важке, що вже не мусиш нести.'),
      P('Воно ще повертатиметься. Це нормально.\nТепер ти знаєш, що його можна відпустити знову.'),
      P('Втрата не зникне. Але вона стане частиною тебе, а не всім тобою.'),
      P('Все якось налагодиться. Не одразу. Не так, як ти {планував|планувала|планували}.\nАле налагодиться.'),
      P('«Не журіться про завтрашній день», — казали колись. Досить кожному дневі своєї турботи.\nІ своєї радості.'),
      P('Я так рада, що ти тут. Що ти — є.'),
      P('Ходімо. Я хочу показати тобі ту залу ще раз.')
    ],

    hallReturn: [
      '* Зала та сама. Але на колонах проступили візерунки, яких ти раніше не {помічав|помічала|помічали}.',
      P('Бачиш? Зала не стала іншою. Це ти тепер бачиш більше.'),
      P('Темрява нікуди не поділася. Просто тепер у ній є твоє світло.'),
      P('…'),
      P('Знаєш, мені теж час зняти свою маску.'),
      A('Привіт. Це я — людина, яка зробила «yourself.».'),
      A('Дякую, що {пройшов|пройшла|пройшли} цей шлях до кінця. Для мене це правда багато значить.'),
      A('Ця новела — не терапія і не порада. Я не психолог і не намагаюся ним бути.'),
      A('Це лише кілька кімнат, у яких мені теж доводилося бути.'),
      A('Прошу, зрозумій контекст правильно: тут немає правильних відповідей і немає оцінок.\nКожна кімната — лише метафора. Бери з неї те, що відгукується.'),
      A('Якщо тобі зараз важко — будь ласка, не залишайся з цим наодинці. Поговори з кимось близьким або з фахівцем.\nПросити про допомогу — це сміливо.'),
      A('Якщо хочеш підтримати мене — далі буде посилання на Patreon. Будь-яка підтримка — це тепло, яке повернеться новими історіями.'),
      A('А ще краще — поділися «yourself.» зі знайомими. З кимось, кому зараз, можливо, теж непросто.'),
      A('Бережи себе. {Справжнього|Справжню|Справжніх} себе.'),
      P('…Ну от. А я ще трохи посиджу тут, біля зірок.')
    ],

    credits: {
      locations: [
        ['I. Коридор думок', 'нав\'язливі думки, оверсінкінг'],
        ['II. Тиха кімната', 'самотність'],
        ['III. Сад дрібниць', 'хронічний стрес, гіперболізація проблем'],
        ['IV. Міст у тумані', 'тривога за майбутнє, страх невідомості'],
        ['V. Долина пісочного годинника', 'пошук сенсу, усвідомлення скінченності'],
        ['VI. Майстерня луни', 'страх перед новими технологіями'],
        ['VII. Галерея чужих масок', 'криза ідентичності, чужі очікування'],
        ['VIII. Вокзал тисячі дверей', 'синдром упущеної вигоди (FOMO)'],
        ['IX. Найближчі зорі', 'дрібниці, з яких складається життя']
      ],
      music: MUSIC,
      special: { title: 'окрема подяка', lines: ['команді Feodaller —', 'за створення музики та за натхнення на створення новели'] },
      thanks: ['дякую, що {пройшов|пройшла|пройшли} цей шлях.', 'і дякую, що ти є.'],
      poem: { stanzas: POEM, sign: 'Леся Українка, «Contra spem spero!», 1890', translation: null }
    },

    ui: {
      lang: 'мова', loading: 'завантаження',
      sub: 'новела про думки, втрату і надію', foot: 'найкраще — в навушниках і в тиші',
      formQ: 'як до тебе звертатися?', forms: ['ти прийшов', 'ти прийшла', 'ти прийшли'],
      cont: 'продовжити', restart: 'почати спочатку',
      pause: 'пауза', resume: 'продовжити', sound: 'звук: ', on: 'увімк.', off: 'вимк.',
      restartQ: 'увесь прогрес зникне', no: 'ні', yesRestart: 'так, спочатку', volume: 'гучність',
      keys: 'WASD / стрілки — рух · E / Enter — дія · Esc — пауза · M — звук · F — повний екран',
      fs: 'повний екран', fsPc: 'F11 або F', fsAndroid: 'кнопка нижче', fsIphone: 'Поділитися → На початковий екран', fsBtn: 'на весь екран',
      supTitle: 'підтримати автора', supText: 'Якщо «yourself.» відгукнулося — можна підтримати подальшу роботу.',
      patreon: 'підтримати на Patreon',
      share: 'поділитися', shareText: 'Коротка новела про думки, втрату і надію.', linkCopied: 'посилання скопійовано', next: 'далі',
      cRooms: 'кімнати і те, що в них живе', cAuthor: 'автор', cAuthorLine: 'ідея, сценарій, код і світло',
      cMusic: 'музика', cFonts: 'шрифти',
      rights: '© 2026 {author}. Усі права на гру захищено.', rightsSub: 'Музика, шрифти й вірш належать їхнім авторам.',
      hintMove: 'WASD / стрілки — рух · E / Enter — дія · Esc — пауза', hintMoveTouch: 'джойстик — рух · кнопка — дія',
      soundNote: 'цей браузер не відтворює частину музики (.ogg) — гра працюватиме, але тихіше'
    }
  };

  /* ===================================================================== */
  /*                                ENGLISH                                */
  /* ===================================================================== */
  TEXTS.en = {
    names: { psyche: 'Psyche', author: 'author', memory: 'memory' },
    titles: {
      hall: ['', 'The Starry Hall'], corridor: ['I', 'The Corridor of Thoughts'], room: ['II', 'The Quiet Room'],
      garden: ['III', 'The Garden of Little Things'], bridge: ['IV', 'The Bridge in the Fog'], valley: ['V', 'The Hourglass Valley'],
      workshop: ['VI', 'The Echo Workshop'], gallery: ['VII', 'The Gallery of Borrowed Masks'], station: ['VIII', 'The Station of a Thousand Doors'],
      forest: null, stars: ['IX', 'The Nearest Stars'], hall2: ['', 'The Starry Hall']
    },

    hallMeet: [
      '* Someone is standing in the middle of the hall. A quiet light comes from her — like a candle someone left on a windowsill.',
      P('Oh. You\'re here.'),
      P('Don\'t be afraid. I\'m no stranger. I\'m the part of you that you haven\'t heard in a long time.'),
      P('The part that still believes in goodness. Even when you\'ve grown too tired to believe.'),
      P('I\'ve been called many things. A soul. A conscience. A quiet voice inside.\nMy name is Psyche.'),
      P('It\'s dark here, isn\'t it? Look up.'),
      P('Stars don\'t shine because there is light around them.\nThey shine because there is night.'),
      P('I know what you\'ve brought with you. Thoughts that come one after another, like waves — never leaving room to breathe in between.'),
      P('What you\'ve lost. What you didn\'t get to say. What hurts when no one is looking.'),
      P('You\'ve carried it for so long that you\'ve forgotten what it\'s like to walk lightly.'),
      P('I won\'t tell you everything is fine. You wouldn\'t believe me.'),
      P('And I won\'t give advice. You\'ve been given far too much of it already.'),
      P('I\'ll just show you a few rooms. Something familiar lives in each of them.'),
      P('You don\'t have to win there. You don\'t have to be strong.\nYou only have to listen to yourself a little more closely.'),
      P('Long ago someone wrote that the One who counts the stars and calls each one by name heals the brokenhearted.'),
      P('You are called by name too. Even here. Even now.'),
      P('You don\'t need to see the whole path. Go where the light is.'),
      P('I\'ll be near. Even when you can\'t see me.'),
      '* At the end of the hall, an arch quietly opens.'
    ],

    thoughts: [
      'What if…', 'You forgot…', 'Should have done it differently…', 'What if they\'re right?',
      'You\'ll ruin it again', 'Why did you stay silent?', 'Too late', 'Think it over again',
      'They noticed everything', 'What if it doesn\'t work?', 'You should have already…', 'It\'s your fault',
      'Remember that time…', 'What will they think?', 'You won\'t make it', 'And what about tomorrow?',
      'The same thing again', 'Wrong choice', 'You could have done better', 'Check it once more',
      'Nothing will change', 'What if never?', 'You\'re not who you should be', 'What if it\'s forever?',
      'But you promised…', 'Everyone else already…', 'You should have said it', 'You only have yourself to blame'
    ],
    corridor: {
      hint: 'hold E — ignore', hintTouch: 'hold the button — ignore', ignore: 'ignore',
      closed: 'the door opens once every thought fades · hold E',
      closedTouch: 'the door opens once every thought fades · hold the button',
      left: 'thoughts left: ', free: 'the thoughts have faded'
    },

    room: {
      cup: ['* Warm handprints appear on the cold porcelain. Someone else\'s. Many of them.', '* Someone warmed their hands here. Just like you are now.'],
      book: ['* The pages are filled with different handwriting.', '* In the margins, quiet notes: "me too", "I felt this way too", "thank you for a place where I can be silent".'],
      glass: ['* Handprints appear on the glass. Dozens of them.', '* Someone stood here and watched the same rain.'],
      rest: ['* I should rest.'],
      reflection: ['* In the dark glass — you. A warm, calm reflection looks back.'],
      chair: 'sit down', stand: 'stand up', touch: 'touch'
    },

    memories: memories([
      ['a shard of a cup', [
        M('Morning. The cup slips out of your hands.'),
        M('A crash — and pieces all over the floor. It feels like something much bigger broke. The day. The week. You.'),
        M('…You pick up the pieces. Put the kettle on. Take another cup.'),
        M('The tea is just as warm.'),
        '* The monolith sinks down. In your palm — a small shard of a cup.']],
      ['a crumpled note', [
        M('A conversation. You say something awkward — and instantly want to take the words back.'),
        M('At night you replay that phrase again and again. A hundred times. A thousand.'),
        M('And the person across from you didn\'t even remember. They smiled, nodded — and went on with their day.'),
        '* The monolith sinks down. In your palm — a crumpled note. Just a few words.']],
      ['a paper clip', [
        M('You rush in, out of breath. Everyone turns around.'),
        M('Or so it seemed. Really, two people turned — and forgot a moment later.'),
        M('Five minutes. Less time than you spent blaming yourself for them afterwards.'),
        '* The monolith sinks down. In your palm — an ordinary paper clip.']],
      ['an envelope', [
        M('The message has been sitting there for three days. The longer you wait, the scarier it is to open.'),
        M('Hundreds of versions in your head. Resentment. A complaint. The end.'),
        M('You open it.\n"Hi! How are you? Nothing urgent, you just crossed my mind :)"'),
        '* The monolith sinks down. In your palm — a light paper envelope.']],
      ['a pebble', [
        M('A mistake in an email. One wrong letter.'),
        M('It feels like everyone sees it. Like now everyone knows: you are the mistake.'),
        M('Someone noticed it a week later. It was fixed in a minute. No one even remembered.'),
        '* The monolith sinks down. In your palm — a smooth little pebble.']]
    ]),
    gardenSky: ['* The darkness overhead parts. Beyond it — a clear starry sky.'],
    listen: 'listen',

    bridge: {
      down: 'E — lower the lantern', up: 'E — raise the lantern', downTouch: 'lower the lantern', upTouch: 'raise the lantern',
      edge: ['* Ahead — only fog. The light hits it and bounces back into your eyes.']
    },

    valley: {
      give: 'give the light', clutchHint: 'hold E — cover the cracks', clutchTouch: 'hold the button — cover the cracks',
      empty: ['* The light has gone out. The valley is silent.', '* …But somewhere high above, a single drop breaks loose — and falls into your hands.'],
      last: ['* The last drop runs down into the earth.'],
      travelers: ['* Behind you, through a garden that wasn\'t there a moment ago, other travelers are walking. They have light.']
    },

    workshop: {
      panel: 'place your palm', hint: 'move — the light will follow you · E — a note', hintTouch: 'joystick — guide the light · button — a note',
      done: ['* The machines keep playing. Your melody.']
    },

    masks: [
      { label: 'Like everyone', whisper: 'Without me, you\'ll be all alone.' },
      { label: 'Flawless', whisper: 'Without me, everyone will see your mistakes.' },
      { label: 'Successful', whisper: 'Without me, you\'re nobody.' },
      { label: 'Convenient', whisper: 'Without me, no one will love you.' }
    ],
    gallery: {
      remove: 'take off a mask', hint: 'E — take off a mask', hintTouch: 'button — take off a mask',
      narrow: ['* The passage is too narrow. The armor won\'t fit through.'],
      reveal: ['* In the water — not emptiness. There is light. It changes as you move.']
    },

    doors: doors([
      ['a party', '* By the campfire, a few people. Someone is laughing, someone is quietly watching the sparks. There\'s a place for you too.'],
      ['a journey', '* A map is spread out on a stump. Only one path is marked on it. This one.'],
      ['a career peak', '* Under a pine, a workbench and an unfinished wooden bird. Someone carved it slowly, with love.'],
      ['someone else\'s victory', '* On the grass, a small handmade medal. Scratched on it: "for not giving up".'],
      ['a concert', '* Between the trees someone is playing guitar. Simple, a little out of tune. Very sincere.'],
      ['the sea', '* Beyond the pines, a lake. The waves barely touch the shore.'],
      ['a friends\' wedding', '* Paper lanterns hang in a garland on the branches. Someone is expected here.'],
      ['a new city', '* From this hill you can see distant lights. Warm ones. In no hurry.'],
      ['the mountains', '* A small hill. Not the highest peak. But from here you can see everything you need.'],
      ['the perfect photo', '* On a log, an old camera with no film. You can simply look.'],
      ['big success', '* By the path, a garden bed with the first sprouts. They grow at their own pace.']
    ]),
    enter: 'enter',
    forestIn: ['* It smells of pine resin. A warm wind touches your face.'],
    look: 'look closer',

    little: [
      'morning coffee', 'someone laughing behind the wall', 'a warm blanket', 'a handwritten letter',
      'a cat on the windowsill', 'the first snow', 'the smell of rain', 'a song you know by heart',
      'sunlight on the floor', 'a voice you love', 'a hug at the station', 'fresh bread',
      '"text me when you get home"', 'the quiet after a storm', 'a drawing on the fridge', 'a late talk in the kitchen',
      'a favorite mug', 'a ticket in an old jacket pocket', 'grandma\'s hands', 'evening light'
    ],
    telescopeLabel: 'look',
    telescope: [
      '* You look through the telescope. The stars there are distant, cold, out of reach.',
      '* You look away. And they are here. Close. Within arm\'s reach.'
    ],
    starsPsyche: [
      P('You made it.'),
      P('I saw every step you took. Even the hardest ones.'),
      P('Remember how far away the stars seemed in that dark hall?'),
      P('And all this time they were right here. Within arm\'s reach.'),
      P('Morning coffee. Someone laughing behind the wall. A warm hand. A song you know by heart.'),
      P('Little things. That\'s what people in a hurry call them.'),
      P('I don\'t know which of those rooms was yours.'),
      P('Maybe the corridor where the thoughts never went quiet. Maybe the room with rain outside the window. Or maybe the bridge you couldn\'t see.'),
      P('But you left something there. Something heavy you no longer have to carry.'),
      P('It will come back. That\'s okay.\nNow you know you can let it go again.'),
      P('The loss won\'t disappear. But it will become a part of you, not all of you.'),
      P('Things will get better somehow. Not right away. Not the way you planned.\nBut they will.'),
      P('"Do not worry about tomorrow," people said long ago. Each day has enough trouble of its own.\nAnd enough joy.'),
      P('I\'m so glad you\'re here. That you exist.'),
      P('Come. I want to show you that hall once more.')
    ],

    hallReturn: [
      '* The hall is the same. But patterns have appeared on the columns that you never noticed before.',
      P('See? The hall hasn\'t changed. You just see more now.'),
      P('The darkness hasn\'t gone anywhere. It\'s just that now your light is in it.'),
      P('…'),
      P('You know, it\'s time for me to take off my mask too.'),
      A('Hi. It\'s me — the person who made «yourself.».'),
      A('Thank you for walking this path to the end. It truly means a lot to me.'),
      A('This story isn\'t therapy or advice. I\'m not a psychologist and I\'m not trying to be one.'),
      A('These are just a few rooms I\'ve had to stand in myself.'),
      A('Please understand the context: there are no right answers here and no grades.\nEach room is only a metaphor. Take from it what resonates with you.'),
      A('If things are hard for you right now — please don\'t stay alone with it. Talk to someone close or to a professional.\nAsking for help is brave.'),
      A('If you\'d like to support me, a link to Patreon comes next. Any support is warmth that will come back as new stories.'),
      A('Even better — share «yourself.» with people you know. With someone who might be having a hard time right now, too.'),
      A('Take care of yourself. Your true self.'),
      P('…There. I\'ll sit here by the stars a little longer.')
    ],

    credits: {
      locations: [
        ['I. The Corridor of Thoughts', 'intrusive thoughts, overthinking'],
        ['II. The Quiet Room', 'loneliness'],
        ['III. The Garden of Little Things', 'chronic stress, blowing problems out of proportion'],
        ['IV. The Bridge in the Fog', 'anxiety about the future, fear of the unknown'],
        ['V. The Hourglass Valley', 'searching for meaning, facing our finite time'],
        ['VI. The Echo Workshop', 'fear of new technology'],
        ['VII. The Gallery of Borrowed Masks', 'identity crisis, other people\'s expectations'],
        ['VIII. The Station of a Thousand Doors', 'fear of missing out (FOMO)'],
        ['IX. The Nearest Stars', 'the little things a life is made of']
      ],
      music: MUSIC,
      special: { title: 'special thanks', lines: ['to the Feodaller team —', 'for the music and for the inspiration behind this story'] },
      thanks: ['thank you for walking this path.', 'and thank you for being here.'],
      poem: {
        stanzas: POEM, sign: 'Lesya Ukrainka, «Contra spem spero!», 1890',
        translation: [
          ['Away, my thoughts, you autumn clouds!', 'For golden spring is here today!', 'Shall all my youthful years go by', 'In grief and mourning, fade away?'],
          ['Upon a poor and barren fallow', 'I\'ll sow bright flowers, row on row,', 'I\'ll sow my flowers in the frost', 'And water them with tears of woe.'],
          ['Through the long, dark and sightless night', 'I will not close my eyes to sleep,', 'I\'ll search the sky for the guiding light —', 'The star that rules the dark and deep.'],
          ['Yes! I will laugh through all my tears,', 'Through trouble I will sing my song,', 'And hope, though hope itself is gone —', 'I\'ll live! Away, sad thoughts, begone!']
        ],
        translationSign: 'translated for this game'
      }
    },

    ui: {
      lang: 'language', loading: 'loading',
      sub: 'a short novel about thoughts, loss and hope', foot: 'best played with headphones, in silence',
      formQ: 'how should I address you?', forms: ['he / him', 'she / her', 'they / them'],
      cont: 'continue', restart: 'start over',
      pause: 'pause', resume: 'resume', sound: 'sound: ', on: 'on', off: 'off',
      restartQ: 'all progress will be lost', no: 'no', yesRestart: 'yes, start over', volume: 'volume',
      keys: 'WASD / arrows — move · E / Enter — act · Esc — pause · M — sound · F — fullscreen',
      fs: 'fullscreen', fsPc: 'F11 or F', fsAndroid: 'the button below', fsIphone: 'Share → Add to Home Screen', fsBtn: 'go fullscreen',
      supTitle: 'support the author', supText: 'If «yourself.» resonated with you, you can support future work.',
      patreon: 'support on Patreon',
      share: 'share', shareText: 'A short novel about thoughts, loss and hope.', linkCopied: 'link copied', next: 'next',
      cRooms: 'the rooms and what lives in them', cAuthor: 'author', cAuthorLine: 'idea, story, code and light',
      cMusic: 'music', cFonts: 'fonts',
      rights: '© 2026 {author}. All rights to the game reserved.', rightsSub: 'The music, fonts and poem belong to their authors.',
      hintMove: 'WASD / arrows — move · E / Enter — act · Esc — pause', hintMoveTouch: 'joystick — move · button — act',
      soundNote: 'this browser can\'t play part of the music (.ogg) — the game still works, just quieter'
    }
  };

  /* ===================================================================== */
  /*                                РУССКИЙ                                */
  /* ===================================================================== */
  TEXTS.ru = {
    names: { psyche: 'Психе́я', author: 'автор', memory: 'воспоминание' },
    titles: {
      hall: ['', 'Звёздный зал'], corridor: ['I', 'Коридор мыслей'], room: ['II', 'Тихая комната'],
      garden: ['III', 'Сад мелочей'], bridge: ['IV', 'Мост в тумане'], valley: ['V', 'Долина песочных часов'],
      workshop: ['VI', 'Мастерская эха'], gallery: ['VII', 'Галерея чужих масок'], station: ['VIII', 'Вокзал тысячи дверей'],
      forest: null, stars: ['IX', 'Ближайшие звёзды'], hall2: ['', 'Звёздный зал']
    },

    hallMeet: [
      '* Посреди зала кто-то стоит. От неё исходит тихий свет — как от свечи, которую кто-то оставил на подоконнике.',
      P('О. Ты здесь.'),
      P('Не бойся. Я не чужая. Я — та часть тебя, которую ты давно не {слышал|слышала|слышали}.'),
      P('Та, что до сих пор верит в добро. Даже тогда, когда ты уже {устал|устала|устали} верить.'),
      P('Меня называли по-разному. Душой. Совестью. Тихим голосом внутри.\nМоё имя — Психе́я.'),
      P('Здесь темно, правда? Посмотри наверх.'),
      P('Звёзды светят не потому, что вокруг светло.\nОни светят, потому что вокруг ночь.'),
      P('Я знаю, что ты {принёс|принесла|принесли} с собой. Мысли, что приходят одна за другой, словно волны, — и не дают вдохнуть между ними.'),
      P('То, что ты {потерял|потеряла|потеряли}. То, что не {успел|успела|успели} сказать. То, что болит, когда никто не видит.'),
      P('Ты несёшь это так долго, что уже {забыл|забыла|забыли}, каково это — идти легко.'),
      P('Я не скажу тебе, что всё в порядке. Ты бы мне не {поверил|поверила|поверили}.'),
      P('И не буду давать советов. Тебе их и так давали слишком много.'),
      P('Я просто покажу тебе несколько комнат. В каждой живёт что-то знакомое.'),
      P('Там не нужно побеждать. Не нужно быть {сильным|сильной|сильными}.\nНужно лишь чуть внимательнее прислушаться к себе.'),
      P('Когда-то давно написали, что Тот, кто исчисляет звёзды и каждую называет по имени, — исцеляет сокрушённых сердцем.'),
      P('Тебя тоже зовут по имени. Даже здесь. Даже сейчас.'),
      P('Тебе не нужно видеть весь путь. Иди туда, где свет.'),
      P('Я буду рядом. Даже когда ты меня не видишь.'),
      '* В конце зала тихо открывается арка.'
    ],

    thoughts: [
      'А что если…', 'Ты {забыл|забыла|забыли}…', 'Надо было иначе…', 'А вдруг они правы?',
      'Ты снова всё испортишь', 'Почему ты тогда {промолчал|промолчала|промолчали}?', 'Слишком поздно', 'Подумай ещё раз',
      'Они всё заметили', 'А вдруг не получится?', 'Ты {должен был|должна была|должны были} уже…', 'Это из-за тебя',
      'Вспомни, как тогда…', 'Что они подумают?', 'Ты не успеешь', 'А как же завтра?',
      'Опять то же самое', 'Не тот выбор', 'Ты {мог|могла|могли} бы лучше', 'Проверь ещё раз',
      'Ничего не изменится', 'А что, если никогда?', 'Ты не {такой|такая|такие}, как надо', 'А если это навсегда?',
      'Ты же {обещал|обещала|обещали}…', 'Все уже давно…', 'Надо было сказать', 'Ты {сам виноват|сама виновата|сами виноваты}'
    ],
    corridor: {
      hint: 'удерживай E — игнорировать', hintTouch: 'удерживай кнопку — игнорировать', ignore: 'игнорировать',
      closed: 'дверь откроется, когда развеешь все мысли · удерживай E',
      closedTouch: 'дверь откроется, когда развеешь все мысли · удерживай кнопку',
      left: 'мыслей осталось: ', free: 'мысли развеялись'
    },

    room: {
      cup: ['* На холодном фарфоре проступают тёплые отпечатки ладоней. Чужих. Многих.', '* Кто-то грел здесь руки. Так же, как ты сейчас.'],
      book: ['* Страницы исписаны разными почерками.', '* На полях — тихие пометки: «я тоже», «и у меня так было», «спасибо, что здесь можно молчать».'],
      glass: ['* На стекле проступают следы ладоней. Десятки.', '* Кто-то стоял здесь и смотрел на тот же дождь.'],
      rest: ['* Мне стоит отдохнуть.'],
      reflection: ['* В тёмном стекле — ты. Тёплое, спокойное отражение смотрит в ответ.'],
      chair: 'сесть', stand: 'встать', touch: 'прикоснуться'
    },

    memories: memories([
      ['осколок чашки', [
        M('Утро. Чашка выскальзывает из рук.'),
        M('Звон — и осколки по всему полу. Кажется, разбилось что-то гораздо большее. День. Неделя. Ты.'),
        M('…Ты собираешь осколки. Ставишь чайник. Берёшь другую чашку.'),
        M('Чай такой же тёплый.'),
        '* Монолит оседает. В ладони — маленький осколок чашки.']],
      ['смятая бумажка', [
        M('Разговор. Ты говоришь что-то невпопад — и сразу хочешь забрать слова обратно.'),
        M('Ночью ты прокручиваешь эту фразу снова и снова. Сотню раз. Тысячу.'),
        M('А человек напротив даже не запомнил. Улыбнулся, кивнул — и пошёл себе дальше.'),
        '* Монолит оседает. В ладони — смятая бумажка. Просто несколько слов.']],
      ['скрепка', [
        M('Ты вбегаешь, {запыхавшийся|запыхавшаяся|запыхавшиеся}. Все оборачиваются.'),
        M('Так казалось. На самом деле обернулись двое — и через миг забыли.'),
        M('Пять минут. Это меньше, чем ты потом коришь себя за них.'),
        '* Монолит оседает. В ладони — обычная скрепка.']],
      ['конверт', [
        M('Сообщение висит уже третий день. Чем дольше ждёшь — тем страшнее открыть.'),
        M('В голове — сотни вариантов. Обида. Претензия. Конец.'),
        M('Ты открываешь.\n«Привет! Как ты? Ничего срочного, просто вспомнилось о тебе :)»'),
        '* Монолит оседает. В ладони — лёгкий бумажный конверт.']],
      ['камешек', [
        M('Ошибка в письме. Одна буква не та.'),
        M('Кажется, её видят все. Что теперь все знают: ошибка — это ты.'),
        M('Её заметили только через неделю. Исправили за минуту. Никто и не вспомнил.'),
        '* Монолит оседает. В ладони — гладкий камешек.']]
    ]),
    gardenSky: ['* Тьма над головой расходится. Там — чистое звёздное небо.'],
    listen: 'выслушать',

    bridge: {
      down: 'E — опустить фонарь', up: 'E — поднять фонарь', downTouch: 'опустить фонарь', upTouch: 'поднять фонарь',
      edge: ['* Впереди — только туман. Свет бьётся о него и возвращается в глаза.']
    },

    valley: {
      give: 'отдать свет', clutchHint: 'удерживай E — закрыть трещины', clutchTouch: 'удерживай кнопку — закрыть трещины',
      empty: ['* Свет погас. Долина молчит.', '* …Но где-то высоко срывается одна капля — и падает тебе в ладони.'],
      last: ['* Последняя капля стекает на землю.'],
      travelers: ['* Позади, по саду, которого ещё недавно не было, идут другие путники. Им светло.']
    },

    workshop: {
      panel: 'положить ладонь', hint: 'двигайся — свет пойдёт за тобой · E — нота', hintTouch: 'джойстик — вести свет · кнопка — нота',
      done: ['* Машины играют дальше. Твою мелодию.']
    },

    masks: [
      { label: 'Как все', whisper: 'Без меня ты останешься {один|одна|одни}.' },
      { label: '{Безупречный|Безупречная|Безупречные}', whisper: 'Без меня все увидят твои ошибки.' },
      { label: '{Успешный|Успешная|Успешные}', whisper: 'Без меня ты — никто.' },
      { label: '{Удобный|Удобная|Удобные}', whisper: 'Без меня тебя не будут любить.' }
    ],
    gallery: {
      remove: 'снять маску', hint: 'E — снять маску', hintTouch: 'кнопка — снять маску',
      narrow: ['* Проход слишком узкий. Доспехи не пролезают.'],
      reveal: ['* В воде — не пустота. Там свет. Он меняется, когда двигаешься ты.']
    },

    doors: doors([
      ['вечеринка', '* У костра — несколько человек. Кто-то смеётся, кто-то молча смотрит на искры. Для тебя тоже есть место.'],
      ['путешествие', '* На пне — развёрнутая карта. На ней отмечена лишь одна тропа. Эта.'],
      ['вершина карьеры', '* Под сосной — верстак и недоделанная деревянная птичка. Кто-то вырезал её медленно, с любовью.'],
      ['чужая победа', '* На траве — маленькая самодельная медаль. На ней нацарапано: «за то, что не {сдался|сдалась|сдались}».'],
      ['концерт', '* Между деревьями кто-то играет на гитаре. Нескладно, немного фальшиво. Очень искренне.'],
      ['море', '* За соснами — озеро. Волны едва слышно касаются берега.'],
      ['свадьба друзей', '* На ветках — гирлянда из бумажных фонариков. Здесь кого-то ждут.'],
      ['новый город', '* Отсюда, с холма, видны далёкие огни. Тёплые. Не спешат.'],
      ['горы', '* Небольшой холм. Не самая высокая вершина. Но отсюда видно всё, что нужно.'],
      ['идеальное фото', '* На бревне — старый фотоаппарат без плёнки. Можно просто смотреть.'],
      ['большой успех', '* У тропинки — грядка с первыми ростками. Они растут со своей скоростью.']
    ]),
    enter: 'войти',
    forestIn: ['* Пахнет сосновой смолой. Тёплый ветер касается лица.'],
    look: 'рассмотреть',

    little: [
      'утренний кофе', 'чей-то смех за стеной', 'тёплое одеяло', 'письмо, написанное от руки',
      'кот на подоконнике', 'первый снег', 'запах дождя', 'песня, которую знаешь наизусть',
      'солнце на полу', 'родной голос', 'объятия на вокзале', 'свежий хлеб',
      '«напиши, как доедешь»', 'тишина после грозы', 'рисунок на холодильнике', 'разговор на кухне',
      'любимая чашка', 'билет в кармане старой куртки', 'бабушкины руки', 'вечерний свет'
    ],
    telescopeLabel: 'посмотреть',
    telescope: [
      '* Ты смотришь в телескоп. Звёзды там — далёкие, холодные, недосягаемые.',
      '* Ты отводишь взгляд. А они — здесь. Рядом. На расстоянии вытянутой руки.'
    ],
    starsPsyche: [
      P('Ты {дошёл|дошла|дошли}.'),
      P('Я видела каждый твой шаг. И те, что дались труднее всего.'),
      P('Помнишь, какими далёкими казались звёзды в том тёмном зале?'),
      P('А они всё это время были здесь. На расстоянии вытянутой руки.'),
      P('Утренний кофе. Чей-то смех за стеной. Тёплая ладонь. Песня, которую знаешь наизусть.'),
      P('Мелочи. Так их называют те, кто спешит.'),
      P('Я не знаю, какая из тех комнат была твоей.'),
      P('Может, коридор, где мысли не умолкали. Может, комната с дождём за окном. А может, мост, которого не видно.'),
      P('Но что-то ты там {оставил|оставила|оставили}. Что-то тяжёлое, что больше не нужно нести.'),
      P('Оно ещё будет возвращаться. Это нормально.\nТеперь ты знаешь, что его можно отпустить снова.'),
      P('Потеря не исчезнет. Но она станет частью тебя, а не всем тобой.'),
      P('Всё как-нибудь наладится. Не сразу. Не так, как ты {планировал|планировала|планировали}.\nНо наладится.'),
      P('«Не заботьтесь о завтрашнем дне», — говорили когда-то. Довольно для каждого дня своей заботы.\nИ своей радости.'),
      P('Я так рада, что ты здесь. Что ты — есть.'),
      P('Пойдём. Я хочу показать тебе тот зал ещё раз.')
    ],

    hallReturn: [
      '* Зал тот же. Но на колоннах проступили узоры, которых ты раньше не {замечал|замечала|замечали}.',
      P('Видишь? Зал не стал другим. Это ты теперь видишь больше.'),
      P('Темнота никуда не делась. Просто теперь в ней есть твой свет.'),
      P('…'),
      P('Знаешь, мне тоже пора снять свою маску.'),
      A('Привет. Это я — человек, который сделал «yourself.».'),
      A('Спасибо, что {прошёл|прошла|прошли} этот путь до конца. Для меня это правда много значит.'),
      A('Эта новелла — не терапия и не совет. Я не психолог и не пытаюсь им быть.'),
      A('Это лишь несколько комнат, в которых мне тоже приходилось бывать.'),
      A('Прошу, пойми контекст правильно: здесь нет правильных ответов и нет оценок.\nКаждая комната — лишь метафора. Бери из неё то, что откликается.'),
      A('Если тебе сейчас тяжело — пожалуйста, не оставайся с этим наедине. Поговори с кем-то близким или со специалистом.\nПросить о помощи — это смело.'),
      A('Если хочешь поддержать меня — дальше будет ссылка на Patreon. Любая поддержка — это тепло, которое вернётся новыми историями.'),
      A('А ещё лучше — поделись «yourself.» со знакомыми. С кем-то, кому сейчас, возможно, тоже непросто.'),
      A('Береги себя. {Настоящего|Настоящую|Настоящих} себя.'),
      P('…Ну вот. А я ещё немного посижу здесь, у звёзд.')
    ],

    credits: {
      locations: [
        ['I. Коридор мыслей', 'навязчивые мысли, оверсинкинг'],
        ['II. Тихая комната', 'одиночество'],
        ['III. Сад мелочей', 'хронический стресс, преувеличение проблем'],
        ['IV. Мост в тумане', 'тревога за будущее, страх неизвестности'],
        ['V. Долина песочных часов', 'поиск смысла, осознание конечности'],
        ['VI. Мастерская эха', 'страх перед новыми технологиями'],
        ['VII. Галерея чужих масок', 'кризис идентичности, чужие ожидания'],
        ['VIII. Вокзал тысячи дверей', 'синдром упущенной выгоды (FOMO)'],
        ['IX. Ближайшие звёзды', 'мелочи, из которых состоит жизнь']
      ],
      music: MUSIC,
      special: { title: 'отдельная благодарность', lines: ['команде Feodaller —', 'за создание музыки и за вдохновение на создание новеллы'] },
      thanks: ['спасибо, что {прошёл|прошла|прошли} этот путь.', 'и спасибо, что ты есть.'],
      poem: {
        stanzas: POEM, sign: 'Леся Украинка, «Contra spem spero!», 1890',
        translation: [
          ['Прочь, думы, тучи вы осенние!', 'Ведь нынче — золотая весна!', 'Неужто в горе, в причитаньях', 'Пройдут младые времена?'],
          ['Я на бедной, унылой пашне', 'Буду сеять цветы яркие,', 'Буду сеять цветы на морозе,', 'Буду лить на них слёзы горькие.'],
          ['В долгую, тёмную ночь незрячую', 'Не сомкну ни на миг очей,', 'Всё искать буду звезду путеводную,', 'Ясную владычицу тёмных ночей.'],
          ['Да! Я буду сквозь слёзы смеяться,', 'Среди горя песни петь,', 'Без надежды всё же надеяться,', 'Буду жить! Прочь, думы, — прочь!']
        ],
        translationSign: 'перевод сделан для этой игры'
      }
    },

    ui: {
      lang: 'язык', loading: 'загрузка',
      sub: 'новелла о мыслях, потере и надежде', foot: 'лучше всего — в наушниках и в тишине',
      formQ: 'как к тебе обращаться?', forms: ['ты пришёл', 'ты пришла', 'ты пришли'],
      cont: 'продолжить', restart: 'начать сначала',
      pause: 'пауза', resume: 'продолжить', sound: 'звук: ', on: 'вкл.', off: 'выкл.',
      restartQ: 'весь прогресс пропадёт', no: 'нет', yesRestart: 'да, сначала', volume: 'громкость',
      keys: 'WASD / стрелки — движение · E / Enter — действие · Esc — пауза · M — звук · F — полный экран',
      fs: 'полный экран', fsPc: 'F11 или F', fsAndroid: 'кнопка ниже', fsIphone: 'Поделиться → На экран «Домой»', fsBtn: 'на весь экран',
      supTitle: 'поддержать автора', supText: 'Если «yourself.» откликнулось — можно поддержать дальнейшую работу.',
      patreon: 'поддержать на Patreon',
      share: 'поделиться', shareText: 'Короткая новелла о мыслях, потере и надежде.', linkCopied: 'ссылка скопирована', next: 'далее',
      cRooms: 'комнаты и то, что в них живёт', cAuthor: 'автор', cAuthorLine: 'идея, сценарий, код и свет',
      cMusic: 'музыка', cFonts: 'шрифты',
      rights: '© 2026 {author}. Все права на игру защищены.', rightsSub: 'Музыка, шрифты и стихотворение принадлежат их авторам.',
      hintMove: 'WASD / стрелки — движение · E / Enter — действие · Esc — пауза', hintMoveTouch: 'джойстик — движение · кнопка — действие',
      soundNote: 'этот браузер не воспроизводит часть музыки (.ogg) — игра работает, но тише'
    }
  };

  /* ---------- switching ---------- */
  Y.TEXTS = TEXTS;
  Y.TEXT = {};
  Y.T = {
    form: 'm', lang: 'uk', langs: ['uk', 'en', 'ru'],
    langNames: { uk: 'українська', en: 'English', ru: 'русский' },
    // picks {he|she|they} by the chosen form
    g(str) {
      const i = FORMS[Y.T.form] || 0;
      return String(str).replace(/\{([^{}]*\|[^{}]*)\}/g, (_, inner) => {
        const parts = inner.split('|');
        return parts[Math.min(i, parts.length - 1)];
      });
    },
    setLang(lang) {
      if (!TEXTS[lang]) lang = 'uk';
      Y.T.lang = lang;
      for (const k of Object.keys(Y.TEXT)) delete Y.TEXT[k];
      Object.assign(Y.TEXT, TEXTS[lang]);
      document.documentElement.lang = lang;
    }
  };
  Y.T.setLang('uk');
})(window.Y);
