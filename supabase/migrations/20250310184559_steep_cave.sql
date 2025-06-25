/*
  # Create time entries table

  1. New Tables
    - `time_entries`
      - `id` (bigint, primary key)
      - `user_id` (uuid, references auth.users)
      - `clock_in` (timestamptz)
      - `clock_out` (timestamptz, nullable)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `time_entries` table
    - Add policies for authenticated users to:
      - Read their own time entries
      - Insert their own time entries
      - Update their own time entries
*/

CREATE TABLE IF NOT EXISTS time_entries (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid REFERENCES auth.users NOT NULL,
  clock_in timestamptz NOT NULL,
  clock_out timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own time entries"
  ON time_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own time entries"
  ON time_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time entries"
  ON time_entries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);