import { NextResponse } from "next/server";
import { fetchIbocaStations } from "@/lib/iboca";

export const revalidate = 300;

export async function GET() {
  try {
    const stations = await fetchIbocaStations();
    return NextResponse.json({ success: true, data: stations });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}
