-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('produtos', 'produtos', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow public read access
CREATE POLICY "Public read access for product images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'produtos');

-- Create policy to allow authenticated admin users to upload
CREATE POLICY "Admin users can upload product images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'produtos' 
  AND (SELECT has_role(auth.uid(), 'admin'::app_role))
);

-- Create policy to allow authenticated admin users to update
CREATE POLICY "Admin users can update product images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'produtos' 
  AND (SELECT has_role(auth.uid(), 'admin'::app_role))
);

-- Create policy to allow authenticated admin users to delete
CREATE POLICY "Admin users can delete product images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'produtos' 
  AND (SELECT has_role(auth.uid(), 'admin'::app_role))
);