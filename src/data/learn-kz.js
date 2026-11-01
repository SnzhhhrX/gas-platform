// Новые уроки модуля «Казахстан». Каждая строка задана тройкой [ru, en, kk]:
// русский текст идёт в урок, а переводы собираются в KZ_I18N и подключаются в lib/i18n.js.
// Порядок вопросов: от лёгких на узнавание → задания на карте → на несколько ответов → сложные.
export const KZ_I18N = []
const add = (ru, en, kk) => { KZ_I18N.push([ru, en, kk]); return ru }
const S = (x) => (Array.isArray(x) ? add(x[0], x[1], x[2]) : x)

const Q = (q, o, why, extra) => ({ q: S(q), options: o.map(S), answer: 0, why: S(why), ...extra })
const TF = (q, yes, why) => ({ type: 'tf', q: S(q), options: ['Верно', 'Неверно'], answer: yes ? 0 : 1, why: S(why) })
const MULTI = (q, o, answer, why) => ({ type: 'multi', q: S(q), options: o.map(S), answer, why: S(why) })
const MAP = (name, id, why) => ({ type: 'map', q: `Найдите: ${name}`, answer: id, region: 'world', why: S(why) })
const SHOW = (id, o, why) => ({ type: 'mapid', q: S(['Какая страна выделена на глобусе?', 'Which country is highlighted on the globe?', 'Глобуста қай ел белгіленген?']), target: id, options: o.map(S), answer: 0, why: S(why) })
const L = (id, title, text, questions) => ({ id, title: S(title), text: S(text), questions })

// Частые названия
const RU = ['Россия', 'Russia', 'Ресей'], CN = ['Китай', 'China', 'Қытай'], UZ = ['Узбекистан', 'Uzbekistan', 'Өзбекстан']
const MN = ['Монголия', 'Mongolia', 'Моңғолия'], AF = ['Афганистан', 'Afghanistan', 'Ауғанстан']

