import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Eye, EyeOff, Key, Mic, Zap } from 'lucide-react';

interface APIKeysData {
  openaiApiKey?: string;
  groqApiKey?: string;
  preferredTtsService: string;
  hasValidOpenAI: boolean;
  hasValidGroq: boolean;
}

export function APIKeyManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showKeys, setShowKeys] = useState({ openai: false, groq: false });
  const [newKeys, setNewKeys] = useState({ openai: '', groq: '' });

  const { data: apiKeysData, isLoading } = useQuery<APIKeysData>({
    queryKey: ['/api/user/api-keys'],
    retry: false,
  });

  const updateKeysMutation = useMutation({
    mutationFn: async (data: { 
      openaiApiKey?: string; 
      groqApiKey?: string; 
      preferredTtsService?: string 
    }) => {
      return await apiRequest('PUT', '/api/user/api-keys', data);
    },
    onSuccess: () => {
      toast({
        title: "API Keys Updated",
        description: "Your API keys have been saved securely.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/api-keys'] });
      setNewKeys({ openai: '', groq: '' });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const testKeyMutation = useMutation({
    mutationFn: async (service: 'openai' | 'groq') => {
      return await apiRequest('POST', '/api/user/test-api-key', { service });
    },
    onSuccess: (data, service) => {
      toast({
        title: `${service === 'openai' ? 'OpenAI' : 'Groq'} Key Valid`,
        description: `Your ${service === 'openai' ? 'OpenAI' : 'Groq'} API key is working correctly.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/api-keys'] });
    },
    onError: (error, service) => {
      toast({
        title: `${service === 'openai' ? 'OpenAI' : 'Groq'} Key Invalid`,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpdateKeys = () => {
    const updateData: any = {};
    if (newKeys.openai) updateData.openaiApiKey = newKeys.openai;
    if (newKeys.groq) updateData.groqApiKey = newKeys.groq;
    
    updateKeysMutation.mutate(updateData);
  };

  const handlePreferenceChange = (service: string) => {
    updateKeysMutation.mutate({ preferredTtsService: service });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-300 rounded w-1/3"></div>
            <div className="h-10 bg-gray-300 rounded"></div>
            <div className="h-10 bg-gray-300 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl" data-testid="api-key-manager">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          API Key Management
        </CardTitle>
        <CardDescription>
          Manage your personal API keys for enhanced TTS services. Your keys are encrypted and stored securely.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="keys" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="keys">API Keys</TabsTrigger>
            <TabsTrigger value="preferences">TTS Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="keys" className="space-y-6">
            {/* OpenAI API Key */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="openai-key" className="text-base font-medium">
                  OpenAI API Key
                </Label>
                <div className="flex items-center gap-2">
                  {apiKeysData?.hasValidOpenAI ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <Zap className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Not Set</Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testKeyMutation.mutate('openai')}
                    disabled={!apiKeysData?.hasValidOpenAI || testKeyMutation.isPending}
                    data-testid="test-openai-key"
                  >
                    Test
                  </Button>
                </div>
              </div>
              
              <div className="relative">
                <Input
                  id="openai-key"
                  type={showKeys.openai ? "text" : "password"}
                  placeholder="sk-..."
                  value={newKeys.openai}
                  onChange={(e) => setNewKeys({ ...newKeys, openai: e.target.value })}
                  data-testid="input-openai-key"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowKeys({ ...showKeys, openai: !showKeys.openai })}
                >
                  {showKeys.openai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p><strong>Features:</strong> Latest gpt-4o-mini-tts model with "steerability" - create authentic rapper voices</p>
                <p><strong>Get Key:</strong> <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener" className="text-blue-600 hover:underline">platform.openai.com/api-keys</a></p>
              </div>
            </div>

            {/* Groq API Key */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="groq-key" className="text-base font-medium">
                  Groq API Key
                </Label>
                <div className="flex items-center gap-2">
                  {apiKeysData?.hasValidGroq ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <Zap className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Not Set</Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testKeyMutation.mutate('groq')}
                    disabled={!apiKeysData?.hasValidGroq || testKeyMutation.isPending}
                    data-testid="test-groq-key"
                  >
                    Test
                  </Button>
                </div>
              </div>
              
              <div className="relative">
                <Input
                  id="groq-key"
                  type={showKeys.groq ? "text" : "password"}
                  placeholder="gsk_..."
                  value={newKeys.groq}
                  onChange={(e) => setNewKeys({ ...newKeys, groq: e.target.value })}
                  data-testid="input-groq-key"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowKeys({ ...showKeys, groq: !showKeys.groq })}
                >
                  {showKeys.groq ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p><strong>Features:</strong> PlayAI TTS models - 10x faster than real-time, perfect for rap battles</p>
                <p><strong>Get Key:</strong> <a href="https://console.groq.com/keys" target="_blank" rel="noopener" className="text-blue-600 hover:underline">console.groq.com/keys</a></p>
              </div>
            </div>

            <Button 
              onClick={handleUpdateKeys}
              disabled={updateKeysMutation.isPending || (!newKeys.openai && !newKeys.groq)}
              className="w-full"
              data-testid="button-save-keys"
            >
              {updateKeysMutation.isPending ? "Saving..." : "Save API Keys"}
            </Button>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <div className="space-y-4">
              <Label className="text-base font-medium">Preferred TTS Service</Label>
              
              <Select 
                value={apiKeysData?.preferredTtsService || "system"} 
                onValueChange={handlePreferenceChange}
              >
                <SelectTrigger data-testid="select-tts-preference">
                  <SelectValue placeholder="Choose your preferred TTS service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <Mic className="w-4 h-4" />
                      System (Bark + Typecast Fallback)
                    </div>
                  </SelectItem>
                  <SelectItem value="openai" disabled={!apiKeysData?.hasValidOpenAI}>
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      OpenAI gpt-4o-mini-tts (Steerability)
                    </div>
                  </SelectItem>
                  <SelectItem value="groq" disabled={!apiKeysData?.hasValidGroq}>
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Groq PlayAI (10x Faster)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">System (Default)</h4>
                    <p className="text-sm text-muted-foreground">Uses admin keys, slower but always available</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">OpenAI TTS</h4>
                    <p className="text-sm text-muted-foreground">Latest model with authentic rapper voice control</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Groq TTS</h4>
                    <p className="text-sm text-muted-foreground">Ultra-fast PlayAI models for instant battles</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}