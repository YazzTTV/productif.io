"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Clock, MoreHorizontal, Pencil, Trash2 } from "lucide-react"

interface TimeEntry {
  id: string
  startTime: Date
  endTime: Date | null
  duration: number | null
  note: string | null
  task: {
    id: string
    title: string
  } | null
  project: {
    id: string
    name: string
    color: string | null
  } | null
}

interface TimeHistoryProps {
  entries: TimeEntry[]
}

export function TimeHistory({ entries: initialEntries }: TimeHistoryProps) {
  const router = useRouter()
  const [entries, setEntries] = useState<TimeEntry[]>(initialEntries)

  // Formater la durée (format: HH:MM:SS)
  const formatDuration = (durationInSeconds: number | null) => {
    if (!durationInSeconds) return "00:00:00"

    const hours = Math.floor(durationInSeconds / 3600)
    const minutes = Math.floor((durationInSeconds % 3600) / 60)
    const seconds = durationInSeconds % 60

    return [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      seconds.toString().padStart(2, "0"),
    ].join(":")
  }

  // Formater la date
  const formatDate = (date: Date) => {
    return format(new Date(date), "dd MMM yyyy HH:mm", { locale: fr })
  }

  // Supprimer une entrée de temps
  const deleteTimeEntry = async (entryId: string) => {
    try {
      const response = await fetch(`/api/time-entries/${entryId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression de l'entrée de temps")
      }

      // Mettre à jour l'état local
      setEntries(entries.filter((entry) => entry.id !== entryId))
    } catch (error) {
      console.error("Erreur:", error)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Historique récent</CardTitle>
        <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/time/history")}>
          Voir tout l'historique
        </Button>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="text-center py-6 text-gray-500">Aucune entrée de temps. Commencez à suivre votre temps !</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Durée</TableHead>
                  <TableHead>Projet</TableHead>
                  <TableHead>Tâche</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{formatDate(entry.startTime)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        <Clock className="mr-1 h-3 w-3" />
                        {formatDuration(entry.duration)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {entry.project ? (
                        <div className="flex items-center">
                          <div
                            className="w-2 h-2 rounded-full mr-2"
                            style={{ backgroundColor: entry.project.color || "#6366F1" }}
                          />
                          <span>{entry.project.name}</span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{entry.task ? entry.task.title : "-"}</TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">{entry.note || "-"}</div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/time/${entry.id}/edit`)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteTimeEntry(entry.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

