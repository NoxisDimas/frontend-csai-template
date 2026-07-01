import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Save, Loader2, UserCircle } from 'lucide-react';
import { api } from '../lib/api';
import { NotificationToast } from '../components/Notifications';

interface PersonaConfig {
  persona_name: string;
  tone_of_voice: string;
  rules: string;
  out_of_context_message: string;
}

export function Settings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState<PersonaConfig>({
    persona_name: '',
    tone_of_voice: '',
    rules: '',
    out_of_context_message: ''
  });

  useEffect(() => {
    const fetchPersona = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/config/persona');
        if (res.data.data) {
          // Fill missing fields just in case
          setConfig({
            persona_name: res.data.data.persona_name || '',
            tone_of_voice: res.data.data.tone_of_voice || '',
            rules: res.data.data.rules || '',
            out_of_context_message: res.data.data.out_of_context_message || ''
          });
        }
      } catch (error) {
        console.error('Failed to fetch persona config', error);
        NotificationToast.error('Load Failed', 'Failed to load persona settings');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPersona();
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await api.put('/config/persona', config);
      NotificationToast.success('Settings Saved', 'Persona settings updated successfully');
    } catch (error: any) {
      console.error('Failed to save persona', error);
      const msg = error.response?.data?.error?.message || error.response?.data?.detail?.[0]?.msg || error.response?.data?.message || 'Failed to save settings';
      NotificationToast.error('Save Failed', msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">AI Persona Settings</h1>
          <p className="text-text-secondary mt-1">Configure how the AI agent behaves, speaks, and responds.</p>
        </div>
        <Button className="gap-2" onClick={handleSave} disabled={isSaving || isLoading}>
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-brand-400" />
              Bot Personality
            </CardTitle>
            <CardDescription>Define the identity and communication style of your AI agent.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-text-secondary" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Persona Name</label>
                  <p className="text-xs text-text-secondary mb-2">The name the AI uses to introduce itself (e.g. "Nova Support Bot").</p>
                  <Input 
                    placeholder="e.g. Nova Support Bot" 
                    value={config.persona_name}
                    onChange={(e) => setConfig({...config, persona_name: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Tone of Voice</label>
                  <p className="text-xs text-text-secondary mb-2">Instructions on how the AI should sound (e.g. "Friendly, professional, use emojis").</p>
                  <textarea 
                    className="w-full h-24 bg-input-background border border-border-subtle rounded-md p-3 text-sm text-white placeholder:text-text-secondary focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none"
                    placeholder="Describe the tone of voice..."
                    value={config.tone_of_voice}
                    onChange={(e) => setConfig({...config, tone_of_voice: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Custom Rules & Instructions</label>
                  <p className="text-xs text-text-secondary mb-2">Hard rules the AI must follow (e.g. "Do not mention competitor prices").</p>
                  <textarea 
                    className="w-full h-32 bg-input-background border border-border-subtle rounded-md p-3 text-sm text-white placeholder:text-text-secondary focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none"
                    placeholder="List specific rules or constraints..."
                    value={config.rules}
                    onChange={(e) => setConfig({...config, rules: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Out of Context Message</label>
                  <p className="text-xs text-text-secondary mb-2">The fallback response when the AI cannot answer a question based on its knowledge base.</p>
                  <textarea 
                    className="w-full h-20 bg-input-background border border-border-subtle rounded-md p-3 text-sm text-white placeholder:text-text-secondary focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none"
                    placeholder="I apologize, but I do not have information regarding that..."
                    value={config.out_of_context_message}
                    onChange={(e) => setConfig({...config, out_of_context_message: e.target.value})}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
