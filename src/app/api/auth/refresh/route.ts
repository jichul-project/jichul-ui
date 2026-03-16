import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = process.env.BACKEND_API_URL || "http://localhost:8080";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { success: false, data: null, message: "리프레시 토큰이 없습니다." },
      { status: 401 }
    );
  }

  const backendRes = await fetch(`${API_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });

  const data = await backendRes.json();

  if (!backendRes.ok || !data.success || !data.data) {
    const response = NextResponse.json(data, { status: backendRes.status });

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

  const response = NextResponse.json(
    { success: true, data: null, message: null },
    { status: 200 }
  );

  response.cookies.set("accessToken", data.data.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 30,
  });

  response.cookies.set("refreshToken", data.data.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
