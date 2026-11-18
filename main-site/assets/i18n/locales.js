// assets/i18n/locales.js
// Every locale file, imported statically so switching needs no request.
// Adding a language: one import, one entry in `locales`, one in `registry`,
// then add the file to the service worker precache and bump its version.
// The steps, and every file involved, are in main-site/README.md under
// "Adding a language".
//
// The site's English is British English, so its code is en-GB (what <html
// lang> is set to). Its words live in en.json. A reader whose browser asks for
// any other English (en-US, en-AU, plain en) gets this one, as the default.
import en from './en.json' with { type: 'json' };

export const DEFAULT_LOCALE = 'en-GB';

export const locales = { 'en-GB': en };

export const registry = [
  { code: 'en-GB', name: 'English', dir: 'ltr' },
];
