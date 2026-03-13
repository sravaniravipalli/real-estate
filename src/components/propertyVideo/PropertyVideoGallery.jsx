import React, { useState } from 'react';
import { videoDatabase } from '../../data/videoDatabase';

export default function PropertyVideoGallery({ propertyId }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const video = videoDatabase.getVideoByPropertyId(propertyId);

  if (!video) return null;

  return (
    <div className="property-video-section w-full max-w-xs rounded-xl overflow-hidden shadow-md bg-white">
      {/* Video Thumbnail Container - fixed height */}
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
        >
          <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
          </svg>
        </button>
      </div>

      {/* Video Info - compact */}
      <div className="p-3">
        <h3 className="font-bold text-sm mb-1 truncate">{video.title}</h3>
        <p className="text-gray-600 text-xs mb-2 line-clamp-2">{video.description}</p>
        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
          <span>⏱️ {video.duration}</span>
          <span>👁️ {video.views.toLocaleString()}</span>
          <span className="badge badge-sm badge-info">{video.type}</span>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="btn btn-sm btn-circle absolute right-2 top-2"
            >
              ✕
            </button>
            <h3 className="font-bold text-lg mb-4">{video.title}</h3>
            <video
              controls
              autoPlay
              crossOrigin="anonymous"
              className="w-full rounded-lg bg-black"
              poster={video.thumbnail}
              onError={(e) => console.error('Video loading error:', e)}
            >
              <source src={video.videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div className="mt-4 text-sm text-gray-600">
              <p className="mb-2">{video.description}</p>
              <div className="flex gap-4">
                <span>Duration: {video.duration}</span>
                <span>Views: {video.views.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}></div>
        </div>
      )}
    </div>
  );
}