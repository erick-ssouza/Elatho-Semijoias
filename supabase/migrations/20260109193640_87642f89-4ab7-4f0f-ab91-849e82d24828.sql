-- Create policy to allow public read access to produtos bucket
CREATE POLICY "Public Access for produtos bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'produtos');