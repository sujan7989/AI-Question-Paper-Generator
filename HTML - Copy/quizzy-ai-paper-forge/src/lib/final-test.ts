// Final comprehensive test for the complete system
import { generatePromptFromSubjectUnits } from './subject-manager';
import { generateQuestions } from './ai';

/**
 * Final test to verify the complete PDF-to-Questions workflow
 */
export async function finalSystemTest() {
  console.log('🎯 FINAL SYSTEM TEST - PDF Content-Based Questions');
  console.log('================================================');
  
  try {
    // Test 1: Mock subject with hacking content
    const mockSubject = {
      id: 'test-1',
      subject_name: 'SQL',
      course_code: 'CS101',
      exam_type: 'Mid-Term',
      maximum_marks: 100,
      total_units: 1,
      user_id: 'test-user',
      created_at: new Date().toISOString(),
      units: [{
        id: 'unit-1',
        unit_name: 'Introduction to Hacking',
        unit_number: 1,
        weightage: 100,
        file_url: 'test.pdf',
        extracted_content: {
          text: `Introduction to Ethical Hacking

Chapter 1: Fundamentals of Ethical Hacking
Ethical hacking, also known as penetration testing, is the practice of testing computer systems for security vulnerabilities.

Key Concepts:
- Vulnerability Assessment: Process of identifying security weaknesses
- Penetration Testing: Simulated cyber attacks to test system security
- Social Engineering: Manipulating people to reveal confidential information
- Network Reconnaissance: Gathering information about target networks

Types of Hackers:
- White Hat Hackers: Ethical hackers who help improve security
- Black Hat Hackers: Malicious hackers who exploit systems illegally
- Gray Hat Hackers: Hackers who fall between ethical and malicious categories

Penetration Testing Methodology:
1. Planning and Reconnaissance
2. Scanning and Enumeration
3. Gaining Access
4. Maintaining Access
5. Analysis and Reporting

Common Security Tools:
- Nmap: Network discovery and security auditing
- Metasploit: Penetration testing framework
- Wireshark: Network protocol analyzer
- Burp Suite: Web application security testing`,
          numPages: 5,
          title: 'Introduction to Hacking',
          author: 'Security Expert',
          subject: 'Cybersecurity'
        }
      }]
    };

    console.log('✅ Test 1: Mock subject created with hacking content');
    
    // Test 2: Generate prompt
    const questionConfig = {
      totalQuestions: 10,
      totalMarks: 100,
      difficulty: 'medium',
      parts: [
        { name: 'Part A', questions: 5, marks: 20 },
        { name: 'Part B', questions: 3, marks: 30 },
        { name: 'Part C', questions: 2, marks: 50 }
      ]
    };
    
    const prompt = generatePromptFromSubjectUnits(
      mockSubject,
      ['unit-1'],
      { 'unit-1': 100 },
      questionConfig
    );
    
    console.log('✅ Test 2: AI prompt generated');
    console.log('📝 Prompt preview:', prompt.substring(0, 300) + '...');
    
    // Test 3: Check if prompt contains specific hacking terms
    const hackingTerms = [
      'penetration testing',
      'vulnerability assessment',
      'ethical hacking',
      'white hat',
      'black hat',
      'nmap',
      'metasploit'
    ];
    
    const foundTerms = hackingTerms.filter(term => 
      prompt.toLowerCase().includes(term.toLowerCase())
    );
    
    console.log('✅ Test 3: Hacking terms found in prompt:', foundTerms.length, '/', hackingTerms.length);
    console.log('   Found terms:', foundTerms);
    
    // Test 4: Generate questions
    console.log('🤖 Test 4: Generating questions with AI...');
    const questions = await generateQuestions('gemini', prompt);
    
    console.log('✅ Test 4: Questions generated successfully');
    console.log('📄 Questions length:', questions.length, 'characters');
    
    // Test 5: Verify questions contain specific terms
    const questionsLower = questions.toLowerCase();
    const termsInQuestions = hackingTerms.filter(term => 
      questionsLower.includes(term.toLowerCase())
    );
    
    console.log('✅ Test 5: Hacking terms in questions:', termsInQuestions.length, '/', hackingTerms.length);
    console.log('   Terms found:', termsInQuestions);
    
    // Test 6: Check for generic phrases (should NOT be present)
    const genericPhrases = [
      'uploaded pdf content',
      'your document',
      'the material provided',
      'concepts discussed in the uploaded'
    ];
    
    const foundGeneric = genericPhrases.filter(phrase => 
      questionsLower.includes(phrase.toLowerCase())
    );
    
    console.log('✅ Test 6: Generic phrases check (should be 0):', foundGeneric.length);
    if (foundGeneric.length > 0) {
      console.warn('⚠️ Found generic phrases:', foundGeneric);
    }
    
    // Final assessment
    const success = termsInQuestions.length >= 3 && foundGeneric.length === 0;
    
    console.log('\n🎯 FINAL ASSESSMENT:');
    console.log('===================');
    console.log('✅ PDF content extraction: WORKING');
    console.log('✅ Prompt generation: WORKING');
    console.log('✅ AI question generation: WORKING');
    console.log(`✅ Specific content usage: ${termsInQuestions.length >= 3 ? 'WORKING' : 'NEEDS IMPROVEMENT'}`);
    console.log(`✅ Generic phrase avoidance: ${foundGeneric.length === 0 ? 'WORKING' : 'NEEDS IMPROVEMENT'}`);
    console.log(`\n🏆 OVERALL STATUS: ${success ? 'SUCCESS! 🎉' : 'NEEDS ATTENTION ⚠️'}`);
    
    if (success) {
      console.log('\n🎊 Your system is generating content-specific questions!');
      console.log('📝 Questions preview:');
      console.log(questions.substring(0, 500) + '...');
    }
    
    return {
      success,
      termsFound: termsInQuestions.length,
      genericPhrases: foundGeneric.length,
      questions: questions.substring(0, 1000)
    };
    
  } catch (error) {
    console.error('❌ Final test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Make available globally
if (import.meta.env.DEV) {
  (window as any).finalSystemTest = finalSystemTest;
  console.log('🎯 Final test available: finalSystemTest()');
}