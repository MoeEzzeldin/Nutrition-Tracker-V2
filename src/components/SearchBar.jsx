import React, { useState } from 'react';
import axios from 'axios';

const SearchBar = ({ onSelectFood, placeholder }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [message, setMessage] = useState('');

  const searchFood = async () => {
    if (!query.trim()) {
      setMessage('Please enter a food item to search');
      return;
    }

    setLoading(true);
    setMessage('');
    setSearchResults([]);
    setShowResults(false);

    try {
      console.log('Searching for:', query);

      const response = await axios.get(
        `https://api.api-ninjas.com/v1/nutrition?query=${query}`,
        {
          headers: {
            'X-Api-Key': process.env.REACT_APP_API_NINJA_KEY
          }
        }
      );

      console.log('API response:', response);

      if (response.data && response.data.length > 0) {
        const formattedResults = response.data.map(item => ({
          name: item.name,
          calories: parseFloat(item.calories) || 0,
          protein: parseFloat(item.protein_g) || 0,
          carbs: parseFloat(item.carbohydrates_total_g) || 0,
          fat: parseFloat(item.fat_total_g) || 0,
          sodium: parseFloat(item.sodium_mg) || 0,
          potassium: parseFloat(item.potassium_mg) || 0
        }));

        console.log('Formatted results:', formattedResults);

        // If multiple items returned, combine them
        if (formattedResults.length > 1) {
          const combined = {
            name: formattedResults.map(r => r.name).join(' + '),
            calories: formattedResults.reduce((sum, r) => sum + r.calories, 0),
            protein: formattedResults.reduce((sum, r) => sum + r.protein, 0),
            carbs: formattedResults.reduce((sum, r) => sum + r.carbs, 0),
            fat: formattedResults.reduce((sum, r) => sum + r.fat, 0),
            sodium: formattedResults.reduce((sum, r) => sum + r.sodium, 0),
            potassium: formattedResults.reduce((sum, r) => sum + r.potassium, 0)
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
      console.error('Error fetching nutrition data:', error);
      setMessage('Error searching for food. Please check your connection and try again.');
      setSearchResults([]);
    }
    
    setLoading(false);
  };

  const handleSelectFood = (food) => {
    onSelectFood(food);
    setQuery('');
    setSearchResults([]);
    setShowResults(false);
    setMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchFood();
    }
  };

  return (
    <div className="position-relative">
      <div className="input-group">
        <input
          type="text"
          className="form-control"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button 
          className="btn btn-primary" 
          type="button"
          onClick={searchFood}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Searching...
            </>
          ) : (
            'Search'
          )}
        </button>
      </div>
      
      {message && (
        <div className={`alert ${searchResults.length > 0 ? 'alert-warning' : 'alert-info'} mt-2 mb-0 py-2`}>
          <small>{message}</small>
        </div>
      )}
      
      {showResults && searchResults.length > 0 && (
        <div className="mt-2 border border-secondary rounded p-2" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <h6 className="mb-2">Search Results:</h6>
          {searchResults.map((food, index) => (
            <div
              key={index}
              className="d-flex justify-content-between align-items-center p-2 mb-1 rounded cursor-pointer"
              style={{ 
                backgroundColor: 'var(--bg-secondary)', 
                cursor: 'pointer',
                border: '1px solid transparent'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-purple)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
              onClick={() => handleSelectFood(food)}
            >
              <div>
                <strong>{food.name}</strong>
                {index === 0 && searchResults.length > 1 && (
                  <span className="badge bg-primary ms-2">Combined Total</span>
                )}
              </div>
              <small className="text-muted">
                Na: {food.sodium.toFixed(0)}mg, K: {food.potassium.toFixed(0)}mg
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
