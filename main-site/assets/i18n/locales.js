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
  { code: 'en-GB', name: 'English (UK)', dir: 'ltr' },
  { code: 'en-US', name: 'English (US)', dir: 'ltr' },
  { code: 'en-ARR', name: 'English (Pirate)', dir: 'ltr' },
  { code: 'zh-SG', name: '中文（新加坡）', dir: 'ltr' },
  { code: 'zh-CN', name: '中文（大陆）', dir: 'ltr' },
  { code: 'zh-TW', name: '中文（台灣）', dir: 'ltr' },
  { code: 'zh-HK', name: '中文（香港）', dir: 'ltr' },
  { code: 'ms', name: 'Bahasa Melayu', dir: 'ltr' },
  { code: 'ta', name: 'தமிழ்', dir: 'ltr' },
  { code: 'id', name: 'Bahasa Indonesia', dir: 'ltr' },
  { code: 'hi', name: 'हिन्दी', dir: 'ltr' },
  { code: 'bn', name: 'বাংলা', dir: 'ltr' },
  { code: 'te', name: 'తెలుగు', dir: 'ltr' },
  { code: 'es-MX', name: 'Español (México)', dir: 'ltr' },
  { code: 'es-ES', name: 'Español (España)', dir: 'ltr' },
  { code: 'nl', name: 'Nederlands', dir: 'ltr' },
  { code: 'eo', name: 'Esperanto', dir: 'ltr' },
  { code: 'th', name: 'ไทย', dir: 'ltr' },
  { code: 'my', name: 'မြန်မာ', dir: 'ltr' },
  { code: 'lo', name: 'ລາວ', dir: 'ltr' },
  { code: 'vi', name: 'Tiếng Việt', dir: 'ltr' },
  { code: 'tl', name: 'Tagalog', dir: 'ltr' },
  { code: 'tet', name: 'Tetun', dir: 'ltr' },
  { code: 'ko-KR', name: '한국어 (대한민국)', dir: 'ltr' },
  { code: 'ko-KP', name: '조선말 (조선)', dir: 'ltr' },
  { code: 'ja', name: '日本語', dir: 'ltr' },
  { code: 'ru', name: 'Русский', dir: 'ltr' },
  { code: 'uk', name: 'Українська', dir: 'ltr' },
  { code: 'pt-PT', name: 'Português (Portugal)', dir: 'ltr' },
  { code: 'da', name: 'Dansk', dir: 'ltr' },
  { code: 'nb', name: 'Norsk bokmål', dir: 'ltr' },
  { code: 'sv', name: 'Svenska', dir: 'ltr' },
  { code: 'bg', name: 'Български', dir: 'ltr' },
  { code: 'hr', name: 'Hrvatski', dir: 'ltr' },
  { code: 'cs', name: 'Čeština', dir: 'ltr' },
  { code: 'et', name: 'Eesti', dir: 'ltr' },
  { code: 'fi', name: 'Suomi', dir: 'ltr' },
  { code: 'fr', name: 'Français', dir: 'ltr' },
  { code: 'de', name: 'Deutsch', dir: 'ltr' },
  { code: 'el', name: 'Ελληνικά', dir: 'ltr' },
  { code: 'hu', name: 'Magyar', dir: 'ltr' },
  { code: 'ga', name: 'Gaeilge', dir: 'ltr' },
  { code: 'it', name: 'Italiano', dir: 'ltr' },
  { code: 'lv', name: 'Latviešu', dir: 'ltr' },
  { code: 'lt', name: 'Lietuvių', dir: 'ltr' },
  { code: 'mt', name: 'Malti', dir: 'ltr' },
  { code: 'pl', name: 'Polski', dir: 'ltr' },
  { code: 'ro', name: 'Română', dir: 'ltr' },
  { code: 'sk', name: 'Slovenčina', dir: 'ltr' },
  { code: 'sl', name: 'Slovenščina', dir: 'ltr' },
];
