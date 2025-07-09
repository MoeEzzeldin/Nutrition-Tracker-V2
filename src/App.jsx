import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import NutritionForm from './components/NutritionForm';
import HealthMetrics from './components/HealthMetrics';
import FluidIntake from './components/FluidIntake';
import HistoryView from './components/HistoryView';
import { cleanOldRecords, getRecords } from './utils/storage';

function App() {
  const [records, setRecords] = useState([]);
  const [activeTab, setActiveTab] = useState('today');
  useEffect(() => {
    cleanOldRecords();
    const savedRecords = getRecords();
    setRecords(savedRecords);
  }, []);

  const handleRecordUpdate = () => {
    const updatedRecords = getRecords();
    setRecords(updatedRecords);
  };

  return (
    <div className="App">
      <nav className="navbar navbar-dark bg-dark-purple">
        <div className="container">
          <span className="navbar-brand mb-0 h1">Nutrition Tracker</span>
        </div>
      </nav>

      <div className="container my-4">
        <ul className="nav nav-tabs nav-dark mb-4">
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'today' ? 'active' : ''}`}
              onClick={() => setActiveTab('today')}
            >
              Today&apos;s Entry
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              7-Day History
            </button>
          </li>
        </ul>

        <div className="content-wrapper">
          {activeTab === 'today' ? (
            <div>
              <div className="row mb-4">
                <div className="col-12">
                  <NutritionForm onUpdate={handleRecordUpdate} />
                </div>
              </div>
              <div className="row mb-4">
                <div className="col-12">
                  <HealthMetrics onUpdate={handleRecordUpdate} />
                </div>
              </div>
              <div className="row mb-4">
                <div className="col-12">
                  <FluidIntake onUpdate={handleRecordUpdate} />
                </div>
              </div>
            </div>
          ) : (
            <div className="row">
              <div className="col-12">
                <HistoryView records={records} onUpdate={handleRecordUpdate} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
