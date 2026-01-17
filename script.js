// Global variables
let semesters = [];
let currentChart = null;

// Grade point mapping for S, A, B, C, D, E, F system (10-point scale)
const GRADE_POINTS = {
    'S': 10.0,
    'A': 9.0,
    'B': 8.0,
    'C': 7.0,
    'D': 6.0,
    'E': 5.0,
    'F': 0.0
};

// Grade descriptions
const GRADE_DESCRIPTIONS = {
    'S': 'Outstanding (90-100%)',
    'A': 'Excellent (80-89%)',
    'B': 'Good (70-79%)',
    'C': 'Average (60-69%)',
    'D': 'Below Average (50-59%)',
    'E': 'Pass (40-49%)',
    'F': 'Fail (Below 40%)'
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log("GPA Calculator initialized");
    
    // Load saved semesters from localStorage
    loadSavedSemesters();
    
    // Initialize event listeners
    setupEventListeners();
    
    // Calculate initial GPA
    calculateGPA();
});

// Set up event listeners
function setupEventListeners() {
    // Add event listeners to existing grade select elements
    document.querySelectorAll('.grade').forEach(select => {
        select.addEventListener('change', function() {
            const gradeValue = this.value;
            const row = this.closest('.subject-row');
            row.querySelector('.grade-point').textContent = gradeValue;
            calculateGPA();
        });
    });
    
    // Add event listeners to credit inputs
    document.querySelectorAll('.credit-hours').forEach(input => {
        input.addEventListener('input', calculateGPA);
        input.addEventListener('change', calculateGPA);
    });
    
    // Add event listeners to subject name inputs
    document.querySelectorAll('.subject-name').forEach(input => {
        input.addEventListener('input', calculateGPA);
    });
}

// Add a new subject row
function addSubject() {
    const subjectsContainer = document.getElementById('subjects-container');
    const subjectRow = document.createElement('div');
    subjectRow.className = 'subject-row';
    subjectRow.innerHTML = `
        <input type="text" class="subject-name" placeholder="Subject Name" value="New Subject">
        <input type="number" class="credit-hours" placeholder="Credits" min="1" max="10" value="3">
        <select class="grade">
            <option value="10">S (10.0)</option>
            <option value="9">A (9.0)</option>
            <option value="8" selected>B (8.0)</option>
            <option value="7">C (7.0)</option>
            <option value="6">D (6.0)</option>
            <option value="5">E (5.0)</option>
            <option value="0">F (0.0)</option>
        </select>
        <div class="grade-point">8.0</div>
        <button class="remove-subject" onclick="removeSubject(this)"><i class="fas fa-times"></i></button>
    `;
    
    subjectsContainer.appendChild(subjectRow);
    
    // Add event listeners to the new row
    const gradeSelect = subjectRow.querySelector('.grade');
    const creditInput = subjectRow.querySelector('.credit-hours');
    const subjectInput = subjectRow.querySelector('.subject-name');
    
    gradeSelect.addEventListener('change', function() {
        const gradeValue = this.value;
        this.closest('.subject-row').querySelector('.grade-point').textContent = gradeValue;
        calculateGPA();
    });
    
    creditInput.addEventListener('input', calculateGPA);
    creditInput.addEventListener('change', calculateGPA);
    subjectInput.addEventListener('input', calculateGPA);
    
    calculateGPA();
}

// Remove a subject row
function removeSubject(button) {
    const row = button.closest('.subject-row');
    if (document.querySelectorAll('.subject-row').length > 1) {
        row.remove();
        calculateGPA();
    } else {
        alert("You need at least one subject!");
    }
}

