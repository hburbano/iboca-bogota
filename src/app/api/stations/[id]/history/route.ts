import { NextResponse } from "next/server";
import { fetchStationHistory } from "@/lib/fetch-history";
import { parseStationId } from "@/lib/iboca";

export const revalidate = 300;
export const maxDuration = 60;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const stationId = parseStationId(id);
  if (stationId == null) {
    return NextResponse.json(
      { success: false, error: "Invalid station id" },
      { status: 400 },
    );
  }

  try {
    const data = await fetchStationHistory(stationId);
    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          "Cache-Control":
            "public, max-age=120, s-maxage=300, stale-while-revalidate=60",
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 502 },
    );
  }
}
