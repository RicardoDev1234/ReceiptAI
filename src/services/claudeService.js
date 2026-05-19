const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

export async function extractReceiptData(base64Image, mediaType = 'image/jpeg') {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('Missing EXPO_PUBLIC_ANTHROPIC_API_KEY in environment variables.');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-7',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: `Analyze this receipt image and extract information. Return ONLY a valid JSON object with these exact fields:
{
  "vendor": "store or restaurant name as a string",
  "date": "date in YYYY-MM-DD format or null",
  "amount": total amount as a number (e.g. 12.99) or null,
  "category": "one of exactly: Food & Dining, Shopping, Transportation, Entertainment, Healthcare, Utilities, Other",
  "items": ["list of main purchased items as strings, max 5"]
}

Rules:
- amount must be a number, not a string
- date must be YYYY-MM-DD or null
- category must exactly match one of the listed options
- Return ONLY the JSON object, no other text, no markdown, no backticks`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const rawText = data.content?.[0]?.text ?? '';

  try {
    return JSON.parse(rawText);
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error('Could not parse receipt data from Claude response.');
  }
}
