import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BarChart3, X, Flame, Zap, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SimpleAnalyzerProps {
  text: string;
  onClose: () => void;
  isVisible: boolean;
}

interface RhymeAnalysis {
  rhymeDensity: {
    score: number;
    endRhymes: string[];
    internalRhymes: string[];
    multiSyllabicRhymes: string[];
  };
  flowAnalysis: {
    score: number;
    syllablePattern: number[];
    rhythmConsistency: number;
  };
  creativityAnalysis: {
    score: number;
    detectedWordplay: string[];
    detectedMetaphors: string[];
    originalityScore: number;
  };
  overallScore: number;
}

export function SimpleAnalyzer({ text, onClose, isVisible }: SimpleAnalyzerProps) {
  const [analysis, setAnalysis] = useState<RhymeAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isVisible && text) {
      analyzeText();
    }
  }, [isVisible, text]);

  const analyzeText = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analyze-lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-void-black border border-cyber-red rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-orbitron font-bold text-cyber-red flex items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                Rhyme Analysis
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-white"
                data-testid="button-close-analyzer"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-cyber-red border-t-transparent rounded-full" />
                <span className="ml-3 text-gray-400">Analyzing lyrics...</span>
              </div>
            ) : analysis ? (
              <div className="space-y-6">
                {/* Overall Score */}
                <Card className="bg-secondary-dark border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-accent-gold flex items-center gap-2">
                      <Star className="w-5 h-5" />
                      Overall Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-cyber-red mb-2">
                      {analysis.overallScore}/100
                    </div>
                    <Progress value={analysis.overallScore} className="h-3" />
                  </CardContent>
                </Card>

                <div className="grid md:grid-cols-3 gap-4">
                  {/* Rhyme Density */}
                  <Card className="bg-secondary-dark border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-accent-red flex items-center gap-2">
                        <Flame className="w-4 h-4" />
                        Rhyme Density
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-semibold mb-2">
                        {analysis.rhymeDensity.score}/100
                      </div>
                      <Progress value={analysis.rhymeDensity.score} className="mb-3" />
                      
                      {analysis.rhymeDensity.endRhymes.length > 0 && (
                        <div className="mb-2">
                          <h4 className="font-semibold mb-1 text-sm">End Rhymes:</h4>
                          <div className="flex flex-wrap gap-1">
                            {analysis.rhymeDensity.endRhymes.slice(0, 4).map((rhyme, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {rhyme}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {analysis.rhymeDensity.internalRhymes.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-1 text-sm">Internal Rhymes:</h4>
                          <div className="flex flex-wrap gap-1">
                            {analysis.rhymeDensity.internalRhymes.slice(0, 3).map((rhyme, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {rhyme}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Flow Analysis */}
                  <Card className="bg-secondary-dark border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-accent-blue flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Flow Quality
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-semibold mb-2">
                        {analysis.flowAnalysis.score}/100
                      </div>
                      <Progress value={analysis.flowAnalysis.score} className="mb-3" />
                      
                      <div className="text-sm text-gray-400">
                        <div>Rhythm: {analysis.flowAnalysis.rhythmConsistency}%</div>
                        <div>Syllables: {analysis.flowAnalysis.syllablePattern.join('-')}</div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Creativity */}
                  <Card className="bg-secondary-dark border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-accent-gold flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        Creativity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-semibold mb-2">
                        {analysis.creativityAnalysis.score}/100
                      </div>
                      <Progress value={analysis.creativityAnalysis.score} className="mb-3" />
                      
                      {analysis.creativityAnalysis.detectedWordplay.length > 0 && (
                        <div className="mb-2">
                          <h4 className="font-semibold mb-1 text-sm">Wordplay:</h4>
                          <div className="flex flex-wrap gap-1">
                            {analysis.creativityAnalysis.detectedWordplay.slice(0, 2).map((wordplay, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {wordplay}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {analysis.creativityAnalysis.detectedMetaphors.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-1 text-sm">Metaphors:</h4>
                          <div className="flex flex-wrap gap-1">
                            {analysis.creativityAnalysis.detectedMetaphors.slice(0, 2).map((metaphor, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {metaphor}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Original Text */}
                <Card className="bg-secondary-dark border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-gray-300">Analyzed Text</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-void-black p-4 rounded border border-gray-600 text-gray-300 whitespace-pre-wrap font-mono text-sm">
                      {text}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="flex items-center justify-center py-12 text-gray-400">
                <BarChart3 className="w-12 h-12 opacity-50 mr-4" />
                <div>
                  <p className="text-lg">No analysis available</p>
                  <p className="text-sm">Enter some lyrics to see detailed analysis</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}