// Mock implementation of react-native-nitro-modules for testing
// This simulates native date operations using JavaScript Date

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

// Timezone offsets in minutes (simplified for testing)
// Note: These don't account for DST - real implementation uses platform APIs
const TIMEZONE_OFFSETS: Record<string, number> = {
  'UTC': 0,
  'America/New_York': -300, // EST (not accounting for DST)
  'America/Los_Angeles': -480,
  'Europe/London': 0,
  'Europe/Paris': 60,
  'Asia/Tokyo': 540,
  'Australia/Sydney': 660,
};

// DST-aware offsets (simplified - June vs January)
function getTimezoneOffsetForDate(tz: string, timestamp: number): number {
  const date = new Date(timestamp);
  const month = date.getUTCMonth();
  const isDST = month >= 3 && month <= 10; // April-October (Northern Hemisphere)

  // Simplified DST handling for common timezones
  if (tz === 'America/New_York') {
    return isDST ? -240 : -300; // EDT vs EST
  }
  if (tz === 'America/Los_Angeles') {
    return isDST ? -420 : -480; // PDT vs PST
  }
  if (tz === 'Europe/London') {
    return isDST ? 60 : 0; // BST vs GMT
  }
  if (tz === 'Europe/Paris') {
    return isDST ? 120 : 60; // CEST vs CET
  }

  return TIMEZONE_OFFSETS[tz] ?? 0;
}

const AVAILABLE_TIMEZONES = Object.keys(TIMEZONE_OFFSETS);

