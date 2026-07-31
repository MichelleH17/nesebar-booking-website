import nodemailer from 'nodemailer'
import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { apartments, mailRecipients, type reservations } from '~~/server/db/schema'
import { nights } from '~~/shared/utils/booking'

type ReservationRow = typeof reservations.$inferSelect

export type ReservationMailKind = 'created' | 'updated' | 'cancelled'

const TRAVEL_LABELS: Record<string, string> = {
  car: 'autem',
  plane: 'letadlem',
  bus: 'autobusem',
  train: 'vlakem',
}

const KIND_PREFIX: Record<ReservationMailKind, string> = {
  created: 'Nová rezervace',
  updated: 'Změna rezervace',
  cancelled: 'Zrušená rezervace',
}

const CZ_MONTHS = [
  '1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.', '10.', '11.', '12.',
]

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatNights(n: number): string {
  return n === 1 ? 'noc' : n >= 2 && n <= 4 ? 'noci' : 'nocí'
}

function formatCzDateRange(arrival: string, departure: string): string {
  const [ay = 0, am = 1, ad = 1] = arrival.split('-').map(Number)
  const [dy = 0, dm = 1, dd = 1] = departure.split('-').map(Number)

  if (ay === dy && am === dm) {
    return `${ad}.–${dd}. ${CZ_MONTHS[am - 1]} ${ay}`
  }
  if (ay === dy) {
    return `${ad}. ${CZ_MONTHS[am - 1]} – ${dd}. ${CZ_MONTHS[dm - 1]} ${ay}`
  }
  return `${ad}. ${CZ_MONTHS[am - 1]} ${ay} – ${dd}. ${CZ_MONTHS[dm - 1]} ${dy}`
}

function resolveRecipients(r: ReservationRow): string[] {
  if (r.notifyEmails && r.notifyEmails.length > 0) {
    return r.notifyEmails
  }
  const db = useDb()
  const active = db
    .select()
    .from(mailRecipients)
    .where(eq(mailRecipients.active, true))
    .orderBy(mailRecipients.sortOrder)
    .all()
  const first = active[0]
  if (first) {
    return [first.email]
  }
  const config = useRuntimeConfig()
  return config.mailTo ? [config.mailTo] : []
}

export async function sendReservationMail(
  kind: ReservationMailKind,
  r: ReservationRow,
): Promise<{ sent: boolean }> {
  try {
    const db = useDb()
    const apartment = db.select().from(apartments).where(eq(apartments.id, r.apartmentId)).get()
    const apartmentName = apartment?.name ?? r.apartmentId

    const n = nights(r.arrival, r.departure)
    const dateRange = formatCzDateRange(r.arrival, r.departure)
    const travelLabel = TRAVEL_LABELS[r.travelMethod] ?? r.travelMethod
    const priceText = r.priceApplied != null ? `${r.priceApplied} Kč` : 'zdarma (rodina)'

    const subject = `${KIND_PREFIX[kind]} – ${apartmentName}, ${dateRange}`

    const textLines = [
      `${KIND_PREFIX[kind]}`,
      '',
      `Apartmán: ${apartmentName}`,
      `Host: ${r.guestName}`,
      `Termín: ${dateRange} (${n} ${formatNights(n)})`,
      `Počet osob: ${r.people}`,
      `Doprava: ${travelLabel}`,
      `Cena: ${priceText}`,
      r.notes ? `Poznámka: ${r.notes}` : '',
    ].filter(Boolean)
    const text = textLines.join('\n')

    const html = `
      <div style="font-family: sans-serif; line-height: 1.6; color: #2b2420;">
        <h2 style="margin-bottom: 4px;">${KIND_PREFIX[kind]}</h2>
        <p><strong>Apartmán:</strong> ${escapeHtml(apartmentName)}</p>
        <p><strong>Host:</strong> ${escapeHtml(r.guestName)}</p>
        <p><strong>Termín:</strong> ${dateRange} (${n} ${formatNights(n)})</p>
        <p><strong>Počet osob:</strong> ${r.people}</p>
        <p><strong>Doprava:</strong> ${travelLabel}</p>
        <p><strong>Cena:</strong> ${priceText}</p>
        ${r.notes ? `<p><strong>Poznámka:</strong> ${escapeHtml(r.notes)}</p>` : ''}
      </div>
    `.trim()

    const recipients = resolveRecipients(r)
    const config = useRuntimeConfig()

    if (!config.smtpHost) {
      console.log('[mail:fallback]', recipients, subject, text)
      return { sent: false }
    }

    if (recipients.length === 0) {
      console.log('[mail:no-recipients]', subject, text)
      return { sent: false }
    }

    const port = Number(config.smtpPort)
    const transport = nodemailer.createTransport({
      host: config.smtpHost,
      port,
      secure: port === 465,
      auth: config.smtpUser ? { user: config.smtpUser, pass: config.smtpPass } : undefined,
    })

    await transport.sendMail({
      from: config.smtpUser || config.mailTo,
      to: recipients.join(', '),
      subject,
      text,
      html,
    })

    return { sent: true }
  } catch (err) {
    console.error('[mail:error]', err)
    return { sent: false }
  }
}