// Calculate semester GPA
function calculateGPA() {
    const subjectRows = document.querySelectorAll('.subject-row');
    let totalCreditPoints = 0;
    let totalCredits = 0;
    let subjects = [];
    
    subjectRows.forEach(row => {
        const subjectName = row.querySelector('.subject-name').value || "Unnamed Subject";
        const creditHours = parseFloat(row.querySelector('.credit-hours').value) || 0;
        const gradePoint = parseFloat(row.querySelector('.grade').value) || 0;
        
        if (creditHours > 0) {
            totalCreditPoints += creditHours * gradePoint;
            totalCredits += creditHours;
            
            subjects.push({
                name: subjectName,
                credits: creditHours,
                grade: gradePoint,
                points: creditHours * gradePoint
            });
        }
    });
    
    const gpa = totalCredits > 0 ? (totalCreditPoints / totalCredits).toFixed(2) : 0;
    
    // Update the result display
    document.getElementById('gpa-result').textContent = gpa;
    
    // Update grade text
    let gradeText = "";
    const gpaNum = parseFloat(gpa);
    if (gpaNum >= 9.0) {
        gradeText = "Outstanding";
    } else if (gpaNum >= 8.0) {
        gradeText = "Excellent";
    } else if (gpaNum >= 7.0) {
        gradeText = "Good";
    } else if (gpaNum >= 6.0) {
        gradeText = "Average";
    } else if (gpaNum >= 5.0) {
        gradeText = "Below Average";
    } else if (gpaNum > 0) {
        gradeText = "Needs Improvement";
    } else {
        gradeText = "No Data";
    }
    
    document.getElementById('grade-text').textContent = gradeText;
    
    const semesterName = document.getElementById('semester-name').value || "Current Semester";
    if (totalCredits > 0) {
        document.getElementById('result-details').innerHTML = 
            `Semester GPA for <strong>${semesterName}</strong>: ${gpa} based on ${subjectRows.length} subjects and ${totalCredits} credit hours.`;
    } else {
        document.getElementById('result-details').innerHTML = 
            `Add subjects and grades to calculate GPA`;
    }
    
    // Update the chart
    updateChart(subjects);
    
    return {
        gpa: parseFloat(gpa),
        totalCredits,
        subjectCount: subjectRows.length,
        subjects
    };
}

// Save the current semester
function saveSemester() {
    const semesterName = document.getElementById('semester-name').value || "Unnamed Semester";
    const result = calculateGPA();
    
    if (result.totalCredits === 0) {
        alert("Cannot save semester with 0 credits! Please add subjects with credits.");
        return;
    }
    
    if (result.gpa === 0) {
        alert("Cannot save semester with 0 GPA! Please check your grades.");
        return;
    }
    
    const semester = {
        id: Date.now(),
        name: semesterName,
        gpa: result.gpa,
        credits: result.totalCredits,
        subjectCount: result.subjectCount,
        subjects: result.subjects,
        date: new Date().toLocaleDateString()
    };
    
    // Add to semesters array
    semesters.push(semester);
    
    // Save to localStorage
    saveSemestersToStorage();
    
    // Update the semester list display
    updateSemesterList();
    
    // Show confirmation
    alert(`Semester "${semesterName}" saved with GPA ${result.gpa}`);
}

// Save semesters to localStorage
function saveSemestersToStorage() {
    try {
        localStorage.setItem('gpaSemesters', JSON.stringify(semesters));
    } catch (e) {
        console.error("Error saving to localStorage:", e);
    }
}

// Load saved semesters from localStorage
function loadSavedSemesters() {
    try {
        const saved = localStorage.getItem('gpaSemesters');
        if (saved) {
            semesters = JSON.parse(saved);
            console.log("Loaded semesters:", semesters.length);
        } else {
            semesters = [];
        }
        updateSemesterList();
    } catch (e) {
        console.error("Error loading from localStorage:", e);
        semesters = [];
        updateSemesterList();
    }
}

// Update the semester list display
function updateSemesterList() {
    const semesterList = document.getElementById('semester-list');
    semesterList.innerHTML = '';
    
    if (semesters.length === 0) {
        semesterList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No semesters saved yet. Calculate and save your first semester!</p>';
        return;
    }
    
    semesters.forEach(semester => {
        const semesterItem = document.createElement('div');
        semesterItem.className = 'semester-item';
        semesterItem.innerHTML = `
            <div class="semester-info">
                <div><strong>${semester.name}</strong></div>
                <div>${semester.subjectCount} Subjects | ${semester.credits} Credits</div>
                <small>Saved: ${semester.date}</small>
            </div>
            <div class="semester-gpa">${semester.gpa.toFixed(2)}</div>
        `;
        semesterList.appendChild(semesterItem);
    });
}

