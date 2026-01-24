
import { useState } from "react";
import { useCallRecordingsOptimized } from "@/hooks/useCallRecordingsOptimized";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, FileText, User, Calendar, Phone } from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";

import { startOfDay } from "date-fns";

/**
 * Call Recordings Page
 * Displays a list of recent call recordings with transcripts and playback.
 */
export default function CallRecordings() {
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfDay(new Date()),
        to: new Date()
    });
    const { recordings, loading, error } = useCallRecordingsOptimized(50, dateRange);

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
                    {dateRange && (
                        <Button variant="ghost" onClick={() => setDateRange(undefined)}>
                            Clear
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recordings.map((recording) => (
                    <Card key={recording.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        {recording.phone_number ? (
                                            <span>{recording.phone_number}</span>
                                        ) : (
                                            <span className="text-muted-foreground italic">Unknown Number</span>
                                        )}
                                    </CardTitle>
                                </div>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full">
                                            <Play className="h-4 w-4" />
                                            <span className="sr-only">Play Recording</span>
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>Playback Recording</DialogTitle>
                                        </DialogHeader>
                                        <div className="py-6 flex justify-center">
                                            <audio controls src={recording.recording_url} className="w-full">
                                                Your browser does not support the audio element.
                                            </audio>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <CardDescription className="flex items-center gap-2 text-xs">
                                <Calendar className="h-3 w-3" />
                                {new Date(recording.created_at).toLocaleString()}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                    <FileText className="h-4 w-4" />
                                    Transcript
                                </div>
                                <ScrollArea className="h-[100px] w-full rounded-md border p-3 text-sm bg-muted/50">
                                    {recording.recording_transcript ? (
                                        <p className="text-muted-foreground leading-relaxed">
                                            {recording.recording_transcript}
                                        </p>
                                    ) : (
                                        <p className="text-muted-foreground italic text-xs">
                                            No transcript available for this recording.
                                        </p>
                                    )}
                                </ScrollArea>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {recordings.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                        No recordings found.
                    </div>
                )}
            </div>
        </div>
    );
}
