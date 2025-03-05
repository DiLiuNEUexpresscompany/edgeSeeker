import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center min-h-[50vh] bg-[#e9e4dd]">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-red-200 border-t-transparent animate-spin"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-4 border-red-500 border-b-transparent animate-spin-slow"></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;