import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";

// PATCH - Atualizar descrição da categoria
export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    console.log('[DEBUG PATCH] Iniciando');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { universe_id, description } = body;
    console.log('[DEBUG PATCH] Slug:', params.slug, 'Universe ID:', universe_id, 'Description length:', description?.length || 0);

    if (!universe_id) {
      console.log('[DEBUG PATCH] Universe ID não fornecido');
      return NextResponse.json(
        { error: "universe_id é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar a categoria
    console.log('[DEBUG PATCH] Buscando categoria com slug:', params.slug, 'e universe_id:', universe_id);
    const { data: category, error: fetchError } = await supabase
      .from("lore_categories")
      .select("*")
      .eq("slug", params.slug)
      .eq("universe_id", universe_id)
      .single();

    if (fetchError) {
      console.log('[DEBUG PATCH] Fetch error:', fetchError);
    }
    if (!category) {
      console.log('[DEBUG PATCH] Category is null');
    }

    if (fetchError || !category) {
      console.log('[DEBUG PATCH] Categoria não encontrada');
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      );
    }

    console.log('[DEBUG PATCH] Categoria encontrada:', category.id);

    // Verificar se é categoria base (não pode ser editada por usuários)
    const BASE_CATEGORIES = ['conceito', 'evento', 'local', 'personagem', 'regra', 'roteiro', 'sinopse'];
    if (BASE_CATEGORIES.includes(params.slug) && category.user_id === null) {
      return NextResponse.json(
        { error: "Não é possível editar categorias base" },
        { status: 403 }
      );
    }

    // Atualizar apenas a descrição
    console.log('[DEBUG PATCH] Atualizando categoria');
    const { data: updatedCategory, error: updateError } = await supabase
      .from("lore_categories")
      .update({
        description: description || "",
        updated_at: new Date().toISOString(),
      })
      .eq("slug", params.slug)
      .eq("universe_id", universe_id)
      .select()
      .single();

    if (updateError) {
      console.log('[DEBUG PATCH] Update error:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    console.log('[DEBUG PATCH] Categoria atualizada com sucesso');
    return NextResponse.json(updatedCategory);
  } catch (error: any) {
    console.error("Erro na API de atualizar categoria:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}

// DELETE - Deletar categoria
export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { universe_id } = body;

    if (!universe_id) {
      return NextResponse.json(
        { error: "universe_id é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar a categoria
    const { data: category, error: fetchError } = await supabase
      .from("lore_categories")
      .select("*")
      .eq("slug", params.slug)
      .eq("universe_id", universe_id)
      .single();

    if (fetchError || !category) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se é categoria base
    const BASE_CATEGORIES = ['conceito', 'evento', 'local', 'personagem', 'regra', 'roteiro', 'sinopse'];
    if (BASE_CATEGORIES.includes(params.slug) && category.user_id === null) {
      return NextResponse.json(
        { error: "Não é possível deletar categorias base" },
        { status: 403 }
      );
    }

    // Verificar se o usuário é o dono da categoria
    if (category.user_id !== user.id) {
      return NextResponse.json(
        { error: "Você não tem permissão para deletar esta categoria" },
        { status: 403 }
      );
    }

    // Deletar todas as fichas desta categoria
    const { error: deleteFileError } = await supabase
      .from("fichas")
      .delete()
      .eq("tipo", params.slug)
      .eq("universe_id", universe_id);

    if (deleteFileError) {
      console.error("Erro ao deletar fichas:", deleteFileError);
      // Continuar mesmo se houver erro ao deletar fichas
    }

    // Deletar a categoria
    const { error: deleteCategoryError } = await supabase
      .from("lore_categories")
      .delete()
      .eq("slug", params.slug)
      .eq("universe_id", universe_id);

    if (deleteCategoryError) {
      return NextResponse.json(
        { error: deleteCategoryError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro na API de deletar categoria:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}
