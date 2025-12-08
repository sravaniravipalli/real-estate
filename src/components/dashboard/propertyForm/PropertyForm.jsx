import { useState } from "react";
import DisplayBoard from "./DisplayBoard";
import Form from "./Form";
import AddPropertyForm from "./AddPropertyForm";
import AnalyticsDashboard from "../AnalyticsDashboard";
import WishlistDashboard from "../WishlistDashboard";
import PropertyComparison from "../PropertyComparison";

export default function PropertyForm() {
  const [propertyData, setPropertyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [jsxData, setJsxData] = useState(null);
  const [activeTab, setActiveTab] = useState("valuation");

  return (
    <div className="bg-fixed min-h-screen">
      <div className="pt-24 pb-10 container mx-auto px-4 md:px-2 xl:px-0">
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab("valuation")}
            className={`px-4 py-2 whitespace-nowrap font-semibold rounded-lg transition-all ${
              activeTab === "valuation"
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            📊 Valuation Generator
          </button>
          <button
            onClick={() => setActiveTab("add-property")}
            className={`px-4 py-2 whitespace-nowrap font-semibold rounded-lg transition-all ${
              activeTab === "add-property"
                ? "bg-green-600 text-white shadow-lg"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            ➕ Add New Property
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-2 whitespace-nowrap font-semibold rounded-lg transition-all ${
              activeTab === "analytics"
                ? "bg-purple-600 text-white shadow-lg"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            📈 Analytics
          </button>
          <button
            onClick={() => setActiveTab("wishlist")}
            className={`px-4 py-2 whitespace-nowrap font-semibold rounded-lg transition-all ${
              activeTab === "wishlist"
                ? "bg-red-600 text-white shadow-lg"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            ❤️ Wishlist
          </button>
          <button
            onClick={() => setActiveTab("compare")}
            className={`px-4 py-2 whitespace-nowrap font-semibold rounded-lg transition-all ${
              activeTab === "compare"
                ? "bg-indigo-600 text-white shadow-lg"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            🔄 Compare
          </button>
        </div>

        {/* Valuation Tab */}
        {activeTab === "valuation" && (
          <div className="flex flex-col lg:flex-row gap-5">
            <div className="w-full lg:w-1/2">
              <Form
                setPropertyData={setPropertyData}
                setLoading={setLoading}
                setJsxData={setJsxData}
              />
            </div>
            <div className="w-full lg:w-1/2 bg-indigo-50 overflow-y-auto h-auto lg:sticky lg:top-32 px-4 lg:px-0 rounded-lg">
              <DisplayBoard
                loading={loading}
                propertyData={propertyData}
                jsxData={jsxData}
                setJsxData={setJsxData}
              />
            </div>
          </div>
        )}

        {/* Add Property Tab */}
        {activeTab === "add-property" && (
          <div className="max-w-4xl mx-auto">
            <AddPropertyForm />
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <AnalyticsDashboard />
        )}

        {/* Wishlist Tab */}
        {activeTab === "wishlist" && (
          <WishlistDashboard />
        )}

        {/* Compare Tab */}
        {activeTab === "compare" && (
          <PropertyComparison />
        )}
      </div>
    </div>
  );
}