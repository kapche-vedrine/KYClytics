import React, { useState } from "react";
import { useStore } from "@/lib/mock-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Save, RotateCcw, Plus, Trash2 } from "lucide-react";
import { DEFAULT_RISK_CONFIG, ALL_COUNTRIES, ALL_INDUSTRIES } from "@/lib/risk-engine";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function SettingsPage() {
  const { riskConfig, updateRiskConfig } = useStore();
  const { toast } = useToast();
  
  // Local state for adding new items
  const [newCountry, setNewCountry] = useState("");
  const [newIndustry, setNewIndustry] = useState("");

  const handleWeightChange = (key: keyof typeof riskConfig.weights, value: number) => {
    updateRiskConfig({
      weights: { ...riskConfig.weights, [key]: value }
    });
  };

  const handleReset = () => {
    updateRiskConfig(DEFAULT_RISK_CONFIG);
    toast({ title: "Settings Reset", description: "Risk engine configuration restored to defaults." });
  };

  const handleSave = () => {
    // In a real app, this would persist to backend
    toast({ title: "Settings Saved", description: "Risk engine configuration updated successfully." });
  };
  
  const addRiskCountry = () => {
      if (newCountry && !riskConfig.highRiskCountries.includes(newCountry)) {
          updateRiskConfig({
              highRiskCountries: [...riskConfig.highRiskCountries, newCountry]
          });
          setNewCountry("");
          toast({ title: "Country Added", description: `${newCountry} marked as High Risk.` });
      }
  };

  const removeRiskCountry = (country: string) => {
      updateRiskConfig({
          highRiskCountries: riskConfig.highRiskCountries.filter(c => c !== country)
      });
      toast({ title: "Country Removed", description: `${country} removed from High Risk list.` });
  };

  const addRiskIndustry = () => {
      if (newIndustry && !riskConfig.highRiskIndustries.includes(newIndustry)) {
          updateRiskConfig({
              highRiskIndustries: [...riskConfig.highRiskIndustries, newIndustry]
          });
          setNewIndustry("");
          toast({ title: "Industry Added", description: `${newIndustry} marked as High Risk.` });
      }
  };
  
  const removeRiskIndustry = (industry: string) => {
      updateRiskConfig({
          highRiskIndustries: riskConfig.highRiskIndustries.filter(i => i !== industry)
      });
      toast({ title: "Industry Removed", description: `${industry} removed from High Risk list.` });
  };


  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 mt-1">Configure risk engine parameters and system preferences.</p>
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
                  onChange={(e) => updateRiskConfig({ 
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
                  onChange={(e) => updateRiskConfig({ 
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
                {riskConfig.highRiskCountries.map(country => (
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
                {riskConfig.highRiskIndustries.map(industry => (
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
