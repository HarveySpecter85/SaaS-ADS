import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractTextFromPdf } from "@/lib/pdf-extraction";
import { extractBrandFromText } from "@/lib/gemini";
import type { BrandWithRelations } from "@/lib/supabase/database.types";

// POST: Upload PDF, extract brand data, create brand record
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Validate file is PDF
    if (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "File must be a PDF" },
        { status: 400 }
      );
    }

    // Convert file to Buffer and extract text
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let pdfText: string;
    try {
      pdfText = await extractTextFromPdf(buffer);
    } catch (error) {
      console.error("PDF extraction error:", error);
      return NextResponse.json(
        { error: "Failed to extract text from PDF" },
        { status: 500 }
      );
    }

    // Send text to Gemini for structured extraction
    let extractedData;
    try {
      extractedData = await extractBrandFromText(pdfText);
    } catch (error) {
      console.error("Gemini extraction error:", error);
      return NextResponse.json(
        { error: "Failed to extract brand data from PDF content" },
        { status: 500 }
      );
    }

    // Upload original PDF to Supabase Storage
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("brands")
      .upload(fileName, buffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      // Continue without PDF URL - not critical
    }

    // Get public URL if upload succeeded
    let sourcePdfUrl: string | null = null;
    if (uploadData) {
      const { data: urlData } = supabase.storage
        .from("brands")
        .getPublicUrl(uploadData.path);
      sourcePdfUrl = urlData.publicUrl;
    }

    // Insert brand record
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .insert({
        name: extractedData.name || "Untitled Brand",
        description: extractedData.description || null,
        source_pdf_url: sourcePdfUrl,
      })
      .select()
      .single();

    if (brandError) {
      return NextResponse.json(
        { error: "Failed to create brand", details: brandError.message },
        { status: 500 }
      );
    }

    // Insert colors, fonts, and tone records
    const [colorsResult, fontsResult, toneResult] = await Promise.all([
      // Insert colors
      extractedData.colors.length > 0
        ? supabase
            .from("brand_colors")
            .insert(
              extractedData.colors.map((color) => ({
                brand_id: brand.id,
                hex_code: color.hex_code,
                name: color.name,
                usage: color.usage,
                is_primary: color.is_primary,
              }))
            )
            .select()
        : Promise.resolve({ data: [], error: null }),

      // Insert fonts
      extractedData.fonts.length > 0
        ? supabase
            .from("brand_fonts")
            .insert(
              extractedData.fonts.map((font) => ({
                brand_id: brand.id,
                font_family: font.font_family,
                font_weight: font.font_weight,
                usage: font.usage,
                is_primary: font.is_primary,
              }))
            )
            .select()
        : Promise.resolve({ data: [], error: null }),

      // Insert tone
      extractedData.tone.length > 0
        ? supabase
            .from("brand_tone")
            .insert(
              extractedData.tone.map((t) => ({
                brand_id: brand.id,
                descriptor: t.descriptor,
                example: t.example,
              }))
            )
            .select()
        : Promise.resolve({ data: [], error: null }),
    ]);

    // Log any insertion errors but don't fail the request
    if (colorsResult.error) {
      console.error("Colors insert error:", colorsResult.error);
    }
    if (fontsResult.error) {
      console.error("Fonts insert error:", fontsResult.error);
    }
    if (toneResult.error) {
      console.error("Tone insert error:", toneResult.error);
    }

    // Return complete brand with relations
    const brandWithRelations: BrandWithRelations = {
      ...brand,
      colors: colorsResult.data || [],
      fonts: fontsResult.data || [],
      tone: toneResult.data || [],
    };

    return NextResponse.json(brandWithRelations, { status: 201 });
  } catch (error) {
    console.error("POST /api/brands/upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
