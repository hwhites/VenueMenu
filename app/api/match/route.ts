// app/api/match/route.ts

import { NextResponse } from 'next/server';
// FIX: Using relative path to bypass potential tsconfig.json alias issues
import { createClient as createServerClient } from '../../../utils/supabase/server'; 

export async function POST(request: Request) {
  const supabaseServiceRole = createServerClient(); 

  try {
    const { error } = await supabaseServiceRole.rpc('generate_matches');

    if (error) {
      console.error('Matching Job Failed:', error);
      return NextResponse.json({ 
        message: 'Matching job failed to complete.', 
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ message: 'Matching job executed successfully.' }, { status: 200 });

  } catch (e) {
    console.error('API execution error:', e);
    return NextResponse.json({ message: 'Internal server error during job execution.' }, { status: 500 });
  }
}