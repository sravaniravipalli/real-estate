# Property Video Database

## Overview
The real estate AI project now includes a comprehensive video database system for properties with support for various video types, categories, and metadata.

## Files Structure

### 1. **videoDatabase.js** (`src/data/videoDatabase.js`)
Main video database containing:
- 25 property videos with complete metadata
- Video categories and classifications
- Helper functions for filtering and searching

#### Database Schema

```javascript
{
  id: String,              // Unique video identifier
  propertyId: String,      // Associated property ID
  title: String,           // Video title
  videoUrl: String,        // Video file URL (MP4, etc.)
  thumbnail: String,       // Thumbnail image URL
  duration: String,        // Video length (e.g., "2:45")
  views: Number,           // Number of views
  uploadDate: String,      // Upload date (YYYY-MM-DD)
  description: String,     // Video description
  type: String            // Category type (see below)
}
```

#### Video Categories
- `virtual-tour` - 360° and virtual property tours
- `walkthrough` - Property walkthroughs
- `360-tour` - 360-degree tours
- `video-tour` - Standard video tours
- `property-showcase` - Property highlights
- `luxury-tour` - Luxury property features
- `heritage-tour` - Heritage property tours
- `estate-tour` - Large estate tours
- `modern-tour` - Modern design showcases
- `tech-tour` - Smart home technology tours
- `family-tour` - Family-friendly properties

#### Helper Functions

```javascript
// Get video by property ID
videoDatabase.getVideoByPropertyId(propertyId)

// Get videos by category
videoDatabase.getVideosByCategory(categoryId)

// Get most viewed videos
videoDatabase.getMostViewedVideos(limit)

// Get recent videos
videoDatabase.getRecentVideos(limit)
```

### 2. **mockProperties.js** (`src/data/mockProperties.js`)
Updated with new video fields:

```javascript
{
  _id: String,
  propertyVideo: String,       // Video URL
  videoThumbnail: String,      // Thumbnail URL
  videoDuration: String,       // Duration (e.g., "2:45")
  videoViews: Number,          // View count
  videoType: String,           // Category type
  // ... other property fields
}
```

## Components

### 1. **PropertyVideoGallery** (`src/components/propertyVideo/PropertyVideoGallery.jsx`)
Single property video display component

**Features:**
- Displays property-specific video
- Modal video player
- Video metadata display
- Thumbnail with play button

**Usage:**
```jsx
import PropertyVideoGallery from 'components/propertyVideo/PropertyVideoGallery';

<PropertyVideoGallery propertyId="1" />
```

### 2. **PropertyVideoBrowser** (`src/components/propertyVideo/PropertyVideoBrowser.jsx`)
Video gallery and browser component

**Features:**
- Display all property videos in grid layout
- Category filtering
- Most viewed videos section
- Recent videos section
- Video player modal
- Responsive design

**Usage:**
```jsx
import PropertyVideoBrowser from 'components/propertyVideo/PropertyVideoBrowser';

<PropertyVideoBrowser />
```

## Integration Guide

### 1. Add Video Gallery to Property Details Page
```jsx
import PropertyVideoGallery from 'components/propertyVideo/PropertyVideoGallery';

export default function PropertyDetails() {
  return (
    <div>
      <PropertyVideoGallery propertyId={propertyId} />
      {/* Other property details */}
    </div>
  );
}
```

### 2. Create Videos Page
```jsx
import PropertyVideoBrowser from 'components/propertyVideo/PropertyVideoBrowser';

export default function VideosPage() {
  return <PropertyVideoBrowser />;
}
```

### 3. Access Video Database
```jsx
import { videoDatabase } from 'data/videoDatabase';

// Get video for a property
const video = videoDatabase.getVideoByPropertyId('1');

// Get luxury tours
const luxuryVideos = videoDatabase.getVideosByCategory('luxury-tour');

// Get trending videos
const trending = videoDatabase.getMostViewedVideos(5);
```

## Data Statistics

- **Total Videos:** 25
- **Total Categories:** 11
- **Most Viewed:** Beachfront Villa ECR Chennai (3,420 views)
- **Longest Video:** Lavish Mansion Banjara Hills (5:40)
- **Most Recent:** Added March 18, 2024

## Video URLs
All videos are sourced from Pexels (pexels.com) - Free to use stock videos

## Customization

### Add New Video
```javascript
videoDatabase.propertyVideos.push({
  id: "26",
  propertyId: "26",
  title: "New Property Video",
  videoUrl: "https://...",
  thumbnail: "https://...",
  duration: "3:30",
  views: 0,
  uploadDate: "2024-12-08",
  description: "Property description",
  type: "virtual-tour"
});
```

### Add New Category
```javascript
videoDatabase.videoCategories.push({
  id: "custom-type",
  name: "Custom Category",
  icon: "🎯"
});
```

## Performance Notes

- Videos are lazy-loaded with thumbnails
- Modal-based video player prevents multiple simultaneous loads
- Use CDN for video URLs in production
- Consider implementing video transcoding for multiple quality levels

## Future Enhancements

- [ ] Video analytics tracking
- [ ] User comments and ratings
- [ ] Video quality options (480p, 720p, 1080p)
- [ ] Live property tours
- [ ] Video recommendation system
- [ ] Subtitles/Captions support
- [ ] Video editing tools for agents
- [ ] Integration with video hosting services (YouTube, Vimeo)

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

Video format support requires HTML5 video tag support (MP4/H.264)
