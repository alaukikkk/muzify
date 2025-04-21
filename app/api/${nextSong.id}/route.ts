import { prismaClient } from "@/app/lib/db";
import { NextResponse } from "next/server";

// DELETE request handler
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    // Access the song ID from the dynamic parameter
    const songId = params.id;  // This gets the dynamic `id` from the URL path
    console.log("Attempting to delete song with ID:", songId);  // Log the ID to verify

    // Delete the song from the database
    await prismaClient.stream.delete({
      where: { id: songId },  // Assuming `id` is the correct field for deletion
    });

    return NextResponse.json({ message: "Song deleted successfully" });
  } catch (error) {
    console.error("Error deleting song:", error);
    return NextResponse.json({ error: "Failed to delete song" }, { status: 500 });
  }
}
