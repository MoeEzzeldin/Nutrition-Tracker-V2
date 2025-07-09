import React, { useState, useEffect } from 'react';
import { getTodayRecord, saveRecord } from '../utils/storage';
import { format } from 'date-fns';

const HealthMetrics = ({ onUpdate }) => {
  const [metrics, setMetrics] = useState({
    bloodPressure: {
      morning: { systolic: '', diastolic: '', heartRate: '', time: '' },
      afternoon: { systolic: '', diastolic: '', heartRate: '', time: '' },
      evening: { systolic: '', diastolic: '', heartRate: '', time: '' }
    }
  });

  useEffect(() => {
    const todayRecord = getTodayRecord();
    if (todayRecord?.healthMetrics) {
      setMetrics({
        bloodPressure: todayRecord.healthMetrics.bloodPressure || {
          morning: { systolic: '', diastolic: '', heartRate: '', time: '' },
          afternoon: { systolic: '', diastolic: '', heartRate: '', time: '' },
          evening: { systolic: '', diastolic: '', heartRate: '', time: '' }
        }
      });
    }
  }, []);

  const handleBloodPressureChange = (period, field, value) => {
    const updatedMetrics = {
      ...metrics,
      bloodPressure: {
        ...metrics.bloodPressure,
        [period]: {
          ...metrics.bloodPressure[period],
          [field]: value,
          time: field !== 'time' && value && !metrics.bloodPressure[period].time 
            ? format(new Date(), 'HH:mm') 
            : metrics.bloodPressure[period].time
        }
      }
    };
    setMetrics(updatedMetrics);
    saveMetrics(updatedMetrics);
  };

  const saveMetrics = (updatedMetrics) => {
    const todayRecord = getTodayRecord();
    const record = {
      date: format(new Date(), 'yyyy-MM-dd'),
      meals: todayRecord?.meals || { breakfast: [], lunch: [], dinner: [], snacks: [] },
      healthMetrics: updatedMetrics,
      fluidIntake: todayRecord?.fluidIntake || { goal: 66, entries: [] }
    };
    saveRecord(record);
    onUpdate();
  };

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="mb-0">Blood Pressure</h5>
      </div>
      <div className="card-body">
        <h6>3 Daily Readings</h6>
        {['morning', 'afternoon', 'evening'].map(period => (
          <div key={period} className="mb-3">
            <label className="text-capitalize text-muted small mb-1">{period}</label>
            <div className="row g-2">
              <div className="col-3">
                <input
                  type="number"
                  className="form-control form-control-sm"
                  placeholder="Sys"
                  value={metrics.bloodPressure[period]?.systolic || ''}
                  onChange={(e) => handleBloodPressureChange(period, 'systolic', e.target.value)}
                />
              </div>
              <div className="col-3">
                <input
                  type="number"
                  className="form-control form-control-sm"
                  placeholder="Dia"
                  value={metrics.bloodPressure[period]?.diastolic || ''}
                  onChange={(e) => handleBloodPressureChange(period, 'diastolic', e.target.value)}
                />
              </div>
              <div className="col-3">
                <input
                  type="number"
                  className="form-control form-control-sm"
                  placeholder="HR"
                  value={metrics.bloodPressure[period]?.heartRate || ''}
                  onChange={(e) => handleBloodPressureChange(period, 'heartRate', e.target.value)}
                />
              </div>
              <div className="col-3">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Time"
                  value={metrics.bloodPressure[period]?.time || ''}
                  readOnly
                />
              </div>
            </div>
          </div>
        ))}
        <div className="mt-3 p-2 bg-dark rounded text-center">
          <small className="text-muted">
            📊 Record your blood pressure at consistent times each day
          </small>
        </div>
      </div>
    </div>
  );
};

export default HealthMetrics;
