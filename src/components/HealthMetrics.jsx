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
  
  // Load collapse state from localStorage or use defaults
  const getInitialCollapseState = () => {
    const saved = localStorage.getItem('bpCollapseState');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      morning: true, // Default expanded
      afternoon: false,
      evening: false
    };
  };
  
  const [collapseState, setCollapseState] = useState(getInitialCollapseState());

  // Save collapse state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('bpCollapseState', JSON.stringify(collapseState));
  }, [collapseState]);

  // Toggle collapse for a time period
  const toggleCollapse = (period) => {
    setCollapseState(prev => ({
      ...prev,
      [period]: !prev[period]
    }));
  };

  // Function to check if a period has data
  const hasData = (period) => {
    const data = metrics.bloodPressure[period];
    return data && (data.systolic || data.diastolic || data.heartRate);
  };

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

  const handleBPChange = (period, field, value) => {
    // Add special handling for time field to ensure proper HH:mm format
    if (field === 'time') {
      // Format the time to ensure it matches the HH:mm format
      if (value && !value.match(/^\d{2}:\d{2}$/)) {
        // Try to fix common format issues
        const timeParts = value.split(':');
        if (timeParts.length === 2) {
          const hours = timeParts[0].padStart(2, '0');
          const minutes = timeParts[1].padStart(2, '0');
          value = `${hours}:${minutes}`;
        }
      }
    }

    setMetrics(prev => ({
      ...prev,
      bloodPressure: {
        ...prev.bloodPressure,
        [period]: {
          ...prev.bloodPressure[period],
          [field]: value
        }
      }
    }));
  };

  // Format time values to ensure they match HH:mm format
  const formatTimeValue = (timeValue) => {
    if (!timeValue) return '';
    
    // If the time already matches the required format, return it
    if (timeValue.match(/^\d{2}:\d{2}$/)) return timeValue;
    
    // Try to convert the time to the correct format
    try {
      const timeParts = timeValue.split(':');
      if (timeParts.length === 2) {
        const hours = timeParts[0].padStart(2, '0');
        const minutes = timeParts[1].padStart(2, '0');
        return `${hours}:${minutes}`;
      }
    } catch (e) {
      console.error("Time format error:", e);
    }
    
    // If conversion fails, return an empty string
    return '';
  };

  const renderBPSection = (period, label) => {
    const data = metrics.bloodPressure[period];
    const isExpanded = collapseState[period];
    
    return (
      <div className="bp-period-section" key={period}>
        <div 
          className={`bp-period-header d-flex align-items-center justify-content-between ${hasData(period) ? 'has-data' : ''}`}
          onClick={() => toggleCollapse(period)}
          role="button"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleCollapse(period);
            }
          }}
        >
          <h6 className="text-primary mb-0 d-flex align-items-center">
            {label}
            {hasData(period) && <span className="text-success ms-2">✓</span>}
          </h6>
          <button 
            type="button"
            className="btn btn-link p-0 bp-collapse-toggle"
            aria-expanded={isExpanded}
            aria-controls={`${period}-bp-collapse`}
          >
            <i className={`bi ${isExpanded ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
          </button>
        </div>
        
        <div className={`bp-collapse mt-2 ${isExpanded ? 'show' : ''}`} id={`${period}-bp-collapse`}>
          <div className="bp-form-row">
            <div className="bp-input-group">
              <label htmlFor={`${period}-systolic`}>Systolic</label>
              <input 
                id={`${period}-systolic`}
                type="number" 
                className="form-control bp-input-narrow" 
                placeholder="Sys"
                value={data.systolic}
                onChange={(e) => handleBPChange(period, 'systolic', e.target.value)}
              />
            </div>
            
            <div className="bp-input-group">
              <label htmlFor={`${period}-diastolic`}>Diastolic</label>
              <input 
                id={`${period}-diastolic`}
                type="number" 
                className="form-control bp-input-narrow" 
                placeholder="Dia"
                value={data.diastolic}
                onChange={(e) => handleBPChange(period, 'diastolic', e.target.value)}
              />
            </div>
            
            <div className="bp-input-group">
              <label htmlFor={`${period}-heartrate`}>Heart Rate</label>
              <input 
                id={`${period}-heartrate`}
                type="number" 
                className="form-control bp-input-narrow" 
                placeholder="HR"
                value={data.heartRate}
                onChange={(e) => handleBPChange(period, 'heartRate', e.target.value)}
              />
            </div>
          </div>
          
          <div className="bp-time-row">
            <div className="bp-input-group flex-grow-1">
              <label htmlFor={`${period}-time`} className="small">Time</label>
              <input 
                id={`${period}-time`}
                type="time" 
                className="form-control bp-input-time" 
                value={formatTimeValue(data.time)}
                onChange={(e) => handleBPChange(period, 'time', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Fix the useEffect to ensure proper data structure and time formatting
  useEffect(() => {
    const todayRecord = getTodayRecord();
    if (todayRecord?.healthMetrics?.bloodPressure) {
      const bp = todayRecord.healthMetrics.bloodPressure;
      
      // Create a properly formatted BP data structure
      const formattedBpData = {
        morning: { 
          systolic: bp.morning?.systolic || '', 
          diastolic: bp.morning?.diastolic || '', 
          heartRate: bp.morning?.heartRate || '', 
          time: formatTimeValue(bp.morning?.time || '')
        },
        afternoon: { 
          systolic: bp.afternoon?.systolic || '', 
          diastolic: bp.afternoon?.diastolic || '', 
          heartRate: bp.afternoon?.heartRate || '', 
          time: formatTimeValue(bp.afternoon?.time || '')
        },
        evening: { 
          systolic: bp.evening?.systolic || '', 
          diastolic: bp.evening?.diastolic || '', 
          heartRate: bp.evening?.heartRate || '', 
          time: formatTimeValue(bp.evening?.time || '')
        }
      };
      
      setMetrics({ bloodPressure: formattedBpData });
    }
  }, []);

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="mb-0">Health Metrics - {format(new Date(), 'MM/dd/yyyy')}</h5>
      </div>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="mb-0">Blood Pressure</h6>
          <small className="text-muted d-md-none">Tap to expand/collapse</small>
        </div>
        
        <div className="bp-form-container">
          {renderBPSection('morning', 'Morning')}
          {renderBPSection('afternoon', 'Afternoon')}
          {renderBPSection('evening', 'Evening')}
        </div>
        
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
