// static/supabaseClient.js

if (typeof window.supabaseClient === 'undefined') {
    const supabaseUrl = "https://ilhfhkrshggvixezfhvo.supabase.co";
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsaGZoa3JzaGdndml4ZXpmaHZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzNjg2MzQsImV4cCI6MjA5OTk0NDYzNH0.GpDxH9EpUNlvpKjRhuy4XRmhmJlMIBfVnQzI1qZPunM";

    window.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
}