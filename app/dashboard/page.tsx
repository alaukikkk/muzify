"use client";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Share, Play, ThumbsUp, LogOut } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { signOut } from "next-auth/react";
import YouTube from "react-youtube";
import { YT_REGEX } from "../lib/utils";

// Helper to extract YouTube ID
function extractYouTubeId(url: string) {
  const match = url.match(YT_REGEX);
  return match ? match[1] : null;
}

interface Song {
  id: string;
  title: string;
  thumbnail: string;
  upvotes: number;
  haveUpvoted: boolean;
  videoId: string | null;
}

interface DashboardProps {
  creatorId?: string;
}

export default function Dashboard({ creatorId }: DashboardProps) {

  const { data: session } = useSession();
  const userId = creatorId || session?.user?.id;
  const [youtubeLink, setYoutubeLink] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [nowPlaying, setNowPlaying] = useState<Song | null>(null);
  var [upcomingSongs, setUpcomingSongs] = useState<Song[]>([]);

  const REFRESH_INTERVAL_MS = 0.001 * 1000;
  const handlePlayerReady = (event: any) => {
    console.log("Player is ready");
    // You can access the YouTube player instance here
    const player = event.target;
  };
  const handlePlayerPlay = () => {
    console.log("Video is playing");
  };

  async function refreshStreams() {
	  if (!userId) return;

	  try {
		const res = await axios.get(`/api/streams?creatorId=${userId}`, {
		  withCredentials: true,
		});

		if (res.data?.streams?.length > 0) {
		  // Sort by upvotes in descending order
		  const sortedStreams = res.data.streams.sort((a: any, b: any) => b.upvote - a.upvote);

		  setNowPlaying({
		    id: sortedStreams[0].id,
		    title: sortedStreams[0].title,
		    thumbnail: sortedStreams[0].smallImg || "/placeholder.svg",
		    upvotes: sortedStreams[0].upvote ?? 0,
		    haveUpvoted: false,
		    videoId: extractYouTubeId(sortedStreams[0].url),
		  });

		  setUpcomingSongs(
		    sortedStreams.slice(1).map((stream: any) => ({
		      id: stream.id,
		      title: stream.title,
		      thumbnail: stream.smallImg || "/placeholder.svg",
		      upvotes: stream.upvote ?? 0,
		      haveUpvoted: false,
		      videoId: extractYouTubeId(stream.url),
		    }))
		  );
		} else {
		  setNowPlaying(null);
		  setUpcomingSongs([]);
		}
	  } catch (error) {
		console.error("Failed to refresh streams:", error);
		toast.error("Failed to refresh streams.");
	  }
	}


  useEffect(() => {
    refreshStreams();
    const interval = setInterval(refreshStreams, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    const match = youtubeLink.match(YT_REGEX);
    setVideoId(match ? match[1] : null);
  }, [youtubeLink]);

  const handleAddToQueue = async () => {
    if (!videoId) {
      toast.error("Please enter a valid YouTube link!");
      return;
    }

    if (!userId) {
      toast.error("You need to be logged in to add a song!");
      return;
    }

    try {
      const response = await fetch("/api/streams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: userId,
          url: youtubeLink,
        }),
      });

      if (!response.ok) throw new Error("Failed to add song to queue");

      await refreshStreams();
      setYoutubeLink("");
      setVideoId(null);
      toast.success("Song added to queue!");
    } catch (error) {
      console.error("Error adding song to queue:", error);
      toast.error("Failed to add song to queue. Please try again.");
    }
  };


  const handlePlayNext = async () => {
	  if (upcomingSongs.length === 0) return;

	  var [nextSong, ...restQueue] = upcomingSongs;
	  setNowPlaying(nextSong);
	  setUpcomingSongs(restQueue);

	  try {
		if (!nowPlaying?.id) {
		  console.warn("Next song has no ID, skipping delete.");
		  return;
		}

		// Log the song ID
		console.log("nextSong object:", nowPlaying);
		console.log("Attempting to delete ID:", nowPlaying.id);


		// First, delete the upvotes associated with this song
		await fetch(`/api/streams/upvotes/${nowPlaying.id}`, {
		  method: "DELETE",
		});

		// Then, delete the song
		const res = await fetch(`/api/streams/${nowPlaying.id}`, {
		  method: "DELETE",
		});

		if (!res.ok) {
		  let errorBody: any = "No response body";

		  try {
		    const contentType = res.headers.get("content-type");
		    if (contentType?.includes("application/json")) {
		      errorBody = await res.json();
		    } else {
		      errorBody = await res.text();
		    }
		  } catch (jsonErr) {
		    console.warn("Failed to parse response body", jsonErr);
		    errorBody = { error: jsonErr.message || jsonErr };
		  }

		  // Log a detailed error including the response status and error body
		  console.error(
		    `Failed to delete song: Status: ${res.status}, Body: ${JSON.stringify(
		      errorBody
		    )}`
		  );
		  alert("Failed to remove song from queue");
		}
	  } catch (err) {
		console.error("Error deleting song from queue:", err);
		alert("Something went wrong while deleting the song");
	  }
	};



