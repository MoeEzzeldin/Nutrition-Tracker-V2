import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format, parseISO } from 'date-fns';

export const exportToPDF = (records) => {
  const doc = new jsPDF();
  
  // Color palette - simplified for better readability
  const colors = {
    primary: [106, 27, 154],
    primaryLight: [139, 63, 191],
    secondary: [245, 245, 245],
    background: [255, 255, 255],
    text: [33, 33, 33],
    textLight: [100, 100, 100],
    success: [34, 197, 94],
    warning: [251, 146, 60],
    danger: [239, 68, 68],
    info: [59, 130, 246],
    lightGray: [250, 250, 250]
  };
  
  // White background for better readability
  doc.setFillColor(...colors.background);
  doc.rect(0, 0, 210, 297, 'F');
  
  // Header section
  drawHeader(doc, colors);
  
  // Summary section
  const summary = calculateSummary(records);
  drawSummarySection(doc, summary, colors);
  
  // Recent week overview
  drawWeekOverview(doc, records, colors);
  
  // Add new page for detailed records
  doc.addPage();
  drawDetailedRecords(doc, records, colors);
  
  // Save PDF
  doc.save(`nutrition-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

const drawHeader = (doc, colors) => {
  // Header background
  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, 210, 35, 'F');
  
  // Title
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.setFont(undefined, 'bold');
  doc.text('Nutrition Report', 20, 20);
  
  // Date range
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text(`Generated on ${format(new Date(), 'MMMM dd, yyyy')}`, 20, 28);
};

const drawSummarySection = (doc, summary, colors) => {
  let yPos = 50;
  
  // Section title
  doc.setFontSize(18);
  doc.setTextColor(...colors.text);
  doc.setFont(undefined, 'bold');
  doc.text('Summary Overview', 20, yPos);
  yPos += 15;
  
  // Summary cards in 2x2 grid
  const cards = [
    { 
      title: 'Average Daily Sodium', 
      value: `${summary.avgSodium}`,
      unit: 'mg',
      status: summary.avgSodium > 2300 ? 'danger' : summary.avgSodium > 1500 ? 'warning' : 'success'
    },
    { 
      title: 'Average Daily Potassium', 
      value: `${summary.avgPotassium}`,
      unit: 'mg',
      status: summary.avgPotassium < 2000 ? 'danger' : summary.avgPotassium < 3500 ? 'warning' : 'success'
    },
    { 
      title: 'Average Fluid Intake', 
      value: `${summary.avgFluid}`,
      unit: 'oz',
      status: summary.avgFluid < 50 ? 'danger' : summary.avgFluid < 64 ? 'warning' : 'success'
    },
    { 
      title: 'Days Tracked', 
      value: summary.daysTracked,
      unit: 'days',
      status: 'info'
    }
  ];
  
  cards.forEach((card, index) => {
    const x = index % 2 === 0 ? 20 : 110;
    const y = yPos + Math.floor(index / 2) * 35;
    
    // Card background
    doc.setFillColor(...colors.lightGray);
    doc.roundedRect(x, y, 80, 30, 3, 3, 'F');
    
    // Status indicator
    const statusColor = colors[card.status];
    doc.setFillColor(...statusColor);
    doc.circle(x + 5, y + 15, 2, 'F');
    
    // Card title
    doc.setFontSize(10);
    doc.setTextColor(...colors.textLight);
    doc.setFont(undefined, 'normal');
    doc.text(card.title, x + 10, y + 10);
    
    // Card value
    doc.setFontSize(16);
    doc.setTextColor(...colors.text);
    doc.setFont(undefined, 'bold');
    doc.text(`${card.value} ${card.unit}`, x + 10, y + 22);
  });
  
  yPos += 80;
  
  // Key insights
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Key Insights', 20, yPos);
  yPos += 8;
  
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...colors.textLight);
  
  // Sodium insight
  if (summary.avgSodium > 2300) {
    doc.setTextColor(...colors.danger);
    doc.text('⚠ Average sodium intake exceeds daily recommended limit (2300mg)', 25, yPos);
  } else if (summary.avgSodium > 1500) {
    doc.setTextColor(...colors.warning);
    doc.text('↑ Sodium intake is moderate but could be reduced', 25, yPos);
  } else {
    doc.setTextColor(...colors.success);
    doc.text('✓ Sodium intake is within healthy range', 25, yPos);
  }
  yPos += 6;
  
  // Potassium insight
  doc.setTextColor(...colors.textLight);
  if (summary.avgPotassium < 2000) {
    doc.setTextColor(...colors.danger);
    doc.text('⚠ Potassium intake is below recommended levels', 25, yPos);
  } else if (summary.avgPotassium < 3500) {
    doc.setTextColor(...colors.warning);
    doc.text('↑ Consider increasing potassium-rich foods', 25, yPos);
  } else {
    doc.setTextColor(...colors.success);
    doc.text('✓ Potassium intake is adequate', 25, yPos);
  }
  yPos += 6;
  
  // Fluid insight
  doc.setTextColor(...colors.textLight);
  if (summary.avgFluid < 50) {
    doc.setTextColor(...colors.danger);
    doc.text('⚠ Fluid intake is below recommended daily amount', 25, yPos);
  } else if (summary.avgFluid < 64) {
    doc.setTextColor(...colors.warning);
    doc.text('↑ Try to increase fluid intake to 64oz daily', 25, yPos);
  } else {
    doc.setTextColor(...colors.success);
    doc.text('✓ Fluid intake meets daily recommendations', 25, yPos);
  }
};

const drawWeekOverview = (doc, records, colors) => {
  let yPos = 185;
  
  // Section title
  doc.setFontSize(18);
  doc.setTextColor(...colors.text);
  doc.setFont(undefined, 'bold');
  doc.text('Last 7 Days Overview', 20, yPos);
  yPos += 10;
  
  // Get last 7 records
  const recentRecords = records.slice(0, 7);
  
  // Simple table format
  const tableData = recentRecords.map(record => {
    const totals = calculateTotals(record.meals);
    const fluid = record.fluidIntake?.entries?.reduce((sum, entry) => sum + entry.amount, 0) || 0;
    const bp = record.healthMetrics?.bloodPressure;
    
    let bpText = '-';
    if (bp?.morning?.systolic && bp?.morning?.diastolic) {
      bpText = `${bp.morning.systolic}/${bp.morning.diastolic}`;
    }
    
    return [
      format(parseISO(record.date), 'MMM dd'),
      `${totals.sodium.toFixed(0)}mg`,
      `${totals.potassium.toFixed(0)}mg`,
      `${fluid}oz`,
      bpText
    ];
  });
  
  doc.autoTable({
    startY: yPos,
    head: [['Date', 'Sodium', 'Potassium', 'Fluid', 'BP (AM)']],
    body: tableData,
    theme: 'striped',
    headStyles: { 
      fillColor: colors.primary,
      textColor: [255, 255, 255],
      fontSize: 12,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 11,
      textColor: colors.text,
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: colors.lightGray
    },
    margin: { left: 20, right: 20 }
  });
};

const drawDetailedRecords = (doc, records, colors) => {
  // Header for details page
  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, 210, 25, 'F');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.setFont(undefined, 'bold');
  doc.text('Detailed Daily Records', 20, 16);
  
  let yPos = 40;
  const pageHeight = 280;
  
  records.forEach((record, index) => {
    // Check if we need a new page
    if (yPos > pageHeight - 50) {
      doc.addPage();
      yPos = 20;
    }
    
    // Date header
    doc.setFillColor(...colors.primaryLight);
    doc.rect(20, yPos, 170, 8, 'F');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text(format(parseISO(record.date), 'EEEE, MMMM d, yyyy'), 25, yPos + 5.5);
    yPos += 15;
    
    // Daily totals
    const totals = calculateTotals(record.meals);
    doc.setFontSize(11);
    doc.setTextColor(...colors.text);
    doc.setFont(undefined, 'normal');
    
    // Nutrients row
    const nutrients = [
      { label: 'Calories:', value: totals.calories.toFixed(0) },
      { label: 'Sodium:', value: `${totals.sodium.toFixed(0)}mg` },
      { label: 'Potassium:', value: `${totals.potassium.toFixed(0)}mg` }
    ];
    
    let xPos = 25;
    nutrients.forEach(nutrient => {
      doc.setFont(undefined, 'bold');
      doc.text(nutrient.label, xPos, yPos);
      doc.setFont(undefined, 'normal');
      doc.text(nutrient.value, xPos + 25, yPos);
      xPos += 60;
    });
    yPos += 8;
    
    // Meals summary
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snacks'];
    let hasMeals = false;
    
    mealTypes.forEach(mealType => {
      if (record.meals?.[mealType]?.length > 0) {
        hasMeals = true;
        doc.setFont(undefined, 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...colors.primary);
        doc.text(`${mealType.charAt(0).toUpperCase() + mealType.slice(1)}:`, 30, yPos);
        yPos += 5;
        
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...colors.textLight);
        
        record.meals[mealType].forEach(item => {
          const itemText = `• ${item.name} (Na: ${parseFloat(item.sodium).toFixed(0)}mg, K: ${parseFloat(item.potassium).toFixed(0)}mg)`;
          doc.text(itemText, 35, yPos);
          yPos += 4;
        });
        yPos += 2;
      }
    });
    
    if (!hasMeals) {
      doc.setFontSize(9);
      doc.setTextColor(...colors.textLight);
      doc.text('No meals recorded', 30, yPos);
      yPos += 5;
    }
    
    // Health metrics
    if (record.healthMetrics?.bloodPressure || record.fluidIntake?.entries?.length > 0) {
      doc.setFont(undefined, 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...colors.primary);
      doc.text('Health Metrics:', 30, yPos);
      yPos += 5;
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...colors.textLight);
      
      // Blood pressure
      const bp = record.healthMetrics?.bloodPressure;
      if (bp) {
        ['morning', 'afternoon', 'evening'].forEach(period => {
          if (bp[period]?.systolic && bp[period]?.diastolic) {
            doc.text(`• ${period.charAt(0).toUpperCase() + period.slice(1)} BP: ${bp[period].systolic}/${bp[period].diastolic} at ${bp[period].time || 'N/A'}`, 35, yPos);
            yPos += 4;
          }
        });
      }
      
      // Fluid intake
      if (record.fluidIntake?.entries?.length > 0) {
        const totalFluid = record.fluidIntake.entries.reduce((sum, entry) => sum + entry.amount, 0);
        doc.text(`• Fluid intake: ${totalFluid}oz`, 35, yPos);
        yPos += 4;
      }
    }
    
    yPos += 10;
  });
  
  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(...colors.textLight);
    doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
  }
};

const calculateSummary = (records) => {
  let totalSodium = 0;
  let totalPotassium = 0;
  let totalFluid = 0;
  let fluidDays = 0;
  
  records.forEach(record => {
    const totals = calculateTotals(record.meals);
    totalSodium += totals.sodium;
    totalPotassium += totals.potassium;
    
    if (record.fluidIntake?.entries?.length > 0) {
      const dayFluid = record.fluidIntake.entries.reduce((sum, entry) => sum + entry.amount, 0);
      totalFluid += dayFluid;
      fluidDays++;
    }
  });
  
  return {
    avgSodium: records.length > 0 ? Math.round(totalSodium / records.length) : 0,
    avgPotassium: records.length > 0 ? Math.round(totalPotassium / records.length) : 0,
    avgFluid: fluidDays > 0 ? Math.round(totalFluid / fluidDays) : 0,
    daysTracked: records.length
  };
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
