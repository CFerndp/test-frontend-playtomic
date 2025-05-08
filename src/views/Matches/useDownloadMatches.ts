import { useApiFetcher } from '@/lib/api'
import { getAllMatches } from './matchService'
import { useState } from 'react'
import { convertMatchesToCSV } from '@/lib/utils/convertMatchesToCSV'
import { exportCSV } from '@/lib/utils/exportCSV'

export const useDownloadMatches = () => {
  const fetcher = useApiFetcher()
  const [isLoading, setIsLoading] = useState(false)

  const onExportAllMatches = async () => {
    setIsLoading(true)

    try {
      const allMatches = await getAllMatches(fetcher)
      const csv = convertMatchesToCSV(allMatches)
      exportCSV(csv, 'matches')
    } catch (error) {
      alert('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return { onExportAllMatches, isLoading }
}