// Calculate CGPA
function calculateCGPA() {
    if (semesters.length === 0) {
        alert("No semesters saved yet. Please save at least one semester first.");
        return;
    }
    
    let totalCreditPoints = 0;
    let totalCredits = 0;
    
    semesters.forEach(semester => {
        totalCreditPoints += semester.gpa * semester.credits;
        totalCredits += semester.credits;
    });
    
    const cgpa = totalCredits > 0 ? (totalCreditPoints / totalCredits).toFixed(2) : 0;
    
    // Display CGPA result
    const cgpaResultDiv = document.getElementById('cgpa-result');
    const cgpaValue = document.getElementById('cgpa-value');
    
    cgpaResultDiv.style.display = 'block';
    cgpaValue.innerHTML = `
        <strong>CGPA: ${cgpa} / 10.0</strong><br>
        Based on ${semesters.length} semesters and ${totalCredits} total credits.<br>
        <small>Total Grade Points: ${totalCreditPoints.toFixed(2)}</small>
    `;
    
    // Also update main display
    document.getElementById('gpa-result').textContent = cgpa;
    document.getElementById('grade-text').textContent = "Cumulative GPA";
    
    let cgpaText = "";
    const cgpaNum = parseFloat(cgpa);
    if (cgpaNum >= 9.0) cgpaText = "First Class with Distinction";
    else if (cgpaNum >= 8.0) cgpaText = "First Class";
    else if (cgpaNum >= 7.0) cgpaText = "Second Class";
    else if (cgpaNum >= 6.0) cgpaText = "Third Class";
    else if (cgpaNum >= 5.0) cgpaText = "Pass";
    else cgpaText = "Need Improvement";
    
    document.getElementById('result-details').innerHTML = 
        `<strong>Cumulative GPA (CGPA)</strong>: ${cgpa} based on ${semesters.length} semesters and ${totalCredits} total credits.<br>
        <strong>Academic Standing</strong>: ${cgpaText}`;
    
    // Update chart to show CGPA breakdown
    updateCGPAChart();
    
    return cgpa;
}

// Update the GPA chart
function updateChart(subjects) {
    const ctx = document.getElementById('gpaChart').getContext('2d');
    
    // Destroy previous chart if exists
    if (currentChart) {
        currentChart.destroy();
    }
    
    if (!subjects || subjects.length === 0) {
        // Create empty chart
        currentChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['No Data'],
                datasets: [{
                    label: 'Grade Points',
                    data: [0],
                    backgroundColor: ['#cccccc'],
                    borderColor: ['#999999'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10,
                        title: {
                            display: true,
                            text: 'Grade Points (out of 10)'
                        }
                    }
                }
            }
        });
        return;
    }
    
    // Prepare chart data
    const labels = subjects.map(subject => subject.name);
    const data = subjects.map(subject => subject.grade);
    const backgroundColors = subjects.map((_, index) => {
        const colors = ['#4361ee', '#3a0ca3', '#4cc9f0', '#7209b7', '#f72585', '#4895ef'];
        return colors[index % colors.length];
    });
    
    currentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Grade Points',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: backgroundColors.map(color => color.replace('0.8', '1')),
                borderWidth: 1,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Grade: ${context.raw}/10 | Credits: ${subjects[context.dataIndex].credits}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10,
                    title: {
                        display: true,
                        text: 'Grade Points (out of 10)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Subjects'
                    }
                }
            }
        }
    });
}

// Update chart for CGPA visualization
function updateCGPAChart() {
    const ctx = document.getElementById('gpaChart').getContext('2d');
    
    // Destroy previous chart if exists
    if (currentChart) {
        currentChart.destroy();
    }
    
    if (semesters.length === 0) {
        updateChart([]);
        return;
    }
    
    // Prepare chart data
    const labels = semesters.map(semester => semester.name);
    const data = semesters.map(semester => semester.gpa);
    
    // Calculate CGPA
    let totalPoints = 0;
    let totalCredits = 0;
    semesters.forEach(semester => {
        totalPoints += semester.gpa * semester.credits;
        totalCredits += semester.credits;
    });
    const cgpa = totalCredits > 0 ? (totalPoints / totalCredits) : 0;
    
    // Add CGPA to the data
    labels.push('CGPA');
    data.push(cgpa);
    
    const backgroundColors = semesters.map((_, index) => {
        const colors = ['#4361ee', '#3a0ca3', '#4cc9f0', '#7209b7', '#f72585', '#4895ef'];
        return colors[index % colors.length];
    });
    backgroundColors.push('#20c997'); // Different color for CGPA
    
    currentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'GPA',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: backgroundColors.map(color => color.replace('0.8', '1')),
                borderWidth: 1,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10,
                    title: {
                        display: true,
                        text: 'Grade Points (out of 10)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Semesters'
                    }
                }
            }
        }
    });
}

