import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PUT - Update episode
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, description } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("episodes")
      .update({ title, description })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete episode
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // First, check if episode is used in any fichas
    const { data: fichas, error: fichasError } = await supabase
      .from("fichas")
      .select("id")
      .eq("episode_id", params.id)
      .limit(1);

    if (fichasError) {
      return NextResponse.json(
        { error: fichasError.message },
        { status: 400 }
      );
    }

    if (fichas && fichas.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete episode that is used in fichas" },
        { status: 400 }
      );
    }

    // Delete the episode
    const { error } = await supabase
      .from("episodes")
      .delete()
      .eq("id", params.id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
