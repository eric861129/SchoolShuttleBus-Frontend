import dayjs from 'dayjs'

export function mondayOfWeek(isoDate?: string) {
  const base = isoDate ? dayjs(isoDate) : dayjs()
  const weekday = base.day()
  const diff = weekday === 0 ? -6 : 1 - weekday
  return base.add(diff, 'day').format('YYYY-MM-DD')
}

export function nextWeekMonday(isoDate?: string) {
  return dayjs(mondayOfWeek(isoDate)).add(7, 'day').format('YYYY-MM-DD')
}

export function addDays(isoDate: string, amount: number) {
  return dayjs(isoDate).add(amount, 'day').format('YYYY-MM-DD')
}

export function todayInTimeZone(timeZone = 'Asia/Taipei') {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value

  return `${year}-${month}-${day}`
}

export function weekdayInTimeZone(timeZone = 'Asia/Taipei') {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
  }).format(new Date())

  return ({
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  } as const)[weekday]
}

export function formatDateLabel(isoDate: string, locale = 'zh-TW') {
  return formatDateLabelForLocale(isoDate, locale)
}

export function formatDateLabelForLocale(isoDate: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(`${isoDate}T00:00:00`))
}
