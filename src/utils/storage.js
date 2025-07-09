import { format, parseISO, subDays, isAfter } from 'date-fns';

const STORAGE_KEY = 'nutritionRecords';

export const getRecords = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveRecord = (record) => {
  const records = getRecords();
  const existingIndex = records.findIndex(r => r.date === record.date);
  
  if (existingIndex >= 0) {
    records[existingIndex] = record;
  } else {
    records.push(record);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};

export const getTodayRecord = () => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const records = getRecords();
  return records.find(r => r.date === today);
};

export const updateRecord = (record) => {
  saveRecord(record);
};

export const deleteRecord = (date) => {
  const records = getRecords();
  const filtered = records.filter(r => r.date !== date);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const cleanOldRecords = () => {
  const records = getRecords();
  const sevenDaysAgo = subDays(new Date(), 7);
  
  const filtered = records.filter(record => {
    const recordDate = parseISO(record.date);
    return isAfter(recordDate, sevenDaysAgo) || format(recordDate, 'yyyy-MM-dd') === format(sevenDaysAgo, 'yyyy-MM-dd');
  });
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};
