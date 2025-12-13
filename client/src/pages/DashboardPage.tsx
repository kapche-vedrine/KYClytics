import React, { useState, useEffect } from "react";
import { clientsAPI, preferencesAPI } from "@/lib/api";
import { Client } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { Users, AlertTriangle, Clock, FileCheck, ArrowUpRight, Settings2, GripVertical, Eye, EyeOff } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/ui/risk-badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type WidgetId = 'stats' | 'riskChart' | 'priorityReviews' | 'recentActivity';

const WIDGET_LABELS: Record<WidgetId, string> = {
  stats: 'Statistics Cards',
  riskChart: 'Risk Distribution Chart',
  priorityReviews: 'Priority Reviews',
  recentActivity: 'Recent Activity'
};

const DEFAULT_WIDGETS: WidgetId[] = ['stats', 'riskChart', 'priorityReviews', 'recentActivity'];

export default function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleWidgets, setVisibleWidgets] = useState<WidgetId[]>(DEFAULT_WIDGETS);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [clientsData, prefs] = await Promise.all([
          clientsAPI.getAll(),
          preferencesAPI.get().catch(() => null)
        ]);
        setClients(clientsData);
        if (prefs?.dashboardWidgets) {
          setVisibleWidgets(prefs.dashboardWidgets as WidgetId[]);
        }
        setPrefsLoaded(true);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const toggleWidget = async (widgetId: WidgetId) => {
    const newWidgets = visibleWidgets.includes(widgetId)
      ? visibleWidgets.filter(w => w !== widgetId)
      : [...visibleWidgets, widgetId];
    setVisibleWidgets(newWidgets);
    try {
      await preferencesAPI.update({ dashboardWidgets: newWidgets });
    } catch (error) {
      console.error("Failed to save widget preferences:", error);
    }
  };

  const totalClients = clients.length;
  const highRiskClients = clients.filter(c => c.band === 'RED').length;
  const dueSoon = clients.filter(c => c.status === 'DUE_SOON' || c.status === 'OVERDUE').length;
  const overdue = clients.filter(c => c.status === 'OVERDUE').length;

  const riskDistribution = [
    { name: "Low Risk", value: clients.filter(c => c.band === 'GREEN').length, color: "hsl(var(--chart-1))" },
    { name: "Medium Risk", value: clients.filter(c => c.band === 'YELLOW').length, color: "hsl(var(--chart-2))" },
    { name: "High Risk", value: clients.filter(c => c.band === 'RED').length, color: "hsl(var(--chart-3))" },
  ];

  const recentClients = clients.slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500 dark:text-slate-400">Loading dashboard...</p>
      </div>
    );
  }

  const isWidgetVisible = (id: WidgetId) => visibleWidgets.includes(id);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100" data-testid="text-dashboard-title">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Overview of compliance status and risk metrics.</p>
        </div>
        <div className="flex gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2" data-testid="button-customize-widgets">
                <Settings2 className="w-4 h-4" />
                Customize
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Customize Dashboard</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Toggle widgets to show or hide them on your dashboard.
                </p>
                {(Object.keys(WIDGET_LABELS) as WidgetId[]).map((widgetId) => (
                  <div key={widgetId} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      {isWidgetVisible(widgetId) ? (
                        <Eye className="w-4 h-4 text-slate-500" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-slate-400" />
                      )}
                      <Label htmlFor={widgetId} className="cursor-pointer">
                        {WIDGET_LABELS[widgetId]}
                      </Label>
                    </div>
                    <Switch
                      id={widgetId}
                      checked={isWidgetVisible(widgetId)}
                      onCheckedChange={() => toggleWidget(widgetId)}
                      data-testid={`switch-widget-${widgetId}`}
                    />
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
          <Link href="/clients">
            <Button className="gap-2" data-testid="button-view-clients">
              <Users className="w-4 h-4" />
              View All Clients
            </Button>
          </Link>
        </div>
      </div>

      {isWidgetVisible('stats') && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="widget-stats">
          <Card className="border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow dark:bg-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display dark:text-slate-100" data-testid="text-total-clients">{totalClients}</div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Active in system</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow dark:bg-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">High Risk</CardTitle>
              <AlertTriangle className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display text-rose-600" data-testid="text-high-risk">{highRiskClients}</div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Requires immediate attention</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow dark:bg-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Reviews Due</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display text-amber-600" data-testid="text-reviews-due">{dueSoon}</div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{overdue} overdue</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow dark:bg-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Completed Reviews</CardTitle>
              <FileCheck className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display text-emerald-600" data-testid="text-completion-rate">
                {totalClients > 0 ? Math.round((clients.filter(c => c.status === 'OK').length / totalClients) * 100) : 0}%
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Compliance rate</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">
        {isWidgetVisible('riskChart') && (
          <Card className={`border-slate-200 dark:border-slate-700 shadow-sm dark:bg-slate-800 ${isWidgetVisible('priorityReviews') || isWidgetVisible('recentActivity') ? 'lg:col-span-4' : 'lg:col-span-7'}`} data-testid="widget-risk-chart">
            <CardHeader>
              <CardTitle className="dark:text-slate-100">Risk Distribution</CardTitle>
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
        )}

        {isWidgetVisible('priorityReviews') && (
          <Card className={`border-slate-200 dark:border-slate-700 shadow-sm flex flex-col dark:bg-slate-800 ${isWidgetVisible('riskChart') ? 'lg:col-span-3' : 'lg:col-span-7'}`} data-testid="widget-priority-reviews">
            <CardHeader>
              <CardTitle className="dark:text-slate-100">Priority Reviews</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-4">
                {clients
                  .filter(c => c.status !== 'OK')
                  .slice(0, 5)
                  .map((client) => (
                    <div key={client.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-100 dark:border-slate-600 hover:border-slate-200 dark:hover:border-slate-500 transition-colors" data-testid={`priority-client-${client.id}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{client.firstName} {client.lastName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Due: {new Date(client.nextReview).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <RiskBadge band={client.band} className="scale-75" />
                        <Link href={`/clients/${client.id}`}>
                          <Button size="icon" variant="ghost" className="h-8 w-8" data-testid={`button-view-client-${client.id}`}>
                            <ArrowUpRight className="w-4 h-4 text-slate-400" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                
                {dueSoon === 0 && (
                  <div className="text-center text-slate-400 dark:text-slate-500 py-8">
                    <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No priority reviews pending</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {isWidgetVisible('recentActivity') && (
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm dark:bg-slate-800" data-testid="widget-recent-activity">
          <CardHeader>
            <CardTitle className="dark:text-slate-100">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentClients.length > 0 ? (
                recentClients.map((client, idx) => (
                  <div key={client.id} className="flex items-center gap-4 py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-sm font-medium text-slate-600 dark:text-slate-300">
                      {client.firstName[0]}{client.lastName[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{client.firstName} {client.lastName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {client.industry} - {client.country}
                      </p>
                    </div>
                    <RiskBadge band={client.band} />
                    <Link href={`/clients/${client.id}`}>
                      <Button size="sm" variant="ghost" data-testid={`button-recent-${client.id}`}>
                        View
                      </Button>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-400 dark:text-slate-500 py-8">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {visibleWidgets.length === 0 && (
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm dark:bg-slate-800">
          <CardContent className="py-12 text-center">
            <Settings2 className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">No widgets visible</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Click the Customize button above to enable dashboard widgets.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
