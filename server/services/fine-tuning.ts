import { nanoid } from "nanoid";

export interface FineTuningJob {
  id: string;
  name: string;
  base_model: string;
  type: string;
  input_file_id: string;
  created_at: number;
  fine_tuned_model?: string;
  status?: string;
}

export interface RapTrainingData {
  prompt: string;
  completion: string;
  difficulty: "easy" | "normal" | "hard";
  style: string;
  rhyme_scheme?: string;
}

export class FineTuningService {
  private apiKey: string;
  private baseUrl = "https://api.groq.com/v1";

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || "";
    if (!this.apiKey) {
      throw new Error("GROQ_API_KEY environment variable is required");
    }
  }

  // Check if fine-tuning is available
  async checkFineTuningAccess(): Promise<{ available: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/fine_tunings`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 403 || response.status === 401) {
        const error = await response.json();
        if (error.error?.code === "not_available_for_plan") {
          return {
            available: false,
            message: "Fine-tuning is in closed beta. Contact Groq for access."
          };
        }
      }

      if (response.ok) {
        return {
          available: true,
          message: "Fine-tuning access confirmed"
        };
      }

      return {
        available: false,
        message: `Unknown error: ${response.statusText}`
      };
    } catch (error) {
      return {
        available: false,
        message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // List all fine-tuning jobs (when access is available)
  async listFineTunings(): Promise<FineTuningJob[]> {
    const response = await fetch(`${this.baseUrl}/fine_tunings`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list fine-tunings: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || [];
  }

  // Create a new fine-tuning job
  async createFineTuning(params: {
    name: string;
    input_file_id: string;
    base_model?: string;
    type?: string;
  }): Promise<FineTuningJob> {
    const requestBody = {
      name: params.name,
      input_file_id: params.input_file_id,
      base_model: params.base_model || "llama-3.1-8b-instant",
      type: params.type || "lora",
    };

    const response = await fetch(`${this.baseUrl}/fine_tunings`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create fine-tuning: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    return result.data;
  }

  // Get specific fine-tuning job
  async getFineTuning(id: string): Promise<FineTuningJob> {
    const response = await fetch(`${this.baseUrl}/fine_tunings/${id}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get fine-tuning: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  // Upload training data file (requires file upload endpoint)
  async uploadTrainingFile(trainingData: RapTrainingData[]): Promise<string> {
    // Convert training data to JSONL format for fine-tuning
    const jsonlData = trainingData.map(item => JSON.stringify({
      messages: [
        {
          role: "user",
          content: `Create a ${item.difficulty} difficulty rap response to: "${item.prompt}". Style: ${item.style}${item.rhyme_scheme ? `. Rhyme scheme: ${item.rhyme_scheme}` : ''}`
        },
        {
          role: "assistant",
          content: item.completion
        }
      ]
    })).join('\n');

    const formData = new FormData();
    const blob = new Blob([jsonlData], { type: 'application/json' });
    formData.append('file', blob, 'rap_training_data.jsonl');
    formData.append('purpose', 'fine-tune');

    const response = await fetch(`${this.baseUrl}/files`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to upload file: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    return result.id;
  }

  // Generate sample training data for rap fine-tuning
  generateSampleRapData(): RapTrainingData[] {
    return [
      {
        prompt: "Drop some bars about overcoming challenges",
        completion: "Started from the bottom, now I'm climbing every mountain peak\nEvery obstacle I face just makes my spirit antique\nThey said I couldn't make it, but I turned their doubt to fuel\nNow I'm breaking every barrier, rewriting every rule\nChallenges ain't roadblocks, they're stepping stones to greatness\nEvery setback's a setup for my ultimate amazingness",
        difficulty: "normal",
        style: "motivational",
        rhyme_scheme: "AABBCC"
      },
      {
        prompt: "Rap about technology and the future",
        completion: "Digital revolution, I'm the architect of code\nArtificial intelligence walking down this cyber road\nQuantum computing power in the palm of my hand\nBuilding virtual empires across this digital land\nFuture's here today, don't need to wait for tomorrow\nTechnology's my weapon, innovation's what I borrow",
        difficulty: "normal",
        style: "futuristic",
        rhyme_scheme: "AABBCC"
      },
      {
        prompt: "Battle rap response to someone challenging you",
        completion: "You think you can step to me? That's your first mistake\nMy lyrical precision leaves your reputation fake\nEvery bar I spit is like a surgical incision\nCutting through your weak flows with mathematical precision\nYou brought a water gun to this nuclear war zone\nWhen I'm done with you, you'll be crying all alone",
        difficulty: "hard",
        style: "aggressive",
        rhyme_scheme: "AABBCC"
      },
      {
        prompt: "Freestyle about success and ambition",
        completion: "Vision crystal clear like I'm looking through a lens\nSuccess ain't a destination, it's a journey that never ends\nAmbition in my DNA, can't nobody hold me back\nTurning every single setback into a comeback track\nRising to the top like smoke from a fire\nEvery goal that I achieve just takes me higher and higher",
        difficulty: "easy",
        style: "inspirational",
        rhyme_scheme: "AABBCC"
      },
      {
        prompt: "Rap about street life and authenticity",
        completion: "Real recognize real, that's the code of the street\nAuthenticity's my currency, never face defeat\nGrew up in the struggle, had to hustle for my dreams\nNow I'm painting vivid pictures with these lyrical scenes\nStay true to yourself, that's the lesson I learned\nEvery bridge I ever crossed, I never let it burn",
        difficulty: "normal",
        style: "street",
        rhyme_scheme: "AABBCC"
      }
    ];
  }

  // Export training data as JSONL for external fine-tuning
  exportTrainingDataAsJSONL(trainingData: RapTrainingData[]): string {
    return trainingData.map(item => JSON.stringify({
      messages: [
        {
          role: "user", 
          content: `Create a ${item.difficulty} difficulty rap response to: "${item.prompt}". Style: ${item.style}${item.rhyme_scheme ? `. Rhyme scheme: ${item.rhyme_scheme}` : ''}`
        },
        {
          role: "assistant",
          content: item.completion
        }
      ]
    })).join('\n');
  }
}