import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://efneocmdolkzdfhtqkpl.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmbmVvY21kb2xremRmaHRxa3BsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTcyNzc3NywiZXhwIjoyMDU3MzAzNzc3fQ.CCjWrRz-oJxkTY6AMveGFthTCrM1PPlMDVAuDjoGrdY';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey); 