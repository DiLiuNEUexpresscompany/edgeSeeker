        {/* News Section */}
        <div className="w-full px-8 md:px-16 lg:px-24 py-16">
          <h2 className="text-4xl text-red-500 font-bold mb-16">LATEST NEWS</h2>
          
          {/* News Content */}
          {displayNews.length > 0 ? (
            <div>
              {/* Featured News Image */}
              <div className="mb-2">
                <img 
                  src={displayNews[0]?.image || "/placeholder-news.jpg"} 
                  alt={displayNews[0]?.title} 
                  className="w-full h-auto object-cover"
                />
              </div>
              
              {/* News Details */}
              <div className="flex mt-2">
                <div className="bg-red-500 text-white text-xs px-3 py-1 inline-block mr-4">
                  {displayNews[0]?.published_at || "2024-03-04T13:00:00Z"}
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">
                    {displayNews[0]?.title || "美国对华政策最新动向"}
                  </h3>
                  <p className="text-gray-700 mb-4">
                    {displayNews[0]?.summary || "美国政府宣布新一轮对华政策措施，涉及贸易、技术等多个领域。本报通过人工分析这些措施对中美关系的潜在影响。"}
                  </p>
                  <a href={`/news/${displayNews[0]?.id || "1"}`} className="text-red-500 uppercase font-medium">
                    READ MORE
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">No news available at the moment. Please check back later.</p>
          )}
          
          {/* News Carousel for Additional Items */}
          {displayNews.length > 1 && (
            <div className="mt-16">
              <NewsCarousel news={displayNews.slice(1)} />
            </div>
          )}
        </div>