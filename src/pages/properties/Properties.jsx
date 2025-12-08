import { useEffect, useState } from 'react';
import PropertiesCard from './propertiesCard';
import { fetchProducts } from 'api/ai';
import Loading from 'ui/loading/Loading';
import useTitle from 'hook/useTitle';
import DisplayModal from './DisplayModal';
import Pagination from './Pagination';
import PropertyFilter from 'components/filters/PropertyFilter';

export default function Properties() {
  const [productData, setProductData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [propertyData, setPropertyData] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const productsPerPage = 12;

  useTitle('Properties');

  useEffect(() => {
    setIsLoading(true);
    fetchProducts()
      .then((data) => {
        setProductData(data.data);
        setFilteredData(data.data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.log(error);
        setIsLoading(false);
      });
  }, []);

  const handleFilterChange = (filtered) => {
    setFilteredData(filtered);
    setCurrentPage(0);
  };

  if (isLoading) {
    return <Loading />;
  }

  const pageCount = Math.ceil(filteredData.length / productsPerPage);

  const handlePageChange = (selectedPage) => {
    setCurrentPage(selectedPage);
  };

  const startIndex = currentPage * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const displayedProducts = filteredData.slice(startIndex, endIndex);

  return (
    <div className="bg-gray-100">
      <div className="container mx-auto pt-20 md:pt-24 lg:pt-28 pb-10 lg:pb-20 px-5 md:px-2">
        <PropertyFilter onFilterChange={handleFilterChange} />
        
        {filteredData.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600 font-semibold">
              No properties found matching your criteria.
            </p>
            <p className="text-gray-500 mt-2">
              Try adjusting your filters and search again.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
              {displayedProducts.map((product) => (
                <PropertiesCard
                  key={product._id}
                  product={product}
                  setPropertyData={setPropertyData}
                />
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              pageCount={pageCount}
              onPageChange={handlePageChange}
            />
          </>
        )}
        {propertyData && <DisplayModal propertyData={propertyData} />}
      </div>
    </div>
  );
}