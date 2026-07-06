import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ofkwacswfqfvusyhoqlm.supabase.co';
const supabaseAnonKey = 'sb_publishable_jEIYvwgQrbSE4COJQ29w5g_SAdLBDXp';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching entries:', error);
    return;
  }

  if (data && data.length > 0) {
    const entry = data[0];
    console.log('--- LATEST ENTRY ---');
    console.log('ID:', entry.id);
    console.log('Title:', entry.title);
    console.log('Created At:', entry.created_at);
    console.log('Visual Data Keys:', Object.keys(entry.visual_data || {}));
    if (entry.visual_data) {
      console.log('visualParams:', entry.visual_data.visualParams);
      if (entry.visual_data.shards && entry.visual_data.shards.length > 0) {
        console.log('First Shard:', entry.visual_data.shards[0]);
      } else {
        console.log('No shards found in visual_data!');
      }
    }
  } else {
    console.log('No entries found.');
  }
}

main();
