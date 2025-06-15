
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
