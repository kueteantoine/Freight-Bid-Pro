"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { driverService } from "@/lib/services/driver-service";
import { DriverAvailability } from "@/lib/types/database";

const DAYS = [
    { id: 1, name: "Monday" },
    { id: 2, name: "Tuesday" },
    { id: 3, name: "Wednesday" },
    { id: 4, name: "Thursday" },
    { id: 5, name: "Friday" },
    { id: 6, name: "Saturday" },
    { id: 0, name: "Sunday" },
];

const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? "00" : "30";
    const time = `${hour.toString().padStart(2, "0")}:${minute}`;
    return time;
});

interface DaySchedule {
    day_of_week: number;
    enabled: boolean;
    start_time: string;
    end_time: string;
}

export function ScheduleCalendar() {
    const [schedule, setSchedule] = useState<DaySchedule[]>(
        DAYS.map((d) => ({
            day_of_week: d.id,
            enabled: false,
            start_time: "09:00",
            end_time: "17:00",
        }))
    );
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSchedule();
    }, []);

    const loadSchedule = async () => {
        try {
            const data = await driverService.getDriverSchedule();
            if (data && data.length > 0) {
                const newSchedule = [...schedule];
                data.forEach((item) => {
                    const index = newSchedule.findIndex((s) => s.day_of_week === item.day_of_week);
                    if (index !== -1) {
                        newSchedule[index] = {
                            day_of_week: item.day_of_week!,
                            enabled: true,
                            start_time: item.start_time.slice(0, 5), // HH:MM
                            end_time: item.end_time.slice(0, 5),
                        };
                    }
                });
                setSchedule(newSchedule);
            }
        } catch (error) {
            console.error("Error loading schedule:", error);
            toast.error("Failed to load schedule");
        } finally {
            setLoading(false);
        }
    };

    const handleDayToggle = (dayIndex: number, enabled: boolean) => {
        const newSchedule = [...schedule];
        newSchedule[dayIndex].enabled = enabled;
        setSchedule(newSchedule);
    };

    const handleTimeChange = (dayIndex: number, field: "start_time" | "end_time", value: string) => {
        const newSchedule = [...schedule];
        newSchedule[dayIndex][field] = value;
        setSchedule(newSchedule);
    };

    const saveSchedule = async () => {
        try {
            setSaving(true);
            const activeSchedules = schedule
                .filter((s) => s.enabled)
                .map((s) => ({
                    day_of_week: s.day_of_week,
                    start_time: s.start_time,
                    end_time: s.end_time,
                    is_recurring: true,
                }));

            await driverService.updateDriverSchedule(activeSchedules);
            toast.success("Schedule updated successfully");
        } catch (error) {
            console.error("Error saving schedule:", error);
            toast.error("Failed to save schedule");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading schedule...</div>;

    return (
        <div className="space-y-6">
            <div className="rounded-md border p-4 space-y-4">
                <h3 className="font-medium">Weekly Recurring Schedule</h3>
                <div className="space-y-4">
                    {schedule.map((day, index) => (
                        <div key={day.day_of_week} className="flex items-center justify-between space-x-4 border-b pb-4 last:border-0 last:pb-0">
                            <div className="flex items-center space-x-4 w-32">
                                <Switch
                                    checked={day.enabled}
                                    onCheckedChange={(checked) => handleDayToggle(index, checked)}
                                />
                                <Label>{DAYS.find((d) => d.id === day.day_of_week)?.name}</Label>
                            </div>

                            {day.enabled ? (
                                <div className="flex items-center space-x-2">
                                    <Select
                                        value={day.start_time}
                                        onValueChange={(val) => handleTimeChange(index, "start_time", val)}
                                    >
                                        <SelectTrigger className="w-24">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TIME_SLOTS.map((time) => (
                                                <SelectItem key={`start-${time}`} value={time}>
                                                    {time}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <span>to</span>
                                    <Select
                                        value={day.end_time}
                                        onValueChange={(val) => handleTimeChange(index, "end_time", val)}
                                    >
                                        <SelectTrigger className="w-24">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TIME_SLOTS.map((time) => (
                                                <SelectItem key={`end-${time}`} value={time}>
                                                    {time}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground w-[216px] text-center">
                                    Unavailable
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <Button onClick={saveSchedule} disabled={saving} className="w-full">
                {saving ? "Saving Changes..." : "Save Schedule"}
            </Button>
        </div>
    );
}
