import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function main() {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'ashwin2431333@gmail.com',
        password: 'Password@123'
    });

    if (authError) {
        console.error("Auth Error:", authError.message);
    } else {
        console.log("Logged in:", authData.user?.id);
    }

    const { data, error } = await supabase
        .from('events')
        .select(`*, clubs ( name )`)
        .eq('status', 'pending');

    console.log("Events:", data, "Error:", error);
}

main();
