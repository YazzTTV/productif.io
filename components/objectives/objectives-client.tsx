"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WarMap } from "./war-map"
import { OKRSection } from "./okr-section"

export function ObjectivesClient() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Objectifs</h1>
      
      <Tabs defaultValue="warmap" className="space-y-6">
        <TabsList>
          <TabsTrigger value="warmap">WAR MAP</TabsTrigger>
          <TabsTrigger value="okr">OKR</TabsTrigger>
        </TabsList>

        <TabsContent value="warmap" className="space-y-6">
          <WarMap />
        </TabsContent>

        <TabsContent value="okr" className="space-y-6">
          <OKRSection />
        </TabsContent>
      </Tabs>
    </div>
  )
} 