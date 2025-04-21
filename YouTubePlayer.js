import { useEffect, useRef } from 'react';

const YouTubePlayer = ({ videoId }) => {
  const playerRef = useRef(null);  // Reference to hold the YouTube player instance

  useEffect(() => {
    // Load the YouTube API script if not already loaded
    if (window.YT) {
      initializePlayer();
    } else {
      const script = document.createElement('script');
      script.src = "https://www.youtube.com/iframe_api";
      script.onload = initializePlayer;
      document.body.appendChild(script);
    }

    // Cleanup the player on unmount
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoId]);

  const initializePlayer = () => {
    // Ensure the global YT object is available
    window.onYouTubeIframeAPIReady = () => {
      // Create a new YouTube player
      playerRef.current = new window.YT.Player('youtube-player', {
        videoId,
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange
        }
      });
    };
  };

  // Player Ready Event
  const onPlayerReady = (event) => {
    event.target.playVideo();  // Automatically start the video when ready
  };

  // Player State Change Event
  const onPlayerStateChange = (event) => {
    if (event.data === window.YT.PlayerState.ENDED) {
      console.log('Video ended!');
    }
  };

  return (
    <div id="youtube-player" style={{ width: '100%', height: '100%' }}></div>
  );
};

export default YouTubePlayer;
