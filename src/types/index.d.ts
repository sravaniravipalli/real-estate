/**
 * Type definitions for the Real Estate AI project
 */

/**
 * Property interface
 * @typedef {Object} Property
 * @property {string} _id - Unique identifier
 * @property {string} userName - Property owner/creator name
 * @property {string} description - Property description
 * @property {string} propertyImage - URL to property image
 * @property {string} [propertyVideo] - URL to property video
 * @property {string} [videoThumbnail] - URL to video thumbnail
 * @property {string} [videoDuration] - Video duration (e.g., "2:45")
 * @property {number} [videoViews] - Number of video views
 * @property {string} [videoType] - Type of video (e.g., "virtual-tour")
 * @property {string} valuationCost - Property valuation cost
 * @property {string} location - Property location
 * @property {number} bedrooms - Number of bedrooms
 * @property {number} bathrooms - Number of bathrooms
 * @property {string} area - Property area (e.g., "1800 sqft")
 */

/**
 * Video Database Entry
 * @typedef {Object} VideoEntry
 * @property {string} id - Unique video identifier
 * @property {string} propertyId - Associated property ID
 * @property {string} title - Video title
 * @property {string} videoUrl - Video file URL
 * @property {string} thumbnail - Thumbnail image URL
 * @property {string} duration - Video duration
 * @property {number} views - Number of views
 * @property {string} uploadDate - Upload date (YYYY-MM-DD)
 * @property {string} description - Video description
 * @property {string} type - Video category type
 */

/**
 * User interface
 * @typedef {Object} User
 * @property {string} uid - User unique identifier
 * @property {string} email - User email
 * @property {string} [displayName] - User display name
 * @property {string} [photoURL] - User photo URL
 */

/**
 * Auth Context Value
 * @typedef {Object} AuthContextValue
 * @property {User | null} user - Current user
 * @property {boolean} loading - Loading state
 * @property {Function} createUser - Create new user function
 * @property {Function} signIn - Sign in function
 * @property {Function} logOut - Log out function
 * @property {Function} updateUser - Update user function
 * @property {Function} providerLogin - Provider login function
 */

/**
 * Property Form Data
 * @typedef {Object} PropertyFormData
 * @property {string} streetAddress - Street address
 * @property {string} city - City
 * @property {string} state - State
 * @property {string} zipcode - Zip code
 * @property {string} numberOfBedrooms - Number of bedrooms
 * @property {string} numberOfBathrooms - Number of bathrooms
 * @property {string} squareFootage - Square footage
 * @property {string} condition - Property condition
 * @property {string} renovation - Renovation status
 * @property {string} firstAddress - First address line
 * @property {string} secondAddress - Second address line
 * @property {string} features - Property features
 * @property {string} zoning - Zoning information
 * @property {string} landUse - Permitted land use
 * @property {string} purpose - Property purpose
 */

/**
 * API Error Response
 * @typedef {Object} ApiErrorResponse
 * @property {string} message - Error message
 * @property {string} type - Error type
 * @property {number} [status] - HTTP status code
 * @property {any} [data] - Additional error data
 */

export {};
