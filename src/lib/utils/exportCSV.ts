export const exportCSV = (data: string, title: string) => {
  const blob = new Blob([data], { type: 'text/csv' })

  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `${title}.csv`
  a.click()

  URL.revokeObjectURL(url)
}
