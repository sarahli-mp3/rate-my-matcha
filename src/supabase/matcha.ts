
import { createClient } from "@supabase/supabase-js";

// Use the explicit credentials from your project (see src/integrations/supabase/client.ts)
const SUPABASE_URL = "https://urtwmfqncuwopkvzdcxs.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVydHdtZnFuY3V3b3BrdnpkY3hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwMjI4OTEsImV4cCI6MjA2NTU5ODg5MX0.86DzUecU0zF5ZlbOaPWXBeTCJEwI2AFkxyigTi_v2iI";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

type MatchaRatingRecord = {
  image_url: string;
  ai_score: number;
  user_score: number;
  location: string | null;
  created_at?: string;
};

export async function uploadMatchaImage(dataUrl: string): Promise<string | null> {
  // Convert dataUrl to blob
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const fileName = `matcha_${Date.now()}.png`;

  const { data, error } = await supabase.storage
    .from("matcha-images")
    .upload(fileName, blob, {
      cacheControl: '3600',
      contentType: 'image/png',
      upsert: false,
    });

  if (error) {
    console.error("Upload failed:", error);
    return null;
  }
  // Return full public URL
  const { data: publicUrlData } = supabase
    .storage
    .from("matcha-images")
    .getPublicUrl(data.path);

  return publicUrlData?.publicUrl || null;
}

export async function insertMatchaRating(record: MatchaRatingRecord) {
  const { data, error } = await supabase
    .from("matcha_ratings")
    .insert([record]);
  if (error) {
    console.error("Database insert error:", error);
    return null;
  }
  return data;
}
