import { fetchWithRetry, handleApiError } from "../utils/apiUtils";

export const generatePropertyInfo = async (promptData) => {
  try {
    const response = await fetchWithRetry(
      `https://real-estate-production-1eda.up.railway.app/openai/generateTextAndImage`,
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
      `https://real-estate-production-1eda.up.railway.app/properties`,
      {},
      15000 // 15 second timeout
    );
    const data = await response.json();

    const items = data?.data || data?.properties || [];
    return { data: items };
  } catch (error) {
    const formattedError = handleApiError(error);
    throw new Error(formattedError.message);
  }
};

export const savePropertyToDb = async (propertyData) => {
  try {
    const response = await fetchWithRetry(
      `https://real-estate-production-1eda.up.railway.app/properties`,
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
      `https://real-estate-production-1eda.up.railway.app/openai/generateSocialMediaPoster`,
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
