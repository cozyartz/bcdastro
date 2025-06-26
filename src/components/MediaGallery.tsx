import React, { useState, useEffect } from 'react';
import MediaCard from './MediaCard';
import { cloudflareService } from '../lib/cloudflare';
import { AuthService } from '../lib/supabase';
import type { CloudflareMedia } from '../lib/cloudflare';

interface MediaGalleryProps {
  initialItems: CloudflareMedia[];
  categories: string[];
}

export default function MediaGallery({ initialItems, categories }: MediaGalleryProps) {
  const [items, setItems] = useState<CloudflareMedia[]>(initialItems);
  const [filteredItems, setFilteredItems] = useState<CloudflareMedia[]>(initialItems);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [displayedItems, setDisplayedItems] = useState(6);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Category stats
  const categoryStats = categories.map(category => ({
    name: category,
    count: items.filter(item => item.category === category).length
  }));

  useEffect(() => {
    const checkUser = async () => {
      const user = await AuthService.getCurrentUser();
      setCurrentUser(user);
    };
    checkUser();
  }, []);

  useEffect(() => {
    filterAndSearch();
  }, [currentFilter, searchQuery, items]);

  const filterAndSearch = () => {
    let filtered = items;

    // Apply category filter
    if (currentFilter !== 'all') {
      filtered = filtered.filter(item => 
        item.category.toLowerCase() === currentFilter.toLowerCase()
      );
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query)) ||
        item.category.toLowerCase().includes(query)
      );
    }

    setFilteredItems(filtered);
    setDisplayedItems(6); // Reset displayed items when filtering
  };

  const handleFilterChange = (category: string) => {
    setCurrentFilter(category);
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`)?.classList.add('active');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const loadMoreItems = () => {
    setDisplayedItems(prev => prev + 6);
  };

  const handleCategoryCardClick = (category: string) => {
    handleFilterChange(category.toLowerCase());
    // Scroll to gallery
    document.querySelector('.media-grid')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  const itemsToShow = filteredItems.slice(0, displayedItems);
  const hasMoreItems = displayedItems < filteredItems.length;

  return (
    <div className="media-gallery-container">
      {/* Filter and Search Section */}
      <section className="filter-section glass">
        <div className="filter-header">
          <h2>Browse Our Collection</h2>
          <p>Filter by category or search for specific content</p>
        </div>
        
        <div className="filter-controls">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="Search media by title, description, or tags..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          
          <div className="category-filters">
            <button 
              className={`filter-btn ${currentFilter === 'all' ? 'active' : ''}`}
              onClick={() => handleFilterChange('all')}
              data-category="all"
            >
              <i className="fas fa-th"></i>
              All ({items.length})
            </button>
            {categoryStats.map(category => (
              <button 
                key={category.name}
                className={`filter-btn ${currentFilter === category.name.toLowerCase() ? 'active' : ''}`}
                onClick={() => handleFilterChange(category.name.toLowerCase())}
                data-category={category.name.toLowerCase()}
              >
                <i className="fas fa-folder"></i>
                {category.name} ({category.count})
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Media Grid */}
      <section className="content-section">
        <div className="section-header">
          <h2 className="section-title">
            {currentFilter === 'all' ? 'Featured Content' : `${currentFilter.charAt(0).toUpperCase() + currentFilter.slice(1)} Content`}
          </h2>
          <p className="section-subtitle">
            {searchQuery 
              ? `${filteredItems.length} results for "${searchQuery}"` 
              : `Our most popular and highest-quality aerial media`
            }
          </p>
        </div>
        
        {itemsToShow.length === 0 ? (
          <div className="no-results">
            <i className="fas fa-search"></i>
            <h3>No results found</h3>
            <p>Try adjusting your search terms or filters</p>
            <button 
              className="clear-filters-btn"
              onClick={() => {
                setSearchQuery('');
                setCurrentFilter('all');
              }}
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <div className="media-grid">
              {itemsToShow.map(media => (
                <MediaCard 
                  key={media.id} 
                  media={media} 
                  userEmail={currentUser?.email}
                />
              ))}
            </div>
            
            {hasMoreItems && (
              <div className="load-more-section">
                <button 
                  className="professional-button" 
                  onClick={loadMoreItems}
                  disabled={isLoading}
                >
                  <i className="fas fa-plus"></i>
                  {isLoading ? 'Loading...' : 'Load More Content'}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Categories Overview */}
      <section className="content-section glass">
        <div className="section-header">
          <h2 className="section-title">Content Categories</h2>
          <p className="section-subtitle">Explore our organized collection by category</p>
        </div>
        
        <div className="categories-grid">
          {categoryStats.map(category => (
            <div 
              key={category.name}
              className="category-card" 
              onClick={() => handleCategoryCardClick(category.name)}
            >
              <div className="category-icon">
                {category.name === 'Urban' && <i className="fas fa-city"></i>}
                {category.name === 'Agricultural' && <i className="fas fa-seedling"></i>}
                {category.name === 'Nature' && <i className="fas fa-tree"></i>}
                {category.name === 'Industrial' && <i className="fas fa-industry"></i>}
                {category.name === 'Real Estate' && <i className="fas fa-home"></i>}
                {category.name === 'Construction' && <i className="fas fa-hard-hat"></i>}
              </div>
              <h3>{category.name}</h3>
              <p>Professional {category.name.toLowerCase()} aerial content</p>
              <div className="category-stats">
                <span className="item-count">{category.count} items</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}