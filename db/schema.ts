import { sqliteTable, text, primaryKey } from 'drizzle-orm/sqlite-core';
export const profiles = sqliteTable('profiles', {
  ownerId: text('owner_id').primaryKey(),
  version: text('version').notNull(),
  input: text('input').notNull(),
  chart: text('chart').notNull(),
  guide: text('guide').notNull(),
  updatedAt: text('updated_at').notNull(),
});
export const readings = sqliteTable('readings', {
  ownerId: text('owner_id').notNull(),
  profileVersion: text('profile_version').notNull(),
  day: text('day').notNull(),
  payload: text('payload').notNull(),
}, table => [primaryKey({columns:[table.ownerId,table.profileVersion,table.day]})]);
