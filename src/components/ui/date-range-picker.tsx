import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from "date-fns"
import type { DateRange } from "react-day-picker"

import { cn } from "./utils"
import { Button } from "./button"
import { Calendar } from "./calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"

export function DatePickerWithRange({
  className,
  date,
  setDate,
}: {
  className?: string
  date: DateRange | undefined
  setDate: (date: DateRange | undefined) => void
}) {
  const handlePreset = (preset: string) => {
    const today = new Date()
    switch (preset) {
      case "Current week":
        setDate({ from: startOfWeek(today), to: endOfWeek(today) })
        break
      case "Last 7 Days":
        setDate({ from: subDays(today, 6), to: today })
        break
      case "Current month":
        setDate({ from: startOfMonth(today), to: endOfMonth(today) })
        break
      case "Last 3 month":
        setDate({ from: subMonths(today, 3), to: today })
        break
      case "Current Year":
        setDate({ from: startOfYear(today), to: endOfYear(today) })
        break
    }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal bg-card-base border-border-subtle",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 flex flex-col sm:flex-row align-top bg-card-elevated border-border-subtle" align="start">
          <div className="flex flex-col gap-1 p-3 border-b sm:border-b-0 sm:border-r border-border-subtle min-w-[150px]">
            <Button variant="ghost" className="justify-start text-left font-normal h-8 text-sm" onClick={() => handlePreset("Current week")}>Current week</Button>
            <Button variant="ghost" className="justify-start text-left font-normal h-8 text-sm" onClick={() => handlePreset("Last 7 Days")}>Last 7 Days</Button>
            <Button variant="ghost" className="justify-start text-left font-normal h-8 text-sm" onClick={() => handlePreset("Current month")}>Current month</Button>
            <Button variant="ghost" className="justify-start text-left font-normal h-8 text-sm" onClick={() => handlePreset("Last 3 month")}>Last 3 month</Button>
            <Button variant="ghost" className="justify-start text-left font-normal h-8 text-sm" onClick={() => handlePreset("Current Year")}>Current Year</Button>
          </div>
          <div className="p-3">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={1}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
