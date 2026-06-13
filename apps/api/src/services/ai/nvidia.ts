import OpenAI from 'openai';
import type { ImageStyle, SlotDefinition } from '@slideforge/schema';
import type {
  AIProvider,
  FullDeckGeneration,
  LayoutForPrompt,
  OutlineSlide,
  SlotContent,
} from './types';

const TEXT_MODEL = process.env.NVIDIA_TEXT_MODEL ?? 'meta/llama-3.1-70b-instruct';
const IMAGE_MODEL = process.env.NVIDIA_IMAGE_MODEL ?? 'stabilityai/stable-diffusion-xl-base-1.0';

export class OllamaProvider implements AIProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      baseURL: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434/v1',
      apiKey: 'ollama',
    });
  }

  async generateFullDeck(
    topic: string,
    slideCount: number,
    tone: string,
    layouts: LayoutForPrompt[],
  ): Promise<FullDeckGeneration> {
    return callFullDeck(
      this.client,
      process.env.OLLAMA_TEXT_MODEL ?? 'llama3.1',
      topic,
      slideCount,
      tone,
      layouts,
    );
  }

  async generateOutline(
    topic: string,
    slideCount: number,
    tone: string,
    availableLayouts: { id: string; category: string; name: string }[],
  ): Promise<OutlineSlide[]> {
    const deck = await this.generateFullDeck(topic, slideCount, tone, availableLayouts.map((l) => ({
      ...l,
      slots: [],
    })));
    return deck.slides.map((s) => ({
      layoutId: s.layoutId,
      brief: s.brief,
      ...(s.title !== undefined ? { title: s.title } : {}),
    }));
  }

  async generateSlotContent(brief: string, slots: SlotDefinition[], tone: string): Promise<SlotContent> {
    return callSlotContent(this.client, process.env.OLLAMA_TEXT_MODEL ?? 'llama3.1', brief, slots, tone);
  }

  async generateImagePrompt(slideContent: SlotContent, imageStyle: ImageStyle, brief: string): Promise<string> {
    return callImagePrompt(this.client, process.env.OLLAMA_TEXT_MODEL ?? 'llama3.1', slideContent, imageStyle, brief);
  }

  async generateImage(_prompt: string, _style: ImageStyle): Promise<Buffer> {
    throw new Error('Ollama image generation not implemented — use stock images');
  }
}

