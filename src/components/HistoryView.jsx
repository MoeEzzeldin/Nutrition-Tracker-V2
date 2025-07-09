import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { deleteRecord, updateRecord } from '../utils/storage';
import { exportToPDF } from '../utils/pdfExport';

const HistoryView = ({ records, onUpdate }) => {
  const [editingRecord, setEditingRecord] = useState(null);

  const handleEdit = (record) => {
    setEditingRecord(record);
  };

  const handleSaveEdit = () => {
    if (editingRecord) {
      updateRecord(editingRecord);
      setEditingRecord(null);
      onUpdate();
    }
  };

  const handleDelete = (date) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      deleteRecord(date);
      onUpdate();
    }
  };

  const handleExportPDF = () => {
    exportToPDF(records);
  };

  const calculateDayTotals = (meals) => {
    let totals = { calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0, potassium: 0 };
    
    if (meals) {
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
    }
    
    return totals;
  };

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">7-Day History</h5>
        <button className="btn btn-primary btn-sm" onClick={handleExportPDF}>
          Export to PDF
        </button>
      </div>
      <div className="card-body">
        {records.length === 0 ? (
          <p className="text-muted">No records found.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark table-hover">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Sodium</th>
                  <th>Potassium</th>
                  <th>BP</th>
                  <th>Fluid</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => {
                  const totals = calculateDayTotals(record.meals);
                  const isEditing = editingRecord?.date === record.date;
                  
                  return (
                    <tr key={record.date}>
                      <td>{format(parseISO(record.date), 'MM/dd/yyyy')}</td>
                      <td>{totals.sodium.toFixed(0)}mg</td>
                      <td>{totals.potassium.toFixed(0)}mg</td>
                      <td>
                        {(() => {
                          const bp = record.healthMetrics?.bloodPressure;
                          if (!bp) return '-';
                          
                          // Check if using new format (3 times daily)
                          if (bp.morning || bp.afternoon || bp.evening) {
                            const readings = [bp.morning, bp.afternoon, bp.evening].filter(
                              r => r && r.systolic && r.diastolic
                            );
                            if (readings.length === 0) return '-';
                            
                            const avgSystolic = Math.round(
                              readings.reduce((sum, r) => sum + parseFloat(r.systolic), 0) / readings.length
                            );
                            const avgDiastolic = Math.round(
                              readings.reduce((sum, r) => sum + parseFloat(r.diastolic), 0) / readings.length
                            );
                            return `${avgSystolic}/${avgDiastolic} (${readings.length}/3)`;
                          }
                          
                          // Old format compatibility
                          if (bp.systolic && bp.diastolic) {
                            return `${bp.systolic}/${bp.diastolic}`;
                          }
                          
                          return '-';
                        })()}
                      </td>
                      <td>
                        {(() => {
                          // New fluid intake format
                          if (record.fluidIntake?.entries) {
                            const total = record.fluidIntake.entries.reduce((sum, entry) => sum + entry.amount, 0);
                            return `${total} oz`;
                          }
                          // Old format compatibility
                          if (record.healthMetrics?.fluidIntake) {
                            const total = record.healthMetrics.fluidIntake.reduce((t, f) => t + (parseFloat(f.ounces) || 0), 0);
                            return `${total} oz`;
                          }
                          return '-';
                        })()}
                      </td>
                      <td>
                        {isEditing ? (
                          <>
                            <button 
                              className="btn btn-sm btn-success me-2"
                              onClick={handleSaveEdit}
                            >
                              Save
                            </button>
                            <button 
                              className="btn btn-sm btn-secondary"
                              onClick={() => setEditingRecord(null)}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              className="btn btn-sm btn-warning me-2"
                              onClick={() => handleEdit(record)}
                            >
                              Edit
                            </button>
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(record.date)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryView;
