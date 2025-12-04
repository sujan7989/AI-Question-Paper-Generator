// Test the content-aware question generation
import { generateQuestions } from './ai';

/**
 * Test content-aware question generation with hacking content
 */
export async function testContentAwareQuestions() {
  console.log('🧪 Testing Content-Aware Question Generation');
  console.log('============================================');
  
  const hackingPrompt = `
You are an expert question paper generator. Create a comprehensive question paper based STRICTLY on the provided content.

SUBJECT DETAILS:
- Subject: SQL
- Course Code: CS101
- Exam Type: Mid-Term
- Total Marks: 100
- Difficulty Level: medium

PAPER STRUCTURE:
- Part A: 5 questions (20 marks)
- Part B: 3 questions (30 marks)
- Part C: 2 questions (50 marks)

UNIT WEIGHTAGES:
- Introduction to Hacking: 100%

SOURCE CONTENT:

=== Introduction to Hacking (100% weightage) ===

Introduction to Ethical Hacking

Chapter 1: Fundamentals of Ethical Hacking
Ethical hacking, also known as penetration testing or white-hat hacking, is the practice of intentionally probing systems and networks to find security vulnerabilities that malicious hackers could exploit.

Key Concepts:
- Vulnerability Assessment: The process of identifying, quantifying, and prioritizing vulnerabilities in a system
- Penetration Testing: A simulated cyber attack against your computer system to check for exploitable vulnerabilities
- Social Engineering: The use of deception to manipulate individuals into divulging confidential information
- Network Reconnaissance: The practice of gathering information about a target network before launching an attack

Chapter 2: Types of Hackers
- White Hat Hackers: Ethical hackers who use their skills to help organizations improve security
- Black Hat Hackers: Malicious hackers who break into systems for personal gain or to cause damage
- Gray Hat Hackers: Hackers who fall between white and black hat categories

Chapter 3: Penetration Testing Methodology
1. Planning and Reconnaissance: Gathering information about the target
2. Scanning: Using tools to identify live systems, open ports, and services
3. Gaining Access: Attempting to exploit vulnerabilities to gain unauthorized access
4. Maintaining Access: Ensuring persistent access to the compromised system
5. Analysis and Reporting: Documenting findings and providing recommendations

Chapter 4: Common Security Vulnerabilities
- SQL Injection: Inserting malicious SQL code into application queries
- Cross-Site Scripting (XSS): Injecting malicious scripts into web applications
- Buffer Overflow: Overwriting memory buffers to execute malicious code
- Weak Authentication: Poor password policies and authentication mechanisms

Chapter 5: Security Tools and Techniques
- Nmap: Network discovery and security auditing tool
- Metasploit: Penetration testing framework
- Wireshark: Network protocol analyzer
- Burp Suite: Web application security testing platform

CRITICAL INSTRUCTIONS - READ CAREFULLY:
1. Generate EXACTLY 10 questions distributed across the specified parts
2. Use ONLY the specific content provided in the SOURCE CONTENT section above
3. Create questions about the ACTUAL topics mentioned in the content
4. Reference SPECIFIC terms, concepts, and information from the provided content
5. Do NOT use generic phrases like "uploaded PDF content" or "your document"
6. Ask about specific hacking concepts mentioned: penetration testing, vulnerability assessment, white hat hackers, Nmap, Metasploit, etc.

Generate the question paper now using the SPECIFIC content provided above:`;

  try {
    console.log('🚀 Generating content-aware questions...');
    const result = await generateQuestions('gemini', hackingPrompt);
    
    console.log('✅ Questions Generated Successfully!');
    console.log('📄 Response Length:', result.length, 'characters');
    console.log('\n📋 Generated Questions:');
    console.log('========================');
    console.log(result);
    
    // Check if the response contains specific hacking terms
    const hackingTerms = [
      'ethical hacking',
      'penetration testing',
      'vulnerability assessment',
      'white hat',
      'black hat',
      'nmap',
      'metasploit',
      'sql injection',
      'cross-site scripting'
    ];
    
    const foundTerms = hackingTerms.filter(term => 
      result.toLowerCase().includes(term.toLowerCase())
    );
    
    console.log('\n🔍 Analysis:');
    console.log('=============');
    console.log('✅ Specific hacking terms found:', foundTerms.length, '/', hackingTerms.length);
    console.log('📝 Terms found:', foundTerms);
    
    // Check for generic phrases (should NOT be present)
    const genericPhrases = [
      'uploaded pdf content',
      'your document',
      'the material provided'
    ];
    
    const foundGeneric = genericPhrases.filter(phrase => 
      result.toLowerCase().includes(phrase.toLowerCase())
    );
    
    console.log('❌ Generic phrases (should be minimal):', foundGeneric.length);
    if (foundGeneric.length > 0) {
      console.log('⚠️ Found generic phrases:', foundGeneric);
    }
    
    const success = foundTerms.length >= 5;
    
    console.log('\n🎯 FINAL ASSESSMENT:');
    console.log('====================');
    console.log(`✅ Content-specific questions: ${foundTerms.length >= 5 ? 'YES' : 'NO'}`);
    console.log(`✅ Hacking-focused content: ${foundTerms.length >= 5 ? 'YES' : 'NO'}`);
    console.log(`🏆 OVERALL: ${success ? 'SUCCESS! 🎉' : 'NEEDS IMPROVEMENT ⚠️'}`);
    
    if (success) {
      console.log('\n🎊 Content-aware question generation is working!');
      console.log('🎯 Your PDF content issue is SOLVED!');
    }
    
    return {
      success,
      result,
      termsFound: foundTerms.length,
      genericPhrases: foundGeneric.length
    };
    
  } catch (error) {
    console.error('❌ Content-aware test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Make available globally
if (import.meta.env.DEV) {
  (window as any).testContentAwareQuestions = testContentAwareQuestions;
  console.log('🧪 Content-aware test available: testContentAwareQuestions()');
}