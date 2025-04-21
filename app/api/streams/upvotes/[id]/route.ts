import { prismaClient } from "@/app/lib/db"; // Correct export
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const streamId = params.id;

  try {
    const deletedUpvotes = await prismaClient.upvote.deleteMany({
      where: { streamId },
    });

    return NextResponse.json({
      message: `Deleted ${deletedUpvotes.count} upvotes (if any)`,
    });
  } catch (error: any) {
    console.error("Error deleting upvotes:", error);
    return NextResponse.json(
      { message: "Failed to delete upvotes", error: error.message },
      { status: 500 }
    );
  }
}
