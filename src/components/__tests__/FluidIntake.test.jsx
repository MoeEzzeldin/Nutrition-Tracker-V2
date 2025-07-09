import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FluidIntake from '../FluidIntake';
import * as storage from '../../utils/storage';
import { format } from 'date-fns';

jest.mock('../../utils/storage');
// Mock date-fns format to return predictable values
jest.mock('date-fns', () => ({
  ...jest.requireActual('date-fns'),
  format: jest.fn().mockReturnValue('12:30')
}));

describe('FluidIntake Component', () => {
  const mockOnUpdate = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    storage.getTodayRecord.mockReturnValue(null);
    global.prompt = jest.fn();
  });

  test('renders fluid intake elements and default goal', () => {
    render(<FluidIntake onUpdate={mockOnUpdate} />);
    
    // Check title and goal
    expect(screen.getByText('Fluid Intake')).toBeInTheDocument();
    expect(screen.getByText('Goal: 66 oz')).toBeInTheDocument();
    
    // Check progress section
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('0 / 66 oz')).toBeInTheDocument();
    
    // Check quick add buttons
    expect(screen.getByText('8 oz')).toBeInTheDocument();
    expect(screen.getByText('12 oz')).toBeInTheDocument();
    expect(screen.getByText('16 oz')).toBeInTheDocument();
    expect(screen.getByText('20 oz')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
    
    // Check empty state message
    expect(screen.getByText('No entries yet. Start tracking your fluid intake!')).toBeInTheDocument();
  });

  test('loads existing fluid intake data', () => {
    const existingRecord = {
      fluidIntake: {
        goal: 80,
        entries: [
          { time: '08:30', amount: 16, timestamp: '2023-01-01T08:30:00.000Z' },
          { time: '10:45', amount: 12, timestamp: '2023-01-01T10:45:00.000Z' }
        ]
      }
    };
    
    storage.getTodayRecord.mockReturnValue(existingRecord);
    
    render(<FluidIntake onUpdate={mockOnUpdate} />);
    
    // Check that goal is loaded
    expect(screen.getByText('Goal: 80 oz')).toBeInTheDocument();
    
    // Check that progress shows correct total
    expect(screen.getByText('28 / 80 oz')).toBeInTheDocument();
    
    // Check that entries are displayed
    expect(screen.getByText('16 oz')).toBeInTheDocument();
    expect(screen.getByText('at 08:30')).toBeInTheDocument();
    expect(screen.getByText('12 oz')).toBeInTheDocument();
    expect(screen.getByText('at 10:45')).toBeInTheDocument();
  });

  test('adds fluid using quick add buttons', () => {
    render(<FluidIntake onUpdate={mockOnUpdate} />);
    
    // Click on 12 oz button
    fireEvent.click(screen.getByText('12 oz'));
    
    // Check that the entry was added
    expect(screen.getByText('12 oz')).toBeInTheDocument();
    expect(screen.getByText('at 12:30')).toBeInTheDocument();
    
    // Check that storage was updated
    expect(storage.saveRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        fluidIntake: expect.objectContaining({
          entries: expect.arrayContaining([
            expect.objectContaining({
              amount: 12,
              time: '12:30'
            })
          ])
        })
      })
    );
    
    // Check that the progress was updated
    expect(screen.getByText('12 / 66 oz')).toBeInTheDocument();
  });

  test('adds custom amount of fluid', () => {
    global.prompt.mockReturnValue('25');
    
    render(<FluidIntake onUpdate={mockOnUpdate} />);
    
    // Click on Custom button
    fireEvent.click(screen.getByText('Custom'));
    
    // Check that prompt was called
    expect(global.prompt).toHaveBeenCalledWith('Enter fluid amount in ounces:');
    
    // Check that the entry was added
    expect(screen.getByText('25 oz')).toBeInTheDocument();
    
    // Check that storage was updated
    expect(storage.saveRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        fluidIntake: expect.objectContaining({
          entries: expect.arrayContaining([
            expect.objectContaining({
              amount: 25,
              time: expect.any(String)
            })
          ])
        })
      })
    );
  });

  test('removes fluid entry', () => {
    storage.getTodayRecord.mockReturnValue({
      fluidIntake: {
        goal: 66,
        entries: [
          { time: '08:30', amount: 16, timestamp: '2023-01-01T08:30:00.000Z' }
        ]
      }
    });
    
    render(<FluidIntake onUpdate={mockOnUpdate} />);
    
    // Check that entry exists
    expect(screen.getByText('16 oz')).toBeInTheDocument();
    
    // Click the remove button (×)
    fireEvent.click(screen.getByText('×'));
    
    // Check that the entry was removed
    expect(screen.queryByText('16 oz')).not.toBeInTheDocument();
    expect(screen.getByText('No entries yet. Start tracking your fluid intake!')).toBeInTheDocument();
    
    // Check that storage was updated
    expect(storage.saveRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        fluidIntake: expect.objectContaining({
          entries: []
        })
      })
    );
  });

  test('changes fluid intake goal', () => {
    global.prompt.mockReturnValue('90');
    
    render(<FluidIntake onUpdate={mockOnUpdate} />);
    
    // Click on the goal button
    fireEvent.click(screen.getByText('Goal: 66 oz'));
    
    // Check that prompt was called
    expect(global.prompt).toHaveBeenCalledWith('Enter daily fluid goal in ounces:', 66);
    
    // Check that the goal was updated
    expect(screen.getByText('Goal: 90 oz')).toBeInTheDocument();
    expect(screen.getByText('0 / 90 oz')).toBeInTheDocument();
    
    // Check that storage was updated
    expect(storage.saveRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        fluidIntake: expect.objectContaining({
          goal: 90
        })
      })
    );
  });
});
