require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function run() {
  const { data, error } = await supabase
    .from('staff')
    .select('*');
  
  console.log('Staff Records:', data);
  console.log('Error:', error);
}

run();
