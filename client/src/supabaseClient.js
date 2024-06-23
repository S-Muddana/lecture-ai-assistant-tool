import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ezumlgyulbsnhxnbipfq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6dW1sZ3l1bGJzbmh4bmJpcGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTkwOTUzODIsImV4cCI6MjAzNDY3MTM4Mn0.lQZgQ3v2x6OAYExCbpByaOXgEi9mk-NiGqtQBKtVGrY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
