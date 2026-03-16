import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = process.env.BACKEND_API_URL || "http://localhost:8080";

export async function POST() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  const refreshToken = cookieStore.get("refreshToken")?.value;

  try {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
  } catch {
    // 쿠키 삭제는 계속 진행
  }

  const response = NextResponse.json(
    { success: true, data: null, message: null },
    { status: 200 }
  );

  response.cookies.set("accessToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set("refreshToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
