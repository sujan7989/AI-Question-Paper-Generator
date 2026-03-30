// AI Evaluation Engine
// Scores each question for difficulty, Bloom accuracy, and confidence
// Uses the existing NVIDIA proxy — no new API keys needed

export interface QuestionEvaluation {
  question: string;
  difficulty_score: number;   // 0.0 – 1.0
  bloom_level: 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';
  bloom_accurate: boolean;    // does the question actually match its declared Bloom level?
  confidence: 'High' | 'Medium' | 'Low';
  unit_source?: string;       // which unit this question came from
  redundant: boolean;         // is it too similar to another question?
  explanation: string;        // why this question was generated / what it tests
}

export interface EvaluationReport {
  evaluations: QuestionEvaluation[];
  overall_difficulty: number;
  bloom_distribution: Record<string, number>;
  coverage_score: number;     // 0–100, how well topics are covered
  redundancy_count: number;
  summary: string;
}

/**
 * Evaluate a list of questions using AI.
 * Falls back to heuristic scoring if the AI call fails.
 */
export async function evaluateQuestions(
  questions: Array<{ question: string; bloom_level: string; unit_source?: string }>,
  subjectName: string
): Promise<EvaluationReport> {
  try {
    const result = await callAIEvaluator(questions, subjectName);
    return result;
  } catch {
    return heuristicEvaluate(questions);
  }
}

async function callAIEvaluator(
  questions: Array<{ question: string; bloom_level: string; unit_source?: string }>,
  subjectName: string
): Promise<EvaluationReport> {
  const prompt = `You are an expert academic evaluator. Evaluate the following exam questions for the subject "${subjectName}".

For each question return a JSON object with:
- difficulty_score: float 0.0-1.0 (0=trivial, 1=very hard)
- bloom_level: one of Remember|Understand|Apply|Analyze|Evaluate|Create
- bloom_accurate: true/false (does the question match its declared bloom level?)
- confidence: High|Medium|Low
- redundant: true/false (is it too similar to another question in this list?)
- explanation: one sentence explaining what concept/skill this question tests

Questions:
${questions.map((q, i) => `${i + 1}. [${q.bloom_level}] ${q.question}`).join('\n')}

Respond ONLY with a valid JSON array of evaluation objects, one per question. No extra text.`;

  const response = await fetch(`${window.location.origin}/api/nvidia`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'meta/llama-3.1-405b-instruct',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) throw new Error('AI evaluator failed');

  const data = await response.json();
  const text: string = data.choices[0].message.content;

  // Extract JSON array from response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('No JSON in evaluator response');

  const evals = JSON.parse(jsonMatch[0]) as Omit<QuestionEvaluation, 'question'>[];

  const evaluations: QuestionEvaluation[] = evals.map((e, i) => ({
    ...e,
    question: questions[i]?.question || '',
    unit_source: questions[i]?.unit_source,
  }));

  return buildReport(evaluations);
}

/** Heuristic fallback — no AI call needed */
function heuristicEvaluate(
  questions: Array<{ question: string; bloom_level: string; unit_source?: string }>
): EvaluationReport {
  const bloomOrder = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];

  const seen = new Set<string>();
  const evaluations: QuestionEvaluation[] = questions.map((q, i) => {
    const lower = q.question.toLowerCase();
    const words = lower.split(/\s+/).slice(0, 6).join(' ');
    const redundant = seen.has(words);
    seen.add(words);

    const bloomIdx = bloomOrder.indexOf(q.bloom_level);
    const difficulty_score = bloomIdx >= 0 ? parseFloat(((bloomIdx + 1) / 6).toFixed(2)) : 0.33;

    // Detect actual bloom level from keywords
    let detectedBloom: QuestionEvaluation['bloom_level'] = 'Remember';
    if (/explain|describe|summarize|interpret/.test(lower)) detectedBloom = 'Understand';
    else if (/apply|use|demonstrate|solve|calculate/.test(lower)) detectedBloom = 'Apply';
    else if (/analyze|compare|differentiate|examine/.test(lower)) detectedBloom = 'Analyze';
    else if (/evaluate|justify|assess|critique/.test(lower)) detectedBloom = 'Evaluate';
    else if (/create|design|construct|develop/.test(lower)) detectedBloom = 'Create';

    const bloom_accurate = detectedBloom === q.bloom_level;
    const confidence: QuestionEvaluation['confidence'] =
      q.question.length > 60 ? 'High' : q.question.length > 30 ? 'Medium' : 'Low';

    const explanation = `Tests ${detectedBloom.toLowerCase()}-level understanding of ${
      q.unit_source ? `"${q.unit_source}"` : 'the subject material'
    }.`;

    return {
      question: q.question,
      difficulty_score,
      bloom_level: detectedBloom,
      bloom_accurate,
      confidence,
      unit_source: q.unit_source,
      redundant,
      explanation,
    };
  });

  return buildReport(evaluations);
}

function buildReport(evaluations: QuestionEvaluation[]): EvaluationReport {
  const bloom_distribution: Record<string, number> = {};
  let total_difficulty = 0;
  let redundancy_count = 0;

  for (const e of evaluations) {
    bloom_distribution[e.bloom_level] = (bloom_distribution[e.bloom_level] || 0) + 1;
    total_difficulty += e.difficulty_score;
    if (e.redundant) redundancy_count++;
  }

  const n = evaluations.length || 1;
  const overall_difficulty = parseFloat((total_difficulty / n).toFixed(2));
  const uniqueLevels = Object.keys(bloom_distribution).length;
  const coverage_score = Math.min(100, Math.round((uniqueLevels / 6) * 100));

  const summary = `${n} questions evaluated. Avg difficulty: ${(overall_difficulty * 100).toFixed(0)}%. `
    + `Bloom coverage: ${uniqueLevels}/6 levels. `
    + (redundancy_count > 0 ? `${redundancy_count} potentially redundant question(s) found.` : 'No redundancy detected.');

  return { evaluations, overall_difficulty, bloom_distribution, coverage_score, redundancy_count, summary };
}
