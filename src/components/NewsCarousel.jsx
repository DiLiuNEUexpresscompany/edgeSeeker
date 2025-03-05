import React, { useState, useEffect } from 'react';

const NewsCarousel = ({ news }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Auto-scroll feature
  useEffect(() => {
    if (news.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % news.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [news.length]);

  // Handle navigation
  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    const newIndex = currentIndex === 0 ? news.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const newIndex = (currentIndex + 1) % news.length;
    setCurrentIndex(newIndex);
  };

  // Touch navigation
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      goToNext();
    }
    
    if (touchStart - touchEnd < -75) {
      goToPrevious();
    }
  };

  // If no news, return null
  if (!news || news.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden" 
         onTouchStart={handleTouchStart}
         onTouchMove={handleTouchMove}
         onTouchEnd={handleTouchEnd}>
      {/* Slide Container */}
      <div 
        className="flex transition-transform duration-500 ease-in-out" 
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {news.map((item, index) => (
          <div key={index} className="min-w-full">
            <div className="flex flex-col md:flex-row gap-6">
              {/* News Image */}
              <div className="md:w-1/2">
                <img 
                  src={item.image || "/placeholder-news.jpg"} 
                  alt={item.title} 
                  className="w-full object-cover"
                />
              </div>
              
              {/* News Content */}
              <div className="md:w-1/2">
                <div className="bg-red-500 text-white text-xs px-2 py-1 inline-block mb-4">
                  {item.published_at}
                </div>
                <h3 className="text-2xl font-bold mb-3 text-black">{item.title}</h3>
                <p className="text-gray-700 mb-6">{item.summary}</p>
                <a href={`/news/${item.id}`} className="text-red-500 uppercase font-medium">
                  READ MORE
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {news.length > 1 && (
        <>
          <button 
            onClick={goToPrevious} 
            className="absolute left-0 top-1/2 transform -translate-y-1/2 text-red-500 h-12 w-12 flex items-center justify-center z-10"
            aria-label="Previous slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
          </button>
          <button 
            onClick={goToNext} 
            className="absolute right-0 top-1/2 transform -translate-y-1/2 text-red-500 h-12 w-12 flex items-center justify-center z-10"
            aria-label="Next slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
            </svg>
          </button>
        </>
      )}

      {/* Pagination Dots */}
      {news.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center items-center pb-4">
          <div className="flex space-x-2 items-center">
            {news.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-red-500 w-4' : 'bg-gray-300'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsCarousel;