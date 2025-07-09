import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format, parseISO } from 'date-fns';

export const exportToPDF = (records) => {
  const doc = new jsPDF();
  
  // Set dark background
  doc.setFillColor(33, 33, 33); // #212121
  doc.rect(0, 0, 210, 297, 'F');
  
  // Add title with purple accent
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text('Nutrition Tracker', 14, 20);
  
  // Add subtitle
  doc.setFontSize(14);
  doc.setTextColor(176, 176, 176);
  doc.text('7-Day History Report', 14, 28);
  
  // Add date
  doc.setFontSize(10);
  doc.text(`Generated: ${format(new Date(), 'MM/dd/yyyy HH:mm')}`, 14, 36);
  
  // Prepare detailed table data
  const tableData = [];
  
  records.forEach(record => {
    const totals = calculateTotals(record.meals);
    const bp = record.healthMetrics?.bloodPressure;
    
    let fluid = 0;
    if (record.fluidIntake?.entries) {
      fluid = record.fluidIntake.entries.reduce((sum, entry) => sum + entry.amount, 0);
    } else if (record.healthMetrics?.fluidIntake) {
      fluid = record.healthMetrics.fluidIntake.reduce((t, f) => t + (parseFloat(f.ounces) || 0), 0);
    }
    
    // Format blood pressure display
    let bpMorning = '-', bpAfternoon = '-', bpEvening = '-';
    if (bp) {
      if (bp.morning && bp.morning.systolic && bp.morning.diastolic) {
        bpMorning = `${bp.morning.systolic}/${bp.morning.diastolic}`;
        if (bp.morning.heartRate) bpMorning += ` (${bp.morning.heartRate})`;
      }
      if (bp.afternoon && bp.afternoon.systolic && bp.afternoon.diastolic) {
        bpAfternoon = `${bp.afternoon.systolic}/${bp.afternoon.diastolic}`;
        if (bp.afternoon.heartRate) bpAfternoon += ` (${bp.afternoon.heartRate})`;
      }
      if (bp.evening && bp.evening.systolic && bp.evening.diastolic) {
        bpEvening = `${bp.evening.systolic}/${bp.evening.diastolic}`;
        if (bp.evening.heartRate) bpEvening += ` (${bp.evening.heartRate})`;
      }
      
      // Old format compatibility
      if (!bp.morning && !bp.afternoon && !bp.evening && bp.systolic && bp.diastolic) {
        bpMorning = `${bp.systolic}/${bp.diastolic}`;
        if (bp.heartRate) bpMorning += ` (${bp.heartRate})`;
      }
    }
    
    tableData.push([
      format(parseISO(record.date), 'MM/dd/yyyy'),
      `${totals.sodium.toFixed(0)} mg`,
      `${totals.potassium.toFixed(0)} mg`,
      bpMorning,
      bpAfternoon,
      bpEvening,
      `${fluid} oz`
    ]);
  });
  
  // Add main table with dark theme
  doc.autoTable({
    startY: 45,
    head: [['Date', 'Sodium', 'Potassium', 'BP Morning', 'BP Afternoon', 'BP Evening', 'Fluid']],
    body: tableData,
    theme: 'grid',
    headStyles: { 
      fillColor: [106, 27, 154], // Purple header
      textColor: [255, 255, 255],
      fontSize: 11,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fillColor: [45, 45, 45], // Dark background
      textColor: [255, 255, 255],
      fontSize: 10
    },
    alternateRowStyles: {
      fillColor: [56, 56, 56] // Slightly lighter for alternate rows
    },
    styles: {
      lineColor: [66, 66, 66],
      lineWidth: 0.5
    }
  });
  
  // Add meals breakdown section
  let yPosition = doc.lastAutoTable.finalY + 15;
  
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('Daily Meals Breakdown', 14, yPosition);
  yPosition += 10;
  
  records.forEach((record, _index) => {
    if (yPosition > 250) {
      doc.addPage();
      doc.setFillColor(33, 33, 33);
      doc.rect(0, 0, 210, 297, 'F');
      yPosition = 20;
    }
    
    // Date header
    doc.setFontSize(12);
    doc.setTextColor(106, 27, 154); // Purple accent
    doc.text(format(parseISO(record.date), 'EEEE, MMMM d, yyyy'), 14, yPosition);
    yPosition += 8;
    
    // Meals for this day
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snacks'];
    mealTypes.forEach(mealType => {
      if (record.meals && record.meals[mealType] && record.meals[mealType].length > 0) {
        doc.setFontSize(10);
        doc.setTextColor(176, 176, 176);
        doc.text(mealType.charAt(0).toUpperCase() + mealType.slice(1) + ':', 20, yPosition);
        yPosition += 5;
        
        record.meals[mealType].forEach(item => {
          doc.setFontSize(9);
          doc.setTextColor(255, 255, 255);
          const itemText = `• ${item.name} - Na: ${parseFloat(item.sodium).toFixed(0)}mg, K: ${parseFloat(item.potassium).toFixed(0)}mg`;
          doc.text(itemText, 25, yPosition);
          yPosition += 5;
        });
        yPosition += 2;
      }
    });
    
    yPosition += 5;
  });
  
  // Add summary statistics
  if (yPosition > 240) {
    doc.addPage();
    doc.setFillColor(33, 33, 33);
    doc.rect(0, 0, 210, 297, 'F');
    yPosition = 20;
  }
  
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('Summary Statistics', 14, yPosition);
  yPosition += 10;
  
  // Calculate averages
  const avgSodium = records.reduce((sum, r) => sum + calculateTotals(r.meals).sodium, 0) / records.length || 0;
  const avgPotassium = records.reduce((sum, r) => sum + calculateTotals(r.meals).potassium, 0) / records.length || 0;
  
  let totalFluid = 0;
  let fluidDays = 0;
  records.forEach(record => {
    let dayFluid = 0;
    if (record.fluidIntake?.entries) {
      dayFluid = record.fluidIntake.entries.reduce((sum, entry) => sum + entry.amount, 0);
    } else if (record.healthMetrics?.fluidIntake) {
      dayFluid = record.healthMetrics.fluidIntake.reduce((t, f) => t + (parseFloat(f.ounces) || 0), 0);
    }
    if (dayFluid > 0) {
      totalFluid += dayFluid;
      fluidDays++;
    }
  });
  const avgFluid = fluidDays > 0 ? totalFluid / fluidDays : 0;
  
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(`Average Daily Sodium: ${avgSodium.toFixed(0)} mg`, 20, yPosition);
  yPosition += 7;
  doc.text(`Average Daily Potassium: ${avgPotassium.toFixed(0)} mg`, 20, yPosition);
  yPosition += 7;
  doc.text(`Average Daily Fluid Intake: ${avgFluid.toFixed(0)} oz`, 20, yPosition);
  yPosition += 7;
  doc.text(`Total Days Tracked: ${records.length}`, 20, yPosition);
  
  // Add footer
  doc.setFontSize(8);
  doc.setTextColor(176, 176, 176);
  doc.text('Nutrition Tracker - Generated Report', 105, 290, { align: 'center' });
  
  // Save PDF
  doc.save(`nutrition-history-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

const calculateTotals = (meals) => {
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
