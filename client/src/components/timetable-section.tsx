import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Edit, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";

interface TimetableSlot {
  subject?: string;
  room?: string;
  type?: string;
}

interface DaySchedule {
  [timeSlot: string]: TimetableSlot;
}

interface WeekSchedule {
  Monday: DaySchedule;
  Tuesday: DaySchedule;
  Wednesday: DaySchedule;
  Thursday: DaySchedule;
  Friday: DaySchedule;
}

const timeSlots = ["9:00 AM", "11:00 AM", "2:00 PM", "4:00 PM"];
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const defaultSchedule: WeekSchedule = {
  Monday: {},
  Tuesday: {},
  Wednesday: {},
  Thursday: {},
  Friday: {},
};

export default function TimetableSection() {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ day: string; time: string } | null>(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: timetable, isLoading } = useQuery({
    queryKey: ["/api/timetable", user?.id],
    enabled: !!user?.id,
  });

  const schedule: WeekSchedule = timetable?.schedule || defaultSchedule;

  const updateTimetableMutation = useMutation({
    mutationFn: async (newSchedule: WeekSchedule) => {
      if (timetable) {
        return apiRequest("PUT", `/api/timetable/${user?.id}`, { schedule: newSchedule });
      } else {
        return apiRequest("POST", "/api/timetable", {
          userId: user?.id,
          schedule: newSchedule,
          isPublic: false,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timetable", user?.id] });
      setEditModalOpen(false);
      setSelectedSlot(null);
      toast({
        title: "Success",
        description: "Timetable updated successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update timetable. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSlotEdit = (day: string, time: string) => {
    setSelectedSlot({ day, time });
    setEditModalOpen(true);
  };

  const handleSlotSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSlot) return;

    const formData = new FormData(e.currentTarget);
    const subject = formData.get("subject") as string;
    const room = formData.get("room") as string;
    const type = formData.get("type") as string;

    const newSchedule = { ...schedule };
    if (!newSchedule[selectedSlot.day as keyof WeekSchedule]) {
      newSchedule[selectedSlot.day as keyof WeekSchedule] = {};
    }

    if (subject) {
      newSchedule[selectedSlot.day as keyof WeekSchedule][selectedSlot.time] = {
        subject,
        room,
        type,
      };
    } else {
      delete newSchedule[selectedSlot.day as keyof WeekSchedule][selectedSlot.time];
    }

    updateTimetableMutation.mutate(newSchedule);
  };

  const handleSlotClear = () => {
    if (!selectedSlot) return;

    const newSchedule = { ...schedule };
    delete newSchedule[selectedSlot.day as keyof WeekSchedule][selectedSlot.time];
    updateTimetableMutation.mutate(newSchedule);
  };

  const getSlotColor = (subject: string) => {
    const colors = {
      "Data Structures": "bg-blue-100 text-blue-900",
      "Database Systems": "bg-green-100 text-green-900",
      "Machine Learning": "bg-purple-100 text-purple-900",
      "Mathematics": "bg-orange-100 text-orange-900",
      "Software Engineering": "bg-red-100 text-red-900",
      "Web Development": "bg-indigo-100 text-indigo-900",
      "Computer Networks": "bg-pink-100 text-pink-900",
      "Project Work": "bg-yellow-100 text-yellow-900",
    };
    return colors[subject as keyof typeof colors] || "bg-gray-100 text-gray-900";
  };

  const formatWeekRange = (date: Date) => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay() + 1); // Monday
    const end = new Date(start);
    end.setDate(start.getDate() + 4); // Friday

    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-6 gap-4">
            {Array.from({ length: 30 }, (_, i) => (
              <div key={i} className="h-16 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-slate-900">My Timetable</h3>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button 
            size="sm" 
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => setEditModalOpen(true)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Schedule
          </Button>
        </div>
      </div>
      
      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentWeek(new Date(currentWeek.getTime() - 7 * 24 * 60 * 60 * 1000))}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h4 className="font-semibold text-slate-900">Week of {formatWeekRange(currentWeek)}</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentWeek(new Date(currentWeek.getTime() + 7 * 24 * 60 * 60 * 1000))}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Timetable Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          <div className="grid grid-cols-6 gap-4">
            {/* Header */}
            <div className="font-medium text-slate-600 text-sm py-2">Time</div>
            {days.map(day => (
              <div key={day} className="font-medium text-slate-600 text-sm py-2 text-center">
                {day}
              </div>
            ))}
            
            {/* Time slots */}
            {timeSlots.map(time => (
              <>
                <div key={time} className="text-sm text-slate-500 py-3">{time}</div>
                {days.map(day => {
                  const slot = schedule[day as keyof WeekSchedule]?.[time];
                  return (
                    <div
                      key={`${day}-${time}`}
                      className={`timetable-slot rounded-lg p-3 text-center min-h-[80px] cursor-pointer ${
                        slot ? `filled ${getSlotColor(slot.subject || "")}` : ""
                      }`}
                      onClick={() => handleSlotEdit(day, time)}
                    >
                      {slot && (
                        <>
                          <div className="font-medium text-sm">{slot.subject}</div>
                          <div className="text-xs opacity-75">{slot.room}</div>
                        </>
                      )}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedSlot ? `Edit ${selectedSlot.day} ${selectedSlot.time}` : "Edit Timetable"}
            </DialogTitle>
          </DialogHeader>
          {selectedSlot && (
            <form onSubmit={handleSlotSave} className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  name="subject"
                  defaultValue={schedule[selectedSlot.day as keyof WeekSchedule]?.[selectedSlot.time]?.subject || ""}
                  placeholder="Enter subject name"
                />
              </div>
              <div>
                <Label htmlFor="room">Room/Location</Label>
                <Input
                  id="room"
                  name="room"
                  defaultValue={schedule[selectedSlot.day as keyof WeekSchedule]?.[selectedSlot.time]?.room || ""}
                  placeholder="e.g., Room A101, Lab B205"
                />
              </div>
              <div>
                <Label htmlFor="type">Class Type</Label>
                <Select name="type" defaultValue={schedule[selectedSlot.day as keyof WeekSchedule]?.[selectedSlot.time]?.type || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lecture">Lecture</SelectItem>
                    <SelectItem value="Lab">Lab</SelectItem>
                    <SelectItem value="Tutorial">Tutorial</SelectItem>
                    <SelectItem value="Seminar">Seminar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex space-x-2">
                <Button type="submit" disabled={updateTimetableMutation.isPending}>
                  {updateTimetableMutation.isPending ? "Saving..." : "Save"}
                </Button>
                <Button type="button" variant="outline" onClick={handleSlotClear}>
                  Clear Slot
                </Button>
                <Button type="button" variant="ghost" onClick={() => setEditModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
