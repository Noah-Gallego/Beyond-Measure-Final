'use client';

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Stat cards */}
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader className="p-4 pb-0">
            <Skeleton className="h-5 w-1/2" />
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <Skeleton className="h-8 w-2/3 mb-2" />
            <Skeleton className="h-4 w-1/3" />
          </CardContent>
        </Card>
      ))}

      {/* Chart cards */}
      <Card className="col-span-2 overflow-hidden">
        <CardHeader className="p-4 pb-0">
          <Skeleton className="h-5 w-1/3" />
        </CardHeader>
        <CardContent className="p-4">
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
      
      <Card className="col-span-2 overflow-hidden">
        <CardHeader className="p-4 pb-0">
          <Skeleton className="h-5 w-1/3" />
        </CardHeader>
        <CardContent className="p-4">
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>

      {/* Recent activity */}
      <Card className="col-span-2 overflow-hidden lg:col-span-3">
        <CardHeader className="p-4 pb-0">
          <Skeleton className="h-5 w-1/4" />
        </CardHeader>
        <CardContent className="p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-3 w-[150px]" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Pie chart */}
      <Card className="overflow-hidden lg:col-span-1">
        <CardHeader className="p-4 pb-0">
          <Skeleton className="h-5 w-1/2" />
        </CardHeader>
        <CardContent className="p-4">
          <Skeleton className="h-[200px] w-full rounded-full mx-auto" style={{ maxWidth: '200px' }} />
        </CardContent>
      </Card>
    </div>
  );
} 