// assets/i18n/locales.js
// Every locale file, imported statically so switching needs no request.
// Adding a language: one import, one entry in `locales`, one in `registry`,
// then add the file to the service worker precache and bump its version.
// The steps, and every file involved, are in main-site/README.md under
// "Adding a language".
//
// The site's English is British English, so its code is en-GB (what <html
// lang> is set to). Its words live in en-GB.json. A reader whose browser asks for
// any other English (en-AU, plain en) gets this one, as the default; en-US,
// en-ARR (Pirate) and en-UWU (uwu) are there to be picked.
//
// Every language not written in Latin letters also has a romanised variant,
// tagged with the Latn script (ja-Latn, ko-Latn-KR, ru-Latn ...), named
// "<its name in Latin letters> (Romanised)", which shares its row in the
// dialog. Arabic has Arabizi (ar-Latn) as its romanised variant, and
// Palestinian Arabic its own (ar-Latn-PS), as Korean has one per region.
//
// Arabic comes as Modern Standard Arabic (ar) and as Palestinian Arabic
// (ar-PS, the spoken Levantine of Palestine), which share the العربية row.
// Malay also comes in Jawi, its Arabic-script spelling (ms-Arab), which
// shares the Bahasa Melayu row. Arabic, Hebrew and Jawi are written right to
// left (dir: 'rtl'); js/text-dir.js lists them too, to set the direction
// before first paint, so keep the two in step.
//
// The dialog lists languages in alphabetical order of their names (see
// groupLocales in switcher.js), so the order here only
// matters within a language: its first variant is the main one, listed first
// in its dropdown and picked when nothing else decides.
//
// `name` is each language's name in that language. Regional variants keep the
// region in brackets at the end ("中文（大陆）", "Español (México)"): the
// switcher groups variants that share a base code into one row, names the row
// after the part outside the brackets, and lists the bracketed part in its
// dropdown.
//
// `en` is the language's name in English, or several ("Bengali", "Bangla"),
// so the dialog's search finds it by them. `regions` lists the countries a
// language comes from, as ISO codes, where there is more than one; otherwise
// the country is taken from the code (zh-SG is Singapore) or, for a code
// without one, from the browser's likeliest country for it (ja is Japan).
// Country names are searched in English and in the page's language.

