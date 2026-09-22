import { Hash } from '@adonisjs/hash'
import { Scrypt } from '@adonisjs/hash/drivers/scrypt'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { useDb } from './index'
import { users, apartments, photos, reservations, mailRecipients, guideItems } from './schema'

// Standalone script (runs via tsx, outside Nitro) — nuxt-auth-utils' hashPassword/verifyPassword
// rely on #imports (useRuntimeConfig) and can't be used here. They are thin wrappers around
// @adonisjs/hash's Scrypt driver with default options (no hash.scrypt override in nuxt.config.ts),
// so we use that driver directly. Hashes produced here verify correctly via verifyPassword() at runtime.
const hasher = new Hash(new Scrypt({}))

try { process.loadEnvFile() } catch { /* .env is optional, e.g. in CI */ }

// No fallbacks for the real accounts: this file is committed, so a default password here
// would be a published credential for every deployment that forgot to set the env var.
function requiredPassword(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is not set — copy .env.example to .env and set the seed passwords.`)
  }
  return value
}

const PASSWORD = requiredPassword('SEED_FAMILY_PASSWORD')
const MICHAELA_PASSWORD = requiredPassword('SEED_ADMIN_PASSWORD')
// The demo account is a public portfolio login (see server/api/auth/demo.post.ts signs in
// without credentials), so its password guards nothing and may keep a default.
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || 'demo'

function todayPlus(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function now() {
  return new Date().toISOString()
}

function generatePlaceholderSvg(index: number, colorA: string, colorB: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="g${index}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colorA}"/>
      <stop offset="100%" stop-color="${colorB}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#g${index})"/>
</svg>`
}

