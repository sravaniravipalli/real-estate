import { useState, useEffect } from "react";

export default function WishlistDashboard() {
  const [wishlist, setWishlist] = useState([]);
  const [filterType, setFilterType] = useState("all");

  // Mock wishlist data
  useEffect(() => {
    const mockWishlist = [
      {
        id: 1,
        title: "Modern Downtown Apartment",
        price: "₹5,25,00,000",
        bedrooms: 3,
        bathrooms: 2,
        area: "2,400 sqft",
        location: "Downtown",
        image: "https://via.placeholder.com/300x200?text=Downtown+Apt",
        type: "apartment",
        addedDate: "2025-12-01"
      },
      {
        id: 2,
        title: "Waterfront Villa",
        price: "₹10,00,00,000",
        bedrooms: 5,
        bathrooms: 4,
        area: "5,600 sqft",
        location: "Waterfront",
        image: "https://via.placeholder.com/300x200?text=Waterfront+Villa",
        type: "house",
        addedDate: "2025-11-28"
      },
      {
        id: 3,
        title: "Cozy Suburban Home",
        price: "₹3,15,00,000",
        bedrooms: 2,
        bathrooms: 1,
        area: "1,200 sqft",
        location: "Suburbs",
        image: "https://via.placeholder.com/300x200?text=Suburban+Home",
        type: "house",
        addedDate: "2025-11-25"
      }
    ];
    setWishlist(mockWishlist);
  }, []);

  const removeFromWishlist = (id) => {
    setWishlist(wishlist.filter(item => item.id !== id));
  };

  const filteredWishlist = filterType === "all" 
    ? wishlist 
    : wishlist.filter(item => item.type === filterType);

  const shareProperty = (property) => {
    const text = `Check out this property: ${property.title} - ${property.price}`;
    if (navigator.share) {
      navigator.share({
        title: property.title,
        text: text,
        url: window.location.href
      });
    } else {
      alert("Share: " + text);
    }
  };

  return (
    <section className="p-8 bg-gradient-to-br from-pink-50 to-red-100 rounded-lg">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2 mb-2">
            <HeartIcon className="w-8 h-8 text-red-600 fill-red-600" />
            My Wishlist
          </h2>
          <p className="text-gray-600">Your saved properties ({wishlist.length})</p>
        </div>

        {/* Filter Buttons */}
        <div className="mb-6 flex flex-wrap gap-2">
          {["all", "house", "apartment"].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filterType === type
                  ? "bg-red-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-red-600"
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}s ({filterType === type ? filteredWishlist.length : 0})
            </button>
          ))}
        </div>

        {/* Wishlist Items */}
        {filteredWishlist.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-6xl text-gray-300 mx-auto mb-4">❤️</p>
            <p className="text-gray-500 text-lg">No properties in your wishlist</p>
            <p className="text-gray-400 text-sm mt-2">Start adding properties to keep track of your favorites</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWishlist.map(property => (
              <div key={property.id} className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition transform hover:scale-105">
                {/* Image */}
                <div className="relative h-48 bg-gray-300 overflow-hidden">
                  <img
                    src={property.image}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    {property.type.charAt(0).toUpperCase() + property.type.slice(1)}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{property.title}</h3>
                  <p className="text-sm text-gray-500 mb-3 flex items-center gap-1">
                    📍 {property.location}
                  </p>

                  {/* Price */}
                  <p className="text-2xl font-bold text-red-600 mb-4">{property.price}</p>

                  {/* Details Grid */}
                  <div className="grid grid-cols-3 gap-2 mb-4 pb-4 border-b">
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Bedrooms</p>
                      <p className="text-lg font-bold text-gray-900">{property.bedrooms}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Bathrooms</p>
                      <p className="text-lg font-bold text-gray-900">{property.bathrooms}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Size</p>
                      <p className="text-sm font-bold text-gray-900">{property.area}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => shareProperty(property)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      📤 Share
                    </button>
                    <button
                      onClick={() => removeFromWishlist(property.id)}
                      className="flex-1 bg-red-100 hover:bg-red-200 text-red-600 font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      🗑️ Remove
                    </button>
                  </div>

                  {/* Added Date */}
                  <p className="text-xs text-gray-400 mt-3 text-center">Added {property.addedDate}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {wishlist.length > 0 && (
          <div className="mt-8 bg-white rounded-lg p-6 shadow">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Wishlist Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-gray-600 text-sm">Total Properties</p>
                <p className="text-3xl font-bold text-gray-900">{wishlist.length}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-600 text-sm">Avg Price</p>
                <p className="text-2xl font-bold text-red-600">$743K</p>
              </div>
              <div className="text-center">
                <p className="text-gray-600 text-sm">Avg Bedrooms</p>
                <p className="text-3xl font-bold text-gray-900">3.3</p>
              </div>
              <div className="text-center">
                <p className="text-gray-600 text-sm">Avg Size</p>
                <p className="text-2xl font-bold text-gray-900">3,067 sqft</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