import enGB from './en-GB.json' with { type: 'json' };
import enUS from './en-US.json' with { type: 'json' };
import enARR from './en-ARR.json' with { type: 'json' };
import enUWU from './en-UWU.json' with { type: 'json' };
import zhSG from './zh-SG.json' with { type: 'json' };
import zhCN from './zh-CN.json' with { type: 'json' };
import zhTW from './zh-TW.json' with { type: 'json' };
import zhHK from './zh-HK.json' with { type: 'json' };
import zhLatn from './zh-Latn.json' with { type: 'json' };
import ms from './ms.json' with { type: 'json' };
import msArab from './ms-Arab.json' with { type: 'json' };
import ta from './ta.json' with { type: 'json' };
import taLatn from './ta-Latn.json' with { type: 'json' };
import id from './id.json' with { type: 'json' };
import hi from './hi.json' with { type: 'json' };
import hiLatn from './hi-Latn.json' with { type: 'json' };
import bn from './bn.json' with { type: 'json' };
import bnLatn from './bn-Latn.json' with { type: 'json' };
import te from './te.json' with { type: 'json' };
import teLatn from './te-Latn.json' with { type: 'json' };
import esMX from './es-MX.json' with { type: 'json' };
import esES from './es-ES.json' with { type: 'json' };
import nl from './nl.json' with { type: 'json' };
import eo from './eo.json' with { type: 'json' };
import th from './th.json' with { type: 'json' };
import thLatn from './th-Latn.json' with { type: 'json' };
import my from './my.json' with { type: 'json' };
import myLatn from './my-Latn.json' with { type: 'json' };
import lo from './lo.json' with { type: 'json' };
import loLatn from './lo-Latn.json' with { type: 'json' };
import vi from './vi.json' with { type: 'json' };
import tl from './tl.json' with { type: 'json' };
import tet from './tet.json' with { type: 'json' };
import ar from './ar.json' with { type: 'json' };
import arPS from './ar-PS.json' with { type: 'json' };
import arLatn from './ar-Latn.json' with { type: 'json' };
import arLatnPS from './ar-Latn-PS.json' with { type: 'json' };
import he from './he.json' with { type: 'json' };
import heLatn from './he-Latn.json' with { type: 'json' };
import koKR from './ko-KR.json' with { type: 'json' };
import koKP from './ko-KP.json' with { type: 'json' };
import koLatnKR from './ko-Latn-KR.json' with { type: 'json' };
import koLatnKP from './ko-Latn-KP.json' with { type: 'json' };
import ja from './ja.json' with { type: 'json' };
import jaLatn from './ja-Latn.json' with { type: 'json' };
import ru from './ru.json' with { type: 'json' };
import ruLatn from './ru-Latn.json' with { type: 'json' };
import uk from './uk.json' with { type: 'json' };
import ukLatn from './uk-Latn.json' with { type: 'json' };
import ptPT from './pt-PT.json' with { type: 'json' };
import da from './da.json' with { type: 'json' };
import nb from './nb.json' with { type: 'json' };
import nn from './nn.json' with { type: 'json' };
import sv from './sv.json' with { type: 'json' };
import bg from './bg.json' with { type: 'json' };
import bgLatn from './bg-Latn.json' with { type: 'json' };
import hr from './hr.json' with { type: 'json' };
import cs from './cs.json' with { type: 'json' };
import et from './et.json' with { type: 'json' };
import fi from './fi.json' with { type: 'json' };
import fr from './fr.json' with { type: 'json' };
import de from './de.json' with { type: 'json' };
import el from './el.json' with { type: 'json' };
import elLatn from './el-Latn.json' with { type: 'json' };
import hu from './hu.json' with { type: 'json' };
import ga from './ga.json' with { type: 'json' };
import gv from './gv.json' with { type: 'json' };
import cy from './cy.json' with { type: 'json' };
import gd from './gd.json' with { type: 'json' };
import sco from './sco.json' with { type: 'json' };
import it from './it.json' with { type: 'json' };
import la from './la.json' with { type: 'json' };
import lb from './lb.json' with { type: 'json' };
import lv from './lv.json' with { type: 'json' };
import lt from './lt.json' with { type: 'json' };
import mt from './mt.json' with { type: 'json' };
import pl from './pl.json' with { type: 'json' };
import ro from './ro.json' with { type: 'json' };
import sk from './sk.json' with { type: 'json' };
import sl from './sl.json' with { type: 'json' };

export const DEFAULT_LOCALE = 'en-GB';

export const locales = {
  'en-GB': enGB,
  'en-US': enUS,
  'en-ARR': enARR,
  'en-UWU': enUWU,
  'zh-SG': zhSG,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  'zh-HK': zhHK,
  'zh-Latn': zhLatn,
  'ms': ms,
  'ms-Arab': msArab,
  'ta': ta,
  'ta-Latn': taLatn,
  'id': id,
  'hi': hi,
  'hi-Latn': hiLatn,
  'bn': bn,
  'bn-Latn': bnLatn,
  'te': te,
  'te-Latn': teLatn,
  'es-MX': esMX,
  'es-ES': esES,
  'nl': nl,
  'eo': eo,
  'th': th,
  'th-Latn': thLatn,
  'my': my,
  'my-Latn': myLatn,
  'lo': lo,
  'lo-Latn': loLatn,
  'vi': vi,
  'tl': tl,
  'tet': tet,
  'ar': ar,
  'ar-PS': arPS,
  'ar-Latn': arLatn,
  'ar-Latn-PS': arLatnPS,
  'he': he,
  'he-Latn': heLatn,
  'ko-KR': koKR,
  'ko-KP': koKP,
  'ko-Latn-KR': koLatnKR,
  'ko-Latn-KP': koLatnKP,
  'ja': ja,
  'ja-Latn': jaLatn,
  'ru': ru,
  'ru-Latn': ruLatn,
  'uk': uk,
  'uk-Latn': ukLatn,
  'pt-PT': ptPT,
  'da': da,
  'nb': nb,
  'nn': nn,
  'sv': sv,
  'bg': bg,
  'bg-Latn': bgLatn,
  'hr': hr,
  'cs': cs,
  'et': et,
  'fi': fi,
  'fr': fr,
  'de': de,
  'el': el,
  'el-Latn': elLatn,
  'hu': hu,
  'ga': ga,
  'gv': gv,
  'cy': cy,
  'gd': gd,
  'sco': sco,
  'it': it,
  'la': la,
  'lb': lb,
  'lv': lv,
  'lt': lt,
  'mt': mt,
  'pl': pl,
  'ro': ro,
  'sk': sk,
  'sl': sl,
};

