import { z } from 'zod';
import { OpenAI } from 'openai';
const enhanceSchema = z.object({
    description: z.string().min(10),
});
function parsePriority(priority) {
    const normalized = priority.trim().toUpperCase();
    if (normalized.includes('HIGH'))
        return 'HIGH';
    if (normalized.includes('LOW'))
        return 'LOW';
    return 'MEDIUM';
}
export async function enhanceTaskController(req, res, next) {
    try {
        const payload = enhanceSchema.parse(req.body);
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'AI API key is not configured' });
        }
        const client = new OpenAI({ apiKey });
        const prompt = `Extract three subtasks, one priority value (low/medium/high), and a rough time estimate in hours from the description below. Return only JSON.\n\nDescription: ${payload.description}`;
        const response = await client.responses.create({
            model: 'gpt-4o-mini',
            input: prompt,
            max_output_tokens: 300,
        });
        const outputAny = response;
        const rawText = outputAny.output_text ||
            (Array.isArray(outputAny.output) ? String(outputAny.output[0]?.text ?? outputAny.output[0]?.content?.[0]?.text ?? '') : '');
        const jsonStart = rawText.indexOf('{');
        const jsonString = jsonStart >= 0 ? rawText.slice(jsonStart) : rawText;
        const parsed = JSON.parse(jsonString);
        const subtasks = Array.isArray(parsed.subtasks) ? parsed.subtasks.map((item) => ({ title: String(item).trim() })) : [];
        const priority = parsePriority(String(parsed.priority ?? 'MEDIUM'));
        const estimate = Number(parsed.estimate) || null;
        res.json({ subtasks, priority, estimate });
    }
    catch (error) {
        next(error);
    }
}
