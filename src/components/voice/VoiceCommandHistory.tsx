import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Volume2,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { VoiceCommand } from '@/types/voiceAssistant';
import { formatDistanceToNow } from 'date-fns';

interface VoiceCommandHistoryProps {
  commands: VoiceCommand[];
  onReplayCommand?: (command: string) => void;
  onClearHistory?: () => void;
  maxHeight?: string;
}

export const VoiceCommandHistory: React.FC<VoiceCommandHistoryProps> = ({
  commands,
  onReplayCommand,
  onClearHistory,
  maxHeight = '300px'
}) => {
  const getIntentColor = (intent: string) => {
    const colors: Record<string, string> = {
      'view_properties': 'bg-blue-100 text-blue-800',
      'view_tenants': 'bg-green-100 text-green-800',
      'check_payments': 'bg-purple-100 text-purple-800',
      'add_property': 'bg-orange-100 text-orange-800',
      'send_reminder': 'bg-red-100 text-red-800',
      'view_analytics': 'bg-indigo-100 text-indigo-800',
      'help': 'bg-gray-100 text-gray-800',
      'unknown': 'bg-gray-100 text-gray-600'
    };
    return colors[intent] || 'bg-gray-100 text-gray-600';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (commands.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 text-center">
            No voice commands yet. Start by saying "Help" to see available commands.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-4 w-4" />
          <span className="text-sm font-medium">Command History</span>
          <Badge variant="outline">{commands.length}</Badge>
        </div>
        
        {onClearHistory && commands.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearHistory}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <ScrollArea style={{ maxHeight }} className="w-full">
        <div className="space-y-3">
          {commands.map((command) => (
            <Card key={command.id} className="p-3">
              <div className="space-y-2">
                {/* Command Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {command.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <Badge className={getIntentColor(command.intent)}>
                      {command.intent.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(new Date(command.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                {/* Command Text */}
                <div className="bg-gray-50 p-2 rounded text-sm">
                  <p className="font-medium">"{command.command}"</p>
                </div>

                {/* Command Details */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <span className={`font-medium ${getConfidenceColor(command.confidence)}`}>
                      {Math.round(command.confidence * 100)}% confident
                    </span>
                    
                    {command.entities.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-500">Entities:</span>
                        {command.entities.slice(0, 2).map((entity, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {entity.type}: {entity.value}
                          </Badge>
                        ))}
                        {command.entities.length > 2 && (
                          <span className="text-gray-500">+{command.entities.length - 2} more</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-1">
                    {onReplayCommand && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onReplayCommand(command.command)}
                        className="h-6 px-2"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Replay
                      </Button>
                    )}
                    
                    {command.response && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Speak the response
                          if ('speechSynthesis' in window && command.response) {
                            const utterance = new SpeechSynthesisUtterance(command.response);
                            speechSynthesis.speak(utterance);
                          }
                        }}
                        className="h-6 px-2"
                      >
                        <Volume2 className="h-3 w-3 mr-1" />
                        Hear Response
                      </Button>
                    )}
                  </div>
                </div>

                {/* Response */}
                {command.response && (
                  <div className="bg-blue-50 p-2 rounded text-sm">
                    <p className="text-blue-800">
                      <strong>Response:</strong> {command.response}
                    </p>
                  </div>
                )}

                {/* Action Taken */}
                {command.action_taken && (
                  <div className="bg-green-50 p-2 rounded text-sm">
                    <p className="text-green-800">
                      <strong>Action:</strong> {command.action_taken.replace('_', ' ')}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
