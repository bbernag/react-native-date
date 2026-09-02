// Jest mock of the NativeDate HybridObject. Behavior is aligned with the C++
// core (Q1 clamp, Q2 calendar day/week, Q3 throw/null/NaN/false, Q4 throw on
// unknown zones). Tables are fixtures; DST uses the US/EU transition rules.

type DateComponents = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
  dayOfWeek: number;
};

type TimeUnit =
  | 'year'
  | 'month'
  | 'week'
  | 'day'
  | 'hour'
  | 'minute'
  | 'second'
  | 'millisecond';

type LocaleInfo = {
  code: string;
  languageCode: string;
  regionCode: string;
  displayName: string;
  nativeName: string;
};

type LocaleNames = {
  months: string[];
  monthsShort: string[];
  monthsNarrow: string[];
  days: string[];
  daysShort: string[];
  daysVeryShort: string[];
  daysNarrow: string[];
  displayName: string;
  nativeName: string;
};

const MAX_TIMESTAMP_MS = 8.64e15;
const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const MS_PER_WEEK = 7 * MS_PER_DAY;
const MAX_ISO_LENGTH = 128;
const MAX_PARSE_DATE_LENGTH = 256;
const MAX_PATTERN_LENGTH = 128;
const MAX_BATCH_SIZE = 100000;
const MAX_DURATION_MS = Number.MAX_SAFE_INTEGER;
const MAX_ZONE_NAME = 64;
const MAX_QUOTED = 64;

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const NAN_COMPONENTS: DateComponents = {
  year: NaN,
  month: NaN,
  day: NaN,
  hour: NaN,
  minute: NaN,
  second: NaN,
  millisecond: NaN,
  dayOfWeek: NaN,
};

// Abbreviation → IANA (US-centric; GMT/WET are fixed-offset Etc/GMT).
const ABBREVIATIONS: Record<string, string> = {
  EST: 'America/New_York',
  EDT: 'America/New_York',
  CST: 'America/Chicago',
  CDT: 'America/Chicago',
  MST: 'America/Denver',
  MDT: 'America/Denver',
  PST: 'America/Los_Angeles',
  PDT: 'America/Los_Angeles',
  AKST: 'America/Anchorage',
  AKDT: 'America/Anchorage',
  HST: 'Pacific/Honolulu',
  GMT: 'Etc/GMT',
  WET: 'Etc/GMT',
  BST: 'Europe/London',
  WEST: 'Europe/London',
  CET: 'Europe/Paris',
  CEST: 'Europe/Paris',
  EET: 'Europe/Helsinki',
  EEST: 'Europe/Helsinki',
  MSK: 'Europe/Moscow',
  IST: 'Asia/Kolkata',
  JST: 'Asia/Tokyo',
  KST: 'Asia/Seoul',
  HKT: 'Asia/Hong_Kong',
  SGT: 'Asia/Singapore',
  ICT: 'Asia/Bangkok',
  AEST: 'Australia/Sydney',
  AEDT: 'Australia/Sydney',
  ACST: 'Australia/Adelaide',
  ACDT: 'Australia/Adelaide',
  AWST: 'Australia/Perth',
  NZST: 'Pacific/Auckland',
  NZDT: 'Pacific/Auckland',
};

const EN_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const EN_MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const EN_MONTHS_NARROW = [
  'J',
  'F',
  'M',
  'A',
  'M',
  'J',
  'J',
  'A',
  'S',
  'O',
  'N',
  'D',
];
const EN_DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
const EN_DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const EN_DAYS_VERY_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const EN_DAYS_NARROW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const ENGLISH_NAMES: LocaleNames = {
  months: EN_MONTHS,
  monthsShort: EN_MONTHS_SHORT,
  monthsNarrow: EN_MONTHS_NARROW,
  days: EN_DAYS,
  daysShort: EN_DAYS_SHORT,
  daysVeryShort: EN_DAYS_VERY_SHORT,
  daysNarrow: EN_DAYS_NARROW,
  displayName: 'English',
  nativeName: 'English',
};

const LOCALE_NAMES: Record<string, LocaleNames> = {
  'en': ENGLISH_NAMES,
  'en-US': {
    ...ENGLISH_NAMES,
    displayName: 'English (United States)',
    nativeName: 'English (United States)',
  },
  'es': {
    months: [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre',
    ],
    monthsShort: [
      'ene',
      'feb',
      'mar',
      'abr',
      'may',
      'jun',
      'jul',
      'ago',
      'sep',
      'oct',
      'nov',
      'dic',
    ],
    monthsNarrow: EN_MONTHS_NARROW,
    days: [
      'domingo',
      'lunes',
      'martes',
      'miércoles',
      'jueves',
      'viernes',
      'sábado',
    ],
    daysShort: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
    daysVeryShort: ['do', 'lu', 'ma', 'mi', 'ju', 'vi', 'sá'],
    daysNarrow: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
    displayName: 'Spanish',
    nativeName: 'español',
  },
  'fr': {
    months: [
      'janvier',
      'février',
      'mars',
      'avril',
      'mai',
      'juin',
      'juillet',
      'août',
      'septembre',
      'octobre',
      'novembre',
      'décembre',
    ],
    monthsShort: [
      'janv.',
      'févr.',
      'mars',
      'avr.',
      'mai',
      'juin',
      'juil.',
      'août',
      'sept.',
      'oct.',
      'nov.',
      'déc.',
    ],
    monthsNarrow: EN_MONTHS_NARROW,
    days: [
      'dimanche',
      'lundi',
      'mardi',
      'mercredi',
      'jeudi',
      'vendredi',
      'samedi',
    ],
    daysShort: ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'],
    daysVeryShort: ['di', 'lu', 'ma', 'me', 'je', 've', 'sa'],
    daysNarrow: ['D', 'L', 'M', 'M', 'J', 'V', 'S'],
    displayName: 'French',
    nativeName: 'français',
  },
  'ja': {
    months: [
      '1月',
      '2月',
      '3月',
      '4月',
      '5月',
      '6月',
      '7月',
      '8月',
      '9月',
      '10月',
      '11月',
      '12月',
    ],
    monthsShort: [
      '1月',
      '2月',
      '3月',
      '4月',
      '5月',
      '6月',
      '7月',
      '8月',
      '9月',
      '10月',
      '11月',
      '12月',
    ],
    monthsNarrow: [
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      '11',
      '12',
    ],
    days: [
      '日曜日',
      '月曜日',
      '火曜日',
      '水曜日',
      '木曜日',
      '金曜日',
      '土曜日',
    ],
    daysShort: ['日', '月', '火', '水', '木', '金', '土'],
    daysVeryShort: ['日', '月', '火', '水', '木', '金', '土'],
    daysNarrow: ['日', '月', '火', '水', '木', '金', '土'],
    displayName: 'Japanese',
    nativeName: '日本語',
  },
  'zh-Hans': {
    months: [
      '一月',
      '二月',
      '三月',
      '四月',
      '五月',
      '六月',
      '七月',
      '八月',
      '九月',
      '十月',
      '十一月',
      '十二月',
    ],
    monthsShort: [
      '1月',
      '2月',
      '3月',
      '4月',
      '5月',
      '6月',
      '7月',
      '8月',
      '9月',
      '10月',
      '11月',
      '12月',
    ],
    monthsNarrow: [
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      '11',
      '12',
    ],
    days: [
      '星期日',
      '星期一',
      '星期二',
      '星期三',
      '星期四',
      '星期五',
      '星期六',
    ],
    daysShort: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
    daysVeryShort: ['日', '一', '二', '三', '四', '五', '六'],
    daysNarrow: ['日', '一', '二', '三', '四', '五', '六'],
    displayName: 'Chinese (Simplified)',
    nativeName: '简体中文',
  },
  'ar-SA': {
    months: [
      'يناير',
      'فبراير',
      'مارس',
      'أبريل',
      'مايو',
      'يونيو',
      'يوليو',
      'أغسطس',
      'سبتمبر',
      'أكتوبر',
      'نوفمبر',
      'ديسمبر',
    ],
    monthsShort: [
      'يناير',
      'فبراير',
      'مارس',
      'أبريل',
      'مايو',
      'يونيو',
      'يوليو',
      'أغسطس',
      'سبتمبر',
      'أكتوبر',
      'نوفمبر',
      'ديسمبر',
    ],
    monthsNarrow: EN_MONTHS_NARROW,
    days: [
      'الأحد',
      'الاثنين',
      'الثلاثاء',
      'الأربعاء',
      'الخميس',
      'الجمعة',
      'السبت',
    ],
    daysShort: [
      'الأحد',
      'الاثنين',
      'الثلاثاء',
      'الأربعاء',
      'الخميس',
      'الجمعة',
      'السبت',
    ],
    daysVeryShort: ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'],
    daysNarrow: ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'],
    displayName: 'Arabic (Saudi Arabia)',
    nativeName: 'العربية',
  },
  'pt-BR': {
    months: [
      'janeiro',
      'fevereiro',
      'março',
      'abril',
      'maio',
      'junho',
      'julho',
      'agosto',
      'setembro',
      'outubro',
      'novembro',
      'dezembro',
    ],
    monthsShort: [
      'jan.',
      'fev.',
      'mar.',
      'abr.',
      'mai.',
      'jun.',
      'jul.',
      'ago.',
      'set.',
      'out.',
      'nov.',
      'dez.',
    ],
    monthsNarrow: EN_MONTHS_NARROW,
    days: [
      'domingo',
      'segunda-feira',
      'terça-feira',
      'quarta-feira',
      'quinta-feira',
      'sexta-feira',
      'sábado',
    ],
    daysShort: ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'],
    daysVeryShort: ['do', 'se', 'te', 'qa', 'qi', 'sx', 'sá'],
    daysNarrow: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'],
    displayName: 'Portuguese (Brazil)',
    nativeName: 'português (Brasil)',
  },
};

