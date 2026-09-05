import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const invitations = sqliteTable('invitations', {
  tokenHash: text('token_hash').primaryKey(),
  createdAt: text('created_at').notNull(),
});
export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    authHash: text('auth_hash').notNull().unique(),
    tokenHash: text('token_hash')
      .unique()
      .references(() => invitations.tokenHash),
    mode: text('mode').notNull(),
    condition: text('condition').notNull(),
    version: text('version').notNull(),
    revision: integer('revision').notNull().default(0),
    status: text('status').notNull().default('active'),
    age: integer('age'),
    gender: text('gender'),
    state: text('state').notNull(),
    createdAt: text('created_at').notNull(),
    completedAt: text('completed_at'),
    completionCode: text('completion_code'),
    submissionKey: text('submission_key').unique(),
    lastActionId: text('last_action_id'),
    metrics: text('metrics'),
  },
  (table) => [index('idx_sessions_mode_status').on(table.mode, table.status)],
);
