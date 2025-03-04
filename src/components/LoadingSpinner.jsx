import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="flex justify-center p-12">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
    </div>
  );
};

export default LoadingSpinner;