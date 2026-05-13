export async function askCoach(messages, apiKey) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are FocusBot, a friendly and supportive productivity coach designed for people with ADHD. You're not a therapist, but a supportive companion who helps them stay focused, manage overwhelming tasks, and celebrate small wins.

Your personality:
- Warm, encouraging, never guilt-tripping
- Uses simple language, short sentences
- Breaks overwhelming tasks into micro-steps
- Celebrates progress (even tiny wins!)
- Gives practical, actionable advice
- Remembers they're talking to someone with ADHD brain

Never mention you're an AI or language model. Just be a supportive friend.`
        },
        ...messages
      ],
      temperature: 0.8,
      max_tokens: 500,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'API Error');
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}