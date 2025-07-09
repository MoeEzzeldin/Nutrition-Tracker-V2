import React, { useState, useEffect } from 'react';
import { getTodayRecord, saveRecord } from '../utils/storage';
import { format } from 'date-fns';

const FluidIntake = ({ onUpdate }) => {
  const [fluidData, setFluidData] = useState({
    goal: 66,
    entries: []
  });

  useEffect(() => {
    const todayRecord = getTodayRecord();
    if (todayRecord?.fluidIntake) {
      setFluidData(todayRecord.fluidIntake);
    }
  }, []);

  const handleAddFluid = (amount) => {
    const entry = {
      time: format(new Date(), 'HH:mm'),
      amount: amount,
      timestamp: new Date().toISOString()
    };

    const updatedData = {
      ...fluidData,
      entries: [...fluidData.entries, entry]
    };
    
    setFluidData(updatedData);
    saveFluidData(updatedData);
  };

  const handleQuickAdd = (ounces) => {
    handleAddFluid(ounces);
  };

  const handleCustomAdd = () => {
    const amount = prompt('Enter fluid amount in ounces:');
    if (amount && !isNaN(amount) && parseFloat(amount) > 0) {
      handleAddFluid(parseFloat(amount));
    }
  };

  const handleRemoveEntry = (index) => {
    const updatedData = {
      ...fluidData,
      entries: fluidData.entries.filter((_, i) => i !== index)
    };
    setFluidData(updatedData);
    saveFluidData(updatedData);
  };

  const handleGoalChange = () => {
    const newGoal = prompt('Enter daily fluid goal in ounces:', fluidData.goal);
    if (newGoal && !isNaN(newGoal) && parseFloat(newGoal) > 0) {
      const updatedData = {
        ...fluidData,
        goal: parseFloat(newGoal)
      };
      setFluidData(updatedData);
      saveFluidData(updatedData);
    }
  };

  const handleClearAll = () => {
    const confirmMessage = 'Are you sure you want to clear all fluid intake entries for today?';
    if (window.confirm(confirmMessage)) {
      const clearedData = {
        goal: fluidData.goal,
        entries: []
      };
      setFluidData(clearedData);
      saveFluidData(clearedData);
    }
  };

  const saveFluidData = (updatedFluidData) => {
    const todayRecord = getTodayRecord();
    const record = {
      date: format(new Date(), 'yyyy-MM-dd'),
      meals: todayRecord?.meals || { breakfast: [], lunch: [], dinner: [], snacks: [] },
      healthMetrics: todayRecord?.healthMetrics || {
        bloodPressure: {
          morning: { systolic: '', diastolic: '', heartRate: '', time: '' },
          afternoon: { systolic: '', diastolic: '', heartRate: '', time: '' },
          evening: { systolic: '', diastolic: '', heartRate: '', time: '' }
        }
      },
      fluidIntake: updatedFluidData
    };
    saveRecord(record);
    onUpdate();
  };

  const getTotalFluid = () => {
    return fluidData.entries.reduce((total, entry) => total + entry.amount, 0);
  };

  const totalFluid = getTotalFluid();
  const percentComplete = Math.min((totalFluid / fluidData.goal) * 100, 100);
  const remaining = Math.max(fluidData.goal - totalFluid, 0);

  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('fluidIntakeExpanded');
    return saved !== null ? JSON.parse(saved) : true; // Default to expanded
  });

  useEffect(() => {
    localStorage.setItem('fluidIntakeExpanded', JSON.stringify(isExpanded));
  }, [isExpanded]);

  const toggleExpanded = () => {
    setIsExpanded(prev => !prev);
  };

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Fluid Intake</h5>
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-outline-light" onClick={handleGoalChange}>
            Goal: {fluidData.goal} oz
          </button>
          {fluidData.entries.length > 0 && (
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={handleClearAll}
              title="Clear all entries"
            >
              Clear All
            </button>
          )}
        </div>
      </div>
      <div className="card-body">
        <div className="mb-3">
          <div className="d-flex justify-content-between mb-2">
            <span className="text-muted">Progress</span>
            <span className="text-primary fw-bold">{totalFluid} / {fluidData.goal} oz</span>
          </div>
          <div className="progress" style={{ height: '25px' }}>
            <div
              className={`progress-bar ${percentComplete >= 100 ? 'bg-success' : 'bg-primary'}`}
              role="progressbar"
              style={{ width: `${percentComplete}%` }}
            >
              {percentComplete.toFixed(0)}%
            </div>
          </div>
          {remaining > 0 && (
            <small className="text-muted mt-1 d-block">
              {remaining} oz remaining to reach goal
            </small>
          )}
        </div>

        <div className="mb-3">
          <h6>Quick Add</h6>
          <div className="d-flex flex-wrap gap-2">
            <button className="btn fluid-quick-btn" onClick={() => handleQuickAdd(8)}>
              8 oz
            </button>
            <button className="btn fluid-quick-btn" onClick={() => handleQuickAdd(12)}>
              12 oz
            </button>
            <button className="btn fluid-quick-btn" onClick={() => handleQuickAdd(16)}>
              16 oz
            </button>
            <button className="btn fluid-quick-btn" onClick={() => handleQuickAdd(20)}>
              20 oz
            </button>
            <button className="btn fluid-quick-btn fluid-custom-btn" onClick={handleCustomAdd}>
              Custom
            </button>
          </div>
        </div>

        <div>
          <h6>Today&apos;s Intake</h6>
          {fluidData.entries.length === 0 ? (
            <p className="text-muted small">No entries yet. Start tracking your fluid intake!</p>
          ) : (
            <div className="fluid-entries" style={{ maxHeight: "200px", overflowY: "auto" }}>
              {fluidData.entries.map((entry, index) => (
                <div key={index} className="d-flex justify-content-between align-items-center mb-2 p-2 bg-dark rounded">
                  <div>
                    <span className="text-primary">{entry.amount} oz</span>
                    <small className="text-muted ms-2">at {entry.time}</small>
                  </div>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleRemoveEntry(index)}
                    aria-label="Remove entry"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-3 p-2 bg-dark rounded text-center">
          <small className="text-muted">
            💧 Tip: Aim to drink water consistently throughout the day
          </small>
        </div>
      </div>
    </div>
  );
};

export default FluidIntake;
