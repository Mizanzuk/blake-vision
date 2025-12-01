import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/app/lib/supabase/client";

export const dynamic = "force-dynamic";

// GET: Fetch custom order for a universe
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const universeId = req.nextUrl.searchParams.get("universe_id");

    if (!universeId) {
      return NextResponse.json({ error: "universe_id is required" }, { status: 400 });
    }

    // Fetch custom order
    const { data, error } = await supabase
      .from("card_custom_order")
      .select("ficha_id, custom_order")
      .eq("user_id", user.id)
      .eq("universe_id", universeId)
      .order("custom_order", { ascending: true });

    if (error) {
      console.error("Error fetching card order:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ orders: data || [] });
  } catch (error: any) {
    console.error("Error in GET /api/card-order:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Save custom order for cards
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { universe_id, ficha_orders } = body;

    if (!universe_id || !Array.isArray(ficha_orders)) {
      return NextResponse.json(
        { error: "universe_id and ficha_orders array are required" },
        { status: 400 }
      );
    }

    // Delete existing orders for this universe
    const { error: deleteError } = await supabase
      .from("card_custom_order")
      .delete()
      .eq("user_id", user.id)
      .eq("universe_id", universe_id);

    if (deleteError) {
      console.error("Error deleting old orders:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Insert new orders
    const ordersToInsert = ficha_orders.map((fichaId: string, index: number) => ({
      user_id: user.id,
      universe_id,
      ficha_id: fichaId,
      custom_order: index,
    }));

    const { error: insertError } = await supabase
      .from("card_custom_order")
      .insert(ordersToInsert);

    if (insertError) {
      console.error("Error inserting new orders:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in POST /api/card-order:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Reset custom order (delete all custom orders for a universe)
export async function DELETE(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const universeId = req.nextUrl.searchParams.get("universe_id");

    if (!universeId) {
      return NextResponse.json({ error: "universe_id is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("card_custom_order")
      .delete()
      .eq("user_id", user.id)
      .eq("universe_id", universeId);

    if (error) {
      console.error("Error deleting card orders:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in DELETE /api/card-order:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
