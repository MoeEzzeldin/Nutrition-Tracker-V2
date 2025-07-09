import React, { useState } from 'react';
import { saveRecord, getTodayRecord } from '../utils/storage';
import { format } from 'date-fns';
import SearchBar from './SearchBar';

const NutritionForm = ({ onUpdate }) => {
  const todayRecord = getTodayRecord();
  const [meals, setMeals] = useState(todayRecord?.meals || {
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: []
  });
  const [editingItem, setEditingItem] = useState(null);

  const handleAddFood = (foodItem) => {
    const mealType = foodItem.mealType || 'breakfast';
    const updatedMeals = {
      ...meals,
      [mealType]: [...meals[mealType], foodItem]
    };
    setMeals(updatedMeals);
    
    const record = {
      date: format(new Date(), 'yyyy-MM-dd'),
      meals: updatedMeals,
      healthMetrics: todayRecord?.healthMetrics || {}
    };
    
    saveRecord(record);
    onUpdate();
  };

  const handleRemoveFood = (mealType, index) => {
    const updatedMeals = {
      ...meals,
      [mealType]: meals[mealType].filter((_, i) => i !== index)
    };
    setMeals(updatedMeals);
    
    const record = {
      date: format(new Date(), 'yyyy-MM-dd'),
      meals: updatedMeals,
      healthMetrics: todayRecord?.healthMetrics || {}
    };
    
    saveRecord(record);
    onUpdate();
  };

  const handleEditFood = (mealType, index) => {
    setEditingItem({ mealType, index });
  };

  const handleSaveEdit = (mealType, index, updatedValues) => {
    const updatedMeals = {
      ...meals,
      [mealType]: meals[mealType].map((item, i) => 
        i === index ? { ...item, ...updatedValues } : item
      )
    };
    setMeals(updatedMeals);
    
    const record = {
      date: format(new Date(), 'yyyy-MM-dd'),
      meals: updatedMeals,
      healthMetrics: todayRecord?.healthMetrics || {}
    };
    
    saveRecord(record);
    onUpdate();
    setEditingItem(null);
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  const handleClearAll = () => {
    const confirmMessage = 'Are you sure you want to clear all meals for today?';
    if (window.confirm(confirmMessage)) {
      const clearedMeals = {
        breakfast: [],
        lunch: [],
        dinner: [],
        snacks: []
      };
      setMeals(clearedMeals);
      
      const todayRecord = getTodayRecord();
      const record = {
        date: format(new Date(), 'yyyy-MM-dd'),
        meals: clearedMeals,
        healthMetrics: todayRecord?.healthMetrics || {
          bloodPressure: {
            morning: { systolic: '', diastolic: '', heartRate: '', time: '' },
            afternoon: { systolic: '', diastolic: '', heartRate: '', time: '' },
            evening: { systolic: '', diastolic: '', heartRate: '', time: '' }
          }
        },
        fluidIntake: todayRecord?.fluidIntake || { goal: 66, entries: [] }
      };
      
      saveRecord(record);
      onUpdate();
    }
  };

  const calculateTotals = () => {
    let totals = { calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0, potassium: 0 };
    
    Object.values(meals).forEach(mealItems => {
      mealItems.forEach(item => {
        totals.calories += parseFloat(item.calories) || 0;
        totals.protein += parseFloat(item.protein) || 0;
        totals.carbs += parseFloat(item.carbs) || 0;
        totals.fat += parseFloat(item.fat) || 0;
        totals.sodium += parseFloat(item.sodium) || 0;
        totals.potassium += parseFloat(item.potassium) || 0;
      });
    });
    
    return totals;
  };

  const totals = calculateTotals();
  const hasMeals = Object.values(meals).some(mealType => mealType.length > 0);

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Today&apos;s Meals - {format(new Date(), 'MM/dd/yyyy')}</h5>
        {hasMeals && (
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={handleClearAll}
            title="Clear all meals"
          >
            Clear All
          </button>
        )}
      </div>
      <div className="card-body">
        <div className="mb-4 search-bar-container">
          <SearchBar 
            onSelectFood={handleAddFood} 
            placeholder="Search food..."
          />
        </div>
        
        {['breakfast', 'lunch', 'dinner', 'snacks'].map(mealType => (
          <div key={mealType} className="mb-4 p-3 border border-secondary rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <h6 className="text-capitalize mb-3 pb-2 border-bottom border-secondary">{mealType}</h6>
            <div className="mt-2">
              {meals[mealType].length === 0 ? (
                <p className="text-muted small mb-0">No items added yet</p>
              ) : (
                meals[mealType].map((item, index) => {
                  const isEditing = editingItem?.mealType === mealType && editingItem?.index === index;
                  
                  return (
                    <div key={index} className="d-flex justify-content-between align-items-center mb-2 p-2 bg-dark rounded">
                      <div className="flex-grow-1">
                        <span>{item.name}</span>
                        {isEditing ? (
                          <div className="mt-2 d-flex gap-2">
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              style={{ width: '100px' }}
                              placeholder="Sodium (mg)"
                              defaultValue={item.sodium}
                              id={`sodium-${mealType}-${index}`}
                            />
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              style={{ width: '100px' }}
                              placeholder="Potassium (mg)"
                              defaultValue={item.potassium}
                              id={`potassium-${mealType}-${index}`}
                            />
                          </div>
                        ) : null}
                      </div>
                      <div className="d-flex align-items-center">
                        {!isEditing && (
                          <span className="text-muted me-3">
                            Sodium: {parseFloat(item.sodium).toFixed(0)}mg | Potassium: {parseFloat(item.potassium).toFixed(0)}mg
                          </span>
                        )}
                        {isEditing ? (
                          <>
                            <button 
                              className="btn btn-sm btn-success me-2"
                              onClick={() => {
                                const sodiumInput = document.getElementById(`sodium-${mealType}-${index}`);
                                const potassiumInput = document.getElementById(`potassium-${mealType}-${index}`);
                                handleSaveEdit(mealType, index, {
                                  sodium: parseFloat(sodiumInput.value) || item.sodium,
                                  potassium: parseFloat(potassiumInput.value) || item.potassium
                                });
                              }}
                            >
                              Save
                            </button>
                            <button 
                              className="btn btn-sm btn-secondary me-2"
                              onClick={handleCancelEdit}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              className="btn btn-sm btn-warning me-2"
                              onClick={() => handleEditFood(mealType, index)}
                            >
                              Edit
                            </button>
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => handleRemoveFood(mealType, index)}
                            >
                              Remove
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
        
        <div className="mt-4 p-3 bg-dark rounded border border-primary">
          <h6 className="mb-3 text-primary">Daily Totals</h6>
          <div className="row">
            <div className="col-md-6">
              <small>Sodium: <span className="fw-bold text-warning">{totals.sodium.toFixed(0)}mg</span></small>
            </div>
            <div className="col-md-6">
              <small>Potassium: <span className="fw-bold text-info">{totals.potassium.toFixed(0)}mg</span></small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NutritionForm;
