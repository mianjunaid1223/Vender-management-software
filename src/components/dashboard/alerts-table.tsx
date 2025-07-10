"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Clock, Shield, FileText, CheckCircle, X, Bell, BellOff } from "lucide-react";
import { Notification, Contract } from "@/lib/types";

interface AlertsTableProps {
  notifications: Notification[];
  expiringContracts: Contract[];
}

export function AlertsTable({ notifications, expiringContracts }: AlertsTableProps) {
  const [activeNotifications, setActiveNotifications] = useState<Notification[]>(notifications);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'High':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'High':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'Medium':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'Low':
        return <Shield className="h-4 w-4 text-green-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Contract Renewal':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'Compliance Alert':
        return <Shield className="h-4 w-4 text-red-600" />;
      case 'Invoice Due':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'Performance Alert':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const getDaysUntilExpiry = (endDate: Date) => {
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleMarkAsRead = (notificationId: string) => {
    setActiveNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const handleDismiss = (notificationId: string) => {
    setActiveNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  const unreadCount = activeNotifications.filter(n => !n.isRead).length;
  const criticalCount = activeNotifications.filter(n => n.priority === 'Critical').length;
  const highCount = activeNotifications.filter(n => n.priority === 'High').length;
  const expiringCount = expiringContracts.length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadCount}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{criticalCount}</div>
            <p className="text-xs text-muted-foreground">
              Immediate action needed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highCount}</div>
            <p className="text-xs text-muted-foreground">
              High priority items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Contracts</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiringCount}</div>
            <p className="text-xs text-muted-foreground">
              Next 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Contracts */}
      {expiringContracts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Expiring Contracts</CardTitle>
            <CardDescription>
              Contracts that require renewal attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contract</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Days Until Expiry</TableHead>
                    <TableHead>Auto-Renewal</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expiringContracts.map((contract) => {
                    const daysUntilExpiry = getDaysUntilExpiry(contract.endDate);
                    return (
                      <TableRow key={contract.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold">{contract.title}</div>
                            <div className="text-sm text-muted-foreground">{contract.contractNumber}</div>
                          </div>
                        </TableCell>
                        <TableCell>{contract.vendorId}</TableCell>
                        <TableCell>{formatDate(contract.endDate)}</TableCell>
                        <TableCell>
                          <Badge variant={daysUntilExpiry <= 7 ? "destructive" : "secondary"}>
                            {daysUntilExpiry} days
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={contract.autoRenewal ? "default" : "secondary"}>
                            {contract.autoRenewal ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
          <CardDescription>
            System alerts and notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeNotifications.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <p className="text-muted-foreground">No active notifications. You're all caught up!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeNotifications.map((notification) => (
                    <TableRow key={notification.id} className={notification.isRead ? 'opacity-60' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(notification.type)}
                          <span className="font-medium">{notification.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-semibold">{notification.title}</div>
                          <div className="text-sm text-muted-foreground">{notification.message}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPriorityIcon(notification.priority)}
                          <Badge className={getPriorityColor(notification.priority)}>
                            {notification.priority}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{formatTimeAgo(notification.createdAt)}</div>
                          <div className="text-xs text-muted-foreground">{formatDate(notification.createdAt)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={notification.isRead ? "secondary" : "default"}>
                          {notification.isRead ? "Read" : "Unread"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {!notification.isRead && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              Mark Read
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleDismiss(notification.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
