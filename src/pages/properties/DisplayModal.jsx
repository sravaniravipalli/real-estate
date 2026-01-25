// JSX Component
export default function DisplayModal({ propertyData }) {
  // Use a working placeholder
  const defaultImage = "https://placehold.co/600x400/e2e8f0/64748b?text=No+Image";
  
  const getImageUrl = () => {
    const propertyImage = propertyData?.propertyImage;
    
    if (!propertyImage || propertyImage.trim() === '') {
      return defaultImage;
    }
    
    // Fix Unsplash URLs
    if (propertyImage.includes('unsplash.com')) {
      const photoIdMatch = propertyImage.match(/photo-([a-zA-Z0-9_-]+)/);
      if (photoIdMatch) {
        const photoId = photoIdMatch[1];
        return `https://source.unsplash.com/${photoId}/600x400`;
      }
    }
    
    return propertyImage;
  };

  return (
    <div>
      {/* Put this part before </body> tag */}
      <input type="checkbox" id="display-modal" className="modal-toggle" />
      <div className="modal">
        <div className="modal-box max-w-2xl">
          <div className="rounded-lg overflow-hidden">
            <img 
              src={getImageUrl()} 
              alt={propertyData?.valuationCost || "Property"}
              className="w-full object-cover bg-gray-200"
              onError={(e) => {
                if (e.target.src !== defaultImage) {
                  e.target.onerror = null;
                  e.target.src = defaultImage;
                }
              }}
            />
          </div>
          <h3 className="mt-5 text-lg font-bold">{propertyData?.valuationCost}</h3>
          <p className="py-4">{propertyData?.description}</p>
          <div className="flex justify-between items-center">
            <h1 className="font-semibold text-primary">
              User Name: <span className="text-gray-800">{propertyData?.userName}</span>
            </h1>
            <label 
              className="bg-black text-white px-6 py-2 cursor-pointer rounded hover:bg-gray-800 transition" 
              htmlFor="display-modal"
            >
              Close
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}