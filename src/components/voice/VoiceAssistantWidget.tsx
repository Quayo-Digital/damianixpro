import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Settings, 
  HelpCircle,
  Zap,
  MessageSquare,
  Activity,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';
import { VoiceSettings } from './VoiceSettings';
import { VoiceCommandHistory } from './VoiceCommandHistory';
import { cn } from '@/lib/utils';

interface VoiceAssistantWidgetProps {
  className?: string;
  compact?: boolean;
  showHistory?: boolean;
}

export const VoiceAssistantWidget: React.FC<VoiceAssistantWidgetProps> = ({
  className = '',
  compact = false,
  showHistory = true
}) => {
  const {
    isListening,
    isProcessing,
    isSpeaking,
    isEnabled,
    settings,
    suggestions,
    error,
    commandHistory,
    startListening,
    stopListening,
    toggleVoiceAssistant,
    speak,
    getAvailableCommands,
    getStatistics,
    browserSupport,
    canUseVoiceAssistant
  } = useVoiceAssistant();

  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('assistant');
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);

  const statistics = getStatistics();
  const availableCommands = getAvailableCommands();

  // Handle voice assistant status
  const getStatusColor = () => {
    if (error) return 'destructive';
    if (isListening) return 'default';
    if (isProcessing) return 'secondary';
    if (isSpeaking) return 'outline';
    return 'secondary';
  };

  const getStatusText = () => {
    if (error) return 'Error';
    if (isListening) return 'Listening...';
    if (isProcessing) return 'Processing...';
    if (isSpeaking) return 'Speaking...';
    if (isEnabled) return 'Ready';
    return 'Disabled';
  };

  const getStatusIcon = () => {
    if (error) return <AlertTriangle className="h-4 w-4" />;
    if (isListening) return <Mic className="h-4 w-4 animate-pulse" />;
    if (isProcessing) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (isSpeaking) return <Volume2 className="h-4 w-4 animate-pulse" />;
    if (isEnabled) return <CheckCircle className="h-4 w-4" />;
    return <MicOff className="h-4 w-4" />;
  };

  // Handle quick test
  const handleQuickTest = async () => {
    try {
      await speak('Voice assistant is working perfectly. You can now use voice commands to manage your properties.');
    } catch (err) {
      console.error('Test failed:', err);
    }
  };

  // Handle help command
  const handleShowHelp = async () => {
    const helpText = `I can help you with property management. Try saying: ${availableCommands.slice(0, 3).map(cmd => cmd.command).join(', ')}, or ask for help.`;
    await speak(helpText);
  };

  if (compact) {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        <Button
          variant={isListening ? 'default' : 'outline'}
          size="sm"
          onClick={toggleVoiceAssistant}
          disabled={!canUseVoiceAssistant || !isEnabled}
          className={cn(
            'transition-all duration-200',
            isListening && 'bg-red-500 hover:bg-red-600 animate-pulse'
          )}
        >
          {getStatusIcon()}
          <span className="ml-2 hidden sm:inline">{getStatusText()}</span>
        </Button>
        
        {error && (
          <Badge variant="destructive" className="text-xs">
            Error
          </Badge>
        )}
      </div>
    );
  }

  if (!canUseVoiceAssistant) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-blue-600" />
            <span>Voice Assistant</span>
            <Badge variant="outline">Premium Feature</Badge>
          </CardTitle>
          <CardDescription>
            Hands-free property management with voice commands
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Voice assistant requires a premium subscription. Upgrade to unlock hands-free property management.
            </AlertDescription>
          </Alert>
          <Button className="mt-4 w-full" variant="outline">
            Upgrade to Premium
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!browserSupport.speechRecognition || !browserSupport.speechSynthesis) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-gray-400" />
            <span>Voice Assistant</span>
            <Badge variant="secondary">Not Supported</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Voice assistant is not supported in this browser. Please use Chrome, Edge, or Safari for the best experience.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-blue-600" />
            <CardTitle>Voice Assistant</CardTitle>
            <Badge variant={getStatusColor()}>
              {getStatusIcon()}
              <span className="ml-1">{getStatusText()}</span>
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShowHelp}
              disabled={!isEnabled}
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <CardDescription>
          Say commands like "show my properties" or "check payments" for hands-free management
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error.message}
              {error.recoverable && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-2"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={toggleVoiceAssistant}
            disabled={!isEnabled}
            className={cn(
              'flex-1 transition-all duration-200',
              isListening && 'bg-red-500 hover:bg-red-600 animate-pulse'
            )}
            variant={isListening ? 'default' : 'outline'}
          >
            {isListening ? (
              <>
                <MicOff className="h-4 w-4 mr-2" />
                Stop Listening
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                Start Listening
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleQuickTest}
            disabled={!isEnabled || isSpeaking}
          >
            {isSpeaking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Speaking...
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4 mr-2" />
                Test Voice
              </>
            )}
          </Button>
        </div>

        {/* Processing Indicator */}
        {(isProcessing || isListening) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {isListening ? 'Listening for commands...' : 'Processing command...'}
              </span>
              {confidence > 0 && (
                <span className="text-blue-600">{Math.round(confidence * 100)}% confident</span>
              )}
            </div>
            <Progress 
              value={isListening ? 100 : (isProcessing ? 50 : 0)} 
              className="h-2"
            />
            {transcript && (
              <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                "{transcript}"
              </div>
            )}
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Try saying:</h4>
            <div className="flex flex-wrap gap-2">
              {suggestions.slice(0, 3).map((suggestion, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="cursor-pointer hover:bg-blue-50"
                  onClick={() => speak(suggestion)}
                >
                  "{suggestion}"
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Tabs for detailed view */}
        {showHistory && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="assistant">Assistant</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
            </TabsList>

            <TabsContent value="assistant" className="space-y-4">
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Available Commands:</h4>
                <div className="space-y-2">
                  {availableCommands.slice(0, 5).map((cmd, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="text-sm font-medium">"{cmd.command}"</p>
                        <p className="text-xs text-gray-600">{cmd.description}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => speak(`Try saying: ${cmd.command}`)}
                      >
                        <MessageSquare className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <VoiceCommandHistory 
                commands={commandHistory.slice(-10)} 
                onReplayCommand={(command) => speak(command)}
              />
            </TabsContent>

            <TabsContent value="stats" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {statistics.totalCommands}
                  </div>
                  <p className="text-sm text-gray-600">Total Commands</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(statistics.successRate)}%
                  </div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(statistics.averageConfidence * 100)}%
                  </div>
                  <p className="text-sm text-gray-600">Avg Confidence</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">
                    {statistics.mostUsedIntent.replace('_', ' ')}
                  </div>
                  <p className="text-sm text-gray-600">Most Used</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <VoiceSettings 
            settings={settings}
            onClose={() => setShowSettings(false)}
          />
        )}
      </CardContent>
    </Card>
  );
};
