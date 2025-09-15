import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Eye, EyeOff, Key, CheckCircle, AlertCircle, Zap, Settings2, TestTube } from 'lucide-react';

interface APIKeyStatus {
  hasValidOpenAI: boolean;
  hasValidGroq: boolean;
  hasValidElevenLabs: boolean;
  preferredTtsService: string;
}

export function APIKeyManager() {
  const [openaiKey, setOpenaiKey] = useState('');
  const [groqKey, setGroqKey] = useState('');
  const [elevenlabsKey, setElevenlabsKey] = useState('');
  const [preferredService, setPreferredService] = useState('elevenlabs');
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [showElevenlabsKey, setShowElevenlabsKey] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current API key status
  const { data: keyStatus, isLoading } = useQuery<APIKeyStatus>({
    queryKey: ['/api/user/api-keys'],
    retry: 1,
  });

  // Update API keys mutation
  const updateKeysMutation = useMutation({
    mutationFn: async (data: { 
      openaiApiKey?: string; 
      groqApiKey?: string; 
      elevenlabsApiKey?: string;
      preferredTtsService?: string;
    }) => {
      const response = await apiRequest('PUT', '/api/user/api-keys', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/api-keys'] });
      toast({
        title: "API Keys Updated",
        description: "Your API keys have been saved successfully.",
      });
      // Clear input fields
      setOpenaiKey('');
      setGroqKey('');
      setElevenlabsKey('');
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update API keys",
        variant: "destructive",
      });
    },
  });

  // Test API key mutation
  const testKeyMutation = useMutation({
    mutationFn: async (service: 'openai' | 'groq' | 'elevenlabs') => {
      const response = await apiRequest('POST', '/api/user/test-api-key', { service });
      return response.json();
    },
    onSuccess: (data, service) => {
      toast({
        title: `${service.toUpperCase()} API Key Test`,
        description: data.valid ? "API key is valid and working!" : "API key test failed",
        variant: data.valid ? "default" : "destructive",
      });
    },
    onError: (error: any, service) => {
      toast({
        title: `${service.toUpperCase()} Test Failed`,
        description: error.message || "Failed to test API key",
        variant: "destructive",
      });
    },
  });

  const handleSaveKeys = () => {
    const updates: any = {};
    
    if (openaiKey.trim()) {
      updates.openaiApiKey = openaiKey.trim();
    }
    
    if (groqKey.trim()) {
      updates.groqApiKey = groqKey.trim();
    }
    
    if (elevenlabsKey.trim()) {
      updates.elevenlabsApiKey = elevenlabsKey.trim();
    }
    
    if (preferredService !== keyStatus?.preferredTtsService) {
      updates.preferredTtsService = preferredService;
    }
    
    if (Object.keys(updates).length > 0) {
      updateKeysMutation.mutate(updates);
    } else {
      toast({
        title: "No Changes",
        description: "No new API keys or preference changes to save.",
      });
    }
  };

  const handleTestKey = (service: 'openai' | 'groq' | 'elevenlabs') => {
    testKeyMutation.mutate(service);
  };

  React.useEffect(() => {
    if (keyStatus) {
      setPreferredService(keyStatus.preferredTtsService || 'elevenlabs');
    }
  }, [keyStatus]);

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6 text-center">
          <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-gray-400">Loading API key status...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Key className="w-5 h-5" />
          API Key Management
        </CardTitle>
        <CardDescription className="text-gray-300">
          Add your own API keys for enhanced TTS services and better voice quality
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">OpenAI:</span>
            {keyStatus?.hasValidOpenAI ? (
              <Badge className="bg-green-600 text-white">
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
              </Badge>
            ) : (
              <Badge variant="outline" className="border-gray-600 text-gray-400">
                <AlertCircle className="w-3 h-3 mr-1" />
                Not Set
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Groq:</span>
            {keyStatus?.hasValidGroq ? (
              <Badge className="bg-green-600 text-white">
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
              </Badge>
            ) : (
              <Badge variant="outline" className="border-gray-600 text-gray-400">
                <AlertCircle className="w-3 h-3 mr-1" />
                Not Set
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">ElevenLabs:</span>
            {keyStatus?.hasValidElevenLabs ? (
              <Badge className="bg-green-600 text-white">
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
              </Badge>
            ) : (
              <Badge variant="outline" className="border-gray-600 text-gray-400">
                <AlertCircle className="w-3 h-3 mr-1" />
                Not Set
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Preferred:</span>
            <Badge className="bg-purple-600 text-white">
              <Settings2 className="w-3 h-3 mr-1" />
              {keyStatus?.preferredTtsService || 'elevenlabs'}
            </Badge>
          </div>
        </div>

        {/* API Key Input Tabs */}
        <Tabs defaultValue="openai" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-700">
            <TabsTrigger value="openai" className="data-[state=active]:bg-blue-600">
              OpenAI gpt-4o-mini-tts
            </TabsTrigger>
            <TabsTrigger value="groq" className="data-[state=active]:bg-green-600">
              Groq PlayAI TTS
            </TabsTrigger>
            <TabsTrigger value="elevenlabs" className="data-[state=active]:bg-orange-600">
              ElevenLabs Premium
            </TabsTrigger>
          </TabsList>
          
          {/* OpenAI API Key */}
          <TabsContent value="openai" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="openai-key" className="text-white">
                OpenAI API Key
              </Label>
              <div className="relative">
                <Input
                  id="openai-key"
                  type={showOpenaiKey ? "text" : "password"}
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  className="bg-gray-700 border-gray-600 text-white pr-20"
                  data-testid="input-openai-key"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                    className="h-6 w-6 p-0"
                  >
                    {showOpenaiKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  {keyStatus?.hasValidOpenAI && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTestKey('openai')}
                      disabled={testKeyMutation.isPending}
                      className="h-6 w-6 p-0"
                      data-testid="button-test-openai"
                    >
                      <TestTube className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Get your API key from{' '}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  OpenAI Platform
                </a>
              </p>
            </div>
          </TabsContent>
          
          {/* Groq API Key */}
          <TabsContent value="groq" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="groq-key" className="text-white">
                Groq API Key
              </Label>
              <div className="relative">
                <Input
                  id="groq-key"
                  type={showGroqKey ? "text" : "password"}
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  placeholder="gsk_..."
                  className="bg-gray-700 border-gray-600 text-white pr-20"
                  data-testid="input-groq-key"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowGroqKey(!showGroqKey)}
                    className="h-6 w-6 p-0"
                  >
                    {showGroqKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  {keyStatus?.hasValidGroq && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTestKey('groq')}
                      disabled={testKeyMutation.isPending}
                      className="h-6 w-6 p-0"
                      data-testid="button-test-groq"
                    >
                      <TestTube className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Get your API key from{' '}
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 hover:underline"
                >
                  Groq Console
                </a>
              </p>
            </div>
          </TabsContent>
          
          {/* ElevenLabs API Key */}
          <TabsContent value="elevenlabs" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="elevenlabs-key" className="text-white">
                ElevenLabs API Key
              </Label>
              <div className="relative">
                <Input
                  id="elevenlabs-key"
                  type={showElevenlabsKey ? "text" : "password"}
                  value={elevenlabsKey}
                  onChange={(e) => setElevenlabsKey(e.target.value)}
                  placeholder="sk_..."
                  className="bg-gray-700 border-gray-600 text-white pr-20"
                  data-testid="input-elevenlabs-key"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowElevenlabsKey(!showElevenlabsKey)}
                    className="h-6 w-6 p-0"
                  >
                    {showElevenlabsKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  {keyStatus?.hasValidElevenLabs && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTestKey('elevenlabs')}
                      disabled={testKeyMutation.isPending}
                      className="h-6 w-6 p-0"
                      data-testid="button-test-elevenlabs"
                    >
                      <TestTube className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Get your API key from{' '}
                <a
                  href="https://elevenlabs.io/subscription"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-400 hover:underline"
                >
                  ElevenLabs Dashboard
                </a>
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* TTS Service Preference */}
        <div className="space-y-2">
          <Label htmlFor="preferred-service" className="text-white">
            Preferred TTS Service
          </Label>
          <Select value={preferredService} onValueChange={setPreferredService}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white" data-testid="select-preferred-tts">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              <SelectItem value="system" className="text-white">
                System (Bark + Typecast)
              </SelectItem>
              <SelectItem value="openai" className="text-white">
                OpenAI (gpt-4o-mini-tts with steerability)
              </SelectItem>
              <SelectItem value="groq" className="text-white">
                Groq (PlayAI - 10x faster)
              </SelectItem>
              <SelectItem value="elevenlabs" className="text-white">
                ElevenLabs (Premium voices with character mapping)
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-400">
            System services are always available as fallback
          </p>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSaveKeys}
          disabled={updateKeysMutation.isPending}
          className="w-full bg-purple-600 hover:bg-purple-700"
          data-testid="button-save-api-keys"
        >
          {updateKeysMutation.isPending ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Save API Keys & Preferences
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}