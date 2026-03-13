// JSX Component
export default function DisplayModal({ propertyData }) {
  const defaultImage = "https://placehold.co/600x400/e2e8f0/64748b?text=No+Image";

  const getImageUrl = () => {
    const propertyImage = propertyData?.propertyImage;
    if (!propertyImage || propertyImage.trim() === '') return defaultImage;
    if (propertyImage.includes('unsplash.com')) {
      const photoIdMatch = propertyImage.match(/photo-([a-zA-Z0-9_-]+)/);
      if (photoIdMatch) return `https://source.unsplash.com/${photoIdMatch[1]}/600x400`;
    }
    return propertyImage;
  };

  return (
    <div>
      <input type="checkbox" id="display-modal" className="modal-toggle" />
      <div className="modal">
        <div className="modal-box max-w-md p-4 max-h-[90vh] overflow-y-auto">

          {/* Image - fixed height */}
          <div className="rounded-lg overflow-hidden">
            <img
              src={getImageUrl()}
              alt={propertyData?.valuationCost || "Property"}
              className="w-full h-48 object-cover bg-gray-200"
              onError={(e) => {
                if (e.target.src !== defaultImage) {
                  e.target.onerror = null;
                  e.target.src = defaultImage;
                }
              }}
            />
          </div>

          {/* Price */}
          <h3 className="mt-3 text-base font-bold text-primary">{propertyData?.valuationCost}</h3>

          {/* Location */}
          {(propertyData?.city || propertyData?.location) && (
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-primary" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.079 3.218-4.417 3.218-7.327a7.5 7.5 0 10-15 0c0 2.91 1.274 5.248 3.218 7.327a19.579 19.579 0 002.682 2.282 16.975 16.975 0 001.144.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              <span>{propertyData?.city || propertyData?.location}{propertyData?.city && propertyData?.location ? `, ${propertyData.location}` : ""}</span>
            </div>
          )}

          {/* Description */}
          <p className="mt-2 text-sm text-gray-600">{propertyData?.description}</p>

          {/* Footer */}
          <div className="flex justify-between items-center mt-4">
            <h1 className="text-sm font-semibold text-primary">
              Owner: <span className="text-gray-800">{propertyData?.userName}</span>
            </h1>
            <label
              className="bg-black text-white text-sm px-5 py-2 cursor-pointer rounded hover:bg-gray-800 transition"
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