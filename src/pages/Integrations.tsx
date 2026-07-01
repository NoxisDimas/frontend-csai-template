import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Save, Loader2, Link2, Clock } from 'lucide-react';
import { api } from '../lib/api';
import { NotificationToast } from '../components/Notifications';

interface SystemConfig {
  shopify_domain: string;
  admin_api_token: string;
  webhook_secret: string;
}

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

interface DaySchedule {
  isOpen: boolean;
  start: string;
  end: string;
}

export function Integrations() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState<SystemConfig>({
    shopify_domain: '',
    admin_api_token: '',
    webhook_secret: ''
  });

  const [schedule, setSchedule] = useState<Record<string, DaySchedule>>(() => {
    const defaultSchedule: Record<string, DaySchedule> = {};
    DAYS_OF_WEEK.forEach(day => {
      defaultSchedule[day] = { 
        isOpen: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(day), 
        start: '09:00', 
        end: '17:00' 
      };
    });
    return defaultSchedule;
  });

  useEffect(() => {
    const fetchSystemConfig = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/config/system');
        if (res.data.data) {
          const data = res.data.data;
          let parsedSchedule: Record<string, DaySchedule> = {};
          DAYS_OF_WEEK.forEach(day => {
            parsedSchedule[day] = { isOpen: false, start: '09:00', end: '17:00' };
          });

          if (data.operational_hours_json && Object.keys(data.operational_hours_json).length > 0) {
            Object.keys(data.operational_hours_json).forEach(day => {
               const val = data.operational_hours_json[day];
               if (val && val.includes('-') && DAYS_OF_WEEK.includes(day)) {
                 const [start, end] = val.split('-');
                 parsedSchedule[day] = { isOpen: true, start, end };
               }
            });
          } else {
             ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => {
               parsedSchedule[day] = { isOpen: true, start: '09:00', end: '17:00' };
             });
          }
          
          setSchedule(parsedSchedule);

          setConfig({
            shopify_domain: data.shopify_domain || '',
            // The API masks the tokens, so we only show placeholders unless the user updates them
            admin_api_token: data.admin_api_token_masked || '',
            webhook_secret: data.webhook_secret_masked || ''
          });
        }
      } catch (error) {
        console.error('Failed to fetch system config', error);
        NotificationToast.error('Load Failed', 'Failed to load system integrations settings');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSystemConfig();
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // We only want to send tokens if they were actually edited (don't send masked values back)
      let payload: any = {
        shopify_domain: config.shopify_domain
      };

      if (config.admin_api_token && !config.admin_api_token.includes('***')) {
        payload.admin_api_token = config.admin_api_token;
      }
      
      if (config.webhook_secret && !config.webhook_secret.includes('***')) {
        payload.webhook_secret = config.webhook_secret;
      }

      let jsonPayload: Record<string, string> = {};
      DAYS_OF_WEEK.forEach(day => {
        if (schedule[day].isOpen) {
          jsonPayload[day] = `${schedule[day].start}-${schedule[day].end}`;
        }
      });
      payload.operational_hours_json = jsonPayload;

      await api.put('/config/system', payload);
      NotificationToast.success('Saved', 'System configuration saved successfully');
    } catch (error) {
      console.error('Failed to save system config', error);
      NotificationToast.error('Save Failed', 'Failed to save integrations settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Integrations & System</h1>
          <p className="text-text-secondary mt-1">Configure Shopify connectivity and system-wide operational rules.</p>
        </div>
        <Button className="gap-2" onClick={handleSave} disabled={isSaving || isLoading}>
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 max-w-4xl">
        {/* Shopify Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-brand-400" />
              Shopify Integration
            </CardTitle>
            <CardDescription>Connect the AI agent to your Shopify store to enable product catalog syncing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-text-secondary" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Shopify Domain</label>
                  <p className="text-xs text-text-secondary mb-2">Your myshopify.com domain (e.g. store.myshopify.com).</p>
                  <Input 
                    placeholder="e.g. store.myshopify.com" 
                    value={config.shopify_domain}
                    onChange={(e) => setConfig({...config, shopify_domain: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Admin API Access Token</label>
                  <p className="text-xs text-text-secondary mb-2">Requires read_products, read_orders, and read_customers permissions.</p>
                  <Input 
                    type="password"
                    placeholder="shpat_..." 
                    value={config.admin_api_token}
                    onChange={(e) => setConfig({...config, admin_api_token: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Webhook Secret</label>
                  <p className="text-xs text-text-secondary mb-2">Used to verify incoming webhooks from Shopify.</p>
                  <Input 
                    type="password"
                    placeholder="Webhook secret..." 
                    value={config.webhook_secret}
                    onChange={(e) => setConfig({...config, webhook_secret: e.target.value})}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Operational Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-400" />
              Operational Hours
            </CardTitle>
            <CardDescription>Define when human agents are available for escalations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-text-secondary" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-card-elevated/50 rounded-md border border-border-subtle text-xs font-medium text-text-secondary uppercase tracking-wider">
                    <div className="col-span-4 sm:col-span-3">Day</div>
                    <div className="col-span-3 sm:col-span-2 text-center">Status</div>
                    <div className="col-span-5 sm:col-span-7">Hours</div>
                  </div>
                  {DAYS_OF_WEEK.map(day => (
                    <div key={day} className="grid grid-cols-12 gap-4 px-4 py-3 bg-card-base border border-border-subtle rounded-md items-center transition-colors hover:border-brand-500/50">
                      <div className="col-span-4 sm:col-span-3 font-medium capitalize text-white">
                        {day}
                      </div>
                      <div className="col-span-3 sm:col-span-2 flex justify-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={schedule[day].isOpen}
                            onChange={(e) => setSchedule({...schedule, [day]: {...schedule[day], isOpen: e.target.checked}})}
                          />
                          <div className="w-9 h-5 bg-card-elevated peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500 border border-border-subtle"></div>
                        </label>
                      </div>
                      <div className="col-span-5 sm:col-span-7 flex flex-col sm:flex-row sm:items-center gap-2">
                        {schedule[day].isOpen ? (
                          <>
                            <Input 
                              type="time" 
                              className="h-8 text-sm w-full sm:w-auto" 
                              value={schedule[day].start}
                              onChange={(e) => setSchedule({...schedule, [day]: {...schedule[day], start: e.target.value}})}
                            />
                            <span className="text-text-secondary hidden sm:inline">to</span>
                            <Input 
                              type="time" 
                              className="h-8 text-sm w-full sm:w-auto" 
                              value={schedule[day].end}
                              onChange={(e) => setSchedule({...schedule, [day]: {...schedule[day], end: e.target.value}})}
                            />
                          </>
                        ) : (
                          <span className="text-sm text-text-secondary italic">Closed</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
