/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const TARGET_TIMEZONE = 'Africa/Kampala'; // EAT (UTC+3)

export interface KampalaDateInfo {
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:mm:ss
  dayName: string; // Friday
  dayMonth: string; // 21 Aug
  fullYear: number; // 2026
  formattedHeader: string; // Friday, 21 August 2026
  todayStartIso: string;
  todayEndIso: string;
  timeZone: string;
}

/**
 * Returns today's YYYY-MM-DD in Africa/Kampala timezone
 */
export function getKampalaTodayDateStr(refDate: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TARGET_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(refDate); // Returns 'YYYY-MM-DD'
}

/**
 * Returns comprehensive date information evaluated strictly in Africa/Kampala timezone
 */
export function getKampalaDateInfo(refDate: Date = new Date()): KampalaDateInfo {
  const dateStr = getKampalaTodayDateStr(refDate);
  
  const dayNameFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: TARGET_TIMEZONE,
    weekday: 'long'
  });
  const dayMonthFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: TARGET_TIMEZONE,
    day: 'numeric',
    month: 'short'
  });
  const headerFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: TARGET_TIMEZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const yearFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: TARGET_TIMEZONE,
    year: 'numeric'
  });

  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: TARGET_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  return {
    dateStr,
    timeStr: timeFormatter.format(refDate),
    dayName: dayNameFormatter.format(refDate),
    dayMonth: dayMonthFormatter.format(refDate),
    fullYear: parseInt(yearFormatter.format(refDate), 10) || refDate.getFullYear(),
    formattedHeader: headerFormatter.format(refDate),
    todayStartIso: `${dateStr}T00:00:00+03:00`,
    todayEndIso: `${dateStr}T23:59:59+03:00`,
    timeZone: TARGET_TIMEZONE
  };
}

/**
 * Converts any fixture kickoff timestamp, ISO string, or Date into YYYY-MM-DD in Africa/Kampala
 */
export function getKampalaDateFromTimestamp(timestampOrIso: string | number | Date | null | undefined): string | null {
  if (!timestampOrIso) return null;
  try {
    let dateObj: Date;
    if (typeof timestampOrIso === 'number') {
      // If unix seconds vs milliseconds
      dateObj = timestampOrIso < 10000000000 ? new Date(timestampOrIso * 1000) : new Date(timestampOrIso);
    } else if (typeof timestampOrIso === 'string') {
      // Handle string numbers (unix timestamps)
      const numericVal = Number(timestampOrIso);
      if (!isNaN(numericVal) && numericVal > 100000000) {
        dateObj = numericVal < 10000000000 ? new Date(numericVal * 1000) : new Date(numericVal);
      } else {
        dateObj = new Date(timestampOrIso);
      }
    } else {
      dateObj = timestampOrIso;
    }

    if (isNaN(dateObj.getTime())) return null;

    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: TARGET_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(dateObj);
  } catch {
    return null;
  }
}

/**
 * STRICT DOUBLE DATE VALIDATION:
 * Validates whether a fixture's official kickoff timestamp matches TODAY in Africa/Kampala.
 */
export function isFixtureTodayInKampala(
  timestampOrIso: string | number | Date | null | undefined,
  targetDateStr?: string
): boolean {
  const currentTodayInKampala = targetDateStr || getKampalaTodayDateStr();
  const fixtureLocalDateInKampala = getKampalaDateFromTimestamp(timestampOrIso);
  
  if (!fixtureLocalDateInKampala) return false;
  return fixtureLocalDateInKampala === currentTodayInKampala;
}

/**
 * Formats kickoff time into exact 24-hour time in Africa/Kampala (e.g. "22:00 EAT")
 */
export function formatKampalaTime(timestampOrIso: string | number | Date | null | undefined): string {
  if (!timestampOrIso) return 'Today EAT';
  try {
    let dateObj: Date;
    if (typeof timestampOrIso === 'number') {
      dateObj = timestampOrIso < 10000000000 ? new Date(timestampOrIso * 1000) : new Date(timestampOrIso);
    } else if (typeof timestampOrIso === 'string') {
      const numericVal = Number(timestampOrIso);
      if (!isNaN(numericVal) && numericVal > 100000000) {
        dateObj = numericVal < 10000000000 ? new Date(numericVal * 1000) : new Date(numericVal);
      } else {
        dateObj = new Date(timestampOrIso);
      }
    } else {
      dateObj = timestampOrIso;
    }

    if (isNaN(dateObj.getTime())) return 'Today EAT';

    const timeFormatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: TARGET_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    return `${timeFormatter.format(dateObj)} EAT`;
  } catch {
    return 'Today EAT';
  }
}
