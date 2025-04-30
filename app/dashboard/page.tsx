"use client"

import { useState } from 'react'
import { Suspense } from "react"
import ClientOnly from "@/components/client-only"
import { BarChart, LineChart, PieChart } from '@/components/ui/charts'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from '@/components/ui/card'
import { DashboardSkeleton } from '@/components/ui/dashboard-skeleton'
import { 
  Activity, 
  CreditCard, 
  DollarSign, 
  Users, 
  ArrowDown, 
  ArrowUp, 
  ArrowRight, 
  BarChart2, 
  Calendar, 
  ShoppingCart 
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Create a loading component 
function DashboardLoadingFallback() {
  return <DashboardSkeleton />
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  // Sample data for charts
  const revenueData = [
    { name: 'Jan', value: 2000 },
    { name: 'Feb', value: 1500 },
    { name: 'Mar', value: 2500 },
    { name: 'Apr', value: 3500 },
    { name: 'May', value: 2800 },
    { name: 'Jun', value: 4000 },
    { name: 'Jul', value: 3800 },
  ];

  const weeklyTrafficData = [
    { name: 'Mon', value: 480 },
    { name: 'Tue', value: 520 },
    { name: 'Wed', value: 550 },
    { name: 'Thu', value: 620 },
    { name: 'Fri', value: 670 },
    { name: 'Sat', value: 400 },
    { name: 'Sun', value: 380 },
  ];

  const salesByCategory = [
    { name: 'Electronics', value: 35 },
    { name: 'Clothing', value: 25 },
    { name: 'Food', value: 20 },
    { name: 'Books', value: 15 },
    { name: 'Other', value: 5 },
  ];

  const recentActivityData = [
    { 
      id: 1, 
      user: { name: 'Alex Johnson', avatar: '/avatars/01.png' }, 
      action: 'placed a new order', 
      amount: '$129.99', 
      date: '5 min ago',
      status: 'completed'
    },
    { 
      id: 2, 
      user: { name: 'Sarah Williams', avatar: '/avatars/02.png' }, 
      action: 'subscribed to the premium plan', 
      amount: '$49.99/mo', 
      date: '1 hour ago',
      status: 'processing'
    },
    { 
      id: 3, 
      user: { name: 'Robert Chen', avatar: '/avatars/03.png' }, 
      action: 'requested a refund', 
      amount: '$79.99', 
      date: '3 hours ago',
      status: 'pending'
    },
    { 
      id: 4, 
      user: { name: 'Emily Davis', avatar: '/avatars/04.png' }, 
      action: 'updated their profile', 
      amount: null, 
      date: '5 hours ago',
      status: 'completed'
    },
    { 
      id: 5, 
      user: { name: 'Michael Smith', avatar: '/avatars/05.png' }, 
      action: 'canceled subscription', 
      amount: '$29.99/mo', 
      date: '1 day ago',
      status: 'canceled'
    },
  ];

  const statusColorMap: Record<string, string> = {
    completed: 'bg-green-50 text-green-600 border-green-100',
    processing: 'bg-blue-50 text-blue-600 border-blue-100',
    pending: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    canceled: 'bg-red-50 text-red-600 border-red-100'
  };

  return (
    <ClientOnly fallback={<DashboardLoadingFallback />}>
      <Suspense fallback={<DashboardLoadingFallback />}>
        <div className="flex-1 space-y-6 p-6 md:p-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" className="h-9">
                <Calendar className="mr-2 h-4 w-4" />
                <span>Last 7 days</span>
              </Button>
              <Button size="sm" className="h-9">Download Report</Button>
            </div>
          </div>
          
          <Tabs defaultValue="overview" className="space-y-6" onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="customers">Customers</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$45,231.89</div>
                    <div className="flex items-center pt-1 text-xs text-green-500">
                      <ArrowUp className="h-4 w-4 mr-1" />
                      <span>+20.1% from last month</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">+2350</div>
                    <div className="flex items-center pt-1 text-xs text-green-500">
                      <ArrowUp className="h-4 w-4 mr-1" />
                      <span>+12.3% from last month</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium">Sales</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">+12,234</div>
                    <div className="flex items-center pt-1 text-xs text-red-500">
                      <ArrowDown className="h-4 w-4 mr-1" />
                      <span>-4.5% from last month</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">+573,893</div>
                    <div className="flex items-center pt-1 text-xs text-green-500">
                      <ArrowUp className="h-4 w-4 mr-1" />
                      <span>+10.6% from last month</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                  <CardHeader>
                    <CardTitle>Revenue Over Time</CardTitle>
                    <CardDescription>
                      Daily revenue from January to July
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <LineChart data={revenueData} />
                  </CardContent>
                </Card>

                <Card className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle>Weekly Traffic</CardTitle>
                    <CardDescription>
                      Number of visitors per day this week
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <BarChart data={weeklyTrafficData} />
                  </CardContent>
                </Card>
              </div>

              {/* Sales Breakdown and Recent Activity */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle>Sales by Category</CardTitle>
                    <CardDescription>
                      Percentage breakdown of sales by product category
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <PieChart data={salesByCategory} />
                  </CardContent>
                </Card>

                <Card className="lg:col-span-4">
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                      Latest transactions and user activities
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px] overflow-auto">
                    <div className="space-y-4">
                      {recentActivityData.map(activity => (
                        <div key={activity.id} className="flex items-start space-x-4">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                            <AvatarFallback>{activity.user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium leading-none">
                                {activity.user.name} <span className="text-muted-foreground">{activity.action}</span>
                              </p>
                              <p className="text-sm text-muted-foreground">{activity.date}</p>
                            </div>
                            <div className="flex items-center justify-between">
                              {activity.amount && (
                                <p className="text-sm font-semibold">{activity.amount}</p>
                              )}
                              {activity.status && (
                                <Badge variant="outline" className={statusColorMap[activity.status]}>
                                  {activity.status}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t bg-muted/50 px-6 py-3">
                    <Button variant="outline" className="w-full" size="sm">
                      View all activity
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Analytics</CardTitle>
                    <CardDescription>
                      Detailed analytics data will appear here
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[500px] flex items-center justify-center">
                    <div className="flex flex-col items-center text-center">
                      <BarChart2 className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">Analytics Dashboard</h3>
                      <p className="text-sm text-muted-foreground max-w-md mt-2">
                        This tab would contain detailed analytics insights, conversion funnels, 
                        user behavior data, and more comprehensive reports.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Add similar placeholder content for other tabs */}
            <TabsContent value="reports">
              <Card>
                <CardHeader>
                  <CardTitle>Reports</CardTitle>
                  <CardDescription>
                    View and generate custom reports here
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[500px] flex items-center justify-center">
                  <div className="flex flex-col items-center text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Reports Dashboard</h3>
                    <p className="text-sm text-muted-foreground max-w-md mt-2">
                      This section would allow you to generate custom reports, 
                      schedule report delivery, and view report history.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customers">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Management</CardTitle>
                  <CardDescription>
                    Manage your customer database
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[500px] flex items-center justify-center">
                  <div className="flex flex-col items-center text-center">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Customer Dashboard</h3>
                    <p className="text-sm text-muted-foreground max-w-md mt-2">
                      This section would contain customer management tools, including
                      customer lists, segments, and detailed customer profiles.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </Suspense>
    </ClientOnly>
  );
}
