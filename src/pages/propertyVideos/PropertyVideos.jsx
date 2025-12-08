import React from 'react';
import PropertyVideoBrowser from '../../components/propertyVideo/PropertyVideoBrowser';
import useTitle from '../../hook/useTitle';

export default function PropertyVideos() {
  useTitle('Property Videos');

  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto">
        <PropertyVideoBrowser />
      </div>
    </div>
  );
}
