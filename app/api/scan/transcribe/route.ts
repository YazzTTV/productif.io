import { NextRequest, NextResponse } from "next/server";
import { VoiceTranscriptionService } from "@/src/services/ai/VoiceTranscriptionService";
import * as fs from "fs";
import * as path from "path";

export const maxDuration = 60;

// Rate limiting simple en mémoire (par IP, max 20 requêtes / 10 min)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 20;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessaie dans quelques minutes." },
        { status: 429 }
      );
    }

    // Vérifier la clé OpenAI
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Service de transcription non configuré" },
        { status: 500 }
      );
    }

    // Récupérer le fichier audio
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: "Fichier audio requis" },
        { status: 400 }
      );
    }

    // Limiter la taille (10 MB max)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (audioFile.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Fichier trop volumineux (max 10 MB)" },
        { status: 400 }
      );
    }

    // Convertir en buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Sauvegarder le fichier temporairement
    const tempDir = process.env.VERCEL ? "/tmp" : path.join(process.cwd(), "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const ext = audioFile.name?.split(".").pop() || "webm";
    const tempFilePath = path.join(
      tempDir,
      `scan_audio_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
    );
    fs.writeFileSync(tempFilePath, buffer);

    try {
      const voiceService = new VoiceTranscriptionService();
      const result = await voiceService.transcribeAudio(tempFilePath);

      if (!result.success || !result.text) {
        return NextResponse.json(
          {
            error: "Erreur lors de la transcription",
            details: result.error || "Transcription échouée",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        transcription: result.text,
        success: true,
      });
    } finally {
      // Nettoyer le fichier temporaire
      try {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      } catch {
        // ignore cleanup errors
      }
    }
  } catch (error: any) {
    console.error("[scan/transcribe] Erreur:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la transcription",
        details: error?.message || "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
