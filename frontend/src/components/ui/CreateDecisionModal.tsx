import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, X, AlertCircle } from 'lucide-react';
import { useAnalysis } from '@/hooks/useAnalysis';

interface CreateDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateDecision: (decision: {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    deadline: string;
    agents: string[];
    analysisResult?: any;
  }) => void;
}

export function CreateDecisionModal({ isOpen, onClose, onCreateDecision }: CreateDecisionModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [deadline, setDeadline] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const { loading, error, analyzeScenario } = useAnalysis();

  const agents = [
    { id: 'finance', name: 'Finance Agent', icon: '💰', description: 'Financial analysis and projections' },
    { id: 'risk', name: 'Risk Agent', icon: '⚠️', description: 'Risk assessment and mitigation strategies' },
    { id: 'compliance', name: 'Compliance Agent', icon: '⚖️', description: 'Regulatory compliance and legal considerations' },
    { id: 'market', name: 'Market Agent', icon: '📈', description: 'Market analysis and competitive intelligence' },
  ];

  const handleAgentToggle = (agentId: string) => {
    setSelectedAgents(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  const handleSubmit = async () => {
    if (title.trim() && description.trim()) {
      try {
        // Create the scenario text combining title and description
        const scenario = `${title.trim()}: ${description.trim()}`;
        
        // Run AI analysis using the backend
        const analysisResult = await analyzeScenario(scenario, 'comprehensive');
        
        // Create decision with analysis result
        onCreateDecision({
          title: title.trim(),
          description: description.trim(),
          priority,
          deadline,
          agents: selectedAgents.length > 0 ? selectedAgents : ['finance', 'risk', 'compliance', 'market'],
          analysisResult,
        });
        
        // Reset form
        setTitle('');
        setDescription('');
        setPriority('medium');
        setDeadline('');
        setSelectedAgents([]);
        onClose();
      } catch (error) {
        // Error is handled by the hook, UI will show the error
        console.error('Failed to analyze scenario:', error);
      }
    }
  };

  const handleCancel = () => {
    // Reset form
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDeadline('');
    setSelectedAgents([]);
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="glass-card-stable max-w-2xl w-full max-h-[90vh] overflow-y-auto border-0 shadow-2xl rounded-2xl">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-200/20">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-black">
                Create New Strategic Decision
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="glass-button hover:bg-gray-100/80 rounded-full transition-colors duration-200 h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                Decision Title
              </Label>
              <Input
                id="title"
                placeholder="e.g., Market Expansion into Asia-Pacific"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="glass-input focus-enhanced"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                Description & Context
              </Label>
              <Textarea
                id="description"
                placeholder="Provide detailed context, objectives, and constraints for this strategic decision..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="glass-input focus-enhanced min-h-[100px] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Priority Level</Label>
                <Select value={priority} onValueChange={(value: 'high' | 'medium' | 'low') => setPriority(value)}>
                  <SelectTrigger className="glass-input focus-enhanced">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-0 shadow-xl">
                    <SelectItem value="high" className="hover:bg-white/50 transition-colors">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        High Priority
                      </span>
                    </SelectItem>
                    <SelectItem value="medium" className="hover:bg-white/50 transition-colors">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                        Medium Priority
                      </span>
                    </SelectItem>
                    <SelectItem value="low" className="hover:bg-white/50 transition-colors">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Low Priority
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline" className="text-sm font-medium text-gray-700">
                  Decision Deadline
                </Label>
                <Input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="glass-input focus-enhanced"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">AI Agents to Involve</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {agents.map((agent) => (
                  <div key={agent.id} className="glass p-3 rounded-lg hover:bg-white/30 transition-colors duration-200 border border-transparent hover:border-gray-200/30">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={agent.id}
                        checked={selectedAgents.includes(agent.id)}
                        onCheckedChange={() => handleAgentToggle(agent.id)}
                        className="border-gray-400 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                      <Label htmlFor={agent.id} className="flex items-center space-x-2 cursor-pointer flex-1">
                        <span className="text-lg">{agent.icon}</span>
                        <span className="font-medium text-gray-800">{agent.name}</span>
                      </Label>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 ml-7">{agent.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200/20">
            {error && (
              <div className="mb-4">
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
                className="glass-button px-6 transition-colors duration-200 hover:bg-gray-100/80"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !title.trim() || !description.trim()}
                className="accent-button px-6 transition-colors duration-200 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Analyzing...' : 'Create & Analyze'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
