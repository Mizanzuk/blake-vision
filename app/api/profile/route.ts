import { createClient, createAdminClient } from '@/app/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get full_name from request body
    const { full_name } = await request.json();

    if (!full_name) {
      return NextResponse.json(
        { error: 'full_name is required' },
        { status: 400 }
      );
    }

    // Update user metadata using service role
    const supabaseAdmin = await createAdminClient();
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: { full_name }
      }
    );

    if (error) {
      console.error('[API Profile] Error updating user:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log('[API Profile] User updated successfully:', data.user.user_metadata);

    return NextResponse.json({
      success: true,
      user_metadata: data.user.user_metadata
    });
  } catch (error: any) {
    console.error('[API Profile] Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
