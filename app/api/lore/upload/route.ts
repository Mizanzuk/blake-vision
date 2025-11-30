import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const universeId = formData.get("universe_id") as string;
    const worldId = formData.get("world_id") as string;
    
    if (!file) {
      return NextResponse.json(
        { error: "Arquivo não fornecido" },
        { status: 400 }
      );
    }

    if (!universeId || !worldId) {
      return NextResponse.json(
        { error: "Universo e mundo são obrigatórios" },
        { status: 400 }
      );
    }

    // Get user from session
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Upload file to Supabase Storage
    const fileName = `${user.id}/${Date.now()}-${file.name}`;
    const fileBuffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(fileBuffer);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documents")
      .upload(fileName, fileBytes, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Erro ao fazer upload do arquivo" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("documents")
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      file_path: fileName,
      file_url: publicUrl,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
    });

  } catch (error) {
    console.error("Error in upload:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
