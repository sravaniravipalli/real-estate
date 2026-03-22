import React, { useEffect, useState } from "react";

const BACKEND_URL = "https://real-estate-production-1eda.up.railway.app";

export default function PropertyVideoGallery({ propertyId }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [video, setVideo] = useState(null);

  useEffect(() => {
    if (!propertyId) return;
    const load = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/videos/by-property/${propertyId}`);
        if (!res.ok) {
          setVideo(null);
          return;
        }
        const data = await res.json();
        setVideo(data.data || data.video || null);
      } catch {
        setVideo(null);
      }
    };
    load();
  }, [propertyId]);

  if (!video) return null;

  return (
    <div className="property-video-section w-full max-w-xs rounded-xl overflow-hidden shadow-md bg-white">
      <div className="relative w-full h-44 overflow-hidden bg-black">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setIsModalOpen(true)}
        />
        <button
          onClick={() => setIsModalOpen(true)}
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-50 transition-all"
        />
      </div>

      <div className="p-3">
        <h3 className="font-bold text-sm mb-1 truncate">{video.title}</h3>
        <p className="text-gray-600 text-xs mb-2 line-clamp-2">{video.description}</p>
        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
          <span>{video.duration}</span>
          <span>{(video.views || 0).toLocaleString()} views</span>
          <span className="badge badge-sm badge-info">{video.type}</span>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="btn btn-sm btn-circle absolute right-2 top-2"
            >
              x
            </button>
            <h3 className="font-bold text-lg mb-4">{video.title}</h3>
            <video
              controls
              autoPlay
              crossOrigin="anonymous"
              className="w-full rounded-lg bg-black"
              poster={video.thumbnail}
            >
              <source src={video.videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div className="mt-4 text-sm text-gray-600">
              <p className="mb-2">{video.description}</p>
              <div className="flex gap-4">
                <span>Duration: {video.duration}</span>
                <span>Views: {(video.views || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setIsModalOpen(false)} />
        </div>
      )}
    </div>
  );
}
