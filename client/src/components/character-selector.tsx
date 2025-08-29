import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BATTLE_CHARACTERS, type BattleCharacter } from "@shared/characters";

interface CharacterSelectorProps {
  onCharacterSelect: (character: BattleCharacter) => void;
  selectedCharacter?: BattleCharacter;
}

export function CharacterSelector({ onCharacterSelect, selectedCharacter }: CharacterSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">Choose Your Opponent</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {BATTLE_CHARACTERS.map((character) => (
          <Card
            key={character.id}
            className={`cursor-pointer transition-all hover:scale-105 ${
              selectedCharacter?.id === character.id
                ? "ring-2 ring-accent-gold bg-secondary-dark"
                : "bg-card-dark hover:bg-secondary-dark"
            } border-gray-700`}
            onClick={() => onCharacterSelect(character)}
            data-testid={`character-${character.id}`}
          >
            <CardContent className="p-4 text-center">
              {/* Character Avatar */}
              <div className="mb-3">
                <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-accent-gold bg-gradient-to-br from-accent-gold to-accent-red flex items-center justify-center">
                  {character.avatar ? (
                    <img
                      src={`/attached_assets/generated_images/${character.avatar}`}
                      onLoad={() => console.log(`Successfully loaded: ${character.avatar}`)}
                      alt={character.displayName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.warn(`Failed to load image: ${character.avatar}`);
                        // Fallback to character initial
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'block';
                      }}
                    />
                  ) : null}
                  <div 
                    className="text-2xl font-bold text-black"
                    style={{ display: character.avatar ? 'none' : 'block' }}
                  >
                    {character.displayName.charAt(0)}
                  </div>
                </div>
              </div>

              {/* Character Info */}
              <h4 className="text-lg font-bold text-white mb-2">{character.displayName}</h4>
              <p className="text-sm text-gray-300 mb-3 min-h-[40px]">
                {character.backstory}
              </p>

              {/* Character Stats */}
              <div className="space-y-2 mb-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Style:</span>
                  <Badge variant="outline" className="text-xs">
                    {character.style}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Difficulty:</span>
                  <Badge
                    className={`text-xs ${
                      character.difficulty === "hard"
                        ? "bg-red-600"
                        : character.difficulty === "normal"
                        ? "bg-yellow-600"
                        : "bg-green-600"
                    }`}
                  >
                    {character.difficulty}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Voice:</span>
                  <Badge variant="secondary" className="text-xs">
                    {character.gender}
                  </Badge>
                </div>
              </div>

              {/* Signature Line */}
              <div className="text-xs text-accent-gold italic min-h-[32px] mb-3">
                "{character.signature}"
              </div>

              {/* Select Button */}
              <Button
                size="sm"
                variant={selectedCharacter?.id === character.id ? "default" : "outline"}
                className={
                  selectedCharacter?.id === character.id
                    ? "bg-accent-gold text-black hover:bg-yellow-600"
                    : "border-gray-600 text-white hover:bg-secondary-dark"
                }
                data-testid={`button-select-${character.id}`}
              >
                {selectedCharacter?.id === character.id ? "Selected" : "Battle"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}