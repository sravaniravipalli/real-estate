/**
 * Lazy loading utilities for Lottie animation files
 * Improves initial page load by loading animations on demand
 */

/**
 * Animation file paths mapped to their keys
 */
const ANIMATION_PATHS = {
  buildingLoading: () => import('../assets/Animation/building-loading.json'),
  contact: () => import('../assets/Animation/contact.json'),
  faq: () => import('../assets/Animation/faq.json'),
  imageLoading: () => import('../assets/Animation/image-loading.json'),
  imageLoading2: () => import('../assets/Animation/image-2-loading.json'),
  imageLoading3: () => import('../assets/Animation/image-3-loading.json'),
  imageLoading4: () => import('../assets/Animation/image-4-loading.json'),
};

/**
 * Cache for loaded animations
 */
const animationCache = new Map();

/**
 * Load animation with caching
 * @param {string} animationKey - Key from ANIMATION_PATHS
 * @returns {Promise<Object>} Animation data
 */
export const loadAnimation = async (animationKey) => {
  // Return cached animation if available
  if (animationCache.has(animationKey)) {
    return animationCache.get(animationKey);
  }

  // Validate key exists
  if (!ANIMATION_PATHS[animationKey]) {
    throw new Error(`Animation key "${animationKey}" not found`);
  }

  try {
    // Dynamically import animation
    const module = await ANIMATION_PATHS[animationKey]();
    const animationData = module.default;

    // Cache for future use
    animationCache.set(animationKey, animationData);

    return animationData;
  } catch (error) {
    console.error(`Failed to load animation: ${animationKey}`, error);
    throw error;
  }
};

/**
 * Preload multiple animations in parallel
 * @param {string[]} animationKeys - Array of animation keys to preload
 * @returns {Promise<void>}
 */
export const preloadAnimations = async (animationKeys) => {
  const loadPromises = animationKeys.map((key) => loadAnimation(key));
  await Promise.all(loadPromises);
};

/**
 * Clear animation cache (useful for memory management)
 */
export const clearAnimationCache = () => {
  animationCache.clear();
};

/**
 * Get cache size (for debugging)
 */
export const getCacheSize = () => {
  return animationCache.size;
};
