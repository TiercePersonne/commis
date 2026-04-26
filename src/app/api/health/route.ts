import { NextResponse } from 'next/server';

// C6 — Health check endpoint pour Render
// Render vérifie ce chemin pour déterminer si le déploiement est sain
export async function GET() {
  return NextResponse.json(
    { status: 'ok', timestamp: new Date().toISOString() },
    { status: 200 }
  );
}
