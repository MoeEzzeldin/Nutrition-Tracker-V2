import React, { useState } from 'react';
import axios from 'axios';

const SearchBar = ({ onSelectFood, placeholder }) => {
  const [query, setQuery] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [mealType, setMealType] = useState('breakfast');
  const [units, setUnits] = useState('grams');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1);

  const searchFood = async () => {
    if (!query.trim()) {
      setMessage('Please enter a food item to search');
      return;
    }

    if (!quantity || parseFloat(quantity) <= 0) {
      setMessage('Please enter a valid quantity');
      return;
    }

    setLoading(true);
    setMessage('');
    setSearchResults([]);
    setShowResults(false);
    setSelectedResultIndex(-1);

    try {
      // Include quantity and units in the search query
      const searchQuery = `${quantity} ${units} ${query}`;
      
      // Add timeout to API requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await axios.get(
        `https://api.api-ninjas.com/v1/nutrition?query=${searchQuery}`,
        {
          headers: {
            'X-Api-Key': process.env.REACT_APP_API_NINJA_KEY || ''
          },
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);

      if (response.data && response.data.length > 0) {
        const formattedResults = response.data.map(item => ({
          id: `${item.name}-${Math.random().toString(36).substring(2, 11)}`, // Changed from substr to substring
          name: `${quantity} ${units} ${item.name}`,
          calories: parseFloat(item.calories) || 0,
          protein: parseFloat(item.protein_g) || 0,
          carbs: parseFloat(item.carbohydrates_total_g) || 0,
          fat: parseFloat(item.fat_total_g) || 0,
          sodium: parseFloat(item.sodium_mg) || 0,
          potassium: parseFloat(item.potassium_mg) || 0,
          mealType: mealType,
          units: `${quantity} ${units}`,
          quantity: parseFloat(quantity)
        }));

        // If multiple items returned, combine them
        if (formattedResults.length > 1) {
          const combined = {
            id: 'combined-total',
            name: `${quantity} ${units} ${formattedResults.map(r => r.name.replace(`${quantity} ${units} `, '')).join(' + ')}`,
            calories: formattedResults.reduce((sum, r) => sum + r.calories, 0),
            protein: formattedResults.reduce((sum, r) => sum + r.protein, 0),
            carbs: formattedResults.reduce((sum, r) => sum + r.carbs, 0),
            fat: formattedResults.reduce((sum, r) => sum + r.fat, 0),
            sodium: formattedResults.reduce((sum, r) => sum + r.sodium, 0),
            potassium: formattedResults.reduce((sum, r) => sum + r.potassium, 0),
            mealType: mealType,
            units: `${quantity} ${units}`,
            quantity: parseFloat(quantity)
          };
          setSearchResults([combined, ...formattedResults]);
        } else {
          setSearchResults(formattedResults);
        }
        setShowResults(true);
      } else {
        setMessage('No results found. Try different terms or check spelling.');
        setSearchResults([]);
      }

    } catch (error) {
      // Error handling - existing error handling is already robust
      if (error.name === 'AbortError') {
        setMessage('Search timed out. Please try again or check your connection.');
      } else if (error.response) {
        // Server responded with non-2xx status
        if (error.response.status === 429) {
          setMessage('API rate limit reached. Please try again later.');
        } else {
          setMessage(`Error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
        }
      } else if (error.request) {
        // Request was made but no response received
        setMessage('No response from server. Please check your connection.');
      } else {
        setMessage('Error searching for food. Please try again.');
      }
      
      setSearchResults([]);
    }
    
    setLoading(false);
  };

  const handleSelectFood = (food) => {
    onSelectFood({...food, mealType, units: `${quantity} ${units}`});
    setQuery('');
    setQuantity('100');
    setSearchResults([]);
    setShowResults(false);
    setMessage('');
  };

  // Replace deprecated onKeyPress with onKeyDown
  const handleKeyDown = (e) => {
    // Handle Enter key for search
    if (e.key === 'Enter') {
      searchFood();
    }

    // Add keyboard navigation for search results
    if (showResults && searchResults.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedResultIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedResultIndex(prev => prev > 0 ? prev - 1 : 0);
      } else if (e.key === 'Enter' && selectedResultIndex >= 0) {
        e.preventDefault();
        handleSelectFood(searchResults[selectedResultIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowResults(false);
      }
    }
  };

  return (
    <div className="position-relative">
      <div className="search-form">
        <div className="row g-2">
          {/* Meal Type Dropdown */}
          <div className="col-6 col-sm-auto">
            <select 
              className="form-select flex-shrink-0" 
              value={mealType} 
              onChange={(e) => setMealType(e.target.value)}
              aria-label="Select meal type"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snacks">Snacks</option>
            </select>
          </div>
          
          {/* Quantity Input */}
          <div className="col-3 col-sm-auto">
            <input
              type="number"
              className="form-control flex-shrink-0"
              placeholder="Qty"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              onKeyDown={handleKeyDown}
              min="0.1"
              step="0.1"
              aria-label="Quantity"
            />
          </div>
          
          {/* Units Dropdown */}
          <div className="col-3 col-sm-auto">
            <select 
              className="form-select flex-shrink-0"
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              aria-label="Select units"
            >
              <optgroup label="Weight">
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="oz">oz</option>
                <option value="lb">lb</option>
              </optgroup>
              <optgroup label="Volume">
                <option value="ml">ml</option>
                <option value="L">L</option>
                <option value="cup">cup</option>
                <option value="tbsp">tbsp</option>
                <option value="tsp">tsp</option>
                <option value="fl oz">fl oz</option>
              </optgroup>
              <optgroup label="Other">
                <option value="piece">piece</option>
                <option value="serving">serving</option>
              </optgroup>
            </select>
          </div>
          
          {/* Search Input and Button */}
          <div className="col-12">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder={placeholder || "Search food..."}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                aria-label="Search food"
                aria-describedby="search-button"
                aria-autocomplete="list"
                aria-controls={showResults ? "search-results-list" : undefined}
                aria-activedescendant={selectedResultIndex >= 0 ? `search-result-${selectedResultIndex}` : undefined}
              />
              <button 
                className="btn btn-primary" 
                type="button"
                onClick={searchFood}
                disabled={loading}
                id="search-button"
                aria-label={loading ? "Searching..." : "Search"}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                ) : (
                  'Search'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {message && (
        <div className={`alert ${searchResults.length > 0 ? 'alert-warning' : 'alert-info'} mt-2 mb-0 py-2`} role="alert">
          <small>{message}</small>
        </div>
      )}
      
      {showResults && searchResults.length > 0 && (
        <div 
          className="mt-2 border border-secondary rounded p-2" 
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
          role="listbox"
          id="search-results-list"
          aria-label="Search results"
        >
          <h6 className="mb-2">Search Results:</h6>
          {searchResults.map((food, index) => (
            <div
              key={food.id}
              id={`search-result-${index}`}
              className={`d-flex justify-content-between align-items-center p-2 mb-1 rounded ${selectedResultIndex === index ? 'border border-primary' : ''}`}
              style={{ 
                backgroundColor: 'var(--bg-secondary)', 
                cursor: 'pointer',
                border: '1px solid transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-purple)';
                setSelectedResultIndex(index);
              }}
              onMouseLeave={(e) => {
                if (selectedResultIndex !== index) {
                  e.currentTarget.style.borderColor = 'transparent';
                }
              }}
              onClick={() => handleSelectFood(food)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelectFood(food);
                }
              }}
              role="option"
              aria-selected={selectedResultIndex === index}
              tabIndex={0}
            >
              <div>
                <strong>{food.name}</strong>
                {index === 0 && searchResults.length > 1 && (
                  <span className="badge bg-primary ms-2">Combined Total</span>
                )}
              </div>
              <small className="text-muted">
                Sodium: {food.sodium.toFixed(0)}mg, Potassium: {food.potassium.toFixed(0)}mg
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
