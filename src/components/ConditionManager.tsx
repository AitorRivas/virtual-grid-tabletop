import { useState } from 'react';
import { conditions, conditionCategories, Condition } from '@/data/conditions';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Search, X } from 'lucide-react';

interface ConditionManagerProps {
  activeConditions: string[];
  onToggleCondition: (conditionId: string) => void;
}

export const ConditionManager = ({ activeConditions, onToggleCondition }: ConditionManagerProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredConditions = conditions.filter(condition => {
    const matchesSearch = condition.nameEs.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          condition.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || condition.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedConditions = conditionCategories.map(cat => ({
    ...cat,
    conditions: filteredConditions.filter(c => c.category === cat.id)
  })).filter(cat => cat.conditions.length > 0);

  return (
    <div className="space-y-3">
      {/* Active conditions */}
      {activeConditions.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Estados activos:</label>
          <div className="flex flex-wrap gap-1">
            {activeConditions.map(condId => {
              const condition = conditions.find(c => c.id === condId);
              if (!condition) return null;
              const Icon = condition.icon;
              return (
                <Badge
                  key={condId}
                  variant="secondary"
                  className="gap-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  style={{ 
                    backgroundColor: `hsl(${condition.color} / 0.3)`,
                    borderColor: `hsl(${condition.color})`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleCondition(condId);
                  }}
                >
                  <Icon className="w-3 h-3" />
                  {condition.nameEs}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar estado..."
          className="pl-8 h-8 text-sm"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1">
        <Badge
          variant={selectedCategory === null ? "default" : "outline"}
          className="cursor-pointer text-xs"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedCategory(null);
          }}
        >
          Todos
        </Badge>
        {conditionCategories.map(cat => (
          <Badge
            key={cat.id}
            variant={selectedCategory === cat.id ? "default" : "outline"}
            className="cursor-pointer text-xs"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCategory(cat.id);
            }}
          >
            {cat.name}
          </Badge>
        ))}
      </div>

      {/* Conditions list */}
      <ScrollArea className="h-48">
        <div className="space-y-3 pr-2">
          {groupedConditions.map(category => (
            <div key={category.id}>
              <p className="text-xs font-semibold text-muted-foreground mb-1">{category.name}</p>
              <div className="grid grid-cols-2 gap-1">
                {category.conditions.map(condition => {
                  const Icon = condition.icon;
                  const isActive = activeConditions.includes(condition.id);
                  return (
                    <button
                      key={condition.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCondition(condition.id);
                      }}
                      className={`flex items-center gap-1 p-1.5 rounded text-xs transition-colors ${
                        isActive 
                          ? 'bg-primary/20 text-primary border border-primary/50' 
                          : 'bg-secondary/50 hover:bg-secondary text-secondary-foreground'
                      }`}
                      title={condition.description}
                    >
                      <span className="flex-shrink-0" style={{ color: `hsl(${condition.color})` }}>
                        <Icon className="w-3 h-3" />
                      </span>
                      <span className="truncate">{condition.nameEs}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
