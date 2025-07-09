import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HistoryView from '../HistoryView';
import { deleteRecord, updateRecord } from '../../utils/storage';
import { exportToPDF } from '../../utils/pdfExport';

jest.mock('../../utils/storage');
jest.mock('../../utils/pdfExport');

describe('HistoryView Component', () => {
  const mockOnUpdate = jest.fn();
  const mockRecords = [
    {
      date: '2024-01-01',
      meals: {
        breakfast: [{ name: 'Eggs', sodium: 100, potassium: 200 }],
        lunch: [{ name: 'Salad', sodium: 50, potassium: 300 }],
        dinner: [],
        snacks: []
      },
      healthMetrics: {
        bloodPressure: {
          morning: { systolic: '120', diastolic: '80', heartRate: '75', time: '08:30' }
        }
      }
    },
    {
      date: '2024-01-02',
      meals: {
        breakfast: [],
        lunch: [],
        dinner: [{ name: 'Chicken', sodium: 200, potassium: 400 }],
        snacks: []
      },
      fluidIntake: {
        entries: [{ time: '12:30', amount: 24 }]
      }
    }
  ];
  
  beforeEach(() => {
    jest.clearAllMocks();
    global.confirm = jest.fn();
  });

  test('renders history view with records', () => {
    render(<HistoryView records={mockRecords} onUpdate={mockOnUpdate} />);
    
    // Check title and export button
    expect(screen.getByText('7-Day History')).toBeInTheDocument();
    expect(screen.getByText('Export to PDF')).toBeInTheDocument();
    
    // Check table headers
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Sodium')).toBeInTheDocument();
    expect(screen.getByText('Potassium')).toBeInTheDocument();
    expect(screen.getByText('BP')).toBeInTheDocument();
    expect(screen.getByText('Fluid')).toBeInTheDocument();
    
    // Check record data
    expect(screen.getByText('01/01/2024')).toBeInTheDocument();
    expect(screen.getByText('01/02/2024')).toBeInTheDocument();
    
    // Check computed values
    expect(screen.getByText('150mg')).toBeInTheDocument(); // Total sodium for first day
    expect(screen.getByText('500mg')).toBeInTheDocument(); // Total potassium for first day
    expect(screen.getByText('200mg')).toBeInTheDocument(); // Total sodium for second day
    expect(screen.getByText('400mg')).toBeInTheDocument(); // Total potassium for second day
    
    // Check blood pressure display
    expect(screen.getByText('120/80 (1/3)')).toBeInTheDocument();
    
    // Check fluid intake display
    expect(screen.getByText('24 oz')).toBeInTheDocument();
  });

  test('renders empty state when no records exist', () => {
    render(<HistoryView records={[]} onUpdate={mockOnUpdate} />);
    expect(screen.getByText('No records found.')).toBeInTheDocument();
  });

  test('deletes record when confirmed', () => {
    global.confirm.mockReturnValue(true);
    
    render(<HistoryView records={mockRecords} onUpdate={mockOnUpdate} />);
    
    // Click delete button for the first record
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);
    
    // Check that confirmation was requested
    expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete this record?');
    
    // Check that deleteRecord was called
    expect(deleteRecord).toHaveBeenCalledWith('2024-01-01');
    
    // Check that onUpdate was called
    expect(mockOnUpdate).toHaveBeenCalled();
  });

  test('does not delete record when not confirmed', () => {
    global.confirm.mockReturnValue(false);
    
    render(<HistoryView records={mockRecords} onUpdate={mockOnUpdate} />);
    
    // Click delete button for the first record
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);
    
    // Check that confirmation was requested
    expect(global.confirm).toHaveBeenCalled();
    
    // Check that deleteRecord was not called
    expect(deleteRecord).not.toHaveBeenCalled();
    
    // Check that onUpdate was not called
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  test('exports data to PDF when button clicked', () => {
    render(<HistoryView records={mockRecords} onUpdate={mockOnUpdate} />);
    
    // Click export button
    fireEvent.click(screen.getByText('Export to PDF'));
    
    // Check that exportToPDF was called with records
    expect(exportToPDF).toHaveBeenCalledWith(mockRecords);
  });

  test('enters edit mode when edit button clicked', () => {
    render(<HistoryView records={mockRecords} onUpdate={mockOnUpdate} />);
    
    // Click edit button for the first record
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);
    
    // Check that Save and Cancel buttons appear
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    
    // Cancel the edit
    fireEvent.click(screen.getByText('Cancel'));
    
    // Check that we're back to normal mode
    expect(screen.getAllByText('Edit').length).toBe(2);
  });

  test('saves edited record', () => {
    render(<HistoryView records={mockRecords} onUpdate={mockOnUpdate} />);
    
    // Click edit button for the first record
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);
    
    // Click save
    fireEvent.click(screen.getByText('Save'));
    
    // Check that updateRecord was called
    expect(updateRecord).toHaveBeenCalledWith(mockRecords[0]);
    
    // Check that onUpdate was called
    expect(mockOnUpdate).toHaveBeenCalled();
  });
});
