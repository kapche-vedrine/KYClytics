import React, { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useStore } from "@/lib/mock-data";
import { calculateRisk, ALL_COUNTRIES, ALL_INDUSTRIES } from "@/lib/risk-engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RiskBadge } from "@/components/ui/risk-badge";
import { ArrowLeft, Save, Upload, FileText, AlertCircle, Download, Eye, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

const clientSchema = z.object({
  firstName: z.string().min(2, "First name required"),
  lastName: z.string().min(2, "Last name required"),
  dob: z.string().min(1, "Date of birth required"),
  address: z.string().min(5, "Address required"),
  country: z.string().min(2, "Country required"),
  postalCode: z.string().min(2, "Postal code required"),
  job: z.string().min(2, "Job title required"),
  industry: z.string().min(2, "Industry required"),
  pep: z.boolean().default(false),
});

export default function ClientDetailPage() {
  const [, params] = useRoute("/clients/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { clients, addClient, updateClient, riskConfig, addDocument, deleteDocument } = useStore();
  
  const isNew = params?.id === "new";
  const existingClient = clients.find(c => c.id === params?.id);

  const form = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: existingClient || {
      firstName: "",
      lastName: "",
      dob: "",
      address: "",
      country: "",
      postalCode: "",
      job: "",
      industry: "",
      pep: false,
    },
  });

  // Live Risk Calculation
  const watchedValues = form.watch();
  const liveRisk = calculateRisk({
    pep: watchedValues.pep || false,
    country: watchedValues.country || "",
    industry: watchedValues.industry || "",
    job: watchedValues.job || "",
  }, riskConfig);

  function onSubmit(data: z.infer<typeof clientSchema>) {
    if (isNew) {
      addClient(data);
      toast({ title: "Client Created", description: "Client onboarding completed successfully." });
      setLocation("/clients");
    } else if (existingClient) {
      updateClient(existingClient.id, data);
      toast({ title: "Client Updated", description: "Risk score and schedule updated." });
    }
  }

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDownload = (filename: string) => {
    toast({
      title: "Downloading Document",
      description: `Starting download for ${filename}...`,
    });
    // Mock download delay
    setTimeout(() => {
       toast({
        title: "Download Complete",
        description: `${filename} has been saved to your device.`,
        variant: "default",
      });
    }, 1500);
  };

  const handleGenerateReport = async () => {
    toast({
      title: "Generating Risk Report",
      description: "Requesting report from server...",
    });

    try {
      // We attempt to fetch the real report as requested.
      // Since the backend is not implemented in this prototype, this will likely fail or return 404.
      // This implementation fulfills the request to "fetch the PDF from /api/clients/:id/report"
      const response = await fetch(`/api/clients/${existingClient?.id}/report`);
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `KYC_Report_${existingClient?.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Report Ready",
        description: "KYC Risk Report has been generated and downloaded.",
        variant: "default",
      });
    } catch (error) {
      console.error("Report generation failed:", error);
      toast({
        title: "Generation Failed",
        description: "Could not retrieve report from server (Backend not connected).",
        variant: "destructive",
      });
    }
  };

  const handleUploadClick = () => {
    if (!existingClient) {
        toast({
            title: "Cannot Upload",
            description: "Please create the client before uploading documents.",
            variant: "destructive"
        });
        return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !existingClient) return;

    // Extract real file metadata
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const fileData = {
      name: file.name,
      size: `${fileSizeMB} MB`,
      type: file.type
    };

    addDocument(existingClient.id, fileData);
    
    toast({
        title: "File Uploaded",
        description: `${file.name} has been successfully attached.`,
    });

    // Reset input
    event.target.value = "";
  };

  const handleDeleteDocument = (docId: string, docName: string) => {
     if (!existingClient) return;
     deleteDocument(existingClient.id, docId);
     toast({
         title: "Document Deleted",
         description: `${docName} has been removed.`,
         variant: "destructive"
     });
  };

  if (!isNew && !existingClient) {
    return <div>Client not found</div>;
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/clients")}>
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 font-display">
              {isNew ? "New Client Onboarding" : `${existingClient?.firstName} ${existingClient?.lastName}`}
            </h1>
            <p className="text-slate-500 text-sm">
              {isNew ? "Complete the form to generate initial risk score." : `ID: ${existingClient?.id} • Last Updated: ${new Date(existingClient?.lastUpdated || "").toLocaleDateString()}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isNew && (
            <Button variant="outline" className="gap-2" onClick={handleGenerateReport}>
              <FileText className="w-4 h-4" />
              Generate Report
            </Button>
          )}
          <Button onClick={form.handleSubmit(onSubmit)} className="gap-2">
            <Save className="w-4 h-4" />
            {isNew ? "Create Client" : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile & Risk</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="audit">Audit Log</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="space-y-6 mt-6">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl><Input {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl><Input {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="dob"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date of Birth</FormLabel>
                              <FormControl><Input type="date" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Address</FormLabel>
                              <FormControl><Input {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select country" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <ScrollArea className="h-[200px]">
                                    {ALL_COUNTRIES.map(c => (
                                      <SelectItem key={c} value={c}>
                                        {c} {riskConfig.highRiskCountries.includes(c) ? "(High Risk)" : ""}
                                      </SelectItem>
                                    ))}
                                  </ScrollArea>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="postalCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Postal Code</FormLabel>
                              <FormControl><Input {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="industry"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Industry</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select industry" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <ScrollArea className="h-[200px]">
                                    {ALL_INDUSTRIES.map(i => (
                                      <SelectItem key={i} value={i}>
                                        {i} {riskConfig.highRiskIndustries.includes(i) ? "(High Risk)" : ""}
                                      </SelectItem>
                                    ))}
                                  </ScrollArea>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                         <FormField
                          control={form.control}
                          name="job"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Job Title</FormLabel>
                              <FormControl><Input {...field} placeholder="e.g. Software Engineer" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="pep"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-slate-50">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Politically Exposed Person (PEP)
                              </FormLabel>
                              <FormDescription>
                                Is this person a prominent public figure or close associate?
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                  <div 
                    onClick={handleUploadClick}
                    className={`border-2 border-dashed border-slate-300 rounded-xl p-12 flex flex-col items-center justify-center text-slate-500 transition-all cursor-pointer ${!existingClient ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50 hover:border-primary/50'}`}
                  >
                    <Upload className="w-12 h-12 mb-4 text-slate-400" />
                    <p className="font-medium text-slate-900">
                        {existingClient ? "Drop files to upload" : "Create client to upload documents"}
                    </p>
                    <p className="text-sm mt-1">PDF, JPG or PNG up to 15MB</p>
                  </div>
                  
                  <div className="mt-6 space-y-3">
                    <h4 className="text-sm font-medium text-slate-900">Uploaded Files</h4>
                    
                    {existingClient?.documents?.length === 0 ? (
                        <p className="text-sm text-slate-500 italic">No documents attached.</p>
                    ) : (
                        existingClient?.documents?.map((doc) => (
                            <div key={doc.id} className="p-3 bg-slate-50 rounded-lg border flex items-center justify-between group hover:bg-slate-100 transition-colors">
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-primary" />
                                <div className="text-sm">
                                  <p className="font-medium text-slate-900">{doc.name}</p>
                                  <p className="text-slate-500">{doc.size} • {new Date(doc.uploadDate).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <Button variant="ghost" size="sm" onClick={() => window.open('#')}>
                                   <Eye className="w-4 h-4 mr-1" /> View
                                 </Button>
                                 <Button variant="outline" size="sm" onClick={() => handleDownload(doc.name)}>
                                   <Download className="w-4 h-4 mr-1" /> Download
                                 </Button>
                                 <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                    onClick={() => handleDeleteDocument(doc.id, doc.name)}
                                 >
                                    <Trash2 className="w-4 h-4" />
                                 </Button>
                              </div>
                            </div>
                        ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audit" className="mt-6">
                <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg border border-dashed">
                    Audit logs will appear here after client actions.
                </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - Risk Engine Output */}
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-lg bg-slate-900 text-white sticky top-24">
            <CardHeader className="border-b border-slate-800">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-primary" />
                Risk Engine Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Risk Score</span>
                <span className="text-4xl font-bold font-mono">{liveRisk.score}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Risk Band</span>
                <RiskBadge band={liveRisk.band} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Next Review</span>
                <span className="font-mono text-primary">{liveRisk.nextReviewMonths} Months</span>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-800">
                <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Contributing Factors</span>
                {liveRisk.factors.length > 0 ? (
                  <ul className="space-y-2">
                    {liveRisk.factors.map((factor, i) => (
                      <li key={i} className="text-sm bg-slate-800 p-2 rounded border border-slate-700 text-slate-300">
                        {factor}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500 italic">No high risk factors detected.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
