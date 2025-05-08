import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getAllMatches } from './matchService'
import { Match } from '@/lib/api-types'

describe('matchService', () => {
  const mockFetcher = vi.fn()

  const mockMatches: Match[] = [
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
          ],
        },
      ],
    },
    {
      matchId: 'match2',
      courtId: 'court2',
      sport: 'PADEL',
      venueId: 'venue2',
      startDate: '2024-01-02T14:00Z',
      endDate: '2024-01-02T16:00Z',
      teams: [
        {
          id: 'team2',
          players: [
            { userId: 'user2', displayName: 'Player 2', pictureURL: null, email: 'user2@example.com' },
          ],
        },
      ],
    },
  ]

  const mockHeaders = {
    get: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetcher.mockReset()
    mockHeaders.get.mockReset()
  })

  describe('getAllMatches', () => {
    it('should fetch all matches with pagination', async () => {
      mockHeaders.get.mockReturnValueOnce('3')
      mockFetcher.mockResolvedValueOnce({
        ok: true,
        headers: mockHeaders,
        data: [mockMatches[0], mockMatches[1]],
      })

      mockHeaders.get.mockReturnValueOnce('3')
      mockFetcher.mockResolvedValueOnce({
        ok: true,
        headers: mockHeaders,
        data: [
          {
            matchId: 'match3',
            courtId: 'court3',
            sport: 'TENNIS',
            venueId: 'venue3',
            startDate: '2024-01-03T15:00Z',
            endDate: '2024-01-03T17:00Z',
            teams: [],
          },
        ],
      })

      const result = await getAllMatches(mockFetcher)

      expect(mockFetcher).toHaveBeenCalledTimes(2)
      expect(mockFetcher).toHaveBeenNthCalledWith(1, 'GET /v1/matches', { page: 0, size: 10 })
      expect(mockFetcher).toHaveBeenNthCalledWith(2, 'GET /v1/matches', { page: 1, size: 10 })

      expect(result.length).toBe(3)
      expect(result[0].matchId).toBe('match1')
      expect(result[2].matchId).toBe('match3')
    })

    it('should handle case where total header is missing', async () => {
      mockHeaders.get.mockReturnValueOnce(null)
      mockFetcher.mockResolvedValueOnce({
        ok: true,
        headers: mockHeaders,
        data: mockMatches,
      })

      mockHeaders.get.mockReturnValueOnce(null)
      mockFetcher.mockResolvedValueOnce({
        ok: true,
        headers: mockHeaders,
        data: [],
      })

      const result = await getAllMatches(mockFetcher)

      expect(result.length).toBe(2)
      expect(result).toEqual(mockMatches)
    })

    it('should throw error when API call fails', async () => {
      mockFetcher.mockResolvedValueOnce({
        ok: false,
        data: { message: 'Error fetching matches' },
      })

      await expect(getAllMatches(mockFetcher)).rejects.toThrow('Error fetching matches')
      expect(mockFetcher).toHaveBeenCalledTimes(1)
    })

    it('should handle empty response', async () => {
      mockHeaders.get.mockReturnValueOnce('0')
      mockFetcher.mockResolvedValueOnce({
        ok: true,
        headers: mockHeaders,
        data: [],
      })

      const result = await getAllMatches(mockFetcher)

      expect(result).toEqual([])
      expect(mockFetcher).toHaveBeenCalledTimes(1)
    })
  })
})
