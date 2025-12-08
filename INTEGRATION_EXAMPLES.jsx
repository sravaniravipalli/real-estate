// EXAMPLE INTEGRATION FILE
// This file demonstrates how to integrate the video database into existing pages

import React from 'react';
import PropertyVideoGallery from '../components/propertyVideo/PropertyVideoGallery';
import PropertyVideoBrowser from '../components/propertyVideo/PropertyVideoBrowser';
import { videoDatabase } from '../data/videoDatabase';

// ============================================
// EXAMPLE 1: Add Video to Property Card
// ============================================
export function PropertyCardWithVideo({ property }) {
  return (
    <div className="card bg-base-100 shadow-lg">
      <figure>
        <img src={property.propertyImage} alt={property.description} />
      </figure>
      <div className="card-body">
        <h2 className="card-title">{property.location}</h2>
        <p>{property.description}</p>
        
        {/* Add Video Section */}
        <PropertyVideoGallery propertyId={property._id} />
        
        <div className="card-actions justify-end">
          <button className="btn btn-primary">View Details</button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// EXAMPLE 2: Property Detail Page with Video
// ============================================
export function PropertyDetailPageExample() {
  const propertyId = "1"; // From URL params in real app
  const property = {
    _id: "1",
    location: "Bandra, Mumbai",
    description: "Luxurious 3BHK apartment...",
    // ... other properties
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold mb-6">{property.location}</h1>
      
      {/* Video Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Property Tour</h2>
        <PropertyVideoGallery propertyId={propertyId} />
      </div>

      {/* Other Details */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div>
          <h3 className="font-bold">Bedrooms</h3>
          <p>{property.bedrooms}</p>
        </div>
        <div>
          <h3 className="font-bold">Bathrooms</h3>
          <p>{property.bathrooms}</p>
        </div>
      </div>

      <p className="text-lg">{property.description}</p>
    </div>
  );
}

// ============================================
// EXAMPLE 3: Videos Gallery Page
// ============================================
export function PropertyVideosPageExample() {
  return (
    <div className="min-h-screen bg-base-200">
      <PropertyVideoBrowser />
    </div>
  );
}

// ============================================
// EXAMPLE 4: Use Video Database Functions
// ============================================
export function VideoQueryExamples() {
  // Get video for specific property
  const propertyVideo = videoDatabase.getVideoByPropertyId("1");
  
  // Get all luxury tour videos
  const luxuryVideos = videoDatabase.getVideosByCategory("luxury-tour");
  
  // Get top 5 most viewed
  const trendingVideos = videoDatabase.getMostViewedVideos(5);
  
  // Get recent uploads
  const recentVideos = videoDatabase.getRecentVideos(5);

  return (
    <div className="p-6">
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Single Property Video</h2>
        {propertyVideo && (
          <div className="card bg-base-100 shadow-lg">
            <figure>
              <img src={propertyVideo.thumbnail} alt={propertyVideo.title} />
            </figure>
            <div className="card-body">
              <h3 className="card-title">{propertyVideo.title}</h3>
              <p>{propertyVideo.description}</p>
              <div className="card-actions">
                <button className="btn btn-primary">Watch Video</button>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Luxury Tours ({luxuryVideos.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {luxuryVideos.map(video => (
            <div key={video.id} className="card bg-base-100 shadow">
              <figure>
                <img src={video.thumbnail} alt={video.title} />
              </figure>
              <div className="card-body">
                <h4 className="font-bold">{video.title}</h4>
                <p className="text-sm">👁️ {video.views} views</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Trending Videos</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {trendingVideos.map(video => (
            <div key={video.id} className="cursor-pointer group">
              <div className="relative overflow-hidden rounded-lg mb-2">
                <img 
                  src={video.thumbnail} 
                  alt={video.title}
                  className="w-full h-24 object-cover group-hover:scale-110 transition-transform"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-60" />
              </div>
              <p className="text-sm font-semibold line-clamp-2">{video.title}</p>
              <p className="text-xs text-gray-600">👁️ {video.views}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Recently Added</h2>
        <div className="space-y-4">
          {recentVideos.map(video => (
            <div key={video.id} className="card bg-base-100 shadow horizontal">
              <figure className="w-32">
                <img src={video.thumbnail} alt={video.title} />
              </figure>
              <div className="card-body">
                <h4 className="card-title">{video.title}</h4>
                <p className="text-sm">{video.description}</p>
                <div className="flex gap-2 text-xs">
                  <span>⏱️ {video.duration}</span>
                  <span>👁️ {video.views}</span>
                  <span className="badge badge-sm">{video.type}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ============================================
// EXAMPLE 5: Agent Profile with Videos
// ============================================
export function AgentProfileWithVideos({ agentProperties }) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Agent's Property Videos</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agentProperties.map(propertyId => {
          const video = videoDatabase.getVideoByPropertyId(propertyId);
          if (!video) return null;
          
          return (
            <div key={video.id} className="card bg-base-100 shadow-lg">
              <figure className="bg-black h-48 flex items-center justify-center">
                <img 
                  src={video.thumbnail} 
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                <button className="absolute btn btn-circle btn-primary">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </button>
              </figure>
              <div className="card-body">
                <h3 className="card-title text-base">{video.title}</h3>
                <p className="text-sm text-gray-600">{video.description}</p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Duration: {video.duration}</p>
                  <p>Views: {video.views.toLocaleString()}</p>
                </div>
                <div className="card-actions justify-end">
                  <button className="btn btn-sm btn-outline">View</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// EXAMPLE 6: Home Page Featured Videos
// ============================================
export function HomePageFeaturedVideos() {
  const featured = videoDatabase.getMostViewedVideos(3);

  return (
    <section className="py-12 bg-base-100">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Featured Property Tours</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featured.map(video => (
            <div key={video.id} className="group">
              <div className="relative overflow-hidden rounded-lg mb-4 h-48 bg-black flex items-center justify-center cursor-pointer">
                <img 
                  src={video.thumbnail} 
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <button className="absolute btn btn-circle btn-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </button>
              </div>
              <h3 className="text-xl font-bold mb-2">{video.title}</h3>
              <p className="text-gray-600 mb-4">{video.description}</p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>👁️ {video.views.toLocaleString()} views</span>
                <button className="btn btn-sm btn-outline">Watch Now</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// EXAMPLE 7: Search Videos by Category
// ============================================
export function VideoSearchByCategory() {
  const [selectedCategory, setSelectedCategory] = React.useState(null);
  
  const videos = selectedCategory
    ? videoDatabase.getVideosByCategory(selectedCategory)
    : videoDatabase.propertyVideos;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Browse Videos</h2>
      
      <div className="mb-8">
        <h3 className="font-bold mb-3">Categories</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`btn btn-sm ${selectedCategory === null ? 'btn-primary' : 'btn-outline'}`}
          >
            All ({videoDatabase.propertyVideos.length})
          </button>
          
          {videoDatabase.videoCategories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`btn btn-sm ${
                selectedCategory === category.id ? 'btn-primary' : 'btn-outline'
              }`}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map(video => (
          <div key={video.id} className="card bg-base-100 shadow">
            <figure>
              <img src={video.thumbnail} alt={video.title} />
            </figure>
            <div className="card-body">
              <h3 className="card-title text-base">{video.title}</h3>
              <p className="text-sm">{video.description}</p>
              <div className="text-xs text-gray-600">
                <p>⏱️ {video.duration}</p>
                <p>👁️ {video.views.toLocaleString()}</p>
              </div>
              <div className="card-actions">
                <button className="btn btn-sm btn-primary">Play</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// NOTE: Use these examples as templates to integrate
// the video database into your actual pages
// ============================================
