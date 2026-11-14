import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ allowed: true, plan_key: "free", guest: true });
}
