import { NextResponse } from "next/server";

const API_URL = process.env.BACKEND_API_URL || "http://localhost:8080";

export async function POST(request: Request) {
  const body = await request.json();

  const backendRes = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await backendRes.json();

  if (!backendRes.ok || !data.success || !data.data) {
    return NextResponse.json(data, { status: backendRes.status });
  }

  const response = NextResponse.json(
    {
      success: true,
      data: {
        userId: data.data.userId,
        email: data.data.email,
        name: data.data.name,
      },
      message: data.message ?? null,
    },
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
