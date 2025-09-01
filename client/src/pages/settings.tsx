import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { APIKeyManager } from '@/components/api-key-manager';
import { Settings2, Mic, Key, Shield } from 'lucide-react';
const settingsImage = "/images/Audio_settings_interface_5e678558.png";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 relative" data-testid="page-settings">
      {/* Settings Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
        style={{ backgroundImage: `url(${settingsImage})` }}
      />
      <div className="relative z-10 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Settings2 className="w-8 h-8" />
            Settings
          </h1>
          <p className="text-gray-300">
            Customize your rap battle experience and manage your API keys
          </p>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="tts" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-gray-700">
            <TabsTrigger value="tts" className="data-[state=active]:bg-purple-600">
              <Mic className="w-4 h-4 mr-2" />
              TTS Services
            </TabsTrigger>
            <TabsTrigger value="battle" className="data-[state=active]:bg-purple-600">
              <Shield className="w-4 h-4 mr-2" />
              Battle Settings
            </TabsTrigger>
            <TabsTrigger value="account" className="data-[state=active]:bg-purple-600">
              <Key className="w-4 h-4 mr-2" />
              Account
            </TabsTrigger>
          </TabsList>

          {/* TTS Services Tab */}
          <TabsContent value="tts" className="space-y-6">
            <APIKeyManager />
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Mic className="w-5 h-5" />
                  TTS Service Comparison
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Compare different text-to-speech services for your rap battles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-gray-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-white">System (Default)</CardTitle>
                      <Badge variant="secondary">Always Available</Badge>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-gray-300">
                        <strong>Bark TTS + Typecast</strong><br/>
                        Uses admin-managed keys
                      </p>
                      <div className="text-xs text-gray-400">
                        <p>✓ Always works</p>
                        <p>✗ Slower generation</p>
                        <p>✗ Limited voice options</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-700 border-blue-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-white">OpenAI TTS</CardTitle>
                      <Badge className="bg-blue-600">Latest 2025</Badge>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-gray-300">
                        <strong>gpt-4o-mini-tts</strong><br/>
                        With "steerability" features
                      </p>
                      <div className="text-xs text-gray-400">
                        <p>✓ Authentic rapper voices</p>
                        <p>✓ Emotion control</p>
                        <p>✓ High quality audio</p>
                        <p>💰 ~$0.015 per minute</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-700 border-green-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-white">Groq TTS</CardTitle>
                      <Badge className="bg-green-600">Ultra Fast</Badge>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-gray-300">
                        <strong>PlayAI Models</strong><br/>
                        10x faster than real-time
                      </p>
                      <div className="text-xs text-gray-400">
                        <p>✓ Lightning fast</p>
                        <p>✓ Multiple voices</p>
                        <p>✓ Perfect for battles</p>
                        <p>💰 $50 per 1M characters</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Battle Settings Tab */}
          <TabsContent value="battle" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Battle Preferences</CardTitle>
                <CardDescription className="text-gray-300">
                  Customize your rap battle experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">Profanity Filter</h4>
                      <p className="text-sm text-gray-400">Filter explicit content in battles</p>
                    </div>
                    <Badge variant="outline">Coming Soon</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">Difficulty Preference</h4>
                      <p className="text-sm text-gray-400">Default difficulty for new battles</p>
                    </div>
                    <Badge variant="outline">Coming Soon</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">Audio Quality</h4>
                      <p className="text-sm text-gray-400">Audio generation quality settings</p>
                    </div>
                    <Badge variant="outline">Coming Soon</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Account Information</CardTitle>
                <CardDescription className="text-gray-300">
                  Your account details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">Profile Settings</h4>
                      <p className="text-sm text-gray-400">Update your profile information</p>
                    </div>
                    <Badge variant="outline">Coming Soon</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">Data Export</h4>
                      <p className="text-sm text-gray-400">Download your battle history and stats</p>
                    </div>
                    <Badge variant="outline">Coming Soon</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">Privacy Settings</h4>
                      <p className="text-sm text-gray-400">Control your data and privacy preferences</p>
                    </div>
                    <Badge variant="outline">Coming Soon</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}