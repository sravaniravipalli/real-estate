import { useState, useEffect, useContext } from "react";
import { AuthContext } from "context/authProvider/AuthProvider";

const BACKEND_URL = "https://real-estate-production-1eda.up.railway.app";
export default function PropertiesCard({ product, setPropertyData }) {
  const { _id, userName, description, propertyImage, valuationCost, location, city } = product;
  const { user } = useContext(AuthContext);

  const defaultImage = "https://placehold.co/400x300/e2e8f0/64748b?text=No+Image";
  const [wishlisted, setWishlisted] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("wishlist") || "[]");
    setWishlisted(saved.some((item) => item.id === _id));
  }, [_id]);

  const toggleWishlist = async (e) => {
    e.stopPropagation();
    const saved = JSON.parse(localStorage.getItem("wishlist") || "[]");
    const userId = user?.uid || user?.email || "guest";

    if (wishlisted) {
      // Remove from localStorage
      const updated = saved.filter((item) => item.id !== _id);
      localStorage.setItem("wishlist", JSON.stringify(updated));
      setWishlisted(false);

      // Remove from backend
      try {
        await fetch(`${BACKEND_URL}/wishlist/${userId}/${_id}`, { method: "DELETE" });
      } catch (err) {
        console.warn("Backend unavailable, removed from localStorage only");
      }
    } else {
      const newItem = {
        id: _id,
        title: userName,
        price: valuationCost,
        location: city || location,
        image: propertyImage || defaultImage,
        description: description,
        type: "house",
        addedDate: new Date().toISOString().split("T")[0],
      };

      // Save to localStorage
      localStorage.setItem("wishlist", JSON.stringify([...saved, newItem]));
      setWishlisted(true);

      // Save to backend
      try {
        await fetch(`${BACKEND_URL}/wishlist/${userId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newItem),
        });
      } catch (err) {
        console.warn("Backend unavailable, saved to localStorage only");
      }
    }
  };

  return (
    <div
      className="card bg-base-100 shadow hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => setPropertyData(product)}
    >
      <figure className="relative overflow-hidden rounded-t-xl bg-gray-200">
        <img
          src={propertyImage || defaultImage}
          onError={(e) => { e.target.onerror = null; e.target.src = defaultImage; }}
          className="w-full h-32 object-cover hover:opacity-80 transition-opacity"
          alt={`House in ${city || location}`}
          loading="lazy"
        />
        <div className="absolute top-2 left-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded">
          {valuationCost}
        </div>
        <button
          onClick={toggleWishlist}
          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full shadow transition"
          style={{ background: wishlisted ? "#ef4444" : "rgba(255,255,255,0.85)" }}
          title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24"
            fill={wishlisted ? "white" : "none"}
            stroke={wishlisted ? "none" : "#ef4444"} strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </figure>

      <div className="p-2">
        <h3 className="text-xs font-bold line-clamp-1 mb-1">{userName}</h3>
        <p className="text-xs text-gray-500 line-clamp-2 mb-1">{description}</p>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-primary flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.079 3.218-4.417 3.218-7.327a7.5 7.5 0 10-15 0c0 2.91 1.274 5.248 3.218 7.327a19.579 19.579 0 002.682 2.282 16.975 16.975 0 001.144.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-gray-500 line-clamp-1">
              {city || location}{city && location ? `, ${location}` : ""}
            </span>
          </div>
          <label
            htmlFor="display-modal"
            className="badge badge-sm badge-primary text-white cursor-pointer"
            onClick={(e) => { e.stopPropagation(); setPropertyData(product); }}
          >
            View
          </label>
        </div>
      </div>
    </div>
  );
}
