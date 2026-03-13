import React, { useState } from 'react';
import { videoDatabase } from '../../data/videoDatabase';

export default function PropertyVideoBrowser() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isPlaying, setIsPlaying] = useState(null);

  const filteredVideos = selectedCategory
    ? videoDatabase.getVideosByCategory(selectedCategory)
    : videoDatabase.propertyVideos;

  return (
    <div className="property-video-browser p-4">
      <h2 className="text-2xl font-bold mb-4">Property Videos</h2>

      {/* Category Filter */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`btn btn-xs ${selectedCategory === null ? 'btn-primary' : 'btn-outline'}`}
          >
            All ({videoDatabase.propertyVideos.length})
          </button>
          {videoDatabase.videoCategories.map((category) => {
            const count = videoDatabase.getVideosByCategory(category.id).length;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`btn btn-xs ${selectedCategory === category.id ? 'btn-primary' : 'btn-outline'}`}
              >
                {category.icon} {category.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {filteredVideos.map((video) => (
          <div
            key={video.id}
            className="card bg-base-100 shadow hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setIsPlaying(video.id)}
          >
            {/* Thumbnail */}
            <figure className="relative overflow-hidden rounded-t-xl bg-black">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-32 object-cover hover:opacity-80 transition-opacity"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-50 transition-all">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </div>
            </figure>

            {/* Card Body */}
            <div className="p-2">
              <h3 className="text-xs font-bold line-clamp-2 mb-1">{video.title}</h3>
              <div className="flex items-center justify-between">
                <span className="badge badge-xs badge-info">{video.type}</span>
                <span className="text-xs text-gray-400">
                  {new Date(video.uploadDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Most Viewed Section */}
      <div className="mt-8">
        <h3 className="text-lg font-bold mb-3">Most Viewed</h3>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {videoDatabase.getMostViewedVideos(5).map((video) => (
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
              <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-60 flex items-center justify-center">
                <svg className="w-8 h-8 text-white opacity-70 group-hover:opacity-100" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-1">
                <p className="text-white text-xs font-semibold line-clamp-1">{video.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Video Player Modal */}
      {isPlaying && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-xl max-h-screen overflow-y-auto p-4">
            <button
              onClick={() => setIsPlaying(null)}
              className="btn btn-sm btn-circle absolute right-2 top-2 z-10"
            >
              ✕
            </button>
            {videoDatabase.propertyVideos.map((video) => {
              if (video.id !== isPlaying) return null;
              return (
                <div key={video.id}>
                  <h3 className="font-bold text-sm mb-2 pr-8">{video.title}</h3>
                  <video
                    controls
                    autoPlay
                    crossOrigin="anonymous"
                    muted
                    playsInline
                    style={{ maxHeight: '55vh' }}
                    className="w-full rounded-lg bg-black mb-2"
                    poster={video.thumbnail}
                    onError={(e) => {
                      e.target.parentElement.innerHTML = `<div class='text-red-600 text-center py-8'>Video failed to load.</div>`;
                    }}
                  >
                    <source src={video.videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  <div className="text-xs text-center mb-2">
                    <a href={video.videoUrl} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">
                      Open in new tab
                    </a>
                  </div>
                  <div className="text-xs text-gray-600">
                    <p className="mb-1">{video.description}</p>
                    <div className="flex gap-3 flex-wrap">
                      <span>📅 {new Date(video.uploadDate).toLocaleDateString()}</span>
                      <span className="badge badge-info badge-xs">{video.type}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="modal-backdrop" onClick={() => setIsPlaying(null)}></div>
        </div>
      )}
    </div>
  );
}