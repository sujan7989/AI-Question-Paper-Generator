// Kalasalingam University Question Paper - HTML Format for A4 Printing
// This generates a proper HTML document that prints perfectly on A4 paper

import { KalasalingamPaper, KalasalingamQuestion, calculateBloomsDistribution } from './kalasalingam-format';

/**
 * Generate HTML format for Kalasalingam question paper
 * Optimized for A4 printing
 */
export function generateKalasalingamHTML(paper: KalasalingamPaper): string {
  const { coDistribution, totalDistribution } = calculateBloomsDistribution(paper.questions);
  const totalMarks = paper.questions.reduce((sum, q) => sum + q.marks, 0);
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${paper.courseName} - Question Paper</title>
    <style>
        @page {
            size: A4;
            margin: 15mm 15mm 15mm 15mm;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.4;
            color: #000;
            background: #fff;
        }
        
        .container {
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
            padding: 10mm;
        }
        
        /* Header */
        .header {
            text-align: center;
            border: 2px solid #000;
            padding: 15px;
            margin-bottom: 20px;
        }
        
        .header h1 {
            font-size: 16pt;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .header p {
            font-size: 11pt;
            margin: 3px 0;
        }
        
        .exam-title {
            font-size: 12pt;
            font-weight: bold;
            margin-top: 10px;
        }
        
        /* Course Details */
        .course-details {
            margin: 20px 0;
            font-size: 11pt;
        }
        
        .course-details table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .course-details td {
            padding: 4px 8px;
        }
        
        .course-details .label {
            width: 120px;
            font-weight: normal;
        }
        
        .course-details .colon {
            width: 10px;
        }
        
        /* COs Section */
        .cos-section {
            border: 2px solid #000;
            margin: 20px 0;
            padding: 10px;
        }
        
        .cos-section h3 {
            font-size: 11pt;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .cos-section table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .cos-section td {
            padding: 5px;
            border: 1px solid #000;
        }
        
        .cos-section .co-label {
            width: 60px;
            font-weight: bold;
            text-align: center;
        }
        
        /* Part Title */
        .part-title {
            border: 2px solid #000;
            padding: 10px;
            margin: 20px 0 10px 0;
            text-align: center;
        }
        
        .part-title h2 {
            font-size: 12pt;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .part-title p {
            font-size: 11pt;
        }
        
        /* Questions Table */
        .questions-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 10pt;
        }
        
        .questions-table th,
        .questions-table td {
            border: 1px solid #000;
            padding: 8px 6px;
            text-align: left;
            vertical-align: top;
        }
        
        .questions-table th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
        }
        
        .questions-table .q-no {
            width: 40px;
            text-align: center;
        }
        
        .questions-table .q-text {
            width: auto;
        }
        
        .questions-table .q-pattern {
            width: 90px;
            text-align: center;
        }
        
        .questions-table .q-co {
            width: 70px;
            text-align: center;
        }
        
        .questions-table .q-marks {
            width: 50px;
            text-align: center;
        }
        
        /* Assessment Pattern Table */
        .assessment-section {
            margin: 30px 0;
        }
        
        .assessment-section h3 {
            font-size: 12pt;
            font-weight: bold;
            margin-bottom: 10px;
            text-align: center;
        }
        
        .assessment-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            font-size: 10pt;
        }
        
        .assessment-table th,
        .assessment-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: center;
        }
        
        .assessment-table th {
            background-color: #f0f0f0;
            font-weight: bold;
        }
        
        .assessment-table .co-col {
            width: 60px;
        }
        
        .assessment-table .total-row {
            font-weight: bold;
        }
        
        /* Footer */
        .footer {
            text-align: center;
            margin-top: 40px;
            font-size: 14pt;
            font-weight: bold;
        }
        
        /* Print Styles */
        @media print {
            body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
            
            .container {
                padding: 0;
            }
            
            .no-print {
                display: none;
            }
            
            .page-break {
                page-break-before: always;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>KALASALINGAM ACADEMY OF RESEARCH AND EDUCATION</h1>
            <p>(Deemed to be University)</p>
            <p>Anand Nagar, Krishnankoil-626 126</p>
            <p class="exam-title">${paper.examType} – ${paper.examMonth}</p>
        </div>
        
        <!-- Course Details -->
        <div class="course-details">
            <table>
                <tr>
                    <td class="label">Course Code</td>
                    <td class="colon">:</td>
                    <td>${paper.courseCode}</td>
                    <td class="label">Duration</td>
                    <td class="colon">:</td>
                    <td>${paper.duration}</td>
                </tr>
                <tr>
                    <td class="label">Course Name</td>
                    <td class="colon">:</td>
                    <td>${paper.courseName}</td>
                    <td class="label">Max. Marks</td>
                    <td class="colon">:</td>
                    <td>${paper.maxMarks}</td>
                </tr>
                <tr>
                    <td class="label">Degree</td>
                    <td class="colon">:</td>
                    <td>${paper.degree}</td>
                    <td class="label">Date & Session</td>
                    <td class="colon">:</td>
                    <td>${paper.dateSession}</td>
                </tr>
            </table>
        </div>
        
        <!-- COs Section -->
        <div class="cos-section">
            <h3>COs TO BE ASSESSED DURING ${paper.examType}:</h3>
            <table>
                ${paper.courseOutcomes.map(co => `
                <tr>
                    <td class="co-label">${co.co}</td>
                    <td>${co.description}</td>
                </tr>
                `).join('')}
            </table>
        </div>
        
        <!-- Part Title -->
        <div class="part-title">
            <h2>${paper.partTitle}</h2>
            <p>Answer ALL Questions</p>
        </div>
        
        <!-- Questions Table -->
        <table class="questions-table">
            <thead>
                <tr>
                    <th class="q-no">No</th>
                    <th class="q-text">Question</th>
                    <th class="q-pattern">Pattern</th>
                    <th class="q-co">Mapping<br/>COs</th>
                    <th class="q-marks">Marks</th>
                </tr>
            </thead>
            <tbody>
                ${paper.questions.map(q => `
                <tr>
                    <td class="q-no">${q.number}</td>
                    <td class="q-text">${q.question}</td>
                    <td class="q-pattern">${q.pattern}</td>
                    <td class="q-co">${q.mappingCO}</td>
                    <td class="q-marks">${q.marks}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        
        <!-- Assessment Pattern -->
        <div class="assessment-section">
            <h3>Assessment Pattern as per Bloom's Taxonomy:</h3>
            <table class="assessment-table">
                <thead>
                    <tr>
                        <th class="co-col">COs</th>
                        <th>Remember</th>
                        <th>Understand</th>
                        <th>Apply</th>
                        <th>Analyze</th>
                        <th>Evaluate</th>
                        <th>Create</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.keys(coDistribution).sort().map(co => {
                      const dist = coDistribution[co];
                      const coTotal = dist.remember + dist.understand + dist.apply + dist.analyze + dist.evaluate + dist.create;
                      return `
                    <tr>
                        <td class="co-col">${co}</td>
                        <td>${dist.remember || ''}</td>
                        <td>${dist.understand || ''}</td>
                        <td>${dist.apply || ''}</td>
                        <td>${dist.analyze || ''}</td>
                        <td>${dist.evaluate || ''}</td>
                        <td>${dist.create || ''}</td>
                        <td>${coTotal}</td>
                    </tr>
                      `;
                    }).join('')}
                    <tr class="total-row">
                        <td class="co-col">Total</td>
                        <td>${totalDistribution.remember || ''}</td>
                        <td>${totalDistribution.understand || ''}</td>
                        <td>${totalDistribution.apply || ''}</td>
                        <td>${totalDistribution.analyze || ''}</td>
                        <td>${totalDistribution.evaluate || ''}</td>
                        <td>${totalDistribution.create || ''}</td>
                        <td>${totalMarks}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            *****
        </div>
    </div>
</body>
</html>
  `;
}

/**
 * Convert HTML to printable format
 */
export function openPrintableQuestionPaper(htmlContent: string) {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  }
}

/**
 * Download as HTML file
 */
export function downloadAsHTML(htmlContent: string, filename: string) {
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
