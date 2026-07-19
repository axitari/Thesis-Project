// static/supabaseClient.js

// 1. Define your credentials
const supabaseUrl = "https://ilhfhkrshggvixezfhvo.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsaGZoa3JzaGdndml4ZXpmaHZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzNjg2MzQsImV4cCI6MjA5OTk0NDYzNH0.GpDxH9EpUNlvpKjRhuy4XRmhmJlMIBfVnQzI1qZPunM";

// 2. Initialize the Supabase client
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// 3. Export it so other files can use it (if using ES modules) or attach it to the window
window.supabaseClient = supabaseClient;