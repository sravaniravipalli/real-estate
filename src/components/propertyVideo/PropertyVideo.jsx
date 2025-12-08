import { useState } from "react";

export default function PropertyVideo({ videoUrl, thumbnail, title }) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="relative w-full bg-black rounded-lg overflow-hidden group">
      {!isPlaying ? (
        <div className="relative">
          <img
            src={thumbnail}
            alt={title || "Property video"}
            className="w-full h-80 object-cover"
          />
          <button
            onClick={() => setIsPlaying(true)}
            className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition-all duration-200 group-hover:scale-105"
          >
            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-all duration-200">
              <svg
                className="w-8 h-8 text-[#7C6EE4] ml-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>
          </button>
          <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
            🎥 Tour
          </div>
        </div>
      ) : (
        <video
          autoPlay
          controls
          poster={thumbnail}
          className="w-full h-80 object-cover"
          onEnded={() => setIsPlaying(false)}
        >
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}
    </div>
  );
}