export class NvidiaNimProvider implements AIProvider {
  private client: OpenAI;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.NVIDIA_API_KEY ?? '';
    if (!this.apiKey) throw new Error('NVIDIA_API_KEY is required for nvidia provider');
    this.client = new OpenAI({
      baseURL: 'https://integrate.api.nvidia.com/v1',
      apiKey: this.apiKey,
      timeout: 120_000,
      maxRetries: 2,
    });
  }

  async generateFullDeck(
    topic: string,
    slideCount: number,
    tone: string,
    layouts: LayoutForPrompt[],
  ): Promise<FullDeckGeneration> {
    return callFullDeck(this.client, TEXT_MODEL, topic, slideCount, tone, layouts);
  }

  async generateOutline(
    topic: string,
    slideCount: number,
    tone: string,
    availableLayouts: { id: string; category: string; name: string }[],
  ): Promise<OutlineSlide[]> {
    const deck = await this.generateFullDeck(
      topic,
      slideCount,
      tone,
      availableLayouts.map((l) => ({ ...l, slots: [] })),
    );
    return deck.slides.map((s) => ({
      layoutId: s.layoutId,
      brief: s.brief,
      ...(s.title !== undefined ? { title: s.title } : {}),
    }));
  }

  async generateSlotContent(brief: string, slots: SlotDefinition[], tone: string): Promise<SlotContent> {
    return callSlotContent(this.client, TEXT_MODEL, brief, slots, tone);
  }

  async generateImagePrompt(slideContent: SlotContent, imageStyle: ImageStyle, brief: string): Promise<string> {
    return callImagePrompt(this.client, TEXT_MODEL, slideContent, imageStyle, brief);
  }

  async generateImage(prompt: string, style: ImageStyle): Promise<Buffer> {
    const res = await fetch(`https://ai.api.nvidia.com/v1/genai/${IMAGE_MODEL}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        text_prompts: [{ text: `${prompt}, ${style} style, presentation slide` }],
        cfg_scale: 7,
        steps: 30,
        seed: Math.floor(Math.random() * 1_000_000),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`NVIDIA image API error ${res.status}: ${err}`);
    }

    const data = (await res.json()) as { artifacts?: { base64: string }[] };
    const b64 = data.artifacts?.[0]?.base64;
    if (!b64) throw new Error('No image returned from NVIDIA API');
    return Buffer.from(b64, 'base64');
  }
}

async function callFullDeck(
  client: OpenAI,
  model: string,
  topic: string,
  slideCount: number,
  tone: string,
  layouts: LayoutForPrompt[],
): Promise<FullDeckGeneration> {
  const compactLayouts = layouts.map((l) => ({
    id: l.id,
    cat: l.category,
    slots: l.slots.map((s) => ({
      id: s.id,
      t: s.type,
      ...(s.required ? { req: 1 } : {}),
      ...(s.maxLength ? { max: s.maxLength } : {}),
    })),
  }));

  const response = await client.chat.completions.create({
    model,
    temperature: 0.7,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Generate a complete presentation as JSON:
{"title":"string","slides":[{"layoutId":"id","brief":"purpose","slots":{"slotId":"content"}}]}

Rules:
- Exactly ${slideCount} slides, cohesive narrative
- layoutId from provided list only; first=title category, last=closing
- Tone: ${tone}
- list slots: string arrays (3-5 items)
- chart slots: JSON string {"labels":[],"values":[]}
- image slots: 2-5 word stock photo keywords ONLY (e.g. "ocean sunset technology")
- Respect max char limits
- Fill all required slots`,
      },
      {
        role: 'user',
        content: `Topic: ${topic}\n\nLayouts: ${JSON.stringify(compactLayouts)}`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(raw) as FullDeckGeneration;

  if (!parsed.title || !Array.isArray(parsed.slides) || parsed.slides.length === 0) {
    throw new Error('AI returned invalid deck structure');
  }

  return parsed;
}

async function callSlotContent(
  client: OpenAI,
  model: string,
  brief: string,
  slots: SlotDefinition[],
  tone: string,
): Promise<SlotContent> {
  const slotSpec = slots.map((s) => ({
    id: s.id,
    type: s.type,
    maxLength: s.maxLength,
    required: s.required,
  }));

  const response = await client.chat.completions.create({
    model,
    temperature: 0.7,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Fill slide slots with content. Return JSON: { "slots": { "<slotId>": string | string[] } }. For list slots return string arrays. For chart slots return JSON string with {labels, values}. For image slots return 2-5 word stock photo search keywords. Respect maxLength. Tone: ${tone}.`,
      },
      {
        role: 'user',
        content: `Brief: ${brief}\n\nSlots: ${JSON.stringify(slotSpec)}`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(raw) as { slots: SlotContent };
  return parsed.slots;
}

async function callImagePrompt(
  client: OpenAI,
  model: string,
  slideContent: SlotContent,
  imageStyle: ImageStyle,
  brief: string,
): Promise<string> {
  const response = await client.chat.completions.create({
    model,
    temperature: 0.5,
    messages: [
      {
        role: 'system',
        content: `Return 2-5 word stock photo search keywords (nouns only) for a ${imageStyle} presentation slide image. No sentences.`,
      },
      {
        role: 'user',
        content: `Brief: ${brief}\nSlide content: ${JSON.stringify(slideContent)}`,
      },
    ],
  });

  return response.choices[0]?.message?.content?.trim() ?? brief;
}
