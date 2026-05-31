import { createClient } from '@supabase/supabase-js';

// Memaksa TypeScript membaca variabel lingkungan
const supabaseUrl = "https://gtbwfdrrxcynhjkadjqj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0YndmZHJyeGN5bmhqa2FkanFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4ODM4NzksImV4cCI6MjA5NTQ1OTg3OX0._nJZ_TH2n-qGVEgvQV11uv83z80wYtkWQxBoZxlskYc";

// Inisialisasi
export const supabase = createClient(supabaseUrl, supabaseKey);