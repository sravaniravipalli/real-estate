import React, { useEffect, useMemo, useState } from "react";

const BACKEND_URL = import.meta.env.VITE_REACT_API_URL || "http://localhost:5000";

export default function PropertyVideoBrowser() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isPlaying, setIsPlaying] = useState(null);
  const [videos, setVideos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setLoadError("");

        const [videosRes, categoriesRes] = await Promise.all([
          fetch(`${BACKEND_URL}/videos`),
          fetch(`${BACKEND_URL}/video-categories`),
        ]);

        if (!videosRes.ok) throw new Error("Failed to load videos from backend.");
        if (!categoriesRes.ok) throw new Error("Failed to load video categories from backend.");

        const videosJson = await videosRes.json();
        const categoriesJson = await categoriesRes.json();

        setVideos(videosJson.data || videosJson.videos || []);
        setCategories(categoriesJson.data || categoriesJson.categories || []);
      } catch (e) {
        setLoadError(e?.message || "Failed to load videos.");
        setVideos([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredVideos = useMemo(() => {
    if (!selectedCategory) return videos;
    return videos.filter((v) => v.type === selectedCategory);
  }, [videos, selectedCategory]);

  const mostViewed = useMemo(() => {
    return [...videos].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
  }, [videos]);

  const playingVideo = useMemo(() => {
    if (!isPlaying) return null;
    return videos.find((v) => String(v.id) === String(isPlaying)) || null;
  }, [videos, isPlaying]);

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-gray-600">Loading videos...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-semibold">{loadError}</p>
          <p className="text-red-600 text-sm mt-1">Seed videos into the database, then refresh.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="property-video-browser p-4">
      <h2 className="text-2xl font-bold mb-4">Property Videos</h2>

      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`btn btn-xs ${selectedCategory === null ? "btn-primary" : "btn-outline"}`}
          >
            All ({videos.length})
          </button>
          {categories.map((category) => {
            const count = videos.filter((v) => v.type === category.id).length;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`btn btn-xs ${selectedCategory === category.id ? "btn-primary" : "btn-outline"}`}
              >
                {category.icon} {category.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {filteredVideos.map((video) => (
          <div
            key={video.id}
            className="card bg-base-100 shadow hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setIsPlaying(video.id)}
          >
            <figure className="relative overflow-hidden rounded-t-xl bg-black">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-32 object-cover hover:opacity-80 transition-opacity"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-50 transition-all" />
            </figure>

            <div className="p-2">
              <h3 className="text-xs font-bold line-clamp-2 mb-1">{video.title}</h3>
              <div className="flex items-center justify-between">
                <span className="badge badge-xs badge-info">{video.type}</span>
                <span className="text-xs text-gray-400">
                  {video.uploadDate ? new Date(video.uploadDate).toLocaleDateString() : ""}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-bold mb-3">Most Viewed</h3>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {mostViewed.map((video) => (
            <div
              key={video.id}
              className="cursor-pointer group relative overflow-hidden rounded-lg"
              onClick={() => setIsPlaying(video.id)}
            >
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-24 object-cover group-hover:scale-110 transition-transform"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-1">
                <p className="text-white text-xs font-semibold line-clamp-1">{video.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {playingVideo && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-xl max-h-screen overflow-y-auto p-4">
            <button
              onClick={() => setIsPlaying(null)}
              className="btn btn-sm btn-circle absolute right-2 top-2 z-10"
            >
              x
            </button>
            <h3 className="font-bold text-sm mb-2 pr-8">{playingVideo.title}</h3>
            <video
              controls
              autoPlay
              muted
              playsInline
              style={{ maxHeight: "55vh" }}
              className="w-full rounded-lg bg-black mb-2"
              poster={playingVideo.thumbnail}
            >
              <source src={playingVideo.videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div className="text-xs text-gray-600">
              <p className="mb-1">{playingVideo.description}</p>
              <div className="flex gap-3 flex-wrap">
                <span>{playingVideo.uploadDate ? new Date(playingVideo.uploadDate).toLocaleDateString() : ""}</span>
                <span className="badge badge-info badge-xs">{playingVideo.type}</span>
              </div>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setIsPlaying(null)} />
        </div>
      )}
    </div>
  );
}
