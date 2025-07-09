import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NutritionForm from '../NutritionForm';
import * as storage from '../../utils/storage';

jest.mock('../../utils/storage');
jest.mock('../SearchBar', () => {
  return function SearchBar({ onSelectFood }) {
    return (
      <div data-testid="search-bar">
        <button onClick={() => onSelectFood({
          name: '100 g test food',
          mealType: 'breakfast',
          sodium: 100,
          potassium: 200,
          calories: 150,
          protein: 20,
          carbs: 10,
          fat: 5
        })}>
          Add Test Food
        </button>
      </div>
    );
  };
});

describe('NutritionForm Component', () => {
  const mockOnUpdate = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    storage.getTodayRecord.mockReturnValue(null);
  });

  test('renders meal sections and search bar', () => {
    render(<NutritionForm onUpdate={mockOnUpdate} />);
    
    expect(screen.getByTestId('search-bar')).toBeInTheDocument();
    expect(screen.getByText('Breakfast')).toBeInTheDocument();
    expect(screen.getByText('Lunch')).toBeInTheDocument();
    expect(screen.getByText('Dinner')).toBeInTheDocument();
    expect(screen.getByText('Snacks')).toBeInTheDocument();
    expect(screen.getByText('Daily Totals')).toBeInTheDocument();
  });

  test('adds food item to correct meal type', () => {
    render(<NutritionForm onUpdate={mockOnUpdate} />);
    
    fireEvent.click(screen.getByText('Add Test Food'));
    
    expect(screen.getByText('100 g test food')).toBeInTheDocument();
    expect(screen.getByText('Sodium: 100mg | Potassium: 200mg')).toBeInTheDocument();
    expect(storage.saveRecord).toHaveBeenCalled();
    expect(mockOnUpdate).toHaveBeenCalled();
  });

  test('removes food item', () => {
    render(<NutritionForm onUpdate={mockOnUpdate} />);
    
    // Add food first
    fireEvent.click(screen.getByText('Add Test Food'));
    
    // Remove it
    fireEvent.click(screen.getByText('Remove'));
    
    expect(screen.queryByText('100 g test food')).not.toBeInTheDocument();
    expect(storage.saveRecord).toHaveBeenCalledTimes(2);
  });

  test('edits food item sodium and potassium', () => {
    render(<NutritionForm onUpdate={mockOnUpdate} />);
    
    // Add food first
    fireEvent.click(screen.getByText('Add Test Food'));
    
    // Click edit
    fireEvent.click(screen.getByText('Edit'));
    
    // Should show input fields
    const sodiumInput = screen.getByPlaceholderText('Sodium (mg)');
    const potassiumInput = screen.getByPlaceholderText('Potassium (mg)');
    
    expect(sodiumInput).toBeInTheDocument();
    expect(potassiumInput).toBeInTheDocument();
    
    // Change values
    fireEvent.change(sodiumInput, { target: { value: '150' } });
    fireEvent.change(potassiumInput, { target: { value: '250' } });
    
    // Save
    fireEvent.click(screen.getByText('Save'));
    
    expect(screen.getByText('Sodium: 150mg | Potassium: 250mg')).toBeInTheDocument();
  });

  test('cancels edit', () => {
    render(<NutritionForm onUpdate={mockOnUpdate} />);
    
    fireEvent.click(screen.getByText('Add Test Food'));
    fireEvent.click(screen.getByText('Edit'));
    fireEvent.click(screen.getByText('Cancel'));
    
    expect(screen.queryByPlaceholderText('Sodium (mg)')).not.toBeInTheDocument();
  });

  test('calculates daily totals correctly', () => {
    render(<NutritionForm onUpdate={mockOnUpdate} />);
    
    // Add multiple foods
    fireEvent.click(screen.getByText('Add Test Food'));
    fireEvent.click(screen.getByText('Add Test Food'));
    
    // Check that the daily totals section contains the correct values
    const dailyTotalsSection = screen.getByText('Daily Totals').parentElement;
    
    expect(dailyTotalsSection).toHaveTextContent('Sodium: 200mg');
    expect(dailyTotalsSection).toHaveTextContent('Potassium: 400mg');
  });

  test('loads existing data on mount', () => {
    const existingRecord = {
      meals: {
        breakfast: [{
          name: 'Existing food',
          sodium: 50,
          potassium: 100,
          calories: 100,
          protein: 10,
          carbs: 5,
          fat: 2
        }],
        lunch: [],
        dinner: [],
        snacks: []
      }
    };
    
    storage.getTodayRecord.mockReturnValue(existingRecord);
    
    render(<NutritionForm onUpdate={mockOnUpdate} />);
    
    expect(screen.getByText('Existing food')).toBeInTheDocument();
    expect(screen.getByText('Sodium: 50mg | Potassium: 100mg')).toBeInTheDocument();
  });
});

