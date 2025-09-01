import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Brain, Upload, Download, CheckCircle, AlertCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
const fineTuningImage = "/images/AI_training_interface_dac1a3f8.png";

interface FineTuningJob {
  id: string;
  name: string;
  base_model: string;
  type: string;
  input_file_id: string;
  created_at: number;
  fine_tuned_model?: string;
  status?: string;
}

interface FineTuningResponse {
  available: boolean;
  message: string;
  models: FineTuningJob[];
}

interface SampleDataResponse {
  sample_data: {
    prompt: string;
    completion: string;
    difficulty: string;
    style: string;
    rhyme_scheme?: string;
  }[];
  jsonl_format: string;
  instructions: string;
}

export default function FineTuning() {
  const [newModelName, setNewModelName] = useState("");
  const [trainingDataText, setTrainingDataText] = useState("");

  // Fetch existing fine-tuned models
  const { data: fineTuningData, isLoading } = useQuery<FineTuningResponse>({
    queryKey: ["/api/fine-tunings"],
  });

  // Fetch sample training data
  const { data: sampleData } = useQuery<SampleDataResponse>({
    queryKey: ["/api/training-data/sample"],
  });

  // Create new fine-tuning job
  const createFineTuning = useMutation({
    mutationFn: async (data: { name: string; training_data: any[] }) => {
      return apiRequest("/api/fine-tunings", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fine-tunings"] });
      setNewModelName("");
      setTrainingDataText("");
    },
  });

  const handleCreateModel = () => {
    if (!newModelName.trim()) return;

    let trainingData;
    try {
      // Try to parse as JSON first
      trainingData = JSON.parse(trainingDataText);
    } catch {
      // If not JSON, use sample data
      trainingData = sampleData?.sample_data || [];
    }

    createFineTuning.mutate({
      name: newModelName,
      training_data: trainingData,
    });
  };

  const downloadSampleData = () => {
    if (!sampleData) return;
    
    const blob = new Blob([sampleData.jsonl_format], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rap_training_data.jsonl';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-accent-gold" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6 relative">
      {/* Fine-tuning Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-5"
        style={{ backgroundImage: `url(${fineTuningImage})` }}
      />
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
          <Brain className="h-8 w-8 text-accent-gold" />
          Fine-Tuned Rap Models
        </h1>
        <p className="text-gray-400">
          Manage and create custom rap models trained on your data
        </p>
      </div>

      {/* Fine-tuning Status */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Status:</strong> {fineTuningData?.message}
          {!fineTuningData?.available && (
            <div className="mt-2">
              <span className="text-sm">
                Fine-tuning is currently in closed beta. Contact Groq support for access.
              </span>
            </div>
          )}
        </AlertDescription>
      </Alert>

      {/* Existing Models */}
      <Card className="bg-card-dark border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Your Fine-Tuned Models
          </CardTitle>
          <CardDescription>
            Models you've created and trained for rap battles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fineTuningData?.models && fineTuningData.models.length > 0 ? (
            <div className="space-y-4">
              {fineTuningData.models.map((model) => (
                <div
                  key={model.id}
                  className="flex items-center justify-between p-4 bg-secondary-dark rounded-lg border border-gray-600"
                >
                  <div>
                    <h3 className="font-semibold text-white">{model.name}</h3>
                    <p className="text-sm text-gray-400">
                      Base: {model.base_model} • Type: {model.type}
                    </p>
                    <p className="text-xs text-gray-500">
                      Created: {new Date(model.created_at * 1000).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {model.status || "Active"}
                    </Badge>
                    {model.fine_tuned_model && (
                      <Badge className="bg-accent-gold text-black">
                        Model ID: {model.fine_tuned_model}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No fine-tuned models found</p>
              <p className="text-sm">Create your first custom rap model below</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create New Model */}
      <Card className="bg-card-dark border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Upload className="h-5 w-5 text-accent-gold" />
            Create New Model
          </CardTitle>
          <CardDescription>
            Train a custom rap model with your own data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="model-name" className="text-white">
              Model Name
            </Label>
            <Input
              id="model-name"
              value={newModelName}
              onChange={(e) => setNewModelName(e.target.value)}
              placeholder="My Custom Rap Model"
              className="bg-secondary-dark border-gray-600 text-white"
              data-testid="input-model-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="training-data" className="text-white">
              Training Data (JSON Format)
            </Label>
            <Textarea
              id="training-data"
              value={trainingDataText}
              onChange={(e) => setTrainingDataText(e.target.value)}
              placeholder="Paste your training data JSON here, or leave empty to use sample data..."
              className="bg-secondary-dark border-gray-600 text-white min-h-[120px]"
              data-testid="textarea-training-data"
            />
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={handleCreateModel}
              disabled={!newModelName.trim() || createFineTuning.isPending || !fineTuningData?.available}
              className="bg-accent-gold hover:bg-yellow-600 text-black"
              data-testid="button-create-model"
            >
              {createFineTuning.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Create Model
            </Button>

            <Button
              variant="outline"
              onClick={downloadSampleData}
              className="border-gray-600 text-white hover:bg-secondary-dark"
              data-testid="button-download-sample"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Sample Data
            </Button>
          </div>

          {createFineTuning.error && (
            <Alert className="border-red-500">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-400">
                Failed to create model: {(createFineTuning.error as Error).message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Sample Data Preview */}
      {sampleData && (
        <Card className="bg-card-dark border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Sample Training Data</CardTitle>
            <CardDescription>
              Example format for training your rap model
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sampleData.sample_data?.slice(0, 2).map((item, index: number) => (
                <div key={index} className="p-4 bg-secondary-dark rounded-lg border border-gray-600">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-accent-gold font-semibold mb-1">Prompt:</p>
                      <p className="text-gray-300">"{item.prompt}"</p>
                    </div>
                    <div>
                      <p className="text-accent-gold font-semibold mb-1">Style Info:</p>
                      <p className="text-gray-400">
                        {item.difficulty} • {item.style} • {item.rhyme_scheme}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-accent-gold font-semibold mb-1">Response:</p>
                      <p className="text-gray-300 whitespace-pre-line">"{item.completion}"</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}