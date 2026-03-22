import { generatePropertyInfo } from "api/ai";
import { useState } from "react";
import { apiFetch } from "lib/apiClient";

export default function Form({ setPropertyData, setLoading, setJsxData }) {
  const [formData, setFormData] = useState({
    streetAddress: "",
    city: "",
    state: "",
    zipcode: "",
    numberOfBedrooms: "",
    numberOfBathrooms: "",
    squareFootage: "",
    condition: "",
    renovation: "",
    firstAddress: "",
    secondAddress: "",
    features: "",
    zoning: "",
    landUse: "",
    purpose: ""
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.streetAddress) newErrors.streetAddress = "Street Address is required";
    if (!formData.city) newErrors.city = "City is required";
    if (!formData.state) newErrors.state = "State is required";
    if (!formData.zipcode) newErrors.zipcode = "Zip Code is required";
    if (!formData.numberOfBedrooms) newErrors.numberOfBedrooms = "Number of Bedrooms is required";
    if (!formData.numberOfBathrooms) newErrors.numberOfBathrooms = "Number of Bathrooms is required";
    if (!formData.squareFootage) newErrors.squareFootage = "Square Footage is required";
    if (!formData.condition) newErrors.condition = "Condition is required";
    if (!formData.renovation) newErrors.renovation = "Renovation is required";
    if (!formData.firstAddress) newErrors.firstAddress = "First Address is required";
    if (!formData.secondAddress) newErrors.secondAddress = "Secondary Address is required";
    if (!formData.features) newErrors.features = "Features is required";
    if (!formData.zoning) newErrors.zoning = "Zoning is required";
    if (!formData.landUse) newErrors.landUse = "Permitted Land Use is required";
    if (!formData.purpose) newErrors.purpose = "purpose is required";
    return newErrors;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setJsxData(null);
    setLoading(true);
    
    try {
      // Option 1: Try backend ML prediction first
      const mlPrediction = await apiFetch('/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bedrooms: parseInt(formData.numberOfBedrooms),
          bathrooms: parseInt(formData.numberOfBathrooms),
          livingArea: parseInt(formData.squareFootage),
          condition: parseInt(formData.condition),
          schoolsNearby: 2 // default
        })
      });
      
      if (mlPrediction.ok) {
        const mlData = await mlPrediction.json();
        
        // Then get AI-generated description
        const arr = Object.entries(formData);
        const joinedArr = arr.map((pair) => pair.join(":"));
        const finalPromptData = joinedArr.join("\n");
        const prompt = { prompt: finalPromptData, size: "medium" };
        
        const aiData = await generatePropertyInfo(prompt);
        
        // Combine ML price with AI description
        setPropertyData({
          ...aiData,
          valuationCost: `$${mlData.predicted_price.toLocaleString()}`
        });
      } else {
        throw new Error('ML prediction failed');
      }
    } catch (error) {
      // Fallback: Use formula-based calculation
      console.warn('Using fallback valuation calculation');
      
      const basePrice = 100000;
      const bedroomValue = parseInt(formData.numberOfBedrooms) * 50000;
      const bathroomValue = parseInt(formData.numberOfBathrooms) * 30000;
      const areaValue = parseInt(formData.squareFootage) * 150;
      const conditionMultiplier = parseInt(formData.condition) * 0.1 + 0.8;
      
      const estimatedPrice = Math.round(
        (basePrice + bedroomValue + bathroomValue + areaValue) * conditionMultiplier
      );
      
      // Generate mock property data
      const mockData = {
        createdText: `Beautiful ${formData.numberOfBedrooms} bedroom, ${formData.numberOfBathrooms} bathroom property located at ${formData.streetAddress}, ${formData.city}, ${formData.state}. This ${formData.squareFootage} sq ft home features ${formData.features}. Property condition: ${formData.condition}/5. Located in a ${formData.zoning} zone with ${formData.landUse} land use.`,
        imageUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
        valuationCost: `$${estimatedPrice.toLocaleString()}`
      };
      
      setPropertyData(mockData);
    } finally {
      setLoading(false);
    }
  };

  const formInputStyles = "border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full transition-all duration-150";
  const formLabelStyle = "py-2.5 px-3 text-gray-500 bg-indigo-50/50 rounded-l-lg";
  const propertyDetailsInputStyle = "flex items-center relative w-full mb-3 shadow rounded";
  const formInputStyle = "block w-full rounded-l-none placeholder-gray-400/70 rounded-lg border-0 bg-white px-5 py-2.5 text-gray-700 focus:outline-none focus:ring focus:ring-[#7C6EE4]";

  return (
    <section className="-mt-2">
      <div className="w-full px-0 mx-auto">
        <div className="relative flex flex-col min-w-0 break-words w-full mb-6 rounded-lg bg-blueGray-100 border-0">
          <div className="rounded-t bg-white pb-5">
            <div className="text-center">
              <h6 className="text-2xl lg:text-3xl font-semibold">
                Property Valuation Generator
              </h6>
            </div>
          </div>
          <div className="flex-auto">
            <form onSubmit={onSubmit}>
              {/* Location Information */}
              <div className="shadow-sm bg-indigo-50 p-5 mb-6">
                <h6 className="text-blueGray-400 text-sm font-bold uppercase pl-5 pb-3">
                  Location Information
                </h6>
                <div className="flex flex-wrap">
                  <div className="w-full lg:w-6/12 px-4">
                    <input
                      type="text"
                      className={formInputStyles}
                      name="streetAddress"
                      placeholder="Street Address"
                      value={formData.streetAddress}
                      onChange={handleChange}
                    />
                    {errors.streetAddress && (
                      <p className="mt-1 text-red-500 text-sm font-semibold">
                        {errors.streetAddress}
                      </p>
                    )}
                  </div>
                  <div className="w-full lg:w-6/12 px-4">
                    <input
                      type="text"
                      className={formInputStyles}
                      placeholder="City"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                    />
                    {errors.city && (
                      <p className="mt-1 text-red-500 text-sm font-semibold">
                        {errors.city}
                      </p>
                    )}
                  </div>
                  <div className="w-full lg:w-6/12 px-4">
                    <input
                      type="text"
                      className={formInputStyles}
                      placeholder="State"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                    />
                    {errors.state && (
                      <p className="mt-1 text-red-500 text-sm font-semibold">
                        {errors.state}
                      </p>
                    )}
                  </div>
                  <div className="w-full lg:w-6/12 px-4">
                    <input
                      type="number"
                      className={formInputStyles}
                      placeholder="Zip Code"
                      name="zipcode"
                      value={formData.zipcode}
                      onChange={handleChange}
                    />
                    {errors.zipcode && (
                      <p className="mt-1 text-red-500 text-sm font-semibold">
                        {errors.zipcode}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Property Details */}
              <div className="shadow-sm bg-indigo-50 p-5 mb-6">
                <h6 className="text-blueGray-400 text-sm font-bold uppercase pl-5 pb-3">
                  Property Details
                </h6>
                <div className="flex flex-wrap">
                  <div className="w-full lg:w-6/12 px-4">
                    <div className={propertyDetailsInputStyle}>
                      <p className={formLabelStyle}>Bedrooms</p>
                      <input
                        type="number"
                        min={0}
                        placeholder="Number of Bedrooms"
                        className={formInputStyle}
                        name="numberOfBedrooms"
                        value={formData.numberOfBedrooms}
                        onChange={handleChange}
                      />
                    </div>
                    {errors.numberOfBedrooms && (
                      <p className="mt-1 text-red-500 text-sm font-semibold">
                        {errors.numberOfBedrooms}
                      </p>
                    )}
                  </div>
                  <div className="w-full lg:w-6/12 px-4">
                    <div className={propertyDetailsInputStyle}>
                      <p className={formLabelStyle}>Bathrooms</p>
                      <input
                        type="number"
                        min={0}
                        placeholder="Number of Bathrooms"
                        className={formInputStyle}
                        name="numberOfBathrooms"
                        value={formData.numberOfBathrooms}
                        onChange={handleChange}
                      />
                    </div>
                    {errors.numberOfBathrooms && (
                      <p className="mt-1 text-red-500 text-sm font-semibold">
                        {errors.numberOfBathrooms}
                      </p>
                    )}
                  </div>
                </div>
                <div className="w-full px-4">
                  <div className={propertyDetailsInputStyle}>
                    <p className={`w-4/12 ${formLabelStyle}`}>Square Footage</p>
                    <input
                      type="number"
                      min={0}
                      placeholder="Total Square Footage"
                      className={formInputStyle}
                      name="squareFootage"
                      value={formData.squareFootage}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.squareFootage && (
                    <p className="mt-1 text-red-500 text-sm font-semibold">
                      {errors.squareFootage}
                    </p>
                  )}
                </div>
              </div>

              {/* Property Condition */}
              <div className="shadow-sm bg-indigo-50 p-5 mb-6">
                <h6 className="text-blueGray-400 text-sm pl-5 pb-3 font-bold uppercase">
                  Property Condition
                </h6>
                <div className="flex flex-wrap">
                  <div className="w-full lg:w-1/2 px-5">
                    <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                      Condition
                    </label>
                    <select
                      name="condition"
                      className={formInputStyles}
                      value={formData.condition}
                      onChange={handleChange}
                    >
                      <option value="">Select</option>
                      <option value="Excellent">Excellent</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Poor">Poor</option>
                    </select>
                    {errors.condition && (
                      <p className="mt-1 text-red-500 text-sm font-semibold">
                        {errors.condition}
                      </p>
                    )}
                  </div>
                  <div className="w-full lg:w-1/2 px-4">
                    <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                      Recent Renovations
                    </label>
                    <select
                      name="renovation"
                      className={formInputStyles}
                      value={formData.renovation}
                      onChange={handleChange}
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                    {errors.renovation && (
                      <p className="mt-1 text-red-500 text-sm font-semibold">
                        {errors.renovation}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Comparable Sales */}
              <div className="shadow-sm bg-indigo-50 p-5 mb-6">
                <h6 className="text-blueGray-400 text-sm pl-5 pb-3 font-bold uppercase">
                  Comparable Sales
                </h6>
                <div className="flex flex-wrap">
                  <div className="w-full lg:w-1/2 px-5">
                    <input
                      type="text"
                      placeholder="First Address"
                      className={formInputStyles}
                      name="firstAddress"
                      value={formData.firstAddress}
                      onChange={handleChange}
                    />
                    {errors.firstAddress && (
                      <p className="mt-1 text-red-500 text-sm font-semibold">
                        {errors.firstAddress}
                      </p>
                    )}
                  </div>
                  <div className="w-full lg:w-1/2 px-4">
                    <input
                      type="text"
                      placeholder="Second Address"
                      className={formInputStyles}
                      name="secondAddress"
                      value={formData.secondAddress}
                      onChange={handleChange}
                    />
                    {errors.secondAddress && (
                      <p className="mt-1 text-red-500 text-sm font-semibold">
                        {errors.secondAddress}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Property Features */}
              <div className="shadow-sm bg-indigo-50 p-5 mb-6">
                <h6 className="text-blueGray-400 text-sm pl-5 pb-3 font-bold uppercase">
                  Property Features
                </h6>
                <div className="flex flex-wrap">
                  <div className="w-full px-4">
                    <textarea
                      placeholder="Give your property special Features or upgrades .."
                      className={formInputStyles}
                      name="features"
                      rows="4"
                      value={formData.features}
                      onChange={handleChange}
                    ></textarea>
                    {errors.features && (
                      <p className="text-red-500 text-sm font-semibold">
                        {errors.features}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Zoning and Land Use */}
              <div className="shadow-sm bg-indigo-50 p-5 mb-6">
                <h6 className="text-blueGray-400 text-sm pl-5 pb-3 font-bold uppercase">
                  Zoning and Land Use
                </h6>
                <div className="flex flex-wrap">
                  <div className="w-full lg:w-1/2 px-5">
                    <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                      Zoning
                    </label>
                    <select
                      name="zoning"
                      className={formInputStyles}
                      value={formData.zoning}
                      onChange={handleChange}
                    >
                      <option value="">Select</option>
                      <option value="Residential">Residential</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Mixed-Use">Mixed-Use</option>
                    </select>
                    {errors.zoning && (
                      <p className="mt-1 text-red-500 text-sm font-semibold">
                        {errors.zoning}
                      </p>
                    )}
                  </div>
                  <div className="w-full lg:w-1/2 px-4">
                    <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                      Permitted Land Use
                    </label>
                    <input
                      type="text"
                      placeholder="Indicate the permitted land"
                      className={formInputStyles}
                      name="landUse"
                      value={formData.landUse}
                      onChange={handleChange}
                    />
                    {errors.landUse && (
                      <p className="mt-1 text-red-500 text-sm font-semibold">
                        {errors.landUse}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Purpose */}
              <div className="shadow-sm bg-indigo-50 p-5 mb-6">
                <h6 className="text-blueGray-400 text-sm pl-5 pb-3 font-bold uppercase">
                  Purpose
                </h6>
                <div className="flex flex-wrap">
                  <div className="w-full px-5">
                    <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                      Select the purpose of the property valuation
                    </label>
                    <select
                      name="purpose"
                      className={formInputStyles}
                      value={formData.purpose}
                      onChange={handleChange}
                    >
                      <option value="">Select</option>
                      <option value="Selling">Selling</option>
                      <option value="Refinancing">Refinancing</option>
                      <option value="Insurance">Insurance</option>
                    </select>
                    {errors.purpose && (
                      <p className="mt-1 text-red-500 text-sm font-semibold">
                        {errors.purpose}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pb-6">
                <button
                  type="submit"
                  className="w-full lg:w-1/2 text-white px-20 py-3 uppercase bg-indigo-500 hover:bg-indigo-400 shadow hover:shadow-lg font-medium transition transform hover:-translate-y-0.5 rounded"
                >
                  Generate Property
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
