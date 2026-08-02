export interface Photo {
  id: number
  apartmentId: string | null
  url: string
  alt: string
  altEn: string
  sortOrder: number
  hidden: boolean
  onHomepage: boolean
}
