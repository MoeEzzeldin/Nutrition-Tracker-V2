import { exportToPDF } from '../pdfExport';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

// Mock jsPDF
jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    setFillColor: jest.fn(),
    rect: jest.fn(),
    setFontSize: jest.fn(),
    setTextColor: jest.fn(),
    text: jest.fn(),
    autoTable: jest.fn(),
    lastAutoTable: { finalY: 100 },
    addPage: jest.fn(),
    save: jest.fn()
  }));
});

describe('PDF Export Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('exportToPDF creates PDF document with correct formatting', () => {
    const records = [
      {
        date: '2024-01-01',
        meals: {
          breakfast: [{ name: 'Eggs', sodium: 100, potassium: 200 }],
          lunch: [],
          dinner: [],
          snacks: []
        }
      }
    ];
    
    exportToPDF(records);
    
    // Check that jsPDF was instantiated
    expect(jsPDF).toHaveBeenCalled();
    
    // Get the mock instance
    const mockPdf = jsPDF.mock.results[0].value;
    
    // Check that basic formatting was applied
    expect(mockPdf.setFillColor).toHaveBeenCalledWith(33, 33, 33);
    expect(mockPdf.setFontSize).toHaveBeenCalledWith(24);
    expect(mockPdf.text).toHaveBeenCalledWith('Nutrition Tracker', 14, 20);
    
    // Check that autoTable was called
    expect(mockPdf.autoTable).toHaveBeenCalled();
    
    // Check that PDF was saved
    expect(mockPdf.save).toHaveBeenCalledWith(
      expect.stringMatching(/^nutrition-history-\d{4}-\d{2}-\d{2}\.pdf$/)
    );
  });

  test('exportToPDF handles records with no meals', () => {
    const records = [
      {
        date: '2024-01-01',
        meals: {}
      }
    ];
    
    exportToPDF(records);
    
    // Should not throw any errors
    const mockPdf = jsPDF.mock.results[0].value;
    expect(mockPdf.save).toHaveBeenCalled();
  });

  test('exportToPDF handles records with different blood pressure formats', () => {
    const records = [
      {
        date: '2024-01-01',
        meals: {},
        healthMetrics: {
          bloodPressure: {
            morning: { systolic: '120', diastolic: '80' }
          }
        }
      },
      {
        date: '2024-01-02',
        meals: {},
        healthMetrics: {
          bloodPressure: {
            systolic: '130',
            diastolic: '85'
          }
        }
      }
    ];
    
    exportToPDF(records);
    
    // Should handle both formats without errors
    const mockPdf = jsPDF.mock.results[0].value;
    expect(mockPdf.save).toHaveBeenCalled();
  });

  test('exportToPDF handles records with different fluid intake formats', () => {
    const records = [
      {
        date: '2024-01-01',
        meals: {},
        fluidIntake: {
          entries: [{ amount: 16 }, { amount: 8 }]
        }
      },
      {
        date: '2024-01-02',
        meals: {},
        healthMetrics: {
          fluidIntake: [{ ounces: '12' }, { ounces: '8' }]
        }
      }
    ];
    
    exportToPDF(records);
    
    // Should handle both formats without errors
    const mockPdf = jsPDF.mock.results[0].value;
    expect(mockPdf.save).toHaveBeenCalled();
  });
});
