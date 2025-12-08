import React, { useState } from 'react';
import { videoDatabase } from '../../data/videoDatabase';

export default function PropertyVideoBrowser() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isPlaying, setIsPlaying] = useState(null);

  const filteredVideos = selectedCategory
    ? videoDatabase.getVideosByCategory(selectedCategory)
    : videoDatabase.propertyVideos;

  return (
    <div className="property-video-browser p-6">
      <h2 className="text-3xl font-bold mb-6">Property Videos</h2>

      {/* Category Filter */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Filter by Category</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`btn btn-sm ${
              selectedCategory === null ? 'btn-primary' : 'btn-outline'
            }`}
          >
            All Videos ({videoDatabase.propertyVideos.length})
          </button>
          {videoDatabase.videoCategories.map((category) => {
            const count = videoDatabase.getVideosByCategory(category.id).length;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`btn btn-sm ${
                  selectedCategory === category.id ? 'btn-primary' : 'btn-outline'
                }`}
              >
                {category.icon} {category.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map((video) => (
          <div key={video.id} className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
            <figure className="relative overflow-hidden bg-black">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-48 object-cover"
              />
              <button
                onClick={() => setIsPlaying(video.id)}
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 hover:bg-opacity-60 transition-all"
              >
                <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </button>
              <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-semibold">
                {video.duration}
              </div>
            </figure>
            <div className="card-body p-4">
              <h3 className="card-title text-base mb-2 line-clamp-2">{video.title}</h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{video.description}</p>
              <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                <span className="flex items-center gap-1">
                  👁️ {video.views.toLocaleString()}
                </span>
                <span className="badge badge-sm badge-info">{video.type}</span>
              </div>
              <div className="card-actions justify-between items-center">
                <span className="text-xs text-gray-400">
                  {new Date(video.uploadDate).toLocaleDateString()}
                </span>
                <button
                  onClick={() => setIsPlaying(video.id)}
                  className="btn btn-primary btn-sm"
                >
                  Play
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Most Viewed Section */}
      <div className="mt-12">
        <h3 className="text-2xl font-bold mb-6">Most Viewed Videos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {videoDatabase.getMostViewedVideos(5).map((video) => (
            <div
              key={video.id}
              className="cursor-pointer group relative overflow-hidden rounded-lg"
              onClick={() => setIsPlaying(video.id)}
            >
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-32 object-cover group-hover:scale-110 transition-transform"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-60 transition-all flex items-center justify-center">
                <svg className="w-10 h-10 text-white opacity-70 group-hover:opacity-100" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                <p className="text-white text-xs font-semibold line-clamp-1">{video.title}</p>
                <p className="text-gray-300 text-xs">👁️ {video.views.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Video Player Modal */}
      {isPlaying && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-4xl">
            <button
              onClick={() => setIsPlaying(null)}
              className="btn btn-sm btn-circle absolute right-2 top-2"
            >
              ✕
            </button>
            {videoDatabase.propertyVideos.map((video) => {
              if (video.id === isPlaying) {
                return (
                  <div key={video.id}>
                    <h3 className="font-bold text-lg mb-4">{video.title}</h3>
                    <video
                      controls
                      autoPlay
                      crossOrigin="anonymous"
                      muted
                       playsInline
                       className="w-full rounded-lg bg-black mb-4"
                      poster={video.thumbnail}
                      onError={(e) => {
                        e.target.parentElement.innerHTML = `<div class='text-red-600 text-center py-8'>Video failed to load. Please try again later.</div>`;
                        console.error('Video loading error:', e);
                      }}
                    >
                      <source src={video.videoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                      <div className="text-xs text-center mt-2">
                        <a href={video.videoUrl} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">Open video in new tab</a>
                      </div>
                    <div className="text-sm text-gray-600">
                      <p className="mb-2">{video.description}</p>
                      <div className="flex gap-4 flex-wrap">
                        <span>⏱️ Duration: {video.duration}</span>
                        <span>👁️ Views: {video.views.toLocaleString()}</span>
                        <span>📅 {new Date(video.uploadDate).toLocaleDateString()}</span>
                        <span className="badge badge-info">{video.type}</span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
          <div className="modal-backdrop" onClick={() => setIsPlaying(null)}></div>
        </div>
      )}
    </div>
  );
}
