"use client"

import { useEffect, useState } from "react"
import { addDays } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { WarMapEventDialog } from "./war-map-event-dialog"
import { Button } from "@/components/ui/button"
import { Plus, Pencil } from "lucide-react"
import { DateRange } from "react-day-picker"

interface Event {
  id: string
  title: string
  description: string | null
  startDate: Date
  endDate: Date
  color: string | null
  projectId: string | null
  project: {
    id: string
    name: string
    color: string | null
  } | null
}

export function WarMap() {
  const [events, setEvents] = useState<Event[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(undefined)
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>(undefined)

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/war-map-events")
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des événements")
      }
      const data = await response.json()
      const mappedEvents = data.map((event: any) => ({
        ...event,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
      }))
      setEvents(mappedEvents)
      filterEventsByRange(mappedEvents, selectedRange)
    } catch (error) {
      console.error("Erreur:", error)
    }
  }

  // Fonction pour filtrer les événements par plage de dates
  const filterEventsByRange = (eventsToFilter: Event[], range: DateRange | undefined) => {
    if (!range || !range.from) {
      // Si pas de sélection, afficher les événements du mois en cours
      const today = new Date()
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      
      setFilteredEvents(
        eventsToFilter.filter(event => 
          (event.startDate <= lastDayOfMonth && event.endDate >= firstDayOfMonth)
        )
      )
    } else {
      const from = range.from
      const to = range.to || range.from
      
      setFilteredEvents(
        eventsToFilter.filter(event =>
          (event.startDate <= to && event.endDate >= from)
        )
      )
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    filterEventsByRange(events, selectedRange)
  }, [selectedRange, events])

  // Fonction pour obtenir les dates entre deux dates
  const getDatesInRange = (startDate: Date, endDate: Date) => {
    const dates = []
    let currentDate = startDate
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate))
      currentDate = addDays(currentDate, 1)
    }
    return dates
  }

  // Créer un objet avec toutes les dates des événements
  const eventDates = events.reduce((acc, event) => {
    const dates = getDatesInRange(event.startDate, event.endDate)
    dates.forEach((date) => {
      const dateStr = date.toISOString().split("T")[0]
      if (!acc[dateStr]) {
        acc[dateStr] = []
      }
      acc[dateStr].push({
        title: event.title,
        color: event.project?.color || event.color || "#000000",
      })
    })
    return acc
  }, {} as Record<string, Array<{ title: string; color: string }>>)

  // Style personnalisé pour les jours avec événements
  const modifiers = {
    event: (date: Date) => {
      const dateStr = date.toISOString().split("T")[0]
      return dateStr in eventDates
    },
  }

  const modifiersStyles = {
    event: {
      fontWeight: "bold",
    },
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">War Map</h2>
        <Button onClick={() => {
          setSelectedEvent(undefined)
          setIsDialogOpen(true)
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un événement
        </Button>
      </div>

      <div className="flex gap-8 bg-white rounded-lg shadow-lg p-6">
        {/* Calendrier à gauche */}
        <div className="flex-1 min-w-[800px]">
          <Calendar
            mode="range"
            selected={selectedRange}
            onSelect={setSelectedRange}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            className="w-full"
            styles={{
              months: {
                width: "100%",
              },
              month: {
                width: "100%",
              },
              table: {
                width: "100%",
                tableLayout: "fixed",
              },
              head_cell: {
                width: "100%",
                textAlign: "center",
                padding: "4px",
                fontWeight: 500,
                fontSize: "0.8rem",
                color: "rgb(107 114 128)",
              },
              cell: {
                width: "100%",
                textAlign: "center",
                padding: "0",
              },
              day: {
                margin: "1px",
                width: "100%",
                height: "42px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "2px 4px",
                borderRadius: "4px",
                fontSize: "0.8rem",
              },
            }}
            components={{
              DayContent: ({ date }) => {
                const dateStr = date.toISOString().split("T")[0]
                const dayEvents = eventDates[dateStr] || []
                return (
                  <div className="relative w-full h-full flex flex-col justify-between">
                    <div className="text-right text-xs">{date.getDate()}</div>
                    {dayEvents.length > 0 && (
                      <div className="flex gap-1 justify-center mt-auto">
                        {dayEvents.slice(0, 3).map((event, index) => (
                          <div
                            key={index}
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: event.color }}
                            title={event.title}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500 ml-1">+{dayEvents.length - 3}</div>
                        )}
                      </div>
                    )}
                  </div>
                )
              },
            }}
          />
        </div>

        {/* Liste des événements à droite */}
        <div className="w-96 border-l pl-8">
          <h3 className="text-lg font-semibold mb-4">
            {selectedRange?.from ? (
              <span>
                Événements du {selectedRange.from.toLocaleDateString()} 
                {selectedRange.to ? ` au ${selectedRange.to.toLocaleDateString()}` : ''}
              </span>
            ) : (
              "Événements du mois"
            )}
          </h3>
          <div className="space-y-4">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="p-4 rounded-lg border group relative"
                style={{ borderColor: event.color || '#e2e8f0' }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => {
                    setSelectedEvent(event)
                    setIsDialogOpen(true)
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <div className="font-medium">{event.title}</div>
                <div className="text-sm text-gray-500">
                  {event.startDate.toLocaleDateString()} - {event.endDate.toLocaleDateString()}
                </div>
                {event.project && (
                  <div className="mt-2 text-sm">
                    Projet: {event.project.name}
                  </div>
                )}
              </div>
            ))}
            {filteredEvents.length === 0 && (
              <div className="text-gray-500 text-center py-4">
                Aucun événement sur cette période
              </div>
            )}
          </div>
        </div>
      </div>

      <WarMapEventDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={() => {
          setIsDialogOpen(false)
          setSelectedEvent(undefined)
          fetchEvents()
        }}
        defaultDates={selectedRange}
        event={selectedEvent}
      />
    </div>
  )
} 