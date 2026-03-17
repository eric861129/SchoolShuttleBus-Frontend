import dayjs from 'dayjs'

export function mondayOfWeek(isoDate?: string) {
  const base = isoDate ? dayjs(isoDate) : dayjs()
  const weekday = base.day()
  const diff = weekday === 0 ? -6 : 1 - weekday
  return base.add(diff, 'day').format('YYYY-MM-DD')
}

export function nextWeekMonday() {
  return dayjs(mondayOfWeek()).add(7, 'day').format('YYYY-MM-DD')
}

export function addDays(isoDate: string, amount: number) {
  return dayjs(isoDate).add(amount, 'day').format('YYYY-MM-DD')
}

export function formatDateLabel(isoDate: string) {
  return dayjs(isoDate).format('M/D ddd')
}
