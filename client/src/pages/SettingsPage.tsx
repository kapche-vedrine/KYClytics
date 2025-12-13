import React, { useState, useEffect } from "react";
import { riskConfigAPI } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Save, RotateCcw, Plus, Trash2, Sun, Moon, Palette } from "lucide-react";
import { DEFAULT_RISK_CONFIG, ALL_COUNTRIES, ALL_INDUSTRIES } from "@/lib/risk-engine";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/ThemeProvider";

const THEME_COLORS = [
  { name: "Blue", value: "#1e40af" },
  { name: "Purple", value: "#7c3aed" },
  { name: "Green", value: "#059669" },
  { name: "Red", value: "#dc2626" },
  { name: "Orange", value: "#ea580c" },
  { name: "Pink", value: "#db2777" },
  { name: "Teal", value: "#0d9488" },
  { name: "Indigo", value: "#4f46e5" },
];

export default function SettingsPage() {
  const { toast } = useToast();
  const { theme, primaryColor, setTheme, setPrimaryColor } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [riskConfig, setRiskConfig] = useState<any>(null);
  const [newCountry, setNewCountry] = useState("");
  const [newIndustry, setNewIndustry] = useState("");

  useEffect(() => {
    async function loadConfig() {
      try {
        const config = await riskConfigAPI.get();
        const transformedConfig = {
          weights: {
            pep: config.pepWeight,
            highRiskCountry: config.highRiskCountryWeight,
            highRiskIndustry: config.highRiskIndustryWeight,
            cashIntensiveJob: config.cashIntensiveJobWeight,
          },
          thresholds: {
            medium: config.mediumThreshold,
            high: config.highThreshold,
          },
          highRiskCountries: config.highRiskCountries,
          highRiskIndustries: config.highRiskIndustries,
          cashIntensiveJobs: config.cashIntensiveJobs,
        };
        setRiskConfig(transformedConfig);
      } catch (error) {
        console.error("Failed to load config:", error);
        toast({
          title: "Error",
          description: "Failed to load risk configuration",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const updateLocalConfig = (updates: Partial<typeof riskConfig>) => {
    setRiskConfig({ ...riskConfig, ...updates });
  };

  const handleWeightChange = (key: keyof typeof riskConfig.weights, value: number) => {
    updateLocalConfig({
      weights: { ...riskConfig.weights, [key]: value }
    });
  };

  const handleReset = async () => {
    try {
      const dbConfig = {
        pepWeight: DEFAULT_RISK_CONFIG.weights.pep,
        highRiskCountryWeight: DEFAULT_RISK_CONFIG.weights.highRiskCountry,
        highRiskIndustryWeight: DEFAULT_RISK_CONFIG.weights.highRiskIndustry,
        cashIntensiveJobWeight: DEFAULT_RISK_CONFIG.weights.cashIntensiveJob,
        mediumThreshold: DEFAULT_RISK_CONFIG.thresholds.medium,
        highThreshold: DEFAULT_RISK_CONFIG.thresholds.high,
        highRiskCountries: DEFAULT_RISK_CONFIG.highRiskCountries,
        highRiskIndustries: DEFAULT_RISK_CONFIG.highRiskIndustries,
        cashIntensiveJobs: DEFAULT_RISK_CONFIG.cashIntensiveJobs,
      };
      await riskConfigAPI.update(dbConfig);
      setRiskConfig(DEFAULT_RISK_CONFIG);
      toast({ title: "Settings Reset", description: "Risk engine configuration restored to defaults." });
    } catch (error) {
      console.error("Failed to reset config:", error);
      toast({ 
        title: "Error", 
        description: "Failed to reset configuration", 
        variant: "destructive" 
      });
    }
  };

  const handleSave = async () => {
    try {
      const dbConfig = {
        pepWeight: riskConfig.weights.pep,
        highRiskCountryWeight: riskConfig.weights.highRiskCountry,
        highRiskIndustryWeight: riskConfig.weights.highRiskIndustry,
        cashIntensiveJobWeight: riskConfig.weights.cashIntensiveJob,
        mediumThreshold: riskConfig.thresholds.medium,
        highThreshold: riskConfig.thresholds.high,
        highRiskCountries: riskConfig.highRiskCountries,
        highRiskIndustries: riskConfig.highRiskIndustries,
        cashIntensiveJobs: riskConfig.cashIntensiveJobs,
      };
      await riskConfigAPI.update(dbConfig);
      toast({ title: "Settings Saved", description: "Risk engine configuration updated successfully." });
    } catch (error) {
      console.error("Failed to save config:", error);
      toast({ 
        title: "Error", 
        description: "Failed to save configuration", 
        variant: "destructive" 
      });
    }
  };
  
  const addRiskCountry = () => {
      if (newCountry && !riskConfig.highRiskCountries.includes(newCountry)) {
          updateLocalConfig({
              highRiskCountries: [...riskConfig.highRiskCountries, newCountry]
          });
          setNewCountry("");
          toast({ title: "Country Added", description: `${newCountry} marked as High Risk.` });
      }
  };

  const removeRiskCountry = (country: string) => {
      updateLocalConfig({
          highRiskCountries: riskConfig.highRiskCountries.filter((c: string) => c !== country)
      });
      toast({ title: "Country Removed", description: `${country} removed from High Risk list.` });
  };

  const addRiskIndustry = () => {
      if (newIndustry && !riskConfig.highRiskIndustries.includes(newIndustry)) {
          updateLocalConfig({
              highRiskIndustries: [...riskConfig.highRiskIndustries, newIndustry]
          });
          setNewIndustry("");
          toast({ title: "Industry Added", description: `${newIndustry} marked as High Risk.` });
      }
  };
  
  const removeRiskIndustry = (industry: string) => {
      updateLocalConfig({
          highRiskIndustries: riskConfig.highRiskIndustries.filter((i: string) => i !== industry)
      });
      toast({ title: "Industry Removed", description: `${industry} removed from High Risk list.` });
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Loading settings...</p>
      </div>
    );
  }

  if (!riskConfig) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Failed to load settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Configure risk engine parameters and system preferences.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Reset Defaults
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Theme Settings */}
      <Card className="border-slate-200 dark:border-slate-700 shadow-sm" data-testid="card-theme-settings">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Appearance
          </CardTitle>
          <CardDescription>Customize the look and feel of your dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-8">
            <div className="space-y-4">
              <Label className="text-base">Theme Mode</Label>
              <div className="flex gap-2">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  size="sm"
                  className="gap-2"
                  onClick={() => setTheme("light")}
                  data-testid="button-theme-light"
                >
                  <Sun className="w-4 h-4" />
                  Light
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  size="sm"
                  className="gap-2"
                  onClick={() => setTheme("dark")}
                  data-testid="button-theme-dark"
                >
                  <Moon className="w-4 h-4" />
                  Dark
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              <Label className="text-base">Primary Color</Label>
              <div className="flex flex-wrap gap-2">
                {THEME_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setPrimaryColor(color.value)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      primaryColor === color.value
                        ? "ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-500"
                        : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                    data-testid={`button-color-${color.name.toLowerCase()}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Risk Weights */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Risk Scoring Weights</CardTitle>
            <CardDescription>Adjust the score impact for various risk factors.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">PEP (Politically Exposed Person)</Label>
                <span className="font-mono font-bold bg-slate-100 px-2 py-1 rounded text-slate-700">
                  +{riskConfig.weights.pep}
                </span>
              </div>
              <Slider 
                value={[riskConfig.weights.pep]} 
                min={0} max={100} step={5}
                onValueChange={([v]) => handleWeightChange('pep', v)}
                className="py-2"
              />
              <p className="text-sm text-slate-500">
                Score added when a client is flagged as a PEP.
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">High Risk Country</Label>
                <span className="font-mono font-bold bg-slate-100 px-2 py-1 rounded text-slate-700">
                  +{riskConfig.weights.highRiskCountry}
                </span>
              </div>
              <Slider 
                value={[riskConfig.weights.highRiskCountry]} 
                min={0} max={100} step={5}
                onValueChange={([v]) => handleWeightChange('highRiskCountry', v)}
                className="py-2"
              />
              <p className="text-sm text-slate-500">
                Score added when client resides in a high-risk jurisdiction.
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">High Risk Industry</Label>
                <span className="font-mono font-bold bg-slate-100 px-2 py-1 rounded text-slate-700">
                  +{riskConfig.weights.highRiskIndustry}
                </span>
              </div>
              <Slider 
                value={[riskConfig.weights.highRiskIndustry]} 
                min={0} max={100} step={5}
                onValueChange={([v]) => handleWeightChange('highRiskIndustry', v)}
                className="py-2"
              />
              <p className="text-sm text-slate-500">
                Score added for industries like Gambling, Crypto, or Arms.
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Cash Intensive Job</Label>
                <span className="font-mono font-bold bg-slate-100 px-2 py-1 rounded text-slate-700">
                  +{riskConfig.weights.cashIntensiveJob}
                </span>
              </div>
              <Slider 
                value={[riskConfig.weights.cashIntensiveJob]} 
                min={0} max={100} step={5}
                onValueChange={([v]) => handleWeightChange('cashIntensiveJob', v)}
                className="py-2"
              />
              <p className="text-sm text-slate-500">
                Score added for jobs with high cash turnover.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* High Risk Lists View */}
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Thresholds</CardTitle>
              <CardDescription>Score bands for risk classification.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <Label>Medium Risk (Yellow)</Label>
                </div>
                <Input 
                  type="number" 
                  className="w-20 text-right" 
                  value={riskConfig.thresholds.medium}
                  onChange={(e) => updateLocalConfig({ 
                    thresholds: { ...riskConfig.thresholds, medium: parseInt(e.target.value) || 0 } 
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <Label>High Risk (Red)</Label>
                </div>
                <Input 
                  type="number" 
                  className="w-20 text-right" 
                  value={riskConfig.thresholds.high}
                  onChange={(e) => updateLocalConfig({ 
                    thresholds: { ...riskConfig.thresholds, high: parseInt(e.target.value) || 0 } 
                  })}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>High Risk Countries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Select value={newCountry} onValueChange={setNewCountry}>
                    <SelectTrigger>
                        <SelectValue placeholder="Add Country" />
                    </SelectTrigger>
                    <SelectContent>
                        <ScrollArea className="h-[200px]">
                             {ALL_COUNTRIES.filter(c => !riskConfig.highRiskCountries.includes(c)).map(c => (
                                 <SelectItem key={c} value={c}>{c}</SelectItem>
                             ))}
                        </ScrollArea>
                    </SelectContent>
                </Select>
                <Button size="icon" onClick={addRiskCountry} disabled={!newCountry}>
                    <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto">
                {riskConfig.highRiskCountries.map((country: string) => (
                  <Badge key={country} variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1 pr-1">
                    {country}
                    <button onClick={() => removeRiskCountry(country)} className="hover:text-red-500 rounded-full p-0.5">
                        <Trash2 className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>High Risk Industries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Select value={newIndustry} onValueChange={setNewIndustry}>
                    <SelectTrigger>
                        <SelectValue placeholder="Add Industry" />
                    </SelectTrigger>
                    <SelectContent>
                        <ScrollArea className="h-[200px]">
                             {ALL_INDUSTRIES.filter(i => !riskConfig.highRiskIndustries.includes(i)).map(i => (
                                 <SelectItem key={i} value={i}>{i}</SelectItem>
                             ))}
                        </ScrollArea>
                    </SelectContent>
                </Select>
                 <Button size="icon" onClick={addRiskIndustry} disabled={!newIndustry}>
                    <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto">
                {riskConfig.highRiskIndustries.map((industry: string) => (
                  <Badge key={industry} variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1 pr-1">
                    {industry}
                     <button onClick={() => removeRiskIndustry(industry)} className="hover:text-red-500 rounded-full p-0.5">
                        <Trash2 className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
