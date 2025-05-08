import { Match } from '@/lib/api-types'

export const convertMatchesToCSV = (matches: Match[]): string => {
  const headers = ['MatchID', 'CourtID', 'Sport', 'StartDate', 'EndDate', 'Duration', 'Players']

  const rows = matches.map(match => {
    const playerNames = match.teams
      .flatMap(team => team.players)
      .map(player => player.userId)
      .join(', ')

    return [match.matchId, match.courtId, match.sport, match.startDate, match.endDate, playerNames]
  })

  return [headers.join(';'), ...rows.map(row => row.join(';'))].join('\n')
}
