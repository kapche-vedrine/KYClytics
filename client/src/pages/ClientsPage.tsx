import React, { useState, useEffect } from "react";
import { clientsAPI } from "@/lib/api";
import { Client } from "@shared/schema";
import { Link } from "wouter";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RiskBadge, StatusBadge } from "@/components/ui/risk-badge";
import { Plus, Search, Filter, MoreHorizontal } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("ALL");
  const { toast } = useToast();

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    try {
      const data = await clientsAPI.getAll();
      setClients(data);
    } catch (error) {
      console.error("Failed to fetch clients:", error);
      toast({ 
        title: "Error", 
        description: "Failed to load clients", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteClient(id: string) {
    try {
      await clientsAPI.delete(id);
      setClients(clients.filter(c => c.id !== id));
      toast({ title: "Client Deleted", description: "Client has been removed." });
    } catch (error) {
      console.error("Failed to delete client:", error);
      toast({ 
        title: "Error", 
        description: "Failed to delete client", 
        variant: "destructive" 
      });
    }
  }

  const filteredClients = clients.filter((client) => {
    const matchesSearch = 
      client.firstName.toLowerCase().includes(search.toLowerCase()) || 
      client.lastName.toLowerCase().includes(search.toLowerCase());
    
    const matchesRisk = riskFilter === "ALL" || client.band === riskFilter;
    
    return matchesSearch && matchesRisk;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Loading clients...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Client Management</h1>
          <p className="text-slate-500 mt-1">Manage KYC profiles and risk assessments.</p>
        </div>
        <Link href="/clients/new">
          <Button className="gap-2 shadow-md shadow-blue-500/20">
            <Plus className="w-4 h-4" />
            New Onboarding
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search clients..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-50"
          />
        </div>
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="w-full sm:w-[180px] bg-slate-50">
            <Filter className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue placeholder="Risk Band" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Bands</SelectItem>
            <SelectItem value="GREEN">Green (Low)</SelectItem>
            <SelectItem value="YELLOW">Yellow (Medium)</SelectItem>
            <SelectItem value="RED">Red (High)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="w-[250px]">Client Name</TableHead>
              <TableHead>Risk Score</TableHead>
              <TableHead>Risk Band</TableHead>
              <TableHead>Review Status</TableHead>
              <TableHead>Next Review</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                  No clients found.
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow key={client.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="text-slate-900">{client.firstName} {client.lastName}</span>
                      <span className="text-xs text-slate-400">{client.job}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono font-medium text-slate-600">{client.score}</span>
                  </TableCell>
                  <TableCell>
                    <RiskBadge band={client.band} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={client.status} />
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {new Date(client.nextReview).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Link href={`/clients/${client.id}`}>
                          <DropdownMenuItem className="cursor-pointer">
                            View Details
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem 
                          className="text-rose-600 focus:text-rose-700 cursor-pointer"
                          onClick={() => handleDeleteClient(client.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
