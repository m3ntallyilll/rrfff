import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { 
  BarChart3, 
  Zap, 
  Lightbulb, 
  Target, 
  Eye, 
  Music,
  Crown,
  Flame,
  Sparkles
} from "lucide-react";

interface DetailedScoreBreakdown {
  totalScore: number;
  rhymeDensity: number;
  flowQuality: number;
  creativity: number;
  reasoningInsights?: any; // Add reasoning insights field
  enhancedRhymes?: any;
  phoneticBreakdown?: any;
  
  rhymeAnalysis: {
    endRhymes: number;
    internalRhymes: number;
    multiSyllableRhymes: number;
    endRhymeScore: number;
    internalRhymeScore: number;
    multiSyllableScore: number;
  };
  
  flowAnalysis: {
    averageSyllables: number;
    averageWords: number;
    idealSyllableRange: [number, number];
    idealWordRange: [number, number];
    linesInRange: number;
    totalLines: number;
  };
  
  creativityAnalysis: {
    lexicalDiversity: number;
    wordplayScore: number;
    metaphorScore: number;
    battleTacticsScore: number;
    originalityScore: number;
    detectedWordplay: string[];
    detectedMetaphors: string[];
    battlePhrases: string[];
  };
  
  lines: Array<{
    text: string;
    lineNumber: number;
    syllableCount: number;
    wordCount: number;
    flowScore: number;
    endWord: string;
    rhymeScheme: string;
  }>;
  
  highlightData: {
    rhymes: Array<{ words: string[]; type: 'end' | 'internal' | 'multi'; color: string }>;
    wordplay: Array<{ phrase: string; type: string; explanation: string }>;
    metaphors: Array<{ phrase: string; explanation: string }>;
  };
}

interface LyricBreakdownProps {
  text: string;
  isVisible: boolean;
  onClose: () => void;
}

export function LyricBreakdown({ text, isVisible, onClose }: LyricBreakdownProps) {
  const [analysis, setAnalysis] = useState<DetailedScoreBreakdown | null>(null);
  const [loading, setLoading] = useState(false);
  const [highlightedText, setHighlightedText] = useState("");

  // Don't render anything if not visible
  if (!isVisible) {
    return null;
  }

  useEffect(() => {
    if (isVisible && text) {
      analyzeText();
    }
  }, [isVisible, text]);

  const analyzeText = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/analyze-lyrics", {
        method: "POST",
        body: JSON.stringify({ text }),
        headers: { "Content-Type": "application/json" }
      });
      const result = await response.json();
      setAnalysis(result);
      generateHighlightedText(result);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateHighlightedText = (analysisData: DetailedScoreBreakdown) => {
    let highlighted = text;
    
    // Apply rhyme highlights - with null checks
    if (analysisData.highlightData?.rhymes?.length) {
      analysisData.highlightData.rhymes.forEach((rhyme, index) => {
        if (rhyme.words?.length) {
          rhyme.words.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            highlighted = highlighted.replace(regex, 
              `<span class="rhyme-highlight" style="background-color: ${rhyme.color}30; border: 2px solid ${rhyme.color}; border-radius: 4px; padding: 1px 3px;" title="Rhyme: ${rhyme.type}">$&</span>`
            );
          });
        }
      });
    }

    // Apply wordplay highlights - with null checks
    if (analysisData.highlightData?.wordplay?.length) {
      analysisData.highlightData.wordplay.forEach(wordplay => {
        const regex = new RegExp(`\\b${wordplay.phrase}\\b`, 'gi');
        highlighted = highlighted.replace(regex, 
          `<span class="wordplay-highlight" style="background-color: #FFD700; border-radius: 4px; padding: 1px 3px; font-weight: bold;" title="${wordplay.explanation}">$&</span>`
        );
      });
    }

    // Apply metaphor highlights - with null checks
    if (analysisData.highlightData?.metaphors?.length) {
      analysisData.highlightData.metaphors.forEach(metaphor => {
        const regex = new RegExp(`\\b${metaphor.phrase}\\b`, 'gi');
        highlighted = highlighted.replace(regex, 
          `<span class="metaphor-highlight" style="background-color: #9C27B0; color: white; border-radius: 4px; padding: 1px 3px;" title="${metaphor.explanation}">$&</span>`
        );
      });
    }

    setHighlightedText(highlighted);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreIcon = (category: string) => {
    switch (category) {
      case "rhyme": return <Music className="w-4 h-4" />;
      case "flow": return <Zap className="w-4 h-4" />;
      case "creativity": return <Lightbulb className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Interactive Lyric Breakdown</h2>
          </div>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span>Analyzing lyrics...</span>
            </div>
          </div>
        ) : analysis ? (
          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="overview" className="h-full flex flex-col">
              <div className="px-6 pt-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="rhymes">Rhyme Analysis</TabsTrigger>
                  <TabsTrigger value="flow">Flow Quality</TabsTrigger>
                  <TabsTrigger value="creativity">Creativity</TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-hidden px-6 pb-6">
                <TabsContent value="overview" className="h-full mt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                    {/* Highlighted Text */}
                    <Card className="flex flex-col">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Eye className="w-5 h-5" />
                          Interactive Text Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <ScrollArea className="h-full">
                          <div 
                            className="text-sm leading-relaxed font-mono whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{ __html: highlightedText }}
                          />
                        </ScrollArea>
                      </CardContent>
                    </Card>

                    {/* Score Overview */}
                    <div className="space-y-4">
                      {/* Total Score */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Crown className="w-5 h-5 text-yellow-500" />
                            Overall Score
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center">
                            <div className="text-4xl font-bold mb-2">
                              <span className={getScoreColor(analysis.totalScore)}>
                                {analysis.totalScore}/100
                              </span>
                            </div>
                            <Progress value={analysis.totalScore} className="w-full" />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Category Breakdown */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Category Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {[
                            { name: "Rhyme Density", score: analysis.rhymeDensity, weight: "40%", icon: "rhyme" },
                            { name: "Flow Quality", score: analysis.flowQuality, weight: "35%", icon: "flow" },
                            { name: "Creativity", score: analysis.creativity, weight: "25%", icon: "creativity" }
                          ].map((category) => (
                            <div key={category.name} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {getScoreIcon(category.icon)}
                                  <span className="font-medium">{category.name}</span>
                                  <Badge variant="secondary">{category.weight}</Badge>
                                </div>
                                <span className={`font-bold ${getScoreColor(category.score)}`}>
                                  {category.score}/100
                                </span>
                              </div>
                              <Progress value={category.score} className="h-2" />
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      {/* Line by Line Analysis */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Line Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ScrollArea className="h-40">
                            <div className="space-y-2">
                              {analysis.lines.map((line) => (
                                <TooltipProvider key={line.lineNumber}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50 cursor-help">
                                        <div className="flex items-center gap-2">
                                          <Badge variant="outline" className="w-8 text-xs">
                                            {line.lineNumber}
                                          </Badge>
                                          <span className="text-sm truncate max-w-48">
                                            {line.text}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Badge className={getScoreColor(line.flowScore)}>
                                            {line.flowScore}%
                                          </Badge>
                                          <Badge variant="secondary" className="text-xs">
                                            {line.rhymeScheme}
                                          </Badge>
                                        </div>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="text-sm">
                                        <div>Syllables: {line.syllableCount}</div>
                                        <div>Words: {line.wordCount}</div>
                                        <div>End word: "{line.endWord}"</div>
                                        <div>Flow score: {line.flowScore}%</div>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ))}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="rhymes" className="h-full mt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Music className="w-5 h-5" />
                          Rhyme Breakdown
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold text-blue-500">
                              {analysis.rhymeAnalysis.endRhymes}
                            </div>
                            <div className="text-sm text-muted-foreground">End Rhymes</div>
                            <Badge className="mt-1">{analysis.rhymeAnalysis.endRhymeScore}/50</Badge>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-green-500">
                              {analysis.rhymeAnalysis.internalRhymes}
                            </div>
                            <div className="text-sm text-muted-foreground">Internal Rhymes</div>
                            <Badge className="mt-1">{analysis.rhymeAnalysis.internalRhymeScore}/30</Badge>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-purple-500">
                              {analysis.rhymeAnalysis.multiSyllableRhymes}
                            </div>
                            <div className="text-sm text-muted-foreground">Multi-Syllable</div>
                            <Badge className="mt-1">{analysis.rhymeAnalysis.multiSyllableScore}/20</Badge>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h4 className="font-semibold mb-2">Scoring Formula:</h4>
                          <div className="text-sm space-y-1 text-muted-foreground">
                            <div>• End rhymes: 50% weight (line endings)</div>
                            <div>• Internal rhymes: 30% weight (within lines)</div>
                            <div>• Multi-syllable rhymes: 20% weight (complex patterns)</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Rhyme Highlights</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-64">
                          <div className="space-y-2">
                            {analysis.highlightData?.rhymes?.map((rhyme, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 rounded border">
                                <div 
                                  className="w-4 h-4 rounded" 
                                  style={{ backgroundColor: rhyme.color }}
                                />
                                <div className="flex-1">
                                  <div className="font-mono text-sm">
                                    {rhyme.words.join(" ↔ ")}
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {rhyme.type} rhyme
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="flow" className="h-full mt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="w-5 h-5" />
                          Flow Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold">
                              {analysis.flowAnalysis.averageSyllables}
                            </div>
                            <div className="text-sm text-muted-foreground">Avg Syllables</div>
                            <div className="text-xs text-green-600">
                              Target: {analysis.flowAnalysis.idealSyllableRange.join("-")}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold">
                              {analysis.flowAnalysis.averageWords}
                            </div>
                            <div className="text-sm text-muted-foreground">Avg Words</div>
                            <div className="text-xs text-green-600">
                              Target: {analysis.flowAnalysis.idealWordRange.join("-")}
                            </div>
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="text-lg font-semibold">
                            {analysis.flowAnalysis.linesInRange}/{analysis.flowAnalysis.totalLines}
                          </div>
                          <div className="text-sm text-muted-foreground">Lines in Ideal Range</div>
                          <Progress 
                            value={(analysis.flowAnalysis.linesInRange / analysis.flowAnalysis.totalLines) * 100} 
                            className="mt-2"
                          />
                        </div>

                        <Separator />

                        <div>
                          <h4 className="font-semibold mb-2">Flow Guidelines:</h4>
                          <div className="text-sm space-y-1 text-muted-foreground">
                            <div>• Ideal syllables per line: 8-16</div>
                            <div>• Ideal words per line: 4-8</div>
                            <div>• Consistent rhythm and pacing</div>
                            <div>• Natural breath points</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="creativity" className="h-full mt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lightbulb className="w-5 h-5" />
                          Creativity Breakdown
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <div className="text-lg font-bold text-blue-500">
                              {analysis.creativityAnalysis.lexicalDiversity}%
                            </div>
                            <div className="text-xs text-muted-foreground">Lexical Diversity</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-green-500">
                              {analysis.creativityAnalysis.wordplayScore}
                            </div>
                            <div className="text-xs text-muted-foreground">Wordplay</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-purple-500">
                              {analysis.creativityAnalysis.metaphorScore}
                            </div>
                            <div className="text-xs text-muted-foreground">Metaphors</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-red-500">
                              {analysis.creativityAnalysis.battleTacticsScore}
                            </div>
                            <div className="text-xs text-muted-foreground">Battle Tactics</div>
                          </div>
                        </div>

                        {analysis.creativityAnalysis.detectedWordplay.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-1">
                              <Sparkles className="w-4 h-4" />
                              Detected Wordplay
                            </h4>
                            <div className="space-y-1">
                              {analysis.creativityAnalysis.detectedWordplay?.map((play, index) => (
                                <Badge key={index} variant="outline" className="mr-1">
                                  {play}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {analysis.creativityAnalysis.detectedMetaphors.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-1">
                              <Flame className="w-4 h-4" />
                              Metaphors & Imagery
                            </h4>
                            <div className="space-y-1">
                              {analysis.creativityAnalysis.detectedMetaphors?.map((metaphor, index) => (
                                <Badge key={index} variant="secondary" className="mr-1">
                                  {metaphor}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No analysis data available</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}