export const registry = [
  { code: 'en-GB', name: 'English (UK)', dir: 'ltr', en: 'British English' },
  { code: 'en-US', name: 'English (US)', dir: 'ltr', en: 'American English' },
  { code: 'en-ARR', name: 'English (Pirate)', dir: 'ltr', en: 'Pirate English' },
  { code: 'en-UWU', name: 'English (uwu)', dir: 'ltr', en: ['UwU', 'OwO', 'uwu speak', 'uwuspeak'] },
  { code: 'zh-SG', name: '中文（新加坡）', dir: 'ltr', en: ['Chinese', 'Simplified Chinese', 'Mandarin'] },
  { code: 'zh-CN', name: '中文（大陆）', dir: 'ltr', en: ['Chinese', 'Simplified Chinese', 'Mandarin', 'Mainland China'] },
  { code: 'zh-TW', name: '中文（台灣）', dir: 'ltr', en: ['Chinese', 'Traditional Chinese', 'Mandarin'] },
  { code: 'zh-HK', name: '中文（香港）', dir: 'ltr', en: ['Chinese', 'Traditional Chinese'] },
  { code: 'zh-Latn', name: 'Zhōngwén (Romanised)', dir: 'ltr', en: ['Chinese', 'Pinyin', 'Hanyu Pinyin', 'Mandarin', 'Romanised Chinese', 'Romanized Chinese'], regions: ['CN', 'SG', 'TW', 'HK'] },
  { code: 'ms', name: 'Bahasa Melayu', dir: 'ltr', en: ['Malay', 'Rumi'], regions: ['MY', 'BN', 'SG'] },
  { code: 'ms-Arab', name: 'بهاس ملايو (جاوي)', dir: 'rtl', en: ['Malay', 'Jawi', 'Malay in Jawi', 'Jawi script'], regions: ['MY', 'BN', 'SG', 'ID', 'TH'] },
  { code: 'ta', name: 'தமிழ்', dir: 'ltr', en: 'Tamil', regions: ['IN', 'LK', 'SG', 'MY'] },
  { code: 'ta-Latn', name: 'Tamil (Romanised)', dir: 'ltr', en: ['Tamil', 'Tanglish', 'Romanised Tamil', 'Romanized Tamil'], regions: ['IN', 'LK', 'SG', 'MY'] },
  { code: 'id', name: 'Bahasa Indonesia', dir: 'ltr', en: 'Indonesian' },
  { code: 'hi', name: 'हिन्दी', dir: 'ltr', en: 'Hindi' },
  { code: 'hi-Latn', name: 'Hindi (Romanised)', dir: 'ltr', en: ['Hindi', 'Hinglish', 'Romanised Hindi', 'Romanized Hindi'] },
  { code: 'bn', name: 'বাংলা', dir: 'ltr', en: ['Bengali', 'Bangla'], regions: ['BD', 'IN'] },
  { code: 'bn-Latn', name: 'Bangla (Romanised)', dir: 'ltr', en: ['Bengali', 'Bangla', 'Romanised Bengali', 'Romanized Bengali'], regions: ['BD', 'IN'] },
  { code: 'te', name: 'తెలుగు', dir: 'ltr', en: 'Telugu' },
  { code: 'te-Latn', name: 'Telugu (Romanised)', dir: 'ltr', en: ['Telugu', 'Romanised Telugu', 'Romanized Telugu'] },
  { code: 'es-MX', name: 'Español (México)', dir: 'ltr', en: ['Spanish', 'Mexican Spanish', 'Latin American Spanish'] },
  { code: 'es-ES', name: 'Español (España)', dir: 'ltr', en: ['Spanish', 'European Spanish', 'Castilian'] },
  { code: 'nl', name: 'Nederlands', dir: 'ltr', en: ['Dutch', 'Flemish'], regions: ['NL', 'BE', 'SR'] },
  { code: 'eo', name: 'Esperanto', dir: 'ltr', en: 'Esperanto' },
  { code: 'th', name: 'ไทย', dir: 'ltr', en: 'Thai' },
  { code: 'th-Latn', name: 'Phasa Thai (Romanised)', dir: 'ltr', en: ['Thai', 'RTGS', 'Romanised Thai', 'Romanized Thai'] },
  { code: 'my', name: 'မြန်မာ', dir: 'ltr', en: 'Burmese' },
  { code: 'my-Latn', name: 'Myanma (Romanised)', dir: 'ltr', en: ['Burmese', 'Romanised Burmese', 'Romanized Burmese'] },
  { code: 'lo', name: 'ລາວ', dir: 'ltr', en: 'Lao' },
  { code: 'lo-Latn', name: 'Phasa Lao (Romanised)', dir: 'ltr', en: ['Lao', 'Romanised Lao', 'Romanized Lao'] },
  { code: 'vi', name: 'Tiếng Việt', dir: 'ltr', en: 'Vietnamese' },
  { code: 'tl', name: 'Tagalog', dir: 'ltr', en: ['Tagalog', 'Filipino'] },
  { code: 'tet', name: 'Tetun', dir: 'ltr', en: ['Tetum', 'Tetun', 'East Timor'] },
  { code: 'ar', name: 'العربية', dir: 'rtl', en: ['Arabic', 'Modern Standard Arabic', 'MSA', 'Fusha'], regions: ['SA', 'EG', 'AE', 'JO', 'LB', 'SY', 'IQ', 'KW', 'QA', 'BH', 'OM', 'YE', 'MA', 'DZ', 'TN', 'LY', 'SD'] },
  { code: 'ar-PS', name: 'العربية (فلسطين)', dir: 'rtl', en: ['Arabic', 'Palestinian Arabic', 'Levantine Arabic', 'Palestinian'] },
  { code: 'ar-Latn', name: 'Arabi (Romanised)', dir: 'ltr', en: ['Arabic', 'Arabizi', 'Franco-Arabic', 'Arabish', 'Romanised Arabic', 'Romanized Arabic'], regions: ['SA', 'EG', 'AE', 'JO', 'LB', 'SY', 'IQ', 'KW', 'QA', 'BH', 'OM', 'YE', 'PS', 'MA', 'DZ', 'TN', 'LY', 'SD'] },
  { code: 'ar-Latn-PS', name: 'Falastini (Romanised)', dir: 'ltr', en: ['Arabic', 'Palestinian Arabic', 'Levantine Arabic', 'Palestinian', 'Arabizi', 'Romanised Palestinian Arabic', 'Romanized Palestinian Arabic'] },
  { code: 'he', name: 'עברית', dir: 'rtl', en: ['Hebrew', 'Ivrit', 'Modern Hebrew'] },
  { code: 'he-Latn', name: 'Ivrit (Romanised)', dir: 'ltr', en: ['Hebrew', 'Romanised Hebrew', 'Romanized Hebrew'] },
  { code: 'ko-KR', name: '한국어 (대한민국)', dir: 'ltr', en: ['Korean', 'South Korean'] },
  { code: 'ko-KP', name: '조선말 (조선)', dir: 'ltr', en: ['Korean', 'North Korean'] },
  { code: 'ko-Latn-KR', name: 'Hangugeo (Romanised)', dir: 'ltr', en: ['Korean', 'South Korean', 'Revised Romanisation', 'Romanised Korean', 'Romanized Korean'] },
  { code: 'ko-Latn-KP', name: 'Chosŏnmal (Romanised)', dir: 'ltr', en: ['Korean', 'North Korean', 'McCune-Reischauer', 'Romanised Korean', 'Romanized Korean'] },
  { code: 'ja', name: '日本語', dir: 'ltr', en: 'Japanese' },
  { code: 'ja-Latn', name: 'Nihongo (Romanised)', dir: 'ltr', en: ['Japanese', 'Romaji', 'Rōmaji', 'Hepburn', 'Romanised Japanese', 'Romanized Japanese'] },
  { code: 'ru', name: 'Русский', dir: 'ltr', en: 'Russian' },
  { code: 'ru-Latn', name: 'Russkiy (Romanised)', dir: 'ltr', en: ['Russian', 'Translit', 'Romanised Russian', 'Romanized Russian'] },
  { code: 'uk', name: 'Українська', dir: 'ltr', en: 'Ukrainian' },
  { code: 'uk-Latn', name: 'Ukrainska (Romanised)', dir: 'ltr', en: ['Ukrainian', 'Romanised Ukrainian', 'Romanized Ukrainian'] },
  { code: 'pt-PT', name: 'Português (Portugal)', dir: 'ltr', en: ['Portuguese', 'European Portuguese'] },
  { code: 'da', name: 'Dansk', dir: 'ltr', en: 'Danish' },
  { code: 'nb', name: 'Norsk bokmål', dir: 'ltr', en: ['Norwegian', 'Norwegian Bokmål'] },
  { code: 'nn', name: 'Norsk nynorsk', dir: 'ltr', en: ['Norwegian', 'Norwegian Nynorsk', 'Nynorsk'] },
  { code: 'sv', name: 'Svenska', dir: 'ltr', en: 'Swedish' },
  { code: 'bg', name: 'Български', dir: 'ltr', en: 'Bulgarian' },
  { code: 'bg-Latn', name: 'Balgarski (Romanised)', dir: 'ltr', en: ['Bulgarian', 'Romanised Bulgarian', 'Romanized Bulgarian'] },
  { code: 'hr', name: 'Hrvatski', dir: 'ltr', en: 'Croatian' },
  { code: 'cs', name: 'Čeština', dir: 'ltr', en: ['Czech', 'Czech Republic'] },
  { code: 'et', name: 'Eesti', dir: 'ltr', en: 'Estonian' },
  { code: 'fi', name: 'Suomi', dir: 'ltr', en: 'Finnish' },
  { code: 'fr', name: 'Français', dir: 'ltr', en: 'French' },
  { code: 'de', name: 'Deutsch', dir: 'ltr', en: 'German', regions: ['DE', 'AT', 'CH'] },
  { code: 'el', name: 'Ελληνικά', dir: 'ltr', en: 'Greek', regions: ['GR', 'CY'] },
  { code: 'el-Latn', name: 'Ellinika (Romanised)', dir: 'ltr', en: ['Greek', 'Greeklish', 'Romanised Greek', 'Romanized Greek'] },
  { code: 'hu', name: 'Magyar', dir: 'ltr', en: 'Hungarian' },
  { code: 'ga', name: 'Gaeilge', dir: 'ltr', en: ['Irish', 'Irish Gaelic'] },
  { code: 'gv', name: 'Gaelg', dir: 'ltr', en: ['Manx', 'Manx Gaelic'] },
  { code: 'cy', name: 'Cymraeg', dir: 'ltr', en: ['Welsh', 'Wales'] },
  { code: 'gd', name: 'Gàidhlig', dir: 'ltr', en: ['Scottish Gaelic', 'Gaelic', 'Scottish', 'Scotland'] },
  { code: 'sco', name: 'Scots', dir: 'ltr', en: ['Scots', 'Scottish', 'Lowland Scots', 'Scotland'] },
  { code: 'it', name: 'Italiano', dir: 'ltr', en: 'Italian' },
  { code: 'la', name: 'Latina', dir: 'ltr', en: ['Latin', 'Classical Latin'], regions: ['VA', 'IT'] },
  { code: 'lb', name: 'Lëtzebuergesch', dir: 'ltr', en: ['Luxembourgish', 'Letzeburgesch'] },
  { code: 'lv', name: 'Latviešu', dir: 'ltr', en: 'Latvian' },
  { code: 'lt', name: 'Lietuvių', dir: 'ltr', en: 'Lithuanian' },
  { code: 'mt', name: 'Malti', dir: 'ltr', en: 'Maltese' },
  { code: 'pl', name: 'Polski', dir: 'ltr', en: 'Polish' },
  { code: 'ro', name: 'Română', dir: 'ltr', en: 'Romanian', regions: ['RO', 'MD'] },
  { code: 'sk', name: 'Slovenčina', dir: 'ltr', en: 'Slovak' },
  { code: 'sl', name: 'Slovenščina', dir: 'ltr', en: ['Slovenian', 'Slovene'] },
];
