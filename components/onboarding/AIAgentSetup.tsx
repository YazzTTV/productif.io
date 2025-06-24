"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, ChevronRight, Bot, Bell, Key, Copy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

type Step = {
  id: number;
  title: string;
  description: string;
  icon: JSX.Element;
  link?: string;
  isCompleted: boolean;
};

export default function AIAgentSetup() {
  const router = useRouter();
  const { toast } = useToast();
  const [apiToken, setApiToken] = useState("");
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [steps, setSteps] = useState<Step[]>([
    {
      id: 1,
      title: "Générer un token API",
      description: "Créez un token API pour connecter l'agent IA à votre compte",
      icon: <Key className="h-6 w-6" />,
      isCompleted: false
    },
    {
      id: 2,
      title: "Configurer l'agent IA",
      description: "Connectez-vous à l'agent IA WhatsApp",
      icon: <Bot className="h-6 w-6" />,
      link: "https://lynkk.it/productif.io",
      isCompleted: false
    },
    {
      id: 3,
      title: "Configurer les notifications",
      description: "Personnalisez vos préférences de notification",
      icon: <Bell className="h-6 w-6" />,
      link: "/dashboard/settings/notifications",
      isCompleted: false
    }
  ]);

  // Vérifier si un token existe déjà
  useEffect(() => {
    const checkExistingToken = async () => {
      try {
        const response = await fetch('/api/tokens');
        const data = await response.json();
        if (data && data.length > 0) {
          setSteps(prev => prev.map(step => 
            step.id === 1 ? { ...step, isCompleted: true } : step
          ));
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du token:", error);
      }
    };
    checkExistingToken();
  }, []);

  const generateToken = async () => {
    setIsGeneratingToken(true);
    try {
      const response = await fetch('/api/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: "Token WhatsApp"
        })
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la génération du token');
      }

      const data = await response.json();
      setApiToken(data.token);
      setSteps(prev => prev.map(step => 
        step.id === 1 ? { ...step, isCompleted: true } : step
      ));
      toast({
        title: "Token généré avec succès",
        description: "Copiez le token et utilisez-le pour configurer l'agent WhatsApp."
      });
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de générer le token. Veuillez réessayer."
      });
    } finally {
      setIsGeneratingToken(false);
    }
  };

  const handleStepClick = (step: Step) => {
    if (step.id === 1) {
      generateToken();
    } else if (step.link) {
      if (step.link.startsWith('http')) {
        window.open(step.link, '_blank');
        setSteps(prev => prev.map(s => 
          s.id === step.id ? { ...s, isCompleted: true } : s
        ));
      } else {
        router.push(step.link);
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Configuration de l'assistant IA</h1>
        <p className="text-muted-foreground mt-2">
          Suivez ces étapes pour configurer votre assistant IA personnel
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((step) => (
          <Card key={step.id} className={cn("transition-all", step.isCompleted && "bg-muted")}>
            <CardHeader className="flex flex-row items-center gap-4">
              <div className={cn(
                "p-2 rounded-full",
                step.isCompleted ? "bg-green-100" : "bg-gray-100"
              )}>
                {step.icon}
              </div>
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  {step.title}
                  {step.isCompleted && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                </CardTitle>
                <CardDescription>{step.description}</CardDescription>
              </div>
            </CardHeader>
            
            <CardContent>
              {step.id === 1 && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={apiToken}
                      readOnly
                      placeholder="Votre token API apparaîtra ici"
                    />
                    {apiToken ? (
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(apiToken);
                          toast({
                            title: "Token copié",
                            description: "Le token a été copié dans le presse-papiers."
                          });
                        }}
                      >
                        Copier
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleStepClick(step)}
                        disabled={isGeneratingToken}
                      >
                        {isGeneratingToken ? "Génération..." : "Générer"}
                      </Button>
                    )}
                  </div>
                </div>
              )}
              {step.id !== 1 && !step.isCompleted && (
                <Button
                  variant="outline"
                  onClick={() => handleStepClick(step)}
                  disabled={!steps[step.id - 2].isCompleted}
                >
                  {step.id === 2 ? "Configurer WhatsApp" : "Configurer"}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 