import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = process.env.BACKEND_API_URL || "http://localhost:8080";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    return NextResponse.json(
      { success: false, data: null, message: "인증되지 않았습니다." },
      { status: 401 }
    );
  }

  const backendRes = await fetch(`${API_URL}/api/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const data = await backendRes.json();

  return NextResponse.json(data, { status: backendRes.status });
}
