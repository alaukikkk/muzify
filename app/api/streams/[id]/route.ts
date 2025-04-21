import { prismaClient } from "@/app/lib/db";
import { NextResponse } from "next/server";

// DELETE request handler
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const songId = params.id;

  console.log("Attempting to delete song with ID:", songId);

  if (!songId) {
    return NextResponse.json(
      { error: "Song ID is required" },
      { status: 400 }
    );
  }

  try {
    const deletedSong = await prismaClient.stream.delete({
      where: { id: songId },
    });

    return NextResponse.json(
      { message: "Song deleted successfully", deletedSong },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting song:", error);

    // If the song doesn't exist
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Song not found" },
        { status: 404 }
      );
    }

    // Fallback for other errors
    return NextResponse.json(
      { error: "Failed to delete song", details: error.message || error },
      { status: 500 }
    );
  }
}