function parseISO8601(dateString: string): number {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date string: ${dateString}`);
  }
  return date.getTime();
}

function formatDate(
  timestamp: number,
  pattern: string,
  useUTC = false
): string {
  const date = new Date(timestamp);

  const pad = (n: number, width = 2) => String(n).padStart(width, '0');

  const year = useUTC ? date.getUTCFullYear() : date.getFullYear();
  const month = useUTC ? date.getUTCMonth() + 1 : date.getMonth() + 1;
  const day = useUTC ? date.getUTCDate() : date.getDate();
  const hour = useUTC ? date.getUTCHours() : date.getHours();
  const hour12 = hour % 12 || 12;
  const minute = useUTC ? date.getUTCMinutes() : date.getMinutes();
  const second = useUTC ? date.getUTCSeconds() : date.getSeconds();
  const ms = useUTC ? date.getUTCMilliseconds() : date.getMilliseconds();
  const isPM = hour >= 12;

  // Handle escaped text first - use unique placeholder that won't be affected by replacements
  let result = pattern;
  const escaped: string[] = [];

  // Replace [text] escapes with safe placeholder
  result = result.replace(/\[([^\]]+)\]/g, (_, content) => {
    escaped.push(content);
    return `\x00ESC${escaped.length - 1}\x00`;
  });

  // Replace 'text' escapes with safe placeholder
  result = result.replace(/'([^']+)'/g, (_, content) => {
    escaped.push(content);
    return `\x00ESC${escaped.length - 1}\x00`;
  });

  // Replace month/day name placeholders first
  const months = [
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
  const monthsShort = [
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
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayOfWeek = useUTC ? date.getUTCDay() : date.getDay();

  // Replace tokens (order matters - longer tokens first)
  result = result
    .replace(/yyyy/g, String(year))
    .replace(/YYYY/g, String(year))
    .replace(/yy/g, pad(year % 100))
    .replace(/YY/g, pad(year % 100))
    .replace(/MMMM/g, months[month - 1] || '')
    .replace(/MMM/g, monthsShort[month - 1] || '')
    .replace(/MM/g, pad(month))
    .replace(/M(?!O)/g, String(month))
    .replace(/dddd/g, days[dayOfWeek] || '')
    .replace(/ddd/g, daysShort[dayOfWeek] || '')
    .replace(/dd/g, pad(day))
    .replace(/DD/g, pad(day))
    .replace(/d(?!a)/g, String(day))
    .replace(/D(?!a)/g, String(day))
    .replace(/HH/g, pad(hour))
    .replace(/H(?!H)/g, String(hour))
    .replace(/hh/g, pad(hour12))
    .replace(/h(?!h)/g, String(hour12))
    .replace(/mm/g, pad(minute))
    .replace(/m(?!m)/g, String(minute))
    .replace(/ss/g, pad(second))
    .replace(/s(?!s)/g, String(second))
    .replace(/SSS/g, pad(ms, 3))
    .replace(/A/g, isPM ? 'PM' : 'AM')
    .replace(/aa/g, isPM ? 'pm' : 'am')
    .replace(/a(?!a)/g, isPM ? 'p' : 'a');

  // Restore escaped content
  escaped.forEach((content, i) => {
    result = result.replace(`\x00ESC${i}\x00`, content);
  });

  return result;
}

function formatDateUTC(timestamp: number, pattern: string): string {
  return formatDate(timestamp, pattern, true);
}

function getComponentsFromTimestamp(timestamp: number): DateComponents {
  const date = new Date(timestamp);
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

function addToDate(timestamp: number, amount: number, unit: TimeUnit): number {
  const date = new Date(timestamp);
  switch (unit) {
    case 'year':
      date.setFullYear(date.getFullYear() + amount);
      break;
    case 'month':
      date.setMonth(date.getMonth() + amount);
      break;
    case 'week':
      date.setDate(date.getDate() + amount * 7);
      break;
    case 'day':
      date.setDate(date.getDate() + amount);
      break;
    case 'hour':
      date.setHours(date.getHours() + amount);
      break;
    case 'minute':
      date.setMinutes(date.getMinutes() + amount);
      break;
    case 'second':
      date.setSeconds(date.getSeconds() + amount);
      break;
    case 'millisecond':
      date.setMilliseconds(date.getMilliseconds() + amount);
      break;
  }
  return date.getTime();
}

function startOfUnit(timestamp: number, unit: TimeUnit): number {
  const date = new Date(timestamp);
  switch (unit) {
    case 'year':
      return new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0).getTime();
    case 'month':
      return new Date(
        date.getFullYear(),
        date.getMonth(),
        1,
        0,
        0,
        0,
        0
      ).getTime();
    case 'week': {
      const day = date.getDay();
      const diff = date.getDate() - day;
      return new Date(
        date.getFullYear(),
        date.getMonth(),
        diff,
        0,
        0,
        0,
        0
      ).getTime();
    }
    case 'day':
      return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        0,
        0,
        0,
        0
      ).getTime();
    case 'hour':
      return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        0,
        0,
        0
      ).getTime();
    case 'minute':
      return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        0,
        0
      ).getTime();
    case 'second':
      return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
        0
      ).getTime();
    default:
      return timestamp;
  }
}

function endOfUnit(timestamp: number, unit: TimeUnit): number {
  const date = new Date(timestamp);
  switch (unit) {
    case 'year':
      return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999).getTime();
    case 'month': {
      const nextMonth = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
      return nextMonth.getTime();
    }
    case 'week': {
      const day = date.getDay();
      const diff = date.getDate() + (6 - day);
      return new Date(
        date.getFullYear(),
        date.getMonth(),
        diff,
        23,
        59,
        59,
        999
      ).getTime();
    }
    case 'day':
      return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        23,
        59,
        59,
        999
      ).getTime();
    case 'hour':
      return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        59,
        59,
        999
      ).getTime();
    case 'minute':
      return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        59,
        999
      ).getTime();
    case 'second':
      return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
        999
      ).getTime();
    default:
      return timestamp;
  }
}

function diffInUnit(t1: number, t2: number, unit: TimeUnit): number {
  const ms = t1 - t2;
  switch (unit) {
    case 'year':
      return Math.floor(ms / (365.25 * 24 * 60 * 60 * 1000));
    case 'month':
      return Math.floor(ms / (30.44 * 24 * 60 * 60 * 1000));
    case 'week':
      return Math.floor(ms / (7 * 24 * 60 * 60 * 1000));
    case 'day':
      return Math.floor(ms / (24 * 60 * 60 * 1000));
    case 'hour':
      return Math.floor(ms / (60 * 60 * 1000));
    case 'minute':
      return Math.floor(ms / (60 * 1000));
    case 'second':
      return Math.floor(ms / 1000);
    case 'millisecond':
      return ms;
    default:
      return ms;
  }
}

function isSameUnit(t1: number, t2: number, unit: TimeUnit): boolean {
  return startOfUnit(t1, unit) === startOfUnit(t2, unit);
}

function getComponentsFromTimestampUTC(timestamp: number): DateComponents {
  const date = new Date(timestamp);
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

function parseWithFormat(dateString: string, pattern: string): number {
  // Parse a date string using a custom format pattern
  let year = 1970,
    month = 1,
    day = 1,
    hour = 0,
    minute = 0,
    second = 0,
    millisecond = 0;
  let hasHour12 = false;
  let isPM = false;

  let datePos = 0;
  let patternPos = 0;

  while (patternPos < pattern.length && datePos < dateString.length) {
    const c = pattern[patternPos];
    const remaining = pattern.length - patternPos;

    // Handle escaped text with single quotes
    if (c === "'") {
      patternPos++;
      if (patternPos < pattern.length && pattern[patternPos] === "'") {
        if (dateString[datePos] !== "'") return NaN;
        datePos++;
        patternPos++;
        continue;
      }
      while (patternPos < pattern.length && datePos < dateString.length) {
        if (pattern[patternPos] === "'") {
          patternPos++;
          break;
        }
        if (dateString[datePos] !== pattern[patternPos]) return NaN;
        datePos++;
        patternPos++;
      }
      continue;
    }

    let matched = false;

    // yyyy - 4 digit year
    if (
      remaining >= 4 &&
      pattern.substring(patternPos, patternPos + 4) === 'yyyy'
    ) {
      if (datePos + 4 > dateString.length) return NaN;
      year = parseInt(dateString.substring(datePos, datePos + 4), 10);
      datePos += 4;
      patternPos += 4;
      matched = true;
    }
    // yy - 2 digit year
    else if (
      remaining >= 2 &&
      pattern.substring(patternPos, patternPos + 2) === 'yy'
    ) {
      if (datePos + 2 > dateString.length) return NaN;
      const year2 = parseInt(dateString.substring(datePos, datePos + 2), 10);
      year = year2 >= 70 ? 1900 + year2 : 2000 + year2;
      datePos += 2;
      patternPos += 2;
      matched = true;
    }
    // MM - 2 digit month
    else if (
      remaining >= 2 &&
      pattern.substring(patternPos, patternPos + 2) === 'MM'
    ) {
      if (datePos + 2 > dateString.length) return NaN;
      month = parseInt(dateString.substring(datePos, datePos + 2), 10);
      datePos += 2;
      patternPos += 2;
      matched = true;
    }
    // M - 1-2 digit month
    else if (c === 'M' && (remaining < 2 || pattern[patternPos + 1] !== 'M')) {
      let m = 0;
      while (
        datePos < dateString.length &&
        dateString[datePos]! >= '0' &&
        dateString[datePos]! <= '9'
      ) {
        m = m * 10 + parseInt(dateString[datePos]!, 10);
        datePos++;
      }
      month = m;
      patternPos++;
      matched = true;
    }
    // dd - 2 digit day
    else if (
      remaining >= 2 &&
      pattern.substring(patternPos, patternPos + 2) === 'dd'
    ) {
      if (datePos + 2 > dateString.length) return NaN;
      day = parseInt(dateString.substring(datePos, datePos + 2), 10);
      datePos += 2;
      patternPos += 2;
      matched = true;
    }
    // d - 1-2 digit day
    else if (c === 'd' && (remaining < 2 || pattern[patternPos + 1] !== 'd')) {
      let d = 0;
      while (
        datePos < dateString.length &&
        dateString[datePos]! >= '0' &&
        dateString[datePos]! <= '9'
      ) {
        d = d * 10 + parseInt(dateString[datePos]!, 10);
        datePos++;
      }
      day = d;
      patternPos++;
      matched = true;
    }
    // HH - 2 digit hour (24h)
    else if (
      remaining >= 2 &&
      pattern.substring(patternPos, patternPos + 2) === 'HH'
    ) {
      if (datePos + 2 > dateString.length) return NaN;
      hour = parseInt(dateString.substring(datePos, datePos + 2), 10);
      datePos += 2;
      patternPos += 2;
      matched = true;
    }
    // H - 1-2 digit hour (24h)
    else if (c === 'H' && (remaining < 2 || pattern[patternPos + 1] !== 'H')) {
      let h = 0;
      while (
        datePos < dateString.length &&
        dateString[datePos]! >= '0' &&
        dateString[datePos]! <= '9'
      ) {
        h = h * 10 + parseInt(dateString[datePos]!, 10);
        datePos++;
      }
      hour = h;
      patternPos++;
      matched = true;
    }
    // hh - 2 digit hour (12h)
    else if (
      remaining >= 2 &&
      pattern.substring(patternPos, patternPos + 2) === 'hh'
    ) {
      if (datePos + 2 > dateString.length) return NaN;
      hour = parseInt(dateString.substring(datePos, datePos + 2), 10);
      hasHour12 = true;
      datePos += 2;
      patternPos += 2;
      matched = true;
    }
    // h - 1-2 digit hour (12h)
    else if (c === 'h' && (remaining < 2 || pattern[patternPos + 1] !== 'h')) {
      let h = 0;
      while (
        datePos < dateString.length &&
        dateString[datePos]! >= '0' &&
        dateString[datePos]! <= '9'
      ) {
        h = h * 10 + parseInt(dateString[datePos]!, 10);
        datePos++;
      }
      hour = h;
      hasHour12 = true;
      patternPos++;
      matched = true;
    }
    // mm - 2 digit minute
    else if (
      remaining >= 2 &&
      pattern.substring(patternPos, patternPos + 2) === 'mm'
    ) {
      if (datePos + 2 > dateString.length) return NaN;
      minute = parseInt(dateString.substring(datePos, datePos + 2), 10);
      datePos += 2;
      patternPos += 2;
      matched = true;
    }
    // m - 1-2 digit minute
    else if (c === 'm' && (remaining < 2 || pattern[patternPos + 1] !== 'm')) {
      let m = 0;
      while (
        datePos < dateString.length &&
        dateString[datePos]! >= '0' &&
        dateString[datePos]! <= '9'
      ) {
        m = m * 10 + parseInt(dateString[datePos]!, 10);
        datePos++;
      }
      minute = m;
      patternPos++;
      matched = true;
    }
    // ss - 2 digit second
    else if (
      remaining >= 2 &&
      pattern.substring(patternPos, patternPos + 2) === 'ss'
    ) {
      if (datePos + 2 > dateString.length) return NaN;
      second = parseInt(dateString.substring(datePos, datePos + 2), 10);
      datePos += 2;
      patternPos += 2;
      matched = true;
    }
    // s - 1-2 digit second
    else if (c === 's' && (remaining < 2 || pattern[patternPos + 1] !== 's')) {
      let s = 0;
      while (
        datePos < dateString.length &&
        dateString[datePos]! >= '0' &&
        dateString[datePos]! <= '9'
      ) {
        s = s * 10 + parseInt(dateString[datePos]!, 10);
        datePos++;
      }
      second = s;
      patternPos++;
      matched = true;
    }
    // SSS - 3 digit millisecond
    else if (
      remaining >= 3 &&
      pattern.substring(patternPos, patternPos + 3) === 'SSS'
    ) {
      if (datePos + 3 > dateString.length) return NaN;
      millisecond = parseInt(dateString.substring(datePos, datePos + 3), 10);
      datePos += 3;
      patternPos += 3;
      matched = true;
    }
    // A or a - AM/PM marker
    else if (c === 'A' || c === 'a') {
      const first = dateString[datePos];
      if (first === 'P' || first === 'p') {
        isPM = true;
      } else if (first === 'A' || first === 'a') {
        isPM = false;
      } else {
        return NaN;
      }
      datePos++;
      if (
        datePos < dateString.length &&
        (dateString[datePos] === 'M' || dateString[datePos] === 'm')
      ) {
        datePos++;
      }
      patternPos++;
      matched = true;
    }

    if (!matched) {
      if (dateString[datePos] !== pattern[patternPos]) return NaN;
      datePos++;
      patternPos++;
    }
  }

  // Convert 12-hour to 24-hour if needed
  if (hasHour12) {
    if (isPM && hour !== 12) {
      hour += 12;
    } else if (!isPM && hour === 12) {
      hour = 0;
    }
  }

  // Validate
  if (month < 1 || month > 12) return NaN;
  if (day < 1 || day > 31) return NaN;
  if (hour < 0 || hour > 23) return NaN;
  if (minute < 0 || minute > 59) return NaN;
  if (second < 0 || second > 59) return NaN;

  return Date.UTC(year, month - 1, day, hour, minute, second, millisecond);
}

const mockNativeDate = {
  now: () => Date.now(),
  parse: parseISO8601,
  parseFormat: (dateStr: string, pattern: string) => {
    const result = parseWithFormat(dateStr, pattern);
    if (isNaN(result)) {
      throw new Error(
        `Unable to parse date string: '${dateStr}' with pattern: '${pattern}'`
      );
    }
    return result;
  },
  tryParseFormat: (dateStr: string, pattern: string) =>
    parseWithFormat(dateStr, pattern),
  format: (ts: number, pattern: string) => formatDate(ts, pattern, false),
  formatUTC: formatDateUTC,
  formatFromString: (dateStr: string, pattern: string) =>
    formatDate(parseISO8601(dateStr), pattern, false),
  formatUTCFromString: (dateStr: string, pattern: string) =>
    formatDateUTC(parseISO8601(dateStr), pattern),

  // Getters (local time)
  getComponents: getComponentsFromTimestamp,
  getYear: (ts: number) => new Date(ts).getFullYear(),
  getMonth: (ts: number) => new Date(ts).getMonth() + 1,
  getDate: (ts: number) => new Date(ts).getDate(),
  getDay: (ts: number) => new Date(ts).getDay(),
  getHours: (ts: number) => new Date(ts).getHours(),
  getMinutes: (ts: number) => new Date(ts).getMinutes(),
  getSeconds: (ts: number) => new Date(ts).getSeconds(),
  getMilliseconds: (ts: number) => new Date(ts).getMilliseconds(),

  // Getters (UTC)
  getComponentsUTC: getComponentsFromTimestampUTC,
  getYearUTC: (ts: number) => new Date(ts).getUTCFullYear(),
  getMonthUTC: (ts: number) => new Date(ts).getUTCMonth() + 1,
  getDateUTC: (ts: number) => new Date(ts).getUTCDate(),
  getDayUTC: (ts: number) => new Date(ts).getUTCDay(),
  getHoursUTC: (ts: number) => new Date(ts).getUTCHours(),
  getMinutesUTC: (ts: number) => new Date(ts).getUTCMinutes(),
  getSecondsUTC: (ts: number) => new Date(ts).getUTCSeconds(),
  getMillisecondsUTC: (ts: number) => new Date(ts).getUTCMilliseconds(),

  // String input getters
  getComponentsFromString: (dateStr: string) =>
    getComponentsFromTimestamp(parseISO8601(dateStr)),
  getYearFromString: (dateStr: string) =>
    new Date(parseISO8601(dateStr)).getFullYear(),
  getMonthFromString: (dateStr: string) =>
    new Date(parseISO8601(dateStr)).getMonth() + 1,
  getDateFromString: (dateStr: string) =>
    new Date(parseISO8601(dateStr)).getDate(),
  getDayFromString: (dateStr: string) =>
    new Date(parseISO8601(dateStr)).getDay(),
  getHoursFromString: (dateStr: string) =>
    new Date(parseISO8601(dateStr)).getHours(),
  getMinutesFromString: (dateStr: string) =>
    new Date(parseISO8601(dateStr)).getMinutes(),
  getSecondsFromString: (dateStr: string) =>
    new Date(parseISO8601(dateStr)).getSeconds(),
  getMillisecondsFromString: (dateStr: string) =>
    new Date(parseISO8601(dateStr)).getMilliseconds(),

  // Date info
  getDaysInMonth: (ts: number) => {
    const date = new Date(ts);
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  },
  isLeapYear: (ts: number) => {
    const year = new Date(ts).getFullYear();
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  },
  isWeekend: (ts: number) => {
    const day = new Date(ts).getDay();
    return day === 0 || day === 6;
  },
  isValid: (ts: number) => !isNaN(ts) && isFinite(ts),

  // Arithmetic
  add: addToDate,
  subtract: (ts: number, amount: number, unit: TimeUnit) =>
    addToDate(ts, -amount, unit),

  // Comparisons
  isBefore: (t1: number, t2: number) => t1 < t2,
  isAfter: (t1: number, t2: number) => t1 > t2,
  isSame: isSameUnit,

  // Helpers
  startOf: startOfUnit,
  endOf: endOfUnit,
  diff: diffInUnit,
  clamp: (ts: number, minVal: number, maxVal: number) =>
    Math.max(minVal, Math.min(maxVal, ts)),
  min: (timestamps: number[]) => Math.min(...timestamps),
  max: (timestamps: number[]) => Math.max(...timestamps),

  // Relative time formatting
  formatDistance: (
    timestamp: number,
    baseTimestamp: number,
    addSuffix: boolean
  ): string => {
    const diffMs = timestamp - baseTimestamp;
    const isFuture = diffMs > 0;
    const absDiffMs = Math.abs(diffMs);

    const seconds = absDiffMs / 1000;
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
  },

  formatDuration: (milliseconds: number): string => {
    if (milliseconds < 0) {
      milliseconds = -milliseconds;
    }

    const totalSeconds = Math.floor(milliseconds / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);

    const seconds = totalSeconds % 60;
    const minutes = totalMinutes % 60;
    const hours = totalHours % 24;
    const days = totalDays;

    let result = '';

    if (days > 0) {
      result += `${days}d `;
    }
    if (hours > 0 || days > 0) {
      result += `${hours}h `;
    }
    if (minutes > 0 || hours > 0 || days > 0) {
      result += `${minutes}m `;
    }
    result += `${seconds}s`;

    return result;
  },

  // Timezone
  getTimezone: () => 'America/New_York',
  getTimezoneOffset: () => new Date().getTimezoneOffset(),
  getTimezoneOffsetForTimestamp: () => new Date().getTimezoneOffset(),
  getOffsetInTimezone: (ts: number, tz: string) => getTimezoneOffsetForDate(tz, ts),
  toTimezone: (ts: number, _tz: string) => ts, // Simplified
  formatInTimezone: (ts: number, pattern: string, tz: string) => {
    // Apply timezone offset for proper formatting
    const offset = getTimezoneOffsetForDate(tz, ts);
    const adjustedTs = ts + offset * 60 * 1000;
    return formatDate(adjustedTs, pattern, true); // Use UTC after adjustment
  },
  getAvailableTimezones: () => AVAILABLE_TIMEZONES,
  isValidTimezone: (tz: string) => AVAILABLE_TIMEZONES.includes(tz),

  // Timezone-aware predicates (InTz)
  isTodayInTz: (ts: number, tz: string) => {
    const dateStr = mockNativeDate.formatInTimezone(ts, 'yyyy-MM-dd', tz);
    const todayStr = mockNativeDate.formatInTimezone(Date.now(), 'yyyy-MM-dd', tz);
    return dateStr === todayStr;
  },
  isTomorrowInTz: (ts: number, tz: string) => {
    const dateStr = mockNativeDate.formatInTimezone(ts, 'yyyy-MM-dd', tz);
    const tomorrowTs = addToDate(Date.now(), 1, 'day');
    const tomorrowStr = mockNativeDate.formatInTimezone(tomorrowTs, 'yyyy-MM-dd', tz);
    return dateStr === tomorrowStr;
  },
  isYesterdayInTz: (ts: number, tz: string) => {
    const dateStr = mockNativeDate.formatInTimezone(ts, 'yyyy-MM-dd', tz);
    const yesterdayTs = addToDate(Date.now(), -1, 'day');
    const yesterdayStr = mockNativeDate.formatInTimezone(yesterdayTs, 'yyyy-MM-dd', tz);
    return dateStr === yesterdayStr;
  },
  isSameDayInTz: (ts1: number, ts2: number, tz: string) => {
    return mockNativeDate.formatInTimezone(ts1, 'yyyy-MM-dd', tz) ===
           mockNativeDate.formatInTimezone(ts2, 'yyyy-MM-dd', tz);
  },
  isSameMonthInTz: (ts1: number, ts2: number, tz: string) => {
    return mockNativeDate.formatInTimezone(ts1, 'yyyy-MM', tz) ===
           mockNativeDate.formatInTimezone(ts2, 'yyyy-MM', tz);
  },
  isSameYearInTz: (ts1: number, ts2: number, tz: string) => {
    return mockNativeDate.formatInTimezone(ts1, 'yyyy', tz) ===
           mockNativeDate.formatInTimezone(ts2, 'yyyy', tz);
  },
  startOfDayInTz: (ts: number, tz: string) => {
    const dateStr = mockNativeDate.formatInTimezone(ts, 'yyyy-MM-dd', tz);
    const utcMidnight = parseISO8601(dateStr + 'T00:00:00Z');
    const offsetMinutes = getTimezoneOffsetForDate(tz, utcMidnight);
    return utcMidnight - (offsetMinutes * 60 * 1000);
  },
  endOfDayInTz: (ts: number, tz: string) => {
    const nextDay = addToDate(ts, 1, 'day');
    const dateStr = mockNativeDate.formatInTimezone(nextDay, 'yyyy-MM-dd', tz);
    const utcMidnight = parseISO8601(dateStr + 'T00:00:00Z');
    const offsetMinutes = getTimezoneOffsetForDate(tz, utcMidnight);
    return utcMidnight - (offsetMinutes * 60 * 1000) - 1;
  },

  // Async batch operations
  parseManyAsync: async (dateStrings: string[]) => {
    return dateStrings.map((s) => {
      try {
        return parseISO8601(s);
      } catch {
        return NaN;
      }
    });
  },
  formatManyAsync: async (timestamps: number[], pattern: string) => {
    return timestamps.map((ts) => formatDate(ts, pattern));
  },
  getComponentsManyAsync: async (timestamps: number[]) => {
    return timestamps.map(getComponentsFromTimestamp);
  },
};

export const NitroModules = {
  createHybridObject: <T>(_name: string): T => mockNativeDate as T,
};
