import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, User, FileText, Settings, LogIn } from "lucide-react";

const AUDIT_LOGS = [
  { id: 1, action: "LOGIN", actor: "admin@kyclytics.com", target: "System", timestamp: "2024-05-10 09:00:00" },
  { id: 2, action: "CREATE_CLIENT", actor: "admin@kyclytics.com", target: "Client: Alice Thompson", timestamp: "2024-05-10 09:15:23" },
  { id: 3, action: "UPLOAD_DOC", actor: "admin@kyclytics.com", target: "Client: Alice Thompson (passport.pdf)", timestamp: "2024-05-10 09:16:05" },
  { id: 4, action: "SCORE_UPDATE", actor: "System", target: "Client: Boris Ivanov", timestamp: "2024-05-10 02:00:00" },
  { id: 5, action: "STATUS_CHANGE", actor: "System", target: "Client: David Miller (OVERDUE)", timestamp: "2024-05-10 02:00:01" },
  { id: 6, action: "UPDATE_RULES", actor: "admin@kyclytics.com", target: "Risk Engine Weights", timestamp: "2024-05-09 16:45:00" },
];

export default function AuditPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-slate-500 mt-1">Immutable record of all system actions and security events.</p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>System Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Target</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {AUDIT_LOGS.map((log) => (
                <TableRow key={log.id} className="hover:bg-slate-50">
                  <TableCell className="text-slate-500 font-mono text-xs">
                    {log.timestamp}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-700">
                    {log.actor}
                  </TableCell>
                  <TableCell className="text-sm text-slate-900 font-medium">
                    {log.target}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