const AVAILABLE_LOCALE_IDS = ['en', 'es', 'fr', 'pt_BR'];

let currentLocaleId = 'en';

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year: number, month: number): number {
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month: expected 1..12, got ${month}`);
  }
  if (month === 2 && isLeapYear(year)) return 29;
  return DAYS_IN_MONTH[month - 1]!;
}

function isValidTimestamp(ts: number): boolean {
  return Number.isFinite(ts) && Math.abs(ts) <= MAX_TIMESTAMP_MS;
}

function requireValidTimestamp(ts: number): void {
  if (!isValidTimestamp(ts)) {
    throw new Error(
      'Invalid timestamp: date is outside the supported range (+/-8.64e15 ms)'
    );
  }
}

function requireFiniteAmount(amount: number): void {
  if (!Number.isFinite(amount)) {
    throw new Error('Invalid amount: expected a finite number');
  }
}

function requireIntegralAmount(amount: number): number {
  requireFiniteAmount(amount);
  if (amount !== Math.floor(amount)) {
    throw new Error(
      'Invalid amount: day, week, month and year arithmetic requires a whole number'
    );
  }
  return amount;
}

function quoteTruncated(text: string): string {
  return text.length > MAX_QUOTED ? text.slice(0, MAX_QUOTED) + '...' : text;
}

function isAsciiDigit(c: string | undefined): boolean {
  return c !== undefined && c >= '0' && c <= '9';
}

function floorDiv(a: number, b: number): number {
  return Math.floor(a / b);
}

function localComponents(ts: number): DateComponents {
  requireValidTimestamp(ts);
  const date = new Date(ts);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
    second: date.getSeconds(),
    millisecond: date.getMilliseconds(),
    dayOfWeek: date.getDay(),
  };
}

function utcComponents(ts: number): DateComponents {
  requireValidTimestamp(ts);
  const date = new Date(ts);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
    second: date.getUTCSeconds(),
    millisecond: date.getUTCMilliseconds(),
    dayOfWeek: date.getUTCDay(),
  };
}

function localTimestamp(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0
): number {
  const date = new Date(
    year,
    month - 1,
    day,
    hour,
    minute,
    second,
    millisecond
  );
  if (year >= 0 && year <= 99) {
    date.setFullYear(year, month - 1, day);
  }
  const ts = date.getTime();
  if (!isValidTimestamp(ts)) {
    throw new Error(
      'Invalid timestamp: date is outside the supported range (+/-8.64e15 ms)'
    );
  }
  return ts;
}

function utcTimestamp(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0
): number {
  const date = new Date(
    Date.UTC(year, month - 1, day, hour, minute, second, millisecond)
  );
  if (year >= 0 && year <= 99) {
    date.setUTCFullYear(year, month - 1, day);
  }
  const ts = date.getTime();
  if (!isValidTimestamp(ts)) {
    throw new Error(
      'Invalid timestamp: date is outside the supported range (+/-8.64e15 ms)'
    );
  }
  return ts;
}

function localCivilDay(ts: number): number {
  const date = new Date(ts);
  return (
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MS_PER_DAY
  );
}

function failIso(input: string, reason: string): never {
  throw new Error(
    `Invalid ISO-8601 date string (${reason}): '${quoteTruncated(input)}'`
  );
}

function readDigits(s: string, pos: number, count: number): number | undefined {
  if (pos + count > s.length) return undefined;
  let value = 0;
  for (let i = 0; i < count; i++) {
    const c = s[pos + i];
    if (!isAsciiDigit(c)) return undefined;
    value = value * 10 + (c!.charCodeAt(0) - 48);
  }
  return value;
}

function parseISO8601(dateString: string): number {
  const s = dateString;
  if (s.length > MAX_ISO_LENGTH) failIso(s, 'input longer than 128 characters');
  if (s.length < 10) failIso(s, 'expected YYYY-MM-DD');

  const year = readDigits(s, 0, 4);
  const month = readDigits(s, 5, 2);
  const day = readDigits(s, 8, 2);
  if (
    year === undefined ||
    s[4] !== '-' ||
    month === undefined ||
    s[7] !== '-' ||
    day === undefined
  ) {
    failIso(s, 'expected YYYY-MM-DD');
  }
  if (year < 0 || year > 9999) failIso(s, 'year out of range');
  if (month < 1 || month > 12) failIso(s, 'month out of range');
  if (day < 1 || day > daysInMonth(year, month)) failIso(s, 'day out of range');

  let pos = 10;
  let hour = 0;
  let minute = 0;
  let second = 0;
  let millisecond = 0;

  if (pos < s.length && (s[pos] === 'T' || s[pos] === ' ')) {
    pos++;
    const parsedHour = readDigits(s, pos, 2);
    if (parsedHour === undefined) failIso(s, 'expected HH:mm after the date');
    pos += 2;
    if (pos >= s.length || s[pos] !== ':') {
      failIso(s, "expected ':' between hours and minutes");
    }
    pos++;
    const parsedMinute = readDigits(s, pos, 2);
    if (parsedMinute === undefined) failIso(s, 'expected two-digit minutes');
    pos += 2;
    hour = parsedHour;
    minute = parsedMinute;

    if (pos < s.length && s[pos] === ':') {
      pos++;
      const parsedSecond = readDigits(s, pos, 2);
      if (parsedSecond === undefined) failIso(s, 'expected two-digit seconds');
      pos += 2;
      second = parsedSecond;

      if (pos < s.length && s[pos] === '.') {
        pos++;
        let digits = 0;
        let ms = 0;
        while (pos < s.length && isAsciiDigit(s[pos])) {
          if (digits < 3) ms = ms * 10 + (s.charCodeAt(pos) - 48);
          digits++;
          pos++;
        }
        if (digits === 0 || digits > 9) {
          failIso(s, 'expected 1-9 fractional-second digits');
        }
        while (digits < 3) {
          ms *= 10;
          digits++;
        }
        millisecond = ms;
      }
    }

    if (hour > 23) failIso(s, 'hour out of range');
    if (minute > 59) failIso(s, 'minute out of range');
    if (second > 59) failIso(s, 'second out of range');
  }

  let hasOffset = false;
  let offsetMs = 0;
  if (pos < s.length) {
    const c = s[pos];
    if (c === 'Z') {
      hasOffset = true;
      pos++;
    } else if (c === '+' || c === '-') {
      hasOffset = true;
      pos++;
      const offsetHours = readDigits(s, pos, 2);
      if (offsetHours === undefined) failIso(s, 'expected ±hh[:mm] offset');
      pos += 2;
      let offsetMinutes = 0;
      if (pos < s.length && (s[pos] === ':' || isAsciiDigit(s[pos]))) {
        if (s[pos] === ':') pos++;
        const parsed = readDigits(s, pos, 2);
        if (parsed === undefined)
          failIso(s, 'expected two-digit offset minutes');
        offsetMinutes = parsed;
        pos += 2;
      }
      if (offsetHours > 23 || offsetMinutes > 59)
        failIso(s, 'offset out of range');
      offsetMs = (offsetHours * 60 + offsetMinutes) * MS_PER_MINUTE;
      if (c === '+') offsetMs = -offsetMs;
    } else {
      failIso(s, 'unexpected character after the date');
    }
  }

  if (pos !== s.length) failIso(s, 'unexpected trailing characters');

  if (hasOffset) {
    return (
      utcTimestamp(year, month, day, hour, minute, second, millisecond) +
      offsetMs
    );
  }
  return localTimestamp(year, month, day, hour, minute, second, millisecond);
}

function readFixedDigits(
  s: string,
  pos: { n: number },
  count: number
): number | undefined {
  const value = readDigits(s, pos.n, count);
  if (value === undefined) return undefined;
  pos.n += count;
  return value;
}

function readVariableDigits(
  s: string,
  pos: { n: number },
  maxDigits: number
): number | undefined {
  let value = 0;
  let digits = 0;
  while (pos.n < s.length && isAsciiDigit(s[pos.n])) {
    if (digits === maxDigits) return undefined;
    value = value * 10 + (s.charCodeAt(pos.n) - 48);
    digits++;
    pos.n++;
  }
  if (digits === 0) return undefined;
  return value;
}

function toLowerAscii(c: string): string {
  return c >= 'A' && c <= 'Z' ? String.fromCharCode(c.charCodeAt(0) + 32) : c;
}

function readAmPm(s: string, pos: { n: number }): boolean | undefined {
  if (pos.n >= s.length) return undefined;
  const first = toLowerAscii(s[pos.n]!);
  if (first !== 'a' && first !== 'p') return undefined;
  const isPM = first === 'p';
  pos.n++;
  if (pos.n < s.length && s[pos.n] === '.') {
    if (
      pos.n + 2 < s.length &&
      toLowerAscii(s[pos.n + 1]!) === 'm' &&
      s[pos.n + 2] === '.'
    ) {
      pos.n += 3;
      return isPM;
    }
    return undefined;
  }
  if (pos.n < s.length && toLowerAscii(s[pos.n]!) === 'm') {
    pos.n++;
  }
  return isPM;
}

function runLength(
  pattern: string,
  pos: number,
  c: string,
  max: number
): number {
  let n = 0;
  while (n < max && pos + n < pattern.length && pattern[pos + n] === c) n++;
  return n;
}

function parseWithFormat(dateString: string, pattern: string): number {
  if (dateString.length > MAX_PARSE_DATE_LENGTH) {
    throw new Error('parseFormat: date string longer than 256 characters');
  }
  if (pattern.length > MAX_PATTERN_LENGTH) {
    throw new Error('parseFormat: pattern longer than 128 characters');
  }

  let year = 1970;
  let month = 1;
  let day = 1;
  let hour = 0;
  let minute = 0;
  let second = 0;
  let millisecond = 0;
  let hasHour12 = false;
  let isPM = false;

  const datePos = { n: 0 };
  let patternPos = 0;
  const dateLen = dateString.length;
  const patternLen = pattern.length;

  while (patternPos < patternLen) {
    const c = pattern[patternPos]!;

    if (c === '[') {
      patternPos++;
      while (patternPos < patternLen && pattern[patternPos] !== ']') {
        if (
          datePos.n >= dateLen ||
          dateString[datePos.n] !== pattern[patternPos]
        ) {
          return NaN;
        }
        datePos.n++;
        patternPos++;
      }
      if (patternPos < patternLen) patternPos++;
      continue;
    }

    if (c === "'") {
      patternPos++;
      if (patternPos < patternLen && pattern[patternPos] === "'") {
        if (datePos.n >= dateLen || dateString[datePos.n] !== "'") return NaN;
        datePos.n++;
        patternPos++;
        continue;
      }
      while (patternPos < patternLen) {
        if (pattern[patternPos] === "'") {
          if (patternPos + 1 < patternLen && pattern[patternPos + 1] === "'") {
            if (datePos.n >= dateLen || dateString[datePos.n] !== "'")
              return NaN;
            datePos.n++;
            patternPos += 2;
            continue;
          }
          patternPos++;
          break;
        }
        if (
          datePos.n >= dateLen ||
          dateString[datePos.n] !== pattern[patternPos]
        ) {
          return NaN;
        }
        datePos.n++;
        patternPos++;
      }
      continue;
    }

    const run = runLength(pattern, patternPos, c, 4);
    let matched = true;

    switch (c) {
      case 'y':
      case 'Y':
        if (run >= 4) {
          const value = readFixedDigits(dateString, datePos, 4);
          if (value === undefined) return NaN;
          year = value;
          patternPos += 4;
        } else if (run >= 2) {
          const year2 = readFixedDigits(dateString, datePos, 2);
          if (year2 === undefined) return NaN;
          year = year2 >= 70 ? 1900 + year2 : 2000 + year2;
          patternPos += 2;
        } else {
          matched = false;
        }
        break;
      case 'M':
        if (run >= 3) return NaN;
        if (run === 2) {
          const value = readFixedDigits(dateString, datePos, 2);
          if (value === undefined) return NaN;
          month = value;
          patternPos += 2;
        } else {
          const value = readVariableDigits(dateString, datePos, 2);
          if (value === undefined) return NaN;
          month = value;
          patternPos++;
        }
        break;
      case 'd':
        if (run >= 3) return NaN;
        if (run >= 2) {
          const value = readFixedDigits(dateString, datePos, 2);
          if (value === undefined) return NaN;
          day = value;
          patternPos += 2;
        } else {
          const value = readVariableDigits(dateString, datePos, 2);
          if (value === undefined) return NaN;
          day = value;
          patternPos++;
        }
        break;
      case 'D':
        if (run >= 2) {
          const dValue = readFixedDigits(dateString, datePos, 2);
          if (dValue === undefined) return NaN;
          day = dValue;
          patternPos += 2;
        } else {
          const dValue = readVariableDigits(dateString, datePos, 2);
          if (dValue === undefined) return NaN;
          day = dValue;
          patternPos++;
        }
        break;
      case 'E':
        return NaN;
      case 'H':
        if (run >= 2) {
          const value = readFixedDigits(dateString, datePos, 2);
          if (value === undefined) return NaN;
          hour = value;
          patternPos += 2;
        } else {
          const value = readVariableDigits(dateString, datePos, 2);
          if (value === undefined) return NaN;
          hour = value;
          patternPos++;
        }
        break;
      case 'h':
        hasHour12 = true;
        if (run >= 2) {
          const value = readFixedDigits(dateString, datePos, 2);
          if (value === undefined) return NaN;
          hour = value;
          patternPos += 2;
        } else {
          const value = readVariableDigits(dateString, datePos, 2);
          if (value === undefined) return NaN;
          hour = value;
          patternPos++;
        }
        break;
      case 'm':
        if (run >= 2) {
          const value = readFixedDigits(dateString, datePos, 2);
          if (value === undefined) return NaN;
          minute = value;
          patternPos += 2;
        } else {
          const value = readVariableDigits(dateString, datePos, 2);
          if (value === undefined) return NaN;
          minute = value;
          patternPos++;
        }
        break;
      case 's':
        if (run >= 2) {
          const value = readFixedDigits(dateString, datePos, 2);
          if (value === undefined) return NaN;
          second = value;
          patternPos += 2;
        } else {
          const value = readVariableDigits(dateString, datePos, 2);
          if (value === undefined) return NaN;
          second = value;
          patternPos++;
        }
        break;
      case 'S':
        if (run >= 3) {
          const value = readFixedDigits(dateString, datePos, 3);
          if (value === undefined) return NaN;
          millisecond = value;
          patternPos += 3;
        } else {
          matched = false;
        }
        break;
      case 'A': {
        const ampm = readAmPm(dateString, datePos);
        if (ampm === undefined) return NaN;
        isPM = ampm;
        patternPos++;
        break;
      }
      case 'a': {
        const ampm = readAmPm(dateString, datePos);
        if (ampm === undefined) return NaN;
        isPM = ampm;
        patternPos += run > 3 ? 3 : run;
        break;
      }
      default:
        matched = false;
        break;
    }

    if (!matched) {
      if (datePos.n >= dateLen || dateString[datePos.n] !== c) return NaN;
      datePos.n++;
      patternPos++;
    }
  }

  if (datePos.n !== dateLen) return NaN;

  if (hasHour12) {
    if (hour < 1 || hour > 12) return NaN;
    if (isPM && hour !== 12) hour += 12;
    else if (!isPM && hour === 12) hour = 0;
  }

  if (month < 1 || month > 12) return NaN;
  if (day < 1 || day > daysInMonth(year, month)) return NaN;
  if (hour < 0 || hour > 23) return NaN;
  if (minute < 0 || minute > 59) return NaN;
  if (second < 0 || second > 59) return NaN;
  if (millisecond < 0 || millisecond > 999) return NaN;

  return localTimestamp(year, month, day, hour, minute, second, millisecond);
}

function localeNames(): LocaleNames {
  return LOCALE_NAMES[currentLocaleId] ?? ENGLISH_NAMES;
}

function pad2(value: number): string {
  if (value < 0 || value > 99) return String(value);
  return String(value).padStart(2, '0');
}

function pad3(value: number): string {
  if (value < 0 || value > 999) return String(value);
  return String(value).padStart(3, '0');
}

function pad4Year(value: number): string {
  if (value < 0 && value > -10000) {
    return '-' + String(-value).padStart(4, '0');
  }
  if (value < 0 || value > 9999) return String(value);
  return String(value).padStart(4, '0');
}

function formatDate(
  timestamp: number,
  pattern: string,
  useUTC = false
): string {
  requireValidTimestamp(timestamp);
  const dc = useUTC ? utcComponents(timestamp) : localComponents(timestamp);
  const names = localeNames();
  const hour12 = dc.hour % 12 || 12;
  const isPM = dc.hour >= 12;
  const monthIndex = dc.month - 1;
  const dayOfWeek = dc.dayOfWeek;

  let i = 0;
  let result = '';
  const len = pattern.length;

  while (i < len) {
    const c = pattern[i]!;

    if (c === '[') {
      i++;
      while (i < len && pattern[i] !== ']') result += pattern[i++];
      if (i < len) i++;
      continue;
    }

    if (c === "'") {
      i++;
      if (i < len && pattern[i] === "'") {
        result += "'";
        i++;
        continue;
      }
      while (i < len) {
        if (pattern[i] === "'") {
          if (i + 1 < len && pattern[i + 1] === "'") {
            result += "'";
            i += 2;
            continue;
          }
          i++;
          break;
        }
        result += pattern[i++];
      }
      continue;
    }

    const remaining = len - i;
    let matched = true;

    switch (c) {
      case 'y':
      case 'Y':
        if (
          remaining >= 4 &&
          pattern[i + 1] === c &&
          pattern[i + 2] === c &&
          pattern[i + 3] === c
        ) {
          result += pad4Year(dc.year);
          i += 4;
        } else if (remaining >= 2 && pattern[i + 1] === c) {
          result += pad2(((dc.year % 100) + 100) % 100);
          i += 2;
        } else {
          matched = false;
        }
        break;
      case 'M':
        if (
          remaining >= 4 &&
          pattern[i + 1] === 'M' &&
          pattern[i + 2] === 'M' &&
          pattern[i + 3] === 'M'
        ) {
          result += names.months[monthIndex] ?? '';
          i += 4;
        } else if (
          remaining >= 3 &&
          pattern[i + 1] === 'M' &&
          pattern[i + 2] === 'M'
        ) {
          result += names.monthsShort[monthIndex] ?? '';
          i += 3;
        } else if (remaining >= 2 && pattern[i + 1] === 'M') {
          result += pad2(dc.month);
          i += 2;
        } else {
          result += names.monthsNarrow[monthIndex] ?? '';
          i++;
        }
        break;
      case 'd':
        if (
          remaining >= 4 &&
          pattern[i + 1] === 'd' &&
          pattern[i + 2] === 'd' &&
          pattern[i + 3] === 'd'
        ) {
          result += names.days[dayOfWeek] ?? '';
          i += 4;
        } else if (
          remaining >= 3 &&
          pattern[i + 1] === 'd' &&
          pattern[i + 2] === 'd'
        ) {
          result += names.daysShort[dayOfWeek] ?? '';
          i += 3;
        } else if (remaining >= 2 && pattern[i + 1] === 'd') {
          result += pad2(dc.day);
          i += 2;
        } else {
          result += String(dc.day);
          i++;
        }
        break;
      case 'D':
        if (remaining >= 2 && pattern[i + 1] === 'D') {
          result += pad2(dc.day);
          i += 2;
        } else {
          result += String(dc.day);
          i++;
        }
        break;
      case 'E':
        if (
          remaining >= 4 &&
          pattern[i + 1] === 'E' &&
          pattern[i + 2] === 'E' &&
          pattern[i + 3] === 'E'
        ) {
          result += names.days[dayOfWeek] ?? '';
          i += 4;
        } else if (
          remaining >= 3 &&
          pattern[i + 1] === 'E' &&
          pattern[i + 2] === 'E'
        ) {
          result += names.daysShort[dayOfWeek] ?? '';
          i += 3;
        } else if (remaining >= 2 && pattern[i + 1] === 'E') {
          result += names.daysVeryShort[dayOfWeek] ?? '';
          i += 2;
        } else {
          result += names.daysNarrow[dayOfWeek] ?? '';
          i++;
        }
        break;
      case 'H':
        if (remaining >= 2 && pattern[i + 1] === 'H') {
          result += pad2(dc.hour);
          i += 2;
        } else {
          result += String(dc.hour);
          i++;
        }
        break;
      case 'h':
        if (remaining >= 2 && pattern[i + 1] === 'h') {
          result += pad2(hour12);
          i += 2;
        } else {
          result += String(hour12);
          i++;
        }
        break;
      case 'm':
        if (remaining >= 2 && pattern[i + 1] === 'm') {
          result += pad2(dc.minute);
          i += 2;
        } else {
          result += String(dc.minute);
          i++;
        }
        break;
      case 's':
        if (remaining >= 2 && pattern[i + 1] === 's') {
          result += pad2(dc.second);
          i += 2;
        } else {
          result += String(dc.second);
          i++;
        }
        break;
      case 'S':
        if (
          remaining >= 3 &&
          pattern[i + 1] === 'S' &&
          pattern[i + 2] === 'S'
        ) {
          result += pad3(dc.millisecond);
          i += 3;
        } else {
          matched = false;
        }
        break;
      case 'A':
        result += isPM ? 'PM' : 'AM';
        i++;
        break;
      case 'a':
        if (
          remaining >= 3 &&
          pattern[i + 1] === 'a' &&
          pattern[i + 2] === 'a'
        ) {
          result += isPM ? 'p.m.' : 'a.m.';
          i += 3;
        } else if (remaining >= 2 && pattern[i + 1] === 'a') {
          result += isPM ? 'pm' : 'am';
          i += 2;
        } else {
          result += isPM ? 'p' : 'a';
          i++;
        }
        break;
      default:
        matched = false;
        break;
    }

    if (!matched) {
      result += c;
      i++;
    }
  }

  return result;
}

function nthSundayUtc(
  year: number,
  month0: number,
  n: number,
  utcHour: number
): number {
  const first = new Date(Date.UTC(year, month0, 1, utcHour));
  const dow = first.getUTCDay();
  const firstSunday = 1 + ((7 - dow) % 7);
  return Date.UTC(year, month0, firstSunday + (n - 1) * 7, utcHour);
}

function lastSundayUtc(year: number, month0: number, utcHour: number): number {
  const last = new Date(Date.UTC(year, month0 + 1, 0, utcHour));
  return Date.UTC(year, month0, last.getUTCDate() - last.getUTCDay(), utcHour);
}

function usDstOffset(
  ts: number,
  std: number,
  dst: number,
  springHourUtc: number,
  fallHourUtc: number
): number {
  const year = new Date(ts).getUTCFullYear();
  const spring = nthSundayUtc(year, 2, 2, springHourUtc);
  const fall = nthSundayUtc(year, 10, 1, fallHourUtc);
  return ts >= spring && ts < fall ? dst : std;
}

function euDstOffset(ts: number, std: number, dst: number): number {
  const year = new Date(ts).getUTCFullYear();
  const spring = lastSundayUtc(year, 2, 1);
  const fall = lastSundayUtc(year, 9, 1);
  return ts >= spring && ts < fall ? dst : std;
}

function auDstOffset(ts: number, std: number, dst: number): number {
  const year = new Date(ts).getUTCFullYear();
  const start = nthSundayUtc(year, 9, 1, 16);
  const end = nthSundayUtc(year, 3, 1, 16);
  return ts >= start || ts < end ? dst : std;
}

const FIXED_OFFSETS: Record<string, number> = {
  'UTC': 0,
  'Etc/UTC': 0,
  'Etc/GMT': 0,
  'Asia/Kolkata': 330,
  'Asia/Tokyo': 540,
  'Asia/Seoul': 540,
  'Asia/Hong_Kong': 480,
  'Asia/Singapore': 480,
  'Asia/Bangkok': 420,
  'Australia/Perth': 480,
  'Pacific/Honolulu': -600,
  'Europe/Moscow': 180,
};

function offsetAtResolved(zone: string, ts: number): number {
  if (zone in FIXED_OFFSETS) return FIXED_OFFSETS[zone]!;
  switch (zone) {
    case 'America/New_York':
      return usDstOffset(ts, -300, -240, 7, 6);
    case 'America/Chicago':
      return usDstOffset(ts, -360, -300, 8, 7);
    case 'America/Denver':
      return usDstOffset(ts, -420, -360, 9, 8);
    case 'America/Los_Angeles':
      return usDstOffset(ts, -480, -420, 10, 9);
    case 'America/Anchorage':
      return usDstOffset(ts, -540, -480, 11, 10);
    case 'Europe/London':
      return euDstOffset(ts, 0, 60);
    case 'Europe/Paris':
    case 'Europe/Helsinki':
      return euDstOffset(
        ts,
        zone === 'Europe/Helsinki' ? 120 : 60,
        zone === 'Europe/Helsinki' ? 180 : 120
      );
    case 'Australia/Sydney':
      return auDstOffset(ts, 600, 660);
    case 'Australia/Adelaide':
      return auDstOffset(ts, 570, 630);
    case 'Pacific/Auckland':
      return auDstOffset(ts, 720, 780);
    default:
      return 0;
  }
}

const KNOWN_ZONES = new Set([
  ...Object.keys(FIXED_OFFSETS),
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Europe/London',
  'Europe/Paris',
  'Europe/Helsinki',
  'Australia/Sydney',
  'Australia/Adelaide',
  'Pacific/Auckland',
]);

function equalsIgnoreCase(a: string, b: string): boolean {
  return a.length === b.length && a.toLowerCase() === b.toLowerCase();
}

function isUtcAlias(name: string): boolean {
  return (
    equalsIgnoreCase(name, 'UTC') ||
    equalsIgnoreCase(name, 'Etc/UTC') ||
    equalsIgnoreCase(name, 'Z')
  );
}

function isWellFormedZone(name: string): boolean {
  if (name.length === 0 || name.length > MAX_ZONE_NAME) return false;
  for (let i = 0; i < name.length; i++) {
    const c = name.charCodeAt(i);
    const ok =
      (c >= 65 && c <= 90) ||
      (c >= 97 && c <= 122) ||
      (c >= 48 && c <= 57) ||
      c === 95 ||
      c === 47 ||
      c === 43 ||
      c === 45;
    if (!ok) return false;
  }
  return true;
}

function normalizeZone(name: string): string {
  if (name.length === 0 || name.length > MAX_ZONE_NAME) return name;
  if (isUtcAlias(name)) return 'UTC';
  if (name.length <= 4) {
    const mapped = ABBREVIATIONS[name.toUpperCase()];
    if (mapped) return mapped;
  }
  return name;
}

function throwInvalidZone(input: string): never {
  throw new Error(`Invalid timezone: '${quoteTruncated(input)}'`);
}

function resolveZone(timezone: string): string {
  const zone = normalizeZone(timezone);
  if (zone === 'UTC') return zone;
  if (!isWellFormedZone(zone) || !KNOWN_ZONES.has(zone)) {
    throwInvalidZone(timezone);
  }
  return zone;
}

function systemZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

function systemOffsetEast(ts: number): number {
  const zone = normalizeZone(systemZone());
  if (zone === 'UTC' || KNOWN_ZONES.has(zone)) {
    return offsetAtResolved(zone === 'UTC' ? 'UTC' : zone, ts);
  }
  return -new Date(ts).getTimezoneOffset();
}

function offsetAt(timezone: string, ts: number): number {
  const zone = resolveZone(timezone);
  return offsetAtResolved(zone, ts);
}

function civilDayInZone(ts: number, zone: string): number {
  const localMs = ts + offsetAtResolved(zone, ts) * MS_PER_MINUTE;
  return floorDiv(localMs, MS_PER_DAY);
}

function zonedMidnight(zone: string, dayNumber: number): number {
  const localMidnightMs = dayNumber * MS_PER_DAY;
  const offsetBefore =
    offsetAtResolved(zone, localMidnightMs - MS_PER_DAY) * MS_PER_MINUTE;
  const offsetAfter =
    offsetAtResolved(zone, localMidnightMs + MS_PER_DAY) * MS_PER_MINUTE;
  if (offsetBefore === offsetAfter) {
    return localMidnightMs - offsetBefore;
  }
  const earlier = localMidnightMs - Math.max(offsetBefore, offsetAfter);
  const later = localMidnightMs - Math.min(offsetBefore, offsetAfter);
  const earlierIsReal =
    earlier + offsetAtResolved(zone, earlier) * MS_PER_MINUTE ===
    localMidnightMs;
  return earlierIsReal ? earlier : later;
}

function startOfDayInTz(ts: number, timezone: string): number {
  requireValidTimestamp(ts);
  const zone = resolveZone(timezone);
  const day = civilDayInZone(ts, zone);
  return zonedMidnight(zone, day);
}

function endOfDayInTz(ts: number, timezone: string): number {
  requireValidTimestamp(ts);
  const zone = resolveZone(timezone);
  const day = civilDayInZone(ts, zone);
  return zonedMidnight(zone, day + 1) - 1;
}

function addMonths(timestamp: number, months: number): number {
  const dc = localComponents(timestamp);
  const totalMonths = dc.year * 12 + (dc.month - 1) + months;
  const newYear = floorDiv(totalMonths, 12);
  const newMonth = ((totalMonths % 12) + 12) % 12;
  const maxDay = daysInMonth(newYear, newMonth + 1);
  const newDay = Math.min(dc.day, maxDay);
  return localTimestamp(
    newYear,
    newMonth + 1,
    newDay,
    dc.hour,
    dc.minute,
    dc.second,
    dc.millisecond
  );
}

function addDaysCalendar(timestamp: number, days: number): number {
  const dc = localComponents(timestamp);
  return localTimestamp(
    dc.year,
    dc.month,
    dc.day + days,
    dc.hour,
    dc.minute,
    dc.second,
    dc.millisecond
  );
}

function addDuration(
  timestamp: number,
  amount: number,
  unitMs: number
): number {
  requireFiniteAmount(amount);
  const result = timestamp + amount * unitMs;
  if (!isValidTimestamp(result)) {
    throw new Error(
      'Invalid timestamp: result is outside the supported range (+/-8.64e15 ms)'
    );
  }
  return result;
}

function addToDate(timestamp: number, amount: number, unit: TimeUnit): number {
  requireValidTimestamp(timestamp);
  switch (unit) {
    case 'millisecond':
      return addDuration(timestamp, amount, 1);
    case 'second':
      return addDuration(timestamp, amount, 1000);
    case 'minute':
      return addDuration(timestamp, amount, MS_PER_MINUTE);
    case 'hour':
      return addDuration(timestamp, amount, MS_PER_HOUR);
    case 'day':
      return addDaysCalendar(timestamp, requireIntegralAmount(amount));
    case 'week':
      return addDaysCalendar(timestamp, requireIntegralAmount(amount) * 7);
    case 'month':
      return addMonths(timestamp, requireIntegralAmount(amount));
    case 'year':
      return addMonths(timestamp, requireIntegralAmount(amount) * 12);
  }
}

function startOfUnit(timestamp: number, unit: TimeUnit): number {
  requireValidTimestamp(timestamp);
  const dc = localComponents(timestamp);
  switch (unit) {
    case 'year':
      return localTimestamp(dc.year, 1, 1);
    case 'month':
      return localTimestamp(dc.year, dc.month, 1);
    case 'week':
      return localTimestamp(dc.year, dc.month, dc.day - dc.dayOfWeek);
    case 'day':
      return localTimestamp(dc.year, dc.month, dc.day);
    case 'hour':
      return localTimestamp(dc.year, dc.month, dc.day, dc.hour);
    case 'minute':
      return localTimestamp(dc.year, dc.month, dc.day, dc.hour, dc.minute);
    case 'second':
      return localTimestamp(
        dc.year,
        dc.month,
        dc.day,
        dc.hour,
        dc.minute,
        dc.second
      );
    default:
      return timestamp;
  }
}

function endOfUnit(timestamp: number, unit: TimeUnit): number {
  requireValidTimestamp(timestamp);
  if (unit === 'millisecond') return timestamp;
  switch (unit) {
    case 'second':
      return startOfUnit(timestamp, 'second') + 999;
    case 'minute':
      return startOfUnit(timestamp, 'minute') + MS_PER_MINUTE - 1;
    case 'hour':
      return startOfUnit(timestamp, 'hour') + MS_PER_HOUR - 1;
    case 'day':
      return addDaysCalendar(startOfUnit(timestamp, 'day'), 1) - 1;
    case 'week':
      return addDaysCalendar(startOfUnit(timestamp, 'week'), 7) - 1;
    case 'month': {
      const dc = localComponents(timestamp);
      return localTimestamp(dc.year, dc.month + 1, 1) - 1;
    }
    case 'year': {
      const dc = localComponents(timestamp);
      return localTimestamp(dc.year + 1, 1, 1) - 1;
    }
  }
}

function completeMonthsBetween(later: number, earlier: number): number {
  const a = localComponents(later);
  const b = localComponents(earlier);
  let months = (a.year - b.year) * 12 + (a.month - b.month);
  if (months > 0 && addMonths(earlier, months) > later) {
    months--;
  }
  return months;
}

function diffInUnit(t1: number, t2: number, unit: TimeUnit): number {
  requireValidTimestamp(t1);
  requireValidTimestamp(t2);
  const ms = t1 - t2;
  switch (unit) {
    case 'millisecond':
      return ms;
    case 'second':
      return Math.trunc(ms / 1000);
    case 'minute':
      return Math.trunc(ms / MS_PER_MINUTE);
    case 'hour':
      return Math.trunc(ms / MS_PER_HOUR);
    case 'day':
      return Math.trunc(ms / MS_PER_DAY);
    case 'week':
      return Math.trunc(ms / MS_PER_WEEK);
    case 'month': {
      return t1 >= t2
        ? completeMonthsBetween(t1, t2)
        : -completeMonthsBetween(t2, t1);
    }
    case 'year': {
      const months =
        t1 >= t2
          ? completeMonthsBetween(t1, t2)
          : -completeMonthsBetween(t2, t1);
      return Math.trunc(months / 12);
    }
  }
}

function isSameUnit(t1: number, t2: number, unit: TimeUnit): boolean {
  if (!isValidTimestamp(t1) || !isValidTimestamp(t2)) return false;
  if (unit === 'millisecond') return t1 === t2;
  return startOfUnit(t1, unit) === startOfUnit(t2, unit);
}

function formatDistanceEnglish(
  timestamp: number,
  baseTimestamp: number,
  addSuffix: boolean
): string {
  if (!Number.isFinite(timestamp) || !Number.isFinite(baseTimestamp)) {
    throw new Error('formatDistance: timestamps must be finite numbers');
  }
  const diffMs = timestamp - baseTimestamp;
  if (!Number.isFinite(diffMs)) {
    throw new Error('formatDistance: difference must be a finite number');
  }
  const isFuture = diffMs > 0;
  const seconds = Math.abs(diffMs) / 1000;
  const minutes = seconds / 60;
  const hours = minutes / 60;
  const days = hours / 24;
  const months = days / 30;
  const years = days / 365;

  let result: string;
  if (seconds < 30) {
    result = 'less than a minute';
  } else if (seconds < 90) {
    result = '1 minute';
  } else if (minutes < 45) {
    result = `${Math.round(minutes)} minutes`;
  } else if (minutes < 90) {
    result = 'about 1 hour';
  } else if (hours < 24) {
    result = `about ${Math.round(hours)} hours`;
  } else if (hours < 42) {
    result = '1 day';
  } else if (days < 30) {
    result = `${Math.round(days)} days`;
  } else if (days < 45) {
    result = 'about 1 month';
  } else if (days < 365) {
    result = `${Math.round(months)} months`;
  } else if (years < 1.5) {
    result = 'about 1 year';
  } else if (years < 2.5) {
    result = 'over 1 year';
  } else {
    result = `about ${Math.round(years)} years`;
  }

  if (addSuffix) {
    result = isFuture ? `in ${result}` : `${result} ago`;
  }
  return result;
}

function formatDurationEnglish(milliseconds: number): string {
  if (!Number.isFinite(milliseconds)) {
    throw new Error('formatDuration: milliseconds must be a finite number');
  }
  let magnitude = Math.abs(milliseconds);
  if (magnitude > MAX_DURATION_MS) magnitude = MAX_DURATION_MS;
  const totalSeconds = Math.floor(magnitude / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;
  const seconds = totalSeconds % 60;
  let result = '';
  if (days > 0) result += `${days}d `;
  if (hours > 0 || days > 0) result += `${hours}h `;
  if (minutes > 0 || hours > 0 || days > 0) result += `${minutes}m `;
  result += `${seconds}s`;
  return result;
}

function isSafeLocaleTag(tag: string): boolean {
  if (tag.length === 0 || tag.length > 64) return false;
  for (let i = 0; i < tag.length; i++) {
    const c = tag.charCodeAt(i);
    const ok =
      (c >= 65 && c <= 90) ||
      (c >= 97 && c <= 122) ||
      (c >= 48 && c <= 57) ||
      c === 45;
    if (!ok) return false;
  }
  return true;
}

function canonicalizeLocale(tag: string): string {
  return tag.replace(/_/g, '-');
}

function localeLookup(tag: string): LocaleNames | undefined {
  const canonical = canonicalizeLocale(tag);
  if (LOCALE_NAMES[canonical]) return LOCALE_NAMES[canonical];
  const language = canonical.split('-')[0]!;
  return LOCALE_NAMES[language];
}

function splitLocale(tag: string): {
  languageCode: string;
  regionCode: string;
} {
  const parts = canonicalizeLocale(tag).split('-');
  return {
    languageCode: parts[0] ?? '',
    regionCode: parts.length > 1 ? parts[parts.length - 1]! : '',
  };
}

function requireBatchSize(count: number): void {
  if (count > MAX_BATCH_SIZE) {
    throw new Error('batch size exceeds 100000 elements');
  }
}

function requireFormatPattern(pattern: string): void {
  if (pattern.length > MAX_PATTERN_LENGTH) {
    throw new Error('formatMany: pattern longer than 128 characters');
  }
}

function toTimezoneShifted(ts: number, timezone: string): number {
  requireValidTimestamp(ts);
  const zone = resolveZone(timezone);
  if (zone === 'UTC') return ts;
  return ts + offsetAtResolved(zone, ts) * MS_PER_MINUTE;
}

const mockNativeDate = {
  now: () => Date.now(),
  parse: parseISO8601,
  parseFormat: (dateStr: string, pattern: string) => {
    const result = parseWithFormat(dateStr, pattern);
    if (Number.isNaN(result)) {
      throw new Error(
        `Unable to parse date string: '${quoteTruncated(
          dateStr
        )}' with pattern: '${quoteTruncated(pattern)}'`
      );
    }
    return result;
  },
  tryParseFormat: (dateStr: string, pattern: string) =>
    parseWithFormat(dateStr, pattern),
  format: (ts: number, pattern: string) => formatDate(ts, pattern, false),
  formatUTC: (ts: number, pattern: string) => formatDate(ts, pattern, true),
  formatFromString: (dateStr: string, pattern: string) =>
    formatDate(parseISO8601(dateStr), pattern, false),
  formatUTCFromString: (dateStr: string, pattern: string) =>
    formatDate(parseISO8601(dateStr), pattern, true),

  getComponents: localComponents,
  getYear: (ts: number) => localComponents(ts).year,
  getMonth: (ts: number) => localComponents(ts).month,
  getDate: (ts: number) => localComponents(ts).day,
  getDay: (ts: number) => localComponents(ts).dayOfWeek,
  getHours: (ts: number) => localComponents(ts).hour,
  getMinutes: (ts: number) => localComponents(ts).minute,
  getSeconds: (ts: number) => localComponents(ts).second,
  getMilliseconds: (ts: number) => localComponents(ts).millisecond,

  getComponentsUTC: utcComponents,
  getYearUTC: (ts: number) => utcComponents(ts).year,
  getMonthUTC: (ts: number) => utcComponents(ts).month,
  getDateUTC: (ts: number) => utcComponents(ts).day,
  getDayUTC: (ts: number) => utcComponents(ts).dayOfWeek,
  getHoursUTC: (ts: number) => utcComponents(ts).hour,
  getMinutesUTC: (ts: number) => utcComponents(ts).minute,
  getSecondsUTC: (ts: number) => utcComponents(ts).second,
  getMillisecondsUTC: (ts: number) => utcComponents(ts).millisecond,

  getComponentsFromString: (dateStr: string) =>
    localComponents(parseISO8601(dateStr)),
  getYearFromString: (dateStr: string) =>
    localComponents(parseISO8601(dateStr)).year,
  getMonthFromString: (dateStr: string) =>
    localComponents(parseISO8601(dateStr)).month,
  getDateFromString: (dateStr: string) =>
    localComponents(parseISO8601(dateStr)).day,
  getDayFromString: (dateStr: string) =>
    localComponents(parseISO8601(dateStr)).dayOfWeek,
  getHoursFromString: (dateStr: string) =>
    localComponents(parseISO8601(dateStr)).hour,
  getMinutesFromString: (dateStr: string) =>
    localComponents(parseISO8601(dateStr)).minute,
  getSecondsFromString: (dateStr: string) =>
    localComponents(parseISO8601(dateStr)).second,
  getMillisecondsFromString: (dateStr: string) =>
    localComponents(parseISO8601(dateStr)).millisecond,

  getDaysInMonth: (ts: number) => {
    const dc = localComponents(ts);
    return daysInMonth(dc.year, dc.month);
  },
  isLeapYear: (ts: number) => isLeapYear(localComponents(ts).year),
  isWeekend: (ts: number) => {
    const day = localComponents(ts).dayOfWeek;
    return day === 0 || day === 6;
  },
  isValid: (ts: number) => isValidTimestamp(ts),
  isToday: (ts: number) => {
    requireValidTimestamp(ts);
    return localCivilDay(ts) === localCivilDay(Date.now());
  },
  isTomorrow: (ts: number) => {
    requireValidTimestamp(ts);
    return localCivilDay(ts) === localCivilDay(Date.now()) + 1;
  },
  isYesterday: (ts: number) => {
    requireValidTimestamp(ts);
    return localCivilDay(ts) === localCivilDay(Date.now()) - 1;
  },

  add: addToDate,
  subtract: (ts: number, amount: number, unit: TimeUnit) =>
    addToDate(ts, -amount, unit),

  isBefore: (t1: number, t2: number) => t1 < t2,
  isAfter: (t1: number, t2: number) => t1 > t2,
  isSame: isSameUnit,

  startOf: startOfUnit,
  endOf: endOfUnit,
  diff: diffInUnit,
  clamp: (ts: number, minVal: number, maxVal: number) => {
    if (Number.isNaN(ts) || Number.isNaN(minVal) || Number.isNaN(maxVal)) {
      return NaN;
    }
    if (ts < minVal) return minVal;
    if (ts > maxVal) return maxVal;
    return ts;
  },
  min: (timestamps: number[]) => {
    if (timestamps.length === 0) return NaN;
    let result = timestamps[0]!;
    for (let i = 0; i < timestamps.length; i++) {
      if (Number.isNaN(timestamps[i])) return NaN;
      if (timestamps[i]! < result) result = timestamps[i]!;
    }
    return result;
  },
  max: (timestamps: number[]) => {
    if (timestamps.length === 0) return NaN;
    let result = timestamps[0]!;
    for (let i = 0; i < timestamps.length; i++) {
      if (Number.isNaN(timestamps[i])) return NaN;
      if (timestamps[i]! > result) result = timestamps[i]!;
    }
    return result;
  },

  formatDistance: formatDistanceEnglish,
  formatDuration: formatDurationEnglish,

  getTimezone: () => systemZone(),
  getTimezoneOffset: () => systemOffsetEast(Date.now()),
  getTimezoneOffsetForTimestamp: (ts: number) => {
    requireValidTimestamp(ts);
    return systemOffsetEast(ts);
  },
  getOffsetInTimezone: (ts: number, tz: string) => {
    requireValidTimestamp(ts);
    return offsetAt(tz, ts);
  },
  toTimezone: toTimezoneShifted,
  formatInTimezone: (ts: number, pattern: string, tz: string) => {
    return formatDate(toTimezoneShifted(ts, tz), pattern, true);
  },
  getAvailableTimezones: () => Array.from(KNOWN_ZONES),
  isValidTimezone: (tz: string) => {
    if (isUtcAlias(tz)) return true;
    const zone = normalizeZone(tz);
    return KNOWN_ZONES.has(zone);
  },

  getLocale: () => currentLocaleId,
  setLocale: (locale: string) => {
    const canonical = canonicalizeLocale(locale);
    if (!isSafeLocaleTag(canonical)) return false;
    if (!localeLookup(canonical) && !LOCALE_NAMES[canonical]) return false;
    const known =
      LOCALE_NAMES[canonical] !== undefined
        ? canonical
        : canonicalizeLocale(canonical.split('-')[0]!);
    if (!LOCALE_NAMES[known] && !localeLookup(canonical)) return false;
    currentLocaleId = LOCALE_NAMES[canonical] ? canonical : known;
    if (!LOCALE_NAMES[currentLocaleId]) return false;
    return true;
  },
  getAvailableLocales: () => AVAILABLE_LOCALE_IDS.slice(),
  getLocaleDisplayName: (localeCode: string) => {
    const names = localeLookup(localeCode);
    return names?.displayName ?? localeCode;
  },
  getLocaleInfo: (localeCode: string): LocaleInfo => {
    const canonical = canonicalizeLocale(localeCode);
    const names = localeLookup(canonical);
    const parts = splitLocale(canonical);
    return {
      code: canonical,
      languageCode: parts.languageCode,
      regionCode: parts.regionCode,
      displayName: names?.displayName ?? canonical,
      nativeName: names?.nativeName ?? canonical,
    };
  },
  getAvailableLocalesInfo: (): LocaleInfo[] =>
    AVAILABLE_LOCALE_IDS.map((id) => mockNativeDate.getLocaleInfo(id)),

  isTodayInTz: (ts: number, tz: string) => {
    requireValidTimestamp(ts);
    const zone = resolveZone(tz);
    requireValidTimestamp(Date.now());
    return civilDayInZone(ts, zone) === civilDayInZone(Date.now(), zone);
  },
  isTomorrowInTz: (ts: number, tz: string) => {
    requireValidTimestamp(ts);
    const zone = resolveZone(tz);
    return civilDayInZone(ts, zone) === civilDayInZone(Date.now(), zone) + 1;
  },
  isYesterdayInTz: (ts: number, tz: string) => {
    requireValidTimestamp(ts);
    const zone = resolveZone(tz);
    return civilDayInZone(ts, zone) === civilDayInZone(Date.now(), zone) - 1;
  },
  isSameDayInTz: (ts1: number, ts2: number, tz: string) => {
    requireValidTimestamp(ts1);
    requireValidTimestamp(ts2);
    const zone = resolveZone(tz);
    return civilDayInZone(ts1, zone) === civilDayInZone(ts2, zone);
  },
  isSameMonthInTz: (ts1: number, ts2: number, tz: string) => {
    requireValidTimestamp(ts1);
    requireValidTimestamp(ts2);
    const zone = resolveZone(tz);
    const a = civilDayInZone(ts1, zone);
    const b = civilDayInZone(ts2, zone);
    const da = new Date(a * MS_PER_DAY);
    const db = new Date(b * MS_PER_DAY);
    return (
      da.getUTCFullYear() === db.getUTCFullYear() &&
      da.getUTCMonth() === db.getUTCMonth()
    );
  },
  isSameYearInTz: (ts1: number, ts2: number, tz: string) => {
    requireValidTimestamp(ts1);
    requireValidTimestamp(ts2);
    const zone = resolveZone(tz);
    const a = civilDayInZone(ts1, zone);
    const b = civilDayInZone(ts2, zone);
    return (
      new Date(a * MS_PER_DAY).getUTCFullYear() ===
      new Date(b * MS_PER_DAY).getUTCFullYear()
    );
  },
  startOfDayInTz,
  endOfDayInTz,

  parseManyAsync: (dateStrings: string[]) => {
    requireBatchSize(dateStrings.length);
    return Promise.resolve(
      dateStrings.map((s) => {
        try {
          return parseISO8601(s);
        } catch {
          return NaN;
        }
      })
    );
  },
  formatManyAsync: (timestamps: number[], pattern: string) => {
    requireBatchSize(timestamps.length);
    requireFormatPattern(pattern);
    return Promise.resolve(
      timestamps.map((ts) => {
        if (!isValidTimestamp(ts)) return '';
        return formatDate(ts, pattern, false);
      })
    );
  },
  getComponentsManyAsync: (timestamps: number[]) => {
    requireBatchSize(timestamps.length);
    return Promise.resolve(
      timestamps.map((ts) =>
        isValidTimestamp(ts) ? localComponents(ts) : { ...NAN_COMPONENTS }
      )
    );
  },
};

export const NitroModules = {
  createHybridObject: <T>(_name: string): T => mockNativeDate as T,
};
