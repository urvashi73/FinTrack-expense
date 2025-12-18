export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  // ❌ Never allow seed to run during build or production deploy
  if (process.env.NODE_ENV === "production") {
    return new Response("Seed disabled in production", { status: 403 });
  }

  // ✅ Lazy import so Prisma is NOT touched during build
  const { seedTransactions } = await import("@/actions/seed");

  const result = await seedTransactions();
  return Response.json(result);
}
