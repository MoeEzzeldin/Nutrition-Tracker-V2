import { format, subDays } from 'date-fns';

const STORAGE_KEY = 'nutritionRecords';

// Helper function to safely access localStorage
const safeLocalStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  }
};

export const getRecords = () => {
  const records = safeLocalStorage.getItem(STORAGE_KEY);
  if (!records) return [];
  
  try {
    const parsedRecords = JSON.parse(records);
    // Sort by date in descending order (newest first)
    return parsedRecords.sort((a, b) => {
      // Compare dates as strings in yyyy-MM-dd format
      // Since the format is yyyy-MM-dd, string comparison works correctly
      if (a.date < b.date) return 1;
      if (a.date > b.date) return -1;
      return 0;
    });
  } catch (error) {
    console.error('Error parsing records:', error);
    return [];
  }
};

export const saveRecord = (record) => {
  const records = safeLocalStorage.getItem(STORAGE_KEY);
  const existingRecords = records ? JSON.parse(records) : [];
  
  const existingIndex = existingRecords.findIndex(r => r.date === record.date);
  
  if (existingIndex !== -1) {
    existingRecords[existingIndex] = record;
  } else {
    existingRecords.push(record);
  }
  
  safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(existingRecords));
};

export const getTodayRecord = () => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const records = getRecords();
  const todayRecord = records.find(r => r.date === today);
  return todayRecord || null; // Explicitly return null if not found
};

export const updateRecord = (record) => {
  saveRecord(record);
};

export const deleteRecord = (date) => {
  const records = safeLocalStorage.getItem(STORAGE_KEY);
  if (!records) return;
  
  const parsedRecords = JSON.parse(records);
  const filtered = parsedRecords.filter(r => r.date !== date);
  safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const cleanOldRecords = () => {
  const records = safeLocalStorage.getItem(STORAGE_KEY);
  if (!records) return;
  
  const parsedRecords = JSON.parse(records);
  const sevenDaysAgo = subDays(new Date(), 7);
  const sevenDaysAgoString = format(sevenDaysAgo, 'yyyy-MM-dd');
  
  const recentRecords = parsedRecords.filter(record => {
    return record.date >= sevenDaysAgoString;
  });
  
  safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(recentRecords));
};

