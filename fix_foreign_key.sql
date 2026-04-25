-- Add foreign key constraint to stories table so PostgREST can join profiles automatically
ALTER TABLE stories
  DROP CONSTRAINT IF EXISTS stories_author_id_fkey;

ALTER TABLE stories
  ADD CONSTRAINT stories_author_id_fkey 
  FOREIGN KEY (author_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;
