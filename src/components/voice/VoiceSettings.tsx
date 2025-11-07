import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { X, Volume2, Mic, Shield, Zap } from 'lucide-react';
import { VoiceSettings as VoiceSettingsType } from '@/types/voiceAssistant';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';

interface VoiceSettingsProps {
  settings: VoiceSettingsType;
  onClose: () => void;
}

export const VoiceSettings: React.FC<VoiceSettingsProps> = ({
  settings,
  onClose
}) => {
  const { updateSettings } = useVoiceAssistant();

  const handleSettingChange = (key: keyof VoiceSettingsType, value: any) => {
    updateSettings({ [key]: value });
  };

  const languages = [
    { value: 'en-NG', label: 'English (Nigeria)' },
    { value: 'en-US', label: 'English (US)' },
    { value: 'en-GB', label: 'English (UK)' },
    { value: 'ha-NG', label: 'Hausa (Nigeria)' },
    { value: 'yo-NG', label: 'Yoruba (Nigeria)' },
    { value: 'ig-NG', label: 'Igbo (Nigeria)' }
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-blue-600" />
            <CardTitle>Voice Assistant Settings</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Customize your voice assistant experience for optimal performance
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Basic Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Enable Voice Assistant</Label>
              <p className="text-sm text-muted-foreground">
                Turn voice commands on or off
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => handleSettingChange('enabled', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label>Language</Label>
            <Select
              value={settings.language}
              onValueChange={(value) => handleSettingChange('language', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Voice Type</Label>
            <Select
              value={settings.voice_type}
              onValueChange={(value: 'male' | 'female' | 'auto') => 
                handleSettingChange('voice_type', value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select voice type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="male">Male</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Speech Settings */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Volume2 className="h-4 w-4" />
            <Label className="text-base">Speech Settings</Label>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Speech Rate</Label>
                <Badge variant="outline">{settings.speech_rate}x</Badge>
              </div>
              <Slider
                value={[settings.speech_rate]}
                onValueChange={([value]) => handleSettingChange('speech_rate', value)}
                min={0.5}
                max={2.0}
                step={0.1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                How fast the assistant speaks (0.5x - 2.0x)
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Speech Pitch</Label>
                <Badge variant="outline">{settings.speech_pitch}</Badge>
              </div>
              <Slider
                value={[settings.speech_pitch]}
                onValueChange={([value]) => handleSettingChange('speech_pitch', value)}
                min={0.0}
                max={2.0}
                step={0.1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Voice pitch level (0.0 - 2.0)
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Speech Volume</Label>
                <Badge variant="outline">{Math.round(settings.speech_volume * 100)}%</Badge>
              </div>
              <Slider
                value={[settings.speech_volume]}
                onValueChange={([value]) => handleSettingChange('speech_volume', value)}
                min={0.0}
                max={1.0}
                step={0.1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Voice output volume (0% - 100%)
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Listening Settings */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Mic className="h-4 w-4" />
            <Label className="text-base">Listening Settings</Label>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Continuous Listening</Label>
              <p className="text-sm text-muted-foreground">
                Keep listening after each command
              </p>
            </div>
            <Switch
              checked={settings.continuous_listening}
              onCheckedChange={(checked) => handleSettingChange('continuous_listening', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Wake Word</Label>
              <p className="text-sm text-muted-foreground">
                Activate with "Hey Nigeria Homes"
              </p>
            </div>
            <Switch
              checked={settings.wake_word_enabled}
              onCheckedChange={(checked) => handleSettingChange('wake_word_enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Noise Cancellation</Label>
              <p className="text-sm text-muted-foreground">
                Filter background noise
              </p>
            </div>
            <Switch
              checked={settings.noise_cancellation}
              onCheckedChange={(checked) => handleSettingChange('noise_cancellation', checked)}
            />
          </div>
        </div>

        <Separator />

        {/* Behavior Settings */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <Label className="text-base">Behavior Settings</Label>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-Execute Commands</Label>
              <p className="text-sm text-muted-foreground">
                Execute safe commands automatically
              </p>
            </div>
            <Switch
              checked={settings.auto_execute_commands}
              onCheckedChange={(checked) => handleSettingChange('auto_execute_commands', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Confirmation</Label>
              <p className="text-sm text-muted-foreground">
                Ask before executing important actions
              </p>
            </div>
            <Switch
              checked={settings.confirmation_required}
              onCheckedChange={(checked) => handleSettingChange('confirmation_required', checked)}
            />
          </div>
        </div>

        <Separator />

        {/* Privacy Settings */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <Label className="text-base">Privacy Settings</Label>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Privacy Mode</Label>
              <p className="text-sm text-muted-foreground">
                Enhanced privacy with local processing
              </p>
            </div>
            <Switch
              checked={settings.privacy_mode}
              onCheckedChange={(checked) => handleSettingChange('privacy_mode', checked)}
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <Shield className="h-4 w-4 inline mr-1" />
              Your voice data is processed locally and never stored on our servers. 
              Command history is kept only on your device.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <div className="space-x-2">
            <Button 
              variant="outline"
              onClick={() => {
                // Reset to defaults
                const defaults = {
                  enabled: true,
                  language: 'en-NG',
                  voice_type: 'auto' as const,
                  speech_rate: 1.0,
                  speech_pitch: 1.0,
                  speech_volume: 0.8,
                  wake_word_enabled: false,
                  wake_word: 'Hey Nigeria Homes',
                  continuous_listening: false,
                  auto_execute_commands: false,
                  confirmation_required: true,
                  privacy_mode: false,
                  noise_cancellation: true
                };
                Object.entries(defaults).forEach(([key, value]) => {
                  handleSettingChange(key as keyof VoiceSettingsType, value);
                });
              }}
            >
              Reset to Defaults
            </Button>
            <Button onClick={onClose}>
              Save Settings
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
