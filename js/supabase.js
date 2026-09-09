const SUPABASE_URL =
    "https://xciqyorcccscaqnxzqrn.supabase.co";

const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjaXF5b3JjY2NzY2Fxbnh6cXJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5MjU3NzcsImV4cCI6MjEwMzUwMTc3N30.kUUp6iJfrHTCTzZFpk0-GEXGUYwI7n7QFM-ZY0J7r0Y";

window.supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );