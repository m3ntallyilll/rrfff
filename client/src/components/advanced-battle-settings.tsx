import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings, Zap, Shield, Volume2, Brain, Target } from "lucide-react";

interface AdvancedBattleSettingsProps {
  difficulty: "easy" | "normal" | "hard";
  profanityFilter: boolean;
  onDifficultyChange: (difficulty: "easy" | "normal" | "hard") => void;
  onProfanityFilterChange: (enabled: boolean) => void;
  advancedSettings?: {
    aiAggressiveness: number;
    responseTime: number;
    analysisDepth: "basic" | "enhanced" | "reasoning";
    voiceSpeed: number;
    battleLength: number;
  };
  onAdvancedSettingsChange?: (settings: any) => void;
}

export function AdvancedBattleSettings({
  difficulty,
  profanityFilter,
  onDifficultyChange,
  onProfanityFilterChange,
  advancedSettings = {
    aiAggressiveness: 75,
    responseTime: 3000,
    analysisDepth: "enhanced",
    voiceSpeed: 1.0,
    battleLength: 5
  },
  onAdvancedSettingsChange
}: AdvancedBattleSettingsProps) {
  
  const updateAdvancedSetting = (key: string, value: any) => {
    const newSettings = { ...advancedSettings, [key]: value };
    onAdvancedSettingsChange?.(newSettings);
  };

  const getDifficultyDescription = (level: string) => {
    switch (level) {
      case "easy": return "Simple rhymes, basic wordplay, beginner-friendly battles";
      case "normal": return "Complex rhymes, clever wordplay, competitive battles";  
      case "hard": return "Advanced techniques, hardcore battles, professional level";
      default: return "";
    }
  };

  const getAnalysisDescription = (depth: string) => {
    switch (depth) {
      case "basic": return "Fast analysis with core metrics";
      case "enhanced": return "Comprehensive analysis with detailed breakdown";
      case "reasoning": return "AI-powered deep phonetic analysis with step-by-step reasoning";
      default: return "";
    }
  };

  return (
    <div className="space-y-4">
      {/* Core Battle Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Battle Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Difficulty Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Difficulty Level</Label>
            <Select value={difficulty} onValueChange={onDifficultyChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">Easy</Badge>
                    <span>Beginner</span>
                  </div>
                </SelectItem>
                <SelectItem value="normal">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Normal</Badge>
                    <span>Intermediate</span>
                  </div>
                </SelectItem>
                <SelectItem value="hard">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-red-100 text-red-800">Hard</Badge>
                    <span>Expert</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {getDifficultyDescription(difficulty)}
            </p>
          </div>

          {/* Profanity Filter */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Content Filter
              </Label>
              <p className="text-xs text-muted-foreground">
                {profanityFilter 
                  ? "Clean language mode - family friendly" 
                  : "Uncensored mode - authentic street rap language"
                }
              </p>
            </div>
            <Switch 
              checked={profanityFilter} 
              onCheckedChange={onProfanityFilterChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Advanced Settings
            <Badge variant="outline">Pro</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* AI Aggressiveness */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4" />
              AI Aggressiveness: {advancedSettings.aiAggressiveness}%
            </Label>
            <Slider
              value={[advancedSettings.aiAggressiveness]}
              onValueChange={(value) => updateAdvancedSetting("aiAggressiveness", value[0])}
              max={100}
              step={5}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Controls how aggressive and confrontational the AI opponent will be
            </p>
          </div>

          {/* Analysis Depth */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Lyric Analysis Engine</Label>
            <Select 
              value={advancedSettings.analysisDepth} 
              onValueChange={(value) => updateAdvancedSetting("analysisDepth", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span>Basic Analysis</span>
                  </div>
                </SelectItem>
                <SelectItem value="enhanced">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    <span>Enhanced Analysis</span>
                  </div>
                </SelectItem>
                <SelectItem value="reasoning">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    <span>AI Reasoning Engine</span>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                      New
                    </Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {getAnalysisDescription(advancedSettings.analysisDepth)}
            </p>
          </div>

          {/* Voice Speed */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              Voice Speed: {advancedSettings.voiceSpeed.toFixed(1)}x
            </Label>
            <Slider
              value={[advancedSettings.voiceSpeed * 100]}
              onValueChange={(value) => updateAdvancedSetting("voiceSpeed", value[0] / 100)}
              min={50}
              max={200}
              step={10}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Adjust playback speed of AI-generated voices
            </p>
          </div>

          {/* Battle Length */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Battle Rounds: {advancedSettings.battleLength}
            </Label>
            <Slider
              value={[advancedSettings.battleLength]}
              onValueChange={(value) => updateAdvancedSetting("battleLength", value[0])}
              min={3}
              max={10}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Number of rounds in the battle (3-10)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}