const handlePlayerEnd = () => {
    console.log("Video has ended");
    handlePlayNext();
  };


  const handleShare = () => {
    if (!userId) {
      toast.error("You need to be logged in to share!");
      return;
    }
    const shareableLink = `${window.location.protocol}//${window.location.hostname}/creator/${userId}`;
    navigator.clipboard
      .writeText(shareableLink)
      .then(() => toast.success("Link copied to clipboard!"))
      .catch(() => toast.error("Failed to copy link. Please try again."));
  };

 const handleVote = async (songId: string, isUpvote: boolean) => {
 //console.log("Voting on", Song.id, isUpvote);
  try {
    // Optimistic UI update
    setUpcomingSongs((prev) =>
      prev
        .map((song) =>
          song.id === songId
            ? {
                ...song,
                upvotes: isUpvote ? song.upvotes + 1 : song.upvotes,
                haveUpvoted: !song.haveUpvoted,
              }
            : song
        )
        .sort((a, b) => b.upvotes - a.upvotes)
    );

    const response = await fetch("/api/streams/upvote", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // ✅ ensures session cookie is sent
      body: JSON.stringify({ streamId: songId }),
    });

    const text = await response.text(); // get raw response
    let responseData: any = {};

    try {
      responseData = JSON.parse(text); // try to parse JSON
    } catch (e) {
      console.warn("Server did not return valid JSON:", text);
    }

    console.log("Response status:", response.status);
    console.log("Response body:", responseData);

    if (!response.ok) {
      console.error("Upvote failed with status:", response.status);
      console.error("Error details:", responseData);
      throw new Error(responseData.message || "Failed to upvote");
    }

    // If upvote succeeds, proceed with refresh
    await refreshStreams();
  } catch (error: any) {
    console.error("Error while upvoting:", error);

    if (error instanceof Error) {
      if (error.message.includes("Failed to fetch")) {
        console.error("Network error occurred while trying to fetch data.");
      } else if (error.message.includes("Unexpected end of JSON input")) {
        console.error("Server responded with incomplete or invalid JSON.");
      } else {
        console.error("An unknown error occurred:", error.message);
      }
    } else {
      console.error("Unexpected error:", error);
    }

    // Revert optimistic update on failure
    setUpcomingSongs((prev) =>
      prev
        .map((song) =>
          song.id === songId
            ? {
                ...song,
                upvotes: isUpvote ? song.upvotes - 1 : song.upvotes,
                haveUpvoted: !song.haveUpvoted,
              }
            : song
        )
        .sort((a, b) => b.upvotes - a.upvotes)
    );

    toast.error("Failed to upvote. Please try again.");
  }
};




  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black p-4">
      <div className="w-full max-w-4xl">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white">Song Voting Queue</h1>
            <div className="flex gap-4">
              <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleShare}>
                <Share className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button onClick={() => signOut({ callbackUrl: "/" })} className="bg-purple-600 hover:bg-purple-700">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>

          <Input
            placeholder="Paste YouTube link here"
            value={youtubeLink}
            onChange={(e) => setYoutubeLink(e.target.value)}
            className="bg-gray-800 border-none text-white"
          />
          <Button onClick={handleAddToQueue} className="w-full bg-purple-600 hover:bg-purple-700">
            Add to Queue
          </Button>

          {videoId && (
            <div className="mt-4">
              <h2 className="text-xl font-bold text-white mb-2">Video Preview</h2>
              <Card>
                <CardContent className="p-4">
                  <iframe
                    width="560"
                    height="315"
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </CardContent>
              </Card>
            </div>
          )}

          {nowPlaying && (
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Now Playing</h2>
              <Card>
                <CardContent>
                  <YouTube
                    videoId={nowPlaying.videoId || ""}
                    onReady={handlePlayerReady}
                    onPlay={handlePlayerPlay}
                    onEnd={handlePlayerEnd}
                    opts={{
                      height: '315',
                      width: '560',
                      playerVars: {
                        autoplay: 1, // Start playing the video immediately
                        controls: 1, // Show player controls
                      },
                    }}
                  />
                </CardContent>
              </Card>

              {upcomingSongs.length > 0 && (
                <Button onClick={handlePlayNext} className="mt-4 w-full bg-purple-600 hover:bg-purple-700">
                  <Play className="mr-2 h-4 w-4" />
                  Play Next
                </Button>
              )}
            </div>
          )}

          {upcomingSongs.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-bold text-white mb-2">Upcoming Songs</h2>
              {upcomingSongs.map((song) => (
                <div key={song.id} className="flex items-center justify-between bg-gray-900 p-4 rounded mb-2">
                  <div className="flex items-center gap-4">
                    <img src={song.thumbnail} alt={song.title} className="w-12 h-12 object-cover" />
                    <span className="text-white">{song.title}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <ToastContainer />
      </div>
    </main>
  );
}