// Calculate target GPA
function calculateTargetGPA() {
    const currentCGPA = parseFloat(document.getElementById('current-cgpa').value);
    const completedCredits = parseFloat(document.getElementById('completed-credits').value);
    const targetCGPA = parseFloat(document.getElementById('target-cgpa').value);
    const futureCredits = parseFloat(document.getElementById('future-credits').value);
    
    if (isNaN(currentCGPA) || isNaN(completedCredits) || isNaN(targetCGPA) || isNaN(futureCredits)) {
        alert("Please fill in all fields with valid numbers.");
        return;
    }
    
    if (completedCredits < 0 || futureCredits <= 0) {
        alert("Credits must be positive numbers.");
        return;
    }
    
    // Calculate required GPA
    // Formula: (targetCGPA * (completedCredits + futureCredits) - currentCGPA * completedCredits) / futureCredits
    const requiredGPA = (targetCGPA * (completedCredits + futureCredits) - currentCGPA * completedCredits) / futureCredits;
    
    const targetResult = document.getElementById('target-result');
    
    if (requiredGPA > 10.0) {
        targetResult.innerHTML = `
            <h4><i class="fas fa-exclamation-triangle"></i> Target Unachievable</h4>
            <p>To reach a CGPA of ${targetCGPA} after ${futureCredits} more credits, you would need a GPA of <strong>${requiredGPA.toFixed(2)}</strong>, which is above the maximum possible GPA of 10.0.</p>
            <p>Consider revising your target or taking more credits to improve your CGPA.</p>
        `;
    } else if (requiredGPA < 0) {
        targetResult.innerHTML = `
            <h4><i class="fas fa-check-circle"></i> Target Already Achieved</h4>
            <p>You have already achieved a CGPA higher than your target! Your current CGPA of ${currentCGPA} is already above ${targetCGPA}.</p>
        `;
    } else {
        let difficulty = "";
        if (requiredGPA >= 9.0) difficulty = "Outstanding performance required (S Grade)";
        else if (requiredGPA >= 8.0) difficulty = "Excellent performance required (A Grade)";
        else if (requiredGPA >= 7.0) difficulty = "Good performance required (B Grade)";
        else if (requiredGPA >= 6.0) difficulty = "Average performance required (C Grade)";
        else if (requiredGPA >= 5.0) difficulty = "Below average performance required (D Grade)";
        else difficulty = "Minimal effort required";
        
        targetResult.innerHTML = `
            <h4><i class="fas fa-bullseye"></i> Target Analysis</h4>
            <p>To reach a CGPA of <strong>${targetCGPA}/10.0</strong> after <strong>${futureCredits}</strong> more credits, you need to maintain a GPA of:</p>
            <div style="font-size: 2rem; font-weight: bold; color: #4361ee; margin: 10px 0;">${requiredGPA.toFixed(2)} / 10.0</div>
            <p><strong>Difficulty:</strong> ${difficulty}</p>
            <p><strong>Current Status:</strong> ${currentCGPA} CGPA with ${completedCredits} completed credits</p>
        `;
    }
    
    targetResult.style.display = 'block';
}

// Add a new empty semester
function addNewSemester() {
    // Reset the semester form
    document.getElementById('semester-name').value = `Semester ${semesters.length + 1}`;
    document.getElementById('subjects-container').innerHTML = '';
    
    // Add three default subjects
    for (let i = 0; i < 3; i++) {
        addSubject();
    }
    
    // Update the GPA calculation
    calculateGPA();
    
    alert("New semester form ready. Add your subjects and grades, then save when ready.");
}

// Clear all saved semesters
function clearAllSemesters() {
    if (confirm("Are you sure you want to delete all saved semesters? This action cannot be undone.")) {
        semesters = [];
        saveSemestersToStorage();
        updateSemesterList();
        document.getElementById('cgpa-result').style.display = 'none';
        alert("All semesters have been cleared.");
    }
}

// Reset the calculator
function resetCalculator() {
    if (confirm("Reset the current semester form? This will clear all subjects.")) {
        document.getElementById('semester-name').value = "New Semester";
        document.getElementById('subjects-container').innerHTML = '';
        
        // Add one default subject
        addSubject();
        
        calculateGPA();
    }
}

