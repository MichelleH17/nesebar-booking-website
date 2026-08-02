// Full shape — GET /api/mail-recipients?all (admin only).
export interface MailRecipient {
  id: number
  name: string
  email: string
  active: boolean
  sortOrder: number
}

// Minimal shape — GET /api/mail-recipients (default, active-only, feeds the reservation form).
export interface MailRecipientSummary {
  id: number
  name: string
  email: string
}
