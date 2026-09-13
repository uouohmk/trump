import { sqliteTable, text, primaryKey, index } from 'drizzle-orm/sqlite-core';
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
export const consultations=sqliteTable('consultations',{
 id:text('id').primaryKey(),ownerId:text('owner_id').notNull(),
 kind:text('kind').notNull(),input:text('input').notNull(),result:text('result').notNull(),createdAt:text('created_at').notNull(),
},table=>[index('consultations_owner_created').on(table.ownerId,table.createdAt)]);