export const KZ_LESSONS = [
  L('kazakhstan-7', ['Соседи и границы', 'Neighbours and borders', 'Көршілер мен шекаралар'],
    ['Казахстан граничит с пятью странами: Россией, Китаем, Киргизией, Узбекистаном и Туркменией. Граница с Россией — самая длинная сухопутная граница в мире.',
      'Kazakhstan borders five countries: Russia, China, Kyrgyzstan, Uzbekistan and Turkmenistan. The border with Russia is the longest continuous land border in the world.',
      'Қазақстан бес елмен шектеседі: Ресей, Қытай, Қырғызстан, Өзбекстан және Түрікменстан. Ресеймен шекара — әлемдегі ең ұзын үздіксіз құрлықтағы шекара.'], [
      Q(['С каким количеством стран граничит Казахстан?', 'How many countries does Kazakhstan border?', 'Қазақстан неше елмен шектеседі?'],
        [['С пятью', 'Five', 'Бесеуімен'], ['С тремя', 'Three', 'Үшеуімен'], ['С восемью', 'Eight', 'Сегізімен']],
        ['Россия, Китай, Киргизия, Узбекистан и Туркмения.', 'Russia, China, Kyrgyzstan, Uzbekistan and Turkmenistan.', 'Ресей, Қытай, Қырғызстан, Өзбекстан және Түрікменстан.']),
      MAP('Казахстан', 398, ['Казахстан — девятая по площади страна мира.', 'Kazakhstan is the ninth-largest country in the world.', 'Қазақстан — аумағы бойынша әлемдегі тоғызыншы ел.']),
      Q(['Какая страна лежит к северу от Казахстана?', 'Which country lies to the north of Kazakhstan?', 'Қазақстанның солтүстігінде қай ел орналасқан?'],
        [RU, CN, UZ], ['Россия — северный сосед, общая граница больше 7 500 км.', 'Russia is the northern neighbour; the shared border is over 7,500 km long.', 'Ресей — солтүстік көрші, ортақ шекара 7 500 км-ден асады.']),
      SHOW(860, [UZ, MN, AF], ['Узбекистан граничит с Казахстаном на юге.', 'Uzbekistan borders Kazakhstan in the south.', 'Өзбекстан Қазақстанмен оңтүстікте шектеседі.']),
      TF(['У Казахстана есть выход к океану.', 'Kazakhstan has access to the ocean.', 'Қазақстанның мұхитқа шығатын жолы бар.'], false,
        ['Это самая большая страна мира без выхода к океану; у неё есть берег лишь у Каспия — это озеро.', 'It is the largest landlocked country; its only coast is on the Caspian, which is a lake.', 'Бұл — мұхитқа шығатын жолы жоқ ең үлкен ел; тек Каспийдің жағасы бар, ол — көл.']),
      MULTI(['Какие страны граничат с Казахстаном?', 'Which countries border Kazakhstan?', 'Қазақстанмен қай елдер шектеседі?'],
        [CN, ['Киргизия', 'Kyrgyzstan', 'Қырғызстан'], MN, ['Таджикистан', 'Tajikistan', 'Тәжікстан']], [0, 1],
        ['Монголия и Таджикистан рядом, но общей границы с Казахстаном нет.', 'Mongolia and Tajikistan are nearby but share no border with Kazakhstan.', 'Моңғолия мен Тәжікстан жақын, бірақ Қазақстанмен ортақ шекарасы жоқ.']),
      MAP('Туркмения', 795, ['Туркмения лежит к югу от Казахстана, на берегу Каспия.', 'Turkmenistan lies south of Kazakhstan, on the Caspian coast.', 'Түрікменстан Қазақстаннан оңтүстікте, Каспий жағасында орналасқан.']),
      Q(['Какова длина границы Казахстана с Россией?', 'About how long is the Kazakhstan–Russia border?', 'Қазақстан мен Ресей шекарасының ұзындығы шамамен қанша?'],
        [['Около 7 500 км', 'About 7,500 km', 'Шамамен 7 500 км'], ['Около 1 500 км', 'About 1,500 km', 'Шамамен 1 500 км'], ['Около 20 000 км', 'About 20,000 km', 'Шамамен 20 000 км']],
        ['Это самая длинная непрерывная сухопутная граница в мире.', 'It is the longest continuous land border in the world.', 'Бұл — әлемдегі ең ұзын үздіксіз құрлықтағы шекара.']),
    ]),

  L('kazakhstan-8', ['Реки и озёра', 'Rivers and lakes', 'Өзендер мен көлдер'],
    ['Воды Казахстана — это огромный Каспий, уникальный Балхаш, сильно обмелевшее Аральское море и реки Иртыш, Урал, Сырдарья и Или.',
      'Kazakhstan’s waters include the vast Caspian, unique Lake Balkhash, the heavily shrunken Aral Sea and the rivers Irtysh, Ural, Syr Darya and Ili.',
      'Қазақстан суларына ұланғайыр Каспий, бірегей Балқаш, қатты тартылған Арал теңізі және Ертіс, Жайық, Сырдария, Іле өзендері кіреді.'], [
      Q(['Какое озеро Казахстана наполовину пресное, наполовину солёное?', 'Which Kazakh lake is half fresh and half salty?', 'Қазақстандағы қай көлдің жартысы тұщы, жартысы тұзды?'],
        [['Балхаш', 'Balkhash', 'Балқаш'], ['Алаколь', 'Alakol', 'Алакөл'], ['Зайсан', 'Zaysan', 'Зайсан']],
        ['Западная часть Балхаша пресная, восточная — солёная.', 'The western part of Balkhash is fresh, the eastern part is salty.', 'Балқаштың батыс бөлігі тұщы, шығыс бөлігі тұзды.']),
      Q(['Какое море омывает Казахстан на западе?', 'Which sea borders Kazakhstan in the west?', 'Қазақстанды батыстан қай теңіз шайып жатыр?'],
        [['Каспийское', 'The Caspian', 'Каспий'], ['Чёрное', 'The Black Sea', 'Қара теңіз'], ['Аральское', 'The Aral Sea', 'Арал']],
        ['Каспий — крупнейший замкнутый водоём мира, а Актау — его порт.', 'The Caspian is the largest enclosed body of water; Aktau is a port on it.', 'Каспий — әлемдегі ең үлкен тұйық су айдыны, ал Ақтау — оның порты.']),
      TF(['Аральское море обмелело из-за забора воды на орошение.', 'The Aral Sea shrank because water was diverted for irrigation.', 'Арал теңізі суаруға су алынғандықтан тартылды.'], true,
        ['Воду Амударьи и Сырдарьи забирали на хлопковые поля, и море быстро высыхало.', 'Water from the Amu Darya and Syr Darya went to cotton fields, so the sea dried up fast.', 'Әмудария мен Сырдарияның суы мақта алқаптарына бұрылды, сондықтан теңіз тез тартылды.']),
      Q(['В какую страну уходит Иртыш, покидая Казахстан?', 'Which country does the Irtysh enter after leaving Kazakhstan?', 'Ертіс Қазақстаннан шығып, қай елге ағады?'],
        [RU, CN, UZ], ['Иртыш течёт из Китая через Казахстан в Россию и впадает в Обь.', 'The Irtysh flows from China through Kazakhstan into Russia and joins the Ob.', 'Ертіс Қытайдан Қазақстан арқылы Ресейге ағып, Обь өзеніне құяды.']),
      MULTI(['Какие водоёмы находятся в Казахстане?', 'Which of these water bodies are in Kazakhstan?', 'Мына су айдындарының қайсысы Қазақстанда?'],
        [['Балхаш', 'Balkhash', 'Балқаш'], ['Алаколь', 'Alakol', 'Алакөл'], ['Байкал', 'Baikal', 'Байкал'], ['Ладога', 'Ladoga', 'Ладога']], [0, 1],
        ['Байкал и Ладога находятся в России.', 'Baikal and Ladoga are in Russia.', 'Байкал мен Ладога Ресейде орналасқан.']),
      Q(['Куда впадает Сырдарья?', 'Where does the Syr Darya flow?', 'Сырдария қайда құяды?'],
        [['В Аральское море', 'Into the Aral Sea', 'Арал теңізіне'], ['В Каспийское море', 'Into the Caspian Sea', 'Каспий теңізіне'], ['В озеро Балхаш', 'Into Lake Balkhash', 'Балқаш көліне']],
        ['Сырдарья — одна из двух рек, питавших Арал.', 'The Syr Darya is one of the two rivers that fed the Aral.', 'Сырдария — Аралды сумен қамтамасыз еткен екі өзеннің бірі.']),
      Q(['Какая река впадает в озеро Балхаш?', 'Which river flows into Lake Balkhash?', 'Балқаш көліне қай өзен құяды?'],
        [['Или', 'The Ili', 'Іле'], ['Урал', 'The Ural', 'Жайық'], ['Иртыш', 'The Irtysh', 'Ертіс']],
        ['Река Или приносит Балхашу большую часть воды.', 'The Ili brings most of Balkhash’s water.', 'Іле өзені Балқашқа судың көп бөлігін әкеледі.']),
      Q(['Какая река образует часть условной границы Европы и Азии на западе Казахстана?', 'Which river forms part of the conventional Europe–Asia border in western Kazakhstan?', 'Қазақстанның батысында Еуропа мен Азия шекарасының бір бөлігін қай өзен құрайды?'],
        [['Урал', 'The Ural', 'Жайық'], ['Волга', 'The Volga', 'Еділ'], ['Амударья', 'The Amu Darya', 'Әмудария']],
        ['Урал (Жайык) впадает в Каспий и считается частью границы Европы и Азии.', 'The Ural (Zhayyq) flows into the Caspian and marks part of the Europe–Asia border.', 'Жайық Каспийге құяды және Еуропа мен Азия шекарасының бір бөлігі болып саналады.']),
    ]),

  L('kazakhstan-9', ['Города и регионы', 'Cities and regions', 'Қалалар мен өңірлер'],
    ['Главные города Казахстана — Астана, Алматы и Шымкент. Они лежат в разных природных зонах: от степи до подножия гор.',
      'The main cities of Kazakhstan are Astana, Almaty and Shymkent. They lie in different natural zones, from steppe to mountain foothills.',
      'Қазақстанның басты қалалары — Астана, Алматы және Шымкент. Олар даладан тау бөктеріне дейінгі әртүрлі табиғат белдеулерінде орналасқан.'], [
      Q(['Какой город — столица Казахстана?', 'Which city is the capital of Kazakhstan?', 'Қазақстанның астанасы қай қала?'],
        [['Астана', 'Astana', 'Астана'], ['Алматы', 'Almaty', 'Алматы'], ['Шымкент', 'Shymkent', 'Шымкент']],
        ['Астана стоит в степи на реке Ишим (Есиль).', 'Astana stands in the steppe on the Ishim (Esil) river.', 'Астана далада, Есіл өзенінің жағасында тұр.']),
      Q(['Какой город самый крупный в Казахстане?', 'Which is the largest city in Kazakhstan?', 'Қазақстандағы ең ірі қала қайсы?'],
        [['Алматы', 'Almaty', 'Алматы'], ['Астана', 'Astana', 'Астана'], ['Караганда', 'Karaganda', 'Қарағанды']],
        ['Алматы — крупнейший город и деловой центр, у подножия гор Заилийский Алатау.', 'Almaty is the largest city and business centre, at the foot of the Zailiysky Alatau mountains.', 'Алматы — ең ірі қала әрі іскерлік орталық, Іле Алатауының бөктерінде орналасқан.']),
      TF(['Астана — столица с 1991 года, с независимости.', 'Astana has been the capital since independence in 1991.', 'Астана 1991 жылдан, тәуелсіздіктен бері астана.'], false,
        ['До 1997 года столицей был Алматы; в Астану столицу перенесли в 1997 году.', 'Until 1997 the capital was Almaty; it moved to Astana in 1997.', '1997 жылға дейін астана Алматы болды; Астанаға 1997 жылы көшірілді.']),
      Q(['Какой город — порт на берегу Каспия?', 'Which city is a port on the Caspian coast?', 'Каспий жағасындағы порт қай қала?'],
        [['Актау', 'Aktau', 'Ақтау'], ['Павлодар', 'Pavlodar', 'Павлодар'], ['Семей', 'Semey', 'Семей']],
        ['Актау — порт на Каспии в Мангистауской области.', 'Aktau is a Caspian port in the Mangystau region.', 'Ақтау — Маңғыстау облысындағы Каспий порты.']),
      Q(['Какой город в центре страны известен угольной промышленностью?', 'Which central city is known for its coal industry?', 'Елдің орталығындағы қайсы қала көмір өнеркәсібімен танымал?'],
        [['Караганда', 'Karaganda', 'Қарағанды'], ['Алматы', 'Almaty', 'Алматы'], ['Атырау', 'Atyrau', 'Атырау']],
        ['Караганда — центр Карагандинского угольного бассейна.', 'Karaganda is the centre of the Karaganda coal basin.', 'Қарағанды — Қарағанды көмір бассейнінің орталығы.']),
      Q(['Какой южный город входит в тройку крупнейших?', 'Which southern city is among the three largest?', 'Оңтүстіктегі қай қала үш ірі қаланың қатарында?'],
        [['Шымкент', 'Shymkent', 'Шымкент'], ['Костанай', 'Kostanay', 'Қостанай'], ['Петропавловск', 'Petropavlovsk', 'Петропавл']],
        ['Шымкент — один из трёх городов республиканского значения.', 'Shymkent is one of the three cities of republican significance.', 'Шымкент — республикалық маңызы бар үш қаланың бірі.']),
      MULTI(['Какие города находятся в Казахстане?', 'Which of these cities are in Kazakhstan?', 'Мына қалалардың қайсысы Қазақстанда?'],
        [['Алматы', 'Almaty', 'Алматы'], ['Астана', 'Astana', 'Астана'], ['Бишкек', 'Bishkek', 'Бішкек'], ['Ташкент', 'Tashkent', 'Ташкент']], [0, 1],
        ['Бишкек — столица Киргизии, Ташкент — Узбекистана.', 'Bishkek is the capital of Kyrgyzstan, Tashkent of Uzbekistan.', 'Бішкек — Қырғызстан, Ташкент — Өзбекстан астанасы.']),
      Q(['Как называлась столица в 2019–2022 годах?', 'What was the capital called in 2019–2022?', 'Астана 2019–2022 жылдары қалай аталды?'],
        [['Нур-Султан', 'Nur-Sultan', 'Нұр-Сұлтан'], ['Акмола', 'Akmola', 'Ақмола'], ['Целиноград', 'Tselinograd', 'Целиноград']],
        ['В 2019 году Астану переименовали в Нур-Султан, в 2022 году вернули прежнее название.', 'Astana was renamed Nur-Sultan in 2019 and got its name back in 2022.', 'Астана 2019 жылы Нұр-Сұлтан болып өзгертілді, 2022 жылы бұрынғы атауы қайтарылды.']),
    ]),

  L('kazakhstan-10', ['Степи, пустыни и горы', 'Steppes, deserts and mountains', 'Дала, шөл және таулар'],
    ['С севера на юг природа Казахстана меняется: лесостепи и степи, полупустыни, пустыни, а на юго-востоке и востоке поднимаются горы — Тянь-Шань и Алтай.',
      'From north to south nature changes: forest-steppe and steppe, semi-deserts, deserts, and in the south-east and east rise mountains — the Tien Shan and the Altai.',
      'Солтүстіктен оңтүстікке қарай табиғат өзгереді: орманды дала мен дала, шөлейт, шөл, ал оңтүстік-шығыс пен шығыста Тянь-Шань және Алтай таулары көтеріледі.'], [
      Q(['Какая зона лежит на севере Казахстана?', 'Which zone lies in the north of Kazakhstan?', 'Қазақстанның солтүстігінде қай табиғат белдеуі орналасқан?'],
        [['Степь и лесостепь', 'Steppe and forest-steppe', 'Дала және орманды дала'], ['Пустыня', 'Desert', 'Шөл'], ['Высокогорные льды', 'High-mountain ice', 'Биік таудағы мұз']],
        ['На севере много плодородных чернозёмов, поэтому там выращивают пшеницу.', 'The north has fertile black soils, so wheat is grown there.', 'Солтүстікте құнарлы қара топырақ көп, сондықтан онда бидай егіледі.']),
      Q(['Какие горы тянутся на востоке Казахстана?', 'Which mountains lie in the east of Kazakhstan?', 'Қазақстанның шығысында қандай таулар созылған?'],
        [['Алтай', 'The Altai', 'Алтай'], ['Кавказ', 'The Caucasus', 'Кавказ'], ['Анды', 'The Andes', 'Анд']],
        ['Казахстанский Алтай — горная область на востоке страны.', 'The Kazakh Altai is the mountain region in the east.', 'Қазақстандық Алтай — елдің шығысындағы таулы өңір.']),
      Q(['Как называется высшая точка Казахстана?', 'What is the highest point of Kazakhstan?', 'Қазақстанның ең биік нүктесі қалай аталады?'],
        [['Хан-Тенгри', 'Khan Tengri', 'Хан Тәңірі'], ['Белуха', 'Belukha', 'Мұзтау'], ['Эльбрус', 'Elbrus', 'Эльбрус']],
        ['Хан-Тенгри (около 7 010 м) — в Тянь-Шане, на границе с Киргизией.', 'Khan Tengri (about 7,010 m) is in the Tien Shan, on the border with Kyrgyzstan.', 'Хан Тәңірі (шамамен 7 010 м) — Тянь-Шаньда, Қырғызстанмен шекарада.']),
      TF(['Большая часть юга и запада Казахстана занята пустынями и полупустынями.', 'Most of the south and west of Kazakhstan is deserts and semi-deserts.', 'Қазақстанның оңтүстігі мен батысының көп бөлігін шөл мен шөлейт алып жатыр.'], true,
        ['Осадков мало, а лето жаркое и сухое.', 'Rainfall is low, and summers are hot and dry.', 'Жауын-шашын аз, жаз ыстық әрі құрғақ.']),
      Q(['Какое животное степей известно необычным длинным носом?', 'Which steppe animal is known for its unusual long nose?', 'Даланың қай жануары ерекше ұзын мұрнымен танымал?'],
        [['Сайгак', 'The saiga', 'Ақбөкен'], ['Бурый медведь', 'The brown bear', 'Қоңыр аю'], ['Тигр', 'The tiger', 'Жолбарыс']],
        ['Сайгак — степная антилопа; нос согревает и очищает воздух.', 'The saiga is a steppe antelope; its nose warms and filters the air.', 'Ақбөкен — дала бөкені; мұрны ауаны жылытады және тазартады.']),
      MULTI(['Что характерно для степи?', 'What is typical of the steppe?', 'Далаға не тән?'],
        [['Равнинный рельеф', 'Flat terrain', 'Жазық жер бедері'], ['Травянистая растительность', 'Grassy vegetation', 'Шөптесін өсімдіктер'], ['Вечная мерзлота', 'Permafrost', 'Мәңгі тоң'], ['Густые тропические леса', 'Dense tropical forest', 'Қалың тропикалық орман']], [0, 1],
        ['Вечная мерзлота — это север, тропические леса — жаркий влажный пояс.', 'Permafrost belongs to the far north; tropical forests to hot, humid zones.', 'Мәңгі тоң — солтүстікке, тропикалық орман — ыстық ылғалды белдеуге тән.']),
      Q(['Что такое Чарынский каньон?', 'What is the Charyn Canyon?', 'Шарын шатқалы деген не?'],
        [['Каньон реки Чарын, похожий на Гранд-Каньон', 'A canyon cut by the Charyn river, similar to the Grand Canyon', 'Шарын өзені тілген, Гранд-Каньонға ұқсас шатқал'], ['Озеро в горах Алтая', 'A lake in the Altai', 'Алтайдағы көл'], ['Пустыня на берегу Каспия', 'A desert on the Caspian coast', 'Каспий жағасындағы шөл']],
        ['Он в Алматинской области; красные скалы река вырезала за миллионы лет.', 'It lies in the Almaty region; the river carved its red rocks over millions of years.', 'Ол Алматы облысында; қызыл жартастарды өзен миллиондаған жыл бойы ойып жасаған.']),
      Q(['Почему в горах юга осадков больше, чем на равнине?', 'Why do the mountains in the south get more precipitation than the plains?', 'Оңтүстіктегі таулар неге жазыққа қарағанда көбірек жауын-шашын алады?'],
        [['Влажный воздух поднимается по склонам и остывает', 'Moist air rises up the slopes and cools', 'Ылғалды ауа беткейлермен көтеріліп суиды'], ['Горы нагревают воздух', 'Mountains heat the air', 'Таулар ауаны қыздырады'], ['В горах не бывает облаков', 'There are no clouds in the mountains', 'Тауда бұлт болмайды']],
        ['Поднимаясь, воздух остывает, пар конденсируется — идут дожди и снег.', 'As air rises it cools, vapour condenses and rain or snow falls.', 'Көтерілген ауа суып, бу конденсацияланады — жаңбыр мен қар жауады.']),
    ]),

  L('kazakhstan-11', ['Богатства недр', 'Mineral wealth', 'Жер қойнауының байлығы'],
    ['Казахстан богат полезными ископаемыми: нефть, газ, уголь, металлы и уран. Страна — один из мировых лидеров по добыче урана.',
      'Kazakhstan is rich in minerals: oil, gas, coal, metals and uranium. It is one of the world’s top uranium producers.',
      'Қазақстан пайдалы қазбаларға бай: мұнай, газ, көмір, металдар және уран. Ел — уран өндіру бойынша әлемдік көшбасшылардың бірі.'], [
      Q(['Какой ресурс Казахстан добывает больше всех в мире?', 'Which resource does Kazakhstan mine more of than any other country?', 'Қазақстан қай шикізатты әлемде ең көп өндіреді?'],
        [['Уран', 'Uranium', 'Уран'], ['Алмазы', 'Diamonds', 'Гауһар тас'], ['Золото', 'Gold', 'Алтын']],
        ['Казахстан даёт около 40% мирового урана.', 'Kazakhstan supplies about 40% of the world’s uranium.', 'Қазақстан әлемдік уранның шамамен 40%-ын береді.']),
      Q(['Что добывают вокруг Караганды?', 'What is mined around Karaganda?', 'Қарағанды маңында не өндіріледі?'],
        [['Каменный уголь', 'Coal', 'Тас көмір'], ['Нефть', 'Oil', 'Мұнай'], ['Соль', 'Salt', 'Тұз']],
        ['Карагандинский бассейн — один из главных угольных районов страны.', 'The Karaganda basin is one of the main coal regions.', 'Қарағанды бассейні — елдегі негізгі көмір аймақтарының бірі.']),
      Q(['В каком регионе находится нефтяное месторождение Тенгиз?', 'In which region is the Tengiz oil field?', 'Теңіз мұнай кен орны қай өңірде орналасқан?'],
        [['В Атырауской области', 'In the Atyrau region', 'Атырау облысында'], ['В Акмолинской области', 'In the Akmola region', 'Ақмола облысында'], ['В Алматинской области', 'In the Almaty region', 'Алматы облысында']],
        ['Тенгиз — одно из самых глубоких нефтяных месторождений мира, рядом с Каспием.', 'Tengiz is one of the deepest oil fields in the world, near the Caspian.', 'Теңіз — әлемдегі ең терең мұнай кен орындарының бірі, Каспийге жақын.']),
      TF(['Казахстан — крупный экспортёр зерна, прежде всего пшеницы.', 'Kazakhstan is a major grain exporter, especially of wheat.', 'Қазақстан — астықты, әсіресе бидайды ірі экспорттаушы.'], true,
        ['Северные степи с чернозёмом — главная житница страны.', 'The northern steppes with black soil are the country’s breadbasket.', 'Қара топырақты солтүстік дала — елдің басты астық қоймасы.']),
      Q(['Что такое Кашаган?', 'What is Kashagan?', 'Қашаған деген не?'],
        [['Крупное нефтяное месторождение на Каспии', 'A large oil field in the Caspian', 'Каспийдегі ірі мұнай кен орны'], ['Гора на Алтае', 'A mountain in the Altai', 'Алтайдағы тау'], ['Река в Мангистау', 'A river in Mangystau', 'Маңғыстаудағы өзен']],
        ['Кашаган — одно из крупнейших морских нефтяных месторождений мира.', 'Kashagan is one of the largest offshore oil fields in the world.', 'Қашаған — әлемдегі ең ірі теңіздегі мұнай кен орындарының бірі.']),
      MULTI(['Что Казахстан производит в больших объёмах?', 'Which of these does Kazakhstan produce in large amounts?', 'Қазақстан мыналардың қайсысын көп өндіреді?'],
        [['Нефть', 'Oil', 'Мұнай'], ['Уран', 'Uranium', 'Уран'], ['Кофе', 'Coffee', 'Кофе'], ['Какао', 'Cocoa', 'Какао']], [0, 1],
        ['Кофе и какао растут только в тропиках.', 'Coffee and cocoa grow only in the tropics.', 'Кофе мен какао тек тропикте өседі.']),
      Q(['Для чего используют уран?', 'What is uranium used for?', 'Уран не үшін қолданылады?'],
        [['Как топливо для атомных станций', 'Fuel for nuclear power plants', 'Атом станцияларының отыны ретінде'], ['Для строительства дорог', 'Building roads', 'Жол салу үшін'], ['Как удобрение для пшеницы', 'Fertiliser for wheat', 'Бидайға арналған тыңайтқыш ретінде']],
        ['Уран — топливо АЭС, очень энергоёмкий ресурс.', 'Uranium is nuclear fuel — an extremely energy-rich resource.', 'Уран — АЭС отыны, өте энергияға бай ресурс.']),
      Q(['Почему Казахстану трудно вывозить ресурсы морем?', 'Why is it hard for Kazakhstan to ship resources by sea?', 'Қазақстанға ресурстарды теңізбен шығару неге қиын?'],
        [['У страны нет выхода к океану', 'The country has no ocean access', 'Елдің мұхитқа шығатын жолы жоқ'], ['Все ресурсы лежат на островах', 'All resources lie on islands', 'Барлық ресурс аралдарда жатыр'], ['Каспий слишком горячий', 'The Caspian is too hot', 'Каспий тым ыстық']],
        ['Грузы идут по трубопроводам, железным дорогам и через Каспий и соседние страны.', 'Cargo goes by pipelines, railways, and across the Caspian and neighbouring countries.', 'Жүк құбыр, темір жол арқылы, сондай-ақ Каспий мен көрші елдер арқылы тасымалданады.']),
    ]),

  L('kazakhstan-12', ['Символы, культура и космос', 'Symbols, culture and space', 'Рәміздер, мәдениет және ғарыш'],
    ['Казахстан — родина космодрома Байконур, степных кочевников, юрт и праздника Наурыз. На флаге — золотое солнце с парящим орлом.',
      'Kazakhstan is home to the Baikonur cosmodrome, steppe nomads, yurts and the Nauryz holiday. The flag shows a golden sun with a soaring eagle.',
      'Қазақстан — Байқоңыр ғарыш айлағының, дала көшпенділерінің, киіз үйдің және Наурыз мейрамының отаны. Туда қалықтаған бүркіті бар алтын күн бейнеленген.'], [
      Q(['Чей это флаг?', 'Whose flag is this?', 'Бұл кімнің туы?'],
        [['Казахстана', 'Kazakhstan', 'Қазақстанның'], ['Узбекистана', 'Uzbekistan', 'Өзбекстанның'], ['Туркмении', 'Turkmenistan', 'Түрікменстанның']],
        ['На флаге — золотое солнце и степной орёл на небесно-голубом фоне.', 'The flag shows a golden sun and a steppe eagle on a sky-blue field.', 'Тудағы көгілдір фонда алтын күн мен дала бүркіті бейнеленген.'], { img: 'flag:kz' }),
      Q(['Какой цвет у фона флага Казахстана?', 'What colour is the background of Kazakhstan’s flag?', 'Қазақстан туының фоны қандай түсті?'],
        [['Небесно-голубой', 'Sky blue', 'Көгілдір'], ['Красный', 'Red', 'Қызыл'], ['Зелёный', 'Green', 'Жасыл']],
        ['Голубой — символ неба, мира и единства.', 'Blue stands for the sky, peace and unity.', 'Көгілдір — аспанның, бейбітшілік пен бірліктің белгісі.']),
      Q(['Как называется жилище кочевников-казахов?', 'What is the traditional home of Kazakh nomads called?', 'Қазақ көшпенділерінің дәстүрлі баспанасы қалай аталады?'],
        [['Юрта (киіз үй)', 'A yurt (kiiz uy)', 'Киіз үй'], ['Чум', 'A chum', 'Чум'], ['Иглу', 'An igloo', 'Иглу']],
        ['Юрта — разборный дом из войлока и деревянного каркаса, удобный для кочевой жизни.', 'The yurt is a collapsible felt-and-wood home, ideal for nomadic life.', 'Киіз үй — көшпелі өмірге ыңғайлы, киіз бен ағаш сүйектен жасалған жиналмалы үй.'], { img: 'fig:kzyurt' }),
      Q(['Какой праздник встречают 21–22 марта?', 'Which holiday is celebrated on 21–22 March?', '21–22 наурызда қандай мейрам тойланады?'],
        [['Наурыз', 'Nauryz', 'Наурыз'], ['Новый год', 'New Year’s Day', 'Жаңа жыл'], ['Масленица', 'Maslenitsa', 'Масленица']],
        ['Наурыз — праздник весеннего равноденствия и нового года по древнему календарю.', 'Nauryz marks the spring equinox and the new year in the ancient calendar.', 'Наурыз — көктемгі күн мен түннің теңелуін және көне күнтізбе бойынша жаңа жылды білдіреді.']),
      Q(['Какой космодром расположен в Казахстане?', 'Which cosmodrome is in Kazakhstan?', 'Қазақстанда қай ғарыш айлағы орналасқан?'],
        [['Байконур', 'Baikonur', 'Байқоңыр'], ['Плесецк', 'Plesetsk', 'Плесецк'], ['Восточный', 'Vostochny', 'Восточный']],
        ['Байконур — первый и крупнейший космодром мира; в 1957 году отсюда запустили первый спутник.', 'Baikonur is the world’s first and largest spaceport; the first satellite launched from here in 1957.', 'Байқоңыр — әлемдегі алғашқы әрі ең ірі ғарыш айлағы; 1957 жылы осы жерден тұңғыш жер серігі ұшырылды.']),
      TF(['Юрий Гагарин стартовал в космос с Байконура.', 'Yuri Gagarin launched into space from Baikonur.', 'Юрий Гагарин ғарышқа Байқоңырдан ұшты.'], true,
        ['Полёт состоялся 12 апреля 1961 года.', 'The flight took place on 12 April 1961.', 'Ұшу 1961 жылдың 12 сәуірінде болды.']),
      Q(['Какой инструмент — символ казахской культуры?', 'Which instrument is a symbol of Kazakh culture?', 'Қазақ мәдениетінің символы — қай аспап?'],
        [['Домбра', 'The dombra', 'Домбыра'], ['Балалайка', 'The balalaika', 'Балалайка'], ['Волынка', 'The bagpipes', 'Волынка']],
        ['У домбры две струны; на ней играют кюи — инструментальные пьесы.', 'The dombra has two strings and plays küis, instrumental pieces.', 'Домбыраның екі ішегі бар; онда күй орындалады.']),
      Q(['Какая башня в Астане с золотым шаром на вершине — символ столицы?', 'Which tower in Astana, topped with a golden sphere, is a symbol of the capital?', 'Астанадағы үстінде алтын шары бар қай мұнара астананың символы?'],
        [['Байтерек', 'Baiterek', 'Бәйтерек'], ['Эйфелева башня', 'The Eiffel Tower', 'Эйфель мұнарасы'], ['Останкинская башня', 'The Ostankino Tower', 'Останкино мұнарасы']],
        ['Байтерек («тополь») — монумент высотой 105 м, олицетворяющий древо жизни.', 'Baiterek (“poplar”) is a 105 m monument symbolising the tree of life.', 'Бәйтерек — өмір ағашын бейнелейтін биіктігі 105 м монумент.']),
    ]),
]

// Куда вставить: id главы → уроки. Новая глава добавляется в program.js
export const KZ_BY_CHAPTER = {
  'kazakhstan-land': ['kazakhstan-7', 'kazakhstan-8'],
  'kazakhstan-cities': ['kazakhstan-9'],
  'kazakhstan-nature': ['kazakhstan-10', 'kazakhstan-11'],
}
export const KZ_NEW_CHAPTER = { id: 'kazakhstan-culture', lessons: ['kazakhstan-12'] }

// Названия глав и интерфейс диалога выхода из урока
KZ_I18N.push(
  ['Культура и космос', 'Culture and space', 'Мәдениет және ғарыш'],
  ['Флаг, юрта, Байконур', 'Flag, yurt, Baikonur', 'Ту, киіз үй, Байқоңыр'],
  ['Выйти из урока?', 'Leave the lesson?', 'Сабақтан шығасыз ба?'],
  ['Прогресс этого урока не сохранится.', 'Your progress in this lesson won’t be saved.', 'Бұл сабақтағы прогресс сақталмайды.'],
  ['Остаться', 'Stay', 'Қалу'],
  ['Выйти', 'Leave', 'Шығу'],
)
