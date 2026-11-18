// assets/i18n/locales.js
// Every locale file, imported statically so switching needs no request.
// Adding a language: one import, one entry in `locales`, one in `registry`,
// then add the file to the service worker precache and bump its version.
// The steps, and every file involved, are in main-site/README.md under
// "Adding a language".
//
// The site's English is British English, so its code is en-GB (what <html
// lang> is set to). Its words live in en-GB.json. A reader whose browser asks for
// any other English (en-AU, plain en) gets this one, as the default; en-US
// and en-ARR (Pirate) are there to be picked.
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
import zhSG from './zh-SG.json' with { type: 'json' };
import zhCN from './zh-CN.json' with { type: 'json' };
import zhTW from './zh-TW.json' with { type: 'json' };
import zhHK from './zh-HK.json' with { type: 'json' };
import ms from './ms.json' with { type: 'json' };
import ta from './ta.json' with { type: 'json' };
import id from './id.json' with { type: 'json' };
import hi from './hi.json' with { type: 'json' };
import bn from './bn.json' with { type: 'json' };
import te from './te.json' with { type: 'json' };
import esMX from './es-MX.json' with { type: 'json' };
import esES from './es-ES.json' with { type: 'json' };
import nl from './nl.json' with { type: 'json' };
import eo from './eo.json' with { type: 'json' };
import th from './th.json' with { type: 'json' };
import my from './my.json' with { type: 'json' };
import lo from './lo.json' with { type: 'json' };
import vi from './vi.json' with { type: 'json' };
import tl from './tl.json' with { type: 'json' };
import tet from './tet.json' with { type: 'json' };
import koKR from './ko-KR.json' with { type: 'json' };
import koKP from './ko-KP.json' with { type: 'json' };
import ja from './ja.json' with { type: 'json' };
import ru from './ru.json' with { type: 'json' };
import uk from './uk.json' with { type: 'json' };
import ptPT from './pt-PT.json' with { type: 'json' };
import da from './da.json' with { type: 'json' };
import nb from './nb.json' with { type: 'json' };
import sv from './sv.json' with { type: 'json' };
import bg from './bg.json' with { type: 'json' };
import hr from './hr.json' with { type: 'json' };
import cs from './cs.json' with { type: 'json' };
import et from './et.json' with { type: 'json' };
import fi from './fi.json' with { type: 'json' };
import fr from './fr.json' with { type: 'json' };
import de from './de.json' with { type: 'json' };
import el from './el.json' with { type: 'json' };
import hu from './hu.json' with { type: 'json' };
import ga from './ga.json' with { type: 'json' };
import it from './it.json' with { type: 'json' };
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
  'zh-SG': zhSG,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  'zh-HK': zhHK,
  'ms': ms,
  'ta': ta,
  'id': id,
  'hi': hi,
  'bn': bn,
  'te': te,
  'es-MX': esMX,
  'es-ES': esES,
  'nl': nl,
  'eo': eo,
  'th': th,
  'my': my,
  'lo': lo,
  'vi': vi,
  'tl': tl,
  'tet': tet,
  'ko-KR': koKR,
  'ko-KP': koKP,
  'ja': ja,
  'ru': ru,
  'uk': uk,
  'pt-PT': ptPT,
  'da': da,
  'nb': nb,
  'sv': sv,
  'bg': bg,
  'hr': hr,
  'cs': cs,
  'et': et,
  'fi': fi,
  'fr': fr,
  'de': de,
  'el': el,
  'hu': hu,
  'ga': ga,
  'it': it,
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
  { code: 'zh-SG', name: '中文（新加坡）', dir: 'ltr', en: ['Chinese', 'Simplified Chinese', 'Mandarin'] },
  { code: 'zh-CN', name: '中文（大陆）', dir: 'ltr', en: ['Chinese', 'Simplified Chinese', 'Mandarin', 'Mainland China'] },
  { code: 'zh-TW', name: '中文（台灣）', dir: 'ltr', en: ['Chinese', 'Traditional Chinese', 'Mandarin'] },
  { code: 'zh-HK', name: '中文（香港）', dir: 'ltr', en: ['Chinese', 'Traditional Chinese'] },
  { code: 'ms', name: 'Bahasa Melayu', dir: 'ltr', en: 'Malay', regions: ['MY', 'BN', 'SG'] },
  { code: 'ta', name: 'தமிழ்', dir: 'ltr', en: 'Tamil', regions: ['IN', 'LK', 'SG', 'MY'] },
  { code: 'id', name: 'Bahasa Indonesia', dir: 'ltr', en: 'Indonesian' },
  { code: 'hi', name: 'हिन्दी', dir: 'ltr', en: 'Hindi' },
  { code: 'bn', name: 'বাংলা', dir: 'ltr', en: ['Bengali', 'Bangla'], regions: ['BD', 'IN'] },
  { code: 'te', name: 'తెలుగు', dir: 'ltr', en: 'Telugu' },
  { code: 'es-MX', name: 'Español (México)', dir: 'ltr', en: ['Spanish', 'Mexican Spanish', 'Latin American Spanish'] },
  { code: 'es-ES', name: 'Español (España)', dir: 'ltr', en: ['Spanish', 'European Spanish', 'Castilian'] },
  { code: 'nl', name: 'Nederlands', dir: 'ltr', en: ['Dutch', 'Flemish'], regions: ['NL', 'BE', 'SR'] },
  { code: 'eo', name: 'Esperanto', dir: 'ltr', en: 'Esperanto' },
  { code: 'th', name: 'ไทย', dir: 'ltr', en: 'Thai' },
  { code: 'my', name: 'မြန်မာ', dir: 'ltr', en: 'Burmese' },
  { code: 'lo', name: 'ລາວ', dir: 'ltr', en: 'Lao' },
  { code: 'vi', name: 'Tiếng Việt', dir: 'ltr', en: 'Vietnamese' },
  { code: 'tl', name: 'Tagalog', dir: 'ltr', en: ['Tagalog', 'Filipino'] },
  { code: 'tet', name: 'Tetun', dir: 'ltr', en: ['Tetum', 'Tetun', 'East Timor'] },
  { code: 'ko-KR', name: '한국어 (대한민국)', dir: 'ltr', en: ['Korean', 'South Korean'] },
  { code: 'ko-KP', name: '조선말 (조선)', dir: 'ltr', en: ['Korean', 'North Korean'] },
  { code: 'ja', name: '日本語', dir: 'ltr', en: 'Japanese' },
  { code: 'ru', name: 'Русский', dir: 'ltr', en: 'Russian' },
  { code: 'uk', name: 'Українська', dir: 'ltr', en: 'Ukrainian' },
  { code: 'pt-PT', name: 'Português (Portugal)', dir: 'ltr', en: ['Portuguese', 'European Portuguese'] },
  { code: 'da', name: 'Dansk', dir: 'ltr', en: 'Danish' },
  { code: 'nb', name: 'Norsk bokmål', dir: 'ltr', en: ['Norwegian', 'Norwegian Bokmål'] },
  { code: 'sv', name: 'Svenska', dir: 'ltr', en: 'Swedish' },
  { code: 'bg', name: 'Български', dir: 'ltr', en: 'Bulgarian' },
  { code: 'hr', name: 'Hrvatski', dir: 'ltr', en: 'Croatian' },
  { code: 'cs', name: 'Čeština', dir: 'ltr', en: ['Czech', 'Czech Republic'] },
  { code: 'et', name: 'Eesti', dir: 'ltr', en: 'Estonian' },
  { code: 'fi', name: 'Suomi', dir: 'ltr', en: 'Finnish' },
  { code: 'fr', name: 'Français', dir: 'ltr', en: 'French' },
  { code: 'de', name: 'Deutsch', dir: 'ltr', en: 'German', regions: ['DE', 'AT', 'CH'] },
  { code: 'el', name: 'Ελληνικά', dir: 'ltr', en: 'Greek', regions: ['GR', 'CY'] },
  { code: 'hu', name: 'Magyar', dir: 'ltr', en: 'Hungarian' },
  { code: 'ga', name: 'Gaeilge', dir: 'ltr', en: ['Irish', 'Irish Gaelic'] },
  { code: 'it', name: 'Italiano', dir: 'ltr', en: 'Italian' },
  { code: 'lv', name: 'Latviešu', dir: 'ltr', en: 'Latvian' },
  { code: 'lt', name: 'Lietuvių', dir: 'ltr', en: 'Lithuanian' },
  { code: 'mt', name: 'Malti', dir: 'ltr', en: 'Maltese' },
  { code: 'pl', name: 'Polski', dir: 'ltr', en: 'Polish' },
  { code: 'ro', name: 'Română', dir: 'ltr', en: 'Romanian', regions: ['RO', 'MD'] },
  { code: 'sk', name: 'Slovenčina', dir: 'ltr', en: 'Slovak' },
  { code: 'sl', name: 'Slovenščina', dir: 'ltr', en: ['Slovenian', 'Slovene'] },
];
