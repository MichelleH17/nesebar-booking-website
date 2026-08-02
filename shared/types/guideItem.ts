export interface GuideItem {
  id: number
  type: 'beach' | 'trip' | 'info'
  title: string
  titleEn: string
  description: string
  descriptionEn: string
  imageUrl: string | null
  meta: string | null
  metaEn: string | null
  sortOrder: number
  hidden: boolean
}
