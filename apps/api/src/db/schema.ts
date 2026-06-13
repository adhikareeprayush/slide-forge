import { pgTable, uuid, text, integer, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const decks = pgTable('decks', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  theme: text('theme').notNull().default('default'),
  status: text('status').notNull().default('ready'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const slides = pgTable('slides', {
  id: uuid('id').primaryKey().defaultRandom(),
  deckId: uuid('deck_id')
    .notNull()
    .references(() => decks.id, { onDelete: 'cascade' }),
  layoutId: text('layout_id').notNull(),
  position: integer('position').notNull(),
  slotData: jsonb('slot_data').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const generationJobs = pgTable('generation_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  deckId: uuid('deck_id')
    .notNull()
    .references(() => decks.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('pending'),
  prompt: text('prompt').notNull(),
  options: jsonb('options').notNull().default({}),
  error: text('error'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const imageJobs = pgTable('image_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  slideId: uuid('slide_id')
    .notNull()
    .references(() => slides.id, { onDelete: 'cascade' }),
  slotId: text('slot_id').notNull(),
  prompt: text('prompt').notNull(),
  status: text('status').notNull().default('pending'),
  resultUrl: text('result_url'),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export type Deck = typeof decks.$inferSelect;
export type Slide = typeof slides.$inferSelect;
export type GenerationJob = typeof generationJobs.$inferSelect;
export type ImageJob = typeof imageJobs.$inferSelect;
