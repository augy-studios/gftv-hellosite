#!/usr/bin/env python3
"""Writes English (Braille) and English (Morse code) from British English.

    python tools/make-braille-morse.py

Reads main-site/assets/i18n/en-GB.json and writes, beside it:

  en-Brai.json   Unified English Braille, uncontracted (grade 1), in Unicode
                 braille cells: a capital sign before a capital letter, a
                 capitals word sign before a word in capitals (GFTV), a number
                 sign before digits, and UEB's punctuation.
  en-MORSE.json  International (ITU) Morse code: a dot is ·, a dash is −,
                 letters are a space apart and words are " / " apart.

Run it again after changing any wording in en-GB.json, then raise VERSION in
main-site/sw.js. {placeholders} are kept as they are, since the page fills
them in. Anything neither code has (哈喽 on the card) is kept as it is.
"""
import json
import re
from pathlib import Path

I18N = Path(__file__).resolve().parent.parent / 'main-site' / 'assets' / 'i18n'
PLACEHOLDER = re.compile(r'(\{\w+\})')

# ---------------------------------------------------------------- braille

LETTERS = dict(zip('abcdefghijklmnopqrstuvwxyz', '⠁⠃⠉⠙⠑⠋⠛⠓⠊⠚⠅⠇⠍⠝⠕⠏⠟⠗⠎⠞⠥⠧⠺⠭⠽⠵'))
DIGITS = dict(zip('1234567890', '⠁⠃⠉⠙⠑⠋⠛⠓⠊⠚'))
CAPITAL = '⠠'
CAPITALS_WORD = '⠠⠠'
CAPITALS_END = '⠠⠄'
NUMBER = '⠼'
GRADE_1 = '⠰'  # after a number, so a following a to j is read as a letter
BRAILLE_PUNCTUATION = {
    ',': '⠂', ';': '⠆', ':': '⠒', '.': '⠲', '!': '⠖', '?': '⠦',
    "'": '⠄', '’': '⠄', '‘': '⠠⠦', '“': '⠘⠦', '”': '⠘⠴', '"': '⠠⠶',
    '-': '⠤', '–': '⠠⠤', '—': '⠐⠠⠤', '/': '⠸⠌', '(': '⠐⠣', ')': '⠐⠜',
    '&': '⠈⠯', '@': '⠈⠁', '*': '⠐⠔', '#': '⠸⠹', '+': '⠐⠖', '=': '⠐⠶',
    '%': '⠨⠴', '~': '⠈⠔', '_': '⠨⠤', '|': '⠸⠳', '^': '⠈⠢', '…': '⠲⠲⠲',
    '©': '⠘⠉', '·': '⠐⠲',
}


def braille_word(word):
    """One space-free run of text in UEB grade 1."""
    out = []
    letters = [c for c in word if c.isalpha() and c.isascii()]
    # A capitals word sign covers a run of two or more capitals at the start.
    caps = 0
    for c in word:
        if c.isascii() and c.isalpha():
            if c.isupper():
                caps += 1
            else:
                break
    in_caps = caps >= 2 and len(letters) > 0
    caps_pending = in_caps  # the sign goes right before the first letter
    in_number = False
    for c in word:
        lower = c.lower()
        if c.isdigit() and c.isascii():
            if not in_number:
                out.append(NUMBER)
                in_number = True
            out.append(DIGITS[c])
            continue
        if in_number and c in ',.':
            # A comma or full stop inside a number keeps the number going.
            out.append(BRAILLE_PUNCTUATION[c])
            continue
        if c.isascii() and c.isalpha():
            if in_number and lower in 'abcdefghij':
                out.append(GRADE_1)
            in_number = False
            if caps_pending:
                out.append(CAPITALS_WORD)
                caps_pending = False
            if in_caps:
                if c.islower():
                    out.append(CAPITALS_END)
                    in_caps = False
            elif c.isupper():
                out.append(CAPITAL)
            out.append(LETTERS[lower])
            continue
        in_number = False
        out.append(BRAILLE_PUNCTUATION.get(c, c))
    return ''.join(out)


def to_braille(text):
    parts = PLACEHOLDER.split(text)
    out = []
    for part in parts:
        if PLACEHOLDER.fullmatch(part):
            out.append(part)
        else:
            out.append(re.sub(r'\S+', lambda m: braille_word(m.group(0)), part))
    return ''.join(out)

# ------------------------------------------------------------------ morse

DOT, DASH = '·', '−'
MORSE = {
    'a': '.-', 'b': '-...', 'c': '-.-.', 'd': '-..', 'e': '.', 'f': '..-.',
    'g': '--.', 'h': '....', 'i': '..', 'j': '.---', 'k': '-.-', 'l': '.-..',
    'm': '--', 'n': '-.', 'o': '---', 'p': '.--.', 'q': '--.-', 'r': '.-.',
    's': '...', 't': '-', 'u': '..-', 'v': '...-', 'w': '.--', 'x': '-..-',
    'y': '-.--', 'z': '--..',
    '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....',
    '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----',
    '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '’': '.----.',
    '‘': '.----.', '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-',
    '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-', '+': '.-.-.',
    '-': '-....-', '–': '-....-', '—': '-....-', '_': '..--.-', '"': '.-..-.',
    '“': '.-..-.', '”': '.-..-.', '$': '...-..-', '@': '.--.-.',
}


def morse_char(c):
    code = MORSE.get(c.lower())
    return code.replace('.', DOT).replace('-', DASH) if code else c


def to_morse(text):
    words = []
    for word in text.split():
        symbols = []
        for part in PLACEHOLDER.split(word):
            if not part:
                continue
            if PLACEHOLDER.fullmatch(part):
                symbols.append(part)
            else:
                symbols.extend(morse_char(c) for c in part)
        words.append(' '.join(symbols))
    return ' / '.join(words)

# ------------------------------------------------------------------- main


def write(name, convert, source):
    out = {key: convert(value) for key, value in source.items()}
    path = I18N / name
    path.write_text(json.dumps(out, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'wrote {path.relative_to(I18N.parent.parent.parent)}')


def main():
    source = json.loads((I18N / 'en-GB.json').read_text(encoding='utf-8'))
    write('en-Brai.json', to_braille, source)
    write('en-MORSE.json', to_morse, source)


if __name__ == '__main__':
    main()
