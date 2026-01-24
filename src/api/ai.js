import { mockProperties } from "../data/mockProperties";
import { fetchWithRetry, handleApiError } from "../utils/apiUtils";

export const generatePropertyInfo = async (promptData) => {
  try {
    const response = await fetchWithRetry(
      `${import.meta.env.VITE_REACT_API_URL}/openai/generateTextAndImage`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(promptData),
      },
      30000, // 30 second timeout
      1 // 1 retry
    );
    const data = await response.json();
    return data;
  } catch (error) {
    const formattedError = handleApiError(error);
    throw new Error(formattedError.message);
  }
};

export const fetchProducts = async () => {
  try {
    const response = await fetchWithRetry(
      `${import.meta.env.VITE_REACT_API_URL}/properties`,
      {},
      15000 // 15 second timeout
    );
    const data = await response.json();
    
    // Merge with user-added properties from localStorage
    const userProperties = JSON.parse(localStorage.getItem('userProperties') || '[]');
    const allProperties = [...userProperties, ...data.data];
    
    return { data: allProperties };
  } catch (error) {
    // Using mock properties + user properties as fallback
    const userProperties = JSON.parse(localStorage.getItem('userProperties') || '[]');
    const allProperties = [...userProperties, ...mockProperties];
    
    return { data: allProperties };
  }
};

export const savePropertyToDb = async (propertyData) => {
  try {
    const response = await fetchWithRetry(
      `${import.meta.env.VITE_REACT_API_URL}/properties`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(propertyData),
      },
      20000 // 20 second timeout
    );
    const data = await response.json();
    return data;
  } catch (error) {
    const formattedError = handleApiError(error);
    throw new Error(formattedError.message);
  }
};

export const generateSocialMediaPoster = async (featureData) => {
  try {
    const response = await fetchWithRetry(
      `${import.meta.env.VITE_REACT_API_URL}/openai/generateSocialMediaPoster`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(featureData),
      },
      30000 // 30 second timeout
    );
    const data = await response.json();
    return data;
  } catch (error) {
    const formattedError = handleApiError(error);
    throw new Error(formattedError.message);
  }
}
