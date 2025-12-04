// Comprehensive debug script for PDF-based question generation flow
import { supabase } from '@/integrations/supabase/client';
import { getUserSubjects } from './subject-manager';

/**
 * Debug function to check the entire flow from subject creation to question generation
 */
export async function debugQuestionGenerationFlow(userId: string) {
  console.log('🔍 ===== DEBUGGING QUESTION GENERATION FLOW =====');
  console.log('👤 User ID:', userId);
  
  try {
    // Step 1: Fetch all subjects for the user
    console.log('\n📚 Step 1: Fetching subjects from database...');
    const subjects = await getUserSubjects(userId);
    
    if (subjects.length === 0) {
      console.log('❌ No subjects found for this user');
      console.log('💡 Please create a subject in "Subject Setup" first');
      return;
    }
    
    console.log(`✅ Found ${subjects.length} subject(s)`);
    
    // Step 2: Analyze each subject and its units
    subjects.forEach((subject, idx) => {
      console.log(`\n📖 Subject ${idx + 1}: ${subject.subject_name}`);
      console.log(`   Course Code: ${subject.course_code}`);
      console.log(`   Exam Type: ${subject.exam_type}`);
      console.log(`   Maximum Marks: ${subject.maximum_marks}`);
      console.log(`   Total Units: ${subject.total_units}`);
      console.log(`   Units in data: ${subject.units?.length || 0}`);
      
      if (!subject.units || subject.units.length === 0) {
        console.log('   ⚠️ WARNING: No units found for this subject!');
        console.log('   💡 This subject may have been created without units');
        return;
      }
      
      // Step 3: Analyze each unit
      subject.units.forEach((unit, unitIdx) => {
        console.log(`\n   📄 Unit ${unitIdx + 1}: ${unit.unit_name}`);
        console.log(`      ID: ${unit.id}`);
        console.log(`      Unit Number: ${unit.unit_number}`);
        console.log(`      Weightage: ${unit.weightage}%`);
        console.log(`      Has file URL: ${!!unit.file_url}`);
        
        if (unit.file_url) {
          console.log(`      File URL: ${unit.file_url}`);
        }
        
        // Step 4: Check extracted content
        console.log(`      Has extracted_content: ${!!unit.extracted_content}`);
        
        if (unit.extracted_content) {
          const content = unit.extracted_content as any;
          console.log(`      ✅ PDF CONTENT FOUND!`);
          console.log(`         - Text length: ${content.text?.length || 0} characters`);
          console.log(`         - Number of pages: ${content.numPages || 0}`);
          console.log(`         - Title: ${content.title || 'N/A'}`);
          console.log(`         - Author: ${content.author || 'N/A'}`);
          
          if (content.text && content.text.length > 0) {
            console.log(`         - Content preview (first 200 chars):`);
            console.log(`           "${content.text.substring(0, 200)}..."`);
          } else {
            console.log(`         ⚠️ WARNING: extracted_content exists but text is empty!`);
          }
        } else {
          console.log(`      ❌ NO PDF CONTENT EXTRACTED`);
          console.log(`      💡 Possible causes:`);
          console.log(`         - PDF extraction failed during subject creation`);
          console.log(`         - No PDF was uploaded for this unit`);
          console.log(`         - Database didn't save the extracted content`);
        }
      });
    });
    
    // Step 5: Summary and recommendations
    console.log('\n\n📊 ===== SUMMARY =====');
    const totalSubjects = subjects.length;
    const totalUnits = subjects.reduce((sum, s) => sum + (s.units?.length || 0), 0);
    const unitsWithPDF = subjects.reduce((sum, s) => 
      sum + (s.units?.filter(u => u.extracted_content && (u.extracted_content as any).text).length || 0), 0
    );
    
    console.log(`Total Subjects: ${totalSubjects}`);
    console.log(`Total Units: ${totalUnits}`);
    console.log(`Units with PDF content: ${unitsWithPDF}`);
    console.log(`Units without PDF content: ${totalUnits - unitsWithPDF}`);
    
    if (unitsWithPDF === 0) {
      console.log('\n❌ CRITICAL ISSUE: No units have extracted PDF content!');
      console.log('\n🔧 SOLUTION:');
      console.log('1. Go to "Subject Setup" page');
      console.log('2. Create a NEW subject');
      console.log('3. For each unit, upload a PDF file');
      console.log('4. Wait for the extraction process to complete');
      console.log('5. Check the progress bar reaches 100%');
      console.log('6. Then come back and try generating questions');
    } else if (unitsWithPDF < totalUnits) {
      console.log(`\n⚠️ WARNING: Only ${unitsWithPDF} out of ${totalUnits} units have PDF content`);
      console.log('Some units may not generate quality questions');
    } else {
      console.log('\n✅ All units have PDF content - ready for question generation!');
    }
    
  } catch (error) {
    console.error('❌ Debug flow error:', error);
  }
}

/**
 * Test PDF extraction from a specific subject
 */
export async function testPDFExtraction(subjectId: string) {
  console.log('🔍 Testing PDF extraction for subject:', subjectId);
  
  try {
    const { data: units, error } = await supabase
      .from('units')
      .select('*')
      .eq('subject_id', subjectId);
    
    if (error) throw error;
    
    if (!units || units.length === 0) {
      console.log('❌ No units found for this subject');
      return;
    }
    
    console.log(`Found ${units.length} units:`);
    units.forEach((unit, idx) => {
      console.log(`\nUnit ${idx + 1}: ${unit.unit_name}`);
      console.log('Extracted content:', unit.extracted_content);
    });
    
  } catch (error) {
    console.error('Error testing PDF extraction:', error);
  }
}

/**
 * Check database tables and structure
 */
export async function checkDatabaseStructure() {
  console.log('🔍 Checking database structure...');
  
  try {
    // Check subjects table
    const { data: subjectsData, error: subjectsError } = await supabase
      .from('subjects')
      .select('*')
      .limit(1);
    
    if (subjectsError) {
      console.log('❌ Subjects table error:', subjectsError.message);
    } else {
      console.log('✅ Subjects table accessible');
    }
    
    // Check units table
    const { data: unitsData, error: unitsError } = await supabase
      .from('units')
      .select('*')
      .limit(1);
    
    if (unitsError) {
      console.log('❌ Units table error:', unitsError.message);
    } else {
      console.log('✅ Units table accessible');
    }
    
    // Check question_papers table
    const { data: papersData, error: papersError } = await supabase
      .from('question_papers')
      .select('*')
      .limit(1);
    
    if (papersError) {
      console.log('❌ Question papers table error:', papersError.message);
    } else {
      console.log('✅ Question papers table accessible');
    }
    
  } catch (error) {
    console.error('❌ Database structure check failed:', error);
  }
}
