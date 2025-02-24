/**
 * This file was generated by kysely-codegen.
 * Please do not edit it manually.
 */

import type { ColumnType } from "kysely";

export type CenterLocation = "Australia" | "BishalNagar" | "UK" | "USA";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export interface Persons {
  address: string | null;
  center: CenterLocation;
  created_at: Generated<Timestamp | null>;
  email_id: string | null;
  first_name: string;
  id: Generated<string>;
  last_name: string;
  phone_number: string | null;
  refugee: Generated<boolean>;
  updated_at: Generated<Timestamp | null>;
  year_of_birth: number | null;
}

export interface SchemaMigrations {
  version: string;
}

export interface DB {
  persons: Persons;
  schema_migrations: SchemaMigrations;
}
