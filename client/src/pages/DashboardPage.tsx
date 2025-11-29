import React from "react";
import { useStore } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { Users, AlertTriangle, Clock, FileCheck, ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/ui/risk-badge";

export default function DashboardPage() {
  const clients = useStore((state) => state.clients);

  // Stats
  const totalClients = clients.length;
  const highRiskClients = clients.filter(c => c.band === 'RED').length;
  const dueSoon = clients.filter(c => c.status === 'DUE_SOON' || c.status === 'OVERDUE').length;
  const overdue = clients.filter(c => c.status === 'OVERDUE').length;

  // Chart Data
  const riskDistribution = [
    { name: "Low Risk", value: clients.filter(c => c.band === 'GREEN').length, color: "var(--chart-1)" },
    { name: "Medium Risk", value: clients.filter(c => c.band === 'YELLOW').length, color: "var(--chart-2)" },
    { name: "High Risk", value: clients.filter(c => c.band === 'RED').length, color: "var(--chart-3)" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of compliance status and risk metrics.</p>
        </div>
        <Link href="/clients">
          <Button className="gap-2">
            <Users className="w-4 h-4" />
            View All Clients
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">{totalClients}</div>
            <p className="text-xs text-slate-400 mt-1">+2 from last month</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">High Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display text-rose-600">{highRiskClients}</div>
            <p className="text-xs text-slate-400 mt-1">Requires immediate attention</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Reviews Due</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display text-amber-600">{dueSoon}</div>
            <p className="text-xs text-slate-400 mt-1">{overdue} overdue</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Completed Reviews</CardTitle>
            <FileCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display text-emerald-600">94%</div>
            <p className="text-xs text-slate-400 mt-1">Compliance rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">
        {/* Chart */}
        <Card className="lg:col-span-4 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskDistribution}>
                  <XAxis 
                    dataKey="name" 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={60}>
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity / Quick Actions */}
        <Card className="lg:col-span-3 border-slate-200 shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle>Priority Reviews</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-4">
              {clients
                .filter(c => c.status !== 'OK')
                .slice(0, 5)
                .map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-rose-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{client.firstName} {client.lastName}</p>
                        <p className="text-xs text-slate-500">Due: {new Date(client.nextReview).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <RiskBadge band={client.band} className="scale-75" />
                      <Link href={`/clients/${client.id}`}>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <ArrowUpRight className="w-4 h-4 text-slate-400" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              
              {dueSoon === 0 && (
                <div className="text-center text-slate-400 py-8">
                  <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No priority reviews pending</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
