import { useState, useEffect, useContext } from "react";
import { AuthContext } from "context/authProvider/AuthProvider";
import { apiFetch } from "lib/apiClient";

export default function WishlistDashboard() {
  const [wishlist, setWishlist] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [loadingWishlist, setLoadingWishlist] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchWishlist = async () => {
      setLoadingWishlist(true);
      const userId = user?.uid || user?.email || "guest";
      try {
        const res = await apiFetch(`/wishlist/${encodeURIComponent(userId)}`);
        if (res.ok) {
          const data = await res.json();
          setWishlist(data.wishlist || []);
          localStorage.setItem("wishlist", JSON.stringify(data.wishlist || []));
        } else {
          throw new Error("Backend error");
        }
      } catch (err) {
        console.warn("Backend unavailable, loading from localStorage");
        const saved = JSON.parse(localStorage.getItem("wishlist") || "[]");
        setWishlist(saved);
      } finally {
        setLoadingWishlist(false);
      }
    };
    fetchWishlist();
  }, [user]);

  const removeFromWishlist = async (id) => {
    const userId = user?.uid || user?.email || "guest";
    const updated = wishlist.filter((item) => item.id !== id);
    setWishlist(updated);
    localStorage.setItem("wishlist", JSON.stringify(updated));
    try {
      await apiFetch(`/wishlist/${encodeURIComponent(userId)}/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.warn("Backend unavailable, removed from localStorage only");
    }
  };

  const filteredWishlist =
    filterType === "all" ? wishlist : wishlist.filter((item) => item.type === filterType);

  const shareProperty = (property) => {
    const text = `Check out this property: ${property.title} - ${property.price}`;
    if (navigator.share) {
      navigator.share({ title: property.title, text, url: window.location.href });
    } else {
      alert("Share: " + text);
    }
  };

  return (
    <section className="p-8 bg-gradient-to-br from-pink-50 to-red-100 rounded-lg">
      <div className="max-w-6xl mx-auto">

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2 mb-2">
            <span className="text-4xl">❤️</span> My Wishlist
          </h2>
          <p className="text-gray-600">Your saved properties ({wishlist.length})</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {["all", "house", "apartment"].map((type) => {
            const count = type === "all" ? wishlist.length : wishlist.filter((i) => i.type === type).length;
            return (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filterType === type
                    ? "bg-red-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:border-red-600"
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}s ({count})
              </button>
            );
          })}
        </div>

        {loadingWishlist ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-3 text-gray-500">Loading wishlist...</p>
          </div>
        ) : filteredWishlist.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-6xl text-gray-300 mx-auto mb-4">❤️</p>
            <p className="text-gray-500 text-lg">No properties in your wishlist</p>
            <p className="text-gray-400 text-sm mt-2">
              Go to Properties and click the ❤️ on any property to save it here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWishlist.map((property) => (
              <div
                key={property.id}
                className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition transform hover:scale-105"
              >
                <div className="relative h-48 bg-gray-300 overflow-hidden">
                  <img
                    src={property.image}
                    alt={property.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://placehold.co/400x300/e2e8f0/64748b?text=No+Image";
                    }}
                  />
                  <div className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    {property.type.charAt(0).toUpperCase() + property.type.slice(1)}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{property.title}</h3>
                  <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                    📍 {property.location}
                  </p>
                  {property.description && (
                    <p className="text-xs text-gray-400 mb-3 line-clamp-2">{property.description}</p>
                  )}
                  <p className="text-2xl font-bold text-red-600 mb-4">{property.price}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => shareProperty(property)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      🔗 Share
                    </button>
                    <button
                      onClick={() => removeFromWishlist(property.id)}
                      className="flex-1 bg-red-100 hover:bg-red-200 text-red-600 font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      🗑️ Remove
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-3 text-center">Added {property.addedDate}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {wishlist.length > 0 && (
          <div className="mt-8 bg-white rounded-lg p-6 shadow">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Wishlist Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-gray-600 text-sm">Total Properties</p>
                <p className="text-3xl font-bold text-gray-900">{wishlist.length}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-600 text-sm">Houses</p>
                <p className="text-3xl font-bold text-gray-900">
                  {wishlist.filter((i) => i.type === "house").length}
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-600 text-sm">Apartments</p>
                <p className="text-3xl font-bold text-gray-900">
                  {wishlist.filter((i) => i.type === "apartment").length}
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
