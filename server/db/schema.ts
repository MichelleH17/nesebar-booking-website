import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['guest', 'family', 'admin', 'demo'] }).notNull().default('family'),
  color: text('color').notNull(), // hex, calendar bar color
  sortOrder: integer('sort_order').notNull().default(0), // display order in stats/lists
  createdAt: text('created_at').notNull(),
})

export const apartments = sqliteTable('apartments', {
  id: text('id').primaryKey(), // '15B' | '16B' — stable key, referenced by reservations/photos
  label: text('label').notNull().default(''), // editable display code; falls back to id when empty
  name: text('name').notNull(),
  nameEn: text('name_en').notNull().default(''),
  description: text('description').notNull(),
  descriptionEn: text('description_en').notNull().default(''),
  capacity: integer('capacity').notNull(),
  nightlyRate: integer('nightly_rate').notNull(),
  perPersonPricing: integer('per_person_pricing', { mode: 'boolean' }).notNull().default(false),
  priceHidden: integer('price_hidden', { mode: 'boolean' }).notNull().default(false), // hide pricing in the reservation form without deleting the rate
  hidden: integer('hidden', { mode: 'boolean' }).notNull().default(false), // hide the apartment from landing, calendar and new reservations
})

export const photos = sqliteTable('photos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  apartmentId: text('apartment_id').references(() => apartments.id), // null = general/Nesebar
  url: text('url').notNull(),
  alt: text('alt').notNull(),
  altEn: text('alt_en').notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
  hidden: integer('hidden', { mode: 'boolean' }).notNull().default(false),
  onHomepage: integer('on_homepage', { mode: 'boolean' }).notNull().default(false),
})

export const reservations = sqliteTable('reservations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  apartmentId: text('apartment_id').notNull().references(() => apartments.id),
  userId: integer('user_id').notNull().references(() => users.id),
  guestName: text('guest_name').notNull(),
  people: integer('people').notNull(),
  arrival: text('arrival').notNull(),   // YYYY-MM-DD
  departure: text('departure').notNull(),
  travelMethod: text('travel_method', { enum: ['car', 'plane', 'bus', 'train'] }).notNull(),
  notes: text('notes').notNull().default(''),
  priceApplied: integer('price_applied'), // null = family/free
  forGuest: integer('for_guest', { mode: 'boolean' }).notNull().default(false), // stay for a friend/guest → grey bar
  notifyEmails: text('notify_emails', { mode: 'json' }).$type<string[]>().notNull().default([]),
  status: text('status', { enum: ['active', 'cancelled'] }).notNull().default('active'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const mailRecipients = sqliteTable('mail_recipients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
})

// Editable page texts (hero headings/ledes) — key-value with CS/EN, overrides code defaults.
export const siteTexts = sqliteTable('site_texts', {
  key: text('key').primaryKey(),
  valueCs: text('value_cs').notNull().default(''),
  valueEn: text('value_en').notNull().default(''),
})

// Whole-section visibility (homepage/okolí sections). A row means an override; absent = visible.
export const sectionVisibility = sqliteTable('section_visibility', {
  key: text('key').primaryKey(),
  hidden: integer('hidden', { mode: 'boolean' }).notNull().default(false),
})

export const guideItems = sqliteTable('guide_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type', { enum: ['beach', 'trip', 'info'] }).notNull(),
  title: text('title').notNull(),
  titleEn: text('title_en').notNull().default(''),
  description: text('description').notNull(),
  descriptionEn: text('description_en').notNull().default(''),
  imageUrl: text('image_url'),
  meta: text('meta'), // e.g. '15 min autem'
  metaEn: text('meta_en'),
  sortOrder: integer('sort_order').notNull().default(0),
  hidden: integer('hidden', { mode: 'boolean' }).notNull().default(false),
})
