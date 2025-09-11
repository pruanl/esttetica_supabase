import * as React from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon, Clock } from "lucide-react"

import { cn } from "../../lib/utils"
import { Button } from "./button"
import { Calendar } from "./calendar"
import { Input } from "./input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"
import { Label } from "./label"

interface DateTimePickerProps {
  date?: Date
  onDateChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DateTimePicker({
  date,
  onDateChange,
  placeholder = "Selecione data e hora",
  disabled = false,
  className,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [timeValue, setTimeValue] = React.useState("09:00")

  // Usar a prop date diretamente em vez de estado local
  const selectedDate = date
  
  // Atualizar timeValue quando a data mudar externamente
  React.useEffect(() => {
    if (selectedDate) {
      setTimeValue(format(selectedDate, "HH:mm"))
    }
  }, [selectedDate])

  const handleDateSelect = (newDate: Date | undefined) => {
    if (!newDate) {
      onDateChange(undefined)
      return
    }

    // Manter a hora atual se já existe uma data selecionada
    const [hours, minutes] = timeValue.split(":")
    newDate.setHours(parseInt(hours), parseInt(minutes))
    
    onDateChange(newDate)
  }

  const handleTimeChange = (newTime: string) => {
    setTimeValue(newTime)
    
    if (selectedDate && newTime) {
      const [hours, minutes] = newTime.split(":")
      const newDate = new Date(selectedDate)
      newDate.setHours(parseInt(hours), parseInt(minutes))
      
      onDateChange(newDate)
    } else if (!selectedDate && newTime) {
      // Se não há data selecionada, criar uma nova data para hoje
      const today = new Date()
      const [hours, minutes] = newTime.split(":")
      today.setHours(parseInt(hours), parseInt(minutes))
      
      onDateChange(today)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? (
            format(selectedDate, "PPP 'às' HH:mm", { locale: ptBR })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            initialFocus
          />
          <div className="mt-3 border-t pt-3">
            <Label htmlFor="time-picker" className="text-sm font-medium">
              Horário
            </Label>
            <div className="flex items-center space-x-2 mt-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Input
                id="time-picker"
                type="time"
                value={timeValue}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          {selectedDate && (
            <div className="mt-3 pt-3 border-t">
              <Button
                onClick={() => handleOpenChange(false)}
                className="w-full"
                size="sm"
              >
                Confirmar
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}