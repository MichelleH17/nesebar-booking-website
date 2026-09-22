export interface Apartment {
  id: string
  label: string
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  capacity: number
  nightlyRate: number
  perPersonPricing: boolean
  priceHidden: boolean
  hidden: boolean
}

/** What /api/apartments returns to callers without a session — no pricing columns. */
export type PublicApartment = Omit<Apartment, 'nightlyRate' | 'perPersonPricing' | 'priceHidden'>
