-- Storage policies for the 'cars' bucket
-- Policy to allow authenticated users to upload images to their own car folders
CREATE POLICY "Users can upload car images" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (bucket_id = 'cars');
-- Policy to allow authenticated users to read all car images (for viewing other users' cars)
CREATE POLICY "Users can view car images" ON storage.objects FOR
SELECT TO authenticated USING (bucket_id = 'cars');
-- Policy to allow users to update images in their own car folders
-- Note: You'll need to add user validation logic if you want to restrict this further
CREATE POLICY "Users can update car images" ON storage.objects FOR
UPDATE TO authenticated USING (bucket_id = 'cars');
-- Policy to allow users to delete images from their own car folders
-- Note: You'll need to add user validation logic if you want to restrict this further
CREATE POLICY "Users can delete car images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'cars');
-- Make sure the cars bucket exists and is public
-- (Run this in the Supabase SQL editor if the bucket doesn't exist)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('cars', 'cars', true);