import { 
  saveRecord, 
  getRecords, 
  getTodayRecord, 
  deleteRecord, 
  updateRecord, 
  cleanOldRecords 
} from '../storage';
import { format, subDays } from 'date-fns';

describe('Storage Utilities', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    localStorage.setItem.mockClear();
    localStorage.getItem.mockClear();
  });

  describe('saveRecord', () => {
    test('saves a new record', () => {
      const record = {
        date: '2024-01-01',
        meals: { breakfast: [], lunch: [], dinner: [], snacks: [] },
        healthMetrics: {}
      };
      
      saveRecord(record);
      
      const savedData = localStorage.setItem.mock.calls[0][1];
      const records = JSON.parse(savedData);
      expect(records).toHaveLength(1);
      expect(records[0]).toEqual(record);
    });

    test('updates existing record for same date', () => {
      const record1 = {
        date: '2024-01-01',
        meals: { breakfast: [], lunch: [], dinner: [], snacks: [] }
      };
      
      const record2 = {
        date: '2024-01-01',
        meals: { breakfast: [{ name: 'test' }], lunch: [], dinner: [], snacks: [] }
      };
      
      localStorage.getItem.mockReturnValueOnce(JSON.stringify([record1]));
      
      saveRecord(record2);
      
      const savedData = localStorage.setItem.mock.calls[0][1];
      const records = JSON.parse(savedData);
      expect(records).toHaveLength(1);
      expect(records[0].meals.breakfast).toHaveLength(1);
    });
  });

  describe('getRecords', () => {
    test('returns empty array when no records exist', () => {
      expect(getRecords()).toEqual([]);
    });

    test('returns all records sorted by date descending', () => {
      const records = [
        { date: '2024-01-01' },
        { date: '2024-01-03' },
        { date: '2024-01-02' }
      ];
      
      localStorage.setItem('nutritionRecords', JSON.stringify(records));
      
      const result = getRecords();
      expect(result[0].date).toBe('2024-01-03');
      expect(result[1].date).toBe('2024-01-02');
      expect(result[2].date).toBe('2024-01-01');
    });
  });

  describe('getTodayRecord', () => {
    test('returns null when no record exists for today', () => {
      expect(getTodayRecord()).toBeNull();
    });

    test('returns today\'s record when it exists', () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayRecord = { date: today, meals: {} };
      
      localStorage.setItem('nutritionRecords', JSON.stringify([todayRecord]));
      
      expect(getTodayRecord()).toEqual(todayRecord);
    });
  });

  describe('deleteRecord', () => {
    test('removes record with specified date', () => {
      const records = [
        { date: '2024-01-01' },
        { date: '2024-01-02' },
        { date: '2024-01-03' }
      ];
      
      localStorage.setItem('nutritionRecords', JSON.stringify(records));
      
      deleteRecord('2024-01-02');
      
      const result = getRecords();
      expect(result).toHaveLength(2);
      expect(result.find(r => r.date === '2024-01-02')).toBeUndefined();
    });
  });

  describe('updateRecord', () => {
    test('updates existing record', () => {
      const records = [
        { date: '2024-01-01', meals: { breakfast: [] } },
        { date: '2024-01-02', meals: { breakfast: [] } }
      ];
      
      localStorage.setItem('nutritionRecords', JSON.stringify(records));
      
      const updatedRecord = {
        date: '2024-01-01',
        meals: { breakfast: [{ name: 'updated' }] }
      };
      
      updateRecord(updatedRecord);
      
      const result = getRecords();
      const updated = result.find(r => r.date === '2024-01-01');
      expect(updated.meals.breakfast[0].name).toBe('updated');
    });
  });

  describe('cleanOldRecords', () => {
    test('removes records older than 7 days', () => {
      const today = new Date();
      const records = [
        { date: format(today, 'yyyy-MM-dd') },
        { date: format(subDays(today, 5), 'yyyy-MM-dd') },
        { date: format(subDays(today, 7), 'yyyy-MM-dd') },
        { date: format(subDays(today, 8), 'yyyy-MM-dd') },
        { date: format(subDays(today, 10), 'yyyy-MM-dd') }
      ];
      
      localStorage.getItem.mockReturnValueOnce(JSON.stringify(records));
      
      cleanOldRecords();
      
      const savedData = localStorage.setItem.mock.calls[0][1];
      const result = JSON.parse(savedData);
      expect(result).toHaveLength(3);
      expect(result.find(r => r.date === format(subDays(today, 8), 'yyyy-MM-dd'))).toBeUndefined();
      expect(result.find(r => r.date === format(subDays(today, 10), 'yyyy-MM-dd'))).toBeUndefined();
    });
  });
});

