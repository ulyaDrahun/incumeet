import { AppLayout } from "@/components/layout/AppLayout";
import { CalendarView } from "@/components/calendar/CalendarView";
import { useFolders } from "@/contexts/FoldersContext";

export default function CalendarPage() {
  const { calendarNotes, addCalendarNote, addMeetingFromCalendar } = useFolders();

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-full mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Calendar</h1>
        <div className="bg-card rounded-xl border border-border shadow-card">
          <CalendarView
            notes={calendarNotes}
            onAddNote={addCalendarNote}
            onAddMeeting={addMeetingFromCalendar}
          />
        </div>
      </div>
    </AppLayout>
  );
}
