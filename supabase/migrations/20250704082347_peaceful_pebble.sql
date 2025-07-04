/*
  # Create models table for CAD3Dify

  1. New Tables
    - `models`
      - `id` (uuid, primary key)
      - `prompt` (text) - Description of the CAD model
      - `file_url` (text) - URL to the generated STEP file
      - `project_id` (uuid, nullable) - Optional project association
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `models` table
    - Add policy for public read access (since files are public)
    - Add policy for authenticated users to create models
*/

CREATE TABLE IF NOT EXISTS models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt text NOT NULL DEFAULT '',
  file_url text NOT NULL,
  project_id uuid DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE models ENABLE ROW LEVEL SECURITY;

-- Allow public read access to models
CREATE POLICY "Public read access for models"
  ON models
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to create models
CREATE POLICY "Authenticated users can create models"
  ON models
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow service role full access for edge functions
CREATE POLICY "Service role can manage models"
  ON models
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_models_updated_at
  BEFORE UPDATE ON models
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();