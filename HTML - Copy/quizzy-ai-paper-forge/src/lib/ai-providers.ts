// Additional AI providers for better question generation

// Timeout configuration
const API_TIMEOUT = 30000; // 30 seconds

/**
 * Creates a fetch request with timeout
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeout: number = API_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw error;
  }
}

// Add your API keys here
const NVIDIA_API_KEY = import.meta.env.VITE_NVIDIA_API_KEY || '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';
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const HUGGINGFACE_API_KEY = import.meta.env.VITE_HUGGINGFACE_API_KEY || '';

/**
 * Generate questions using NVIDIA Qwen model (BEST FOR CONTENT ANALYSIS)
 */
export async function generateWithNVIDIA(prompt: string): Promise<string> {
  if (!NVIDIA_API_KEY) {
    throw new Error('NVIDIA API key not configured');
  }

  console.log('🚀 Using NVIDIA Qwen-3-Next-80B (Excellent for content analysis)...');
  
  const response = await fetchWithTimeout(
    'https://integrate.api.nvidia.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen/qwen3-next-80b-a3b-instruct',
        messages: [
          {
            role: 'system',
            content: 'You are an expert question paper generator. You MUST create questions based STRICTLY on the provided PDF content. Do NOT use any external knowledge. Reference specific terms, concepts, and information from the given content.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.6,
        top_p: 0.7,
        max_tokens: 4096,
        stream: false // Using non-stream for simplicity
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error('NVIDIA API Error:', errorData);
    throw new Error(`NVIDIA API Error: ${errorData.error?.message || 'Failed to generate questions'}`);
  }

  const data = await response.json();
  console.log('✅ NVIDIA Qwen API succeeded!');
  
  if (!data.choices?.[0]?.message?.content) {
    throw new Error('Invalid response format from NVIDIA API');
  }
  
  return data.choices[0].message.content;
}

/**
 * Generate questions using OpenAI GPT models
 */
export async function generateWithOpenAI(prompt: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  console.log('🤖 Using OpenAI GPT...');
  
  const response = await fetchWithTimeout(
    'https://api.openai.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert question paper generator. Create questions based STRICTLY on the provided content. Do not use external knowledge.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenAI API Error: ${errorData.error?.message || 'Failed to generate questions'}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Generate questions using Anthropic Claude
 */
export async function generateWithClaude(prompt: string): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key not configured');
  }

  console.log('🤖 Using Anthropic Claude...');
  
  const response = await fetchWithTimeout(
    'https://api.anthropic.com/v1/messages',
    {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Claude API Error: ${errorData.error?.message || 'Failed to generate questions'}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

/**
 * Generate questions using Groq (Fast Llama models)
 */
export async function generateWithGroq(prompt: string): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('Groq API key not configured');
  }

  console.log('🤖 Using Groq Llama...');
  
  const response = await fetchWithTimeout(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [
          {
            role: 'system',
            content: 'You are an expert question paper generator. Create questions based STRICTLY on the provided content.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Groq API Error: ${errorData.error?.message || 'Failed to generate questions'}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Generate questions using Hugging Face models
 */
export async function generateWithHuggingFace(prompt: string): Promise<string> {
  if (!HUGGINGFACE_API_KEY) {
    throw new Error('Hugging Face API key not configured');
  }

  console.log('🤖 Using Hugging Face...');
  
  const response = await fetchWithTimeout(
    'https://api-inference.huggingface.co/models/microsoft/DialoGPT-large',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_length: 2000,
          temperature: 0.7,
        }
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Hugging Face API Error: ${errorData.error || 'Failed to generate questions'}`);
  }

  const data = await response.json();
  return data[0].generated_text;
}

/**
 * Test all available AI providers
 */
export async function testAllProviders(prompt: string) {
  const results = {
    nvidia: null as string | null,
    openai: null as string | null,
    claude: null as string | null,
    groq: null as string | null,
    huggingface: null as string | null,
  };

  // Test NVIDIA first (our primary provider)
  try {
    results.nvidia = await generateWithNVIDIA(prompt);
    console.log('✅ NVIDIA Qwen: Working');
  } catch (error) {
    console.log('❌ NVIDIA Qwen: Failed -', error.message);
  }

  // Test OpenAI
  try {
    results.openai = await generateWithOpenAI(prompt);
    console.log('✅ OpenAI: Working');
  } catch (error) {
    console.log('❌ OpenAI: Failed -', error.message);
  }

  // Test Claude
  try {
    results.claude = await generateWithClaude(prompt);
    console.log('✅ Claude: Working');
  } catch (error) {
    console.log('❌ Claude: Failed -', error.message);
  }

  // Test Groq
  try {
    results.groq = await generateWithGroq(prompt);
    console.log('✅ Groq: Working');
  } catch (error) {
    console.log('❌ Groq: Failed -', error.message);
  }

  // Test Hugging Face
  try {
    results.huggingface = await generateWithHuggingFace(prompt);
    console.log('✅ Hugging Face: Working');
  } catch (error) {
    console.log('❌ Hugging Face: Failed -', error.message);
  }

  return results;
}

// Make test function available globally
if (import.meta.env.DEV) {
  (window as any).testAllProviders = testAllProviders;
  console.log('🧪 AI Provider test available: testAllProviders("test prompt")');
}