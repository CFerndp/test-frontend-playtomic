import { describe, it, expect } from 'vitest'
import { convertMatchesToCSV } from './convertMatchesToCSV'
import { Match } from '@/lib/api-types'

describe('convertMatchesToCSV', () => {
  it('should convert an empty array to a CSV with just headers', () => {
    const matches: Match[] = []
    const csv = convertMatchesToCSV(matches)

    const expected = 'MatchID;CourtID;Sport;StartDate;EndDate;Duration;Players'
    expect(csv).toBe(expected)
  })

  it('should convert a single match to CSV format', () => {
    const matches: Match[] = [
      {
        matchId: 'match1',
        courtId: 'court1',
        sport: 'TENNIS',
        venueId: 'venue1',
        startDate: '2024-01-01T10:00Z',
        endDate: '2024-01-01T12:00Z',
        teams: [
          {
            id: 'team1',
            players: [
              { userId: 'user1', displayName: 'Player 1', pictureURL: null, email: 'user1@example.com' },
              { userId: 'user2', displayName: 'Player 2', pictureURL: null, email: 'user2@example.com' },
            ],
          },
        ],
      },
    ]

    const csv = convertMatchesToCSV(matches)

    const expected = [
      'MatchID;CourtID;Sport;StartDate;EndDate;Duration;Players',
      'match1;court1;TENNIS;2024-01-01T10:00Z;2024-01-01T12:00Z;user1, user2',
    ].join('\n')

    expect(csv).toBe(expected)
  })

  it('should convert multiple matches with multiple teams to CSV format', () => {
    const matches: Match[] = [
      {
        matchId: 'match1',
        courtId: 'court1',
        sport: 'TENNIS',
        venueId: 'venue1',
        startDate: '2024-01-01T10:00Z',
        endDate: '2024-01-01T12:00Z',
        teams: [
          {
            id: 'team1',
            players: [
              { userId: 'user1', displayName: 'Player 1', pictureURL: null, email: 'user1@example.com' },
              { userId: 'user2', displayName: 'Player 2', pictureURL: null, email: 'user2@example.com' },
            ],
          },
          {
            id: 'team2',
            players: [
              { userId: 'user3', displayName: 'Player 3', pictureURL: null, email: 'user3@example.com' },
              { userId: 'user4', displayName: 'Player 4', pictureURL: null, email: 'user4@example.com' },
            ],
          },
        ],
      },
      {
        matchId: 'match2',
        courtId: 'court2',
        sport: 'PADEL',
        venueId: 'venue2',
        startDate: '2024-01-02T15:00Z',
        endDate: '2024-01-02T17:00Z',
        teams: [
          {
            id: 'team3',
            players: [
              { userId: 'user5', displayName: 'Player 5', pictureURL: null, email: 'user5@example.com' },
            ],
          },
        ],
      },
    ]

    const csv = convertMatchesToCSV(matches)

    const expected = [
      'MatchID;CourtID;Sport;StartDate;EndDate;Duration;Players',
      'match1;court1;TENNIS;2024-01-01T10:00Z;2024-01-01T12:00Z;user1, user2, user3, user4',
      'match2;court2;PADEL;2024-01-02T15:00Z;2024-01-02T17:00Z;user5',
    ].join('\n')

    expect(csv).toBe(expected)
  })

  it('should handle matches without players correctly', () => {
    const matches: Match[] = [
      {
        matchId: 'match1',
        courtId: 'court1',
        sport: 'TENNIS',
        venueId: 'venue1',
        startDate: '2024-01-01T10:00Z',
        endDate: '2024-01-01T12:00Z',
        teams: [],
      },
    ]

    const csv = convertMatchesToCSV(matches)

    const expected = [
      'MatchID;CourtID;Sport;StartDate;EndDate;Duration;Players',
      'match1;court1;TENNIS;2024-01-01T10:00Z;2024-01-01T12:00Z;',
    ].join('\n')

    expect(csv).toBe(expected)
  })

  it('should handle special characters in data correctly', () => {
    const matches: Match[] = [
      {
        matchId: 'match;with;semicolons',
        courtId: 'court-1',
        sport: 'TENNIS',
        venueId: 'venue1',
        startDate: '2024-01-01T10:00Z',
        endDate: '2024-01-01T12:00Z',
        teams: [
          {
            id: 'team1',
            players: [
              { userId: 'user;1', displayName: 'Player; 1', pictureURL: null, email: 'user1@example.com' },
            ],
          },
        ],
      },
    ]

    const csv = convertMatchesToCSV(matches)

    const expected = [
      'MatchID;CourtID;Sport;StartDate;EndDate;Duration;Players',
      'match;with;semicolons;court-1;TENNIS;2024-01-01T10:00Z;2024-01-01T12:00Z;user;1',
    ].join('\n')

    expect(csv).toBe(expected)
  })
})
