// Debug PDF extraction and content usage
import { getUserSubjects } from './subject-manager';

/**
 * Debug function to check PDF content extraction
 */
export async function debugPDFContent(userId: string) {
  console.log('🔍 DEBUG: Checking PDF content extraction...');
  
  try {
    const subjects = await getUserSubjects(userId);
    
    console.log('📚 Found subjects:', subjects.length);
    
    subjects.forEach((subject, index) => {
      console.log(`\n📖 Subject ${index + 1}: ${subject.subject_name}`);
      console.log(`   Course Code: ${subject.course_code}`);
      console.log(`   Units: ${subject.units?.length || 0}`);
      
      subject.units?.forEach((unit, unitIndex) => {
        console.log(`\n   📄 Unit ${unitIndex + 1}: ${unit.unit_name}`);
        console.log(`      Weightage: ${unit.weightage}%`);
        console.log(`      Has file URL: ${!!unit.file_url}`);
        console.log(`      Has extracted content: ${!!unit.extracted_content}`);
        
        if (unit.extracted_content) {
          console.log(`      Content type: ${typeof unit.extracted_content}`);
          console.log(`      Content keys:`, Object.keys(unit.extracted_content));
          
          if (unit.extracted_content.text) {
            console.log(`      Text length: ${unit.extracted_content.text.length} chars`);
            console.log(`      Text preview: "${unit.extracted_content.text.substring(0, 300)}..."`);
          } else {
            console.log(`      ❌ No text content found!`);
          }
        } else {
          console.log(`      ❌ No extracted content found!`);
        }
      });
    });
    
    return subjects;
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    return [];
  }
}

// Make available globally
if (import.meta.env.DEV) {
  (window as any).debugPDFContent = debugPDFContent;
  console.log('🔍 Debug function available: debugPDFContent(userId)');
}