import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Helper function to get Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase credentials not configured");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// GET - List relations for a ficha
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    const { searchParams } = new URL(request.url);
    const fichaId = searchParams.get("fichaId");

    if (!fichaId) {
      return NextResponse.json(
        { error: "fichaId é obrigatório" },
        { status: 400 }
      );
    }

    // Get relations where this ficha is the source
    const { data: relations, error } = await supabase
      .from("relations")
      .select(`
        *,
        target_ficha:target_id (
          id,
          titulo,
          tipo,
          slug
        )
      `)
      .eq("source_id", fichaId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: `Erro ao buscar relações: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ relations: relations || [] });
  } catch (error: any) {
    console.error("Error fetching relations:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar relações" },
      { status: 500 }
    );
  }
}

// POST - Create a new relation
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    const body = await request.json();
    const { source_id, target_id, relation_type, description } = body;

    if (!source_id || !target_id || !relation_type) {
      return NextResponse.json(
        { error: "source_id, target_id e relation_type são obrigatórios" },
        { status: 400 }
      );
    }

    // Prevent self-relations
    if (source_id === target_id) {
      return NextResponse.json(
        { error: "Uma ficha não pode ter relação consigo mesma" },
        { status: 400 }
      );
    }

    // Check if relation already exists
    const { data: existing } = await supabase
      .from("relations")
      .select("id")
      .eq("source_id", source_id)
      .eq("target_id", target_id)
      .eq("relation_type", relation_type)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Esta relação já existe" },
        { status: 400 }
      );
    }

    // Create relation
    const { data: relation, error } = await supabase
      .from("relations")
      .insert({
        source_id,
        target_id,
        relation_type,
        description: description || null,
      })
      .select(`
        *,
        target_ficha:target_id (
          id,
          titulo,
          tipo,
          slug
        )
      `)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: `Erro ao criar relação: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ relation });
  } catch (error: any) {
    console.error("Error creating relation:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao criar relação" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a relation
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    const { searchParams } = new URL(request.url);
    const relationId = searchParams.get("id");

    if (!relationId) {
      return NextResponse.json(
        { error: "id da relação é obrigatório" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("relations")
      .delete()
      .eq("id", relationId);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: `Erro ao deletar relação: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting relation:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao deletar relação" },
      { status: 500 }
    );
  }
}

// PUT - Update a relation
export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    const body = await request.json();
    const { id, relation_type, description } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id da relação é obrigatório" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (relation_type) updateData.relation_type = relation_type;
    if (description !== undefined) updateData.description = description;

    const { data: relation, error } = await supabase
      .from("relations")
      .update(updateData)
      .eq("id", id)
      .select(`
        *,
        target_ficha:target_id (
          id,
          titulo,
          tipo,
          slug
        )
      `)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: `Erro ao atualizar relação: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ relation });
  } catch (error: any) {
    console.error("Error updating relation:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar relação" },
      { status: 500 }
    );
  }
}
