import { useState, useContext } from "react";
import { AuthContext } from "context/authProvider/AuthProvider";

const BACKEND_URL = "https://real-estate-production-1eda.up.railway.app";

export default function AddPropertyForm({ onPropertyAdded }) {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    title: "", description: "", streetAddress: "", city: "",
    state: "", zipcode: "", price: "", bedrooms: "", bathrooms: "",
    squareFootage: "", lotSize: "", yearBuilt: "", propertyType: "",
    condition: "", features: "",
  });

  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [videoPreviews, setVideoPreviews] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 10) {
      setErrors((prev) => ({ ...prev, images: "Maximum 10 images allowed" }));
      return;
    }
    setImages((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreviews((prev) => [...prev, reader.result]);
      reader.readAsDataURL(file);
    });
    if (errors.images) setErrors((prev) => ({ ...prev, images: "" }));
  };

  const handleVideoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (videos.length + files.length > 5) {
      setErrors((prev) => ({ ...prev, videos: "Maximum 5 videos allowed" }));
      return;
    }
    setVideos((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => setVideoPreviews((prev) => [...prev, reader.result]);
      reader.readAsDataURL(file);
    });
    if (errors.videos) setErrors((prev) => ({ ...prev, videos: "" }));
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index) => {
    setVideos((prev) => prev.filter((_, i) => i !== index));
    setVideoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Property title is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.streetAddress.trim()) newErrors.streetAddress = "Street address is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.state.trim()) newErrors.state = "State is required";
    if (!formData.zipcode.trim()) newErrors.zipcode = "Zip code is required";
    if (!formData.price) newErrors.price = "Price is required";
    if (!formData.bedrooms) newErrors.bedrooms = "Number of bedrooms is required";
    if (!formData.bathrooms) newErrors.bathrooms = "Number of bathrooms is required";
    if (!formData.squareFootage) newErrors.squareFootage = "Square footage is required";
    if (!formData.propertyType) newErrors.propertyType = "Property type is required";
    if (!formData.condition) newErrors.condition = "Condition is required";
    if (images.length === 0) newErrors.images = "At least 1 image is required";
    return newErrors;
  };

  const resetForm = () => {
    setFormData({
      title: "", description: "", streetAddress: "", city: "",
      state: "", zipcode: "", price: "", bedrooms: "", bathrooms: "",
      squareFootage: "", lotSize: "", yearBuilt: "", propertyType: "",
      condition: "", features: "",
    });
    setImages([]); setVideos([]);
    setImagePreviews([]); setVideoPreviews([]);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setLoading(true);
    try {
      const propertyData = {
        _id: `local-${Date.now()}`,
        userName: user?.displayName || user?.email || "Current User",
        userEmail: user?.email || "",
        title: formData.title,
        description: formData.description,
        propertyImage: imagePreviews[0] || "https://placehold.co/400x300/e2e8f0/64748b?text=Property",
        propertyVideo: videoPreviews[0] || "",
        videoThumbnail: imagePreviews[0] || "",
        valuationCost: `₹${(parseInt(formData.price) || 0).toLocaleString('en-IN')}`,
        location: formData.state,
        city: formData.city,
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        area: `${formData.squareFootage} sqft`,
        propertyType: formData.propertyType,
        condition: formData.condition,
        features: formData.features,
        address: {
          street: formData.streetAddress,
          city: formData.city,
          state: formData.state,
          zipcode: formData.zipcode,
        },
        yearBuilt: formData.yearBuilt || "",
        lotSize: formData.lotSize || "",
        images: imagePreviews,
        videos: videoPreviews,
        createdAt: new Date().toISOString(),
      };

      // Save to backend (DB)
      const res = await fetch(`${BACKEND_URL}/properties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(propertyData),
      });
      if (!res.ok) {
        throw new Error("Failed to save property to backend.");
      }
      const saved = await res.json();
      const savedProperty = saved?.data || saved?.property || propertyData;

      setSuccess(true);
      resetForm();
      if (onPropertyAdded) onPropertyAdded(savedProperty);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      setErrors((prev) => ({ ...prev, submit: error.message || "Failed to submit property." }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="-mt-2">
      <div className="w-full px-0 mx-auto">
        <div className="relative flex flex-col min-w-0 break-words w-full mb-6 rounded-lg bg-white border-0 shadow-lg">
          <div className="rounded-t bg-gradient-to-r from-blue-500 to-indigo-600 pb-5">
            <div className="text-center">
              <h6 className="text-2xl lg:text-3xl font-semibold text-white">➕ Add New Property</h6>
              <p className="text-blue-100 text-sm mt-1">Complete all fields to list your property</p>
            </div>
          </div>

          <div className="flex-auto p-6">
            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 font-semibold">✅ Property added successfully! Saved to backend & localStorage.</p>
              </div>
            )}
            {errors.submit && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 font-semibold">❌ {errors.submit}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Property Overview */}
              <div className="mb-6 bg-blue-50 p-5 rounded-lg">
                <h6 className="text-lg font-bold text-gray-700 mb-4">📋 Property Overview</h6>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Property Title *</label>
                    <input type="text" name="title" value={formData.title} onChange={handleInputChange}
                      placeholder="e.g., Beautiful Modern House in Downtown"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    {errors.title && <p className="mt-1 text-red-500 text-sm">{errors.title}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Property Type *</label>
                    <select name="propertyType" value={formData.propertyType} onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select Property Type</option>
                      <option value="house">House</option>
                      <option value="apartment">Apartment</option>
                      <option value="condo">Condo</option>
                      <option value="townhouse">Townhouse</option>
                      <option value="commercial">Commercial</option>
                      <option value="land">Land</option>
                    </select>
                    {errors.propertyType && <p className="mt-1 text-red-500 text-sm">{errors.propertyType}</p>}
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-gray-700 font-semibold mb-2">Description *</label>
                  <textarea name="description" value={formData.description} onChange={handleInputChange}
                    placeholder="Describe the property, its features, and highlights..."
                    rows="4" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {errors.description && <p className="mt-1 text-red-500 text-sm">{errors.description}</p>}
                </div>
              </div>

              {/* Location */}
              <div className="mb-6 bg-green-50 p-5 rounded-lg">
                <h6 className="text-lg font-bold text-gray-700 mb-4">📍 Location Information</h6>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {[
                    { name: "streetAddress", label: "Street Address *", placeholder: "Street Address" },
                    { name: "city", label: "City *", placeholder: "City" },
                    { name: "state", label: "State *", placeholder: "State" },
                    { name: "zipcode", label: "Zip Code *", placeholder: "Zip Code" },
                  ].map(({ name, label, placeholder }) => (
                    <div key={name}>
                      <label className="block text-gray-700 font-semibold mb-2">{label}</label>
                      <input type="text" name={name} value={formData[name]} onChange={handleInputChange}
                        placeholder={placeholder}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      {errors[name] && <p className="mt-1 text-red-500 text-sm">{errors[name]}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Property Details */}
              <div className="mb-6 bg-yellow-50 p-5 rounded-lg">
                <h6 className="text-lg font-bold text-gray-700 mb-4">🏠 Property Details</h6>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Price (₹) *</label>
                    <input type="number" name="price" value={formData.price} onChange={handleInputChange}
                      placeholder="Property Price" min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    {errors.price && <p className="mt-1 text-red-500 text-sm">{errors.price}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Bedrooms *</label>
                    <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleInputChange}
                      placeholder="Bedrooms" min="0" max="50" step="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    {errors.bedrooms && <p className="mt-1 text-red-500 text-sm">{errors.bedrooms}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Bathrooms *</label>
                    <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleInputChange}
                      placeholder="Bathrooms" min="0" max="50" step="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    {errors.bathrooms && <p className="mt-1 text-red-500 text-sm">{errors.bathrooms}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Square Footage *</label>
                    <input type="number" name="squareFootage" value={formData.squareFootage} onChange={handleInputChange}
                      placeholder="Square Feet" min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    {errors.squareFootage && <p className="mt-1 text-red-500 text-sm">{errors.squareFootage}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Lot Size</label>
                    <input type="text" name="lotSize" value={formData.lotSize} onChange={handleInputChange}
                      placeholder="e.g., 0.5 acres"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Year Built</label>
                    <input type="number" name="yearBuilt" value={formData.yearBuilt} onChange={handleInputChange}
                      placeholder="Year" min="1800" max="2026"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Condition *</label>
                    <select name="condition" value={formData.condition} onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select Condition</option>
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="needs-repair">Needs Repair</option>
                    </select>
                    {errors.condition && <p className="mt-1 text-red-500 text-sm">{errors.condition}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Features</label>
                    <input type="text" name="features" value={formData.features} onChange={handleInputChange}
                      placeholder="e.g., Pool, Garage, Garden"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div className="mb-6 bg-purple-50 p-5 rounded-lg">
                <h6 className="text-lg font-bold text-gray-700 mb-4">🖼️ Property Images (Max 10)</h6>
                <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center">
                  <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" id="imageInput" />
                  <label htmlFor="imageInput" className="cursor-pointer">
                    <p className="text-purple-600 font-semibold mb-2">📸 Click to upload images</p>
                    <p className="text-gray-500 text-sm">PNG, JPG, GIF up to 10MB</p>
                  </label>
                </div>
                {errors.images && <p className="mt-2 text-red-500 text-sm font-semibold">{errors.images}</p>}
                {imagePreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img src={preview} alt={`Preview ${index}`} className="w-full h-24 object-cover rounded-lg" />
                        <button type="button" onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Video Upload */}
              <div className="mb-6 bg-red-50 p-5 rounded-lg">
                <h6 className="text-lg font-bold text-gray-700 mb-4">🎥 Property Videos (Max 5)</h6>
                <div className="border-2 border-dashed border-red-300 rounded-lg p-6 text-center">
                  <input type="file" multiple accept="video/*" onChange={handleVideoUpload} className="hidden" id="videoInput" />
                  <label htmlFor="videoInput" className="cursor-pointer">
                    <p className="text-red-600 font-semibold mb-2">🎬 Click to upload videos</p>
                    <p className="text-gray-500 text-sm">MP4, WebM, Ogg up to 100MB</p>
                  </label>
                </div>
                {errors.videos && <p className="mt-2 text-red-500 text-sm font-semibold">{errors.videos}</p>}
                {videoPreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {videoPreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <video src={preview} controls className="w-full h-32 object-cover rounded-lg bg-black" />
                        <button type="button" onClick={() => removeVideo(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex gap-4">
                <button type="submit" disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50">
                  {loading ? "🔄 Adding Property..." : "✅ Add Property"}
                </button>
                <button type="button" onClick={resetForm}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition">
                  🔄 Clear Form
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
