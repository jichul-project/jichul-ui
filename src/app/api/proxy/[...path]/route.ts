import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.BACKEND_API_URL || "http://localhost:8080";

async function forward(request: NextRequest, path: string[]) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  const joinedPath = path.join("/");
  const targetUrl = `${API_URL}/api/${joinedPath}${request.nextUrl.search}`;

  const contentType = request.headers.get("content-type");
  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  const backendRes = await fetch(targetUrl, {
    method: request.method,
    headers: {
      ...(contentType ? { "Content-Type": contentType } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: hasBody ? await request.text() : undefined,
    cache: "no-store",
  });

  const responseText = await backendRes.text();

  return new NextResponse(responseText, {
    status: backendRes.status,
    headers: {
      "Content-Type": backendRes.headers.get("Content-Type") ?? "application/json",
    },
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return forward(request, path);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return forward(request, path);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return forward(request, path);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return forward(request, path);
}