// Export results as PDF
function exportAsPDF() {
    // Check if jsPDF is available
    if (typeof window.jspdf === 'undefined') {
        alert("PDF export library not loaded. Please check your internet connection.");
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Get current data
    const semesterName = document.getElementById('semester-name').value || "Current Semester";
    const gpa = document.getElementById('gpa-result').textContent;
    const gradeText = document.getElementById('grade-text').textContent;
    const resultDetails = document.getElementById('result-details').textContent;
    
    // Add title
    doc.setFontSize(20);
    doc.setTextColor(67, 97, 238); // Primary color
    doc.text("GPA & CGPA Calculator Report", 20, 20);
    
    // Add semester info
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Semester: ${semesterName}`, 20, 40);
    doc.text(`GPA: ${gpa}/10.0`, 20, 50);
    doc.text(`Status: ${gradeText}`, 20, 60);
    
    // Add result details
    doc.setFontSize(12);
    doc.text(resultDetails, 20, 75, { maxWidth: 170 });
    
    // Add subjects table if available
    const subjectRows = document.querySelectorAll('.subject-row');
    if (subjectRows.length > 0) {
        const tableData = [];
        subjectRows.forEach(row => {
            const subjectName = row.querySelector('.subject-name').value || "Unnamed";
            const credits = row.querySelector('.credit-hours').value || "0";
            const grade = row.querySelector('.grade').value || "0.0";
            const gradePoint = row.querySelector('.grade-point').textContent || "0.0";
            
            tableData.push([subjectName, credits, grade, gradePoint]);
        });
        
        // Add table header
        doc.autoTable({
            startY: 90,
            head: [['Subject', 'Credits', 'Grade', 'Grade Points']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [67, 97, 238] }
        });
    }
    
    // Add CGPA info if semesters exist
    if (semesters.length > 0) {
        const cgpaData = [];
        semesters.forEach(semester => {
            cgpaData.push([semester.name, semester.credits, semester.gpa.toFixed(2)]);
        });
        
        // Calculate CGPA
        let totalPoints = 0;
        let totalCredits = 0;
        semesters.forEach(semester => {
            totalPoints += semester.gpa * semester.credits;
            totalCredits += semester.credits;
        });
        const cgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
        
        const finalY = doc.lastAutoTable.finalY || 120;
        doc.text("Cumulative GPA (CGPA) Summary", 20, finalY + 10);
        
        doc.autoTable({
            startY: finalY + 15,
            head: [['Semester', 'Credits', 'GPA']],
            body: cgpaData,
            foot: [['CGPA', totalCredits, cgpa]],
            theme: 'striped',
            headStyles: { fillColor: [58, 12, 163] },
            footStyles: { fillColor: [76, 201, 240] }
        });
    }
    
    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text("Generated by Interactive GPA & CGPA Calculator", 20, doc.internal.pageSize.height - 10);
        doc.text(`Page ${i} of ${pageCount}`, 180, doc.internal.pageSize.height - 10, null, null, "right");
    }
    
    // Save the PDF
    doc.save(`GPA_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// Share results
function shareResults() {
    const gpa = document.getElementById('gpa-result').textContent;
    const semesterName = document.getElementById('semester-name').value || "Current Semester";
    const gradeText = document.getElementById('grade-text').textContent;
    
    const shareText = `My ${semesterName} GPA is ${gpa}/10.0 (${gradeText}) calculated using the Interactive GPA Calculator.`;
    
    if (navigator.share) {
        navigator.share({
            title: 'My GPA Results',
            text: shareText,
            url: window.location.href
        })
        .then(() => console.log('Successful share'))
        .catch((error) => {
            console.log('Error sharing:', error);
            copyToClipboard(shareText);
        });
    } else {
        copyToClipboard(shareText);
    }
}

// Copy text to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => alert("Results copied to clipboard!"))
        .catch(err => {
            console.error('Could not copy text: ', err);
            alert("Could not copy to clipboard. Please copy manually.");
        });
}

// Print results
function printResults() {
    const printContent = `
        <html>
        <head>
            <title>GPA Calculator Results</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #4361ee; }
                .gpa { font-size: 36px; font-weight: bold; margin: 20px 0; }
                .details { margin: 20px 0; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #4361ee; color: white; }
                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <h1>GPA Calculator Results</h1>
            <div class="gpa">GPA: ${document.getElementById('gpa-result').textContent}/10.0</div>
            <div class="details">${document.getElementById('result-details').innerHTML}</div>
            
            <h2>Subjects</h2>
            <table>
                <tr>
                    <th>Subject</th>
                    <th>Credits</th>
                    <th>Grade</th>
                    <th>Grade Points</th>
                </tr>
                ${Array.from(document.querySelectorAll('.subject-row')).map(row => `
                    <tr>
                        <td>${row.querySelector('.subject-name').value}</td>
                        <td>${row.querySelector('.credit-hours').value}</td>
                        <td>${row.querySelector('.grade').value}</td>
                        <td>${row.querySelector('.grade-point').textContent}</td>
                    </tr>
                `).join('')}
            </table>
            
            <div class="no-print">
                <p><em>Printed from Interactive GPA & CGPA Calculator</em></p>
            </div>
        </body>
        </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
}