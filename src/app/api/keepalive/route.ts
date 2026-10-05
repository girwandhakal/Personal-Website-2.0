import { prisma } from "@/lib/db";

/**
 * Daily ping from Vercel Cron (see vercel.json). Free Supabase projects pause
 * after about a week without database activity, which takes the chatbot down
 * with them; one tiny query a day keeps the project awake.
 *
 * Vercel sends `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is set,
 * so nobody else can use this to poke the database.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    await prisma.knowledgeChunk.findFirst({ select: { id: true } });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Keepalive query failed:", error);
    return Response.json({ ok: false }, { status: 503 });
  }
}
