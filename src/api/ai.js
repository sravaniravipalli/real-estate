import { mockProperties } from "../data/mockProperties";

export const generatePropertyInfo = async (promptData) => {
  const response = await fetch(`${import.meta.env.VITE_REACT_API_URL}/openai/generateTextAndImage`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(promptData),
  });
  const data = await response.json();
  return data;
};

export const fetchProducts = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_REACT_API_URL}/properties`);
    if (!response.ok) {
      throw new Error("API error");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.log("Using mock properties:", error);
    return { data: mockProperties };
  }
};

export const savePropertyToDb = async (propertyData) => {
  const response = await fetch(`${import.meta.env.VITE_REACT_API_URL}/properties`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(propertyData),
  });
  const data = await response.json();
  return data;
};

export const generateSocialMediaPoster = async (featureData) => {
  const response = await fetch(`${import.meta.env.VITE_REACT_API_URL}/openai/generateSocialMediaPoster`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(featureData),
  });
  const data = await response.json();
  return data;
}
