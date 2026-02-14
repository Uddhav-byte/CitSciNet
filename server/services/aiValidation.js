import Groq from 'groq-sdk';

// Initialize Groq client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || '',
});

/**
 * AI Validation Pipeline
 * 
 * Validates observation data against mission requirements using Groq LLM.
 * Returns a score 0-1:
 *   >= 0.80 → auto_approved (sent directly to researcher)
 *   <  0.80 → needs_review (sent to middleman/moderator)
 */

/**
 * Validate observation data against mission context
 */
export async function validateObservation({ observation, mission }) {
    try {
        // If no Groq API key, return pending (skip validation)
        if (!process.env.GROQ_API_KEY) {
            console.log('⚠️  No GROQ_API_KEY set — skipping AI validation');
            return {
                status: 'needs_review',
                score: 0.5,
                notes: 'AI validation skipped — no API key configured. Sent to moderator for manual review.',
            };
        }

        const prompt = buildValidationPrompt(observation, mission);

        const response = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: `You are a scientific data quality validator for a citizen science platform called CitSciNet. 
Your job is to assess whether submitted observation data is scientifically relevant and accurate for the given mission.

You must respond in EXACTLY this JSON format:
{
  "score": <number 0-1>,
  "reasoning": "<brief explanation>",
  "issues": ["<issue1>", "<issue2>"],
  "recommendation": "approve" | "review" | "reject"
}

Scoring guidelines:
- 0.90-1.00: Excellent — data is highly relevant, coordinates match, category is correct
- 0.80-0.89: Good — data is relevant with minor concerns
- 0.60-0.79: Uncertain — some data may be relevant but needs human review
- 0.40-0.59: Poor — significant concerns about data quality or relevance
- 0.00-0.39: Bad — data appears irrelevant, spam, or fraudulent

Consider these factors:
1. Does the observation category match the mission type?
2. Are the coordinates within a reasonable area for the mission?
3. Does the AI label (if any) match what the mission is looking for?
4. Are the notes/descriptions scientifically meaningful?
5. Does the confidence score suggest reliable AI classification?`
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.1,
            max_tokens: 500,
            response_format: { type: 'json_object' },
        });

        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error('Empty AI response');

        const result = JSON.parse(content);
        const score = Math.max(0, Math.min(1, parseFloat(result.score) || 0.5));

        return {
            status: score >= 0.80 ? 'auto_approved' : 'needs_review',
            score,
            notes: `AI Assessment: ${result.reasoning || 'No reasoning provided'}${result.issues?.length > 0 ? `\nIssues: ${result.issues.join('; ')}` : ''
                }\nRecommendation: ${result.recommendation || (score >= 0.80 ? 'approve' : 'review')}`,
        };
    } catch (err) {
        console.error('AI validation error:', err.message);
        // On error, send to moderator review rather than auto-approving
        return {
            status: 'needs_review',
            score: 0.5,
            notes: `AI validation encountered an error: ${err.message}. Sent to moderator for manual review.`,
        };
    }
}

/**
 * Validate an image URL against mission requirements using Groq vision
 */
export async function validateImage({ imageUrl, mission }) {
    try {
        if (!process.env.GROQ_API_KEY || !imageUrl) {
            return { relevant: true, description: 'Image validation skipped', score: 0.7 };
        }

        const response = await groq.chat.completions.create({
            model: 'llama-3.2-90b-vision-preview',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `You are reviewing an image submitted for a citizen science mission.

Mission: "${mission?.title || 'General observation'}"
Mission Type: ${mission?.missionType || 'Unknown'}
Mission Description: ${mission?.description || 'No description'}

Analyze this image and respond in JSON:
{
  "relevant": true/false,
  "description": "<what you see in the image>",
  "matchesMission": true/false,
  "species_detected": "<species name if identifiable, or null>",
  "quality": "good" | "acceptable" | "poor",
  "score": <0-1 relevance score>
}`
                        },
                        {
                            type: 'image_url',
                            image_url: { url: imageUrl }
                        }
                    ]
                }
            ],
            temperature: 0.1,
            max_tokens: 300,
        });

        const content = response.choices[0]?.message?.content;
        try {
            return JSON.parse(content);
        } catch {
            return { relevant: true, description: content, score: 0.7 };
        }
    } catch (err) {
        console.error('Image validation error:', err.message);
        return { relevant: true, description: 'Image validation failed', score: 0.7 };
    }
}

function buildValidationPrompt(observation, mission) {
    let prompt = `## Observation Submission\n`;
    prompt += `- **Category:** ${observation.category}\n`;
    prompt += `- **AI Label:** ${observation.aiLabel || 'None'}\n`;
    prompt += `- **Confidence Score:** ${observation.confidenceScore ? (observation.confidenceScore * 100).toFixed(1) + '%' : 'N/A'}\n`;
    prompt += `- **Location:** ${observation.latitude?.toFixed(4)}, ${observation.longitude?.toFixed(4)}\n`;
    prompt += `- **Notes:** ${observation.notes || 'None provided'}\n`;
    prompt += `- **Has Image:** ${observation.imageUrl ? 'Yes' : 'No'}\n`;
    prompt += `- **Submitted by:** ${observation.userName}\n\n`;

    if (mission) {
        prompt += `## Mission Context\n`;
        prompt += `- **Mission:** ${mission.title}\n`;
        prompt += `- **Type:** ${mission.missionType}\n`;
        prompt += `- **Description:** ${mission.description || 'None'}\n`;
        prompt += `- **Scientific Goal:** ${mission.scientificGoal || 'None'}\n`;
        prompt += `- **Data Protocol:** ${mission.dataProtocol || 'None'}\n`;
    } else {
        prompt += `## Mission Context\nNo specific mission associated. This is a general observation.\n`;
    }

    prompt += `\nPlease validate this observation data and provide your assessment.`;
    return prompt;
}

export default { validateObservation, validateImage };
