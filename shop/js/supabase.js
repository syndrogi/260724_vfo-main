// Supabase project client. The anon key is safe to ship in client code —
// it identifies the project, not a privilege; row level security (see
// supabase/schema.sql) is what actually controls access.
const SUPABASE_URL = "https://ozwncuapnzvelkzehnun.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96d25jdWFwbnp2ZWxremVobnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NjAzNTUsImV4cCI6MjEwMTEzNjM1NX0.Gi7h7WtWjkioIDs49Yl2mJE74kHGbjIbDgn5KjkDqXs";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
