import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import * as storage from './utils/storage';

// Mock the storage module
jest.mock('./utils/storage', () => ({
  cleanOldRecords: jest.fn(),
  getRecords: jest.fn(() => []),
  getTodayRecord: jest.fn(() => null),
  saveRecord: jest.fn(),
  deleteRecord: jest.fn(),
  updateRecord: jest.fn()
}));

// Mock child components
jest.mock('./components/NutritionForm', () => {
  return function NutritionForm({ onUpdate }) {
    return <div data-testid="nutrition-form">NutritionForm</div>;
  };
});

jest.mock('./components/HealthMetrics', () => {
  return function HealthMetrics({ onUpdate }) {
    return <div data-testid="health-metrics">HealthMetrics</div>;
  };
});

jest.mock('./components/FluidIntake', () => {
  return function FluidIntake({ onUpdate }) {
    return <div data-testid="fluid-intake">FluidIntake</div>;
  };
});

jest.mock('./components/HistoryView', () => {
  return function HistoryView({ records, onUpdate }) {
    return <div data-testid="history-view">HistoryView - {records.length} records</div>;
  };
});

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders navigation and default tab', () => {
    render(<App />);
    
    expect(screen.getByText('Nutrition Tracker')).toBeInTheDocument();
    expect(screen.getByText("Today's Entry")).toBeInTheDocument();
    expect(screen.getByText('7-Day History')).toBeInTheDocument();
    
    // Should show today's entry components by default
    expect(screen.getByTestId('nutrition-form')).toBeInTheDocument();
    expect(screen.getByTestId('health-metrics')).toBeInTheDocument();
    expect(screen.getByTestId('fluid-intake')).toBeInTheDocument();
  });

  test('switches between tabs correctly', () => {
    render(<App />);
    
    const historyTab = screen.getByText('7-Day History');
    fireEvent.click(historyTab);
    
    expect(screen.getByTestId('history-view')).toBeInTheDocument();
    expect(screen.queryByTestId('nutrition-form')).not.toBeInTheDocument();
    
    const todayTab = screen.getByText("Today's Entry");
    fireEvent.click(todayTab);
    
    expect(screen.getByTestId('nutrition-form')).toBeInTheDocument();
    expect(screen.queryByTestId('history-view')).not.toBeInTheDocument();
  });

  test('loads records on mount', () => {
    const mockRecords = [
      { date: '2024-01-01', meals: {} },
      { date: '2024-01-02', meals: {} }
    ];
    storage.getRecords.mockReturnValue(mockRecords);
    
    render(<App />);
    
    expect(storage.cleanOldRecords).toHaveBeenCalled();
    expect(storage.getRecords).toHaveBeenCalled();
  });

  test('updates records when handleRecordUpdate is called', async () => {
    const newRecords = [{ date: '2024-01-03', meals: {} }];
    storage.getRecords.mockReturnValue(newRecords);
    
    render(<App />);
    
    // Switch to history view to see record count
    fireEvent.click(screen.getByText('7-Day History'));
    
    await waitFor(() => {
      expect(screen.getByText('HistoryView - 1 records')).toBeInTheDocument();
    });
  });
});