async function main() {
  const db = useDb()

  const existing = await db.select().from(users).limit(1).all()
  if (existing.length > 0) {
    console.log('Seed skipped: users already exist.')
    return
  }

  // --- Apartments ---
  await db.insert(apartments).values([
    { id: '15B', label: '15B', name: 'Apartmán 15B - rodiče', nameEn: 'Apartment 15B - parents', description: 'Útulný apartmán pro až 3 osoby s výhledem na bazén a přímým vstupem na společný balkon.', descriptionEn: 'A cosy apartment for up to 3 guests with a pool view and direct access to the shared balcony.', capacity: 3, nightlyRate: 1100, perPersonPricing: false },
    { id: '16B', label: '16B', name: 'Apartmán 16B - bratr', nameEn: 'Apartment 16B - brother', description: 'Apartmán pro až 4 osoby s výhledem na bazén a přímým vstupem na společný balkon.', descriptionEn: 'An apartment for up to 4 guests with a pool view and direct access to the shared balcony.', capacity: 4, nightlyRate: 1300, perPersonPricing: false },
  ]).run()

  // --- Users ---
  const passwordHash = await hasher.make(PASSWORD)
  const michaelaPasswordHash = await hasher.make(MICHAELA_PASSWORD)
  const demoPasswordHash = await hasher.make(DEMO_PASSWORD)

  const insertedUsers = [
    { name: 'Michaela', email: 'michaela@example.com', role: 'admin' as const, color: '#7A9E65', sortOrder: 1, passwordHash: michaelaPasswordHash, password: MICHAELA_PASSWORD },
    { name: 'Vojta', email: 'vojta@example.com', role: 'family' as const, color: '#4A90A4', sortOrder: 4, passwordHash, password: PASSWORD },
    { name: 'Břeťa', email: 'breta@example.com', role: 'family' as const, color: '#C96F4A', sortOrder: 3, passwordHash, password: PASSWORD },
    { name: 'Rodiče', email: 'rodice@example.com', role: 'family' as const, color: '#B08BBB', sortOrder: 2, passwordHash, password: PASSWORD },
    { name: 'Demo', email: 'demo@example.com', role: 'demo' as const, color: '#D9A404', sortOrder: 9, passwordHash: demoPasswordHash, password: DEMO_PASSWORD },
  ]

  const userIds: Record<string, number> = {}
  for (const u of insertedUsers) {
    const row = await db.insert(users).values({
      name: u.name,
      email: u.email,
      passwordHash: u.passwordHash,
      role: u.role,
      color: u.color,
      sortOrder: u.sortOrder,
      createdAt: now(),
    }).returning({ id: users.id }).get()
    userIds[u.email] = row.id
  }

  // Seeded above, so lookups can't miss — throw loudly if they ever do.
  const uid = (email: string): number => {
    const id = userIds[email]
    if (id === undefined) throw new Error(`Seed: neznámý uživatel ${email}`)
    return id
  }

  // --- Mail recipients ---
  await db.insert(mailRecipients).values([
    { name: 'Michaela', email: 'michaela@example.com', active: true, sortOrder: 0 },
    { name: 'Vojta', email: 'vojta@example.com', active: true, sortOrder: 1 },
    { name: 'Břeťa', email: 'breta@example.com', active: true, sortOrder: 2 },
    { name: 'Rodiče', email: 'rodice@example.com', active: true, sortOrder: 3 },
  ]).run()

  // --- Reservations (6, across next two months, incl. same-day changeover pair on 15B
  //     and one non-family guest reservation with priceApplied) ---
  const tsBase = now()
  await db.insert(reservations).values([
    // family stay, 15B
    {
      apartmentId: '15B',
      userId: uid('vojta@example.com'),
      guestName: 'Vojta',
      people: 2,
      arrival: todayPlus(5),
      departure: todayPlus(10),
      travelMethod: 'car',
      notes: '',
      priceApplied: null,
      notifyEmails: ['michaela@example.com'],
      status: 'active',
      createdAt: tsBase,
      updatedAt: tsBase,
    },
    // same-day changeover pair on 15B: first stay departs the day the second arrives
    {
      apartmentId: '15B',
      userId: uid('breta@example.com'),
      guestName: 'Břeťa',
      people: 3,
      arrival: todayPlus(10),
      departure: todayPlus(15),
      travelMethod: 'plane',
      notes: 'Přílet odpoledne, prosíme koordinovat předání klíčů s předchozím pobytem.',
      priceApplied: null,
      notifyEmails: ['michaela@example.com'],
      status: 'active',
      createdAt: tsBase,
      updatedAt: tsBase,
    },
    // family stay, 16B
    {
      apartmentId: '16B',
      userId: uid('rodice@example.com'),
      guestName: 'Rodiče',
      people: 2,
      arrival: todayPlus(20),
      departure: todayPlus(27),
      travelMethod: 'car',
      notes: '',
      priceApplied: null,
      notifyEmails: ['michaela@example.com'],
      status: 'active',
      createdAt: tsBase,
      updatedAt: tsBase,
    },
    // admin-managed stay, 16B
    {
      apartmentId: '16B',
      userId: uid('michaela@example.com'),
      guestName: 'Michaela',
      people: 4,
      arrival: todayPlus(35),
      departure: todayPlus(40),
      travelMethod: 'bus',
      notes: '',
      priceApplied: null,
      notifyEmails: ['michaela@example.com'],
      status: 'active',
      createdAt: tsBase,
      updatedAt: tsBase,
    },
    // non-family guest reservation with priceApplied, 15B
    {
      apartmentId: '15B',
      userId: uid('michaela@example.com'),
      guestName: 'Host s rodinou',
      people: 3,
      arrival: todayPlus(45),
      departure: todayPlus(50),
      travelMethod: 'train',
      notes: 'Platící host, domluveno předem s adminem.',
      priceApplied: 5500,
      notifyEmails: ['michaela@example.com'],
      status: 'active',
      createdAt: tsBase,
      updatedAt: tsBase,
    },
    // family stay, 16B
    {
      apartmentId: '16B',
      userId: uid('vojta@example.com'),
      guestName: 'Vojta',
      people: 4,
      arrival: todayPlus(55),
      departure: todayPlus(58),
      travelMethod: 'car',
      notes: '',
      priceApplied: null,
      notifyEmails: ['michaela@example.com'],
      status: 'active',
      createdAt: tsBase,
      updatedAt: tsBase,
    },
  ]).run()

  // --- Photos: 9 warm-toned placeholder SVGs (allowed alternative to JPEGs, generated locally) ---
  const uploadsDir = join(process.cwd(), 'public', 'uploads')
  mkdirSync(uploadsDir, { recursive: true })

  const photoDefs: { apartmentId: string | null; alt: string; altEn: string; colorA: string; colorB: string }[] = [
    { apartmentId: '15B', alt: 'Obývací pokoj apartmánu 15B', altEn: 'Living room of apartment 15B', colorA: '#EFE6D8', colorB: '#C96F4A' },
    { apartmentId: '15B', alt: 'Ložnice apartmánu 15B', altEn: 'Bedroom of apartment 15B', colorA: '#FAF6EF', colorB: '#A54F2E' },
    { apartmentId: '15B', alt: 'Společný balkon s výhledem na bazén, apartmán 15B', altEn: 'Shared balcony with a pool view, apartment 15B', colorA: '#4A90A4', colorB: '#EFE6D8' },
    { apartmentId: '16B', alt: 'Obývací pokoj apartmánu 16B', altEn: 'Living room of apartment 16B', colorA: '#EFE6D8', colorB: '#7A9E65' },
    { apartmentId: '16B', alt: 'Kuchyň apartmánu 16B', altEn: 'Kitchen of apartment 16B', colorA: '#FAF6EF', colorB: '#C96F4A' },
    { apartmentId: '16B', alt: 'Společný balkon s výhledem na bazén, apartmán 16B', altEn: 'Shared balcony with a pool view, apartment 16B', colorA: '#2F6577', colorB: '#EFE6D8' },
    { apartmentId: null, alt: 'Pláž v Nesebaru', altEn: 'Beach in Nesebar', colorA: '#4A90A4', colorB: '#FAF6EF' },
    { apartmentId: null, alt: 'Staré město Nesebar', altEn: 'Nesebar old town', colorA: '#C96F4A', colorB: '#EFE6D8' },
    { apartmentId: null, alt: 'Západ slunce nad mořem', altEn: 'Sunset over the sea', colorA: '#A54F2E', colorB: '#2F6577' },
  ]

  for (const [i, p] of photoDefs.entries()) {
    const index = i + 1
    const filename = `placeholder-${index}.svg`
    writeFileSync(join(uploadsDir, filename), generatePlaceholderSvg(index, p.colorA, p.colorB))
    await db.insert(photos).values({
      apartmentId: p.apartmentId,
      url: `/uploads/${filename}`,
      alt: p.alt,
      altEn: p.altEn,
      sortOrder: i,
    }).run()
  }

  // --- Guide items: 2 beaches, 4 trips, 3 info blocks ---
  await db.insert(guideItems).values([
    { type: 'beach', title: 'Jižní pláž', titleEn: 'South beach', description: 'Písečná pláž vhodná ke koupání, odpočinku i procházkám.', descriptionEn: 'A sandy beach suitable for swimming, relaxing and walks.', imageUrl: null, meta: null, metaEn: null, sortOrder: 0 },
    { type: 'beach', title: 'Severní pláž', titleEn: 'North beach', description: 'Další možnost pláže nedaleko Nesebaru.', descriptionEn: 'Another beach option near Nessebar.', imageUrl: null, meta: null, metaEn: null, sortOrder: 1 },
    { type: 'trip', title: 'Procházka starým městem', titleEn: 'A walk through the old town', description: 'Historické centrum, výhled na moře a večeře v některé z místních restaurací.', descriptionEn: 'The historic centre, a sea view and dinner at one of the local restaurants.', imageUrl: null, meta: null, metaEn: null, sortOrder: 0 },
    { type: 'trip', title: 'Výlet do okolí', titleEn: 'A trip nearby', description: 'Pomorie, Burgas nebo další místa podél pobřeží jsou snadno dostupné a nabízí jinou atmosféru než samotný Nesebar.', descriptionEn: 'Pomorie, Burgas and other spots along the coast are all easy to reach and offer a different atmosphere than Nessebar itself.', imageUrl: null, meta: null, metaEn: null, sortOrder: 1 },
    { type: 'trip', title: 'Pomorie', titleEn: 'Pomorie', description: 'Přímořské město známé dlouhou písečnou pláží a tradicí solných jezer a vína.', descriptionEn: 'A coastal town known for its long sandy beach and its salt-lake and wine traditions.', imageUrl: null, meta: '30 min autem', metaEn: '30 min by car', sortOrder: 2 },
    { type: 'trip', title: 'Burgas', titleEn: 'Burgas', description: 'Krajské město s přímořským parkem, zoo a příjemným centrem na procházku.', descriptionEn: 'A regional city with a seaside park, a zoo and a pleasant centre for a stroll.', imageUrl: null, meta: '40 min autem', metaEn: '40 min by car', sortOrder: 3 },
    { type: 'info', title: 'Wifi a klíče', titleEn: 'Wi-Fi and keys', description: 'Heslo k wifi najdete na lednici, náhradní klíče má Admin — ozvěte se předem.', descriptionEn: 'The Wi-Fi password is on the fridge; the Admin keeps the spare keys — let us know in advance.', imageUrl: null, meta: null, metaEn: null, sortOrder: 0 },
    { type: 'info', title: 'Odpadky a recyklace', titleEn: 'Rubbish and recycling', description: 'Popelnice jsou na dvoře, tříděný odpad u vchodu do domu.', descriptionEn: 'The bins are in the yard; sorted waste is by the entrance to the building.', imageUrl: null, meta: null, metaEn: null, sortOrder: 1 },
    { type: 'info', title: 'Nouzové kontakty', titleEn: 'Emergency contacts', description: 'V případě problémů volejte Adminovi nebo sousedovi panu Ivanovi (kontakt na nástěnce v kuchyni).', descriptionEn: 'In case of problems, call the Admin or our neighbour Mr Ivanov (contact on the kitchen noticeboard).', imageUrl: null, meta: null, metaEn: null, sortOrder: 2 },
  ]).run()

  console.log('\nSeed complete. Logins:\n')
  for (const u of insertedUsers) {
    console.log(`  ${u.role.padEnd(6)} ${u.name.padEnd(10)} ${u.email.padEnd(24)} ${u.password}`)
  }
  console.log('')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
