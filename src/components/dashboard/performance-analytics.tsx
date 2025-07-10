"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, DollarSign } from "lucide-react";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { Vendor, Invoice } from "@/lib/types";

interface PerformanceAnalyticsProps {
  vendors: Vendor[];
  invoices: Invoice[];
  cardData: any;
}

export function PerformanceAnalytics({ vendors, invoices, cardData }: PerformanceAnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("6months");
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceIcon = (score: number) => {
    if (score >= 85) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (score >= 70) return <Clock className="h-4 w-4 text-yellow-600" />;
    return <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'High':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Calculate vendor performance metrics
  const calculateVendorMetrics = (vendor: Vendor) => {
    const vendorInvoices = invoices.filter(inv => inv.vendorId === vendor.id);
    const totalSpend = vendorInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const paidInvoices = vendorInvoices.filter(inv => inv.status === 'Paid');
    const onTimePayments = paidInvoices.filter(inv => 
      inv.paymentDate && new Date(inv.paymentDate) <= new Date(inv.invoiceDueDate)
    );
    
    const onTimePaymentRate = paidInvoices.length > 0 ? (onTimePayments.length / paidInvoices.length) * 100 : 0;
    const overallScore = Math.round((
      (vendor.performanceMetrics?.onTimeDeliveryRate || 0) +
      (vendor.performanceMetrics?.qualityScore || 0) +
      onTimePaymentRate
    ) / 3);

    return {
      totalSpend,
      invoiceCount: vendorInvoices.length,
      onTimePaymentRate,
      overallScore,
      qualityScore: vendor.performanceMetrics?.qualityScore || 0,
      onTimeDeliveryRate: vendor.performanceMetrics?.onTimeDeliveryRate || 0,
    };
  };

  // Top performing vendors
  const topVendors = vendors
    .map(vendor => ({
      ...vendor,
      metrics: calculateVendorMetrics(vendor)
    }))
    .sort((a, b) => b.metrics.overallScore - a.metrics.overallScore)
    .slice(0, 10);

  // Spending by vendor (top 10)
  const spendingData = topVendors.map(vendor => ({
    name: vendor.name,
    spend: vendor.metrics.totalSpend,
    invoices: vendor.metrics.invoiceCount,
  }));

  // Risk distribution
  const riskDistribution = [
    { name: 'Low Risk', value: vendors.filter(v => v.riskLevel === 'Low').length, color: '#22c55e' },
    { name: 'Medium Risk', value: vendors.filter(v => v.riskLevel === 'Medium').length, color: '#eab308' },
    { name: 'High Risk', value: vendors.filter(v => v.riskLevel === 'High').length, color: '#ef4444' },
  ];

  // Compliance status
  const complianceData = [
    { name: 'Compliant', value: vendors.filter(v => v.complianceStatus === 'Compliant').length, color: '#22c55e' },
    { name: 'Needs Review', value: vendors.filter(v => v.complianceStatus === 'Needs Review').length, color: '#eab308' },
    { name: 'Non-Compliant', value: vendors.filter(v => v.complianceStatus === 'Non-Compliant').length, color: '#ef4444' },
  ];

  // Monthly spend trend (mock data for demo)
  const monthlySpendData = [
    { month: 'Jan', spend: 45000 },
    { month: 'Feb', spend: 52000 },
    { month: 'Mar', spend: 48000 },
    { month: 'Apr', spend: 61000 },
    { month: 'May', spend: 55000 },
    { month: 'Jun', spend: 67000 },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(topVendors.reduce((sum, v) => sum + v.metrics.overallScore, 0) / topVendors.length || 0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Across all vendors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Vendors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cardData.highRiskVendors || 0}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Payment Days</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cardData.avgPaymentDays || 0}</div>
            <p className="text-xs text-muted-foreground">
              Days to pay invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cardData.complianceIssues || 0}</div>
            <p className="text-xs text-muted-foreground">
              Need resolution
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Spending by Vendor */}
        <Card>
          <CardHeader>
            <CardTitle>Top Vendors by Spend</CardTitle>
            <CardDescription>
              Your highest spending vendors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis tickFormatter={formatCurrency} />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Bar dataKey="spend" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Spend Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Spend Trend</CardTitle>
            <CardDescription>
              Spending patterns over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlySpendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={formatCurrency} />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Line type="monotone" dataKey="spend" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Risk Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
            <CardDescription>
              Vendor risk levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Status */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Status</CardTitle>
            <CardDescription>
              Overall compliance health
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={complianceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {complianceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vendor Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Performance Rankings</CardTitle>
          <CardDescription>
            Detailed performance metrics for all vendors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Overall Score</TableHead>
                  <TableHead>Total Spend</TableHead>
                  <TableHead>Invoices</TableHead>
                  <TableHead>On-Time Delivery</TableHead>
                  <TableHead>Quality Score</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Compliance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topVendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{vendor.name}</div>
                        <div className="text-sm text-muted-foreground">{vendor.service}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPerformanceIcon(vendor.metrics.overallScore)}
                        <span className={`font-semibold ${getPerformanceColor(vendor.metrics.overallScore)}`}>
                          {vendor.metrics.overallScore}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(vendor.metrics.totalSpend)}</TableCell>
                    <TableCell>{vendor.metrics.invoiceCount}</TableCell>
                    <TableCell>{vendor.metrics.onTimeDeliveryRate}%</TableCell>
                    <TableCell>{vendor.metrics.qualityScore}%</TableCell>
                    <TableCell>
                      <Badge className={getRiskBadgeColor(vendor.riskLevel)}>
                        {vendor.riskLevel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={vendor.complianceStatus === 'Compliant' ? 'default' : 'destructive'}>
                        {vendor.complianceStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
