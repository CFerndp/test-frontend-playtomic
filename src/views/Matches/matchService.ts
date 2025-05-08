import { ApiFetcher } from '@/lib/api/fetcher'
import { Match } from '@/lib/api-types'

export const getAllMatches = async (fetcher: ApiFetcher) => {
  const allMatches: Match[] = []
  let hasMore = true
  let page = 0
  const size = 10
  let total = 1000

  while (hasMore) {
    const res = await fetcher('GET /v1/matches', { page, size })

    if (!res.ok) {
      throw new Error(res.data.message)
    }

    const totalHeader = res.headers.get('total')
    total = totalHeader ? Number.parseInt(totalHeader) : 0

    const matches = res.data
    allMatches.push(...matches)

    if (allMatches.length >= total) {
      hasMore = false
    }
    page++
  }

  return allMatches
}
