import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import SearchBar from '../SearchBar';

jest.mock('axios');

describe('SearchBar Component', () => {
  const mockOnSelectFood = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.REACT_APP_API_NINJA_KEY = 'test-api-key';
  });

  test('renders all input elements', () => {
    render(<SearchBar onSelectFood={mockOnSelectFood} placeholder="Search food..." />);
    
    expect(screen.getByLabelText('Select meal type')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Qty')).toBeInTheDocument();
    expect(screen.getByLabelText('Select units')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search food...')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
  });

  test('shows error when searching without query', () => {
    render(<SearchBar onSelectFood={mockOnSelectFood} />);
    
    fireEvent.click(screen.getByText('Search'));
    
    expect(screen.getByText('Please enter a food item to search')).toBeInTheDocument();
  });

  test('shows error when quantity is invalid', () => {
    render(<SearchBar onSelectFood={mockOnSelectFood} />);
    
    fireEvent.change(screen.getByPlaceholderText('Qty'), { target: { value: '0' } });
    fireEvent.change(screen.getByPlaceholderText(/Search food/), { target: { value: 'chicken' } });
    fireEvent.click(screen.getByText('Search'));
    
    expect(screen.getByText('Please enter a valid quantity')).toBeInTheDocument();
  });

  test('performs search with valid inputs', async () => {
    const mockResponse = {
      data: [{
        name: 'chicken breast',
        calories: 165,
        protein_g: 31,
        carbohydrates_total_g: 0,
        fat_total_g: 3.6,
        sodium_mg: 74,
        potassium_mg: 256
      }]
    };
    
    axios.get.mockResolvedValue(mockResponse);
    
    render(<SearchBar onSelectFood={mockOnSelectFood} />);
    
    fireEvent.change(screen.getByPlaceholderText(/Search food/), { target: { value: 'chicken' } });
    fireEvent.click(screen.getByText('Search'));
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.api-ninjas.com/v1/nutrition?query=100 grams chicken',
        expect.objectContaining({
          headers: { 'X-Api-Key': 'test-api-key' }
        })
      );
    });
    
    expect(screen.getByText('Search Results:')).toBeInTheDocument();
    expect(screen.getByText('100 g chicken breast')).toBeInTheDocument();
  });

  test('handles API error gracefully', async () => {
    axios.get.mockRejectedValue(new Error('Network error'));
    
    render(<SearchBar onSelectFood={mockOnSelectFood} />);
    
    fireEvent.change(screen.getByPlaceholderText(/Search food/), { target: { value: 'chicken' } });
    fireEvent.click(screen.getByText('Search'));
    
    await waitFor(() => {
      expect(screen.getByText('Error searching for food. Please check your connection and try again.')).toBeInTheDocument();
    });
  });

  test('selects food item and clears form', async () => {
    const mockResponse = {
      data: [{
        name: 'chicken breast',
        calories: 165,
        protein_g: 31,
        carbohydrates_total_g: 0,
        fat_total_g: 3.6,
        sodium_mg: 74,
        potassium_mg: 256
      }]
    };
    
    axios.get.mockResolvedValue(mockResponse);
    
    render(<SearchBar onSelectFood={mockOnSelectFood} />);
    
    fireEvent.change(screen.getByPlaceholderText(/Search food/), { target: { value: 'chicken' } });
    fireEvent.click(screen.getByText('Search'));
    
    await waitFor(() => {
      expect(screen.getByText('100 g chicken breast')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('100 g chicken breast'));
    
    expect(mockOnSelectFood).toHaveBeenCalledWith(expect.objectContaining({
      name: '100 g chicken breast',
      mealType: 'breakfast',
      units: '100 g',
      sodium: 74,
      potassium: 256
    }));
    
    // Form should be cleared
    expect(screen.getByPlaceholderText(/Search food/).value).toBe('');
    expect(screen.getByPlaceholderText('Qty').value).toBe('100');
  });

  test('changes meal type and units', () => {
    render(<SearchBar onSelectFood={mockOnSelectFood} />);
    
    const mealSelect = screen.getByLabelText('Select meal type');
    fireEvent.change(mealSelect, { target: { value: 'lunch' } });
    expect(mealSelect.value).toBe('lunch');
    
    const unitsSelect = screen.getByLabelText('Select units');
    fireEvent.change(unitsSelect, { target: { value: 'oz' } });
    expect(unitsSelect.value).toBe('oz');
  });
});

