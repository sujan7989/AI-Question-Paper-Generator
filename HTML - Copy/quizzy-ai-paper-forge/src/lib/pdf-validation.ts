// PDF validation and diagnostic utilities
import { Subject, SubjectUnit } from './subject-manager';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
  recommendations: string[];
}

/**
 * Validates if a subject is ready for question generation
 */
export function validateSubjectForGeneration(subject: Subject): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    info: [],
    recommendations: []
  };

  // Check if subject exists
  if (!subject) {
    result.isValid = false;
    result.errors.push('Subject not found');
    return result;
  }

  result.info.push(`Subject: ${subject.subject_name}`);
  result.info.push(`Course Code: ${subject.course_code}`);
  result.info.push(`Total Units: ${subject.total_units}`);

  // Check units existence
  if (!subject.units || subject.units.length === 0) {
    result.isValid = false;
    result.errors.push('Subject has no units');
    result.recommendations.push('Create a new subject with units in Subject Setup');
    return result;
  }

  result.info.push(`Units found: ${subject.units.length}`);

  // Check each unit for PDF content
  const unitsWithContent: SubjectUnit[] = [];
  const unitsWithoutContent: SubjectUnit[] = [];

  subject.units.forEach((unit) => {
    const hasContent = unit.extracted_content && 
                      (unit.extracted_content as any).text && 
                      (unit.extracted_content as any).text.length > 100;

    if (hasContent) {
      unitsWithContent.push(unit);
      const contentLength = (unit.extracted_content as any).text.length;
      result.info.push(`✅ ${unit.unit_name}: ${contentLength.toLocaleString()} characters`);
    } else {
      unitsWithoutContent.push(unit);
      result.warnings.push(`❌ ${unit.unit_name}: No PDF content`);
    }
  });

  // Evaluate results
  if (unitsWithContent.length === 0) {
    result.isValid = false;
    result.errors.push('No units have extracted PDF content');
    result.recommendations.push('Go to Subject Setup and create a new subject');
    result.recommendations.push('Upload PDF files for each unit');
    result.recommendations.push('Wait for "Subject created successfully!" message');
  } else if (unitsWithoutContent.length > 0) {
    result.warnings.push(`${unitsWithoutContent.length} units without PDF content`);
    result.recommendations.push('Questions from units without PDFs will be generic');
    result.recommendations.push('Consider re-uploading PDFs for missing units');
  } else {
    result.info.push('✅ All units have PDF content - ready for generation!');
  }

  return result;
}

/**
 * Validates if selected units are ready for generation
 */
export function validateSelectedUnits(
  subject: Subject,
  selectedUnitIds: string[],
  unitWeightages: Record<string, number>
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    info: [],
    recommendations: []
  };

  // First validate the subject
  const subjectValidation = validateSubjectForGeneration(subject);
  if (!subjectValidation.isValid) {
    return subjectValidation;
  }

  // Check if any units are selected
  if (selectedUnitIds.length === 0) {
    result.isValid = false;
    result.errors.push('No units selected');
    result.recommendations.push('Select at least one unit to generate questions from');
    return result;
  }

  result.info.push(`Selected units: ${selectedUnitIds.length}`);

  // Check weightages
  const totalWeightage = selectedUnitIds.reduce((sum, id) => {
    return sum + (unitWeightages[id] || 0);
  }, 0);

  if (Math.abs(totalWeightage - 100) > 0.01) {
    result.isValid = false;
    result.errors.push(`Unit weightages must total 100% (currently ${totalWeightage.toFixed(1)}%)`);
    result.recommendations.push('Adjust the weightage sliders to total exactly 100%');
    return result;
  }

  result.info.push(`Total weightage: ${totalWeightage.toFixed(1)}%`);

  // Check selected units for content
  const selectedUnits = subject.units?.filter(u => selectedUnitIds.includes(u.id)) || [];
  const unitsWithContent = selectedUnits.filter(u => 
    u.extracted_content && 
    (u.extracted_content as any).text && 
    (u.extracted_content as any).text.length > 100
  );

  if (unitsWithContent.length === 0) {
    result.isValid = false;
    result.errors.push('None of the selected units have PDF content');
    result.recommendations.push('Select different units that have PDF content');
    result.recommendations.push('Or re-create the subject with PDF uploads');
    return result;
  }

  if (unitsWithContent.length < selectedUnits.length) {
    result.warnings.push(`${selectedUnits.length - unitsWithContent.length} selected units have no PDF content`);
    result.recommendations.push('Questions from units without PDFs may be generic');
  }

  // Show content statistics
  selectedUnits.forEach(unit => {
    const hasContent = unitsWithContent.includes(unit);
    const weightage = unitWeightages[unit.id] || 0;
    if (hasContent) {
      const contentLength = (unit.extracted_content as any).text.length;
      result.info.push(`✅ ${unit.unit_name} (${weightage}%): ${contentLength.toLocaleString()} chars`);
    } else {
      result.warnings.push(`⚠️ ${unit.unit_name} (${weightage}%): No content`);
    }
  });

  return result;
}

/**
 * Pretty prints validation results to console
 */
export function logValidationResults(result: ValidationResult) {
  console.log('\n🔍 ===== VALIDATION RESULTS =====');
  
  if (result.info.length > 0) {
    console.log('\n📊 Information:');
    result.info.forEach(info => console.log(`  ${info}`));
  }

  if (result.warnings.length > 0) {
    console.log('\n⚠️ Warnings:');
    result.warnings.forEach(warning => console.warn(`  ${warning}`));
  }

  if (result.errors.length > 0) {
    console.log('\n❌ Errors:');
    result.errors.forEach(error => console.error(`  ${error}`));
  }

  if (result.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    result.recommendations.forEach(rec => console.log(`  • ${rec}`));
  }

  console.log('\n' + (result.isValid ? '✅ VALID - Ready to generate' : '❌ INVALID - Cannot generate'));
  console.log('================================\n');
}

/**
 * Quick check - returns true if subject is ready
 */
export function isSubjectReadyForGeneration(subject: Subject): boolean {
  if (!subject || !subject.units || subject.units.length === 0) {
    return false;
  }

  const hasAtLeastOneUnitWithContent = subject.units.some(unit => 
    unit.extracted_content && 
    (unit.extracted_content as any).text && 
    (unit.extracted_content as any).text.length > 100
  );

  return hasAtLeastOneUnitWithContent;
}

/**
 * Get content statistics for a subject
 */
export function getContentStatistics(subject: Subject) {
  if (!subject || !subject.units) {
    return {
      totalUnits: 0,
      unitsWithContent: 0,
      unitsWithoutContent: 0,
      totalCharacters: 0,
      averageCharactersPerUnit: 0
    };
  }

  let totalCharacters = 0;
  let unitsWithContent = 0;

  subject.units.forEach(unit => {
    if (unit.extracted_content && (unit.extracted_content as any).text) {
      const length = (unit.extracted_content as any).text.length;
      if (length > 100) {
        totalCharacters += length;
        unitsWithContent++;
      }
    }
  });

  return {
    totalUnits: subject.units.length,
    unitsWithContent,
    unitsWithoutContent: subject.units.length - unitsWithContent,
    totalCharacters,
    averageCharactersPerUnit: unitsWithContent > 0 ? Math.floor(totalCharacters / unitsWithContent) : 0
  };
}
