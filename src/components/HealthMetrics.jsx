import React, { useState, useEffect } from 'react';
import { getTodayRecord, saveRecord } from '../utils/storage';
import { format } from 'date-fns';

const HealthMetrics = ({ onUpdate }) => {
  const [metrics, setMetrics] = useState({
    bloodPressure: {
      morning: { systolic: '', diastolic: '', heartRate: '', time: '', period: 'AM' },
      afternoon: { systolic: '', diastolic: '', heartRate: '', time: '', period: 'PM' },
      evening: { systolic: '', diastolic: '', heartRate: '', time: '', period: 'PM' }
    }
  });

  useEffect(() => {
    const todayRecord = getTodayRecord();
    if (todayRecord?.healthMetrics?.bloodPressure) {
      // Ensure each period has the 'period' field
      const bp = todayRecord.healthMetrics.bloodPressure;
      setMetrics({
        bloodPressure: {
          morning: { 
            systolic: bp.morning?.systolic || '', 
            diastolic: bp.morning?.diastolic || '', 
            heartRate: bp.morning?.heartRate || '', 
            time: bp.morning?.time || '',
            period: bp.morning?.period || 'AM'
          },
          afternoon: { 
            systolic: bp.afternoon?.systolic || '', 
            diastolic: bp.afternoon?.diastolic || '', 
            heartRate: bp.afternoon?.heartRate || '', 
            time: bp.afternoon?.time || '',
            period: bp.afternoon?.period || 'PM'
          },
          evening: { 
            systolic: bp.evening?.systolic || '', 
            diastolic: bp.evening?.diastolic || '', 
            heartRate: bp.evening?.heartRate || '', 
            time: bp.evening?.time || '',
            period: bp.evening?.period || 'PM'
          }
        }
      });
    }
  }, []);

  const handleBloodPressureChange = (timePeriod, field, value) => {
    const currentPeriodData = metrics.bloodPressure[timePeriod] || { 
      systolic: '', 
      diastolic: '', 
      heartRate: '', 
      time: '', 
      period: timePeriod === 'morning' ? 'AM' : 'PM' 
    };
    
    const updatedMetrics = {
      ...metrics,
      bloodPressure: {
        ...metrics.bloodPressure,
        [timePeriod]: {
          ...currentPeriodData,
          [field]: value,
          // Only auto-set time when a measurement value is entered for the first time
          time: field !== 'time' && field !== 'period' && value && !currentPeriodData.time 
            ? format(new Date(), 'h:mm') 
            : currentPeriodData.time,
          // Only auto-set period when time is auto-set
          period: field !== 'time' && field !== 'period' && value && !currentPeriodData.time
            ? format(new Date(), 'a')
            : field === 'period' ? value : currentPeriodData.period
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

  const handleClearPeriod = (timePeriod) => {
    const confirmMessage = `Are you sure you want to clear the ${timePeriod} blood pressure reading?`;
    if (window.confirm(confirmMessage)) {
      const updatedMetrics = {
        ...metrics,
        bloodPressure: {
          ...metrics.bloodPressure,
          [timePeriod]: {
            systolic: '',
            diastolic: '',
            heartRate: '',
            time: '',
            period: timePeriod === 'morning' ? 'AM' : 'PM'
          }
        }
      };
      setMetrics(updatedMetrics);
      saveMetrics(updatedMetrics);
    }
  };

  const handleClearAll = () => {
    const confirmMessage = 'Are you sure you want to clear all blood pressure readings for today?';
    if (window.confirm(confirmMessage)) {
      const clearedMetrics = {
        bloodPressure: {
          morning: { systolic: '', diastolic: '', heartRate: '', time: '', period: 'AM' },
          afternoon: { systolic: '', diastolic: '', heartRate: '', time: '', period: 'PM' },
          evening: { systolic: '', diastolic: '', heartRate: '', time: '', period: 'PM' }
        }
      };
      setMetrics(clearedMetrics);
      saveMetrics(clearedMetrics);
    }
  };

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Blood Pressure</h5>
        <button
          className="btn btn-sm btn-outline-danger"
          onClick={handleClearAll}
          title="Clear all readings"
        >
          Clear All
        </button>
      </div>
      <div className="card-body">
        <h6>3 Daily Readings</h6>
        {['morning', 'afternoon', 'evening'].map(timePeriod => (
          <div key={timePeriod} className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <label className="text-capitalize text-muted small mb-0">{timePeriod}</label>
              {(metrics.bloodPressure[timePeriod]?.systolic || 
                metrics.bloodPressure[timePeriod]?.diastolic || 
                metrics.bloodPressure[timePeriod]?.heartRate) && (
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleClearPeriod(timePeriod)}
                  title={`Clear ${timePeriod} reading`}
                >
                  Clear
                </button>
              )}
            </div>
            <div className="row g-2">
              <div className="col-3">
                <input
                  type="number"
                  className="form-control form-control-sm"
                  placeholder="Sys"
                  value={metrics.bloodPressure[timePeriod]?.systolic || ''}
                  onChange={(e) => handleBloodPressureChange(timePeriod, 'systolic', e.target.value)}
                />
              </div>
              <div className="col-3">
                <input
                  type="number"
                  className="form-control form-control-sm"
                  placeholder="Dia"
                  value={metrics.bloodPressure[timePeriod]?.diastolic || ''}
                  onChange={(e) => handleBloodPressureChange(timePeriod, 'diastolic', e.target.value)}
                />
              </div>
              <div className="col-3">
                <input
                  type="number"
                  className="form-control form-control-sm"
                  placeholder="HR"
                  value={metrics.bloodPressure[timePeriod]?.heartRate || ''}
                  onChange={(e) => handleBloodPressureChange(timePeriod, 'heartRate', e.target.value)}
                />
              </div>
              <div className="col-3">
                <div className="d-flex gap-1">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Time"
                    value={metrics.bloodPressure[timePeriod]?.time || ''}
                    readOnly
                    style={{ flex: '1 1 60%' }}
                  />
                  <select
                    className="form-select form-select-sm"
                    value={metrics.bloodPressure[timePeriod]?.period || (timePeriod === 'morning' ? 'AM' : 'PM')}
                    onChange={(e) => handleBloodPressureChange(timePeriod, 'period', e.target.value)}
                    disabled={!metrics.bloodPressure[timePeriod]?.time}
                    style={{ flex: '1 1 40%' }}
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
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
