export interface StoreFixture {
  id: string
  name: string
  /** Relative order-volume weight and how it trends over the 120-day window (1 = flat). */
  weight: number
  trend: number
}

export const STORES: StoreFixture[] = [
  { id: '11111111-1111-4111-8111-111111111111', name: 'PIK Avenue', weight: 0.30, trend: 1.15 },
  { id: '22222222-2222-4222-8222-222222222222', name: 'Grand Indonesia', weight: 0.27, trend: 0.88 },
  { id: '33333333-3333-4333-8333-333333333333', name: 'Plaza Senayan', weight: 0.28, trend: 1.03 },
  { id: '44444444-4444-4444-8444-444444444444', name: 'Pakuwon Surabaya', weight: 0.15, trend: 1.7 },
]
