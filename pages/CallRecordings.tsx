
import { useState } from "react";
import { useCallRecordingsOptimized, CallRecording } from "@/hooks/useCallRecordingsOptimized";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, FileText, Calendar, Phone, Clock } from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { startOfDay } from "date-fns";

/**
 * Call Recordings Page
 * Compact list view. Click a row to open a popup with audio + transcript.
 */
export default function CallRecordings() {
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfDay(new Date()),
        to: new Date()
    });
    const { recordings, loading, error } = useCallRecordingsOptimized(50, dateRange);
    const [selectedRecording, setSelectedRecording] = useState<CallRecording | null>(null);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <p className="text-muted-foreground">Loading recordings...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center p-8 text-destructive">
                Error loading recordings: {error}
            </div>
        );
    }

    const formatDuration = (seconds: number | null) => {
        if (!seconds) return "—";
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Call Recordings</h1>
                    <p className="text-muted-foreground">
                        {recordings.length} recordings found
                        {dateRange?.from && " (Filtered)"}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <DatePickerWithRange date={dateRange} setDate={setDateRange} />
                </div>
            </div>

            {/* Compact list */}
            <Card>
                <CardContent className="p-0">
                    <div className="divide-y divide-border">
                        {recordings.map((recording) => (
                            <button
                                key={recording.id}
                                onClick={() => setSelectedRecording(recording)}
                                className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-muted/50 transition-colors cursor-pointer"
                            >
                                <div className="flex-shrink-0 p-2 rounded-full bg-primary/10">
                                    <Phone className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">
                                        {recording.phone_number || <span className="text-muted-foreground italic">Unknown Number</span>}
                                    </p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(recording.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5" />
                                        {formatDuration(recording.duration_seconds)}
                                    </span>
                                    <Play className="h-4 w-4 text-primary" />
                                </div>
                            </button>
                        ))}

                        {recordings.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                No recordings found.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Popup Dialog */}
            <Dialog open={!!selectedRecording} onOpenChange={(open) => { if (!open) setSelectedRecording(null); }}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Phone className="h-5 w-5 text-primary" />
                            {selectedRecording?.phone_number || "Unknown Number"}
                        </DialogTitle>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
                            <Calendar className="h-3 w-3" />
                            {selectedRecording && new Date(selectedRecording.created_at).toLocaleString()}
                            {selectedRecording?.duration_seconds && (
                                <span className="ml-3 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDuration(selectedRecording.duration_seconds)}
                                </span>
                            )}
                        </p>
                    </DialogHeader>

                    {/* Audio Player */}
                    <div className="py-2">
                        <audio controls src={selectedRecording?.recording_url} className="w-full" key={selectedRecording?.id}>
                            Your browser does not support the audio element.
                        </audio>
                    </div>

                    {/* Transcript */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            Transcript
                        </div>
                        <ScrollArea className="max-h-[250px] w-full rounded-md border p-3 text-sm bg-muted/50">
                            {selectedRecording?.recording_transcript ? (
                                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                    {selectedRecording.recording_transcript}
                                </p>
                            ) : (
                                <p className="text-muted-foreground italic text-xs">
                                    No transcript available for this recording.
                                </p>
                            )}
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
