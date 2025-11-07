// Utility to format dates consistently as DD/MM/YYYY
export default function formatDate(value) {
  if (!value) return ''
  try {
    const d = (value instanceof Date) ? value : new Date(value)
    if (isNaN(d.getTime())) return ''
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)
  } catch (e) {
    return ''
  }
}
