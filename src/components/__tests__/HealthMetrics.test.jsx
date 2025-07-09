import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import HealthMetrics from '../HealthMetrics';
import * as storage from '../../utils/storage';

jest.mock('../../utils/storage');

describe('HealthMetrics Component', () => {
  const mockOnUpdate = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    storage.getTodayRecord.mockReturnValue(null);
  });

  test('renders blood pressure input fields', () => {
    render(<HealthMetrics onUpdate={mockOnUpdate} />);
    
    // Check headings
    expect(screen.getByText('Blood Pressure')).toBeInTheDocument();
    expect(screen.getByText('3 Daily Readings')).toBeInTheDocument();
    
    // Check period labels
    expect(screen.getByText('morning')).toBeInTheDocument();
    expect(screen.getByText('afternoon')).toBeInTheDocument();
    expect(screen.getByText('evening')).toBeInTheDocument();
    
    // Check input fields (3 periods × 3 fields + 3 readonly time fields)
    const inputFields = screen.getAllByRole('spinbutton');
    expect(inputFields.length).toBe(9);
    
    // Check placeholders
    expect(screen.getAllByPlaceholderText('Sys').length).toBe(3);
    expect(screen.getAllByPlaceholderText('Dia').length).toBe(3);
    expect(screen.getAllByPlaceholderText('HR').length).toBe(3);
    expect(screen.getAllByPlaceholderText('Time').length).toBe(3);
  });

  test('loads existing blood pressure data', () => {
    const existingRecord = {
      healthMetrics: {
        bloodPressure: {
          morning: { systolic: '120', diastolic: '80', heartRate: '75', time: '08:30' },
          afternoon: { systolic: '', diastolic: '', heartRate: '', time: '' },
          evening: { systolic: '', diastolic: '', heartRate: '', time: '' }
        }
      }
    };
    
    storage.getTodayRecord.mockReturnValue(existingRecord);
    
    render(<HealthMetrics onUpdate={mockOnUpdate} />);
    
    // Get all systolic, diastolic, and heart rate inputs
    const systolicInputs = screen.getAllByPlaceholderText('Sys');
    const diastolicInputs = screen.getAllByPlaceholderText('Dia');
    const heartRateInputs = screen.getAllByPlaceholderText('HR');
    
    // Check morning values
    expect(systolicInputs[0]).toHaveValue(120);
    expect(diastolicInputs[0]).toHaveValue(80);
    expect(heartRateInputs[0]).toHaveValue(75);
    
    // Check time field
    const timeInputs = screen.getAllByPlaceholderText('Time');
    expect(timeInputs[0]).toHaveValue('08:30');
  });

  test('updates blood pressure data and saves to storage', () => {
    render(<HealthMetrics onUpdate={mockOnUpdate} />);
    
    // Get input fields for morning reading
    const systolicInputs = screen.getAllByPlaceholderText('Sys');
    const diastolicInputs = screen.getAllByPlaceholderText('Dia');
    const heartRateInputs = screen.getAllByPlaceholderText('HR');
    
    // Update morning reading
    fireEvent.change(systolicInputs[0], { target: { value: '130' } });
    fireEvent.change(diastolicInputs[0], { target: { value: '85' } });
    fireEvent.change(heartRateInputs[0], { target: { value: '72' } });
    
    // Check that storage was called with the updated values
    expect(storage.saveRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        healthMetrics: expect.objectContaining({
          bloodPressure: expect.objectContaining({
            morning: expect.objectContaining({
              systolic: '130',
              diastolic: '85',
              heartRate: '72',
              time: expect.any(String)
            })
          })
        })
      })
    );
    
    // Check that onUpdate was called
    expect(mockOnUpdate).toHaveBeenCalled();
  });

  test('automatically sets time when first value is entered', () => {
    jest.spyOn(global.Date.prototype, 'toISOString').mockImplementation(() => '2023-01-01T12:30:00.000Z');
    
    render(<HealthMetrics onUpdate={mockOnUpdate} />);
    
    // Get input field for afternoon reading
    const systolicInputs = screen.getAllByPlaceholderText('Sys');
    
    // Enter a value for the first time
    fireEvent.change(systolicInputs[1], { target: { value: '125' } });
    
    // Check that storage was called with a time value
    expect(storage.saveRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        healthMetrics: expect.objectContaining({
          bloodPressure: expect.objectContaining({
            afternoon: expect.objectContaining({
              systolic: '125',
              time: '12:30'
            })
          })
        })
      })
    );
  });
});
