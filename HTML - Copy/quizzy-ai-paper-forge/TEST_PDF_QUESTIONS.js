/**
 * Test Script for PDF-Based Question Generation
 * 
 * Run this in the browser console to test if PDF content is being used correctly
 * 
 * Usage:
 * 1. Open browser console (F12)
 * 2. Copy and paste this entire file
 * 3. Run: await testPDFQuestionGeneration()
 */

async function testPDFQuestionGeneration() {
  console.log('═══════════════════════════════════════════════');
  console.log('🧪 TESTING PDF-BASED QUESTION GENERATION');
  console.log('═══════════════════════════════════════════════');
  
  // Test 1: Check if Supabase is available
  console.log('\n📋 Test 1: Checking Supabase connection...');
  if (typeof supabase === 'undefined') {
    console.error('❌ Supabase not available. Make sure you\'re on the app page.');
    return;
  }
  console.log('✅ Supabase is available');
  
  // Test 2: Get current user
  console.log('\n📋 Test 2: Checking authentication...');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('❌ No user logged in. Please log in first.');
    return;
  }
  console.log('✅ User authenticated:', user.email);
  
  // Test 3: Get subjects with units
  console.log('\n📋 Test 3: Fetching subjects...');
  const { data: subjects, error: subjectsError } = await supabase
    .from('subjects')
    .select(`
      id,
      subject_name,
      course_code,
      units (
        id,
        unit_name,
        unit_number,
        file_url,
        extracted_content
      )
    `)
    .eq('user_id', user.id);
  
  if (subjectsError) {
    console.error('❌ Error fetching subjects:', subjectsError);
    return;
  }
  
  if (!subjects || subjects.length === 0) {
    console.error('❌ No subjects found. Please create a subject first.');
    return;
  }
  
  console.log(`✅ Found ${subjects.length} subject(s)`);
  
  // Test 4: Check each subject for PDF content
  console.log('\n📋 Test 4: Checking PDF content in subjects...');
  
  subjects.forEach((subject, idx) => {
    console.log(`\n📚 Subject ${idx + 1}: ${subject.subject_name} (${subject.course_code || 'No code'})`);
    console.log(`   ID: ${subject.id}`);
    console.log(`   Units: ${subject.units?.length || 0}`);
    
    if (!subject.units || subject.units.length === 0) {
      console.warn('   ⚠️ No units found');
      return;
    }
    
    subject.units.forEach((unit, unitIdx) => {
      console.log(`\n   📄 Unit ${unitIdx + 1}: ${unit.unit_name}`);
      console.log(`      ID: ${unit.id}`);
      console.log(`      File URL: ${unit.file_url || 'NONE'}`);
      console.log(`      Has extracted_content: ${!!unit.extracted_content}`);
      
      if (unit.extracted_content) {
        const content = unit.extracted_content;
        console.log(`      Content text length: ${content.text?.length || 0} chars`);
        
        if (content.text && content.text.length > 0) {
          console.log(`      ✅ Content preview:`);
          console.log(`      "${content.text.substring(0, 200)}..."`);
        } else {
          console.warn(`      ⚠️ Content is empty`);
        }
      } else {
        console.warn(`      ⚠️ No extracted content`);
        
        if (unit.file_url) {
          console.log(`      💡 File exists but not extracted. Will be extracted during question generation.`);
        } else {
          console.error(`      ❌ No file URL - PDF was not uploaded`);
        }
      }
    });
  });
  
  // Test 5: Simulate question generation
  console.log('\n📋 Test 5: Simulating question generation...');
  
  const testSubject = subjects[0];
  if (!testSubject.units || testSubject.units.length === 0) {
    console.error('❌ First subject has no units. Cannot simulate.');
    return;
  }
  
  let combinedContent = '';
  for (const unit of testSubject.units) {
    if (unit.extracted_content?.text) {
      combinedContent += `\n\n=== ${unit.unit_name} ===\n${unit.extracted_content.text}`;
    }
  }
  
  console.log(`\n📊 Combined content length: ${combinedContent.length} characters`);
  
  if (combinedContent.length < 100) {
    console.error('❌ Combined content too short. PDFs need to be extracted.');
    console.log('💡 Try generating questions - the system will extract PDFs automatically.');
    return;
  }
  
  console.log('✅ Content is sufficient for question generation');
  console.log(`\n📖 Content preview (first 500 chars):`);
  console.log(combinedContent.substring(0, 500));
  
  // Test 6: Check AI prompt format
  console.log('\n📋 Test 6: Checking AI prompt format...');
  
  const prompt = `Subject: ${testSubject.subject_name}
Total Marks: 100
Content: ${combinedContent}`;
  
  console.log(`\n📝 Prompt length: ${prompt.length} characters`);
  console.log(`📖 Prompt preview (first 300 chars):`);
  console.log(prompt.substring(0, 300));
  
  // Final summary
  console.log('\n═══════════════════════════════════════════════');
  console.log('📊 TEST SUMMARY');
  console.log('═══════════════════════════════════════════════');
  console.log(`✅ Supabase: Connected`);
  console.log(`✅ User: ${user.email}`);
  console.log(`✅ Subjects: ${subjects.length}`);
  console.log(`✅ Total Units: ${subjects.reduce((sum, s) => sum + (s.units?.length || 0), 0)}`);
  console.log(`✅ Content Length: ${combinedContent.length} chars`);
  
  const unitsWithContent = subjects.reduce((sum, s) => 
    sum + (s.units?.filter(u => u.extracted_content?.text).length || 0), 0
  );
  const totalUnits = subjects.reduce((sum, s) => sum + (s.units?.length || 0), 0);
  
  console.log(`✅ Units with Content: ${unitsWithContent}/${totalUnits}`);
  
  if (unitsWithContent === 0) {
    console.warn('\n⚠️ WARNING: No units have extracted content!');
    console.log('💡 Solution: Generate questions - the system will extract PDFs automatically.');
  } else if (unitsWithContent < totalUnits) {
    console.warn(`\n⚠️ WARNING: Only ${unitsWithContent}/${totalUnits} units have content!`);
    console.log('💡 Some PDFs may not have been extracted. They will be extracted during question generation.');
  } else {
    console.log('\n✅ ALL TESTS PASSED! Ready for question generation.');
  }
  
  console.log('═══════════════════════════════════════════════');
  
  return {
    success: true,
    subjects: subjects.length,
    totalUnits,
    unitsWithContent,
    contentLength: combinedContent.length
  };
}

// Make function available globally
window.testPDFQuestionGeneration = testPDFQuestionGeneration;

console.log('✅ Test script loaded!');
console.log('📝 Run: await testPDFQuestionGeneration()');
